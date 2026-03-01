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

    // 1) Transcription via Gemini multimodal (audio input)
    if (hasAudio) {
      console.log("[analyze-recitation] Starting Gemini audio transcription...");

      try {
        const base64Payload = audioBase64.includes(",")
          ? audioBase64.split(",")[1]
          : audioBase64;

        // Determine the audio format for the inline_data
        const rawMime = (audioMimeType || "audio/wav").split(";")[0].trim();

        const transcribeResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            temperature: 0.0,
            max_tokens: 500,
            messages: [
              {
                role: "user",
                content: [
                  {
                    type: "input_audio",
                    input_audio: {
                      data: base64Payload,
                      format: rawMime.includes("wav") ? "wav" : rawMime.includes("mp3") ? "mp3" : "wav",
                    },
                  },
                  {
                    type: "text",
                    text: `Transcris EXACTEMENT le texte arabe récité dans cet audio. C'est une récitation coranique (Sourate ${surahNumber}, verset ${verseNumber}). Retourne UNIQUEMENT le texte arabe transcrit, sans aucune explication ni commentaire. Si tu n'entends rien ou ne peux pas transcrire, retourne exactement: EMPTY`,
                  },
                ],
              },
            ],
          }),
        });

        console.log("[analyze-recitation] Transcription response status:", transcribeResponse.status);

        if (!transcribeResponse.ok) {
          const errorText = await transcribeResponse.text();
          console.error("[analyze-recitation] Transcription error:", transcribeResponse.status, errorText);
          
          if (transcribeResponse.status === 429) {
            whisperError = "Limite de requêtes atteinte";
          } else if (transcribeResponse.status === 402) {
            whisperError = "Crédits épuisés";
          } else {
            whisperError = `Erreur transcription: ${transcribeResponse.status}`;
          }
        } else {
          const result = await transcribeResponse.json();
          const content = result.choices?.[0]?.message?.content ?? "";
          transcribedText = content.trim();
          
          if (transcribedText === "EMPTY" || transcribedText.length < 3) {
            transcribedText = "";
            transcriptionOk = false;
            whisperError = "Transcription vide";
          } else {
            transcriptionOk = true;
          }
          console.log("[analyze-recitation] Transcription result:", transcribedText.substring(0, 100));
        }
      } catch (e) {
        console.error("[analyze-recitation] Transcription exception:", e);
        whisperError = e instanceof Error ? e.message : "Erreur de transcription";
      }
    }

    // 2) Tajweed analysis
    const transcriptionImpossible = hasAudio && !transcriptionOk;

    if (transcriptionImpossible) {
      const failure = {
        isCorrect: false,
        overallScore: 0,
        feedback: "La transcription est vide. Veuillez réenregistrer.",
        encouragement: "Réessaie en te rapprochant du micro et en parlant clairement.",
        priorityFixes: [
          "Réenregistre dans un endroit calme (sans bruit de fond)",
          "Rapproche le micro et augmente légèrement le volume de ta voix",
          "Réessaie avec un verset court (ex: Al-Ikhlâs 112:1)",
        ],
        errors: [],
        textComparison: "",
        audioAnalyzed: true,
        audioMimeType: audioMimeType ?? null,
        transcribedText: null,
        expectedText,
        transcriptionImpossible: true,
        whisperError,
      };

      console.log("[analyze-recitation] Early return (transcriptionImpossible)", { whisperError });

      return new Response(JSON.stringify(failure), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("[analyze-recitation] Analysis params:", {
      hasAudio,
      transcriptionOk,
      transcribedTextLength: transcribedText.length,
      whisperError,
    });

    const systemPrompt = `Tu es Cheikh Al-Muqri', un maître de tajwīd extrêmement strict et expert en lecture ${qiraat}.

## TON RÔLE
Tu analyses la récitation coranique d'un étudiant en comparant la transcription de son audio au texte attendu du Coran.

## RÈGLES DE TAJWĪD À VÉRIFIER (par ordre de priorité)

### 1. MAKHĀRIJ (Points d'articulation) - CRITIQUE
- الحلق (gorge): ء ه ع ح غ خ
- اللسان (langue): ق ك ج ش ض ل ن ر ط د ت ظ ذ ث ص ز س
- الشفتان (lèvres): ف و ب م
- الخيشوم (nasalité): م ن avec ghunna

### 2. ṢIFĀT (Caractéristiques des lettres) - MAJEUR
### 3. MADD (Prolongations) - MAJEUR
### 4. RÈGLES DE NOUN SAAKIN ET TANWIN - MAJEUR
### 5. AUTRES RÈGLES

## BARÈME DE NOTATION (très strict)
- 95-100: Parfait, aucune erreur
- 85-94: Très bien, erreurs mineures seulement
- 70-84: Bien, quelques erreurs majeures
- 50-69: Moyen, plusieurs erreurs majeures
- 30-49: Faible, erreurs critiques
- 0-29: À revoir entièrement

## FORMAT DE RÉPONSE (JSON strict)
{
  "isCorrect": boolean,
  "overallScore": number (0-100),
  "feedback": string,
  "encouragement": string,
  "priorityFixes": [string, string, string],
  "errors": [
    {
      "word": "le mot arabe concerné",
      "ruleType": "Makhārij|Madd|Ghunna|Idghām|Ikhfā'|Iqlab|Iẓhār|Qalqala|Tafkhīm|Tarqīq|Waqf",
      "ruleDescription": "Explication détaillée de l'erreur",
      "severity": "minor|major|critical",
      "correction": "Comment prononcer correctement"
    }
  ],
  "textComparison": "Analyse mot-à-mot: attendu vs prononcé"
}`;

    const userPrompt = `## Analyse de récitation

**Sourate**: ${surahNumber}
**Verset**: ${verseNumber}
**Lecture (Qiraat)**: ${qiraat}

**Texte coranique attendu (référence)**:
"${expectedText}"

**Transcription de l'audio de l'étudiant**:
"${transcribedText || "(VIDE - aucun texte détecté)"}"

${whisperError ? `**⚠️ Erreur technique de transcription**: ${whisperError}` : ""}

## Instructions:
${!transcribedText || transcribedText.trim().length < 5 
  ? `- La transcription est vide ou trop courte. Score = 0, feedback = "Aucune récitation détectée."`
  : `- Compare chaque mot de la transcription au texte attendu
- Identifie TOUTES les erreurs de tajwīd
- Sois TRÈS strict sur la notation
- Fournis des conseils précis et actionnables`
}

Réponds UNIQUEMENT en JSON valide (pas de markdown, pas de \`\`\`).`;

    console.log("[analyze-recitation] Sending to Gemini for tajweed analysis...");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        temperature: 0.1,
        max_tokens: 2000,
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
          JSON.stringify({ error: "Crédits épuisés." }),
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
