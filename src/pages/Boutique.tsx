import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, ShoppingCart, Star, Download, BookOpen, Headphones, FileText, Video, Tag } from 'lucide-react';
import { GeometricPattern, Star8Point } from '@/components/decorative/GeometricPattern';

interface BoutiqueProps {
  onBack: () => void;
}

const products = [
  // PDF / Livres
  {
    id: 1, category: 'pdf',
    title: 'Guide complet du Tajwīd',
    titleAr: 'دليل التجويد الشامل',
    description: 'Toutes les règles illustrées avec exemples coraniques — 120 pages',
    price: 9.90, originalPrice: 14.90,
    icon: BookOpen, color: 'text-emerald-600', bg: 'bg-emerald-50',
    badge: 'Bestseller', stars: 5,
  },
  {
    id: 2, category: 'pdf',
    title: 'Fiches mémo — 10 Qirā'āt',
    titleAr: 'بطاقات القراءات العشر',
    description: 'Résumé visuel des 10 lectures canoniques — 40 fiches PDF',
    price: 7.90, originalPrice: null,
    icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50',
    badge: null, stars: 4,
  },
  {
    id: 3, category: 'pdf',
    title: 'Planner mémorisation Coran',
    titleAr: 'مخطط حفظ القرآن',
    description: 'Programme jour par jour — 30 juz en 12 mois — PDF à imprimer',
    price: 5.90, originalPrice: null,
    icon: FileText, color: 'text-purple-600', bg: 'bg-purple-50',
    badge: 'Nouveau', stars: 5,
  },
  {
    id: 4, category: 'pdf',
    title: 'Cartes flash — Alphabet arabe',
    titleAr: 'بطاقات الحروف العربية',
    description: '28 cartes illustrées avec makhraj et exemples — idéal enfants',
    price: 4.90, originalPrice: null,
    icon: FileText, color: 'text-orange-600', bg: 'bg-orange-50',
    badge: null, stars: 4,
  },
  // Audio
  {
    id: 5, category: 'audio',
    title: 'Pack récitations — 30 Juz',
    titleAr: 'حزمة التلاوات الكاملة',
    description: 'Récitation complète du Coran en haute qualité — MP3',
    price: 12.90, originalPrice: 19.90,
    icon: Headphones, color: 'text-rose-600', bg: 'bg-rose-50',
    badge: 'Promo', stars: 5,
  },
  {
    id: 6, category: 'audio',
    title: 'Cours audio Tajwīd débutant',
    titleAr: 'دروس التجويد الصوتية للمبتدئين',
    description: '20 leçons audio expliquées en français — 4h de contenu',
    price: 14.90, originalPrice: null,
    icon: Headphones, color: 'text-indigo-600', bg: 'bg-indigo-50',
    badge: null, stars: 4,
  },
  // Cours vidéo
  {
    id: 7, category: 'video',
    title: 'Apprendre l\'arabe en 7 jours',
    titleAr: 'تعلم العربية في 7 أيام',
    description: '14 vidéos HD — de l\'alphabet à la lecture coranique',
    price: 19.90, originalPrice: 29.90,
    icon: Video, color: 'text-amber-600', bg: 'bg-amber-50',
    badge: 'Populaire', stars: 5,
  },
  {
    id: 8, category: 'video',
    title: 'Mini-cours Tajwīd — Règles essentielles',
    titleAr: 'أحكام التجويد الأساسية',
    description: '10 vidéos — Madd, Ghunna, Qalqala, Idgham expliqués',
    price: 24.90, originalPrice: null,
    icon: Video, color: 'text-teal-600', bg: 'bg-teal-50',
    badge: 'Nouveau', stars: 4,
  },
];

const categories = [
  { id: 'all', label: 'Tout', icon: Tag },
  { id: 'pdf', label: 'PDF & Livres', icon: BookOpen },
  { id: 'audio', label: 'Audio', icon: Headphones },
  { id: 'video', label: 'Cours vidéo', icon: Video },
];

export const Boutique: React.FC<BoutiqueProps> = ({ onBack }) => {
  const [activeCategory, setActiveCategory] = useState('all');
  const [cart, setCart] = useState<number[]>([]);

  const filtered = activeCategory === 'all' ? products : products.filter(p => p.category === activeCategory);

  const addToCart = (id: number) => {
    setCart(prev => prev.includes(id) ? prev : [...prev, id]);
  };

  return (
    <div className="min-h-screen bg-background relative">
      <GeometricPattern className="text-primary" opacity={0.03} />

      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={onBack}>
              <ArrowLeft className="w-4 h-4 mr-2" />Retour
            </Button>
            <div className="flex items-center gap-3">
              <Star8Point size={24} className="text-primary" />
              <span className="font-semibold">Boutique islamique</span>
            </div>
            <Button variant="outline" className="relative gap-2">
              <ShoppingCart className="w-4 h-4" />
              Panier
              {cart.length > 0 && (
                <span className="absolute -top-2 -right-2 w-5 h-5 bg-primary text-primary-foreground rounded-full text-xs flex items-center justify-center">
                  {cart.length}
                </span>
              )}
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-5xl">

        {/* Hero */}
        <div className="text-center mb-10 space-y-3">
          <h1 className="text-3xl font-bold">Ressources islamiques digitales</h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            PDF, audio, vidéos — tout ce qu'il faut pour progresser dans l'apprentissage du Coran et du Tajwīd
          </p>
        </div>

        {/* Categories */}
        <div className="flex gap-2 flex-wrap mb-8">
          {categories.map(cat => {
            const Icon = cat.icon;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors border ${
                  activeCategory === cat.id
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background border-border text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className="w-4 h-4" />
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Products grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(product => {
            const Icon = product.icon;
            const inCart = cart.includes(product.id);
            return (
              <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className={`${product.bg} p-6 flex items-center justify-center`}>
                  <Icon className={`w-12 h-12 ${product.color}`} />
                </div>
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-semibold text-foreground">{product.title}</h3>
                      <p className="text-sm text-muted-foreground font-arabic" dir="rtl">{product.titleAr}</p>
                    </div>
                    {product.badge && (
                      <Badge variant={product.badge === 'Promo' ? 'destructive' : 'default'} className="text-xs flex-shrink-0">
                        {product.badge}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{product.description}</p>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: product.stars }).map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                    ))}
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xl font-bold text-primary">{product.price.toFixed(2)}€</span>
                      {product.originalPrice && (
                        <span className="text-sm text-muted-foreground line-through">{product.originalPrice.toFixed(2)}€</span>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant={inCart ? 'secondary' : 'default'}
                      onClick={() => addToCart(product.id)}
                      className="gap-1.5"
                    >
                      {inCart ? (
                        <><Download className="w-3.5 h-3.5" />Ajouté</>
                      ) : (
                        <><ShoppingCart className="w-3.5 h-3.5" />Acheter</>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Footer note */}
        <div className="mt-12 text-center text-sm text-muted-foreground space-y-1">
          <p>💳 Paiement sécurisé via Paddle — Livraison instantanée par email</p>
          <p>🔒 Accès à vie — Compatible mobile, tablette et ordinateur</p>
        </div>
      </main>
    </div>
  );
};

export default Boutique;
