import { useCallback, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, Loader2, RefreshCw, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

type Status = 'pending' | 'ok' | 'fail' | 'warn';

interface Check {
  id: string;
  label: string;
  status: Status;
  detail?: string;
}

const REQUIRED_TEMPLATES = ['magiclink', 'recovery'];

const Icon = ({ status }: { status: Status }) => {
  if (status === 'pending') return <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />;
  if (status === 'ok') return <CheckCircle2 className="h-4 w-4 text-primary" />;
  if (status === 'warn') return <AlertTriangle className="h-4 w-4 text-amber-500" />;
  return <XCircle className="h-4 w-4 text-destructive" />;
};

/** Vérifie la connexion au backend et la configuration des e-mails d'authentification. */
export const SupabaseHealthCard = () => {
  const [checks, setChecks] = useState<Check[]>([]);
  const [running, setRunning] = useState(false);

  const run = useCallback(async () => {
    setRunning(true);
    const results: Check[] = [];

    const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
    const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;
    const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID as string | undefined;

    results.push({
      id: 'env',
      label: 'Variables de connexion',
      status: url && key && projectId ? 'ok' : 'fail',
      detail: url ? url : 'VITE_SUPABASE_URL manquante',
    });

    // Connexion base de données (lecture publique d'une table protégée par RLS :
    // une réponse, même vide, prouve que l'API répond).
    try {
      const { error } = await supabase.from('profiles').select('user_id').limit(1);
      results.push({
        id: 'db',
        label: 'Connexion à la base de données',
        status: error ? 'fail' : 'ok',
        detail: error?.message ?? 'API REST joignable',
      });
    } catch (e) {
      results.push({ id: 'db', label: 'Connexion à la base de données', status: 'fail', detail: String(e) });
    }

    // Service d'authentification
    try {
      const { error } = await supabase.auth.getSession();
      results.push({
        id: 'auth',
        label: "Service d'authentification",
        status: error ? 'fail' : 'ok',
        detail: error?.message ?? 'Session interrogeable',
      });
    } catch (e) {
      results.push({ id: 'auth', label: "Service d'authentification", status: 'fail', detail: String(e) });
    }

    // Templates e-mail (magiclink / recovery)
    try {
      const res = await fetch(`${url}/functions/v1/auth-email-hook/health`);
      const data = (await res.json()) as { templates?: string[]; senderDomain?: string };
      const templates = data.templates ?? [];
      const missing = REQUIRED_TEMPLATES.filter((t) => !templates.includes(t));
      results.push({
        id: 'templates',
        label: 'Templates e-mail magiclink et recovery',
        status: res.ok && missing.length === 0 ? 'ok' : 'fail',
        detail:
          missing.length === 0
            ? `Configurés · expéditeur ${data.senderDomain ?? 'inconnu'}`
            : `Manquants : ${missing.join(', ')}`,
      });
    } catch (e) {
      results.push({
        id: 'templates',
        label: 'Templates e-mail magiclink et recovery',
        status: 'fail',
        detail: `Fonction e-mail injoignable (${String(e)})`,
      });
    }

    setChecks(results);
    setRunning(false);
  }, []);

  useEffect(() => {
    run();
  }, [run]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base">Connexion & e-mails d'authentification</CardTitle>
        <Button variant="outline" size="sm" onClick={run} disabled={running}>
          <RefreshCw className={`w-4 h-4 mr-1 ${running ? 'animate-spin' : ''}`} /> Retester
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {checks.length === 0 && (
          <p className="text-sm text-muted-foreground">Vérification en cours…</p>
        )}
        {checks.map((c) => (
          <div key={c.id} className="flex items-start gap-3" data-testid={`check-${c.id}`}>
            <div className="pt-0.5">
              <Icon status={c.status} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium">{c.label}</p>
              {c.detail && (
                <p className="text-xs text-muted-foreground break-words">{c.detail}</p>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
