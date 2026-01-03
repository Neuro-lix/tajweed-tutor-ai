import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SURAHS } from '@/data/quranData';

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

const getStatusBadge = (status: SurahStatus['status']) => {
  switch (status) {
    case 'completed':
      return <Badge variant="mastered">Maîtrisé</Badge>;
    case 'in_progress':
      return <Badge variant="gold">En cours</Badge>;
    case 'needs_review':
      return <Badge variant="review">À revoir</Badge>;
    default:
      return null;
  }
};

export const QuranMap: React.FC<QuranMapProps> = ({ surahStatuses, onSurahSelect }) => {
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

  return (
    <div className="space-y-8">
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

      {/* Surah grid */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
        {SURAHS.slice(0, 20).map((surah) => {
          const status = getSurahStatus(surah.id);
          const colorClass = getStatusColor(status.status);

          return (
            <Card
              key={surah.id}
              variant="outline"
              onClick={() => onSurahSelect(surah.id)}
              className={`
                p-3 cursor-pointer transition-all duration-200 hover:scale-105
                border-2 ${colorClass}
              `}
            >
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-1">{surah.id}</p>
                <p className="font-arabic text-sm leading-tight" dir="rtl">
                  {surah.name}
                </p>
                {status.progress > 0 && status.progress < 100 && (
                  <div className="mt-2 h-1 bg-border rounded-full overflow-hidden">
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

      {/* Show more indicator */}
      <p className="text-center text-sm text-muted-foreground">
        Affichage de 20 sourates sur 114 • Faites défiler pour voir plus
      </p>
    </div>
  );
};
