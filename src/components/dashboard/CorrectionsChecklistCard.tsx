import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Printer, Download, ClipboardList } from 'lucide-react';

export interface ChecklistCorrection {
  id?: string;
  surahNumber: number;
  verseNumber: number;
  word?: string | null;
  ruleType?: string | null;
  ruleDescription?: string | null;
  correctionExample?: string | null;
  severity?: string | null;
  isResolved?: boolean;
  createdAt?: string;
}

interface Props {
  corrections: ChecklistCorrection[];
  userName?: string;
  qiraatLabel?: string;
  onDownloadPdf: () => void;
}

const severityLabel: Record<string, string> = {
  high: 'Majeure',
  medium: 'Moyenne',
  low: 'Légère',
};

const severityVariant = (s?: string | null) =>
  s === 'high' ? 'destructive' : s === 'medium' ? 'secondary' : 'outline';

/** Liste imprimable de tout ce qui reste à corriger, groupée par sourate. */
export const CorrectionsChecklistCard = ({
  corrections,
  userName,
  qiraatLabel,
  onDownloadPdf,
}: Props) => {
  const pending = useMemo(
    () => corrections.filter((c) => !c.isResolved),
    [corrections],
  );

  const bySurah = useMemo(() => {
    const map = new Map<number, ChecklistCorrection[]>();
    for (const c of pending) {
      const list = map.get(c.surahNumber) ?? [];
      list.push(c);
      map.set(c.surahNumber, list);
    }
    return Array.from(map.entries()).sort((a, b) => b[1].length - a[1].length);
  }, [pending]);

  return (
    <Card className="print-area">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <ClipboardList className="h-5 w-5 text-primary" />
              Ma liste de corrections
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              {pending.length} point{pending.length > 1 ? 's' : ''} en attente
              {qiraatLabel ? ` · lecture ${qiraatLabel}` : ''}
              {userName ? ` · ${userName}` : ''}
            </p>
          </div>
          <div className="flex gap-2 print:hidden">
            <Button variant="outline" size="sm" onClick={() => window.print()}>
              <Printer className="h-4 w-4 mr-1.5" />
              Imprimer
            </Button>
            <Button size="sm" onClick={onDownloadPdf} disabled={corrections.length === 0}>
              <Download className="h-4 w-4 mr-1.5" />
              PDF
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {pending.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Rien à corriger pour le moment — récitez un passage pour lancer l'analyse.
          </p>
        ) : (
          bySurah.map(([surahNumber, items]) => (
            <div key={surahNumber} className="space-y-2">
              <h3 className="text-sm font-semibold">
                Sourate {surahNumber}
                <span className="text-muted-foreground font-normal">
                  {' '}
                  · {items.length} point{items.length > 1 ? 's' : ''}
                </span>
              </h3>
              <ul className="space-y-2">
                {items.map((c, i) => (
                  <li
                    key={c.id ?? `${surahNumber}-${c.verseNumber}-${i}`}
                    className="rounded-lg border border-border p-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs text-muted-foreground">
                            Verset {c.verseNumber}
                          </span>
                          {c.word && (
                            <span className="font-arabic text-lg" dir="rtl">
                              {c.word}
                            </span>
                          )}
                          {c.ruleType && (
                            <Badge variant="secondary" className="text-[10px] font-normal">
                              {c.ruleType}
                            </Badge>
                          )}
                        </div>
                        {c.ruleDescription && (
                          <p className="text-sm text-muted-foreground mt-1">{c.ruleDescription}</p>
                        )}
                        {c.correctionExample && (
                          <p className="text-xs mt-1">
                            <span className="text-muted-foreground">À faire : </span>
                            {c.correctionExample}
                          </p>
                        )}
                      </div>
                      <Badge variant={severityVariant(c.severity) as never} className="shrink-0">
                        {severityLabel[c.severity ?? ''] ?? 'À revoir'}
                      </Badge>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))
        )}
        <p className="hidden print:block text-xs text-muted-foreground border-t pt-3">
          Liste générée le {new Date().toLocaleDateString('fr-FR')} — Nassihah
        </p>
      </CardContent>
    </Card>
  );
};
