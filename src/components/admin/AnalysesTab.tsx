import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, Eye } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface AnalysisRow {
  id: string;
  userId: string;
  userName: string | null;
  functionName: string;
  model: string | null;
  operation: string;
  status: string;
  credits: number;
  totalTokens: number;
  createdAt: string;
  link: string;
}

const fmt = (d: string) =>
  new Date(d).toLocaleString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

export const AnalysesTab = () => {
  const [rows, setRows] = useState<AnalysisRow[]>([]);
  const [status, setStatus] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<AnalysisRow | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase.functions.invoke('admin-monitoring?scope=analyses');
    if (err) setError('Impossible de charger les analyses.');
    else setRows((data?.analyses ?? []) as AnalysisRow[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = rows.filter((r) => status === 'all' || r.status === status);
  const totalCredits = filtered.reduce((s, r) => s + r.credits, 0);

  const exportCsv = () => {
    const header = ['Date', 'Utilisateur', 'Fonction', 'Modèle', 'Statut', 'Crédits', 'Tokens', 'Lien'];
    const rowsCsv = filtered.map((r) => [
      new Date(r.createdAt).toISOString(),
      `"${r.userName ?? r.userId}"`,
      r.functionName,
      r.model ?? '',
      r.status,
      r.credits,
      r.totalTokens,
      r.link,
    ]);
    const csv = [header.join(','), ...rowsCsv.map((r) => r.join(','))].join('\n');
    const url = URL.createObjectURL(new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `analyses-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        {['all', 'success', 'error'].map((s) => (
          <Button key={s} size="sm" variant={status === s ? 'default' : 'outline'} onClick={() => setStatus(s)}>
            {s === 'all' ? 'Toutes' : s === 'success' ? 'Réussies' : 'En erreur'}
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
          <CardTitle className="text-base">
            Analyses ({filtered.length}) — {totalCredits.toFixed(2)} crédits consommés
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {loading ? (
            <p className="text-sm text-muted-foreground animate-pulse">Chargement…</p>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucune analyse pour ce filtre.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted-foreground border-b border-border">
                  <th className="py-2 pr-3">Date</th>
                  <th className="py-2 pr-3">Utilisateur</th>
                  <th className="py-2 pr-3">Fonction</th>
                  <th className="py-2 pr-3">Statut</th>
                  <th className="py-2 pr-3">Crédits</th>
                  <th className="py-2">Analyse</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id} className="border-b border-border/50">
                    <td className="py-2 pr-3 whitespace-nowrap">{fmt(r.createdAt)}</td>
                    <td className="py-2 pr-3">{r.userName ?? r.userId.slice(0, 8)}</td>
                    <td className="py-2 pr-3">
                      <span className="font-mono text-xs">{r.functionName}</span>
                      {r.model && <span className="block text-[11px] text-muted-foreground">{r.model}</span>}
                    </td>
                    <td className="py-2 pr-3">
                      <Badge variant={r.status === 'success' ? 'secondary' : 'destructive'}>{r.status}</Badge>
                    </td>
                    <td className="py-2 pr-3">{r.credits.toFixed(2)}</td>
                    <td className="py-2">
                      <a
                        href={r.link}
                        className="inline-flex items-center gap-1 text-primary hover:underline text-xs"
                      >
                        Ouvrir <ExternalLink className="w-3 h-3" />
                      </a>
                    </td>
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
