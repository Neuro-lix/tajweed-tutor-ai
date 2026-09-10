import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface EmailRow {
  id: string;
  email: string;
  email_type: string;
  status: string;
  error_message: string | null;
  created_at: string;
}

const TYPE_LABELS: Record<string, string> = {
  magiclink: 'Lien magique',
  recovery: 'Réinitialisation',
  invite: 'Invitation',
  signup: 'Confirmation',
  email_change: "Changement d'e-mail",
  reauthentication: 'Réauthentification',
};

const fmt = (d: string) =>
  new Date(d).toLocaleString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

export const EmailsTab = () => {
  const [rows, setRows] = useState<EmailRow[]>([]);
  const [type, setType] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase.functions.invoke('admin-monitoring?scope=emails');
    if (err) setError("Impossible de charger l'historique des e-mails.");
    else setRows((data?.emails ?? []) as EmailRow[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = rows.filter((r) => type === 'all' || r.email_type === type);
  const sent = filtered.filter((r) => r.status === 'envoyé').length;
  const failed = filtered.length - sent;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        {['all', 'magiclink', 'recovery', 'invite'].map((t) => (
          <Button
            key={t}
            size="sm"
            variant={type === t ? 'default' : 'outline'}
            onClick={() => setType(t)}
          >
            {t === 'all' ? 'Tous' : TYPE_LABELS[t] ?? t}
          </Button>
        ))}
        <Button size="sm" variant="outline" className="ml-auto" onClick={load} disabled={loading}>
          <RefreshCw className={'w-4 h-4 mr-2 ' + (loading ? 'animate-spin' : '')} />
          Actualiser
        </Button>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="grid grid-cols-3 gap-4">
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold">{filtered.length}</p><p className="text-xs text-muted-foreground">Demandes</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-emerald-600">{sent}</p><p className="text-xs text-muted-foreground">Envoyés</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-destructive">{failed}</p><p className="text-xs text-muted-foreground">Rejetés</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Historique des e-mails</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {loading ? (
            <p className="text-sm text-muted-foreground animate-pulse">Chargement…</p>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucune demande enregistrée pour l'instant.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted-foreground border-b border-border">
                  <th className="py-2 pr-3">Date</th>
                  <th className="py-2 pr-3">Destinataire</th>
                  <th className="py-2 pr-3">Type</th>
                  <th className="py-2 pr-3">Statut</th>
                  <th className="py-2">Erreur</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id} className="border-b border-border/50">
                    <td className="py-2 pr-3 whitespace-nowrap">{fmt(r.created_at)}</td>
                    <td className="py-2 pr-3">{r.email}</td>
                    <td className="py-2 pr-3">{TYPE_LABELS[r.email_type] ?? r.email_type}</td>
                    <td className="py-2 pr-3">
                      <Badge variant={r.status === 'envoyé' ? 'secondary' : 'destructive'}>{r.status}</Badge>
                    </td>
                    <td className="py-2 text-muted-foreground">{r.error_message ?? '—'}</td>
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
