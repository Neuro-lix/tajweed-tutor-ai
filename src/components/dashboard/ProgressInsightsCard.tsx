import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Target, BookOpen, ArrowRight, TrendingUp } from 'lucide-react';
import type { SurahLevelInfo, RecommendedReview, SurahLevel } from '@/lib/progressInsights';

interface Props {
  levels: SurahLevelInfo[];
  recommended: RecommendedReview | null;
  onOpenGuidedReview: () => void;
  onOpenTajweedErrors: () => void;
  onStartSurah: (surahNumber: number) => void;
}

const levelColor: Record<SurahLevel, string> = {
  'débutant': 'bg-slate-100 text-slate-700',
  'intermédiaire': 'bg-blue-100 text-blue-700',
  'avancé': 'bg-amber-100 text-amber-700',
  'maîtrisé': 'bg-emerald-100 text-emerald-700',
};

export const ProgressInsightsCard = ({
  levels,
  recommended,
  onOpenGuidedReview,
  onOpenTajweedErrors,
  onStartSurah,
}: Props) => {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <TrendingUp className="h-5 w-5 text-primary" />
          Ma progression détaillée
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {recommended && (
          <button
            onClick={() => onStartSurah(recommended.surahNumber)}
            className="w-full text-left rounded-lg border border-primary/30 bg-primary/5 p-3 hover:bg-primary/10 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-primary uppercase tracking-wide">
                  Prochain retour recommandé
                </p>
                <p className="font-semibold mt-0.5">Retour sur {recommended.name}</p>
                <p className="text-xs text-muted-foreground">{recommended.reason}</p>
              </div>
              <ArrowRight className="h-5 w-5 text-primary shrink-0" />
            </div>
          </button>
        )}

        {levels.length === 0 ? (
          <p className="text-sm text-muted-foreground py-2">
            Commence à réciter pour voir ton niveau par sourate.
          </p>
        ) : (
          <div className="space-y-2.5">
            {levels.slice(0, 6).map((l) => (
              <div key={l.surahNumber} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium truncate">{l.name}</span>
                  <Badge variant="secondary" className={levelColor[l.level]}>
                    {l.level}
                  </Badge>
                </div>
                <Progress value={l.progressPct} className="h-1.5" />
                {l.errorCount > 0 && (
                  <p className="text-xs text-amber-600">
                    {l.errorCount} point{l.errorCount > 1 ? 's' : ''} à consolider
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-2 gap-2 pt-1">
          <Button variant="outline" size="sm" onClick={onOpenGuidedReview} className="gap-1.5">
            <Target className="h-4 w-4" /> Répétition
          </Button>
          <Button variant="outline" size="sm" onClick={onOpenTajweedErrors} className="gap-1.5">
            <BookOpen className="h-4 w-4" /> Mes erreurs
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
