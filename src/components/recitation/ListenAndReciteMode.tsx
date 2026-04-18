import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Headphones, Play, Pause, Mic, RotateCcw, ChevronRight, CheckCircle2 } from 'lucide-react';
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
  const audioRef = useRef<HTMLAudioElement | null>(null);

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
        audioUrl: referenceAudioUrl, // reuse same ayah audio (cannot slice cleanly without timestamps)
      });
    }
    setFragments(groups);
    setActiveIdx(0);
    setCompletedFragments(new Set());
  }, [verseText, referenceAudioUrl, surahNumber, verseNumber]);

  // Cleanup audio on unmount / disable
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
    audio.onended = () => setIsPlaying(false);
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
      setActiveIdx(activeIdx + 1);
    }
  };

  const handleReset = () => {
    stopAudio();
    setActiveIdx(0);
    setCompletedFragments(new Set());
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

        {/* Current fragment text */}
        {current && (
          <div className="rounded-lg bg-muted/40 p-4 text-center">
            <p className="font-arabic text-2xl md:text-3xl leading-loose text-foreground" dir="rtl">
              {current.text}
            </p>
          </div>
        )}

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
