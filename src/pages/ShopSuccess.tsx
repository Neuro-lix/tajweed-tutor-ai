import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle, Download, ArrowLeft, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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

const ShopSuccess: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [downloading, setDownloading] = useState<string | null>(null);

  const handleDownload = async (fileName: string, displayName: string) => {
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
          Merci pour votre achat! 🎉
        </h1>
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
              onClick={() => handleDownload(pdf.file, pdf.name)}
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
