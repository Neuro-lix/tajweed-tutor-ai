import { describe, it, expect } from 'vitest';
import { nasalRatio, detectBurst, measureAcoustics, decodeWavPcm16 } from '../../supabase/functions/_shared/acoustics';

const SR = 16000;
const tone = (freqs: number[], sec: number) => {
  const n = Math.round(SR * sec);
  const x = new Float32Array(n);
  for (let i = 0; i < n; i++) for (const f of freqs) x[i] += Math.sin((2 * Math.PI * f * i) / SR) / freqs.length;
  return x;
};
const concat = (...a: Float32Array[]) => {
  const out = new Float32Array(a.reduce((s, x) => s + x.length, 0));
  let o = 0; for (const x of a) { out.set(x, o); o += x.length; }
  return out;
};

describe('acoustics', () => {
  it('nasal murmur gives a high nasal ratio, oral vowel a low one', () => {
    const nasal = tone([300], 0.3);
    const oral = tone([1500, 2500], 0.3);
    expect(nasalRatio(nasal, 0, nasal.length, SR)).toBeGreaterThan(1.5);
    expect(nasalRatio(oral, 0, oral.length, SR)).toBeLessThan(1.5);
  });

  it('detects a qalqala burst after a closure', () => {
    const x = concat(tone([500], 0.15), new Float32Array(SR * 0.04), tone([800], 0.03).map((v) => v * 0.8));
    expect(detectBurst(x, 0, x.length, SR).found).toBe(true);
    const flat = tone([500], 0.25);
    expect(detectBurst(flat, 0, flat.length, SR).found).toBe(false);
  });

  it('measureAcoustics flags weak ghunna and passes strong ghunna', () => {
    const audio = { samples: concat(tone([300], 0.3), tone([2000], 0.3)), sampleRate: SR };
    const res = measureAcoustics(audio, [
      { word: 'إِنَّ', start: 0, end: 0.3 },
      { word: 'ثُمَّ', start: 0.3, end: 0.6 },
    ]);
    expect(res[0].ok).toBe(true);
    expect(res[1].ok).toBe(false);
  });

  it('decodes a PCM16 WAV', () => {
    const n = 160, buf = new ArrayBuffer(44 + n * 2), dv = new DataView(buf);
    const w = (o: number, s: string) => [...s].forEach((c, i) => dv.setUint8(o + i, c.charCodeAt(0)));
    w(0, 'RIFF'); dv.setUint32(4, 36 + n * 2, true); w(8, 'WAVE'); w(12, 'fmt ');
    dv.setUint32(16, 16, true); dv.setUint16(20, 1, true); dv.setUint16(22, 1, true);
    dv.setUint32(24, SR, true); dv.setUint32(28, SR * 2, true); dv.setUint16(32, 2, true); dv.setUint16(34, 16, true);
    w(36, 'data'); dv.setUint32(40, n * 2, true); dv.setInt16(44, 16384, true);
    const a = decodeWavPcm16(new Uint8Array(buf));
    expect(a?.sampleRate).toBe(SR);
    expect(a?.samples[0]).toBeCloseTo(0.5);
  });
});
