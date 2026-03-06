import React, { useState } from 'react';
import { ShoppingBag, Star, Sparkles, BookOpen, ArrowLeft, Zap, Loader2, Bitcoin, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useNavigate } from 'react-router-dom';
import { useCredits } from '@/hooks/useCredits';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import ProductPreviewModal from '@/components/shop/ProductPreviewModal';
import { sheetPreviews, livret1Pages, livret2Pages } from '@/data/shopPreviews';

const PAYPAL_EMAIL = 'YOUR_PAYPAL_EMAIL@example.com';
const RETURN_URL = 'https://tajweedtutorai.com/shop/success';
const CANCEL_URL = 'https://tajweedtutorai.com/shop';

interface CreditPack {
  id: string;
  name: string;
  credits: number;
  price: number;
  badge?: string;
  popular?: boolean;
}

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  icon: string;
  pdfFile?: string;
}

const creditPacks: CreditPack[] = [
  { id: 'starter', name: 'Pack Starter', credits: 50, price: 1.99 },
  { id: 'standard', name: 'Pack Standard', credits: 150, price: 4.99, popular: true },
  { id: 'premium', name: 'Pack Premium', credits: 400, price: 9.99, badge: 'Meilleur prix' },
];

const individualSheets: Product[] = [
  { id: 'hifz', name: 'Hifz Tracker', description: 'Objectif Mémorisation', price: 0.99, icon: '📊', pdfFile: 'hifz-tracker.pdf' },
  { id: 'makharij', name: 'Makharij Al-Huruf', description: "Points d'Articulation", price: 0.99, icon: '🗣️', pdfFile: 'makharij.pdf' },
  { id: 'journal', name: 'Journal de Correction', description: 'Suivi de vos erreurs et progrès', price: 0.99, icon: '📝', pdfFile: 'journal-correction.pdf' },
  { id: 'planning', name: 'Planning de Révision', description: 'Mouradjaa organisée', price: 0.99, icon: '📅', pdfFile: 'planning-revision.pdf' },
  { id: 'tadabbur', name: 'Méditation (Tadabbur)', description: 'Réflexion profonde sur les versets', price: 0.99, icon: '🤲', pdfFile: 'tadabbur.pdf' },
  { id: 'waqf', name: 'Guide Waqf', description: 'Signes de Ponctuation', price: 0.99, icon: '⏸️', pdfFile: 'guide-waqf.pdf' },
  { id: 'objectifs', name: 'Objectifs Annuels', description: 'Planifiez votre année coranique', price: 0.99, icon: '🎯', pdfFile: 'objectifs-annuels.pdf' },
  { id: 'duas', name: "Dou'as du Coran", description: 'Invocations coraniques essentielles', price: 0.99, icon: '🕌', pdfFile: 'duas-coran.pdf' },
];

const handlePaypal = (itemName: string, price: number, packId?: string) => {
  const returnUrl = packId ? `${RETURN_URL}?pack=${packId}` : RETURN_URL;
  const paypalUrl = `https://www.paypal.com/cgi-bin/webscr?cmd=_xclick&business=${PAYPAL_EMAIL}&item_name=${encodeURIComponent(itemName)}&amount=${price}&currency_code=EUR&return=${encodeURIComponent(returnUrl)}&cancel_return=${encodeURIComponent(CANCEL_URL)}`;
  window.open(paypalUrl, '_blank');
};

type PreviewData = {
  name: string;
  icon: string;
  price: number;
  description: string;
  bullets: string[];
  contents: string;
  pages?: { name: string }[];
  totalPages?: number;
};

