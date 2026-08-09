import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, CreditCard, Download, Loader2, Receipt } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PageSeo } from '@/components/seo/PageSeo';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { formatCredits } from '@/lib/credits';
import {
  cleanDescription,
  downloadPaymentsCsv,
  extractPaddleRefs,
  inferProvider,
  type PaymentRow,
} from '@/lib/paymentsCsv';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

/**
 * Historique des paiements (Paddle / Crypto / PayPal).
 *
 * Il n'existe pas de table "payments" dédiée : les webhooks de paiement
 * créditent le compte via `credit_transactions` (type `purchase` / `refund`)
 * en indiquant le fournisseur dans la description. Cette page lit donc ces
 * mouvements-là, scopés par RLS à l'utilisateur connecté.
 */
const typeLabel: Record<string, string> = {
  purchase: 'Achat',
  refund: 'Remboursement',
};

const PaymentHistory = () => {
  const { user } = useAuth();
  const [rows, setRows] = useState<PaymentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('all');
  const [provider, setProvider] = useState('all');
  const [status, setStatus] = useState('all');

  const fetchRows = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    try {
      const { data, error } = await supabase
        .from('credit_transactions')
        .select('id, amount, type, description, created_at')
        .eq('user_id', user.id)
        .in('type', ['purchase', 'refund'])
        .order('created_at', { ascending: false })
        .limit(300);
      if (error) throw error;
      setRows(
        (data ?? []).map((t) => ({
          id: t.id,
          amount: Number(t.amount),
          type: t.type,
          description: t.description,
          createdAt: t.created_at,
          provider: inferProvider(t.description),
        })),
      );
    } catch (err) {
      console.error('[payments] fetch failed', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchRows();
  }, [fetchRows]);

  const providers = useMemo(
    () => Array.from(new Set(rows.map((r) => r.provider))).sort(),
    [rows],
  );

  const filtered = useMemo(() => {
    const cutoff =
      period === 'all' ? null : Date.now() - Number(period) * 24 * 60 * 60 * 1000;
    return rows.filter((r) => {
      if (cutoff && new Date(r.createdAt).getTime() < cutoff) return false;
      if (provider !== 'all' && r.provider !== provider) return false;
      if (status !== 'all' && r.type !== status) return false;
      return true;
    });
  }, [rows, period, provider, status]);

  const totalCredits = useMemo(
    () => filtered.reduce((sum, r) => sum + r.amount, 0),
    [filtered],
  );

  const handleExport = () => {
    if (filtered.length === 0) {
      toast.info('Aucun paiement à exporter.');
      return;
    }
    downloadPaymentsCsv(filtered);
    toast.success('Historique exporté en CSV.');
  };

  return (
    <div className="min-h-screen bg-background">
      <PageSeo
        title="Historique des paiements | Nassihah — Tajweed Tutor AI"
        description="Consultez l'historique de vos paiements (Paddle, crypto, PayPal) et exportez-le en CSV."
        path="/payments"
      />
      <div className="max-w-3xl mx-auto px-4 py-10">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-8"
        >
          <ArrowLeft className="w-4 h-4" /> Retour au tableau de bord
        </Link>

        <h1 className="text-3xl font-amiri font-bold text-foreground mb-2">Historique des paiements</h1>
        <p className="text-muted-foreground mb-8">
          Chaque achat de crédits (carte bancaire Paddle, crypto, PayPal) et chaque remboursement.
        </p>

        <Card>
          <CardHeader className="pb-3 flex-row items-center justify-between space-y-0">
            <CardTitle className="text-lg flex items-center gap-2">
              <Receipt className="w-5 h-5 text-primary" />
              {filtered.length} transaction{filtered.length > 1 ? 's' : ''}
            </CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExport}
                disabled={filtered.length === 0}
              >
                <Download className="w-4 h-4 mr-1.5" /> CSV
              </Button>
              <Button asChild size="sm">
                <Link to="/shop">Acheter</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-4">
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger aria-label="Période">
                  <SelectValue placeholder="Période" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toute la période</SelectItem>
                  <SelectItem value="7">7 derniers jours</SelectItem>
                  <SelectItem value="30">30 derniers jours</SelectItem>
                  <SelectItem value="90">90 derniers jours</SelectItem>
                  <SelectItem value="365">12 derniers mois</SelectItem>
                </SelectContent>
              </Select>
              <Select value={provider} onValueChange={setProvider}>
                <SelectTrigger aria-label="Fournisseur">
                  <SelectValue placeholder="Fournisseur" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les fournisseurs</SelectItem>
                  {providers.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger aria-label="Statut">
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="purchase">Achat</SelectItem>
                  <SelectItem value="refund">Remboursement</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {loading ? (
              <div className="py-10 flex justify-center">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="py-10 text-center space-y-2">
                <CreditCard className="w-8 h-8 text-muted-foreground mx-auto" />
                <p className="text-muted-foreground">
                  {rows.length === 0
                    ? "Aucun paiement pour l'instant."
                    : 'Aucun paiement ne correspond à ces filtres.'}
                </p>
              </div>
            ) : (
              <>
                <ul className="divide-y divide-border">
                  {filtered.map((r) => {
                    const refs = extractPaddleRefs(r.description);
                    return (
                    <li key={r.id} className="py-3 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="secondary">{r.provider}</Badge>
                          <span className="text-sm truncate">
                            {typeLabel[r.type] ?? r.type} — {cleanDescription(r.description) || '—'}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {new Date(r.createdAt).toLocaleString('fr-FR')}
                        </p>
                        {(refs.transactionId || refs.purchaseId) && (
                          <p className="text-[11px] text-muted-foreground font-mono truncate">
                            {refs.transactionId && `txn ${refs.transactionId}`}
                            {refs.purchaseId && ` · achat ${refs.purchaseId}`}
                          </p>
                        )}
                      </div>
                      <span className="shrink-0 font-semibold tabular-nums text-emerald-600">
                        +{formatCredits(Math.abs(r.amount))}
                      </span>
                    </li>
                    );
                  })}
                </ul>
                <p className="text-xs text-muted-foreground pt-4">
                  Total crédité sur la période affichée : {formatCredits(totalCredits)} crédits.
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PaymentHistory;