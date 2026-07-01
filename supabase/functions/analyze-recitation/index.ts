import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

// ─── CORS: env-driven allowlist (no wildcard) ───────────────────────────
const DEFAULT_ALLOWED_ORIGINS = [
  "https://recite-perfectly-bot.lovable.app",
  "https://id-preview--dd06a156-64f5-407d-bf79-94ef3c169108.lovable.app",
  "http://localhost:8080",
  "http://localhost:5173",
];
const ENV_ALLOWED = (Deno.env.get("ALLOWED_ORIGINS") ?? "")
  .split(",").map((s) => s.trim()).filter(Boolean);
const ALLOWLIST = ENV_ALLOWED.length ? ENV_ALLOWED : DEFAULT_ALLOWED_ORIGINS;
const ALLOW_HEADERS = "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version";

function buildCors(req: Request): Record<string, string> {
  const origin = req.headers.get("Origin") ?? "";
  const ok = ALLOWLIST.includes(origin)
    || /^https:\/\/[a-z0-9-]+\.lovable\.app$/i.test(origin)
    || /^https:\/\/[a-z0-9-]+\.lovableproject\.com$/i.test(origin);
  return {
    "Access-Control-Allow-Origin": ok ? origin : ALLOWLIST[0],
    "Access-Control-Allow-Headers": ALLOW_HEADERS,
    "Vary": "Origin",
  };
}

// ─── Arabic text utilities ───────────────────────────────────────────
// Strip Arabic diacritics (harakat) and tatweel for fair text comparison.
// Whisper often returns un-vowelled (or partially vowelled) Arabic.
const stripDiacritics = (s: string): string =>
  (s || "")
    .normalize("NFKC")
    .replace(/[\u064B-\u065F\u0670\u06D6-\u06ED\u0640]/g, "") // harakat + tatweel
    .replace(/[ﺁﺂﺄﺆﺈﺊﺌﺎ]/g, "ا")
    .replace(/[إأآا]/g, "ا")
    .replace(/[ىي]/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/\s+/g, " ")
    .trim();

// Word-level similarity (0..1) — Jaccard on token sets after diacritic stripping
const computeSimilarity = (expected: string, actual: string): number => {
  const a = stripDiacritics(expected).split(" ").filter(Boolean);
  const b = stripDiacritics(actual).split(" ").filter(Boolean);
  if (a.length === 0 || b.length === 0) return 0;
  const setA = new Set(a);
  const setB = new Set(b);
  const inter = [...setA].filter((w) => setB.has(w)).length;
  const union = new Set([...a, ...b]).size;
  return union === 0 ? 0 : inter / union;
};

