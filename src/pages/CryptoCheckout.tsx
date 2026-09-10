import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Bitcoin, CreditCard, Loader2, Minus, Plus, ShoppingCart, Trash2, CheckCircle2, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useCredits } from '@/hooks/useCredits';
import { useToast } from '@/hooks/use-toast';
import { PageSeo } from '@/components/seo/PageSeo';
import { formatCredits } from '@/lib/credits';
import { SHOP_CATALOG, catalogById } from '@/data/shopCatalog';
import { usePaddleCheckout } from '@/hooks/usePaddleCheckout';

type Step = 'cart' | 'confirm' | 'thanks';

const eur = (n: number) => `${n.toFixed(2)} €`;

const CryptoCheckout: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { credits } = useCredits();
  const { toast } = useToast();
  const paddle = usePaddleCheckout();
  const [cart, setCart] = useState<Record<string, number>>({});
  const [step, setStep] = useState<Step>('cart');
  const [loading, setLoading] = useState(false);

  const lines = useMemo(
    () =>
      Object.entries(cart)
        .filter(([, q]) => q > 0)
        .map(([id, quantity]) => ({ item: catalogById(id)!, quantity }))
        .filter((l) => Boolean(l.item)),
    [cart],
  );

  const totalAmount = useMemo(
    () => Math.round(lines.reduce((s, l) => s + l.item.price * l.quantity, 0) * 100) / 100,
    [lines],
  );
  const totalCredits = useMemo(() => lines.reduce((s, l) => s + l.item.credits * l.quantity, 0), [lines]);

  const setQty = (id: string, delta: number) =>
    setCart((c) => {
      const next = Math.min(Math.max((c[id] ?? 0) + delta, 0), 20);
      return { ...c, [id]: next };
    });

  const payCrypto = async () => {
    if (!user) {
      toast({ title: 'Connexion requise', description: 'Connecte-toi pour payer.', variant: 'destructive' });
      navigate('/auth');
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-crypto-payment', {
        body: { items: lines.map((l) => ({ productId: l.item.id, quantity: l.quantity })) },
      });
      if (error) throw new Error(error.message ?? 'Erreur de paiement');
      if (data?.error) throw new Error(data.error);
      if (!data?.invoiceUrl) throw new Error('Aucun lien de paiement reçu');
      window.open(data.invoiceUrl, '_blank');
      setStep('thanks');
    } catch (err) {
      toast({
        title: 'Paiement crypto impossible',
        description: err instanceof Error ? err.message : 'Erreur inconnue',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Paiement instantané en euros (carte bancaire via Paddle) : uniquement
  // pour un pack de crédits à la fois, crédité automatiquement par le webhook.
  const singleCreditPack = lines.length === 1 && lines[0].item.category === 'credits' && lines[0].quantity === 1
    ? lines[0].item.id.replace('pack_', '')
    : null;

  const payEuro = () => {
    if (!user) {
      navigate('/auth');
      return;
    }
    if (!singleCreditPack) {
      toast({
        title: 'Paiement en euros',
        description: 'La carte bancaire accepte un pack de crédits à la fois. Le crypto accepte le panier complet.',
      });
      return;
    }
    if (!paddle.configured || !paddle.openCheckout(singleCreditPack)) {
      toast({ title: 'Carte bancaire indisponible', description: 'Réessaie dans un instant.', variant: 'destructive' });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <PageSeo
        title="Paiement — Panier crédits & ressources | Tajweed Tutor AI"
        description="Compose ton panier de crédits d'analyse et de ressources tajwīd, puis paie en euros par carte ou en cryptomonnaie."
        path="/shop/crypto"
      />
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/shop')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <ShoppingCart className="h-5 w-5 text-primary" />
          <span className="font-semibold text-lg text-foreground">Panier & paiement</span>
          {credits !== null && credits !== undefined && (
            <Badge variant="outline" className="ml-auto">
              <Zap className="h-3 w-3 mr-1" /> {formatCredits(credits)} crédits
            </Badge>
          )}
        </div>
      </header>

      <main className="container mx-auto px-4 py-10 max-w-5xl space-y-8">
        {step === 'thanks' ? (
          <Card className="text-center py-12">
            <CardContent className="space-y-4">
              <CheckCircle2 className="h-14 w-14 text-primary mx-auto" />
              <h1 className="font-serif text-3xl font-bold">Merci pour ta commande 🤲</h1>
              <p className="text-muted-foreground max-w-md mx-auto">
                Finalise le règlement dans la fenêtre de paiement ouverte. Dès la confirmation du réseau, tes{' '}
                {totalCredits} crédits sont ajoutés automatiquement à ton compte.
              </p>
              <div className="flex flex-wrap gap-3 justify-center pt-2">
                <Button onClick={() => navigate('/my-credits')}>Voir mes crédits</Button>
                <Button variant="outline" onClick={() => { setCart({}); setStep('cart'); }}>
                  Nouveau panier
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
            <div className="space-y-8">
              {(['credits', 'livret', 'fiche'] as const).map((cat) => (
                <section key={cat}>
                  <h2 className="font-serif text-xl font-bold mb-4">
                    {cat === 'credits' ? '⚡ Packs de crédits' : cat === 'livret' ? '📚 Livrets' : '📄 Fiches PDF'}
                  </h2>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {SHOP_CATALOG.filter((i) => i.category === cat).map((item) => {
                      const qty = cart[item.id] ?? 0;
                      return (
                        <div key={item.id} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3">
                          <span className="text-2xl">{item.icon}</span>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium truncate">{item.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {eur(item.price)}
                              {item.credits > 0 && ` · ${item.credits} crédits`}
                            </p>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => setQty(item.id, -1)} disabled={qty === 0}>
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="w-6 text-center text-sm tabular-nums">{qty}</span>
                            <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => setQty(item.id, 1)}>
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>

            <aside className="lg:sticky lg:top-20 h-fit">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    {step === 'confirm' ? 'Confirmation' : 'Récapitulatif'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {lines.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Ton panier est vide.</p>
                  ) : (
                    <ul className="space-y-2">
                      {lines.map((l) => (
                        <li key={l.item.id} className="flex items-start gap-2 text-sm">
                          <span className="flex-1">
                            {l.item.name}
                            <span className="text-muted-foreground"> × {l.quantity}</span>
                          </span>
                          <span className="tabular-nums">{eur(l.item.price * l.quantity)}</span>
                          <button
                            className="text-muted-foreground hover:text-destructive"
                            onClick={() => setCart((c) => ({ ...c, [l.item.id]: 0 }))}
                            aria-label={`Retirer ${l.item.name}`}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}

                  <div className="border-t border-border pt-3 space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Total crédits</span>
                      <span className="font-semibold">{totalCredits}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total</span>
                      <span>{eur(totalAmount)}</span>
                    </div>
                  </div>

                  {step === 'cart' ? (
                    <Button className="w-full rounded-2xl" disabled={lines.length === 0} onClick={() => setStep('confirm')}>
                      Passer au paiement
                    </Button>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground">
                        Vérifie ta commande puis choisis ton moyen de paiement.
                      </p>
                      <Button className="w-full rounded-2xl" onClick={payEuro} disabled={!paddle.configured}>
                        <CreditCard className="h-4 w-4 mr-2" /> Payer {eur(totalAmount)} par carte
                      </Button>
                      <Button variant="outline" className="w-full rounded-2xl" onClick={payCrypto} disabled={loading}>
                        {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Bitcoin className="h-4 w-4 mr-2" />}
                        Payer en crypto
                      </Button>
                      <Button variant="ghost" className="w-full" onClick={() => setStep('cart')}>
                        Modifier le panier
                      </Button>
                      <p className="text-[10px] text-muted-foreground text-center">
                        Carte : Visa · Mastercard · Apple Pay — crédits versés immédiatement.
                        <br />
                        Crypto : BTC · ETH · USDT — crédits versés à la confirmation réseau.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </aside>
          </div>
        )}
      </main>
    </div>
  );
};

export default CryptoCheckout;
