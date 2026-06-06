import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const LANGUAGE_INSTRUCTIONS: Record<string, string> = {
  fr: "Reponds toujours en francais.",
  ar: "أجب دائماً باللغة العربية الفصحى.",
  en: "Always respond in English.",
  hi: "हमेशा हिंदी में जवाब दें।",
  ur: "ہمیشہ اردو میں جواب دیں۔",
  tr: "Her zaman Turkce cevap verin.",
  id: "Selalu jawab dalam Bahasa Indonesia.",
  ms: "Sentiasa jawab dalam Bahasa Melayu.",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // ── AuthN: require a valid Supabase JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const sb = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
    );
    const { data: { user }, error: authErr } = await sb.auth.getUser(
      authHeader.replace("Bearer ", "")
    );
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = user.id;

    // Per-user rate limit: 60 messages / hour
    const sbAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const { data: rl } = await sbAdmin.rpc("check_and_increment_rate_limit", {
      p_user_id: userId, p_action: "chat-assistant", p_max: 60, p_window_seconds: 3600,
    });
    if (rl && (rl as any).allowed === false) {
      const resetAt = (rl as any).reset_at;
      const retryAfter = Math.max(1, Math.ceil((new Date(resetAt).getTime() - Date.now()) / 1000));
      return new Response(JSON.stringify({ error: "Rate limit exceeded", retry_after: retryAfter }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json", "Retry-After": String(retryAfter) },
      });
    }

    const { messages, language = "fr" } = await req.json();
    if (!Array.isArray(messages) || messages.length === 0 || messages.length > 50) {
      return new Response(JSON.stringify({ error: "Invalid messages" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    // Sanitize: force role/string shape and clamp content length to mitigate prompt injection / oversized payloads
    const sanitized = (messages as any[])
      .filter((m) => m && typeof m.content === "string")
      .map((m) => ({
        role: m.role === "assistant" ? "assistant" : "user",
        content: String(m.content).slice(0, 2000),
      }));
    if (sanitized.length === 0) {
      return new Response(JSON.stringify({ error: "Invalid messages" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("[chat-assistant] Missing LOVABLE_API_KEY");
      return new Response(JSON.stringify({ response: "Service temporairement indisponible." }), {
        status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const languageInstruction = LANGUAGE_INSTRUCTIONS[language] || LANGUAGE_INSTRUCTIONS["en"];

    const systemPrompt = `Tu es un assistant bienveillant specialise dans l'apprentissage du Coran et du tajwid.

${languageInstruction}

Tu dois :
- Repondre aux questions sur les regles de tajwid (makharij, sifat, madd, ghunna, qalqala, etc.)
- Expliquer les concepts islamiques lies a la recitation
- Encourager l'apprenant avec bienveillance
- Utiliser la terminologie arabe appropriee avec translitteration
- Rester fidele aux enseignements traditionnels du tajwid

Tu ne dois JAMAIS :
- Pretendre avoir des capacites d'ecoute audio
- Donner des fatawa (avis juridiques religieux)
- Remplacer un professeur qualifie ou delivrer des ijazah

Sois concis mais informatif.`;

    // Build conversation for Lovable AI Gateway (OpenAI-compatible)
    const messages = [
      { role: "system", content: systemPrompt },
      ...sanitized.map((m) => ({
        role: m.role === "assistant" ? "assistant" : "user",
        content: m.content,
      })),
    ];

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          temperature: 0.7,
          max_tokens: 1000,
          messages,
        }),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error("[chat-assistant] Upstream error:", response.status, errText);
      if (response.status === 429) {
        return new Response(JSON.stringify({ response: "Trop de demandes. Reessaie dans un instant." }), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ response: "Une erreur est survenue, réessaie." }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content ?? "Desole, je n'ai pas pu repondre.";

    return new Response(JSON.stringify({ response: content }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("[chat-assistant] Fatal:", error);
    return new Response(JSON.stringify({
      response: "Desole, une erreur est survenue. Reessaie dans un instant.",
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
