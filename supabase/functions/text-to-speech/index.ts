import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { encode as base64Encode } from 'https://deno.land/std@0.168.0/encoding/base64.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
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
    const { data: claims, error: authErr } = await supabase.auth.getClaims(
      authHeader.replace('Bearer ', '')
    );
    if (authErr || !claims?.claims?.sub) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const userId = claims.claims.sub as string;

    // Per-user rate limit: 30 TTS requests / hour
    const sbAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );
    const { data: rl } = await sbAdmin.rpc('check_and_increment_rate_limit', {
      p_user_id: userId, p_action: 'text-to-speech', p_max: 30, p_window_seconds: 3600,
    });
    if (rl && (rl as any).allowed === false) {
      const resetAt = (rl as any).reset_at;
      const retryAfter = Math.max(1, Math.ceil((new Date(resetAt).getTime() - Date.now()) / 1000));
      return new Response(JSON.stringify({ error: 'Rate limit exceeded', retry_after: retryAfter }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Retry-After': String(retryAfter) },
      });
    }

    const { text, language = 'fr' } = await req.json();

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
        model: 'tts-1',
        input: text,
        voice: language === 'ar' ? 'nova' : 'alloy', // nova for Arabic-friendly, alloy for others
        response_format: 'mp3',
        speed: 0.9, // Slightly slower for clarity
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