const Shop: React.FC = () => {
  const navigate = useNavigate();
  const { credits } = useCredits();
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [cryptoLoading, setCryptoLoading] = useState<string | null>(null);
  const [preview, setPreview] = useState<PreviewData | null>(null);

  const handleCrypto = async (productName: string, price: number, productType?: string) => {
    const userId = user?.id || `guest-${Date.now()}`;
    const key = `${productName}-${price}`;
    setCryptoLoading(key);
    try {
      console.log('[Crypto] Creating payment:', { productName, price, productType, userId });
      const { data, error } = await supabase.functions.invoke('create-crypto-payment', {
        body: { amount: price, productName, productType: productType || '', userId },
      });
      console.log('[Crypto] Response:', { data, error });
      if (error) {
        const msg = typeof error === 'object' && 'message' in error ? error.message : JSON.stringify(error);
        throw new Error(msg);
      }
      if (data?.error) throw new Error(data.error);
      if (data?.invoiceUrl) {
        window.open(data.invoiceUrl, '_blank');
      } else {
        throw new Error('Aucune URL de paiement retournée par NOWPayments');
      }
    } catch (err: any) {
      console.error('[Crypto] Payment error:', err);
      toast({ title: 'Erreur paiement crypto', description: err?.message || 'Erreur inconnue.', variant: 'destructive' });
    } finally {
      setCryptoLoading(null);
    }
  };

  const openSheetPreview = (sheet: Product) => {
    const data = sheetPreviews[sheet.id];
    if (!data) return;
    setPreview({
      name: sheet.name,
      icon: sheet.icon,
      price: sheet.price,
      description: sheet.description,
      bullets: data.bullets,
      contents: data.contents,
    });
  };

  const openLivret1Preview = () => {
    setPreview({
      name: 'Livret 1 — Mon Voyage avec le Coran',
      icon: '📗',
      price: 5,
      description: 'Le guide complet pour démarrer votre parcours coranique',
      bullets: [
        '10 pages de contenu structuré et illustré',
        'Couvre Makharij, Waqf, Hifz, Tadabbur et plus',
        'Pages de coloriage et activités interactives',
        'Planning de révision et vision annuelle',
      ],
      contents: 'Un livret complet qui accompagne le débutant dans toutes les facettes de l\'apprentissage du Coran.',
      pages: livret1Pages,
      totalPages: 10,
    });
  };

  const openLivret2Preview = () => {
    setPreview({
      name: 'Livret 2 — Master Collection Tajweed',
      icon: '📘',
      price: 5,
      description: 'La collection complète de 8 fiches spécialisées',
      bullets: [
        '8 fiches spécialisées pour maîtriser le Tajweed',
        'Hifz Tracker, Makharij Map, Guide Waqf inclus',
        'Journal d\'erreurs et planning Mouradjaa',
        'Tadabbur, objectifs annuels et Dou\'as du Coran',
      ],
      contents: 'Toutes les fiches individuelles réunies dans un livret cohérent et professionnel.',
      pages: livret2Pages,
      totalPages: 8,
    });
  };

  const openBundlePreview = () => {
    setPreview({
      name: 'Bundle Complet — Les 2 Livrets',
      icon: '📚',
      price: 9,
      description: '"Mon Voyage avec le Coran" + "Master Collection Tajweed"',
      bullets: [
        '18 pages au total couvrant tous les aspects du Tajweed',
        'Économisez 1€ par rapport à l\'achat séparé',
        'Livret 1 (10 pages) + Livret 2 (8 pages)',
        'Le pack le plus complet pour progresser rapidement',
      ],
      contents: 'L\'ensemble complet des deux livrets pour un apprentissage structuré et approfondi du Coran.',
      pages: [...livret1Pages, ...livret2Pages],
      totalPages: 18,
    });
  };

  const CryptoButton = ({ name, price, type, size = 'default' }: { name: string; price: number; type?: string; size?: 'sm' | 'default' | 'lg' }) => {
    const key = `${name}-${price}`;
    const isLoading = cryptoLoading === key;
    return (
      <Button variant="outline" size={size} className="w-full rounded-2xl border-2 border-border hover:border-primary" onClick={() => handleCrypto(name, price, type)} disabled={isLoading}>
        {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Bitcoin className="h-4 w-4 mr-2" />}
        Crypto
      </Button>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <ShoppingBag className="h-5 w-5 text-primary" />
          <span className="font-semibold text-lg text-foreground">{t.shopTitle}</span>
          {credits !== null && credits !== undefined && (
            <Badge variant="outline" className="ml-auto">
              <Zap className="h-3 w-3 mr-1" /> {credits} {t.creditsLabel}
            </Badge>
          )}
        </div>
      </header>

      {/* Hero */}
      <section className="py-16 px-4 text-center bg-gradient-to-b from-primary/5 to-background">
        <div className="container mx-auto max-w-3xl">
          <h1 className="font-serif text-4xl md:text-5xl font-bold text-foreground mb-4">✨ {t.shopTitle}</h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">{t.shopSubtitle}</p>
        </div>
      </section>

      {/* Tabs */}
      <div className="container mx-auto px-4 pb-20">
        <Tabs defaultValue="credits" className="w-full">
          <TabsList className="w-full max-w-md mx-auto grid grid-cols-2 mb-10">
            <TabsTrigger value="credits" className="text-sm">⚡ {t.creditsTab}</TabsTrigger>
            <TabsTrigger value="pdf" className="text-sm">📚 {t.pdfTab}</TabsTrigger>
          </TabsList>

          {/* Credits Tab */}
          <TabsContent value="credits" className="space-y-8">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Zap className="h-5 w-5 text-primary" />
                <h2 className="font-serif text-2xl md:text-3xl font-bold text-foreground">{t.creditsTab}</h2>
              </div>
              <p className="text-muted-foreground mb-8">{t.eachAnalysisCredit}</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {creditPacks.map((pack) => (
                  <div key={pack.id} className={`relative rounded-3xl border-2 p-8 flex flex-col items-center text-center shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-card ${pack.popular ? 'border-primary bg-gradient-to-b from-primary/10 to-card' : 'border-border bg-card'}`}>
                    {pack.badge && (
                      <Badge className="absolute -top-3 bg-accent text-accent-foreground text-xs font-bold px-3 py-1"><Star className="h-3 w-3 mr-1" /> {pack.badge}</Badge>
                    )}
                    {pack.popular && !pack.badge && (
                      <Badge className="absolute -top-3 bg-primary text-primary-foreground text-xs font-bold px-3 py-1">Populaire</Badge>
                    )}
                    <Zap className="h-10 w-10 text-primary mb-4" />
                    <h3 className="font-serif text-xl font-bold text-foreground mb-1">{pack.name}</h3>
                    <p className="text-3xl font-bold text-primary mb-1">{pack.credits}</p>
                    <p className="text-sm text-muted-foreground mb-6">analyses</p>
                    <div className="mt-auto w-full space-y-2">
                      <div className="text-2xl font-bold text-foreground mb-3">{pack.price.toFixed(2)}€</div>
                      <Button size="lg" className="w-full rounded-2xl" onClick={() => handlePaypal(`${pack.name} - ${pack.credits} crédits`, pack.price, pack.id)}>
                        <Zap className="h-4 w-4 mr-2" /> PayPal
                      </Button>
                      <CryptoButton name={`${pack.name} - ${pack.credits} crédits`} price={pack.price} type={pack.id} size="lg" />
                      <p className="text-[10px] text-muted-foreground mt-1">BTC · ETH · USDT · +150 cryptos</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* PDF Tab */}
          <TabsContent value="pdf" className="space-y-16">
            {/* Bundle Banner */}
            <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary/90 to-accent/80 p-8 md:p-12 text-primary-foreground shadow-glow">
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-4 right-4 text-6xl">🕋</div>
                <div className="absolute bottom-4 left-4 text-4xl">📖</div>
              </div>
              <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                <div>
                  <Badge className="bg-accent text-accent-foreground mb-3 text-sm font-bold px-3 py-1"><Star className="h-3 w-3 mr-1" /> Meilleur prix</Badge>
                  <h2 className="font-serif text-3xl md:text-4xl font-bold mb-2">Bundle Complet — Les 2 Livrets</h2>
                  <p className="text-primary-foreground/80 text-lg">"Mon Voyage avec le Coran" + "Master Collection Tajweed"</p>
                  <p className="text-sm text-primary-foreground/60 mt-2"><span className="line-through">10€</span> — Économisez 1€</p>
                </div>
                <div className="text-center flex-shrink-0 space-y-2">
                  <div className="text-5xl font-bold mb-3">9€</div>
                  <Button size="lg" variant="outline" className="rounded-2xl px-6 font-semibold w-full border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10" onClick={openBundlePreview}>
                    <Eye className="h-4 w-4 mr-2" /> Aperçu
                  </Button>
                  <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 rounded-2xl px-8 font-semibold text-lg shadow-card w-full" onClick={() => handlePaypal('Bundle Complet - 2 Livrets', 9)}>
                    <Sparkles className="h-5 w-5 mr-2" /> PayPal
                  </Button>
                  <Button size="lg" variant="outline" className="rounded-2xl px-8 font-semibold text-lg w-full border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10" onClick={() => handleCrypto('Bundle Complet - 2 Livrets', 9)} disabled={cryptoLoading === 'Bundle Complet - 2 Livrets-9'}>
                    {cryptoLoading === 'Bundle Complet - 2 Livrets-9' ? <Loader2 className="h-5 w-5 mr-2 animate-spin" /> : <Bitcoin className="h-5 w-5 mr-2" />}
                    Crypto
                  </Button>
                </div>
              </div>
            </section>

            {/* Individual Sheets */}
            <section>
              <h2 className="font-serif text-2xl md:text-3xl font-bold text-foreground mb-2">Fiches Individuelles</h2>
              <p className="text-muted-foreground mb-8">Extraites du Livret 2 — 0,99€ chacune</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                {individualSheets.map((sheet) => (
                  <div key={sheet.id} className="group rounded-3xl border border-border bg-card p-5 md:p-6 flex flex-col items-center text-center shadow-soft hover:shadow-card transition-all duration-300 hover:-translate-y-1">
                    <div className="text-4xl mb-3">{sheet.icon}</div>
                    <h3 className="font-semibold text-foreground text-sm md:text-base mb-1 leading-tight">{sheet.name}</h3>
                    <p className="text-xs text-muted-foreground mb-4 line-clamp-2">{sheet.description}</p>
                    <div className="mt-auto w-full space-y-2">
                      <div className="text-lg font-bold text-primary mb-2">0,99€</div>
                      <Button size="sm" variant="outline" className="w-full rounded-2xl" onClick={() => openSheetPreview(sheet)}>
                        <Eye className="h-3 w-3 mr-1" /> Aperçu
                      </Button>
                      <Button size="sm" className="w-full rounded-2xl" onClick={() => handlePaypal(sheet.name, sheet.price)}>PayPal</Button>
                      <CryptoButton name={sheet.name} price={sheet.price} size="sm" />
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Workbooks */}
            <section>
              <h2 className="font-serif text-2xl md:text-3xl font-bold text-foreground mb-2">Livrets Complets</h2>
              <p className="text-muted-foreground mb-8">Tout-en-un pour un apprentissage structuré</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Livret 1 */}
                <div className="rounded-3xl border-2 border-primary/20 bg-gradient-to-b from-card to-primary/5 p-8 shadow-card hover:shadow-glow transition-all duration-300">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="text-5xl">📗</div>
                    <div>
                      <h3 className="font-serif text-xl md:text-2xl font-bold text-foreground">Livret 1</h3>
                      <p className="text-primary font-semibold">Mon Voyage avec le Coran</p>
                    </div>
                  </div>
                  <p className="text-muted-foreground mb-6 text-sm">Le guide complet pour démarrer votre parcours de mémorisation et de récitation.</p>
                  <div className="space-y-2">
                    <Button size="lg" variant="outline" className="rounded-2xl w-full" onClick={openLivret1Preview}>
                      <Eye className="h-4 w-4 mr-2" /> Aperçu — 10 pages
                    </Button>
                    <div className="flex gap-2">
                      <span className="text-3xl font-bold text-foreground self-center mr-2">5€</span>
                      <Button size="lg" className="rounded-2xl flex-1" onClick={() => handlePaypal('Livret 1 - Mon Voyage avec le Coran', 5)}>
                        <BookOpen className="h-4 w-4 mr-2" /> PayPal
                      </Button>
                      <Button size="lg" variant="outline" className="rounded-2xl flex-1 border-2" onClick={() => handleCrypto('Livret 1 - Mon Voyage avec le Coran', 5)} disabled={cryptoLoading === 'Livret 1 - Mon Voyage avec le Coran-5'}>
                        {cryptoLoading === 'Livret 1 - Mon Voyage avec le Coran-5' ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Bitcoin className="h-4 w-4 mr-2" />}
                        Crypto
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Livret 2 */}
                <div className="rounded-3xl border-2 border-accent/30 bg-gradient-to-b from-card to-accent/5 p-8 shadow-card hover:shadow-glow transition-all duration-300">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="text-5xl">📘</div>
                    <div>
                      <h3 className="font-serif text-xl md:text-2xl font-bold text-foreground">Livret 2</h3>
                      <p className="text-accent font-semibold">Master Collection Tajweed</p>
                    </div>
                  </div>
                  <p className="text-muted-foreground mb-6 text-sm">La collection complète de 8 fiches spécialisées pour maîtriser le Tajweed.</p>
                  <div className="space-y-2">
                    <Button size="lg" variant="outline" className="rounded-2xl w-full" onClick={openLivret2Preview}>
                      <Eye className="h-4 w-4 mr-2" /> Aperçu — 8 pages
                    </Button>
                    <div className="flex gap-2">
                      <span className="text-3xl font-bold text-foreground self-center mr-2">5€</span>
                      <Button size="lg" variant="gold" className="rounded-2xl flex-1" onClick={() => handlePaypal('Livret 2 - Master Collection Tajweed', 5)}>
                        <BookOpen className="h-4 w-4 mr-2" /> PayPal
                      </Button>
                      <Button size="lg" variant="outline" className="rounded-2xl flex-1 border-2" onClick={() => handleCrypto('Livret 2 - Master Collection Tajweed', 5)} disabled={cryptoLoading === 'Livret 2 - Master Collection Tajweed-5'}>
                        {cryptoLoading === 'Livret 2 - Master Collection Tajweed-5' ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Bitcoin className="h-4 w-4 mr-2" />}
                        Crypto
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </TabsContent>
        </Tabs>
      </div>

      {/* Preview Modal */}
      {preview && (
        <ProductPreviewModal
          open={!!preview}
          onClose={() => setPreview(null)}
          product={preview}
          onPaypal={() => { handlePaypal(preview.name, preview.price); setPreview(null); }}
          onCrypto={() => { handleCrypto(preview.name, preview.price); setPreview(null); }}
          cryptoLoading={cryptoLoading === `${preview.name}-${preview.price}`}
        />
      )}
    </div>
  );
};

export default Shop;
