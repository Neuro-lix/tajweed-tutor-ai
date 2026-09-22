import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

// ─── CORS: allowlist pilotée par env (pas de wildcard) ───────────────────
const DEFAULT_ALLOWED_ORIGINS = [
  'https://tajweedtutorai.com',
  'https://www.tajweedtutorai.com',
  'https://recite-perfectly-bot.lovable.app',
  'https://id-preview--dd06a156-64f5-407d-bf79-94ef3c169108.lovable.app',
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
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin',
  };
}

const json = (body: unknown, status: number, cors: Record<string, string>) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  });

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ROLES = ['admin', 'moderator', 'user'] as const;

Deno.serve(async (req) => {
  const cors = buildCors(req);
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405, cors);

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

    // Rôle vérifié côté serveur uniquement.
    const { data: isAdmin } = await admin.rpc('has_role', { _user_id: user.id, _role: 'admin' });
    if (!isAdmin) return json({ error: 'Forbidden' }, 403, cors);

    const body = await req.json().catch(() => ({}));
    const action = String(body?.action ?? '');
    const targetId = body?.userId ? String(body.userId) : '';

    if (action !== 'list' && !UUID_RE.test(targetId)) {
      return json({ error: 'Identifiant utilisateur invalide' }, 400, cors);
    }
    // Un admin ne peut pas se retirer les droits ni se supprimer lui-même.
    if (targetId === user.id && action !== 'list' && action !== 'adjust_credits') {
      return json({ error: 'Action impossible sur votre propre compte' }, 400, cors);
    }

    switch (action) {
      case 'list': {
        const { data: authUsers, error: listErr } = await admin.auth.admin.listUsers({
          page: 1,
          perPage: 1000,
        });
        if (listErr) throw listErr;

        const ids = authUsers.users.map((u) => u.id);
        const [{ data: profiles }, { data: roles }, { data: credits }] = await Promise.all([
          admin.from('profiles').select('user_id, full_name').in('user_id', ids),
          admin.from('user_roles').select('user_id, role').in('user_id', ids),
          admin.from('user_credits').select('user_id, credits').in('user_id', ids),
        ]);
        const nameById = new Map((profiles ?? []).map((p) => [p.user_id, p.full_name]));
        const creditsById = new Map((credits ?? []).map((c) => [c.user_id, Number(c.credits)]));
        const rolesById = new Map<string, string[]>();
        for (const r of roles ?? []) {
          rolesById.set(r.user_id, [...(rolesById.get(r.user_id) ?? []), r.role as string]);
        }

        return json(
          {
            users: authUsers.users.map((u) => ({
              id: u.id,
              email: u.email ?? null,
              fullName: nameById.get(u.id) ?? null,
              roles: rolesById.get(u.id) ?? [],
              credits: creditsById.get(u.id) ?? 0,
              createdAt: u.created_at,
              lastSignInAt: u.last_sign_in_at ?? null,
              confirmed: Boolean(u.email_confirmed_at),
            })),
          },
          200,
          cors,
        );
      }

      case 'set_role':
      case 'remove_role': {
        const role = String(body?.role ?? '');
        if (!(ROLES as readonly string[]).includes(role)) {
          return json({ error: 'Rôle invalide' }, 400, cors);
        }
        if (action === 'set_role') {
          const { error } = await admin
            .from('user_roles')
            .upsert({ user_id: targetId, role }, { onConflict: 'user_id,role' });
          if (error) throw error;
        } else {
          const { error } = await admin
            .from('user_roles')
            .delete()
            .eq('user_id', targetId)
            .eq('role', role);
          if (error) throw error;
        }
        return json({ ok: true }, 200, cors);
      }

      case 'adjust_credits': {
        const amount = Number(body?.amount);
        if (!Number.isFinite(amount) || amount === 0 || Math.abs(amount) > 10000) {
          return json({ error: 'Montant invalide' }, 400, cors);
        }
        const { data, error } = await admin.rpc('add_credits', {
          p_user_id: targetId,
          p_amount: amount,
          p_description: `Ajustement admin (${amount > 0 ? '+' : ''}${amount})`,
        });
        if (error) throw error;
        return json({ ok: true, balance: data }, 200, cors);
      }

      case 'delete_user': {
        const { error } = await admin.auth.admin.deleteUser(targetId);
        if (error) throw error;
        return json({ ok: true }, 200, cors);
      }

      default:
        return json({ error: 'Action inconnue' }, 400, cors);
    }
  } catch (e) {
    console.error('admin-users error', e);
    return json({ error: 'Internal error' }, 500, cors);
  }
});
