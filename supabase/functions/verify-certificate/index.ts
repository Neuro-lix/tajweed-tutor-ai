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

  // Correlation id surfaced to client + included in every log line for this request.
  const requestId = crypto.randomUUID();
  const baseHeaders = { ...corsHeaders, 'Content-Type': 'application/json', 'X-Request-Id': requestId };

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
      console.warn(`[verify-certificate] req=${requestId} BLOCKED rate-limit ip=${ip} user=${userId ?? 'anon'} id=${id}`);
      return new Response(
        JSON.stringify({ error: 'rate_limited', retry_after: 60, request_id: requestId }),
        { status: 429, headers: { ...baseHeaders, 'Retry-After': '60' } },
      );
    }

    if (!id || typeof id !== 'string' || !UUID_REGEX.test(id)) {
      console.warn(`[verify-certificate] req=${requestId} REJECTED invalid-uuid ip=${ip} user=${userId ?? 'anon'} id=${String(id)}`);
      return new Response(JSON.stringify({ error: 'invalid_id', request_id: requestId }), {
        status: 400,
        headers: baseHeaders,
      });
    }

    const { data: rows, error } = await supabase.rpc('verify_certificate', { p_id: id });
    if (error) {
      console.error(`[verify-certificate] req=${requestId} RPC error`, error);
      return new Response(JSON.stringify({ error: 'lookup_failed', request_id: requestId }), {
        status: 500,
        headers: baseHeaders,
      });
    }
    const cert = Array.isArray(rows) ? rows[0] : null;
    if (!cert) {
      return new Response(JSON.stringify({ certificate: null, request_id: requestId }), {
        status: 404,
        headers: baseHeaders,
      });
    }
    return new Response(JSON.stringify({ certificate: cert, request_id: requestId }), {
      status: 200,
      headers: baseHeaders,
    });
  } catch (e) {
    console.error(`[verify-certificate] req=${requestId} unexpected`, e);
    return new Response(JSON.stringify({ error: 'internal', request_id: requestId }), {
      status: 500,
      headers: baseHeaders,
    });
  }
});