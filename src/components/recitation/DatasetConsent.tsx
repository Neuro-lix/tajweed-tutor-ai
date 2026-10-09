import React, { useEffect, useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

/** Opt-in (unchecked by default): saved on the profile as dataset_consent + dataset_consent_at. */
export const DatasetConsent: React.FC = () => {
  const { user } = useAuth();
  const [on, setOn] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from('profiles').select('dataset_consent').eq('user_id', user.id).maybeSingle()
      .then(({ data }) => setOn(data?.dataset_consent === true));
  }, [user]);

  const update = async (v: boolean) => {
    if (!user) return;
    setBusy(true);
    const { error } = await supabase.from('profiles')
      .update({ dataset_consent: v, dataset_consent_at: v ? new Date().toISOString() : null })
      .eq('user_id', user.id);
    setBusy(false);
    if (error) { toast.error("Impossible d'enregistrer ton choix."); return; }
    setOn(v);
  };

  return (
    <label className="flex items-start gap-3 rounded-lg border border-border bg-card/60 p-3 text-sm cursor-pointer">
      <Checkbox checked={on} disabled={busy || !user} onCheckedChange={(v) => update(v === true)} aria-label="Contribuer à améliorer l'IA" className="mt-0.5" />
      <span className="space-y-0.5">
        <span className="block font-medium text-foreground">Contribuer à améliorer l'IA</span>
        <span className="block text-xs text-muted-foreground">
          Vos récitations (pseudonymisées, sans nom ni e-mail) aident nos experts à entraîner un moteur plus précis. Désactivé par défaut.
        </span>
      </span>
    </label>
  );
};
