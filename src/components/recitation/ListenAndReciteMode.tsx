import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Headphones, Play, Pause, Mic, RotateCcw, ChevronRight, CheckCircle2, Repeat } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Fragment {
  index: number;
  text: string;
  audioUrl: string; // sliced audio url (we use full ayah audio + range — kept simple here)
}

interface ListenAndReciteModeProps {
  surahNumber: number;
  verseNumber: number;
  verseText: string;
  /** Full ayah audio URL (alafasy by default) */
  referenceAudioUrl: string;
  /** Triggered when user wants to record their own attempt for current fragment */
  onRecordFragment?: (fragmentIndex: number, fragmentText: string) => void;
  /** Optional disable */
  isAnalyzing?: boolean;
}

/**
 * "Écoute attentive" — split a verse into fragments (by Arabic word groups),
 * play each fragment from the reference reciter, then prompt the student to
 * recite it. Helps memorisation through repetition (talqīn method).
 *
 * Heuristic split: groups of 3-4 words. For short verses → no split.
 */
export const ListenAndReciteMode: React.FC<ListenAndReciteModeProps> = ({
  surahNumber,
  verseNumber,
  verseText,
  referenceAudioUrl,
  onRecordFragment,
  isAnalyzing,
}) => {
  const [enabled, setEnabled] = useState(false);
  const [fragments, setFragments] = useState<Fragment[]>([]);
  const [activeIdx, setActiveIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [completedFragments, setCompletedFragments] = useState<Set<number>>(new Set());
  const [autoLoop, setAutoLoop] = useState(false);
  const [repsTarget, setRepsTarget] = useState(3);
  const [repsByFragment, setRepsByFragment] = useState<Record<number, number>>({});
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const autoLoopRef = useRef(false);
  const repsTargetRef = useRef(3);
  const activeIdxRef = useRef(0);

  // keep refs in sync (used inside audio.onended which captures stale state)
  useEffect(() => { autoLoopRef.current = autoLoop; }, [autoLoop]);
  useEffect(() => { repsTargetRef.current = repsTarget; }, [repsTarget]);
  useEffect(() => { activeIdxRef.current = activeIdx; }, [activeIdx]);

  // Build fragments from verse text
  useEffect(() => {
    if (!verseText) {
      setFragments([]);
      return;
    }
    const words = verseText.trim().split(/\s+/);
    const groupSize = words.length <= 5 ? words.length : Math.max(3, Math.ceil(words.length / Math.ceil(words.length / 4)));
    const groups: Fragment[] = [];
    for (let i = 0; i < words.length; i += groupSize) {
      const slice = words.slice(i, i + groupSize).join(' ');
      groups.push({
        index: groups.length,
        text: slice,
        audioUrl: referenceAudioUrl,
      });
    }
    setFragments(groups);
    setActiveIdx(0);
    setCompletedFragments(new Set());
    setRepsByFragment({});
  }, [verseText, referenceAudioUrl, surahNumber, verseNumber]);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const playFragment = async (idx: number) => {
    const fragment = fragments[idx];
    if (!fragment) return;
    if (audioRef.current) {
      audioRef.current.pause();
    }
    const audio = new Audio(fragment.audioUrl);
    audioRef.current = audio;
    audio.onended = () => {
      // increment reps counter
      setRepsByFragment((prev) => {
        const idxNow = activeIdxRef.current;
        const next = { ...prev, [idxNow]: (prev[idxNow] || 0) + 1 };
        // auto-loop: replay until target reached
        if (autoLoopRef.current && (next[idxNow] || 0) < repsTargetRef.current) {
          setTimeout(() => playFragment(idxNow), 600);
        } else {
          setIsPlaying(false);
        }
        return next;
      });
    };
    audio.onerror = () => setIsPlaying(false);
    setIsPlaying(true);
    try {
      await audio.play();
    } catch {
      setIsPlaying(false);
    }
  };

  const stopAudio = () => {
    audioRef.current?.pause();
    setIsPlaying(false);
  };

  const handleNext = () => {
    setCompletedFragments((prev) => new Set(prev).add(activeIdx));
    if (activeIdx < fragments.length - 1) {
      stopAudio();
      setActiveIdx(activeIdx + 1);
    }
  };

  const handleReset = () => {
    stopAudio();
    setActiveIdx(0);
    setCompletedFragments(new Set());
    setRepsByFragment({});
  };

  if (!enabled) {
    return (
      <Card variant="outline" className="border-dashed">
        <CardContent className="py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Headphones className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-medium">Mode écoute attentive (Talqīn)</p>
              <p className="text-xs text-muted-foreground">
                Le verset est joué par fragments — répète après chaque fragment.
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => setEnabled(true)}>
            Activer
          </Button>
        </CardContent>
      </Card>
    );
  }

  const current = fragments[activeIdx];
  const allDone = completedFragments.size === fragments.length && fragments.length > 0;

  return (
    <Card variant="elevated" className="border-l-4 border-l-primary">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Headphones className="w-4 h-4 text-primary" />
            Écoute attentive — fragment {activeIdx + 1} / {fragments.length}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={handleReset} title="Recommencer">
              <RotateCcw className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => { stopAudio(); setEnabled(false); }}>
              Fermer
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Fragment progress dots */}
        <div className="flex flex-wrap gap-1.5">
          {fragments.map((f, i) => (
            <button
              key={i}
              onClick={() => { stopAudio(); setActiveIdx(i); }}
              className={cn(
                'h-2 flex-1 min-w-[20px] rounded-full transition-colors',
                completedFragments.has(i)
                  ? 'bg-primary'
                  : i === activeIdx
                    ? 'bg-gold-warm'
                    : 'bg-muted'
              )}
              title={`Fragment ${i + 1}`}
              aria-label={`Aller au fragment ${i + 1}`}
            />
          ))}
        </div>

        {/* Current fragment text + reps counter */}
        {current && (
          <div className="rounded-lg bg-muted/40 p-4 text-center space-y-2">
            <p className="font-arabic text-2xl md:text-3xl leading-loose text-foreground" dir="rtl">
              {current.text}
            </p>
            <div className="flex items-center justify-center gap-2">
              <Repeat className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Répétitions :</span>
              <Badge variant="secondary" className="text-xs">
                {(repsByFragment[activeIdx] || 0)} / {autoLoop ? repsTarget : '∞'}
              </Badge>
            </div>
          </div>
        )}

        {/* Auto-loop control */}
        <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/20 px-3 py-2">
          <div className="flex items-center gap-2">
            <Repeat className="w-4 h-4 text-primary" />
            <div>
              <p className="text-sm font-medium">Auto-loop</p>
              <p className="text-[11px] text-muted-foreground">Rejoue le fragment automatiquement</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              {[2, 3, 5].map(n => (
                <button
                  key={n}
                  onClick={() => setRepsTarget(n)}
                  disabled={!autoLoop}
                  className={cn(
                    'text-xs px-2 py-1 rounded transition-colors',
                    repsTarget === n && autoLoop
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-muted/70',
                    !autoLoop && 'opacity-50 cursor-not-allowed'
                  )}
                  aria-label={`${n} répétitions`}
                >
                  ×{n}
                </button>
              ))}
            </div>
            <Switch checked={autoLoop} onCheckedChange={setAutoLoop} aria-label="Activer l'auto-loop" />
          </div>
        </div>

        {/* Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <Button
            variant={isPlaying ? 'destructive' : 'default'}
            onClick={() => isPlaying ? stopAudio() : playFragment(activeIdx)}
            disabled={!current}
            className="gap-2"
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            {isPlaying ? 'Stop' : 'Écouter'}
          </Button>
          <Button
            variant="outline"
            onClick={() => current && onRecordFragment?.(activeIdx, current.text)}
            disabled={!current || isAnalyzing}
            className="gap-2"
          >
            <Mic className="w-4 h-4" />
            Réciter
          </Button>
          <Button
            variant="secondary"
            onClick={handleNext}
            disabled={!current || activeIdx === fragments.length - 1}
            className="gap-2"
          >
            Suivant
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        {allDone && (
          <div className="flex items-center justify-center gap-2 text-primary text-sm pt-2 border-t border-border">
            <CheckCircle2 className="w-4 h-4" />
            <span className="font-medium">Bravo ! Tous les fragments ont été pratiqués.</span>
          </div>
        )}

        <p className="text-xs text-muted-foreground text-center">
          💡 Méthode du Talqīn : écoute → répète → passe au fragment suivant.
        </p>
      </CardContent>
    </Card>
  );
};
