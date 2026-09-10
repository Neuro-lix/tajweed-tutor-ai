import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface PaymentRow {
  id: string;
  userId: string;
  userName: string | null;
  credits: number;
  description: string | null;
  provider: string;
  status: string;
  createdAt: string;
}

interface WebhookEvent {
  provider: string;
  external_id: string;
  created_at: string;
}

const fmt = (d: string) =>
  new Date(d).toLocaleString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

export const PaymentsTab = () => {
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [events, setEvents] = useState<WebhookEvent[]>([]);
  const [provider, setProvider] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase.functions.invoke('admin-monitoring?scope=payments');
    if (err) {
      setError("Impossible de charger les paiements.");
    } else {
      setPayments((data?.payments ?? []) as PaymentRow[]);
      setEvents((data?.webhookEvents ?? []) as WebhookEvent[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = payments.filter((p) => provider === 'all' || p.provider === provider);

  const exportCsv = () => {
    const header = ['Date', 'Utilisateur', 'Fournisseur', 'Crédits', 'Statut', 'Détail'];
    const rows = filtered.map((p) => [
      new Date(p.createdAt).toISOString(),
      `"${p.userName ?? p.userId}"`,
      p.provider,
      p.credits,
      p.status,
      `"${(p.description ?? '').replace(/"/g, "'")}"`,
    ]);
    const csv = [header.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const url = URL.createObjectURL(new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `paiements-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        {['all', 'crypto', 'paddle', 'autre'].map((p) => (
          <Button
            key={p}
            size="sm"
            variant={provider === p ? 'default' : 'outline'}
            onClick={() => setProvider(p)}
          >
            {p === 'all' ? 'Tous' : p}
          </Button>
        ))}
        <div className="ml-auto flex gap-2">
          <Button size="sm" variant="outline" onClick={load} disabled={loading}>
            <RefreshCw className={'w-4 h-4 mr-2 ' + (loading ? 'animate-spin' : '')} />
            Actualiser
          </Button>
          <Button size="sm" variant="outline" onClick={exportCsv} disabled={!filtered.length}>
            Export CSV
          </Button>
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Commandes ({filtered.length})</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {loading ? (
            <p className="text-sm text-muted-foreground animate-pulse">Chargement…</p>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucun paiement pour ce filtre.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted-foreground border-b border-border">
                  <th className="py-2 pr-3">Date</th>
                  <th className="py-2 pr-3">Utilisateur</th>
                  <th className="py-2 pr-3">Fournisseur</th>
                  <th className="py-2 pr-3">Crédits</th>
                  <th className="py-2 pr-3">Statut</th>
                  <th className="py-2">Détail</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.id} className="border-b border-border/50">
                    <td className="py-2 pr-3 whitespace-nowrap">{fmt(p.createdAt)}</td>
                    <td className="py-2 pr-3">{p.userName ?? p.userId.slice(0, 8)}</td>
                    <td className="py-2 pr-3 capitalize">{p.provider}</td>
                    <td className="py-2 pr-3">{p.credits}</td>
                    <td className="py-2 pr-3">
                      <Badge variant="secondary">{p.status}</Badge>
                    </td>
                    <td className="py-2 text-muted-foreground">{p.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Webhooks reçus ({events.length})</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {events.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucun webhook enregistré.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted-foreground border-b border-border">
                  <th className="py-2 pr-3">Date</th>
                  <th className="py-2 pr-3">Fournisseur</th>
                  <th className="py-2">Référence</th>
                </tr>
              </thead>
              <tbody>
                {events.map((e) => (
                  <tr key={`${e.provider}-${e.external_id}`} className="border-b border-border/50">
                    <td className="py-2 pr-3 whitespace-nowrap">{fmt(e.created_at)}</td>
                    <td className="py-2 pr-3 capitalize">{e.provider}</td>
                    <td className="py-2 font-mono text-xs">{e.external_id}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
