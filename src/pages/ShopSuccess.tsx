import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle, Download, ArrowLeft, Loader2, Zap } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useCredits } from '@/hooks/useCredits';
import { useLanguage } from '@/contexts/LanguageContext';

const PDF_FILES = [
  { name: 'Hifz Tracker', file: 'hifz-tracker.pdf' },
  { name: 'Makharij Al-Huruf', file: 'makharij.pdf' },
  { name: 'Journal de Correction', file: 'journal-correction.pdf' },
  { name: 'Planning de Révision', file: 'planning-revision.pdf' },
  { name: 'Méditation (Tadabbur)', file: 'tadabbur.pdf' },
  { name: 'Guide Waqf', file: 'guide-waqf.pdf' },
  { name: 'Objectifs Annuels', file: 'objectifs-annuels.pdf' },
  { name: "Dou'as du Coran", file: 'duas-coran.pdf' },
  { name: 'Livret 1 Complet', file: 'livret-1-complet.pdf' },
  { name: 'Livret 2 Complet', file: 'livret-2-complet.pdf' },
  { name: 'Idgham — Règles de Fusion', file: 'tajweed-idgham.pdf' },
  { name: 'Ikhfa — Dissimulation', file: 'tajweed-ikhfa.pdf' },
  { name: 'Qalqala — Vibration', file: 'tajweed-qalqala.pdf' },
  { name: 'Al-Fatiha — Fiche Complète', file: 'memorisation-al-fatiha.pdf' },
  { name: 'Al-Ikhlas — Fiche Complète', file: 'memorisation-al-ikhlas.pdf' },
  { name: 'Al-Falaq & An-Nas', file: 'memorisation-al-falaq-an-nas.pdf' },
];

const PACK_CREDITS: Record<string, { amount: number; label: string }> = {
  starter: { amount: 50, label: 'Pack Starter' },
  standard: { amount: 150, label: 'Pack Standard' },
  premium: { amount: 400, label: 'Pack Premium' },
};

const ShopSuccess: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { user } = useAuth();
  const { credits, refetch } = useCredits();
  const { t } = useLanguage();
  const [downloading, setDownloading] = useState<string | null>(null);
  const [creditsAdded, setCreditsAdded] = useState(false);
  const [addingCredits, setAddingCredits] = useState(false);

  const packId = searchParams.get('pack');
  const pdfParam = searchParams.get('pdf');
  const packInfo = packId ? PACK_CREDITS[packId] : null;
  const filesToShow = pdfParam
    ? PDF_FILES.filter(f => f.file === pdfParam)
    : (!packInfo ? PDF_FILES : []);

  useEffect(() => {
    if (!packInfo || !user) return;

    setAddingCredits(true);
    const interval = setInterval(async () => {
      await refetch();
    }, 2000);

    const timeout = setTimeout(() => {
      clearInterval(interval);
      setAddingCredits(false);
      if (!creditsAdded) {
        toast({
          title: t.shopSuccessWaitingConfirm,
          description: t.shopSuccessWaitingDesc,
        });
      }
    }, 30000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [packInfo, user]);

  useEffect(() => {
    if (!packInfo || creditsAdded || !addingCredits) return;
    if (credits !== null && credits > 0) {
      setCreditsAdded(true);
      setAddingCredits(false);
      toast({
        title: t.shopSuccessCreditsAdded,
        description: t.shopSuccessCreditsAddedDesc,
      });
    }
  }, [credits, packInfo, creditsAdded, addingCredits]);

  const handleDownload = async (fileName: string) => {
    setDownloading(fileName);
    try {
      const { data, error } = await supabase.storage
        .from('pdfs')
        .createSignedUrl(fileName, 3600);

      if (error || !data?.signedUrl) {
        throw new Error(error?.message || t.shopSuccessDownloadError);
      }

      window.open(data.signedUrl, '_blank');
    } catch (err) {
      toast({
        title: t.shopSuccessDownloadError,
        description: err.message || t.shopSuccessRetryLater,
        variant: 'destructive',
      });
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-16">
      <div className="max-w-2xl w-full text-center space-y-8">
        <CheckCircle className="h-20 w-20 text-primary mx-auto" />
        <h1 className="font-serif text-3xl md:text-4xl font-bold text-foreground">
          {t.shopSuccessTitle}
        </h1>

        {packInfo && (
          <div className="rounded-3xl border-2 border-primary/20 bg-gradient-to-b from-primary/10 to-card p-8 space-y-4">
            {addingCredits ? (
              <div className="flex items-center justify-center gap-2 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>{t.shopSuccessAddingCredits}</span>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-center gap-2 text-primary">
                  <Zap className="h-6 w-6" />
                  <span className="text-2xl font-bold">+{packInfo.amount} {t.creditsLabel}</span>
                </div>
                {credits !== null && (
                  <p className="text-muted-foreground">
                    {t.shopSuccessCurrentBalance} : <span className="font-semibold text-foreground">{credits} {t.creditsLabel}</span>
                  </p>
                )}
              </>
            )}
            <Button
              size="lg"
              className="rounded-2xl"
              onClick={() => navigate('/')}
            >
              {t.shopSuccessBackToRecitation}
            </Button>
          </div>
        )}

        {filesToShow.length > 0 && (
          <>
            <p className="text-muted-foreground text-lg">
              {t.shopSuccessDownloadDesc}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
              {filesToShow.map((pdf) => (
                <Button
                  key={pdf.file}
                  variant="outline"
                  className="justify-start rounded-2xl h-auto py-3 px-4"
                  disabled={downloading === pdf.file}
                  onClick={() => handleDownload(pdf.file)}
                >
                  {downloading === pdf.file ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4 mr-2 flex-shrink-0" />
                  )}
                  <span className="truncate">{pdf.name}</span>
                </Button>
              ))}
            </div>
          </>
        )}

        <Button
          variant="ghost"
          className="rounded-2xl"
          onClick={() => navigate('/shop')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t.shopSuccessBackToShop}
        </Button>
      </div>
    </div>
  );
};

export default ShopSuccess;
