import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, ShoppingCart, Star, BookOpen, Headphones, FileText, Video, Moon, Heart, Calendar, Map, GripVertical, Settings, X, Check } from 'lucide-react';
import { GeometricPattern } from '@/components/decorative/GeometricPattern';

interface BoutiqueProps {
  onBack: () => void;
}

interface Product {
  id: number;
  category: string;
  title: string;
  titleAr: string;
  description: string;
  price: number;
  originalPrice: number | null;
  iconName: string;
  color: string;
  bg: string;
  badge: string | null;
  stars: number;
  active: boolean;
}

const ICON_MAP: Record<string, React.ElementType> = {
  Calendar, BookOpen, FileText, Heart, Moon, Headphones, Video, Map, Settings,
};

const INITIAL_PRODUCTS: Product[] = [
  { id: 1, category: "pdf", title: "Planner islamique 2026", titleAr: "المخطط الاسلامي 2026", description: "Organisateur annuel : prieres, objectifs, suivi memorisation Coran, rappels dhikr - PDF imprimable 120 pages", price: 7.90, originalPrice: 12.90, iconName: "Calendar", color: "text-emerald-600", bg: "bg-emerald-50", badge: "Bestseller", stars: 5, active: true },
  { id: 2, category: "pdf", title: "Guide complet du Tajwid illustre", titleAr: "دليل التجويد الشامل", description: "Toutes les regles de tajwid avec exemples coraniques et schemas - 80 pages illustrees", price: 9.90, originalPrice: 14.90, iconName: "BookOpen", color: "text-blue-600", bg: "bg-blue-50", badge: null, stars: 5, active: true },
  { id: 3, category: "pdf", title: "Fiches memo 10 Qiraat", titleAr: "بطاقات القراءات العشر", description: "Resume visuel des 10 lectures canoniques avec regles specifiques - 40 fiches PDF", price: 7.90, originalPrice: null, iconName: "FileText", color: "text-purple-600", bg: "bg-purple-50", badge: "Nouveau", stars: 4, active: true },
  { id: 4, category: "pdf", title: "Tracker de Dhikr quotidien", titleAr: "متتبع الذكر اليومي", description: "Fiche de suivi des adhkars du matin et du soir selon la Sunnah - PDF imprimable hebdomadaire", price: 4.90, originalPrice: null, iconName: "Heart", color: "text-rose-600", bg: "bg-rose-50", badge: null, stars: 5, active: true },
  { id: 5, category: "pdf", title: "Journal Ramadan 30 jours", titleAr: "مجلة رمضان 30 يوما", description: "Journal interactif : objectifs spirituels, suivi tilawah, dou'as, reflexions quotidiennes - PDF 60 pages", price: 6.90, originalPrice: null, iconName: "Moon", color: "text-indigo-600", bg: "bg-indigo-50", badge: null, stars: 5, active: true },
  { id: 6, category: "pdf", title: "Pack Douas essentielles illustrees", titleAr: "مجموعة الادعية المصورة", description: "60 douas authentiques du Quran et de la Sunnah avec translitteration et traduction - PDF 60 pages", price: 8.90, originalPrice: null, iconName: "BookOpen", color: "text-amber-600", bg: "bg-amber-50", badge: null, stars: 5, active: true },
  { id: 7, category: "pdf", title: "Roadmap memorisation Juz Amma", titleAr: "خطة حفظ جزء عم", description: "Programme structure 90 jours pour memoriser Juz Amma avec revisions espacees - PDF + tableaux de suivi", price: 9.90, originalPrice: null, iconName: "Map", color: "text-teal-600", bg: "bg-teal-50", badge: "Populaire", stars: 5, active: true },
  { id: 8, category: "audio", title: "Cours audio Tajwid debutant", titleAr: "دروس صوتية في التجويد للمبتدئين", description: "12 lecons progressives sur les regles fondamentales du tajwid - duree totale 4h - MP3", price: 14.90, originalPrice: 19.90, iconName: "Headphones", color: "text-cyan-600", bg: "bg-cyan-50", badge: null, stars: 4, active: true },
  { id: 9, category: "audio", title: "Recitations MP3 - 30 Juz complets", titleAr: "تلاوات mp3 - 30 جزءاً كاملاً", description: "Coran complet en MP3 haute qualite avec 3 recitateurs (Hafs, Warsh, Qalun) - ideal memorisation", price: 12.90, originalPrice: null, iconName: "Headphones", color: "text-orange-600", bg: "bg-orange-50", badge: null, stars: 4, active: true },
  { id: 10, category: "video", title: "Mini-cours video Tajwid essentiel", titleAr: "دروس فيديو - قواعد التجويد الاساسية", description: "8 videos HD couvrant les regles essentielles du tajwid avec exercices pratiques - 4h de contenu", price: 24.90, originalPrice: 34.90, iconName: "Video", color: "text-red-600", bg: "bg-red-50", badge: "Premium", stars: 5, active: true },
];

