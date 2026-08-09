import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { encode as base64Encode } from 'https://deno.land/std@0.168.0/encoding/base64.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

type RateLimitResult = { allowed: boolean; count: number; limit: number; reset_at: string };

// ─── CORS: env-driven allowlist (no wildcard) ───────────────────────────
const DEFAULT_ALLOWED_ORIGINS = [
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
    'Vary': 'Origin',
  };
}

serve(async (req) => {
  const corsHeaders = buildCors(req);
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // ── AuthN: require a valid Supabase JWT
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
    );
    const { data: { user }, error: authErr } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const userId = user.id;

    // Per-user rate limit: 30 TTS requests / hour
    const sbAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );
    const { data: rl } = await sbAdmin.rpc('check_and_increment_rate_limit', {
      p_user_id: userId, p_action: 'text-to-speech', p_max: 30, p_window_seconds: 3600,
    });
    if (rl && (rl as RateLimitResult).allowed === false) {
      const resetAt = (rl as RateLimitResult).reset_at;
      const retryAfter = Math.max(1, Math.ceil((new Date(resetAt).getTime() - Date.now()) / 1000));
      return new Response(JSON.stringify({ error: 'Rate limit exceeded', retry_after: retryAfter }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Retry-After': String(retryAfter) },
      });
    }

    const { text, language = 'fr', speed } = await req.json();
    // Clamp playback speed (OpenAI TTS accepts 0.25–4.0); used for slow-motion coaching.
    const ttsSpeed = typeof speed === 'number' && isFinite(speed)
      ? Math.min(2, Math.max(0.5, speed))
      : 1;

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return new Response(JSON.stringify({ error: 'Text is required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (text.length > 2000) {
      return new Response(JSON.stringify({ error: 'Text too long' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('[text-to-speech] Missing LOVABLE_API_KEY');
      return new Response(JSON.stringify({ error: 'Service temporarily unavailable' }), {
        status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Use OpenAI TTS via Lovable AI Gateway
    const response = await fetch('https://ai.gateway.lovable.dev/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'openai/gpt-4o-mini-tts',
        input: text,
        voice: language === 'ar' ? 'nova' : 'alloy', // nova for Arabic-friendly, alloy for others
        response_format: 'mp3',
        speed: ttsSpeed,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[text-to-speech] Upstream error:', response.status, errorText);
      const status = response.status === 429 ? 429 : 502;
      return new Response(JSON.stringify({ error: status === 429 ? 'Rate limit exceeded' : 'Speech service error' }), {
        status, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const audioBuffer = await response.arrayBuffer();
    const base64Audio = base64Encode(audioBuffer);

    // ── Log LLM usage (best-effort; TTS has no token counts) ──
    try {
      await sbAdmin.from('llm_usage').insert({
        user_id: userId,
        function_name: 'text-to-speech',
        model: 'openai/gpt-4o-mini-tts',
        operation: 'tts',
        prompt_tokens: 0,
        completion_tokens: 0,
        total_tokens: 0,
        credits_charged: 0,
        status: 'success',
      });
    } catch (logErr) {
      console.error('[text-to-speech] llm_usage log failed:', logErr);
    }

    return new Response(
      JSON.stringify({ audioContent: base64Audio }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('[text-to-speech] Fatal:', error);
    return new Response(
      JSON.stringify({ error: 'An unexpected error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
