import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';

interface WaveformOverlayProps {
  userAudioBlob: Blob | null;
  referenceAudioUrl: string;
  /** Sample resolution along x-axis */
  samples?: number;
  /** Threshold (0..1) above which the divergence is highlighted */
  divergenceThreshold?: number;
}

type Peaks = number[];

/**
 * Decode an audio source into a normalized peaks array (0..1).
 * Uses an offline AudioContext to extract envelope without playing audio.
 */
async function decodeToPeaks(
  source: Blob | string,
  samples: number,
): Promise<Peaks> {
  const AudioCtor =
    (window as any).OfflineAudioContext ||
    (window as any).webkitOfflineAudioContext ||
    (window as any).AudioContext ||
    (window as any).webkitAudioContext;
  if (!AudioCtor) throw new Error('AudioContext unsupported');

  let arrayBuffer: ArrayBuffer;
  if (typeof source === 'string') {
    const resp = await fetch(source);
    if (!resp.ok) throw new Error(`Fetch failed: ${resp.status}`);
    arrayBuffer = await resp.arrayBuffer();
  } else {
    arrayBuffer = await source.arrayBuffer();
  }

  // Use a regular AudioContext just for decoding
  const Ctx =
    (window as any).AudioContext || (window as any).webkitAudioContext;
  const ctx: AudioContext = new Ctx();
  let buffer: AudioBuffer;
  try {
    buffer = await ctx.decodeAudioData(arrayBuffer.slice(0));
  } finally {
    ctx.close().catch(() => null);
  }

  // Mix down to mono
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
    const rms = count > 0 ? Math.sqrt(sum / count) : 0;
    peaks[i] = rms;
  }

  // Normalize to 0..1
  let max = 0;
  for (const p of peaks) if (p > max) max = p;
  if (max > 0) for (let i = 0; i < samples; i++) peaks[i] = peaks[i] / max;
  return peaks;
}

/**
 * Resample peaks to a target length using simple linear interpolation.
 * This lets us align two recordings of slightly different durations.
 */
