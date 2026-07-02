import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Star8Point } from '@/components/decorative/GeometricPattern';
import { Target, ChevronLeft, Play, CheckCircle2, RotateCcw } from 'lucide-react';
import { getRuleFamilyMeta } from '@/lib/tajweedRules';
import type { IndexState } from '../useIndexState';

interface Props {
  state: IndexState;
}

const THRESHOLD = 1;

export const GuidedReviewView = ({ state: s }: Props) => {
  const { t } = s;
  const verses = s.guidedVerses;
  const [doneKeys, setDoneKeys] = useState<Set<string>>(new Set());

  const remaining = useMemo(
    () => verses.filter((v) => !doneKeys.has(v.key)),
    [verses, doneKeys],
  );
  const progressPct = verses.length > 0 ? Math.round((doneKeys.size / verses.length) * 100) : 0;

  const markDone = (key: string) => {
    setDoneKeys((prev) => new Set(prev).add(key));
  };

  const startVerse = (surahNumber: number, verseNumber: number, key: string) => {
    markDone(key);
    s.handleStartReview(surahNumber, verseNumber);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Button variant="ghost" onClick={() => s.setCurrentView('dashboard')}>
            <ChevronLeft className="w-4 h-4 mr-2" />
            {t.backToDashboard}
          </Button>
          <Star8Point size={24} className="text-primary" />
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="text-center mb-8">
          <Target className="h-10 w-10 text-primary mx-auto mb-3" />
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
            Répétition guidée
          </h1>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Rejoue exactement les passages où ton taux d'erreur dépasse le seuil, jusqu'à
            stabiliser ta récitation.
          </p>
        </div>

        {verses.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto mb-4" />
              <p className="text-lg font-medium">Aucun passage à retravailler pour l'instant.</p>
              <p className="text-muted-foreground mt-1">
                Récite quelques versets — les passages avec des erreurs apparaîtront ici.
              </p>
              <Button className="mt-6" onClick={() => s.setCurrentView('recitation')}>
                <Play className="h-4 w-4 mr-2" /> Commencer une récitation
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <Card className="mb-6">
              <CardContent className="py-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">
                    Progression de la session : {doneKeys.size}/{verses.length}
                  </span>
                  <span className="text-sm text-muted-foreground">{progressPct}%</span>
                </div>
                <Progress value={progressPct} className="h-2" />
                {doneKeys.size > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-3"
                    onClick={() => setDoneKeys(new Set())}
                  >
                    <RotateCcw className="h-4 w-4 mr-2" /> Recommencer la session
                  </Button>
                )}
              </CardContent>
            </Card>

            <div className="space-y-3">
              {verses.map((v) => {
                const isDone = doneKeys.has(v.key);
                return (
                  <Card key={v.key} className={isDone ? 'opacity-60' : ''}>
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center justify-between text-base">
                        <span className="flex items-center gap-2">
                          {isDone && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                          {v.name} — verset {v.verseNumber}
                        </span>
                        <Badge variant="secondary" className="bg-amber-100 text-amber-700">
                          {v.errorCount} erreur{v.errorCount > 1 ? 's' : ''}
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {v.rules.map((r, i) => {
                          const meta = getRuleFamilyMeta(r);
                          return (
                            <Badge key={i} variant="outline" className={meta.color}>
                              {meta.label}
                            </Badge>
                          );
                        })}
                      </div>
                      <Button
                        size="sm"
                        variant={isDone ? 'outline' : 'default'}
                        onClick={() => startVerse(v.surahNumber, v.verseNumber, v.key)}
                      >
                        <Play className="h-4 w-4 mr-2" />
                        {isDone ? 'Rejouer' : 'Rejouer ce passage'}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {remaining.length === 0 && (
              <div className="text-center mt-8">
                <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto mb-2" />
                <p className="font-medium">Bravo ! Tu as parcouru tous les passages à consolider.</p>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};
