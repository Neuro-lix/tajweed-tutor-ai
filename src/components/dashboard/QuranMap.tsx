import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SURAHS } from '@/data/quranData';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface SurahStatus {
  id: number;
  status: 'not_started' | 'in_progress' | 'completed' | 'needs_review';
  progress: number;
}

interface QuranMapProps {
  surahStatuses: SurahStatus[];
  onSurahSelect: (surahId: number) => void;
}

const getStatusColor = (status: SurahStatus['status']) => {
  switch (status) {
    case 'completed':
      return 'bg-primary/20 border-primary/40 text-primary';
    case 'in_progress':
      return 'bg-gold-warm/20 border-gold-warm/40 text-gold-warm';
    case 'needs_review':
      return 'bg-destructive/20 border-destructive/40 text-destructive';
    default:
      return 'bg-muted border-border text-muted-foreground';
  }
};

export const QuranMap: React.FC<QuranMapProps> = ({ surahStatuses, onSurahSelect }) => {
  const { t } = useLanguage();
  const [showAll, setShowAll] = useState(false);
  const [selectedJuz, setSelectedJuz] = useState<number | null>(null);
  const [focusedIdx, setFocusedIdx] = useState<number>(0);
  const gridRef = useRef<HTMLDivElement | null>(null);

  const surahsByJuz: Record<number, typeof SURAHS> = {};
  SURAHS.forEach((surah) => {
    if (!surahsByJuz[surah.juz]) surahsByJuz[surah.juz] = [];
    surahsByJuz[surah.juz].push(surah);
  });

  const getSurahStatus = (surahId: number): SurahStatus => {
    return surahStatuses.find(s => s.id === surahId) || {
      id: surahId,
      status: 'not_started',
      progress: 0
    };
  };

  const displayedSurahs = showAll
    ? (selectedJuz ? surahsByJuz[selectedJuz] || [] : SURAHS)
    : SURAHS.slice(0, 30);

  const juzNumbers = Array.from({ length: 30 }, (_, i) => i + 1);

  // Compute columns from current breakpoint by querying actual DOM grid (simple heuristic).
  const getColumns = useCallback((): number => {
    const grid = gridRef.current;
    if (!grid) return 3;
    const style = window.getComputedStyle(grid);
    const cols = style.gridTemplateColumns.split(' ').filter(Boolean).length;
    return cols || 3;
  }, []);

  const handleKeyNav = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter', ' ', 'Home', 'End'].includes(e.key)) return;
    e.preventDefault();
    const cols = getColumns();
    const max = displayedSurahs.length - 1;
    let next = focusedIdx;
    if (e.key === 'ArrowRight') next = Math.min(focusedIdx + 1, max);
    else if (e.key === 'ArrowLeft') next = Math.max(focusedIdx - 1, 0);
    else if (e.key === 'ArrowDown') next = Math.min(focusedIdx + cols, max);
    else if (e.key === 'ArrowUp') next = Math.max(focusedIdx - cols, 0);
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = max;
    else if (e.key === 'Enter' || e.key === ' ') {
      const surah = displayedSurahs[focusedIdx];
      if (surah) onSurahSelect(surah.id);
      return;
    }
    setFocusedIdx(next);
    // Move actual focus
    const grid = gridRef.current;
    if (grid) {
      const target = grid.querySelectorAll<HTMLElement>('[data-surah-cell]')[next];
      target?.focus();
    }
  }, [displayedSurahs, focusedIdx, getColumns, onSurahSelect]);

  // Reset focus when list changes
  useEffect(() => {
    setFocusedIdx(0);
  }, [showAll, selectedJuz]);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-foreground mb-2">{t.quranMap}</h2>
        <p className="text-muted-foreground">{t.selectSurahToStart}</p>
      </div>

      <div className="flex flex-wrap justify-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-primary/20 border border-primary/40" />
          <span className="text-sm text-muted-foreground">{t.mastered}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-gold-warm/20 border border-gold-warm/40" />
          <span className="text-sm text-muted-foreground">{t.inProgressLabel}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-destructive/20 border border-destructive/40" />
          <span className="text-sm text-muted-foreground">{t.toReviewLabel}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-muted border border-border" />
          <span className="text-sm text-muted-foreground">{t.notStartedLabel}</span>
        </div>
      </div>

      {showAll && (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground text-center">{t.filterByJuz}</p>
          <ScrollArea className="w-full">
            <div className="flex gap-2 pb-2 justify-center flex-wrap">
              <Button
                variant={selectedJuz === null ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedJuz(null)}
              >
                {t.allLabel}
              </Button>
              {juzNumbers.map((juz) => (
                <Button
                  key={juz}
                  variant={selectedJuz === juz ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedJuz(juz)}
                  className="min-w-[40px]"
                >
                  {juz}
                </Button>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}

      <div
        ref={gridRef}
        role="grid"
        aria-label={t.quranMap}
        onKeyDown={handleKeyNav}
        className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-2 outline-none"
      >
        {displayedSurahs.map((surah, idx) => {
          const status = getSurahStatus(surah.id);
          const colorClass = getStatusColor(status.status);
          const isFocused = idx === focusedIdx;

          return (
            <Card
              key={surah.id}
              variant="outline"
              data-surah-cell
              role="gridcell"
              tabIndex={isFocused ? 0 : -1}
              aria-label={`${surah.transliteration}, sourate ${surah.id}, ${status.status}`}
              onClick={() => onSurahSelect(surah.id)}
              onFocus={() => setFocusedIdx(idx)}
              className={`
                p-2 cursor-pointer transition-all duration-200 hover:scale-105
                border-2 ${colorClass}
                focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background
              `}
            >
              <div className="text-center">
                <p className="text-xs text-muted-foreground">{surah.id}</p>
                <p className="font-arabic text-sm leading-tight truncate" dir="rtl" title={surah.name}>
                  {surah.name}
                </p>
                <p className="text-[10px] text-muted-foreground truncate" title={surah.transliteration}>
                  {surah.transliteration}
                </p>
                {status.progress > 0 && status.progress < 100 && (
                  <div className="mt-1 h-1 bg-border rounded-full overflow-hidden">
                    <div
                      className="h-full bg-current rounded-full transition-all"
                      style={{ width: `${status.progress}%` }}
                    />
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      <p className="text-xs text-muted-foreground text-center" aria-live="polite">
        💡 Astuce : utilisez les flèches du clavier pour naviguer, Entrée pour sélectionner.
      </p>

      <div className="text-center">
        <Button
          variant="outline"
          onClick={() => {
            setShowAll(!showAll);
            if (!showAll) setSelectedJuz(null);
          }}
          className="gap-2"
        >
          {showAll ? (
            <>
              <ChevronUp className="w-4 h-4" />
              {t.showLess}
            </>
          ) : (
            <>
              <ChevronDown className="w-4 h-4" />
              {t.showAll114}
            </>
          )}
        </Button>
        {!showAll && (
          <p className="text-sm text-muted-foreground mt-2">
            {t.showingXof114}
          </p>
        )}
      </div>
    </div>
  );
};
