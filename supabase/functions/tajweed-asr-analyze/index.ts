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
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

// ─── CORS: env-driven allowlist (no wildcard) ───────────────────────────
const DEFAULT_ALLOWED_ORIGINS = [
  "https://recite-perfectly-bot.lovable.app",
  "https://id-preview--dd06a156-64f5-407d-bf79-94ef3c169108.lovable.app",
  "https://tajweedtutorai.com",
  "https://www.tajweedtutorai.com",
  "http://localhost:8080",
  "http://localhost:5173",
];
const ENV_ALLOWED = (Deno.env.get("ALLOWED_ORIGINS") ?? "")
  .split(",").map((s) => s.trim()).filter(Boolean);
const ALLOWLIST = ENV_ALLOWED.length ? ENV_ALLOWED : DEFAULT_ALLOWED_ORIGINS;
const ALLOW_HEADERS =
  "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version";

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

const json = (body: unknown, status: number, cors: Record<string, string>) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });

// ─── Config ─────────────────────────────────────────────────────────────
/** Bascule ancien pipeline (LLM only) ↔ nouveau pipeline (ASR + LLM). */
const ASR_PIPELINE_ENABLED =
  (Deno.env.get("ENABLE_ASR_PIPELINE") ?? "false").toLowerCase() === "true";
/** Modèle par défaut, surchargeable (Inference Endpoint dédié en Phase 4). */
const HF_MODEL = Deno.env.get("HF_ASR_MODEL") ?? "tarteel-ai/whisper-base-ar-quran";
const HF_ENDPOINT_URL = Deno.env.get("HF_ASR_ENDPOINT_URL")
  ?? `https://api-inference.huggingface.co/models/${HF_MODEL}`;
const MAX_AUDIO_BYTES = 12 * 1024 * 1024; // 12 MB

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

serve(async (req) => {
  const corsHeaders = buildCors(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405, corsHeaders);

  try {
    // ─── Auth ─────────────────────────────────────────────────────────
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return json({ error: "unauthorized" }, 401, corsHeaders);
    }
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData?.user) return json({ error: "unauthorized" }, 401, corsHeaders);
    const userId = userData.user.id;

    // ─── Rate limit (réutilise la RPC existante) ──────────────────────
    const { data: rl } = await supabase.rpc("check_and_increment_rate_limit", {
      _user_id: userId,
      _endpoint: "tajweed-asr-analyze",
      _limit: 30,
      _window_minutes: 10,
    });
    const limit = rl as { allowed?: boolean } | null;
    if (limit && limit.allowed === false) {
      return json({ error: "rate_limited" }, 429, corsHeaders);
    }

    // ─── Flag de bascule ──────────────────────────────────────────────
    if (!ASR_PIPELINE_ENABLED) {
      return json(
        { error: "asr_pipeline_disabled", fallback: "llm_only" },
        503,
        corsHeaders,
      );
    }
    const HUGGINGFACE_API_KEY = Deno.env.get("HUGGINGFACE_API_KEY");
    if (!HUGGINGFACE_API_KEY) {
      return json(
        { error: "asr_not_configured", fallback: "llm_only" },
        503,
        corsHeaders,
      );
    }

    // ─── Entrée ───────────────────────────────────────────────────────
    const body = await req.json().catch(() => null) as
      | { audio?: string; mimeType?: string; surahNumber?: number; verseNumber?: number }
      | null;
    if (!body?.audio || typeof body.audio !== "string") {
      return json({ error: "missing_audio" }, 400, corsHeaders);
    }

    let bytes: Uint8Array;
    try {
      bytes = base64ToBytes(body.audio);
    } catch {
      return json({ error: "invalid_audio_encoding" }, 400, corsHeaders);
    }
    if (bytes.byteLength === 0) return json({ error: "empty_audio" }, 400, corsHeaders);
    if (bytes.byteLength > MAX_AUDIO_BYTES) {
      return json({ error: "audio_too_large" }, 413, corsHeaders);
    }
    const audioBytes = bytes.byteLength;
    const mimeType = body.mimeType && /^audio\//.test(body.mimeType)
      ? body.mimeType
      : "audio/wav";

    // ─── Appel ASR (audio en mémoire uniquement) ──────────────────────
    const startedAt = Date.now();
    let hfRaw: unknown;
    try {
      const resp = await fetch(HF_ENDPOINT_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${HUGGINGFACE_API_KEY}`,
          "Content-Type": mimeType,
          "x-wait-for-model": "true",
        },
        body: bytes,
      });
      if (!resp.ok) {
        const detail = (await resp.text()).slice(0, 300);
        console.error("[tajweed-asr-analyze] HF error", resp.status, detail);
        return json(
          { error: "asr_unavailable", status: resp.status, fallback: "llm_only" },
          502,
          corsHeaders,
        );
      }
      hfRaw = await resp.json();
    } catch (e) {
      console.error("[tajweed-asr-analyze] HF exception", e);
      return json({ error: "asr_unavailable", fallback: "llm_only" }, 502, corsHeaders);
    } finally {
      // Libération explicite de l'audio : rien n'est persisté.
      bytes = new Uint8Array(0);
    }

    const { text, words } = parseHfResponse(hfRaw);
    if (!text) {
      return json(
        {
          error: "empty_transcription",
          confidence: { score: 0, level: "low", reason: "audio_unintelligible" },
        },
        422,
        corsHeaders,
      );
    }

    const confidence = estimateConfidence(text, words, audioBytes);

    return json(
      {
        pipeline: "asr",
        engine: { provider: "huggingface", model: HF_MODEL },
        transcription: text,
        words,
        confidence,
        durationMs: Date.now() - startedAt,
        surahNumber: body.surahNumber ?? null,
        verseNumber: body.verseNumber ?? null,
        audioPersisted: false,
      },
      200,
      corsHeaders,
    );
  } catch (e) {
    console.error("[tajweed-asr-analyze] unexpected", e);
    return json({ error: "internal_error", fallback: "llm_only" }, 500, corsHeaders);
  }
});
