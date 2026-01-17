import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, Award, Star, Sparkles } from 'lucide-react';
import { SURAHS } from '@/data/quranData';
import { generateCertificatePDF } from '@/utils/pdfGenerator';

interface Certificate {
  id: string;
  surahNumber: number;
  certificateType: string;
  userName: string;
  qiraat: string;
  averageScore: number;
  completedAt: string;
}

interface CertificateModalProps {
  certificate: Certificate | null;
  isOpen: boolean;
  onClose: () => void;
}

const QIRAAT_NAMES: Record<string, string> = {
  hafs_asim: 'Ḥafṣ ʿan ʿĀṣim',
  warsh_nafi: 'Warsh ʿan Nāfiʿ',
  qalun_nafi: 'Qālūn ʿan Nāfiʿ',
};

export const CertificateModal: React.FC<CertificateModalProps> = ({
  certificate,
  isOpen,
  onClose,
}) => {
  if (!certificate) return null;

  const surah = SURAHS.find((s) => s.id === certificate.surahNumber);

  const handleDownload = () => {
    generateCertificatePDF({
      userName: certificate.userName,
      surahNumber: certificate.surahNumber,
      qiraat: certificate.qiraat,
      averageScore: certificate.averageScore,
      completedAt: new Date(certificate.completedAt),
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex justify-center mb-4">
            <div className="relative">
              <div className="w-20 h-20 bg-gradient-to-br from-primary to-primary/60 rounded-full flex items-center justify-center animate-pulse">
                <Award className="w-10 h-10 text-primary-foreground" />
              </div>
              <Sparkles className="w-6 h-6 text-amber-400 absolute -top-1 -right-1 animate-bounce" />
            </div>
          </div>
          <DialogTitle className="text-center text-2xl">
            🎉 Félicitations !
          </DialogTitle>
          <DialogDescription className="text-center">
            Tu as maîtrisé une nouvelle sourate !
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Surah info */}
          <div className="text-center space-y-2">
            <p className="font-arabic text-3xl text-primary" dir="rtl">
              {surah?.name}
            </p>
            <p className="text-lg font-medium">{surah?.transliteration}</p>
            <p className="text-sm text-muted-foreground">
              {surah?.verses} versets
            </p>
          </div>

          {/* Score and details */}
          <div className="flex justify-center gap-4">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-2">
                <Star className="w-8 h-8 text-primary" />
              </div>
              <div className="text-2xl font-bold text-primary">
                {certificate.averageScore.toFixed(0)}%
              </div>
              <p className="text-xs text-muted-foreground">Score moyen</p>
            </div>
          </div>

          {/* Qiraat badge */}
          <div className="flex justify-center">
            <Badge variant="outline" className="text-sm">
              {QIRAAT_NAMES[certificate.qiraat] || certificate.qiraat}
            </Badge>
          </div>

          {/* Date */}
          <p className="text-center text-sm text-muted-foreground">
            Obtenu le{' '}
            {new Date(certificate.completedAt).toLocaleDateString('fr-FR', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>

          {/* Actions */}
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={onClose}>
              Continuer
            </Button>
            <Button className="flex-1" onClick={handleDownload}>
              <Download className="w-4 h-4 mr-2" />
              Télécharger PDF
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