const AdminPanel = ({ products, setProducts, onClose }: { products: Product[]; setProducts: (p: Product[]) => void; onClose: () => void; }) => {
  const dragIndex = useRef<number | null>(null);
  const dragOverIndex = useRef<number | null>(null);

  const handleDragStart = (index: number) => { dragIndex.current = index; };
  const handleDragOver = (e: React.DragEvent, index: number) => { e.preventDefault(); dragOverIndex.current = index; };
  const handleDrop = () => {
    if (dragIndex.current === null || dragOverIndex.current === null) return;
    const updated = [...products];
    const dragged = updated.splice(dragIndex.current, 1)[0];
    updated.splice(dragOverIndex.current, 0, dragged);
    setProducts(updated);
    dragIndex.current = null;
    dragOverIndex.current = null;
  };
  const toggleActive = (id: number) => { setProducts(products.map(p => p.id === id ? { ...p, active: !p.active } : p)); };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-background rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold flex items-center gap-2"><Settings className="w-5 h-5 text-primary" />Admin — Gerer les produits</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-4 text-sm text-muted-foreground bg-muted/30">Glissez-deposez pour reorganiser · Cliquez sur le switch pour activer/desactiver</div>
        <div className="overflow-y-auto flex-1 p-4 space-y-2">
          {products.map((product, index) => {
            const IconComp = ICON_MAP[product.iconName] || FileText;
            return (
              <div key={product.id} draggable onDragStart={() => handleDragStart(index)} onDragOver={(e) => handleDragOver(e, index)} onDrop={handleDrop} className={"flex items-center gap-3 p-3 rounded-xl border bg-card cursor-grab active:cursor-grabbing transition-opacity " + (!product.active ? "opacity-50" : "")}>
                <GripVertical className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <div className={"w-8 h-8 rounded-lg " + product.bg + " flex items-center justify-center flex-shrink-0"}>
                  <IconComp className={"w-4 h-4 " + product.color} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{product.title}</p>
                  <p className="text-xs text-muted-foreground">{product.price}€ · {product.category.toUpperCase()}</p>
                </div>
                <button onClick={() => toggleActive(product.id)} className={"w-10 h-6 rounded-full transition-colors flex-shrink-0 relative " + (product.active ? "bg-primary" : "bg-muted")}>
                  <div className={"w-4 h-4 bg-white rounded-full absolute top-1 transition-all " + (product.active ? "left-5" : "left-1")} />
                </button>
              </div>
            );
          })}
        </div>
        <div className="p-4 border-t flex justify-end">
          <Button onClick={onClose} className="flex items-center gap-2"><Check className="w-4 h-4" />Enregistrer</Button>
        </div>
      </div>
    </div>
  );
};

