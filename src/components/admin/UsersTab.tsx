import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RefreshCw, Trash2, ShieldCheck, ShieldOff, Coins } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface ManagedUser {
  id: string;
  email: string | null;
  fullName: string | null;
  roles: string[];
  credits: number;
  createdAt: string;
  lastSignInAt: string | null;
  confirmed: boolean;
}

const fmt = (d: string | null) =>
  d ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

/** Gestion complète des comptes : rôles, crédits, suppression. Tout est vérifié côté serveur. */
export const UsersTab = () => {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<ManagedUser | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase.functions.invoke('admin-users', {
      body: { action: 'list' },
    });
    if (err) setError('Impossible de charger les comptes.');
    else setUsers((data?.users ?? []) as ManagedUser[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const call = async (body: Record<string, unknown>, successMsg: string, userId: string) => {
    setBusy(userId);
    const { data, error: err } = await supabase.functions.invoke('admin-users', { body });
    setBusy(null);
    if (err || data?.error) {
      toast({ title: 'Action impossible', description: data?.error ?? 'Réessaie plus tard.', variant: 'destructive' });
      return false;
    }
    toast({ title: successMsg });
    await load();
    return true;
  };

  const toggleRole = (u: ManagedUser, role: 'admin' | 'moderator') => {
    const has = u.roles.includes(role);
    return call(
      { action: has ? 'remove_role' : 'set_role', userId: u.id, role },
      has ? `Rôle ${role} retiré` : `Rôle ${role} attribué`,
      u.id,
    );
  };

  const adjustCredits = (u: ManagedUser) => {
    const raw = window.prompt(`Crédits à ajouter (ou retirer avec un nombre négatif) pour ${u.email ?? u.id} :`, '10');
    if (raw === null) return;
    const amount = Number(raw.replace(',', '.'));
    if (!Number.isFinite(amount) || amount === 0) {
      toast({ title: 'Montant invalide', variant: 'destructive' });
      return;
    }
    void call({ action: 'adjust_credits', userId: u.id, amount }, 'Crédits mis à jour', u.id);
  };

  const q = search.trim().toLowerCase();
  const filtered = users.filter(
    (u) =>
      !q ||
      (u.email ?? '').toLowerCase().includes(q) ||
      (u.fullName ?? '').toLowerCase().includes(q) ||
      u.id.toLowerCase().includes(q),
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher un compte (e-mail, nom ou identifiant)"
          className="h-9 w-full sm:w-80"
        />
        <Button size="sm" variant="outline" className="ml-auto" onClick={load} disabled={loading}>
          <RefreshCw className={'w-4 h-4 mr-2 ' + (loading ? 'animate-spin' : '')} />
          Actualiser
        </Button>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{filtered.length} compte(s)</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {loading ? (
            <p className="text-sm text-muted-foreground animate-pulse">Chargement…</p>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucun compte pour cette recherche.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted-foreground border-b border-border">
                  <th className="py-2 pr-3">Compte</th>
                  <th className="py-2 pr-3">Inscription</th>
                  <th className="py-2 pr-3">Dernière visite</th>
                  <th className="py-2 pr-3">Crédits</th>
                  <th className="py-2 pr-3">Rôles</th>
                  <th className="py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => (
                  <tr key={u.id} className="border-b border-border/50">
                    <td className="py-2 pr-3">
                      <span className="block">{u.email ?? '—'}</span>
                      <span className="block text-[11px] text-muted-foreground">
                        {u.fullName ?? u.id.slice(0, 8)}
                        {!u.confirmed && ' · e-mail non confirmé'}
                      </span>
                    </td>
                    <td className="py-2 pr-3 whitespace-nowrap">{fmt(u.createdAt)}</td>
                    <td className="py-2 pr-3 whitespace-nowrap">{fmt(u.lastSignInAt)}</td>
                    <td className="py-2 pr-3">{u.credits.toFixed(2)}</td>
                    <td className="py-2 pr-3">
                      {u.roles.length === 0 ? (
                        <span className="text-muted-foreground text-xs">—</span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {u.roles.map((r) => (
                            <Badge key={r} variant={r === 'admin' ? 'default' : 'secondary'}>
                              {r}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="py-2">
                      <div className="flex flex-wrap gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-xs"
                          disabled={busy === u.id}
                          onClick={() => void toggleRole(u, 'admin')}
                        >
                          {u.roles.includes('admin') ? (
                            <ShieldOff className="w-3 h-3 mr-1" />
                          ) : (
                            <ShieldCheck className="w-3 h-3 mr-1" />
                          )}
                          {u.roles.includes('admin') ? 'Retirer admin' : 'Admin'}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-xs"
                          disabled={busy === u.id}
                          onClick={() => void toggleRole(u, 'moderator')}
                        >
                          {u.roles.includes('moderator') ? 'Retirer modérateur' : 'Modérateur'}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-xs"
                          disabled={busy === u.id}
                          onClick={() => adjustCredits(u)}
                        >
                          <Coins className="w-3 h-3 mr-1" /> Crédits
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-xs text-destructive"
                          disabled={busy === u.id}
                          onClick={() => setToDelete(u)}
                        >
                          <Trash2 className="w-3 h-3 mr-1" /> Supprimer
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce compte ?</AlertDialogTitle>
            <AlertDialogDescription>
              {toDelete?.email ?? toDelete?.id} sera supprimé définitivement, ainsi que ses données de progression.
              Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (toDelete) void call({ action: 'delete_user', userId: toDelete.id }, 'Compte supprimé', toDelete.id);
                setToDelete(null);
              }}
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
