import React, { useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Download, 
  Printer, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle,
  Star,
  Target,
  BookOpen
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { SURAHS } from '@/data/quranData';
import { generateReportPDF } from '@/utils/pdfGenerator';

interface RecitationError {
  word: string;
  ruleType: string;
  ruleDescription: string;
  severity: 'minor' | 'major' | 'critical';
  correction?: string;
}

interface RecitationReportProps {
  surahNumber: number;
  verseNumber: number;
  score: number;
  isCorrect: boolean;
  feedback: string;
  priorityFixes: string[];
  errors: RecitationError[];
  transcribedText?: string | null;
  expectedText: string;
  textComparison?: string;
  date?: Date;
  userName?: string;
  onClose?: () => void;
}

export const RecitationReport: React.FC<RecitationReportProps> = ({
  surahNumber,
  verseNumber,
  score,
  isCorrect,
  feedback,
  priorityFixes = [],
  errors = [],
  transcribedText,
  expectedText,
  textComparison,
  date = new Date(),
  userName,
  onClose,
}) => {
  const { t } = useLanguage();
  const reportRef = useRef<HTMLDivElement>(null);

  const surah = SURAHS.find(s => s.id === surahNumber);

  const getScoreColor = () => {
    if (score >= 90) return 'text-primary';
    if (score >= 70) return 'text-amber-500';
    return 'text-destructive';
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <Badge variant="destructive">Critique</Badge>;
      case 'major':
        return <Badge className="bg-amber-500">Majeur</Badge>;
      default:
        return <Badge variant="secondary">Mineur</Badge>;
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    // Generate real PDF using jsPDF
    generateReportPDF({
      userName: userName || 'Utilisateur',
      surahNumber,
      verseNumber,
      score,
      isCorrect,
      feedback,
      priorityFixes,
      errors: errors.map(e => ({
        word: e.word,
        ruleType: e.ruleType,
        ruleDescription: e.ruleDescription,
        severity: e.severity,
        correction: e.correction,
      })),
      transcribedText,
      expectedText,
      date,
    });
  };

  return (
    <div className="space-y-4">
      {/* Actions */}
      <div className="flex items-center justify-between no-print">
        <h2 className="text-xl font-semibold">{t.downloadReport}</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="w-4 h-4 mr-2" />
            {t.print}
          </Button>
          <Button variant="default" size="sm" onClick={handleDownload}>
            <Download className="w-4 h-4 mr-2" />
            {t.download}
          </Button>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              {t.close}
            </Button>
          )}
        </div>
      </div>

      <div ref={reportRef} className="space-y-4">
        {/* Header */}
        <Card>
          <CardContent className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-arabic text-2xl mb-1" dir="rtl">{surah?.name}</h3>
                <p className="text-muted-foreground">
                  {surah?.transliteration} • {t.verse} {verseNumber}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {date.toLocaleDateString('fr-FR', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
              <div className="text-center">
                <div className={`text-5xl font-bold ${getScoreColor()}`}>
                  {score}
                </div>
                <p className="text-sm text-muted-foreground">/ 100</p>
                <div className="mt-2">
                  {isCorrect ? (
                    <Badge variant="default" className="bg-primary">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      {t.excellent}
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="bg-amber-100 text-amber-700">
                      <AlertTriangle className="w-3 h-3 mr-1" />
                      {t.needsReview}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <Progress value={score} className="mt-4 h-3" />
          </CardContent>
        </Card>

        {/* Text comparison */}
        {(transcribedText || expectedText) && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                Comparaison des textes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Texte attendu:</p>
                <p className="font-arabic text-lg" dir="rtl">{expectedText}</p>
              </div>
              {transcribedText && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Transcription:</p>
                  <p className="font-arabic text-lg" dir="rtl">{transcribedText}</p>
                </div>
              )}
              {textComparison && (
                <div className="pt-2 border-t">
                  <p className="text-sm text-muted-foreground">{textComparison}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Priority fixes */}
        {priorityFixes.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Target className="w-4 h-4 text-primary" />
                {t.priorityFixes} (Top 3)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="space-y-2">
                {priorityFixes.slice(0, 3).map((fix, index) => (
                  <li key={index} className="flex items-start gap-3 p-3 bg-primary/5 rounded-lg">
                    <span className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                      {index + 1}
                    </span>
                    <span className="text-sm">{fix}</span>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        )}

        {/* Errors */}
        {errors.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <XCircle className="w-4 h-4 text-destructive" />
                {t.errors} ({errors.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {errors.map((error, index) => (
                  <div key={index} className="p-3 border rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-arabic text-lg" dir="rtl">{error.word}</span>
                      {getSeverityBadge(error.severity)}
                    </div>
                    <div>
                      <Badge variant="outline" className="text-xs mb-1">
                        {error.ruleType}
                      </Badge>
                      <p className="text-sm text-muted-foreground">{error.ruleDescription}</p>
                    </div>
                    {error.correction && (
                      <div className="pt-2 border-t">
                        <p className="text-sm">
                          <span className="font-medium text-primary">✓ Correction:</span>{' '}
                          {error.correction}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Feedback */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-500" />
              Commentaire général
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{feedback}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
