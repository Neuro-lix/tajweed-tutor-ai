// Analyse d'enveloppe audio : décodage en pics, ré-échantillonnage et score de
// similarité prosodique entre la récitation de l'élève et une référence.
export type Peaks = number[];

/**
 * Decode an audio source into a normalized peaks array (0..1) AND return its duration.
 */
export async function decodeToPeaks(
  source: Blob | string,
  samples: number,
): Promise<{ peaks: Peaks; duration: number }> {
  let arrayBuffer: ArrayBuffer;
  if (typeof source === 'string') {
    const resp = await fetch(source);
    if (!resp.ok) throw new Error(`Fetch failed: ${resp.status}`);
    arrayBuffer = await resp.arrayBuffer();
  } else {
    arrayBuffer = await source.arrayBuffer();
  }

  const Ctx = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctx) throw new Error('AudioContext unsupported');
  const ctx: AudioContext = new Ctx();
  let buffer: AudioBuffer;
  try {
    buffer = await ctx.decodeAudioData(arrayBuffer.slice(0));
  } finally {
    ctx.close().catch(() => null);
  }

  const ch0 = buffer.getChannelData(0);
  const ch1 = buffer.numberOfChannels > 1 ? buffer.getChannelData(1) : null;
  const length = ch0.length;
  const blockSize = Math.max(1, Math.floor(length / samples));
  const peaks: Peaks = new Array(samples).fill(0);

  for (let i = 0; i < samples; i++) {
    const start = i * blockSize;
    const end = Math.min(length, start + blockSize);
    let sum = 0;
    let count = 0;
    for (let j = start; j < end; j++) {
      const a = ch0[j];
      const b = ch1 ? ch1[j] : a;
      const v = (Math.abs(a) + Math.abs(b)) / 2;
      sum += v * v;
      count++;
    }
    peaks[i] = count > 0 ? Math.sqrt(sum / count) : 0;
  }

  let max = 0;
  for (const p of peaks) if (p > max) max = p;
  if (max > 0) for (let i = 0; i < samples; i++) peaks[i] = peaks[i] / max;
  return { peaks, duration: buffer.duration };
}

export function resample(peaks: Peaks, target: number): Peaks {
  if (peaks.length === target) return peaks.slice();
  const out = new Array(target).fill(0);
  for (let i = 0; i < target; i++) {
    const x = (i / (target - 1)) * (peaks.length - 1);
    const i0 = Math.floor(x);
    const i1 = Math.min(peaks.length - 1, i0 + 1);
    const t = x - i0;
    out[i] = peaks[i0] * (1 - t) + peaks[i1] * t;
  }
  return out;
}

/** Pearson correlation between two equal-length arrays. Returns r ∈ [-1, 1]. */
export function pearsonCorrelation(a: number[], b: number[]): number {
  const n = Math.min(a.length, b.length);
  if (n === 0) return 0;
  let meanA = 0;
  let meanB = 0;
  for (let i = 0; i < n; i++) {
    meanA += a[i];
    meanB += b[i];
  }
  meanA /= n;
  meanB /= n;
  let num = 0;
  let denA = 0;
  let denB = 0;
  for (let i = 0; i < n; i++) {
    const da = a[i] - meanA;
    const db = b[i] - meanB;
    num += da * db;
    denA += da * da;
    denB += db * db;
  }
  const den = Math.sqrt(denA * denB);
  return den === 0 ? 0 : num / den;
}

export async function calculateEnvelopeSimilarityScore(
  userAudioBlob: Blob,
  referenceAudioUrl: string,
  samples = 160,
): Promise<number> {
  const [user, reference] = await Promise.all([
    decodeToPeaks(userAudioBlob, samples),
    decodeToPeaks(referenceAudioUrl, samples),
  ]);
  const r = pearsonCorrelation(resample(user.peaks, samples), resample(reference.peaks, samples));
  return Math.max(0, Math.round(r * 100));
}
