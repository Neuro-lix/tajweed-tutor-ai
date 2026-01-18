import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SURAHS } from '@/data/quranData';
import { ChevronDown, ChevronUp } from 'lucide-react';

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
  const [showAll, setShowAll] = useState(false);
  const [selectedJuz, setSelectedJuz] = useState<number | null>(null);

  // Group surahs by Juz (30 parts)
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

  // Filter surahs based on view mode
  const displayedSurahs = showAll 
    ? (selectedJuz ? surahsByJuz[selectedJuz] || [] : SURAHS)
    : SURAHS.slice(0, 30);

  const juzNumbers = Array.from({ length: 30 }, (_, i) => i + 1);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-foreground mb-2">Carte du Coran</h2>
        <p className="text-muted-foreground">Sélectionne une sourate pour commencer ta récitation</p>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-primary/20 border border-primary/40" />
          <span className="text-sm text-muted-foreground">Maîtrisé</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-gold-warm/20 border border-gold-warm/40" />
          <span className="text-sm text-muted-foreground">En cours</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-destructive/20 border border-destructive/40" />
          <span className="text-sm text-muted-foreground">À revoir</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-muted border border-border" />
          <span className="text-sm text-muted-foreground">Non commencé</span>
        </div>
      </div>

      {/* Juz filter */}
      {showAll && (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground text-center">Filtrer par Juz:</p>
          <ScrollArea className="w-full">
            <div className="flex gap-2 pb-2 justify-center flex-wrap">
              <Button
                variant={selectedJuz === null ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedJuz(null)}
              >
                Tout
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

      {/* Surah grid */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-2">
        {displayedSurahs.map((surah) => {
          const status = getSurahStatus(surah.id);
          const colorClass = getStatusColor(status.status);

          return (
            <Card
              key={surah.id}
              variant="outline"
              onClick={() => onSurahSelect(surah.id)}
              className={`
                p-2 cursor-pointer transition-all duration-200 hover:scale-105
                border-2 ${colorClass}
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

      {/* Show more/less toggle */}
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
              Afficher moins
            </>
          ) : (
            <>
              <ChevronDown className="w-4 h-4" />
              Afficher les 114 sourates
            </>
          )}
        </Button>
        {!showAll && (
          <p className="text-sm text-muted-foreground mt-2">
            Affichage de 30 sourates sur 114
          </p>
        )}
      </div>
    </div>
  );
};
