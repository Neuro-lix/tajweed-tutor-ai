import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const DEFAULT_ALLOWED_ORIGINS = [
  'https://tajweedtutorai.com',
  'https://www.tajweedtutorai.com',
  'https://recite-perfectly-bot.lovable.app',
  'http://localhost',
  'https://localhost',
  'capacitor://localhost',
  'http://localhost:8080',
];
const ENV_ALLOWED = (Deno.env.get('ALLOWED_ORIGINS') ?? '').split(',').map((s) => s.trim()).filter(Boolean);
const ALLOWLIST = [...new Set([...DEFAULT_ALLOWED_ORIGINS, ...ENV_ALLOWED])];

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

// Personal data deleted. Payment records (credit_transactions, crypto_orders) are kept for legal accounting.
const TABLES = [
  'corrections', 'hifz_goals', 'ijaza_requests', 'leaderboard', 'llm_usage', 'rate_limits',
  'recitation_sessions', 'review_queue', 'surah_progress', 'user_achievements', 'user_certificates',
  'user_credits', 'user_feedback', 'user_ijaza_certificates', 'user_levels', 'user_progress',
  'user_recitations', 'user_roles', 'user_streaks', 'contact_messages', 'profiles',
];

Deno.serve(async (req) => {
  const cors = buildCors(req);
  const json = (b: unknown, s = 200) =>
    new Response(JSON.stringify(b), { status: s, headers: { ...cors, 'Content-Type': 'application/json' } });
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors });
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);

  const url = Deno.env.get('SUPABASE_URL')!;
  const token = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '');
  if (!token) return json({ error: 'unauthorized' }, 401);
  const admin = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const { data: u, error: ue } = await admin.auth.getUser(token);
  if (ue || !u?.user) return json({ error: 'unauthorized' }, 401);
  const uid = u.user.id;

  for (const t of TABLES) {
    const { error } = await admin.from(t).delete().eq('user_id', uid);
    if (error) console.warn(`[delete-account] ${t}:`, error.message);
  }
  const { error: de } = await admin.auth.admin.deleteUser(uid);
  if (de) {
    console.error('[delete-account] deleteUser', de.message);
    return json({ error: 'delete_failed' }, 500);
  }
  return json({ deleted: true });
});
