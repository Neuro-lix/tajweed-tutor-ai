import React from 'react';
import { ShoppingBag, Star, Sparkles, BookOpen, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';

const PAYPAL_EMAIL = 'YOUR_PAYPAL_EMAIL@example.com';
const RETURN_URL = 'https://tajweedtutorai.com/shop/success';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  icon: string;
  pdfFile: string;
}

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

const handleBuy = (itemName: string, price: number) => {
  const paypalUrl = `https://www.paypal.com/cgi-bin/webscr?cmd=_xclick&business=${PAYPAL_EMAIL}&item_name=${encodeURIComponent(itemName)}&amount=${price}&currency_code=EUR&return=${encodeURIComponent(RETURN_URL)}`;
  window.open(paypalUrl, '_blank');
};

const Shop: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <ShoppingBag className="h-5 w-5 text-primary" />
          <span className="font-semibold text-lg text-foreground">Boutique</span>
        </div>
      </header>

      {/* Hero */}
      <section className="py-16 px-4 text-center bg-gradient-to-b from-primary/5 to-background">
        <div className="container mx-auto max-w-3xl">
          <h1 className="font-serif text-4xl md:text-5xl font-bold text-foreground mb-4">
            ✨ Boutique
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Des outils premium pour votre parcours coranique
          </p>
        </div>
      </section>

      <div className="container mx-auto px-4 pb-20 space-y-16">

        {/* Bundle Banner */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary/90 to-accent/80 p-8 md:p-12 text-primary-foreground shadow-glow">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-4 right-4 text-6xl">🕋</div>
            <div className="absolute bottom-4 left-4 text-4xl">📖</div>
          </div>
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <Badge className="bg-accent text-accent-foreground mb-3 text-sm font-bold px-3 py-1">
                <Star className="h-3 w-3 mr-1" /> Meilleur prix
              </Badge>
              <h2 className="font-serif text-3xl md:text-4xl font-bold mb-2">
                Bundle Complet — Les 2 Livrets
              </h2>
              <p className="text-primary-foreground/80 text-lg">
                "Mon Voyage avec le Coran" + "Master Collection Tajweed"
              </p>
              <p className="text-sm text-primary-foreground/60 mt-2 line-through">10€</p>
            </div>
            <div className="text-center flex-shrink-0">
              <div className="text-5xl font-bold mb-3">9€</div>
              <Button
                size="lg"
                className="bg-accent text-accent-foreground hover:bg-accent/90 rounded-2xl px-8 font-semibold text-lg shadow-card"
                onClick={() => handleBuy('Bundle Complet - 2 Livrets', 9)}
              >
                <Sparkles className="h-5 w-5 mr-2" />
                Acheter le Bundle
              </Button>
            </div>
          </div>
        </section>

        {/* Individual Sheets */}
        <section>
          <h2 className="font-serif text-2xl md:text-3xl font-bold text-foreground mb-2">
            Fiches Individuelles
          </h2>
          <p className="text-muted-foreground mb-8">Extraites du Livret 2 — 0,99€ chacune</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {individualSheets.map((sheet) => (
              <div
                key={sheet.id}
                className="group rounded-3xl border border-border bg-card p-5 md:p-6 flex flex-col items-center text-center shadow-soft hover:shadow-card transition-all duration-300 hover:-translate-y-1"
              >
                <div className="text-4xl mb-3">{sheet.icon}</div>
                <h3 className="font-semibold text-foreground text-sm md:text-base mb-1 leading-tight">
                  {sheet.name}
                </h3>
                <p className="text-xs text-muted-foreground mb-4 line-clamp-2">{sheet.description}</p>
                <div className="mt-auto w-full">
                  <div className="text-lg font-bold text-primary mb-2">0,99€</div>
                  <Button
                    size="sm"
                    className="w-full rounded-2xl"
                    onClick={() => handleBuy(sheet.name, sheet.price)}
                  >
                    Acheter
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Workbooks */}
        <section>
          <h2 className="font-serif text-2xl md:text-3xl font-bold text-foreground mb-2">
            Livrets Complets
          </h2>
          <p className="text-muted-foreground mb-8">Tout-en-un pour un apprentissage structuré</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Livret 1 */}
            <div className="rounded-3xl border-2 border-primary/20 bg-gradient-to-b from-card to-primary/5 p-8 shadow-card hover:shadow-glow transition-all duration-300">
              <div className="flex items-start gap-4 mb-4">
                <div className="text-5xl">📗</div>
                <div>
                  <h3 className="font-serif text-xl md:text-2xl font-bold text-foreground">
                    Livret 1
                  </h3>
                  <p className="text-primary font-semibold">Mon Voyage avec le Coran</p>
                </div>
              </div>
              <p className="text-muted-foreground mb-6 text-sm">
                Le guide complet pour démarrer votre parcours de mémorisation et de récitation avec des outils structurés et motivants.
              </p>
              <div className="flex items-center justify-between">
                <span className="text-3xl font-bold text-foreground">5€</span>
                <Button
                  size="lg"
                  className="rounded-2xl px-6"
                  onClick={() => handleBuy('Livret 1 - Mon Voyage avec le Coran', 5)}
                >
                  <BookOpen className="h-4 w-4 mr-2" />
                  Acheter
                </Button>
              </div>
            </div>

            {/* Livret 2 */}
            <div className="rounded-3xl border-2 border-accent/30 bg-gradient-to-b from-card to-accent/5 p-8 shadow-card hover:shadow-glow transition-all duration-300">
              <div className="flex items-start gap-4 mb-4">
                <div className="text-5xl">📘</div>
                <div>
                  <h3 className="font-serif text-xl md:text-2xl font-bold text-foreground">
                    Livret 2
                  </h3>
                  <p className="text-accent font-semibold">Master Collection Tajweed</p>
                </div>
              </div>
              <p className="text-muted-foreground mb-6 text-sm">
                La collection complète de 8 fiches spécialisées pour maîtriser tous les aspects du Tajweed et de la récitation.
              </p>
              <div className="flex items-center justify-between">
                <span className="text-3xl font-bold text-foreground">5€</span>
                <Button
                  size="lg"
                  variant="gold"
                  className="rounded-2xl px-6"
                  onClick={() => handleBuy('Livret 2 - Master Collection Tajweed', 5)}
                >
                  <BookOpen className="h-4 w-4 mr-2" />
                  Acheter
                </Button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Shop;
