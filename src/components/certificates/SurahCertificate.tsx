import React, { useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, Award, Star, Share2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { SURAHS } from '@/data/quranData';

interface SurahCertificateProps {
  surahNumber: number;
  userName: string;
  completionDate: Date;
  qiraat: string;
  averageScore: number;
  onClose?: () => void;
}

export const SurahCertificate: React.FC<SurahCertificateProps> = ({
  surahNumber,
  userName,
  completionDate,
  qiraat,
  averageScore,
  onClose,
}) => {
  const { t } = useLanguage();
  const certificateRef = useRef<HTMLDivElement>(null);

  const surah = SURAHS.find(s => s.id === surahNumber);

  const handleDownload = () => {
    if (!certificateRef.current) return;

    const styles = `
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=Cormorant+Garamond:wght@400;600;700&display=swap');
        
        * { box-sizing: border-box; margin: 0; padding: 0; }
        
        body {
          font-family: 'Cormorant Garamond', serif;
          background: linear-gradient(135deg, #f5f3ef 0%, #e8e4dc 100%);
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px;
        }
        
        .certificate {
          background: white;
          border: 3px solid #0d5c4d;
          border-radius: 8px;
          padding: 60px;
          max-width: 800px;
          width: 100%;
          text-align: center;
          box-shadow: 0 20px 60px rgba(0,0,0,0.1);
          position: relative;
        }
        
        .certificate::before {
          content: '';
          position: absolute;
          top: 15px;
          left: 15px;
          right: 15px;
          bottom: 15px;
          border: 1px solid #c9a227;
          border-radius: 4px;
          pointer-events: none;
        }
        
        .header { margin-bottom: 30px; }
        .award-icon { color: #c9a227; font-size: 48px; margin-bottom: 10px; }
        .title { font-size: 28px; color: #0d5c4d; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; }
        
        .surah-name { 
          font-family: 'Amiri', serif;
          font-size: 48px;
          color: #1a1a1a;
          margin: 30px 0;
          direction: rtl;
        }
        
        .transliteration { font-size: 24px; color: #666; margin-bottom: 30px; }
        
        .recipient { font-size: 20px; margin: 30px 0; }
        .recipient-name { font-size: 32px; font-weight: 600; color: #0d5c4d; }
        
        .details { display: flex; justify-content: center; gap: 40px; margin: 30px 0; }
        .detail-item { text-align: center; }
        .detail-label { font-size: 12px; color: #999; text-transform: uppercase; letter-spacing: 1px; }
        .detail-value { font-size: 18px; color: #333; font-weight: 600; }
        
        .score { 
          font-size: 64px; 
          font-weight: 700; 
          color: #0d5c4d;
          margin: 20px 0;
        }
        .score-label { font-size: 14px; color: #666; }
        
        .footer { margin-top: 40px; padding-top: 30px; border-top: 1px solid #e5e7eb; }
        .date { font-size: 14px; color: #666; }
        
        .ornament { color: #c9a227; font-size: 24px; margin: 20px 0; }
      </style>
    `;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Attestation - ${surah?.transliteration}</title>
          ${styles}
        </head>
        <body>
          <div class="certificate">
            <div class="header">
              <div class="award-icon">🏆</div>
              <div class="title">${t.certificateTitle}</div>
            </div>
            
            <div class="ornament">❧ ✦ ❧</div>
            
            <div class="surah-name">${surah?.name}</div>
            <div class="transliteration">${surah?.transliteration}</div>
            
            <div class="recipient">
              <p>Ce certificat est décerné à</p>
              <p class="recipient-name">${userName}</p>
              <p>pour avoir maîtrisé avec excellence la récitation de cette sourate</p>
            </div>
            
            <div class="score">${averageScore}%</div>
            <div class="score-label">Score moyen de récitation</div>
            
            <div class="details">
              <div class="detail-item">
                <div class="detail-label">Lecture</div>
                <div class="detail-value">${qiraat}</div>
              </div>
              <div class="detail-item">
                <div class="detail-label">Versets</div>
                <div class="detail-value">${surah?.verses}</div>
              </div>
              <div class="detail-item">
                <div class="detail-label">Juz'</div>
                <div class="detail-value">${surah?.juz}</div>
              </div>
            </div>
            
            <div class="ornament">❧ ✦ ❧</div>
            
            <div class="footer">
              <div class="date">
                Délivré le ${completionDate.toLocaleDateString('fr-FR', { 
                  weekday: 'long',
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attestation-${surah?.transliteration.toLowerCase().replace(/[^a-z]/g, '-')}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Card className="border-2 border-primary/30 overflow-hidden">
      <div className="bg-gradient-to-r from-primary/10 via-transparent to-gold-warm/10 p-1" />
      
      <CardContent className="py-8 text-center" ref={certificateRef}>
        {/* Award icon */}
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-gold-warm/20 rounded-full flex items-center justify-center">
            <Award className="w-8 h-8 text-gold-warm" />
          </div>
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-primary mb-2 tracking-wide uppercase">
          {t.certificateTitle}
        </h2>
        <div className="flex justify-center items-center gap-2 text-gold-warm mb-6">
          <Star className="w-4 h-4 fill-current" />
          <span className="text-sm">✦</span>
          <Star className="w-4 h-4 fill-current" />
        </div>

        {/* Surah name */}
        <div className="mb-6">
          <h3 className="font-arabic text-4xl mb-2" dir="rtl">{surah?.name}</h3>
          <p className="text-lg text-muted-foreground">{surah?.transliteration}</p>
        </div>

        {/* Recipient */}
        <div className="mb-6">
          <p className="text-sm text-muted-foreground mb-1">Ce certificat est décerné à</p>
          <p className="text-2xl font-semibold text-primary">{userName}</p>
          <p className="text-sm text-muted-foreground mt-1">
            pour avoir maîtrisé avec excellence la récitation de cette sourate
          </p>
        </div>

        {/* Score */}
        <div className="mb-6">
          <div className="text-5xl font-bold text-primary">{averageScore}%</div>
          <p className="text-sm text-muted-foreground">Score moyen</p>
        </div>

        {/* Details */}
        <div className="flex justify-center gap-8 mb-6">
          <div className="text-center">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Lecture</p>
            <p className="font-medium">{qiraat}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Versets</p>
            <p className="font-medium">{surah?.verses}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Juz'</p>
            <p className="font-medium">{surah?.juz}</p>
          </div>
        </div>

        {/* Date */}
        <div className="border-t pt-4">
          <p className="text-sm text-muted-foreground">
            Délivré le {completionDate.toLocaleDateString('fr-FR', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>
      </CardContent>

      {/* Actions */}
      <div className="border-t p-4 flex justify-center gap-3">
        <Button variant="outline" size="sm" onClick={handleDownload}>
          <Download className="w-4 h-4 mr-2" />
          {t.download}
        </Button>
        <Button variant="outline" size="sm">
          <Share2 className="w-4 h-4 mr-2" />
          {t.share}
        </Button>
        {onClose && (
          <Button variant="ghost" size="sm" onClick={onClose}>
            {t.close}
          </Button>
        )}
      </div>
    </Card>
  );
};
