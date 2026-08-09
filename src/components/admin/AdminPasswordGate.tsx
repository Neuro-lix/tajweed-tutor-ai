import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Lock, Loader2, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

/**
 * Déblocage de l'espace admin par mot de passe.
 * Le mot de passe n'est jamais présent côté client : il est vérifié par la
 * fonction serveur `claim_admin_access`, qui attribue le rôle admin en base.
 */
export const AdminPasswordGate = ({ onBack }: { onBack: () => void }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      navigate('/auth');
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('claim_admin_access', { _password: password });
      if (error) throw error;
      if (data === true) {
        toast.success('Accès administrateur débloqué');
        window.location.reload();
      } else {
        toast.error('Mot de passe incorrect');
      }
    } catch {
      toast.error("Vérification impossible. Réessaie dans un instant.");
    } finally {
      setLoading(false);
      setPassword('');
    }
  };

  return (
    <div
      data-testid="admin-access-denied"
      className="min-h-screen flex items-center justify-center bg-background p-4"
    >
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Espace administrateur</CardTitle>
          <CardDescription>
            {user
              ? 'Saisis le mot de passe administrateur pour débloquer cet espace.'
              : 'Connecte-toi d’abord, puis saisis le mot de passe administrateur.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="adminPassword">Mot de passe administrateur</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="adminPassword"
                  type="password"
                  autoComplete="off"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Vérification…</> : 'Débloquer'}
            </Button>
            <Button type="button" variant="outline" className="w-full" onClick={onBack}>
              <ArrowLeft className="w-4 h-4 mr-2" /> Retour
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
