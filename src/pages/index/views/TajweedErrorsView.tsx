import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star8Point } from '@/components/decorative/GeometricPattern';
import { ChevronLeft, BookOpen, Play, FileText, Lightbulb } from 'lucide-react';
import { getRuleFamilyMeta, classifyRule, RULE_FAMILY_META, type RuleFamily } from '@/lib/tajweedRules';
import { getSurahName } from '@/lib/progressInsights';
import { generateCorrectionsSummaryPDF } from '@/utils/pdfGenerator';
import { toast } from 'sonner';
import type { IndexState } from '../useIndexState';

interface Props {
  state: IndexState;
}

export const TajweedErrorsView = ({ state: s }: Props) => {
  const { t } = s;
  const corrections = s.corrections;
  const [filter, setFilter] = useState<RuleFamily | 'all'>('all');

  const filtered = useMemo(
    () => (filter === 'all' ? corrections : corrections.filter((c) => classifyRule(c.ruleType) === filter)),
    [corrections, filter],
  );

  // Group by surah:verse
  const grouped = useMemo(() => {
    const map = new Map<string, { surahNumber: number; verseNumber: number; items: typeof corrections }>();
    for (const c of filtered) {
      const key = `${c.surahNumber}:${c.verseNumber}`;
      if (!map.has(key)) map.set(key, { surahNumber: c.surahNumber, verseNumber: c.verseNumber, items: [] });
      map.get(key)!.items.push(c);
    }
    return Array.from(map.entries())
      .map(([key, v]) => ({ key, ...v }))
      .sort((a, b) => a.surahNumber - b.surahNumber || a.verseNumber - b.verseNumber);
  }, [filtered]);

  const availableFamilies = useMemo(() => {
    const set = new Set<RuleFamily>();
    corrections.forEach((c) => set.add(classifyRule(c.ruleType)));
    return Array.from(set);
  }, [corrections]);

  const exportPdf = () => {
    if (corrections.length === 0) return;
    generateCorrectionsSummaryPDF({
      userName: s.profile?.fullName ?? undefined,
      qiraat: s.selectedQiraat ?? undefined,
      corrections: corrections.map((c) => ({
        surahNumber: c.surahNumber,
        verseNumber: c.verseNumber,
        word: c.word,
        ruleType: c.ruleType,
        ruleDescription: c.ruleDescription,
        correctionExample: c.correctionExample,
        severity: c.severity,
      })),
      sessions: [],
    });
    toast.success('Export PDF téléchargé.');
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
        <div className="text-center mb-6">
          <BookOpen className="h-10 w-10 text-primary mx-auto mb-3" />
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
            Mes erreurs de tajwīd par verset
          </h1>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Chaque erreur avec la règle concernée (makhārij, ṣifāt, madd, idghām/iẓhār/iqlāb/ikhfāʾ,
            waqf…) et un exemple de correction.
          </p>
        </div>

        {corrections.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 mb-6">
            <Badge
              variant={filter === 'all' ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => setFilter('all')}
            >
              Toutes ({corrections.length})
            </Badge>
            {availableFamilies.map((fam) => {
              const meta = RULE_FAMILY_META[fam];
              const count = corrections.filter((c) => classifyRule(c.ruleType) === fam).length;
              return (
                <Badge
                  key={fam}
                  variant={filter === fam ? 'default' : 'outline'}
                  className={`cursor-pointer ${filter === fam ? '' : meta.color}`}
                  onClick={() => setFilter(fam)}
                >
                  {meta.label} ({count})
                </Badge>
              );
            })}
            <Button variant="outline" size="sm" className="ml-auto gap-1.5" onClick={exportPdf}>
              <FileText className="h-4 w-4" /> PDF
            </Button>
          </div>
        )}

        {corrections.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-lg font-medium">Aucune erreur enregistrée. 🎉</p>
              <p className="text-muted-foreground mt-1">
                Récite un verset et lance l'analyse pour voir tes points d'amélioration ici.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {grouped.map((g) => (
              <Card key={g.key}>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center justify-between text-base">
                    <span>
                      {getSurahName(g.surahNumber)} — verset {g.verseNumber}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => s.handleStartReview(g.surahNumber, g.verseNumber)}
                    >
                      <Play className="h-4 w-4 mr-1.5" /> Rejouer
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {g.items.map((c) => {
                    const meta = getRuleFamilyMeta(c.ruleType);
                    const example = c.correctionExample || meta.genericExample;
                    return (
                      <div key={c.id} className="rounded-lg border p-3 bg-muted/30">
                        <div className="flex items-center justify-between gap-2 mb-1.5 flex-wrap">
                          <Badge variant="outline" className={meta.color}>
                            {meta.label}
                            <span className="ml-1 font-arabic">{meta.arabic}</span>
                          </Badge>
                          {c.word && (
                            <span className="font-arabic text-lg" dir="rtl">
                              {c.word}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-foreground/80">{c.ruleDescription}</p>
                        <div className="flex items-start gap-2 mt-2 text-sm text-emerald-700 bg-emerald-50 rounded-md p-2">
                          <Lightbulb className="h-4 w-4 mt-0.5 shrink-0" />
                          <span>{example}</span>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};
