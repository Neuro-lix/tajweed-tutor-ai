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

        const rawMimeType = typeof audioMimeType === "string" && audioMimeType
          ? audioMimeType
          : "audio/webm";

        // IMPORTANT: Whisper is sometimes picky with codec suffixes (e.g. audio/webm;codecs=opus)
        // so we normalize to the base mime type.
        const mimeType = rawMimeType.split(";")[0].trim() || "audio/webm";
        const ext = pickAudioExt(mimeType);

        console.log("[analyze-recitation] Creating blob with mime:", mimeType, "ext:", ext);

        const audioBlob = new Blob([bytes], { type: mimeType });

        const makeFormData = (opts: { includeLanguage: boolean; includePrompt: boolean }) => {
          const fd = new FormData();
          fd.append("file", audioBlob, `recording.${ext}`);
          fd.append("model", "whisper-1");
          if (opts.includeLanguage) fd.append("language", "ar");
          if (opts.includePrompt) {
            fd.append(
              "prompt",
              `Récitation coranique du Coran en arabe classique. Sourate ${surahNumber}, verset ${verseNumber}. Texte attendu: ${expectedText}`,
            );
          }
          return fd;
        };

        const callWhisper = async (fd: FormData) => {
          console.log("[analyze-recitation] Sending to Whisper API...");
          const res = await fetch("https://ai.gateway.lovable.dev/v1/audio/transcriptions", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${LOVABLE_API_KEY}`,
            },
            body: fd,
          });
          console.log("[analyze-recitation] Whisper response status:", res.status);
          return res;
        };

        // Attempt 1: force Arabic + strong prompt
        let whisperResponse = await callWhisper(makeFormData({ includeLanguage: true, includePrompt: true }));

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
          const whisperResult = await whisperResponse.json().catch(() => null);
          transcribedText = (whisperResult?.text ?? "").toString().trim();
          transcriptionOk = transcribedText.length > 0;
          console.log("[analyze-recitation] Transcription result:", transcribedText.substring(0, 100), "...");
        }

        // Attempt 2 (fallback): let Whisper auto-detect language, no prompt.
        // This helps when the browser MIME/codecs mismatch confuses decoding.
        if (!transcriptionOk) {
          console.log("[analyze-recitation] Whisper retry (auto language, no prompt)...");
          whisperResponse = await callWhisper(makeFormData({ includeLanguage: false, includePrompt: false }));

          if (whisperResponse.ok) {
            const whisperResult = await whisperResponse.json().catch(() => null);
            const retryText = (whisperResult?.text ?? "").toString().trim();
            if (retryText.length > 0) {
              transcribedText = retryText;
              transcriptionOk = true;
              whisperError = null;
              console.log("[analyze-recitation] Retry transcription OK:", transcribedText.substring(0, 100), "...");
            }
          } else if (!whisperError) {
            const errorText = await whisperResponse.text();
            console.error("[analyze-recitation] Whisper retry error:", whisperResponse.status, errorText);
            whisperError = `Erreur Whisper (retry): ${whisperResponse.status}`;
          }

          if (!transcriptionOk && !whisperError) {
            whisperError = "Transcription vide";
          }
        }
      } catch (e) {
        console.error("[analyze-recitation] Whisper exception:", e);
        whisperError = e instanceof Error ? e.message : "Erreur de transcription";
      }
    }

    // 2) Tajweed analysis
    const transcriptionImpossible = hasAudio && !transcriptionOk;

    // If we couldn't transcribe, stop here (no AI tajwīd analysis without text).
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

      console.log("[analyze-recitation] Early return (transcriptionImpossible)", {
        whisperError,
      });

      return new Response(JSON.stringify(failure), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("[analyze-recitation] Analysis params:", {
      hasAudio,
      transcriptionOk,
      transcriptionImpossible,
      transcribedTextLength: transcribedText.length,
      whisperError,
    });

    const systemPrompt = `Tu es Cheikh Al-Muqri', un maître de tajwīd extrêmement strict et expert en lecture ${qiraat}.

## TON RÔLE
Tu analyses la récitation coranique d'un étudiant en comparant la transcription de son audio au texte attendu du Coran.

## RÈGLES DE TAJWĪD À VÉRIFIER (par ordre de priorité)

### 1. MAKHĀRIJ (Points d'articulation) - CRITIQUE
Vérifie chaque lettre est prononcée depuis son point d'articulation correct:
- الحلق (gorge): ء ه ع ح غ خ
- اللسان (langue): ق ك ج ش ض ل ن ر ط د ت ظ ذ ث ص ز س
- الشفتان (lèvres): ف و ب م
- الخيشوم (nasalité): م ن avec ghunna

### 2. ṢIFĀT (Caractéristiques des lettres) - MAJEUR
- الهمس (chuchotement): ف ح ث ه ش خ ص س ك ت
- الجهر (voisement): toutes les autres
- الشدة (force): أ ج د ق ط ب ك ت
- الرخاوة (douceur): ه خ غ ح ع ش ص ض ف ذ ث ظ ز س و ي ا
- القلقلة (rebond): ق ط ب ج د

### 3. MADD (Prolongations) - MAJEUR
- مد طبيعي (naturel): 2 harakat
- مد متصل (connecté): 4-5 harakat obligatoire
- مد منفصل (séparé): 4-5 harakat
- مد عارض للسكون: 2-6 harakat
- مد لازم: 6 harakat obligatoire

### 4. RÈGLES DE NOUN SAAKIN ET TANWIN - MAJEUR
- إظهار (prononciation claire): devant ء ه ع ح غ خ
- إدغام (assimilation): devant ي ر م ل و ن
- إقلاب (transformation): devant ب → devient م
- إخفاء (dissimulation): devant les 15 autres lettres

### 5. AUTRES RÈGLES
- Ghunna (nasalisation): durée de 2 harakat
- Tafkhim/Tarqiq: lettres emphatiques vs légères
- Waqf/Ibtida': arrêts et reprises

## INSTRUCTIONS D'ANALYSE

1. Compare CHAQUE MOT de la transcription au texte attendu
2. Identifie les mots manquants, modifiés ou mal prononcés
3. Pour chaque erreur, précise:
   - Le mot exact concerné
   - La règle de tajwīd violée
   - La sévérité (critical/major/minor)
   - La correction avec explication

## BARÈME DE NOTATION (très strict)
- 95-100: Parfait, aucune erreur
- 85-94: Très bien, erreurs mineures seulement
- 70-84: Bien, quelques erreurs majeures
- 50-69: Moyen, plusieurs erreurs majeures
- 30-49: Faible, erreurs critiques
- 0-29: À revoir entièrement

## FORMAT DE RÉPONSE (JSON strict)
{
  "isCorrect": boolean (true SEULEMENT si score >= 90 ET aucune erreur major/critical),
  "overallScore": number (0-100),
  "feedback": string (résumé en 1-2 phrases du niveau),
  "encouragement": string (message positif et constructif),
  "priorityFixes": [string, string, string] (exactement 3 conseils prioritaires),
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

## Instructions spéciales:
${!transcribedText || transcribedText.trim().length < 5 
  ? `- La transcription est vide ou trop courte. Score = 0, feedback = "Aucune récitation détectée. Veuillez réenregistrer plus fort et plus clairement."`
  : `- Compare chaque mot de la transcription au texte attendu
- Identifie TOUTES les erreurs de tajwīd
- Sois TRÈS strict sur la notation
- Fournis des conseils précis et actionnables`
}

Réponds UNIQUEMENT en JSON valide (pas de markdown, pas de \`\`\`).`;

    console.log("[analyze-recitation] Sending to Gemini 2.5 Flash...");

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
