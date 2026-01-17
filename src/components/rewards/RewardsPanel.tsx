import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Award, Download, Trophy, Star, BookOpen } from 'lucide-react';
import { SURAHS } from '@/data/quranData';
import { generateCertificatePDF } from '@/utils/pdfGenerator';
import { useLanguage } from '@/contexts/LanguageContext';

interface Certificate {
  id: string;
  surahNumber: number;
  certificateType: string;
  userName: string;
  qiraat: string;
  averageScore: number;
  completedAt: string;
}

interface RewardsPanelProps {
  certificates: Certificate[];
  loading?: boolean;
}

export const RewardsPanel: React.FC<RewardsPanelProps> = ({
  certificates,
  loading = false,
}) => {
  const { t } = useLanguage();

  const handleDownload = (cert: Certificate) => {
    generateCertificatePDF({
      userName: cert.userName,
      surahNumber: cert.surahNumber,
      qiraat: cert.qiraat,
      averageScore: cert.averageScore,
      completedAt: new Date(cert.completedAt),
    });
  };

  const getSurahInfo = (surahNumber: number) => {
    return SURAHS.find((s) => s.id === surahNumber);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <div className="animate-pulse flex flex-col items-center gap-4">
            <div className="w-12 h-12 bg-muted rounded-full" />
            <div className="w-32 h-4 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Trophy className="w-5 h-5 text-primary" />
          Récompenses
        </CardTitle>
        <CardDescription>
          {certificates.length > 0
            ? `${certificates.length} certificat${certificates.length > 1 ? 's' : ''} obtenu${certificates.length > 1 ? 's' : ''}`
            : 'Maîtrise une sourate à 100% pour obtenir un certificat'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {certificates.length === 0 ? (
          <div className="text-center py-8 space-y-4">
            <div className="w-16 h-16 mx-auto bg-muted/50 rounded-full flex items-center justify-center">
              <Award className="w-8 h-8 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">
                Aucun certificat pour le moment
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Continue à pratiquer pour maîtriser une sourate !
              </p>
            </div>
          </div>
        ) : (
          <ScrollArea className="h-[300px] pr-4">
            <div className="space-y-3">
              {certificates.map((cert) => {
                const surah = getSurahInfo(cert.surahNumber);
                return (
                  <div
                    key={cert.id}
                    className="p-4 border rounded-lg bg-gradient-to-r from-primary/5 to-transparent hover:from-primary/10 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                          <Star className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-medium text-sm">
                            {surah?.transliteration || `Sourate ${cert.surahNumber}`}
                          </h4>
                          <p className="font-arabic text-lg" dir="rtl">
                            {surah?.name}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="secondary" className="text-xs">
                              {cert.averageScore.toFixed(0)}%
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {new Date(cert.completedAt).toLocaleDateString('fr-FR')}
                            </span>
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDownload(cert)}
                        className="flex-shrink-0"
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}

        {/* Stats */}
        {certificates.length > 0 && (
          <div className="mt-4 pt-4 border-t grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-primary">{certificates.length}</div>
              <p className="text-xs text-muted-foreground">Sourates maîtrisées</p>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary">
                {certificates.length > 0
                  ? (certificates.reduce((acc, c) => acc + c.averageScore, 0) / certificates.length).toFixed(0)
                  : 0}
                %
              </div>
              <p className="text-xs text-muted-foreground">Score moyen</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
