// ─────────────────────────────────────────────────────────────────────────────
// tajweed-asr-analyze — PHASE 1 (MVP)
//
// Transcription spécialisée Coran via un modèle ASR hébergé sur HuggingFace
// (par défaut `tarteel-ai/whisper-base-ar-quran`).
//
// Rôle : renvoyer UNIQUEMENT la sortie technique (texte + timestamps par mot +
// indice de confiance). Aucune analyse tajwīd ici (Phase 2), aucun LLM (Phase 3).
//
// Confidentialité : l'audio est décodé en mémoire, envoyé au moteur ASR puis
// libéré. Il n'est jamais écrit en base ni dans le stockage.
// ─────────────────────────────────────────────────────────────────────────────
import { handleOptions } from "../_shared/cors.ts";
import { HttpError, json, errorResponse, readJson } from "../_shared/http.ts";
import { requireUser } from "../_shared/auth.ts";
import { enforceRateLimit } from "../_shared/rateLimit.ts";

// ─── Config ─────────────────────────────────────────────────────────────
/** Bascule ancien pipeline (LLM only) ↔ nouveau pipeline (ASR + LLM). */
const ASR_PIPELINE_ENABLED =
  (Deno.env.get("ENABLE_ASR_PIPELINE") ?? "false").toLowerCase() === "true";
/** Modèle par défaut, surchargeable (Inference Endpoint dédié en Phase 4). */
const HF_MODEL = Deno.env.get("HF_ASR_MODEL") ?? "openai/whisper-large-v3-turbo";
const HF_ENDPOINT_URL = Deno.env.get("HF_ASR_ENDPOINT_URL")
  ?? `https://router.huggingface.co/hf-inference/models/${HF_MODEL}`;
const MAX_AUDIO_BYTES = 15 * 1024 * 1024; // 15 Mo

// ─── Startup check: secrets requis ──────────────────────────────────────
if (!Deno.env.get("HUGGINGFACE_API_KEY")) {
  console.warn(
    "[tajweed-asr-analyze] STARTUP: secret HUGGINGFACE_API_KEY absent — " +
      "toutes les requêtes répondront 503 asr_not_configured (fallback llm_only). " +
      "Ajoutez-le via Project Settings → Edge Functions → Secrets (voir README).",
  );
} else {
  console.log(
    `[tajweed-asr-analyze] STARTUP: HUGGINGFACE_API_KEY détectée — pipeline ASR ${
      ASR_PIPELINE_ENABLED ? "activé" : "désactivé (ENABLE_ASR_PIPELINE=false)"
    }, modèle ${HF_MODEL}.`,
  );
}

type AsrWord = { word: string; start: number | null; end: number | null };

