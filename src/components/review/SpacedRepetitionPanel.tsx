import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SURAHS } from '@/data/quranData';
import { Clock, AlertCircle, CheckCircle, Brain } from 'lucide-react';

interface ReviewItem {
  id: string;
  surahNumber: number;
  verseNumber: number;
  nextReviewDate: Date;
  intervalDays: number;
  repetitions: number;
}

interface SpacedRepetitionPanelProps {
  dueReviews: ReviewItem[];
  totalInQueue: number;
  onStartReview: (surahNumber: number, verseNumber: number) => void;
}

export const SpacedRepetitionPanel: React.FC<SpacedRepetitionPanelProps> = ({
  dueReviews,
  totalInQueue,
  onStartReview,
}) => {
  const getSurahName = (number: number) => {
    const surah = SURAHS.find(s => s.id === number);
    return surah ? surah.name : `Sourate ${number}`;
  };

  const getIntervalLabel = (days: number) => {
    if (days === 1) return '1 jour';
    if (days < 7) return `${days} jours`;
    if (days < 30) return `${Math.round(days / 7)} sem.`;
    return `${Math.round(days / 30)} mois`;
  };

  return (
    <Card variant="elevated" className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Brain className="w-5 h-5 text-primary" />
            Révision espacée
          </CardTitle>
          <Badge variant={dueReviews.length > 0 ? 'default' : 'secondary'}>
            {dueReviews.length} à revoir
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {dueReviews.length === 0 ? (
          <div className="text-center py-6">
            <CheckCircle className="w-12 h-12 text-primary mx-auto mb-3" />
            <p className="text-foreground font-medium">Aucun verset à réviser !</p>
            <p className="text-sm text-muted-foreground mt-1">
              {totalInQueue > 0 
                ? `${totalInQueue} verset(s) en attente de révision future`
                : 'Les versets avec erreurs seront ajoutés ici'}
            </p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[300px] overflow-y-auto">
            {dueReviews.slice(0, 5).map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <AlertCircle className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-arabic text-lg" dir="rtl">
                      {getSurahName(item.surahNumber)}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>Verset {item.verseNumber}</span>
                      <span>•</span>
                      <Clock className="w-3 h-3" />
                      <span>{getIntervalLabel(item.intervalDays)}</span>
                    </div>
                  </div>
                </div>
                <Button
                  size="sm"
                  onClick={() => onStartReview(item.surahNumber, item.verseNumber)}
                >
                  Réviser
                </Button>
              </div>
            ))}
            
            {dueReviews.length > 5 && (
              <p className="text-sm text-center text-muted-foreground">
                +{dueReviews.length - 5} autres versets à réviser
              </p>
            )}
          </div>
        )}

        {dueReviews.length > 0 && (
          <Button 
            variant="default" 
            className="w-full"
            onClick={() => {
              const first = dueReviews[0];
              onStartReview(first.surahNumber, first.verseNumber);
            }}
          >
            Commencer la session de révision
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
