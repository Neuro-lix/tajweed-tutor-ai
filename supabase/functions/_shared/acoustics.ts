// Pure acoustic measurements (no Deno/Node APIs) — unit-tested with vitest.
// Signal-level checks for ghunna (nasal energy) and qalqala (burst after closure),
// computed on word segments delimited by ASR timestamps.

export type PcmAudio = { samples: Float32Array; sampleRate: number };

export type AcousticResult = {
  word: string;
  ruleType: "ghunna" | "qalqala";
  ok: boolean;
  severity: "minor" | "major";
  ruleDescription: string;
  correction: string;
  confidence: "measured";
  measurement: Record<string, number>;
};

/** Decode a PCM 16-bit WAV (mono or stereo → mono). Returns null if not a PCM16 WAV. */
export const decodeWavPcm16 = (bytes: Uint8Array): PcmAudio | null => {
  if (bytes.length < 44) return null;
  const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const tag = (o: number) => String.fromCharCode(bytes[o], bytes[o + 1], bytes[o + 2], bytes[o + 3]);
  if (tag(0) !== "RIFF" || tag(8) !== "WAVE") return null;
  let off = 12, channels = 1, sampleRate = 16000, bits = 16, fmt = 1;
  while (off + 8 <= bytes.length) {
    const id = tag(off);
    const size = dv.getUint32(off + 4, true);
    const body = off + 8;
    if (id === "fmt ") {
      fmt = dv.getUint16(body, true);
      channels = dv.getUint16(body + 2, true);
      sampleRate = dv.getUint32(body + 4, true);
      bits = dv.getUint16(body + 14, true);
    } else if (id === "data") {
      if (fmt !== 1 || bits !== 16) return null;
      const end = Math.min(bytes.length, body + size);
      const frames = Math.floor((end - body) / (2 * channels));
      const samples = new Float32Array(frames);
      for (let i = 0; i < frames; i++) {
        let s = 0;
        for (let c = 0; c < channels; c++) s += dv.getInt16(body + (i * channels + c) * 2, true);
        samples[i] = s / channels / 32768;
      }
      return { samples, sampleRate };
    }
    off = body + size + (size % 2);
  }
  return null;
};

export const rms = (x: Float32Array, from = 0, to = x.length): number => {
  let s = 0;
  const n = Math.max(1, to - from);
  for (let i = from; i < to; i++) s += x[i] * x[i];
  return Math.sqrt(s / n);
};

/** Goertzel power at one frequency. */
const goertzel = (x: Float32Array, from: number, to: number, freq: number, sr: number): number => {
  const k = (2 * Math.PI * freq) / sr;
  const coeff = 2 * Math.cos(k);
  let s1 = 0, s2 = 0;
  for (let i = from; i < to; i++) {
    const s0 = x[i] + coeff * s1 - s2;
    s2 = s1; s1 = s0;
  }
  return s1 * s1 + s2 * s2 - coeff * s1 * s2;
};

/** Mean power of a frequency band sampled every `step` Hz. */
export const bandPower = (x: Float32Array, from: number, to: number, sr: number, lo: number, hi: number, step = 50): number => {
  let p = 0, n = 0;
  for (let f = lo; f <= hi; f += step) { p += goertzel(x, from, to, f, sr); n++; }
  return n ? p / n : 0;
};

/**
 * Nasality ratio: energy in the nasal murmur band (200–450 Hz) vs. the oral band (1–3 kHz).
 * Ghunna produces a strong low murmur with damped higher formants → high ratio.
 */
export const nasalRatio = (x: Float32Array, from: number, to: number, sr: number): number => {
  const low = bandPower(x, from, to, sr, 200, 450, 25);
  const high = bandPower(x, from, to, sr, 1000, 3000, 100);
  return high <= 1e-12 ? (low > 0 ? 100 : 0) : low / high;
};

/** Short-time RMS envelope (frame = 10 ms). */
export const envelope = (x: Float32Array, from: number, to: number, sr: number, frameMs = 10): number[] => {
  const f = Math.max(1, Math.round((sr * frameMs) / 1000));
  const out: number[] = [];
  for (let i = from; i + f <= to; i += f) out.push(rms(x, i, i + f));
  return out;
};

/**
 * Qalqala burst: in the tail of the word, look for a closure (near-silence)
 * followed within ≤ 60 ms by a short energy spike.
 */
export const detectBurst = (x: Float32Array, from: number, to: number, sr: number) => {
  const env = envelope(x, from, to, sr);
  if (env.length < 6) return { found: false, burstRatio: 0, closureMs: 0 };
  const tailStart = Math.floor(env.length * 0.4);
  const peak = Math.max(...env) || 1e-9;
  const silence = peak * 0.15;
  let best = 0, closureMs = 0;
  for (let i = tailStart; i < env.length - 1; i++) {
    if (env[i] > silence) continue;
    let j = i; while (j < env.length && env[j] <= silence) j++;
    const closure = (j - i) * 10;
    const after = env.slice(j, j + 6);
    if (!after.length) break;
    const spike = Math.max(...after);
    const ratio = spike / Math.max(env[i], 1e-6);
    if (closure >= 10 && ratio > best) { best = ratio; closureMs = closure; }
    i = j;
  }
  return { found: best >= 4, burstRatio: +best.toFixed(2), closureMs };
};

// ─── Rules ────────────────────────────────────────────────────────────────
const GHUNNA_WORD = /[نم][\u064B-\u0650]?\u0651|\u0651[نم]/; // nūn/mīm mushaddad
const QALQALA_SUKUN = /[قطبجد][\u0652\u06E1]/;
export const NASAL_MIN_RATIO = 1.5;

export type TimedWord = { word: string; start: number | null; end: number | null };

export const measureAcoustics = (audio: PcmAudio, words: TimedWord[]): AcousticResult[] => {
  const { samples, sampleRate: sr } = audio;
  const out: AcousticResult[] = [];
  for (const w of words) {
    if (w.start == null || w.end == null || w.end <= w.start) continue;
    const from = Math.max(0, Math.floor(w.start * sr));
    const to = Math.min(samples.length, Math.ceil(w.end * sr));
    if (to - from < sr * 0.08) continue;
    if (GHUNNA_WORD.test(w.word)) {
      const ratio = nasalRatio(samples, from, to, sr);
      const ok = ratio >= NASAL_MIN_RATIO;
      out.push({
        word: w.word, ruleType: "ghunna", ok, severity: "minor", confidence: "measured",
        ruleDescription: ok ? "Ghunna présente (résonance nasale mesurée)" : "Ghunna faible : résonance nasale insuffisante",
        correction: "Fais résonner le son dans le nez pendant 2 temps.",
        measurement: { nasalRatio: +ratio.toFixed(2), minRatio: NASAL_MIN_RATIO, durationSec: +(w.end - w.start).toFixed(2) },
      });
    }
    if (QALQALA_SUKUN.test(w.word)) {
      const b = detectBurst(samples, from, to, sr);
      out.push({
        word: w.word, ruleType: "qalqala", ok: b.found, severity: "minor", confidence: "measured",
        ruleDescription: b.found ? "Rebond de qalqala mesuré" : "Rebond de qalqala non détecté dans le signal",
        correction: "Libère la lettre avec un léger rebond sonore.",
        measurement: { burstRatio: b.burstRatio, closureMs: b.closureMs, minBurstRatio: 4 },
      });
    }
  }
  return out;
};

export const base64ToBytes = (b64: string): Uint8Array => {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
};
