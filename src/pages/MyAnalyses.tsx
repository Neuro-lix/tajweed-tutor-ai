import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Eye, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import { getAccountStrings, fillAccountVars, type AccountStrings } from '@/i18n/accountPages';

interface UsageRow {
  id: string;
  function_name: string;
  model: string | null;
  operation: string;
  status: string;
  credits_charged: number;
  total_tokens: number;
  prompt_tokens: number;
  completion_tokens: number;
  created_at: string;
}

interface SessionRow {
  id: string;
  surah_number: number;
  start_verse: number;
  end_verse: number;
  accuracy_score: number | null;
  errors_count: number | null;
  duration_minutes: number | null;
  created_at: string;
}

const fmt = (d: string, locale: string) =>
  new Date(d).toLocaleString(locale, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

const Shell = ({ children, onBack, a }: { children: React.ReactNode; onBack: () => void; a: AccountStrings }) => (
  <div className="min-h-screen bg-background">
    <div className="container mx-auto px-4 py-8 max-w-4xl space-y-6">
      <Button variant="ghost" size="sm" onClick={onBack}>
        <ArrowLeft className="w-4 h-4 mr-2" /> {a.back}
      </Button>
      {children}
    </div>
  </div>
);

/** Liste des analyses de l'utilisateur connecté (chacun ne voit que les siennes). */
export default function MyAnalyses() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { language } = useLanguage();
  const a = getAccountStrings(language);
  const [rows, setRows] = useState<UsageRow[]>([]);
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const [usage, sess] = await Promise.all([
        supabase
          .from('llm_usage')
          .select(
            'id, function_name, model, operation, status, credits_charged, total_tokens, prompt_tokens, completion_tokens, created_at',
          )
          .order('created_at', { ascending: false })
          .limit(200),
        supabase
          .from('recitation_sessions')
          .select('id, surah_number, start_verse, end_verse, accuracy_score, errors_count, duration_minutes, created_at')
          .order('created_at', { ascending: false })
          .limit(200),
      ]);
      if (cancelled) return;
      setRows((usage.data ?? []) as UsageRow[]);
      setSessions((sess.data ?? []) as SessionRow[]);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  if (!authLoading && !user) {
    return (
      <Shell onBack={() => navigate('/auth')}>
        <Card>
          <CardHeader>
            <CardTitle>Connexion requise</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Connecte-toi pour consulter l'historique de tes analyses.
            </p>
            <Button onClick={() => navigate('/auth')}>Se connecter</Button>
          </CardContent>
        </Card>
      </Shell>
    );
  }

  // ── Vue détail ────────────────────────────────────────────────────────
  if (id) {
    const row = rows.find((r) => r.id === id);
    const near = row
      ? sessions.find(
          (s) => Math.abs(new Date(s.created_at).getTime() - new Date(row.created_at).getTime()) < 5 * 60_000,
        )
      : undefined;

    return (
      <Shell onBack={() => navigate('/mes-analyses')}>
        <Card>
          <CardHeader>
            <CardTitle>Détail de l'analyse</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground animate-pulse">Chargement…</p>
            ) : !row ? (
              <p className="text-sm text-muted-foreground">Cette analyse est introuvable dans ton historique.</p>
            ) : (
              <dl className="text-sm space-y-2">
                {([
                  ['Date', fmt(row.created_at)],
                  ['Type', row.operation],
                  ['Moteur', row.model ?? '—'],
                  ['Fonction', row.function_name],
                  ['Statut', row.status === 'success' ? 'Réussie' : 'En erreur'],
                  ['Crédits utilisés', Number(row.credits_charged).toFixed(2)],
                  ['Jetons', String(row.total_tokens ?? 0)],
                  ...(near
                    ? ([
                        ['Sourate', `${near.surah_number} — versets ${near.start_verse} à ${near.end_verse}`],
                        ['Score', near.accuracy_score != null ? `${near.accuracy_score}/100` : '—'],
                        ['Erreurs relevées', String(near.errors_count ?? 0)],
                      ] as [string, string][])
                    : []),
                  ['Identifiant', row.id],
                ] as [string, string][]).map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-4 border-b border-border/50 pb-1">
                    <dt className="text-muted-foreground">{k}</dt>
                    <dd className="text-right break-all">{v}</dd>
                  </div>
                ))}
              </dl>
            )}
          </CardContent>
        </Card>
      </Shell>
    );
  }

  // ── Liste ─────────────────────────────────────────────────────────────
  const totalCredits = rows.reduce((s, r) => s + Number(r.credits_charged), 0);

  return (
    <Shell onBack={() => navigate('/dashboard')}>
      <div className="flex items-center justify-between gap-2">
        <h1 className="font-serif text-2xl font-bold">Mes analyses</h1>
        <Button size="sm" variant="outline" onClick={() => window.location.reload()}>
          <RefreshCw className="w-4 h-4 mr-2" /> Actualiser
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {rows.length} analyse(s) — {totalCredits.toFixed(2)} crédits utilisés
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {loading ? (
            <p className="text-sm text-muted-foreground animate-pulse">Chargement…</p>
          ) : rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucune analyse pour le moment.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted-foreground border-b border-border">
                  <th className="py-2 pr-3">Date</th>
                  <th className="py-2 pr-3">Type</th>
                  <th className="py-2 pr-3">Statut</th>
                  <th className="py-2 pr-3">Crédits</th>
                  <th className="py-2"></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-b border-border/50">
                    <td className="py-2 pr-3 whitespace-nowrap">{fmt(r.created_at)}</td>
                    <td className="py-2 pr-3">
                      <span className="text-xs">{r.operation}</span>
                      {r.model && <span className="block text-[11px] text-muted-foreground">{r.model}</span>}
                    </td>
                    <td className="py-2 pr-3">
                      <Badge variant={r.status === 'success' ? 'secondary' : 'destructive'}>
                        {r.status === 'success' ? 'Réussie' : 'Erreur'}
                      </Badge>
                    </td>
                    <td className="py-2 pr-3">{Number(r.credits_charged).toFixed(2)}</td>
                    <td className="py-2">
                      <Button asChild size="sm" variant="ghost" className="text-xs">
                        <Link to={`/mes-analyses/${r.id}`}>
                          <Eye className="w-3 h-3 mr-1" /> Détails
                        </Link>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </Shell>
  );
}
