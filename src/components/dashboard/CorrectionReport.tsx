import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TAJWEED_RULES } from '@/data/quranData';

interface Correction {
  id: string;
  surah: string;
  verse: number;
  word: string;
  wordArabic: string;
  rule: keyof typeof TAJWEED_RULES;
  description: string;
  timestamp: Date;
}

interface CorrectionReportProps {
  corrections: Correction[];
  onPrint: () => void;
}

export const CorrectionReport: React.FC<CorrectionReportProps> = ({ corrections, onPrint }) => {
  const groupedByRule = corrections.reduce((acc, correction) => {
    const rule = correction.rule;
    if (!acc[rule]) acc[rule] = [];
    acc[rule].push(correction);
    return acc;
  }, {} as Record<string, Correction[]>);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">Rapport de corrections</h2>
          <p className="text-muted-foreground">
            {corrections.length} point{corrections.length > 1 ? 's' : ''} à revoir
          </p>
        </div>
        <Button variant="outline" onClick={onPrint}>
          <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
            <rect x="6" y="14" width="12" height="8" />
          </svg>
          Imprimer
        </Button>
      </div>

      {/* Corrections by rule */}
      {Object.entries(groupedByRule).map(([rule, ruleCorrections]) => {
        const ruleData = TAJWEED_RULES[rule as keyof typeof TAJWEED_RULES];
        
        return (
          <Card key={rule} variant="default">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <Badge variant="warning">{ruleCorrections.length}</Badge>
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <span className="font-arabic" dir="rtl">{ruleData?.name}</span>
                    <span className="text-muted-foreground">—</span>
                    <span>{ruleData?.transliteration}</span>
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">{ruleData?.description}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {ruleCorrections.map((correction) => (
                  <div 
                    key={correction.id}
                    className="flex items-start justify-between p-4 rounded-lg bg-muted/50 border border-border/50"
                  >
                    <div className="flex items-start gap-4">
                      <div className="text-center min-w-[60px]">
                        <p className="text-xs text-muted-foreground">Verset</p>
                        <p className="font-semibold text-primary">{correction.verse}</p>
                      </div>
                      <div>
                        <p className="font-arabic text-xl text-foreground mb-1" dir="rtl">
                          {correction.wordArabic}
                        </p>
                        <p className="text-sm text-muted-foreground">{correction.description}</p>
                      </div>
                    </div>
                    <Badge variant="review">À revoir</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })}

      {/* Print-friendly summary */}
      <div className="print:block hidden">
        <div className="border-t-2 border-primary pt-4 mt-8">
          <p className="text-sm text-center text-muted-foreground">
            Rapport généré le {new Date().toLocaleDateString('fr-FR')}
          </p>
        </div>
      </div>
    </div>
  );
};
