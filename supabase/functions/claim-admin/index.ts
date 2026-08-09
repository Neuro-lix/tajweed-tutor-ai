import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

// ─── CORS: env-driven allowlist (no wildcard) ───────────────────────────
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

serve(async (req) => {
  const corsHeaders = buildCors(req);
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) return json({ error: 'Unauthorized' }, 401, corsHeaders);

    const anon = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
    );
    const { data: { user }, error: authErr } = await anon.auth.getUser(
      authHeader.replace('Bearer ', ''),
    );
    if (authErr || !user) return json({ error: 'Unauthorized' }, 401, corsHeaders);

    const body = await req.json().catch(() => ({}));
    const password = typeof body?.password === 'string' ? body.password : '';
    if (!password || password.length > 200) return json({ granted: false }, 200, corsHeaders);

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Per-user brute-force bound: 5 attempts / hour
    const { data: rl } = await admin.rpc('check_and_increment_rate_limit', {
      p_user_id: user.id,
      p_action: 'claim_admin_access',
      p_max: 5,
      p_window_seconds: 3600,
    });
    if (rl && rl.allowed === false) {
      return json({ error: 'rate_limited' }, 429, corsHeaders);
    }

    // The verification logic lives in `private.claim_admin_access`, but PostgREST
    // only exposes the `public` schema — we call the service-role-only wrapper.
    const { data, error } = await admin.rpc('claim_admin_access', {
      _user_id: user.id,
      _password: password,
    });

    if (error) {
      console.error('claim-admin rpc error', error.message);
      return json({ error: 'verification_failed' }, 500, corsHeaders);
    }

    return json({ granted: data === true }, 200, corsHeaders);
  } catch (e) {
    console.error('claim-admin error', e instanceof Error ? e.message : 'unknown');
    return json({ error: 'verification_failed' }, 500, corsHeaders);
  }
});
