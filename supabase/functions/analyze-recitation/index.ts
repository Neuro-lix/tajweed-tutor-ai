import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { audioBase64, audioMimeType, surahNumber, verseNumber, expectedText, qiraat } = await req.json();

    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is not configured");

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is not configured");

    console.log("[analyze-recitation] Request:", { surahNumber, verseNumber, qiraat, hasAudio: !!audioBase64, mimeType: audioMimeType });

    const hasAudio = typeof audioBase64 === "string" && audioBase64.trim().length > 100;
    let transcribedText = "";
    let transcriptionOk = false;
    let whisperError: string | null = null;

    // 1) Transcription via OpenAI Whisper
    if (hasAudio) {
      console.log("[analyze-recitation] Starting Whisper transcription...");
      try {
        const base64Payload = audioBase64.includes(",") ? audioBase64.split(",")[1] : audioBase64;
        const binaryString = atob(base64Payload);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }

        const rawMime = (audioMimeType || "audio/wav").split(";")[0].trim();
        const ext = rawMime.includes("webm") ? "webm" : rawMime.includes("mp4") ? "mp4" : "wav";

        const formData = new FormData();
        formData.append("file", new Blob([bytes], { type: rawMime }), `audio.${ext}`);
        formData.append("model", "whisper-1");
        formData.append("language", "ar");
        formData.append("prompt", `بسم الله الرحمن الرحيم. سورة ${surahNumber} آية ${verseNumber}`);

        const whisperResponse = await fetch("https://api.openai.com/v1/audio/transcriptions", {
          method: "POST",
          headers: { "Authorization": `Bearer ${OPENAI_API_KEY}` },
          body: formData,
        });

        console.log("[analyze-recitation] Whisper status:", whisperResponse.status);

        if (!whisperResponse.ok) {
          const errorText = await whisperResponse.text();
          console.error("[analyze-recitation] Whisper error:", errorText);
          whisperError = whisperResponse.status === 429 ? "Limite de requêtes Whisper" : `Whisper error: ${whisperResponse.status}`;
        } else {
          const result = await whisperResponse.json();
          transcribedText = (result.text || "").trim();
          transcriptionOk = transcribedText.length >= 3;
          if (!transcriptionOk) {
            whisperError = "Transcription vide";
          }
          console.log("[analyze-recitation] Whisper result:", transcribedText.substring(0, 100));
        }
      } catch (e) {
        console.error("[analyze-recitation] Whisper exception:", e);
        whisperError = e instanceof Error ? e.message : "Erreur de transcription";
      }
    }

    // 2) Early return if transcription failed
    if (hasAudio && !transcriptionOk) {
      return new Response(JSON.stringify({
        isCorrect: false, overallScore: 0,
        feedback: whisperError || "La transcription est vide. Veuillez réenregistrer.",
        encouragement: "Réessaie en te rapprochant du micro et en parlant clairement.",
        priorityFixes: ["Réenregistre dans un endroit calme", "Rapproche le micro", "Réessaie avec un verset court"],
        errors: [], textComparison: "",
        audioAnalyzed: true, audioMimeType: audioMimeType ?? null,
        transcribedText: null, expectedText,
        transcriptionImpossible: true, whisperError,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // 3) Tajweed analysis via Gemini
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

    const systemPrompt = `Tu es Cheikh Al-Muqri', un maître de tajwīd extrêmement strict et expert en lecture ${qiraat}.

## TON RÔLE
Tu analyses la récitation coranique d'un étudiant en comparant la transcription de son audio au texte attendu du Coran.

## RÈGLES DE TAJWĪD À VÉRIFIER (par ordre de priorité)
### 1. MAKHĀRIJ (Points d'articulation) - CRITIQUE
### 2. ṢIFĀT (Caractéristiques des lettres) - MAJEUR
### 3. MADD (Prolongations) - MAJEUR
### 4. RÈGLES DE NOUN SAAKIN ET TANWIN - MAJEUR
### 5. AUTRES RÈGLES

## BARÈME DE NOTATION (très strict)
- 95-100: Parfait | 85-94: Très bien | 70-84: Bien | 50-69: Moyen | 30-49: Faible | 0-29: À revoir

## FORMAT DE RÉPONSE (JSON strict)
{
  "isCorrect": boolean,
  "overallScore": number (0-100),
  "feedback": string,
  "encouragement": string,
  "priorityFixes": [string, string, string],
  "errors": [{"word":"","ruleType":"","ruleDescription":"","severity":"minor|major|critical","correction":""}],
  "textComparison": "Analyse mot-à-mot"
}`;

    const userPrompt = `## Analyse de récitation
**Sourate**: ${surahNumber} | **Verset**: ${verseNumber} | **Qiraat**: ${qiraat}
**Texte attendu**: "${expectedText}"
**Transcription**: "${transcribedText || "(VIDE)"}"
${whisperError ? `**⚠️ Erreur**: ${whisperError}` : ""}
${!transcribedText || transcribedText.trim().length < 5
  ? `Score = 0, feedback = "Aucune récitation détectée."`
  : `Compare chaque mot, identifie TOUTES les erreurs, sois TRÈS strict.`}
Réponds UNIQUEMENT en JSON valide.`;

    console.log("[analyze-recitation] Sending to Gemini for tajweed analysis...");

    const response = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: systemPrompt + "\n\n" + userPrompt }] }],
        generationConfig: { temperature: 0.1, maxOutputTokens: 2000, responseMimeType: "application/json" },
      }),
    });

    console.log("[analyze-recitation] Gemini status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[analyze-recitation] Gemini error:", response.status, errorText);
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requêtes atteinte." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      throw new Error(`Gemini error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const content = aiResponse?.candidates?.[0]?.content?.parts?.[0]?.text;

    let analysis: any;
    try {
      analysis = JSON.parse(content);
    } catch {
      analysis = {
        isCorrect: false, overallScore: 0,
        feedback: "Erreur d'analyse. Veuillez réessayer.",
        encouragement: "Ne vous découragez pas, réessayez!",
        priorityFixes: [], errors: [], textComparison: "",
      };
    }

    analysis.audioAnalyzed = hasAudio;
    analysis.audioMimeType = hasAudio ? (audioMimeType ?? null) : null;
    analysis.transcribedText = transcriptionOk ? transcribedText : null;
    analysis.expectedText = expectedText;
    analysis.transcriptionImpossible = false;
    analysis.whisperError = whisperError;

    return new Response(JSON.stringify(analysis), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[analyze-recitation] Fatal error:", error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : "Unknown error",
      isCorrect: false, overallScore: 0,
      feedback: "Une erreur s'est produite lors de l'analyse.",
      encouragement: "Veuillez réessayer.",
      priorityFixes: [], errors: [],
    }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
