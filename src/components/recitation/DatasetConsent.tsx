import React, { useState } from 'react';
import { Switch } from '@/components/ui/switch';

const KEY = 'nassihah.contributeDataset';

/** Opt-in: share anonymised recordings to improve the AI (off by default). */
export const DatasetConsent: React.FC = () => {
  const [on, setOn] = useState(() => localStorage.getItem(KEY) === '1');
  return (
    <label className="flex items-start gap-3 rounded-lg border border-border bg-card/60 p-3 text-sm cursor-pointer">
      <Switch
        checked={on}
        onCheckedChange={(v) => { setOn(v); localStorage.setItem(KEY, v ? '1' : '0'); }}
        aria-label="Contribuer à améliorer l'IA"
      />
      <span className="space-y-0.5">
        <span className="block font-medium text-foreground">Contribuer à améliorer l'IA</span>
        <span className="block text-xs text-muted-foreground">
          Vos récitations (anonymisées, sans nom ni e-mail) aident nos experts à entraîner un moteur plus précis. Désactivé par défaut.
        </span>
      </span>
    </label>
  );
};
