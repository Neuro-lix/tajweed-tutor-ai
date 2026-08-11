import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Cpu, ExternalLink, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLlmCredits } from '@/hooks/useLlmCredits';
import { useCredits } from '@/hooks/useCredits';
import { formatCredits } from '@/lib/credits';

const ENGINE_LABELS: Record<string, string> = {
  'analyze-recitation': 'Analyse récitation',
  'chat-assistant': 'Assistant chat',
  'text-to-speech': 'Synthèse vocale',
};

const fmtDate = (d: string) =>
  new Date(d).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

/** Consommation de crédits par moteur + historique de facturation par analyse. */
export const CreditUsageCard: React.FC = () => {
  const navigate = useNavigate();
  const { rows, summary, loading, refetch } = useLlmCredits(25);
  const { credits } = useCredits();

  // Regroupement par moteur (modèle IA), pas seulement par fonction.
  const byEngine = React.useMemo(() => {
    const map = new Map<string, { calls: number; tokens: number; credits: number }>();
    for (const r of rows) {
      const key = r.model ?? ENGINE_LABELS[r.function_name] ?? r.function_name;
      const cur = map.get(key) ?? { calls: 0, tokens: 0, credits: 0 };
      cur.calls += 1;
      cur.tokens += r.total_tokens ?? 0;
      cur.credits += Number(r.credits_charged ?? 0);
      map.set(key, cur);
    }
    return [...map.entries()].map(([engine, v]) => ({ engine, ...v })).sort((a, b) => b.credits - a.credits);
  }, [rows]);

  const totalCredits = summary.totalCreditsCharged || 1;

  return (
    <Card data-testid="credit-usage-card">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base flex items-center gap-2">
          <Cpu className="w-4 h-4 text-primary" />
          Consommation de crédits
        </CardTitle>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={refetch} disabled={loading} aria-label="Actualiser">
            <RefreshCw className={'w-4 h-4 ' + (loading ? 'animate-spin' : '')} />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => navigate('/my-usage')}>
            Détails <ExternalLink className="w-3.5 h-3.5 ml-1" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-baseline justify-between">
          <span className="text-sm text-muted-foreground">Solde actuel</span>
          <span className="text-2xl font-bold text-primary">{formatCredits(credits)}</span>
        </div>

        {byEngine.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucune consommation enregistrée pour le moment.</p>
        ) : (
          <>
            <div className="space-y-2">
              {byEngine.map((e) => (
                <div key={e.engine}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium text-foreground truncate max-w-[60%]">{e.engine}</span>
                    <span className="text-muted-foreground">
                      {formatCredits(e.credits)} cr · {e.calls} appels
                    </span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full"
                      style={{ width: `${Math.min(100, (e.credits / totalCredits) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">Facturation par analyse</p>
              <div className="space-y-1 max-h-56 overflow-y-auto pr-1">
                {rows.slice(0, 10).map((r) => (
                  <div key={r.id} className="flex items-center justify-between text-xs border-b last:border-0 py-1.5">
                    <span className="text-muted-foreground whitespace-nowrap">{fmtDate(r.created_at)}</span>
                    <span className="truncate px-2 flex-1">{ENGINE_LABELS[r.function_name] ?? r.function_name}</span>
                    <span className="font-medium tabular-nums">{formatCredits(Number(r.credits_charged))}</span>
                    <span
                      className={
                        'ml-2 px-1.5 py-0.5 rounded text-[10px] ' +
                        (r.status === 'success'
                          ? 'bg-primary/10 text-primary'
                          : 'bg-destructive/10 text-destructive')
                      }
                    >
                      {r.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default CreditUsageCard;
