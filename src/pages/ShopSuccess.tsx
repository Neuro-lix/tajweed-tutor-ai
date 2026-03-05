import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle, Download, ArrowLeft, Loader2, Zap } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useCredits } from '@/hooks/useCredits';

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
  const [downloading, setDownloading] = useState<string | null>(null);
  const [creditsAdded, setCreditsAdded] = useState(false);
  const [addingCredits, setAddingCredits] = useState(false);

  const packId = searchParams.get('pack');
  const packInfo = packId ? PACK_CREDITS[packId] : null;

  // Add credits if pack purchase
  useEffect(() => {
    if (!packInfo || !user || creditsAdded || addingCredits) return;

    const addCredits = async () => {
      setAddingCredits(true);
      try {
        const { error } = await supabase.rpc('add_credits', {
          p_user_id: user.id,
          p_amount: packInfo.amount,
          p_description: `Achat ${packInfo.label} - ${packInfo.amount} crédits`,
        });

        if (error) throw error;

        setCreditsAdded(true);
        await refetch();
        toast({
          title: '✅ Crédits ajoutés !',
          description: `${packInfo.amount} crédits ont été ajoutés à votre compte.`,
        });
      } catch (err: any) {
        console.error('Error adding credits:', err);
        toast({
          title: 'Erreur',
          description: "Les crédits n'ont pas pu être ajoutés. Contactez le support.",
          variant: 'destructive',
        });
      } finally {
        setAddingCredits(false);
      }
    };

    addCredits();
  }, [packInfo, user, creditsAdded, addingCredits]);

  const handleDownload = async (fileName: string) => {
    setDownloading(fileName);
    try {
      const { data, error } = await supabase.storage
        .from('pdfs')
        .createSignedUrl(fileName, 3600);

      if (error || !data?.signedUrl) {
        throw new Error(error?.message || 'Impossible de générer le lien');
      }

      window.open(data.signedUrl, '_blank');
    } catch (err: any) {
      toast({
        title: 'Erreur de téléchargement',
        description: err.message || 'Veuillez réessayer plus tard.',
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
          Merci pour votre achat ! 🎉
        </h1>

        {/* Credit pack success */}
        {packInfo && (
          <div className="rounded-3xl border-2 border-primary/20 bg-gradient-to-b from-primary/10 to-card p-8 space-y-4">
            {addingCredits ? (
              <div className="flex items-center justify-center gap-2 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Ajout des crédits en cours...</span>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-center gap-2 text-primary">
                  <Zap className="h-6 w-6" />
                  <span className="text-2xl font-bold">+{packInfo.amount} crédits</span>
                </div>
                {credits !== null && (
                  <p className="text-muted-foreground">
                    Solde actuel : <span className="font-semibold text-foreground">{credits} crédits</span>
                  </p>
                )}
              </>
            )}
            <Button
              size="lg"
              className="rounded-2xl"
              onClick={() => navigate('/')}
            >
              Retour à la récitation
            </Button>
          </div>
        )}

        {/* PDF downloads */}
        {!packInfo && (
          <>
            <p className="text-muted-foreground text-lg">
              Téléchargez vos fichiers ci-dessous. Les liens expirent dans 1 heure.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
              {PDF_FILES.map((pdf) => (
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
          Retour à la boutique
        </Button>
      </div>
    </div>
  );
};

export default ShopSuccess;
