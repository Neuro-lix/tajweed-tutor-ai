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

    console.log("[analyze-recitation] Request received:", { 
      surahNumber, 
      verseNumber, 
      qiraat,
      hasAudio: !!audioBase64,
      audioLength: audioBase64?.length || 0,
      mimeType: audioMimeType 
    });

    const hasAudio = typeof audioBase64 === "string" && audioBase64.trim().length > 100;
    let transcribedText = "";
    let transcriptionOk = false;
    let whisperError: string | null = null;

    // 1) Transcription (Whisper)
    if (hasAudio) {
      console.log("[analyze-recitation] Starting Whisper transcription...");

      try {
        // Clean base64 - remove any data URL prefix
        const base64Payload = audioBase64.includes(",")
          ? audioBase64.split(",")[1]
          : audioBase64;

        console.log("[analyze-recitation] Base64 payload length:", base64Payload.length);

        const bytes = Uint8Array.from(atob(base64Payload), (c) => c.charCodeAt(0));
        console.log("[analyze-recitation] Audio bytes length:", bytes.length);

        const mimeType = typeof audioMimeType === "string" && audioMimeType ? audioMimeType : "audio/webm";
        const ext = pickAudioExt(mimeType);

        console.log("[analyze-recitation] Creating blob with mime:", mimeType, "ext:", ext);

        const formData = new FormData();
        const audioBlob = new Blob([bytes], { type: mimeType });
        formData.append("file", audioBlob, `recording.${ext}`);
        formData.append("model", "whisper-1");
        formData.append("language", "ar");
        formData.append("prompt", `Récitation coranique du Coran en arabe classique. Sourate ${surahNumber}, verset ${verseNumber}. Texte attendu: ${expectedText}`);

        console.log("[analyze-recitation] Sending to Whisper API...");

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

        console.log("[analyze-recitation] Whisper response status:", whisperResponse.status);

        if (!whisperResponse.ok) {
          const errorText = await whisperResponse.text();
          console.error("[analyze-recitation] Whisper error:", whisperResponse.status, errorText);
          
          if (whisperResponse.status === 429) {
            whisperError = "Limite de requêtes atteinte";
          } else if (whisperResponse.status === 402) {
            whisperError = "Crédits épuisés";
          } else {
            whisperError = `Erreur Whisper: ${whisperResponse.status}`;
          }
        } else {
          const whisperResult = await whisperResponse.json();
          transcribedText = (whisperResult?.text ?? "").toString().trim();
          transcriptionOk = transcribedText.length > 0;
          console.log("[analyze-recitation] Transcription result:", transcribedText.substring(0, 100), "...");
        }
      } catch (e) {
        console.error("[analyze-recitation] Whisper exception:", e);
        whisperError = e instanceof Error ? e.message : "Erreur de transcription";
      }
    }

    // 2) Tajweed analysis
    const transcriptionImpossible = hasAudio && !transcriptionOk;

    console.log("[analyze-recitation] Analysis params:", {
      hasAudio,
      transcriptionOk,
      transcriptionImpossible,
      transcribedTextLength: transcribedText.length,
      whisperError
    });

    const systemPrompt = `Tu es un professeur de tajwīd TRÈS strict (lecture: ${qiraat}).

RÈGLES CRITIQUES:
- Si transcribedText est fourni et non vide, compare-le au texte attendu et détecte les erreurs.
- Si transcribedText est vide mais qu'il y a de l'audio, c'est une erreur technique - NE PAS inventer d'analyse.
- Sois précis sur les makhārij (points d'articulation) et ṣifāt (caractéristiques).
- Note sévèrement: 90+ = excellent, 70-89 = bien, 50-69 = moyen, <50 = à revoir.

Retourne UNIQUEMENT un JSON valide (sans markdown):
{
  "isCorrect": boolean,
  "overallScore": number,
  "feedback": string,
  "encouragement": string,
  "priorityFixes": string[],
  "errors": [
    {
      "word": string,
      "ruleType": string,
      "ruleDescription": string,
      "severity": "minor"|"major"|"critical",
      "correction": string
    }
  ],
  "textComparison": string
}`;

    const userPrompt = `Sourate ${surahNumber}, verset ${verseNumber}.
Texte attendu: "${expectedText}"
Transcription: "${transcribedText || "(vide - audio non transcrit)"}"
${whisperError ? `Erreur technique: ${whisperError}` : ""}

Consignes:
- Max 8 erreurs dans errors.
- Exactement 3 éléments dans priorityFixes.
- Score 0-100, sévère. isCorrect=true seulement si score>=90 ET aucune erreur major/critical.
- Si transcription vide: score=0, feedback="La transcription est vide. Veuillez réenregistrer."`;

    console.log("[analyze-recitation] Sending to Gemini...");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        temperature: 0.2,
        max_tokens: 1000,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
      }),
    });

    console.log("[analyze-recitation] Gemini response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[analyze-recitation] Gemini error:", response.status, errorText);
      
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
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;

    console.log("[analyze-recitation] AI response content:", content?.substring(0, 200));

    let analysis: any;
    try {
      analysis = JSON.parse(content);
    } catch (e) {
      console.error("[analyze-recitation] JSON parse error:", e);
      analysis = {
        isCorrect: false,
        overallScore: 0,
        feedback: "Erreur d'analyse. Veuillez réessayer.",
        encouragement: "Ne vous découragez pas, réessayez!",
        priorityFixes: [],
        errors: [],
        textComparison: "",
      };
    }

    // Enrich response
    analysis.audioAnalyzed = hasAudio;
    analysis.audioMimeType = hasAudio ? (audioMimeType ?? null) : null;
    analysis.transcribedText = transcriptionOk ? transcribedText : null;
    analysis.expectedText = expectedText;
    analysis.transcriptionImpossible = transcriptionImpossible;
    analysis.whisperError = whisperError;

    console.log("[analyze-recitation] Final response:", {
      isCorrect: analysis.isCorrect,
      score: analysis.overallScore,
      hasTranscription: !!analysis.transcribedText,
      errorsCount: analysis.errors?.length || 0
    });

    return new Response(JSON.stringify(analysis), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[analyze-recitation] Fatal error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
        isCorrect: false,
        overallScore: 0,
        feedback: "Une erreur s'est produite lors de l'analyse.",
        encouragement: "Veuillez réessayer.",
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
