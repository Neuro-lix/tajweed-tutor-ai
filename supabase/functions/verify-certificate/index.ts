import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    req.headers.get('cf-connecting-ip') ||
    'unknown';

  try {
    const { id } = await req.json().catch(() => ({ id: null }));
    const authHeader = req.headers.get('Authorization') || '';

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Try to identify caller (optional)
    let userId: string | null = null;
    if (authHeader.startsWith('Bearer ')) {
      const { data } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
      userId = data.user?.id ?? null;
    }
    const rateKey = userId ?? `ip:${ip}`;

    // Server-side rate limit: 10 verifications / minute per identity
    const { data: rl, error: rlErr } = await supabase.rpc('check_and_increment_rate_limit', {
      p_user_id: userId ?? '00000000-0000-0000-0000-000000000000',
      p_action: `verify_certificate:${rateKey}`,
      p_max: 10,
      p_window_seconds: 60,
    });
    if (rlErr) console.error('[verify-certificate] rate-limit RPC error', rlErr);
    if (rl && rl.allowed === false) {
      console.warn(`[verify-certificate] BLOCKED rate-limit ip=${ip} user=${userId ?? 'anon'} id=${id}`);
      return new Response(
        JSON.stringify({ error: 'rate_limited', retry_after: 60 }),
        { status: 429, headers: { ...corsHeaders, 'Retry-After': '60', 'Content-Type': 'application/json' } },
      );
    }

    if (!id || typeof id !== 'string' || !UUID_REGEX.test(id)) {
      console.warn(`[verify-certificate] REJECTED invalid-uuid ip=${ip} user=${userId ?? 'anon'} id=${String(id)}`);
      return new Response(JSON.stringify({ error: 'invalid_id' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: rows, error } = await supabase.rpc('verify_certificate', { p_id: id });
    if (error) {
      console.error('[verify-certificate] RPC error', error);
      return new Response(JSON.stringify({ error: 'lookup_failed' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const cert = Array.isArray(rows) ? rows[0] : null;
    if (!cert) {
      return new Response(JSON.stringify({ certificate: null }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    return new Response(JSON.stringify({ certificate: cert }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('[verify-certificate] unexpected', e);
    return new Response(JSON.stringify({ error: 'internal' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});