export const Boutique: React.FC<BoutiqueProps> = ({ onBack }) => {
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [cart, setCart] = useState<number[]>([]);
  const [filter, setFilter] = useState<string>("all");
  const [showAdmin, setShowAdmin] = useState(false);
  const [adminClicks, setAdminClicks] = useState(0);

  const activeProducts = products.filter(p => p.active);
  const filtered = filter === "all" ? activeProducts : activeProducts.filter(p => p.category === filter);
  const cartCount = cart.length;
  const cartTotal = cart.reduce((sum, id) => { const p = products.find(p => p.id === id); return sum + (p ? p.price : 0); }, 0);

  const toggleCart = (id: number) => { setCart(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]); };

  const handleTitleClick = () => {
    const next = adminClicks + 1;
    setAdminClicks(next);
    if (next >= 5) { setShowAdmin(true); setAdminClicks(0); }
  };

  const categories = [
    { key: "all", label: "Tout", count: activeProducts.length },
    { key: "pdf", label: "PDF et Livres", count: activeProducts.filter(p => p.category === "pdf").length },
    { key: "audio", label: "Audio", count: activeProducts.filter(p => p.category === "audio").length },
    { key: "video", label: "Videos", count: activeProducts.filter(p => p.category === "video").length },
  ];

  return (
    <div className="min-h-screen bg-background relative">
      <GeometricPattern className="text-primary" opacity={0.03} />
      {showAdmin && <AdminPanel products={products} setProducts={setProducts} onClose={() => setShowAdmin(false)} />}

      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={onBack}><ArrowLeft className="w-4 h-4 mr-2" />Retour</Button>
            <h1 className="font-bold text-lg cursor-default select-none" onClick={handleTitleClick}>Boutique Islamique</h1>
            {cartCount > 0 ? (
              <div className="flex items-center gap-2">
                <Badge variant="default" className="flex items-center gap-1"><ShoppingCart className="w-3 h-3" />{cartCount} · {cartTotal.toFixed(2)}€</Badge>
                <Button size="sm">Commander</Button>
              </div>
            ) : <div className="w-24" />}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="text-center space-y-3 mb-8">
          <h2 className="text-2xl font-bold">Ressources digitales islamiques</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">Planners, guides, cours audio et videos — tous conformes a la Sunnah du Prophete</p>
        </div>

        <div className="flex flex-wrap gap-2 mb-8 justify-center">
          {categories.map(cat => (
            <button key={cat.key} onClick={() => setFilter(cat.key)} className={"px-4 py-2 rounded-full text-sm font-medium transition-colors border " + (filter === cat.key ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border text-muted-foreground hover:text-foreground")}>
              {cat.label} ({cat.count})
            </button>
          ))}
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(product => {
            const inCart = cart.includes(product.id);
            const IconComp = ICON_MAP[product.iconName] || FileText;
            return (
              <Card key={product.id} className={"relative overflow-hidden hover:shadow-lg transition-all " + (inCart ? "ring-2 ring-primary" : "")}>
                {product.badge && <Badge className="absolute top-3 right-3 z-10">{product.badge}</Badge>}
                <CardHeader className="pb-3">
                  <div className={"w-12 h-12 rounded-xl " + product.bg + " flex items-center justify-center mb-3"}>
                    <IconComp className={"w-6 h-6 " + product.color} />
                  </div>
                  <CardTitle className="text-base leading-snug">{product.title}</CardTitle>
                  <p className="text-xs text-muted-foreground">{product.titleAr}</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground leading-relaxed">{product.description}</p>
                  <div className="flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={"w-3 h-3 " + (i < product.stars ? "text-amber-400 fill-amber-400" : "text-muted")} />
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-primary">{product.price.toFixed(2)}€</span>
                    {product.originalPrice && (
                      <>
                        <span className="text-sm text-muted-foreground line-through">{product.originalPrice.toFixed(2)}€</span>
                        <Badge variant="secondary" className="text-xs">-{Math.round((1 - product.price / product.originalPrice) * 100)}%</Badge>
                      </>
                    )}
                  </div>
                  <Button className="w-full" variant={inCart ? "outline" : "default"} onClick={() => toggleCart(product.id)}>
                    {inCart ? <><Check className="w-4 h-4 mr-2" />Dans le panier</> : <><ShoppingCart className="w-4 h-4 mr-2" />Ajouter au panier</>}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="mt-12 grid grid-cols-3 gap-4 text-center text-sm text-muted-foreground">
          <div className="space-y-1"><div className="text-2xl">🔒</div><p className="font-medium text-foreground">Paiement securise</p><p>Via Paddle</p></div>
          <div className="space-y-1"><div className="text-2xl">⚡</div><p className="font-medium text-foreground">Acces immediat</p><p>Telechargement instantane</p></div>
          <div className="space-y-1"><div className="text-2xl">✅</div><p className="font-medium text-foreground">Conformes a la Sunnah</p><p>Verifies par des oulémas</p></div>
        </div>
      </main>
    </div>
  );
};

export default Boutique;
