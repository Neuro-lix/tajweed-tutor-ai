import { handleOptions } from "../_shared/cors.ts";
import { HttpError, json, errorResponse, readJson } from "../_shared/http.ts";
import { requireUser, supabaseAdmin } from "../_shared/auth.ts";
import { enforceRateLimit } from "../_shared/rateLimit.ts";
import { consumeCredits, refundCredits } from "../_shared/credits.ts";
import { parseLlmJson } from "../_shared/llmJson.ts";
import { pseudonymize } from "../_shared/hash.ts";
import { CREDIT_COSTS } from "../_shared/credit-costs.ts";
import { decodeWavPcm16, measureAcoustics, base64ToBytes } from "../_shared/acoustics.ts";
import { stripDiacritics, computeSimilarity, buildWordConfidence, measureTajweed, type AsrWord } from "../_shared/recitation-metrics.ts";
type WhisperWord = AsrWord;

// ─── Startup check: secrets requis ──────────────────────────────────────
if (!Deno.env.get("HUGGINGFACE_API_KEY")) {
  console.warn(
    "[analyze-recitation] STARTUP: secret HUGGINGFACE_API_KEY absent — " +
      "la transcription spécialisée Coran est désactivée (repli LLM seul). " +
      "Ajoutez-le via Project Settings → Edge Functions → Secrets (voir README).",
  );
} else {
  console.log("[analyze-recitation] STARTUP: HUGGINGFACE_API_KEY détectée.");
}

const COST = CREDIT_COSTS.analyzeRecitation;
const MAX_AUDIO_BYTES = 15 * 1024 * 1024;

