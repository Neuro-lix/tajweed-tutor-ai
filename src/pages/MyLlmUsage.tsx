import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CreditCard, Activity, Cpu, Zap, RefreshCw, Download } from 'lucide-react';
import { useLlmCredits } from '@/hooks/useLlmCredits';
import { useCredits } from '@/hooks/useCredits';
import { downloadLlmUsageCsv } from '@/lib/llmUsageCsv';

const FN_LABELS: Record<string, string> = {
  'analyze-recitation': 'Analyse récitation',
  'chat-assistant': 'Assistant chat',
  'text-to-speech': 'Synthèse vocale',
};

const fmtDateTime = (d: string) =>
  new Date(d).toLocaleString('fr-FR', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
  });

/**
 * Personal LLM usage page for any signed-in user. RLS on `llm_usage`
 * guarantees a non-admin only ever receives their own rows.
 */
export default function MyLlmUsage() {
  const navigate = useNavigate();
  const { rows, summary, loading, error, refetch } = useLlmCredits(100);
  const { credits } = useCredits();

  return (
    <main className="min-h-screen bg-background">
      <div className="border-b border-border bg-card/50">
        <div className="container mx-auto px-4 py-4 flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>
          <h1 className="text-lg font-semibold text-foreground">Ma consommation IA</h1>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-4xl space-y-6">
        {/* KPI cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Crédits restants', value: credits ?? '—', icon: CreditCard, color: 'text-primary' },
            { label: 'Appels IA', value: summary.totalCalls, icon: Activity, color: 'text-blue-600' },
            { label: 'Tokens consommés', value: summary.totalTokens.toLocaleString('fr-FR'), icon: Cpu, color: 'text-amber-600' },
            { label: 'Crédits débités', value: summary.totalCreditsCharged, icon: Zap, color: 'text-emerald-600' },
          ].map((kpi) => (
            <Card key={kpi.label}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-foreground">{kpi.value}</p>
                    <p className="text-xs text-muted-foreground mt-1">{kpi.label}</p>
                  </div>
                  <kpi.icon className={'w-5 h-5 ' + kpi.color} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => downloadLlmUsageCsv(rows)}
            disabled={loading || rows.length === 0}
          >
            <Download className="w-4 h-4 mr-2" />
            Exporter CSV
          </Button>
          <Button variant="outline" size="sm" onClick={refetch} disabled={loading}>
            <RefreshCw className={'w-4 h-4 mr-2 ' + (loading ? 'animate-spin' : '')} />
            Actualiser
          </Button>
        </div>

        {error && (
          <Card><CardContent className="p-4 text-sm text-destructive">{error}</CardContent></Card>
        )}

        <Card>
          <CardHeader><CardTitle className="text-base">Mes appels récents</CardTitle></CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground animate-pulse">Chargement…</p>
            ) : rows.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucun appel IA enregistré pour le moment.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm" data-testid="my-usage-table">
                  <thead>
                    <tr className="text-left text-muted-foreground border-b">
                      <th className="py-2 pr-4 font-medium">Date</th>
                      <th className="py-2 pr-4 font-medium">Fonction</th>
                      <th className="py-2 pr-4 font-medium">Modèle</th>
                      <th className="py-2 pr-4 font-medium text-right">Tokens</th>
                      <th className="py-2 pr-4 font-medium text-right">Crédits</th>
                      <th className="py-2 pr-4 font-medium">Statut</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r) => (
                      <tr key={r.id} className="border-b last:border-0">
                        <td className="py-2 pr-4 whitespace-nowrap">{fmtDateTime(r.created_at)}</td>
                        <td className="py-2 pr-4">{FN_LABELS[r.function_name] ?? r.function_name}</td>
                        <td className="py-2 pr-4 text-muted-foreground">{r.model ?? '—'}</td>
                        <td className="py-2 pr-4 text-right">{(r.total_tokens ?? 0).toLocaleString('fr-FR')}</td>
                        <td className="py-2 pr-4 text-right">{r.credits_charged}</td>
                        <td className="py-2 pr-4">
                          <span className={r.status === 'success' ? 'text-emerald-600' : 'text-destructive'}>
                            {r.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
