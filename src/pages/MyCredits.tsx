import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Loader2, Zap, TrendingDown, TrendingUp, Gift } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PageSeo } from '@/components/seo/PageSeo';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useCredits } from '@/hooks/useCredits';
import { formatCredits } from '@/lib/credits';

interface CreditTransaction {
  id: string;
  amount: number;
  type: string;
  description: string | null;
  createdAt: string;
}

const typeMeta: Record<string, { label: string; className: string }> = {
  purchase: { label: 'Achat', className: 'bg-emerald-100 text-emerald-700' },
  bonus: { label: 'Bonus', className: 'bg-amber-100 text-amber-700' },
  usage: { label: 'Consommation', className: 'bg-slate-100 text-slate-700' },
  refund: { label: 'Remboursement', className: 'bg-blue-100 text-blue-700' },
};

const fmtDateTime = (iso: string) =>
  new Date(iso).toLocaleString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

const MyCredits = () => {
  const { user } = useAuth();
  const { credits, loading: creditsLoading } = useCredits();
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTransactions = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    try {
      const { data, error } = await supabase
        .from('credit_transactions')
        .select('id, amount, type, description, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(200);
      if (error) throw error;
      setTransactions(
        (data ?? []).map((t) => ({
          id: t.id,
          amount: Number(t.amount),
          type: t.type,
          description: t.description,
          createdAt: t.created_at,
        })),
      );
    } catch (err) {
      console.error('[my-credits] fetch failed', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const { totalIn, totalOut } = useMemo(() => {
    let inSum = 0;
    let outSum = 0;
    for (const t of transactions) {
      if (t.amount >= 0) inSum += t.amount;
      else outSum += Math.abs(t.amount);
    }
    return { totalIn: inSum, totalOut: outSum };
  }, [transactions]);

  return (
    <div className="min-h-screen bg-background">
      <PageSeo
        title="Mes crédits | Nassihah — Tajweed Tutor AI"
        description="Consultez votre solde de crédits et l'historique détaillé de vos achats et consommations IA."
        path="/my-credits"
      />
      <div className="max-w-3xl mx-auto px-4 py-10">
        <Link to="/dashboard" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-8">
          <ArrowLeft className="w-4 h-4" /> Retour au tableau de bord
        </Link>

        <h1 className="text-3xl font-amiri font-bold text-foreground mb-2">Mes crédits</h1>
        <p className="text-muted-foreground mb-8">
          Solde en temps réel et historique de chaque mouvement, à la décimale près.
        </p>

        <div className="grid sm:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="py-5 text-center">
              <Zap className="w-5 h-5 text-primary mx-auto mb-1.5" />
              <p className="text-3xl font-bold text-primary">
                {creditsLoading ? '…' : formatCredits(credits)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Solde actuel</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-5 text-center">
              <TrendingUp className="w-5 h-5 text-emerald-600 mx-auto mb-1.5" />
              <p className="text-3xl font-bold text-emerald-600">{formatCredits(totalIn)}</p>
              <p className="text-xs text-muted-foreground mt-1">Crédits reçus</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-5 text-center">
              <TrendingDown className="w-5 h-5 text-muted-foreground mx-auto mb-1.5" />
              <p className="text-3xl font-bold">{formatCredits(totalOut)}</p>
              <p className="text-xs text-muted-foreground mt-1">Crédits consommés</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="pb-3 flex-row items-center justify-between space-y-0">
            <CardTitle className="text-lg">Historique des mouvements</CardTitle>
            <Button asChild variant="outline" size="sm">
              <Link to="/shop">Recharger</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="py-10 flex justify-center">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            ) : transactions.length === 0 ? (
              <div className="py-10 text-center space-y-2">
                <Gift className="w-8 h-8 text-muted-foreground mx-auto" />
                <p className="text-muted-foreground">Aucun mouvement pour l'instant.</p>
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {transactions.map((t) => {
                  const meta = typeMeta[t.type] ?? { label: t.type, className: 'bg-slate-100 text-slate-700' };
                  const positive = t.amount >= 0;
                  return (
                    <li key={t.id} className="py-3 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="secondary" className={meta.className}>{meta.label}</Badge>
                          <span className="text-sm truncate">{t.description || '—'}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{fmtDateTime(t.createdAt)}</p>
                      </div>
                      <span
                        className={`shrink-0 font-semibold tabular-nums ${
                          positive ? 'text-emerald-600' : 'text-muted-foreground'
                        }`}
                      >
                        {positive ? '+' : '−'}{formatCredits(Math.abs(t.amount))}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MyCredits;