function resample(peaks: Peaks, target: number): Peaks {
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

export const WaveformOverlay: React.FC<WaveformOverlayProps> = ({
  userAudioBlob,
  referenceAudioUrl,
  samples = 160,
  divergenceThreshold = 0.28,
}) => {
  const [userPeaks, setUserPeaks] = useState<Peaks | null>(null);
  const [refPeaks, setRefPeaks] = useState<Peaks | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    if (!userAudioBlob || !referenceAudioUrl) {
      setUserPeaks(null);
      setRefPeaks(null);
      return;
    }
    setLoading(true);
    setError(null);
    Promise.all([
      decodeToPeaks(userAudioBlob, samples),
      decodeToPeaks(referenceAudioUrl, samples),
    ])
      .then(([u, r]) => {
        if (cancelled) return;
        setUserPeaks(u);
        setRefPeaks(r);
      })
      .catch((e) => {
        if (cancelled) return;
        console.warn('[WaveformOverlay] decode error', e);
        setError('Décodage audio impossible');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [userAudioBlob, referenceAudioUrl, samples]);

  const divergencePoints = useMemo(() => {
    if (!userPeaks || !refPeaks) return [];
    // Align by resampling both to same length (already same `samples`)
    const a = resample(userPeaks, samples);
    const b = resample(refPeaks, samples);
    const points: { idx: number; delta: number }[] = [];
    for (let i = 0; i < samples; i++) {
      const delta = Math.abs(a[i] - b[i]);
      if (delta >= divergenceThreshold) {
        points.push({ idx: i, delta });
      }
    }
    return points;
  }, [userPeaks, refPeaks, samples, divergenceThreshold]);

  // Group consecutive divergent samples into highlight zones
  const zones = useMemo(() => {
    if (divergencePoints.length === 0) return [];
    const out: { start: number; end: number; severity: number }[] = [];
    let start = divergencePoints[0].idx;
    let prev = start;
    let maxDelta = divergencePoints[0].delta;
    for (let k = 1; k < divergencePoints.length; k++) {
      const { idx, delta } = divergencePoints[k];
      if (idx === prev + 1) {
        prev = idx;
        if (delta > maxDelta) maxDelta = delta;
      } else {
        out.push({ start, end: prev, severity: maxDelta });
        start = idx;
        prev = idx;
        maxDelta = delta;
      }
    }
    out.push({ start, end: prev, severity: maxDelta });
    return out;
  }, [divergencePoints]);

  const width = 600;
  const height = 100;
  const mid = height / 2;

  const buildPath = (peaks: Peaks): string => {
    if (peaks.length === 0) return '';
    const stepX = width / (peaks.length - 1);
    let top = `M 0 ${mid - peaks[0] * mid}`;
    let bottom = '';
    for (let i = 1; i < peaks.length; i++) {
      const x = i * stepX;
      top += ` L ${x} ${mid - peaks[i] * mid}`;
    }
    for (let i = peaks.length - 1; i >= 0; i--) {
      const x = i * stepX;
      bottom += ` L ${x} ${mid + peaks[i] * mid}`;
    }
    return `${top} ${bottom} Z`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Analyse fine en cours…
      </div>
    );
  }

  if (error || !userPeaks || !refPeaks) {
    return error ? (
      <p className="text-xs text-muted-foreground text-center py-2">{error}</p>
    ) : null;
  }

  return (
    <div ref={containerRef} className="space-y-2">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span className="flex items-center gap-2">
          <span className="inline-block w-3 h-3 rounded-sm bg-primary/70" />
          Vous
        </span>
        <span className="flex items-center gap-2">
          <span className="inline-block w-3 h-3 rounded-sm bg-gold-warm/70" />
          Référence
        </span>
        <span className="flex items-center gap-2">
          <span className="inline-block w-3 h-3 rounded-sm bg-destructive/60" />
          Divergence makhārij
        </span>
      </div>

      <div className="relative rounded-lg bg-muted/30 border border-border overflow-hidden">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          preserveAspectRatio="none"
          className="w-full h-24"
        >
          {/* Divergence highlight zones */}
          {zones.map((z, i) => {
            const stepX = width / (samples - 1);
            const x = z.start * stepX;
            const w = Math.max(2, (z.end - z.start + 1) * stepX);
            const opacity = 0.18 + Math.min(0.32, z.severity * 0.4);
            return (
              <rect
                key={i}
                x={x}
                y={0}
                width={w}
                height={height}
                fill="hsl(var(--destructive))"
                opacity={opacity}
              />
            );
          })}

          {/* Reference waveform (gold) */}
          <path
            d={buildPath(refPeaks)}
            fill="hsl(var(--gold-warm, 38 92% 50%))"
            opacity={0.45}
          />

          {/* User waveform (primary) */}
          <path
            d={buildPath(userPeaks)}
            fill="hsl(var(--primary))"
            opacity={0.55}
          />

          {/* Center axis */}
          <line
            x1={0}
            y1={mid}
            x2={width}
            y2={mid}
            stroke="hsl(var(--border))"
            strokeWidth={0.5}
          />

          {/* Divergence markers (top labels) */}
          {zones.map((z, i) => {
            const stepX = width / (samples - 1);
            const cx = ((z.start + z.end) / 2) * stepX;
            return (
              <g key={`m-${i}`}>
                <circle
                  cx={cx}
                  cy={6}
                  r={3}
                  fill="hsl(var(--destructive))"
                />
              </g>
            );
          })}
        </svg>
      </div>

      <p className="text-xs text-muted-foreground text-center">
        {zones.length === 0
          ? '✓ Aucune divergence majeure détectée — articulation fidèle'
          : `${zones.length} zone${zones.length > 1 ? 's' : ''} de divergence — vérifie les makhārij sur les segments surlignés`}
      </p>
    </div>
  );
};
