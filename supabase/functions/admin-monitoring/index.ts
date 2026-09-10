import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

// ─── CORS: allowlist pilotée par env (pas de wildcard) ───────────────────
const DEFAULT_ALLOWED_ORIGINS = [
  'https://recite-perfectly-bot.lovable.app',
  'https://id-preview--dd06a156-64f5-407d-bf79-94ef3c169108.lovable.app',
  'https://tajweedtutorai.com',
  'https://www.tajweedtutorai.com',
  'http://localhost:8080',
  'http://localhost:5173',
];
const ENV_ALLOWED = (Deno.env.get('ALLOWED_ORIGINS') ?? '')
  .split(',').map((s) => s.trim()).filter(Boolean);
const ALLOWLIST = ENV_ALLOWED.length ? ENV_ALLOWED : DEFAULT_ALLOWED_ORIGINS;

function buildCors(req: Request): Record<string, string> {
  const origin = req.headers.get('Origin') ?? '';
  const ok = ALLOWLIST.includes(origin)
    || /^https:\/\/[a-z0-9-]+\.lovable\.app$/i.test(origin)
    || /^https:\/\/[a-z0-9-]+\.lovableproject\.com$/i.test(origin);
  return {
    'Access-Control-Allow-Origin': ok ? origin : ALLOWLIST[0],
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Vary': 'Origin',
  };
}

const json = (body: unknown, status: number, cors: Record<string, string>) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  });

Deno.serve(async (req) => {
  const cors = buildCors(req);
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) return json({ error: 'Unauthorized' }, 401, cors);

    const anon = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
    );
    const { data: { user }, error: authErr } = await anon.auth.getUser(
      authHeader.replace('Bearer ', ''),
    );
    if (authErr || !user) return json({ error: 'Unauthorized' }, 401, cors);

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Le rôle est vérifié côté serveur : jamais depuis le client.
    const { data: isAdmin } = await admin.rpc('has_role', {
      _user_id: user.id,
      _role: 'admin',
    });
    if (!isAdmin) return json({ error: 'Forbidden' }, 403, cors);

    const scope = new URL(req.url).searchParams.get('scope') ?? 'all';

    const result: Record<string, unknown> = {};

    if (scope === 'all' || scope === 'payments') {
      const { data: tx } = await admin
        .from('credit_transactions')
        .select('id, user_id, amount, type, description, created_at')
        .eq('type', 'purchase')
        .order('created_at', { ascending: false })
        .limit(500);

      const { data: events } = await admin
        .from('processed_payment_events')
        .select('provider, external_id, created_at')
        .order('created_at', { ascending: false })
        .limit(500);

      const userIds = [...new Set((tx ?? []).map((t) => t.user_id))];
      const { data: profiles } = userIds.length
        ? await admin.from('profiles').select('user_id, full_name').in('user_id', userIds)
        : { data: [] as { user_id: string; full_name: string | null }[] };
      const nameById = new Map((profiles ?? []).map((p) => [p.user_id, p.full_name]));

      result.payments = (tx ?? []).map((t) => {
        const desc = (t.description ?? '').toLowerCase();
        const provider = desc.includes('crypto')
          ? 'crypto'
          : desc.includes('paddle')
            ? 'paddle'
            : 'autre';
        return {
          id: t.id,
          userId: t.user_id,
          userName: nameById.get(t.user_id) ?? null,
          credits: Number(t.amount),
          description: t.description,
          provider,
          status: 'credité',
          createdAt: t.created_at,
        };
      });
      result.webhookEvents = events ?? [];
    }

    if (scope === 'all' || scope === 'analyses') {
      const { data: usage } = await admin
        .from('llm_usage')
        .select('id, user_id, function_name, model, operation, status, credits_charged, total_tokens, created_at')
        .order('created_at', { ascending: false })
        .limit(500);

      const usageUserIds = [...new Set((usage ?? []).map((u) => u.user_id))];
      const { data: usageProfiles } = usageUserIds.length
        ? await admin.from('profiles').select('user_id, full_name').in('user_id', usageUserIds)
        : { data: [] as { user_id: string; full_name: string | null }[] };
      const usageNameById = new Map((usageProfiles ?? []).map((p) => [p.user_id, p.full_name]));

      result.analyses = (usage ?? []).map((u) => ({
        id: u.id,
        userId: u.user_id,
        userName: usageNameById.get(u.user_id) ?? null,
        functionName: u.function_name,
        model: u.model,
        operation: u.operation,
        status: u.status,
        credits: Number(u.credits_charged),
        totalTokens: u.total_tokens,
        createdAt: u.created_at,
        link: `/admin?analysis=${u.id}`,
      }));
    }

    if (scope === 'all' || scope === 'emails') {
      const { data: emails } = await admin
        .from('email_events')
        .select('id, email, email_type, status, error_message, created_at')
        .order('created_at', { ascending: false })
        .limit(500);
      result.emails = emails ?? [];
    }

    return json(result, 200, cors);
  } catch (e) {
    console.error('admin-monitoring error', e);
    return json({ error: 'Internal error' }, 500, cors);
  }
});