/** Décodage base64 → Uint8Array, par blocs (évite les pics mémoire). */
function base64ToBytes(b64: string): Uint8Array {
  const clean = b64.includes(",") ? b64.slice(b64.indexOf(",") + 1) : b64;
  const bin = atob(clean);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

/** Normalise les différentes formes de réponse HuggingFace ASR. */
function parseHfResponse(raw: unknown): { text: string; words: AsrWord[] } {
  const obj = (raw ?? {}) as Record<string, unknown>;
  const text = String(
    typeof raw === "string" ? raw : (obj.text ?? obj.transcription ?? ""),
  ).trim();

  const chunks = Array.isArray(obj.chunks) ? obj.chunks : [];
  const words: AsrWord[] = chunks.map((c) => {
    const ch = c as { text?: string; timestamp?: [number | null, number | null] };
    return {
      word: String(ch.text ?? "").trim(),
      start: ch.timestamp?.[0] ?? null,
      end: ch.timestamp?.[1] ?? null,
    };
  }).filter((w) => w.word.length > 0);

  return { text, words };
}

/**
 * Indice de qualité (0..1) exposé à l'utilisateur : basé sur la densité de
 * parole détectée et la couverture temporelle. Transparent quand le signal
 * audio est faible — on ne prétend pas à une certitude qu'on n'a pas.
 */
function estimateConfidence(text: string, words: AsrWord[], audioBytes: number): {
  score: number;
  level: "high" | "medium" | "low";
  reason: string | null;
} {
  if (!text || text.length < 3) {
    return { score: 0, level: "low", reason: "audio_unintelligible" };
  }
  const timed = words.filter((w) => w.start !== null && w.end !== null);
  const spoken = timed.reduce((acc, w) => acc + Math.max(0, (w.end! - w.start!)), 0);
  const lastEnd = timed.length ? (timed[timed.length - 1].end ?? 0) : 0;
  const coverage = lastEnd > 0 ? Math.min(1, spoken / lastEnd) : 0.5;
  const density = Math.min(1, text.length / 40); // trop court = peu fiable
  const score = Math.round(Math.max(0, Math.min(1, 0.5 * coverage + 0.5 * density)) * 100) / 100;
  const level = score >= 0.75 ? "high" : score >= 0.45 ? "medium" : "low";
  const reason = level === "low"
    ? (audioBytes < 20_000 ? "audio_too_short" : "weak_signal")
    : null;
  return { score, level, reason };
}

Deno.serve(async (req) => {
  const pre = handleOptions(req); if (pre) return pre;

  try {
    if (req.method !== "POST") throw new HttpError(405, "Méthode non autorisée.");
    const user = await requireUser(req);
    // Live tracking sends ~1 segment / 1.2 s, so this function allows 60 calls per minute.
    await enforceRateLimit(user.id, "tajweed-asr-analyze", 60, 60);

    const body = await readJson<{ audio?: unknown; mimeType?: unknown; surahNumber?: unknown; verseNumber?: unknown; warmup?: unknown }>(req, 22_000_000);
    if (body.surahNumber != null && (!Number.isInteger(body.surahNumber) || (body.surahNumber as number) < 1 || (body.surahNumber as number) > 114)) throw new HttpError(400, "Sourate invalide.");
    if (body.verseNumber != null && (!Number.isInteger(body.verseNumber) || (body.verseNumber as number) < 1 || (body.verseNumber as number) > 286)) throw new HttpError(400, "Verset invalide.");
    if (body.mimeType != null && (typeof body.mimeType !== "string" || body.mimeType.length > 100)) throw new HttpError(400, "Type audio invalide.");

    if (!ASR_PIPELINE_ENABLED) {
      return json(req, { error: "asr_pipeline_disabled", fallback: "llm_only" }, 503);
    }
    const HUGGINGFACE_API_KEY = Deno.env.get("HUGGINGFACE_API_KEY");
    if (!HUGGINGFACE_API_KEY) {
      return json(req, { error: "asr_not_configured", fallback: "llm_only" }, 503);
    }

    if (body.warmup === true) {
      // Réveille l'endpoint (scale-to-zero) sans attendre la réponse.
      fetch(HF_ENDPOINT_URL, { method: "POST", headers: { Authorization: `Bearer ${HUGGINGFACE_API_KEY}`, "Content-Type": "application/json" }, body: JSON.stringify({ inputs: "" }) }).catch(() => {});
      return json(req, { ok: true, warmed: true });
    }
    if (typeof body.audio !== "string" || body.audio.length === 0) throw new HttpError(400, "Audio manquant.");
    const audio = body.audio;
    const surahNumber = (body.surahNumber as number | undefined) ?? null;
    const verseNumber = (body.verseNumber as number | undefined) ?? null;

    let bytes: Uint8Array;
    try {
      bytes = base64ToBytes(audio);
    } catch {
      throw new HttpError(400, "Encodage audio invalide.");
    }
    if (bytes.byteLength === 0) throw new HttpError(400, "Audio vide.");
    if (bytes.byteLength > MAX_AUDIO_BYTES) throw new HttpError(413, "Fichier audio trop volumineux (max 15 Mo).");
    const audioBytes = bytes.byteLength;
    const mimeType = typeof body.mimeType === "string" && /^audio\//.test(body.mimeType) ? body.mimeType : "audio/wav";
    const payload = audio.includes(",") ? audio.slice(audio.indexOf(",") + 1) : audio;

    // ─── Appel ASR (audio en mémoire uniquement) ──────────────────────
    const startedAt = Date.now();
    let hfRaw: unknown;
    try {
      const resp = await fetch(HF_ENDPOINT_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${HUGGINGFACE_API_KEY}`,
          "Content-Type": "application/json",
          "x-wait-for-model": "true",
        },
        // Le modèle Coran (endpoint dédié) ne sait pas renvoyer de minutage : texte seul.
        body: JSON.stringify(Deno.env.get("HF_ASR_ENDPOINT_URL")
          ? { inputs: payload }
          : { inputs: payload, parameters: { return_timestamps: "word" }, mimeType }),
      });
      if (!resp.ok) {
        console.error("[tajweed-asr-analyze] HF error", resp.status, (await resp.text()).slice(0, 300));
        return json(req, { error: "asr_unavailable", status: resp.status, fallback: "llm_only" }, 502);
      }
      hfRaw = await resp.json();
    } catch (e) {
      console.error("[tajweed-asr-analyze] HF exception", e);
      return json(req, { error: "asr_unavailable", fallback: "llm_only" }, 502);
    } finally {
      // Libération explicite de l'audio : rien n'est persisté.
      bytes = new Uint8Array(0);
    }

    const { text, words } = parseHfResponse(hfRaw);
    if (!text) {
      return json(req, {
        error: "empty_transcription",
        confidence: { score: 0, level: "low", reason: "audio_unintelligible" },
      }, 422);
    }

    const confidence = estimateConfidence(text, words, audioBytes);

    return json(req, {
      pipeline: "asr",
      engine: { provider: "huggingface", model: HF_MODEL },
      transcription: text,
      words,
      confidence,
      durationMs: Date.now() - startedAt,
      surahNumber,
      verseNumber,
      audioPersisted: false,
    });
  } catch (err) {
    return errorResponse(req, err);
  }
});
