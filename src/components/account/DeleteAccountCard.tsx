import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export const DeleteAccountCard = () => {
  const navigate = useNavigate();
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);

  const handleDelete = async () => {
    setBusy(true);
    const { data, error } = await supabase.functions.invoke('delete-account', { body: {} });
    if (error || !data?.deleted) {
      setBusy(false);
      toast.error('La suppression a échoué. Réessaie ou contacte-nous.');
      return;
    }
    await supabase.auth.signOut();
    toast.success('Ton compte a été supprimé.');
    navigate('/', { replace: true });
  };

  return (
    <Card className="border-destructive/40">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg text-destructive">Supprimer mon compte</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Supprime définitivement ton compte, tes récitations, ta progression et tes crédits. Action irréversible.
        </p>
        <AlertDialog onOpenChange={() => setConfirm('')}>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="sm"><Trash2 className="mr-1.5 h-4 w-4" />Supprimer mon compte</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
              <AlertDialogDescription>Tape SUPPRIMER pour confirmer. Tes données ne pourront pas être récupérées.</AlertDialogDescription>
            </AlertDialogHeader>
            <Input value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="SUPPRIMER" />
            <AlertDialogFooter>
              <AlertDialogCancel disabled={busy}>Annuler</AlertDialogCancel>
              <AlertDialogAction
                disabled={confirm !== 'SUPPRIMER' || busy}
                onClick={(e) => { e.preventDefault(); handleDelete(); }}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {busy && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}Supprimer
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
};
