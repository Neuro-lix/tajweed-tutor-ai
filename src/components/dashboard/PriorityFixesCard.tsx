import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, ArrowRight, Download, ListChecks, Table2 } from 'lucide-react';
import { getRuleFamilyMeta, classifyRule } from '@/lib/tajweedRules';
import type { PriorityFix } from '@/lib/progressInsights';

interface Props {
  fixes: PriorityFix[];
  /** Human name of the active reading (qirāʾa), e.g. "Ḥafṣ ʿan ʿĀṣim". */
  qiraatLabel?: string;
  onOpenSurah: (surahNumber: number, verseNumber: number) => void;
  onOpenAllErrors: () => void;
  onDownloadPdf: () => void;
  onDownloadCsv: () => void;
}

const rank = ['bg-destructive/15 text-destructive', 'bg-amber-500/15 text-amber-600', 'bg-primary/15 text-primary'];

export const PriorityFixesCard = ({
  fixes,
  qiraatLabel,
  onOpenSurah,
  onOpenAllErrors,
  onDownloadPdf,
  onDownloadCsv,
}: Props) => (
  <Card>
    <CardHeader className="pb-3">
      <CardTitle className="flex items-center gap-2 text-lg">
        <ListChecks className="h-5 w-5 text-primary" />
        À corriger en priorité
      </CardTitle>
      <p className="text-xs text-muted-foreground">
        {qiraatLabel
          ? `Classé par gravité pour la lecture ${qiraatLabel}.`
          : 'Classé par gravité pour votre lecture actuelle.'}
      </p>
    </CardHeader>
    <CardContent className="space-y-3">
      {fixes.length === 0 ? (
        <p className="text-sm text-muted-foreground py-2">
          Aucun point à corriger pour l'instant — récitez un passage pour lancer l'analyse.
        </p>
      ) : (
        <ol className="space-y-2">
          {fixes.map((fix, i) => (
            <li key={fix.key}>
              <button
                onClick={() => onOpenSurah(fix.surahNumber, fix.verses[0] ?? 1)}
                className="w-full text-left rounded-lg border border-border p-3 hover:border-primary/50 hover:bg-primary/5 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold ${
                          rank[i] ?? 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {i + 1}
                      </span>
                      <span className="font-semibold truncate">{fix.name}</span>
                      {fix.arabic && (
                        <span className="font-arabic text-sm text-muted-foreground" dir="rtl">
                          {fix.arabic}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      {fix.errorCount} erreur{fix.errorCount > 1 ? 's' : ''} sur {fix.verseCount} verset
                      {fix.verseCount > 1 ? 's' : ''} (v. {fix.verses.slice(0, 4).join(', ')}
                      {fix.verses.length > 4 ? '…' : ''})
                    </p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {fix.rules.slice(0, 3).map((r) => {
                        const meta = getRuleFamilyMeta(classifyRule(r.rule));
                        return (
                          <Badge key={r.rule} variant="secondary" className="text-[10px] font-normal">
                            {meta?.label ?? r.rule} · {r.count}
                          </Badge>
                        );
                      })}
                      {fix.rules.length > 3 && (
                        <Badge variant="outline" className="text-[10px] font-normal">
                          +{fix.rules.length - 3}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-primary shrink-0 mt-1" />
                </div>
              </button>
            </li>
          ))}
        </ol>
      )}

      <div className="flex gap-2 pt-1">
        <Button variant="outline" size="sm" className="flex-1" onClick={onOpenAllErrors}>
          Tout voir
        </Button>
        <Button
          variant="default"
          size="sm"
          className="flex-1"
          onClick={onDownloadPdf}
          disabled={fixes.length === 0}
        >
          <Download className="h-4 w-4 mr-1.5" />
          PDF
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={onDownloadCsv}
          disabled={fixes.length === 0}
        >
          <Table2 className="h-4 w-4 mr-1.5" />
          CSV
        </Button>
      </div>
    </CardContent>
  </Card>
);