Deno.serve(async (req) => {
  const pre = handleOptions(req); if (pre) return pre;

  let charged = false;
  let chargedUser: string | null = null;
  const refund = async () => {
    if (charged && chargedUser) { charged = false; await refundCredits(chargedUser, COST); }
  };

  try {
    const user = await requireUser(req);
    const userId = user.id;
    await enforceRateLimit(userId, "analyze-recitation", 10, 60);
    const sbAdmin = supabaseAdmin;

    // ── Best-effort LLM usage logger (never blocks or throws) ──
    const logUsage = async (entry: {
      model: string;
      operation: string;
      status: string;
      credits_charged?: number;
      usage?: Record<string, number> | null;
    }) => {
      try {
        const u = entry.usage ?? {};
        await sbAdmin.from("llm_usage").insert({
          user_id: userId,
          function_name: "analyze-recitation",
          model: entry.model,
          operation: entry.operation,
          prompt_tokens: u.prompt_tokens ?? 0,
          completion_tokens: u.completion_tokens ?? 0,
          total_tokens: u.total_tokens ?? 0,
          credits_charged: entry.credits_charged ?? 0,
          status: entry.status,
        });
      } catch (logErr) {
        console.error("[analyze-recitation] llm_usage log failed:", logErr);
      }
    };

    const t0 = Date.now();
    const body = await readJson<Record<string, unknown>>(req, 22_000_000);
    const audioBase64 = body.audioBase64 as string | undefined;
    const audioMimeType = body.audioMimeType as string | undefined;
    const surahNumber = body.surahNumber as number;
    const verseNumber = body.verseNumber as number;
    const expectedText = body.expectedText as string;
    const qiraat = body.qiraat as string | undefined;
    const uiLanguage = body.uiLanguage as string | undefined;
    if (audioBase64 !== undefined && audioBase64 !== null && typeof audioBase64 !== "string") throw new HttpError(400, "Audio invalide.");
    if (typeof audioBase64 === "string" && audioBase64.length * 0.75 > MAX_AUDIO_BYTES) throw new HttpError(413, "Fichier audio trop volumineux (max 15 Mo).");
    if (audioMimeType != null && (typeof audioMimeType !== "string" || audioMimeType.length > 100)) throw new HttpError(400, "Type audio invalide.");
    if (!Number.isInteger(surahNumber) || surahNumber < 1 || surahNumber > 114) throw new HttpError(400, "Sourate invalide.");
    if (!Number.isInteger(verseNumber) || verseNumber < 1 || verseNumber > 286) throw new HttpError(400, "Verset invalide.");
    if (typeof expectedText !== "string" || expectedText.length === 0 || expectedText.length > 5000) throw new HttpError(400, "Texte attendu invalide.");
    if (qiraat != null && (typeof qiraat !== "string" || qiraat.length > 40)) throw new HttpError(400, "Qirāʾa invalide.");
    if (uiLanguage != null && (typeof uiLanguage !== "string" || uiLanguage.length > 16)) throw new HttpError(400, "Langue invalide.");

    // ── Décompte atomique AVANT tout appel IA ──
    let remainingCredits: number | null = null;
    try {
      remainingCredits = Number(await consumeCredits(userId, COST));
      charged = true; chargedUser = userId;
    } catch (e) {
      if (e instanceof HttpError && e.status === 402) {
        const { data: creditRow } = await sbAdmin.from("user_credits").select("credits").eq("user_id", userId).maybeSingle();
        return json(req, {
          error: "insufficient_credits",
          required: COST,
          balance: Number(creditRow?.credits ?? 0),
          message: "Crédits insuffisants pour analyser une récitation.",
        }, 402);
      }
      throw e;
    }

    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("[analyze-recitation] Missing LOVABLE_API_KEY");
      await refund();
      return json(req, { error: "Service temporarily unavailable" }, 503);
    }

    // Optional: Whisper-large-v3 via Replicate for better Arabic accuracy + diacritics
    const REPLICATE_API_TOKEN = Deno.env.get("REPLICATE_API_TOKEN");
    const useReplicate = !!REPLICATE_API_TOKEN;

    console.log("[analyze-recitation] Request:", { surahNumber, verseNumber, qiraat, hasAudio: !!audioBase64, mimeType: audioMimeType, engine: useReplicate ? "replicate-large-v3" : "openai-whisper-1" });

    const hasAudio = typeof audioBase64 === "string" && audioBase64.trim().length > 100;
    let transcribedText = "";
    let transcriptionOk = false;
    let whisperError: string | null = null;
    let transcriptionEngine:
      | "quran-whisper"
      | "hf-whisper-large-v3-turbo"
      | "gpt-4o-mini-transcribe"
      | "whisper-1"
      | "whisper-large-v3" = "gpt-4o-mini-transcribe";
    // Per-word timings/probabilities, when the transcription engine provides them.
    let whisperWords: WhisperWord[] | null = null;

    if (hasAudio) {
      const base64Payload = audioBase64.includes(",") ? audioBase64.split(",")[1] : audioBase64;

      // Decode once — reused by the HuggingFace and OpenAI paths.
      const decodeAudioBytes = (): Uint8Array => {
        const binaryString = atob(base64Payload);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
        return bytes;
      };
      const rawMimeType = (audioMimeType || "audio/wav").split(";")[0].trim();
      const audioExt = rawMimeType.includes("webm") ? "webm"
        : rawMimeType.includes("mp4") ? "mp4"
        : rawMimeType.includes("mpeg") || rawMimeType.includes("mp3") ? "mp3"
        : "wav";

      // ─── Path 0: Quran-specialised Whisper (tarteel-ai) via HuggingFace ───
      // Fine-tuned on Quranic recitation → noticeably better than generic Whisper
      // on tajwīd-relevant phonetics. Falls through to the generic cascade on any failure.
      // ⚠️ MANUAL SETUP: add the `HUGGINGFACE_API_KEY` secret to enable this path.
      const HUGGINGFACE_API_KEY = Deno.env.get("HUGGINGFACE_API_KEY");
      // tarteel-ai n'est PAS servi en serverless HF ("Model not supported by provider").
      // → si un Inference Endpoint dédié est configuré (HF_ASR_ENDPOINT_URL), on l'utilise ;
      //   sinon whisper-large-v3-turbo (serverless) avec horodatage mot par mot.
      const hfDedicated = Deno.env.get("HF_ASR_ENDPOINT_URL");
      const hfUrl = hfDedicated ?? "https://router.huggingface.co/hf-inference/models/openai/whisper-large-v3-turbo";
      const hfEnabled = (Deno.env.get("ENABLE_ASR_PIPELINE") ?? "false").toLowerCase() === "true";
      if (!hfEnabled) {
        console.log("[analyze-recitation] ENABLE_ASR_PIPELINE != true — generic cascade.");
      } else if (!HUGGINGFACE_API_KEY) {
        console.warn("[analyze-recitation] HUGGINGFACE_API_KEY not configured — generic cascade.");
      } else {
        // Moteur Coran (tarteel, texte vocalisé) + moteur généraliste (minutage mot par mot) en parallèle.
        // tarteel ne sait pas renvoyer de minutage : on combine les deux.
        const turboUrl = "https://router.huggingface.co/hf-inference/models/openai/whisper-large-v3-turbo";
        console.log("[analyze-recitation] Trying HuggingFace", hfDedicated ? "quran endpoint + turbo" : hfUrl);
        const hfHeaders = { "Authorization": `Bearer ${HUGGINGFACE_API_KEY}`, "Content-Type": "application/json", "x-wait-for-model": "true" };
        const quranCall = hfDedicated
          ? fetch(hfDedicated, { method: "POST", headers: hfHeaders, body: JSON.stringify({ inputs: base64Payload }) })
              .then(async (r) => r.ok ? String((await r.json())?.text ?? "").trim() : (console.error("[analyze-recitation] Quran endpoint", r.status, (await r.text()).slice(0, 200)), ""))
              .catch((e) => { console.error("[analyze-recitation] Quran endpoint exception", e); return ""; })
          : Promise.resolve("");
        const turboCall = fetch(turboUrl, {
          method: "POST", headers: hfHeaders,
          body: JSON.stringify({ inputs: base64Payload, parameters: { return_timestamps: "word", generate_kwargs: { language: "arabic", task: "transcribe" } } }),
        }).then(async (r) => r.ok ? await r.json() : (console.error("[analyze-recitation] HF turbo", r.status, (await r.text()).slice(0, 200)), null))
          .catch((e) => { console.error("[analyze-recitation] HF turbo exception", e); return null; });
        const [quranText, turboJson] = await Promise.all([quranCall, turboCall]);
        const turboText = turboJson ? String(typeof turboJson === "string" ? turboJson : (turboJson.text ?? "")).trim() : "";
        if (Array.isArray(turboJson?.chunks)) {
          whisperWords = turboJson.chunks.map((c: { text?: string; timestamp?: [number, number | null] }) => ({
            word: String(c.text ?? "").trim(), start: c.timestamp?.[0] ?? null, end: c.timestamp?.[1] ?? null,
          })).filter((w: WhisperWord) => w.word);
        }
        if (quranText.length >= 3) {
          transcribedText = quranText; transcriptionOk = true; transcriptionEngine = "quran-whisper"; whisperError = null;
          console.log("[analyze-recitation] Quran result:", quranText.substring(0, 100));
        } else if (turboText.length >= 3) {
          transcribedText = turboText; transcriptionOk = true; transcriptionEngine = "hf-whisper-large-v3-turbo"; whisperError = null;
          console.log("[analyze-recitation] HF turbo result:", turboText.substring(0, 100));
        } else {
          whisperError = "HuggingFace indisponible, fallback moteur générique";
        }
      }

      // ─── Path A: Replicate Whisper-large-v3 (vowelled Arabic, +30% precision) ───
      if (!transcriptionOk && useReplicate) {
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
          const bytes = decodeAudioBytes();
          const formData = new FormData();
          formData.append("file", new Blob([bytes], { type: rawMimeType }), `audio.${audioExt}`);
          formData.append("model", "openai/gpt-4o-mini-transcribe");
          formData.append("language", "ar");
          // NOTE: `gpt-4o-mini-transcribe` does NOT support `verbose_json` nor
          // `timestamp_granularities: ["word"]` — it only returns plain text.
          // Per-word confidence on this path is derived from text similarity.

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

      // ─── Path C: OpenAI whisper-1 with per-word timestamps + probabilities ───
      // `whisper-1` is the only OpenAI model supporting `verbose_json` +
      // `timestamp_granularities: ["word"]`, which gives real per-word confidence.
      if (!transcriptionOk && OPENAI_API_KEY) {
        console.log("[analyze-recitation] Falling back to OpenAI whisper-1 (verbose_json, word timestamps)...");
        try {
          const bytes = decodeAudioBytes();
          const form = new FormData();
          form.append("file", new Blob([bytes], { type: rawMimeType }), `audio.${audioExt}`);
          form.append("model", "whisper-1");
          form.append("language", "ar");
          form.append("response_format", "verbose_json");
          form.append("timestamp_granularities[]", "word");

          const oaResp = await fetch("https://api.openai.com/v1/audio/transcriptions", {
            method: "POST",
            headers: { "Authorization": `Bearer ${OPENAI_API_KEY}` },
            body: form,
          });
          if (!oaResp.ok) {
            const errTxt = await oaResp.text();
            console.error("[analyze-recitation] OpenAI whisper-1 error:", oaResp.status, errTxt);
          } else {
            const oaJson = await oaResp.json();
            const text = (oaJson.text || "").trim();
            if (text.length >= 3) {
              transcribedText = text;
              transcriptionOk = true;
              transcriptionEngine = "whisper-1";
              whisperError = null;
              whisperWords = Array.isArray(oaJson.words) ? (oaJson.words as WhisperWord[]) : null;
              console.log("[analyze-recitation] whisper-1 words:", whisperWords?.length ?? 0);
            }
          }
        } catch (e) {
          console.error("[analyze-recitation] OpenAI whisper-1 exception:", e);
        }
      }
    }

    // 2) Early return if transcription failed (status 422 so the client can branch)
    if (hasAudio && !transcriptionOk) {
      await refund();
      return json(req, {
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
      }, 422);
    }

    // Pre-compute textual similarity (helps Gemini calibrate scoring)
    const similarity = transcribedText && expectedText ? computeSimilarity(expectedText, transcribedText) : 0;
    const expectedNorm = stripDiacritics(expectedText || "");
    const actualNorm = stripDiacritics(transcribedText || "");
    console.log("[analyze-recitation] Similarity:", similarity.toFixed(2));

    // Per-word alignment + confidence (Whisper probabilities when available)
    const wordConfidence = buildWordConfidence(expectedText || "", transcribedText || "", whisperWords);
    const weakWords = wordConfidence.filter((w) => w.confidence !== "high");
    console.log("[analyze-recitation] Weak words:", weakWords.length, "/", wordConfidence.length);

    // Log the transcription (Whisper) step — no credit charged, tracking only
    if (hasAudio && transcriptionOk) {
      await logUsage({ model: transcriptionEngine, operation: "transcription", status: "success" });
    }

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

## Analyse mot par mot (alignement + niveau de confiance)
${
  wordConfidence.length === 0
    ? "(non disponible)"
    : wordConfidence
        .map((w) => `- "${w.word}" ← entendu "${w.heardWord || "(rien)"}" → confiance ${w.confidence}`)
        .join("\n")
}

### Mots à confiance basse/moyenne (À ANALYSER EN PRIORITÉ)
${weakWords.length === 0 ? "(aucun — la récitation est nette partout)" : weakWords.map((w) => `- ${w.word} (${w.confidence})`).join("\n")}

**Concentre ton analyse tajwīd sur ces mots-là**, dans l'ordre : d'abord les "low", puis les "medium".
N'analyse les mots "high" que si une règle de tajwīd évidente y est en jeu. Les champs "word" de
tes "errors" doivent en priorité correspondre à ces mots à confiance basse/moyenne.

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
      await logUsage({ model: "google/gemini-2.5-flash", operation: "analysis", status: `error_${response.status}` });
      await refund();
      if (response.status === 429) {
        return json(req, { error: "Limite de requêtes atteinte. Réessayez dans un instant." }, 429);
      }
      if (response.status === 402) {
        return json(req, { error: "Crédits IA épuisés. Veuillez recharger pour continuer." }, 402);
      }
      return json(req, { error: "Analysis service error. Please try again." }, 502);
    }

    const aiResponse = await response.json();
    const content = aiResponse?.choices?.[0]?.message?.content;

    // ── Log LLM usage (best-effort; never blocks the response) ──
    await logUsage({
      model: "google/gemini-2.5-flash",
      operation: "analysis",
      status: "success",
      credits_charged: 1,
      usage: (aiResponse?.usage ?? {}) as Record<string, number>,
    });

    let analysis: Record<string, unknown>;
    try {
      analysis = parseLlmJson<Record<string, unknown>>(String(content ?? ""));
      const required = ["isCorrect", "overallScore", "feedback", "encouragement", "priorityFixes", "errors"];
      const missing = required.filter((k) => !(k in (analysis ?? {})));
      if (!analysis || typeof analysis !== "object" || missing.length > 0) {
        console.error("[analyze-recitation] Malformed AI response, missing:", missing);
        throw new HttpError(502, "Réponse de l'IA illisible.");
      }
    } catch (e) {
      await refund();
      throw e;
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
    analysis.wordConfidence = wordConfidence.map((w) => ({ word: w.word, confidence: w.confidence }));
    analysis.wordDetails = wordConfidence;
    // Every LLM-produced error is INFERRED; acoustic ones are MEASURED.
    const measured = measureTajweed(wordConfidence);
    const inferred = (analysis.errors as Record<string, unknown>[])
      .filter((e) => !measured.some((m) => m.word === e.word && m.ruleType === e.ruleType))
      .map((e) => ({ ...e, confidence: "inferred" }));
    // Signal-level measurements (ghunna nasal energy, qalqala burst) on WAV audio.
    let acoustic: ReturnType<typeof measureAcoustics> = [];
    try {
      if (hasAudio && audioBase64 && String(audioMimeType ?? "").includes("wav")) {
        const pcm = decodeWavPcm16(base64ToBytes(audioBase64));
        if (pcm) acoustic = measureAcoustics(pcm, wordConfidence.map((w) => ({ word: w.word, start: w.start ?? null, end: w.end ?? null })));
      }
    } catch (e) { console.warn("[analyze-recitation] acoustics failed:", e); }
    const acousticErrors = acoustic.filter((a) => !a.ok && !measured.some((m) => m.word === a.word && m.ruleType === a.ruleType));
    const inferredFinal = inferred.filter((e) => !acoustic.some((a) => a.word === e.word && a.ruleType === e.ruleType));
    analysis.acousticMeasures = acoustic;
    analysis.errors = [...measured, ...acousticErrors, ...inferredFinal];
    const degraded = transcriptionEngine !== "quran-whisper" && transcriptionEngine !== "hf-whisper-large-v3-turbo";
    analysis.engineStatus = {
      mode: transcriptionEngine === "quran-whisper" ? "quran" : degraded ? "degraded" : "timestamps",
      engine: transcriptionEngine,
      reason: degraded ? (whisperError ?? "quran_engine_unavailable") : null,
      hasWordTimestamps: wordConfidence.some((w) => w.start !== null),
      measuredCount: measured.length + acousticErrors.length,
      measuredChecks: acoustic.length,
      inferredCount: inferredFinal.length,
    };
    if (degraded) console.warn("[analyze-recitation] DEGRADED MODE — generic engine used:", transcriptionEngine, whisperError);

    analysis.remainingCredits = remainingCredits;

    // ── Dataset contribution (opt-in, anonymised) ──
    const { data: prof } = await sbAdmin.from("profiles").select("session_type, dataset_consent").eq("user_id", userId).maybeSingle();
    if (prof?.dataset_consent === true) {
      try {
        const contributor = await pseudonymize(userId);
        let audioPath: string | null = null;
        if (hasAudio && audioBase64) {
          const ext = String(audioMimeType ?? "").includes("wav") ? "wav" : "webm";
          audioPath = `${surahNumber}/${verseNumber}/${crypto.randomUUID()}.${ext}`;
          const { error: upErr } = await sbAdmin.storage.from("recitation-dataset")
            .upload(audioPath, base64ToBytes(audioBase64), { contentType: audioMimeType ?? "audio/wav" });
          if (upErr) { console.warn("[dataset] upload failed", upErr); audioPath = null; }
        }
        const last = wordConfidence.filter((w) => w.end != null).pop();
        await sbAdmin.from("recitation_samples").insert({
          contributor_hash: contributor,
          surah_number: surahNumber, verse_number: verseNumber,
          qiraat: qiraat ?? null, session_type: prof?.session_type ?? null,
          ui_language: typeof uiLanguage === "string" ? uiLanguage.slice(0, 8) : null,
          expected_text: expectedText ?? "", transcription: analysis.transcribedText,
          engine: transcriptionEngine, word_timestamps: wordConfidence,
          acoustic_measures: acoustic, detected_errors: analysis.errors,
          score: analysis.overallScore, audio_path: audioPath,
          duration_sec: last?.end ?? null, latency_ms: Date.now() - t0,
        });
      } catch (e) { console.warn("[dataset] insert failed", e); }
    }

    return json(req, analysis);
  } catch (error) {
    await refund();
    return errorResponse(req, error);
  }
});
