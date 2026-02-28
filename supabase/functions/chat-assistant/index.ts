import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
    const { messages, language = "fr" } = await req.json();

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is not configured");

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

    // Build Gemini conversation from messages array
    const geminiContents = messages.map((m: any) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

    // Add system as first user turn if needed
    const contents = [
      { role: "user", parts: [{ text: systemPrompt + "\n\nDis bonjour et presente-toi brievement." }] },
      { role: "model", parts: [{ text: "Assalamu alaykoum ! Je suis ton assistant Tajweed Tutor AI. Comment puis-je t'aider ?" }] },
      ...geminiContents,
    ];

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents,
          generationConfig: { temperature: 0.7, maxOutputTokens: 1000 },
          systemInstruction: { parts: [{ text: systemPrompt }] },
        }),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error("Gemini chat error:", response.status, errText);
      if (response.status === 429) {
        return new Response(JSON.stringify({ response: "Trop de demandes. Reessaie dans un instant." }), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`Gemini error: ${response.status}`);
    }

    const data = await response.json();
    const content = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "Desole, je n'ai pas pu repondre.";

    return new Response(JSON.stringify({ response: content }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Chat assistant error:", error);
    return new Response(JSON.stringify({
      response: "Desole, une erreur est survenue. Reessaie dans un instant.",
      error: error instanceof Error ? error.message : "Unknown error",
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
