import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const pickAudioExt = (mimeType: string) => {
  const m = mimeType.toLowerCase();
  if (m.includes("mp4")) return "mp4";
  if (m.includes("wav")) return "wav";
  if (m.includes("mpeg") || m.includes("mp3")) return "mp3";
  if (m.includes("ogg")) return "ogg";
  return "webm";
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      audioBase64,
      audioMimeType,
      surahNumber,
      verseNumber,
      expectedText,
      qiraat,
    } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    console.log("Analyzing recitation", { surahNumber, verseNumber, qiraat });
    console.log("Audio provided:", !!audioBase64, "mime:", audioMimeType ?? null);

    const hasAudio = typeof audioBase64 === "string" && audioBase64.trim().length > 0;
    let transcribedText = "";
    let transcriptionOk = false;

    // 1) Transcription (Whisper)
    if (hasAudio) {
      console.log("Transcribing audio...");

      try {
        const base64Payload = audioBase64.includes(",")
          ? audioBase64.split(",")[1]
          : audioBase64;

        const bytes = Uint8Array.from(atob(base64Payload), (c) => c.charCodeAt(0));

        const mimeType = typeof audioMimeType === "string" && audioMimeType ? audioMimeType : "audio/webm";
        const ext = pickAudioExt(mimeType);

        const formData = new FormData();
        const audioBlob = new Blob([bytes], { type: mimeType });
        formData.append("file", audioBlob, `audio.${ext}`);
        formData.append("model", "whisper-1");
        formData.append("language", "ar");
        formData.append("prompt", `Récitation coranique en arabe. Texte attendu: ${expectedText}`);

        const whisperResponse = await fetch(
          "https://ai.gateway.lovable.dev/v1/audio/transcriptions",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${LOVABLE_API_KEY}`,
            },
            body: formData,
          },
        );

        if (!whisperResponse.ok) {
          // Surface quota/rate-limit cleanly
          if (whisperResponse.status === 429) {
            return new Response(
              JSON.stringify({ error: "Limite de requêtes atteinte. Réessayez dans quelques instants." }),
              { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
            );
          }
          if (whisperResponse.status === 402) {
            return new Response(
              JSON.stringify({ error: "Crédits épuisés. Veuillez recharger votre compte." }),
              { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
            );
          }

          const t = await whisperResponse.text();
          console.error("Whisper transcription failed:", whisperResponse.status, t);
        } else {
          const whisperResult = await whisperResponse.json();
          transcribedText = (whisperResult?.text ?? "").toString().trim();
          transcriptionOk = transcribedText.length > 0;
          console.log("Transcription length:", transcribedText.length);
        }
      } catch (e) {
        console.error("Whisper error:", e);
      }
    }

    // 2) Tajweed analysis (fast + structured)
    const transcriptionImpossible = hasAudio && !transcriptionOk;

    const systemPrompt = `Tu es un professeur de tajwīd TRÈS strict (lecture: ${qiraat}).\n\nRègles:\n- Si une transcription est fournie, compare-la au texte attendu et détecte les omissions/substitutions/inversions.\n- Si la transcription est vide, mets transcriptionImpossible=true et n'invente pas d'analyse audio (tu peux donner des points de travail basés sur le texte attendu).\n- Réponse courte, actionnable, sans flatterie.\n\nRetourne UNIQUEMENT un objet JSON (pas de markdown) avec EXACTEMENT ces champs:\n{\n  "isCorrect": boolean,\n  "overallScore": number,\n  "feedback": string,\n  "priorityFixes": string[],\n  "errors": [\n    {\n      "word": string,\n      "ruleType": string,\n      "ruleDescription": string,\n      "severity": "minor"|"major"|"critical",\n      "correction": string\n    }\n  ],\n  "textComparison": string\n}`;

    const userPrompt = `Sourate ${surahNumber}, verset ${verseNumber}.\nTexte attendu: "${expectedText}"\nTranscription: "${transcribedText}"\n\nConsigne:\n- Donne max 8 erreurs dans errors.\n- Donne exactement 3 éléments dans priorityFixes.\n- overallScore: 0-100, SEVERE. isCorrect=true seulement si score>=90 ET aucune erreur major/critical.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        temperature: 0.2,
        max_tokens: 850,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de requêtes atteinte. Réessayez dans quelques instants." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Crédits épuisés. Veuillez recharger votre compte." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;

    let analysis: any;
    try {
      analysis = JSON.parse(content);
    } catch (e) {
      console.error("Failed to parse AI response:", content);
      analysis = {
        isCorrect: false,
        overallScore: 0,
        feedback: "Erreur d'analyse. Veuillez réessayer.",
        priorityFixes: [],
        errors: [],
        textComparison: "",
      };
    }

    // Enrich + standardize
    analysis.audioAnalyzed = hasAudio;
    analysis.audioMimeType = hasAudio ? (audioMimeType ?? null) : null;
    analysis.transcribedText = transcriptionOk ? transcribedText : null;
    analysis.expectedText = expectedText;
    analysis.transcriptionImpossible = transcriptionImpossible;

    return new Response(JSON.stringify(analysis), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in analyze-recitation:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
        isCorrect: false,
        overallScore: 0,
        feedback: "Une erreur s'est produite lors de l'analyse.",
        priorityFixes: [],
        errors: [],
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
