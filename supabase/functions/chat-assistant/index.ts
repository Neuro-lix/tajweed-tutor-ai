import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const LANGUAGE_INSTRUCTIONS: Record<string, string> = {
  fr: "Réponds toujours en français.",
  ar: "أجب دائمًا باللغة العربية الفصحى.",
  en: "Always respond in English.",
  hi: "हमेशा हिंदी में जवाब दें।",
  ur: "ہمیشہ اردو میں جواب دیں۔",
  bn: "সর্বদা বাংলায় উত্তর দিন।",
  tr: "Her zaman Türkçe cevap verin.",
  fa: "همیشه به فارسی پاسخ دهید.",
  tl: "Laging sumagot sa Filipino.",
  id: "Selalu jawab dalam Bahasa Indonesia.",
  ms: "Sentiasa jawab dalam Bahasa Melayu.",
  sw: "Jibu kila wakati kwa Kiswahili.",
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, language = 'fr' } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const languageInstruction = LANGUAGE_INSTRUCTIONS[language] || LANGUAGE_INSTRUCTIONS.en;

    const systemPrompt = `Tu es un assistant bienveillant spécialisé dans l'apprentissage du Coran et du tajwīd.

${languageInstruction}

Tu dois :
- Répondre aux questions sur les règles de tajwīd (makhārij, ṣifāt, madd, ghunna, qalqala, etc.)
- Expliquer les concepts islamiques liés à la récitation
- Encourager l'apprenant avec bienveillance
- Utiliser la terminologie arabe appropriée avec translittération
- Rester fidèle aux enseignements traditionnels du tajwīd

Tu ne dois JAMAIS :
- Prétendre avoir des capacités d'écoute audio
- Donner des fatawa (avis juridiques religieux)
- Remplacer un professeur qualifié ou délivrer des ijazah

Quand on te pose des questions sur le Coran, utilise toujours le texte arabe original avec diacritiques quand c'est pertinent.

Sois concis mais informatif. Utilise des émojis modérément pour rendre la conversation agréable.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ 
          error: "Limite de requêtes atteinte.",
          response: "Désolé, trop de demandes. Réessaie dans un moment." 
        }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ 
          error: "Crédits épuisés.",
          response: "Service temporairement indisponible." 
        }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;

    return new Response(JSON.stringify({ response: content }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Chat assistant error:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Unknown error",
      response: "Une erreur s'est produite. Réessaie."
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
