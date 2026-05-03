import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Download, Loader2, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface WaveformOverlayProps {
  userAudioBlob: Blob | null;
  referenceAudioUrl: string;
  onSimilarityScore?: (score: number) => void;
  /** Sample resolution along x-axis */
  samples?: number;
  /** Threshold (0..1) above which the divergence is highlighted */
  divergenceThreshold?: number;
}

type Peaks = number[];
type DivergenceZone = { start: number; end: number; severity: number };

/**
 * Decode an audio source into a normalized peaks array (0..1) AND return its duration.
 */
async function decodeToPeaks(
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

  const Ctx = (window as any).AudioContext || (window as any).webkitAudioContext;
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

/** Pearson correlation between two equal-length arrays. Returns r ∈ [-1, 1]. */
function pearsonCorrelation(a: number[], b: number[]): number {
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

interface WaveformChartProps {
  userPeaks: Peaks;
  refPeaks: Peaks;
  zones: DivergenceZone[];
  samples: number;
  duration: number;
  showTimeline?: boolean;
  height?: number;
  className?: string;
}

const WaveformChart: React.FC<WaveformChartProps> = ({
  userPeaks,
  refPeaks,
  zones,
  samples,
  duration,
  showTimeline,
  height = 100,
  className,
}) => {
  const width = 600;
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

  // Build timeline ticks — aim for ~6-8 labels
  const ticks = useMemo(() => {
    if (!duration || duration <= 0) return [];
    const target = 6;
    const rawStep = duration / target;
    // round to a "nice" step: 0.5, 1, 2, 5
    const niceSteps = [0.5, 1, 2, 5, 10];
    const step = niceSteps.find((s) => s >= rawStep) ?? Math.ceil(rawStep);
    const out: { t: number; x: number }[] = [];
    for (let t = 0; t <= duration + 1e-3; t += step) {
      out.push({ t, x: (t / duration) * width });
    }
    return out;
  }, [duration]);

  const timelineHeight = showTimeline ? 16 : 0;
  const totalHeight = height + timelineHeight;

  return (
    <div className={`relative rounded-lg bg-muted/30 border border-border overflow-hidden ${className ?? ''}`}>
      <svg
        viewBox={`0 0 ${width} ${totalHeight}`}
        preserveAspectRatio="none"
        className="w-full"
        style={{ height: '100%' }}
      >
        <g transform={`translate(0, ${timelineHeight})`}>
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
          <path d={buildPath(refPeaks)} fill="hsl(var(--gold-warm, 38 92% 50%))" opacity={0.45} />

          {/* User waveform (primary) */}
          <path d={buildPath(userPeaks)} fill="hsl(var(--primary))" opacity={0.55} />

          {/* Center axis */}
          <line x1={0} y1={mid} x2={width} y2={mid} stroke="hsl(var(--border))" strokeWidth={0.5} />

          {/* Divergence markers */}
          {zones.map((z, i) => {
            const stepX = width / (samples - 1);
            const cx = ((z.start + z.end) / 2) * stepX;
            return (
              <circle key={`m-${i}`} cx={cx} cy={6} r={3} fill="hsl(var(--destructive))" />
            );
          })}
        </g>

        {/* Timeline (top) */}
        {showTimeline && ticks.length > 0 && (
          <g>
            <line x1={0} y1={timelineHeight - 0.5} x2={width} y2={timelineHeight - 0.5} stroke="hsl(var(--border))" strokeWidth={0.5} />
            {ticks.map((tk, i) => (
              <g key={i}>
                <line x1={tk.x} y1={timelineHeight - 4} x2={tk.x} y2={timelineHeight} stroke="hsl(var(--muted-foreground))" strokeWidth={0.5} />
                <text
                  x={Math.min(width - 14, Math.max(2, tk.x + 2))}
                  y={timelineHeight - 6}
                  fontSize={9}
                  fill="hsl(var(--muted-foreground))"
                  fontFamily="monospace"
                >
                  {tk.t.toFixed(1)}s
                </text>
              </g>
            ))}
          </g>
        )}
      </svg>
    </div>
  );
};

export const WaveformOverlay: React.FC<WaveformOverlayProps> = ({
  userAudioBlob,
  referenceAudioUrl,
  onSimilarityScore,
  samples = 160,
  divergenceThreshold = 0.28,
}) => {
  const [userPeaks, setUserPeaks] = useState<Peaks | null>(null);
  const [refPeaks, setRefPeaks] = useState<Peaks | null>(null);
  const [userDuration, setUserDuration] = useState(0);
  const [refDuration, setRefDuration] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [zoomOpen, setZoomOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const exportRef = useRef<HTMLDivElement>(null);

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
        setUserPeaks(u.peaks);
        setUserDuration(u.duration);
        setRefPeaks(r.peaks);
        setRefDuration(r.duration);
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

  const zones = useMemo(() => {
    if (divergencePoints.length === 0) return [];
    const out: DivergenceZone[] = [];
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

  // Similarity score — Pearson correlation mapped to 0..100
  const similarityScore = useMemo(() => {
    if (!userPeaks || !refPeaks) return null;
    const a = resample(userPeaks, samples);
    const b = resample(refPeaks, samples);
    const r = pearsonCorrelation(a, b);
    // Map [-1..1] to [0..100], clamped at 0
    const score = Math.max(0, Math.round(r * 100));
    return score;
  }, [userPeaks, refPeaks, samples]);

  useEffect(() => {
    if (similarityScore !== null) {
      onSimilarityScore?.(similarityScore);
    }
  }, [onSimilarityScore, similarityScore]);

  const exportZoomPng = async () => {
    const svg = exportRef.current?.querySelector('svg');
    if (!svg || similarityScore === null) return;

    const serializer = new XMLSerializer();
    const styles = getComputedStyle(document.documentElement);
    const embeddedVars = `
      <style>
        :root {
          --background: ${styles.getPropertyValue('--background').trim()};
          --foreground: ${styles.getPropertyValue('--foreground').trim()};
          --primary: ${styles.getPropertyValue('--primary').trim()};
          --gold-warm: ${styles.getPropertyValue('--gold-warm').trim()};
          --destructive: ${styles.getPropertyValue('--destructive').trim()};
          --border: ${styles.getPropertyValue('--border').trim()};
          --muted-foreground: ${styles.getPropertyValue('--muted-foreground').trim()};
        }
      </style>`;
    const svgText = serializer.serializeToString(svg).replace('>', `>${embeddedVars}`);
    const svgBlob = new Blob([svgText], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    const image = new Image();
    image.onload = () => {
      const scale = 2;
      const canvas = document.createElement('canvas');
      canvas.width = 1200;
      canvas.height = 940;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const background = `hsl(${styles.getPropertyValue('--background').trim()})`;
      const foreground = `hsl(${styles.getPropertyValue('--foreground').trim()})`;
      const muted = `hsl(${styles.getPropertyValue('--muted-foreground').trim()})`;

      ctx.scale(scale, scale);
      ctx.fillStyle = background;
      ctx.fillRect(0, 0, canvas.width / scale, canvas.height / scale);
      ctx.fillStyle = foreground;
      ctx.font = '700 24px serif';
      ctx.fillText('Comparaison fine — waveform tajwīd', 24, 40);
      ctx.font = '600 16px serif';
      ctx.fillText(`Similarité d'enveloppe : ${similarityScore}% · ${scoreLabel}`, 24, 66);
      ctx.fillStyle = muted;
      ctx.font = '13px serif';
      ctx.fillText(`Vous ${userDuration.toFixed(2)}s · Référence ${refDuration.toFixed(2)}s · ${zones.length} zone${zones.length > 1 ? 's' : ''} de divergence`, 24, 88);
      ctx.drawImage(image, 24, 112, 552, 280);
      ctx.fillStyle = muted;
      ctx.font = '12px serif';
      ctx.fillText('Bleu : élève · Or : référence · Rouge : divergence makhārij', 24, 420);

      const link = document.createElement('a');
      link.download = `comparaison-waveform-${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      URL.revokeObjectURL(url);
    };
    image.src = url;
  };

  const scoreColor =
    similarityScore === null
      ? 'text-muted-foreground'
      : similarityScore >= 80
        ? 'text-primary'
        : similarityScore >= 60
          ? 'text-gold-warm'
          : 'text-destructive';

  const scoreLabel =
    similarityScore === null
      ? ''
      : similarityScore >= 80
        ? 'Excellente fidélité'
        : similarityScore >= 60
          ? 'Fidélité correcte'
          : 'Fidélité faible';

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

  // Use the longer duration as reference for the timeline (both waveforms are stretched to fit the SVG width)
  const displayDuration = Math.max(userDuration, refDuration);

  return (
    <div ref={containerRef} className="space-y-2">
      <div className="flex items-center justify-between text-xs text-muted-foreground flex-wrap gap-2">
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

      <div className="h-24">
        <WaveformChart
          userPeaks={userPeaks}
          refPeaks={refPeaks}
          zones={zones}
          samples={samples}
          duration={displayDuration}
          height={100}
        />
      </div>

      {/* Score + zoom row */}
      <div className="flex items-center justify-between gap-3 pt-1">
        <div className="flex items-baseline gap-2">
          <span className="text-xs text-muted-foreground">Similarité d'enveloppe</span>
          <span className={`text-2xl font-bold tabular-nums ${scoreColor}`}>
            {similarityScore}
            <span className="text-sm font-normal">%</span>
          </span>
          <span className={`text-xs ${scoreColor}`}>· {scoreLabel}</span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setZoomOpen(true)}
          className="text-xs h-8"
        >
          <Maximize2 className="w-3 h-3 mr-1" />
          Zoom
        </Button>
      </div>

      <p className="text-xs text-muted-foreground text-center">
        {zones.length === 0
          ? '✓ Aucune divergence majeure détectée — articulation fidèle'
          : `${zones.length} zone${zones.length > 1 ? 's' : ''} de divergence — vérifie les makhārij sur les segments surlignés`}
      </p>

      {/* Zoom dialog */}
      <Dialog open={zoomOpen} onOpenChange={setZoomOpen}>
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <div className="flex items-start justify-between gap-3">
              <DialogTitle className="flex items-center gap-3 flex-wrap">
                <span>Comparaison fine — analyse détaillée</span>
                <span className={`text-base font-bold tabular-nums ${scoreColor}`}>
                  {similarityScore}% · {scoreLabel}
                </span>
              </DialogTitle>
              <Button variant="outline" size="sm" onClick={exportZoomPng} className="text-xs shrink-0">
                <Download className="w-3 h-3 mr-1" />
                Exporter PNG
              </Button>
            </div>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground flex-wrap gap-3">
              <span className="flex items-center gap-2">
                <span className="inline-block w-3 h-3 rounded-sm bg-primary/70" />
                Vous · {userDuration.toFixed(2)}s
              </span>
              <span className="flex items-center gap-2">
                <span className="inline-block w-3 h-3 rounded-sm bg-gold-warm/70" />
                Référence · {refDuration.toFixed(2)}s
              </span>
              <span className="flex items-center gap-2">
                <span className="inline-block w-3 h-3 rounded-sm bg-destructive/60" />
                {zones.length} zone{zones.length > 1 ? 's' : ''} de divergence
              </span>
            </div>

            <div ref={exportRef} className="h-72">
              <WaveformChart
                userPeaks={userPeaks}
                refPeaks={refPeaks}
                zones={zones}
                samples={samples}
                duration={displayDuration}
                height={260}
                showTimeline
              />
            </div>

            <div className="rounded-lg border border-border bg-muted/30 p-3 text-xs text-muted-foreground space-y-1">
              <p>
                <strong className="text-foreground">Lecture :</strong> chaque zone rouge marque un segment où l'amplitude de votre récitation diverge significativement de la référence — souvent symptôme d'un makhraj imprécis, d'un madd manquant ou d'une ghunna incomplète.
              </p>
              <p>
                <strong className="text-foreground">Score de similarité :</strong> corrélation de Pearson entre les enveloppes (0% = aucune corrélation, 100% = parfaitement corrélée). C'est un indicateur prosodique, complémentaire au score tajwid IA.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