serve(async (req) => {
  const corsHeaders = buildCors(req);
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // ── AuthN: require valid Supabase JWT to prevent abuse of expensive AI ops
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

    // ── Per-user rate limit (20 analyses / hour)
    const sbAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const { data: rl } = await sbAdmin.rpc("check_and_increment_rate_limit", {
      p_user_id: userId, p_action: "analyze-recitation", p_max: 20, p_window_seconds: 3600,
    });
    if (rl && (rl as any).allowed === false) {
      const resetAt = (rl as any).reset_at;
      const retryAfter = Math.max(1, Math.ceil((new Date(resetAt).getTime() - Date.now()) / 1000));
      return new Response(JSON.stringify({ error: "Rate limit exceeded", retry_after: retryAfter }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json", "Retry-After": String(retryAfter) },
      });
    }

    const { audioBase64, audioMimeType, surahNumber, verseNumber, expectedText, qiraat } = await req.json();

    // ── Payload size guard (~5 MB base64 ≈ 3.75 MB binary)
    if (typeof audioBase64 === "string" && audioBase64.length > 5_000_000) {
      return new Response(JSON.stringify({
        error: "audio_too_large",
        message: "Fichier audio trop volumineux (max ~3.75 MB).",
      }), { status: 413, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("[analyze-recitation] Missing LOVABLE_API_KEY");
      return new Response(JSON.stringify({ error: "Service temporarily unavailable" }), {
        status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Optional: Whisper-large-v3 via Replicate for better Arabic accuracy + diacritics
    const REPLICATE_API_TOKEN = Deno.env.get("REPLICATE_API_TOKEN");
    const useReplicate = !!REPLICATE_API_TOKEN;

    console.log("[analyze-recitation] Request:", { surahNumber, verseNumber, qiraat, hasAudio: !!audioBase64, mimeType: audioMimeType, engine: useReplicate ? "replicate-large-v3" : "openai-whisper-1" });

    const hasAudio = typeof audioBase64 === "string" && audioBase64.trim().length > 100;
    let transcribedText = "";
    let transcriptionOk = false;
    let whisperError: string | null = null;
    let transcriptionEngine: "gpt-4o-mini-transcribe" | "whisper-1" | "whisper-large-v3" = "gpt-4o-mini-transcribe";

    if (hasAudio) {
      const base64Payload = audioBase64.includes(",") ? audioBase64.split(",")[1] : audioBase64;

      // ─── Path A: Replicate Whisper-large-v3 (vowelled Arabic, +30% precision) ───
      if (useReplicate) {
        console.log("[analyze-recitation] Trying Replicate Whisper-large-v3...");
        try {
          const dataUri = `data:${audioMimeType || "audio/wav"};base64,${base64Payload}`;
          const startResp = await fetch("https://api.replicate.com/v1/predictions", {
            method: "POST",
            headers: {
              "Authorization": `Token ${REPLICATE_API_TOKEN}`,
              "Content-Type": "application/json",
              "Prefer": "wait",
            },
            body: JSON.stringify({
              // openai/whisper community model with large-v3 support
              version: "8099696689d249cf8b122d833c36ac3f75505c666a395ca40ef26f68e7d3d16e",
              input: {
                audio: dataUri,
                model: "large-v3",
                language: "arabic",
                translate: false,
                temperature: 0,
                initial_prompt: `بسم الله الرحمن الرحيم. تلاوة قرآنية برواية ${qiraat || "حفص عن عاصم"}. النص: ${expectedText || ""}`,
              },
            }),
          });

          if (!startResp.ok) {
            const errTxt = await startResp.text();
            console.error("[analyze-recitation] Replicate start error:", startResp.status, errTxt);
            whisperError = `Replicate ${startResp.status}, fallback Whisper-1`;
          } else {
            let prediction = await startResp.json();
            const startedAt = Date.now();
            while (prediction.status !== "succeeded" && prediction.status !== "failed" && prediction.status !== "canceled") {
              if (Date.now() - startedAt > 60_000) {
                whisperError = "Replicate timeout, fallback Whisper-1";
                break;
              }
              await new Promise((r) => setTimeout(r, 1500));
              const pollResp = await fetch(prediction.urls.get, {
                headers: { "Authorization": `Token ${REPLICATE_API_TOKEN}` },
              });
              prediction = await pollResp.json();
            }

            if (prediction.status === "succeeded" && prediction.output) {
              const out = prediction.output;
              transcribedText = (typeof out === "string" ? out : (out.transcription || out.text || "")).trim();
              transcriptionOk = transcribedText.length >= 3;
              transcriptionEngine = "whisper-large-v3";
              console.log("[analyze-recitation] Replicate result:", transcribedText.substring(0, 100));
            } else if (!whisperError) {
              whisperError = `Replicate ${prediction.status}, fallback Whisper-1`;
            }
          }
        } catch (e) {
          console.error("[analyze-recitation] Replicate exception:", e);
          whisperError = `Replicate exception, fallback Whisper-1`;
        }
      }

      // ─── Path B: Lovable AI Gateway transcription (default) ───
      if (!transcriptionOk) {
        console.log("[analyze-recitation] Using Lovable AI transcription (gpt-4o-mini-transcribe)...");
        try {
          const binaryString = atob(base64Payload);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }

          const rawMime = (audioMimeType || "audio/wav").split(";")[0].trim();
          const ext = rawMime.includes("webm") ? "webm" : rawMime.includes("mp4") ? "mp4" : rawMime.includes("mpeg") || rawMime.includes("mp3") ? "mp3" : "wav";

          const formData = new FormData();
          formData.append("file", new Blob([bytes], { type: rawMime }), `audio.${ext}`);
          formData.append("model", "openai/gpt-4o-mini-transcribe");
          formData.append("language", "ar");

          const whisperResponse = await fetch("https://ai.gateway.lovable.dev/v1/audio/transcriptions", {
            method: "POST",
            headers: { "Authorization": `Bearer ${LOVABLE_API_KEY}` },
            body: formData,
          });

          console.log("[analyze-recitation] Transcription status:", whisperResponse.status);

          if (!whisperResponse.ok) {
            const errorText = await whisperResponse.text();
            console.error("[analyze-recitation] Transcription error:", whisperResponse.status, errorText);
            whisperError =
              whisperResponse.status === 429 ? "Limite de requêtes atteinte"
              : whisperResponse.status === 402 ? "Crédits IA épuisés"
              : `Transcription error: ${whisperResponse.status}`;
          } else {
            const result = await whisperResponse.json();
            transcribedText = (result.text || "").trim();
            transcriptionOk = transcribedText.length >= 3;
            if (!transcriptionOk) {
              whisperError = "Transcription vide";
            }
            transcriptionEngine = "gpt-4o-mini-transcribe";
            console.log("[analyze-recitation] Transcription result:", transcribedText.substring(0, 100));
          }
        } catch (e) {
          console.error("[analyze-recitation] Transcription exception:", e);
          whisperError = e instanceof Error ? e.message : "Erreur de transcription";
        }
      }
    }

    // 2) Early return if transcription failed (status 422 so the client can branch)
    if (hasAudio && !transcriptionOk) {
      return new Response(JSON.stringify({
        error: "transcription_empty",
        message: "La récitation n'a pas été capturée. Vérifiez votre microphone.",
        isCorrect: false, overallScore: 0,
        feedback: whisperError || "La transcription est vide. Veuillez réenregistrer.",
        encouragement: "Réessaie en te rapprochant du micro et en parlant clairement.",
        priorityFixes: ["Réenregistre dans un endroit calme", "Rapproche le micro", "Réessaie avec un verset court"],
        errors: [], textComparison: "",
        audioAnalyzed: true, audioMimeType: audioMimeType ?? null,
        transcribedText: null, expectedText,
        transcriptionImpossible: true, whisperError,
      }), { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Pre-compute textual similarity (helps Gemini calibrate scoring)
    const similarity = transcribedText && expectedText ? computeSimilarity(expectedText, transcribedText) : 0;
    const expectedNorm = stripDiacritics(expectedText || "");
    const actualNorm = stripDiacritics(transcribedText || "");
    console.log("[analyze-recitation] Similarity:", similarity.toFixed(2));

    // 3) Tajweed analysis via Lovable AI Gateway (Gemini model, no external key needed)
    const gatewayUrl = `https://ai.gateway.lovable.dev/v1/chat/completions`;

    const systemPrompt = `أنت الشيخ المُقرئ، خبير محقّق في علم التجويد وفي القراءات العشر، تعلّم القرآن الكريم برواية ${qiraat || "حفص عن عاصم"}.

# مهمتك
تقييم تلاوة طالب من خلال مقارنة النص المنطوق (Whisper transcription) بالنص القرآني المُتوقَّع، ثم إعطاء تشخيص دقيق لأخطاء التجويد.

# قواعد التجويد التي يجب تقييمها (مرتّبة حسب الأولوية)
1. **المخارج (Makhārij)** — مخرج كل حرف من حروف الحلق، اللسان، الشفتين، الجوف، الخيشوم. الخطأ في المخرج خطأ جسيم.
2. **الصفات (Ṣifāt)** — الجهر/الهمس، الشدة/الرخاوة، الاستعلاء/الاستفال، الإطباق/الانفتاح، القلقلة، الصفير، التفخيم/الترقيق.
3. **المدود (Mudūd)** — المد الطبيعي (حركتان)، المد المتصل (4-5 حركات)، المد المنفصل (4-5)، المد اللازم (6 حركات)، المد العارض للسكون.
4. **النون الساكنة والتنوين** — الإظهار، الإدغام (بغنّة/بدون)، الإقلاب، الإخفاء.
5. **الميم الساكنة** — الإخفاء الشفوي، الإدغام الشفوي، الإظهار الشفوي.
6. **القلقلة** — صغرى (وسط الكلمة) وكبرى (آخر الكلمة) في حروف "قطب جد".
7. **الوقف والابتداء** — تام، كافٍ، حسن، قبيح؛ صحة الابتداء بعد الوقف.
8. **التفخيم والترقيق** — في حروف الاستعلاء وفي الراء واللام (في لفظ الجلالة).

# قواعد المقارنة الذكيّة
- نسخة Whisper قد لا تتضمّن التشكيل (الحركات) دائمًا. **لا تعاقب على غياب الحركات في النصّ المنطوق**؛ ركّز على بنية الحروف ومطابقة الكلمات.
- التشابه الحرفي (Jaccard) المُحتسب مسبقًا = ${similarity.toFixed(2)} (1.0 = مطابقة تامة، 0.0 = لا تشابه).
- إذا كان التشابه < 0.30 ⇒ التلاوة لا تطابق الآية (حدّد ذلك في feedback).
- إذا كان التشابه > 0.85 ⇒ التلاوة قريبة من الصواب؛ ركّز على أخطاء التجويد الدقيقة (المدّ، الغنّة، القلقلة، التفخيم).
- إذا كان بين 0.30 و 0.85 ⇒ هناك أخطاء في الكلمات + احتمال أخطاء تجويد.

# سُلّم التقييم (صارم)
- 95-100 : تلاوة متقنة، خطأ بسيط أو لا أخطاء
- 85-94  : تلاوة جيّدة جدًا، خطأ أو خطأين بسيطين في التجويد
- 70-84  : تلاوة جيّدة، 3-5 أخطاء صغيرة
- 50-69  : تلاوة متوسطة، أخطاء واضحة في التجويد أو في كلمة واحدة
- 30-49  : تلاوة ضعيفة، أخطاء جسيمة (مخرج، كلمات مفقودة)
- 0-29   : تلاوة لا تطابق الآية أو غير مفهومة

# تنسيق الجواب (JSON صارم بالفرنسية للحقول النصّية)
{
  "isCorrect": boolean,            // true إذا overallScore >= 85
  "overallScore": number,          // 0-100
  "feedback": string,              // ملاحظة عامة بالفرنسية (2-3 جمل)
  "encouragement": string,         // تشجيع بالفرنسية
  "priorityFixes": [string,string,string], // 3 نصائح ملموسة بالفرنسية
  "errors": [
    {
      "word": "الكلمة العربية المعنيّة",
      "ruleType": "makharij|sifat|madd|idgham|ikhfa|iqlab|izhar|qalqala|ghunna|tafkhim|tarqiq|waqf",
      "ruleDescription": "وصف مختصر للقاعدة بالفرنسية",
      "severity": "minor|major|critical",
      "correction": "كيف يُنطق صحيحًا (بالفرنسية مع ذكر الحرف العربي)"
    }
  ],
  "textComparison": "Comparaison mot-à-mot en français (1-2 phrases)"
}`;

    const userPrompt = `## Données de la session
- **Sourate** : ${surahNumber}
- **Verset** : ${verseNumber}
- **Qiraat** : ${qiraat || "hafs_asim"}
- **Similarité Jaccard pré-calculée** : ${similarity.toFixed(2)}

## Texte attendu (avec diacritiques)
"${expectedText}"

## Texte attendu (normalisé, sans diacritiques)
"${expectedNorm}"

## Transcription Whisper (telle que reçue)
"${transcribedText || "(VIDE)"}"

## Transcription normalisée
"${actualNorm}"

${whisperError ? `## ⚠️ Avertissement Whisper\n${whisperError}\n` : ""}

## Instructions
${
  !transcribedText || transcribedText.trim().length < 5
    ? "Score = 0, feedback = \"Aucune récitation détectée.\""
    : similarity < 0.30
      ? "Le texte récité ne correspond PAS au verset attendu. Score ≤ 30. Indique clairement à l'élève qu'il a récité un autre verset ou que la prononciation est trop éloignée."
      : similarity > 0.85
        ? "Le texte est globalement correct. Concentre-toi sur les FINESSES de tajwīd : madd (longueur), ghunna (nasalisation), qalqala, tafkhīm/tarqīq, makhraj précis."
        : "Identifie d'abord les mots manquants/erronés, puis les erreurs de tajwīd. Sois très précis."
}

Réponds UNIQUEMENT en JSON valide, sans markdown, sans \`\`\`json.`;

    console.log("[analyze-recitation] Sending to Lovable AI for tajweed analysis...");

    const response = await fetch(gatewayUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        temperature: 0.1,
        max_tokens: 2500,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    console.log("[analyze-recitation] Lovable AI status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[analyze-recitation] Lovable AI error:", response.status, errorText);
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requêtes atteinte. Réessayez dans un instant." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Crédits IA épuisés. Veuillez recharger pour continuer." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      return new Response(JSON.stringify({ error: "Analysis service error. Please try again." }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const aiResponse = await response.json();
    const content = aiResponse?.choices?.[0]?.message?.content;

    // ── Log LLM usage (best-effort; never blocks the response) ──
    try {
      const usage = (aiResponse?.usage ?? {}) as Record<string, number>;
      await sbAdmin.from("llm_usage").insert({
        user_id: userId,
        function_name: "analyze-recitation",
        model: "google/gemini-2.5-flash",
        operation: "analysis",
        prompt_tokens: usage.prompt_tokens ?? 0,
        completion_tokens: usage.completion_tokens ?? 0,
        total_tokens: usage.total_tokens ?? 0,
        credits_charged: 1,
        status: "success",
      });
    } catch (logErr) {
      console.error("[analyze-recitation] llm_usage log failed:", logErr);
    }

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

    // Validate the structure — if the model returned a malformed object, fall
    // back to a safe shape so the client never crashes on missing fields.
    const required = ["isCorrect", "overallScore", "feedback", "encouragement", "priorityFixes", "errors"];
    const missing = required.filter((k) => !(k in (analysis ?? {})));
    if (!analysis || typeof analysis !== "object" || missing.length > 0) {
      console.error("[analyze-recitation] Malformed AI response, missing:", missing);
      analysis = {
        isCorrect: false, overallScore: 0,
        feedback: "Erreur d'analyse. Veuillez réessayer.",
        encouragement: "Ne vous découragez pas, réessayez!",
        priorityFixes: ["Réenregistrez votre récitation", "Vérifiez le microphone", "Réessayez"],
        errors: [], textComparison: "",
      };
    }

    // Safety: clamp score, coerce types, and fix isCorrect coherence
    analysis.overallScore = Math.max(0, Math.min(100, Math.round(Number(analysis.overallScore) || 0)));
    analysis.isCorrect = analysis.overallScore >= 85;
    if (!Array.isArray(analysis.errors)) analysis.errors = [];
    if (!Array.isArray(analysis.priorityFixes)) analysis.priorityFixes = [];

    analysis.audioAnalyzed = hasAudio;
    analysis.audioMimeType = hasAudio ? (audioMimeType ?? null) : null;
    analysis.transcribedText = transcriptionOk ? transcribedText : null;
    analysis.expectedText = expectedText;
    analysis.transcriptionImpossible = false;
    analysis.whisperError = whisperError;
    analysis.similarity = similarity;
    analysis.transcriptionEngine = transcriptionEngine;

    return new Response(JSON.stringify(analysis), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[analyze-recitation] Fatal error:", error);
    return new Response(JSON.stringify({
      error: "An unexpected error occurred",
      isCorrect: false, overallScore: 0,
      feedback: "Une erreur s'est produite lors de l'analyse.",
      encouragement: "Veuillez réessayer.",
      priorityFixes: [], errors: [],
    }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
