import React from 'react';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useTranslationSettings, TranslationId, AVAILABLE_TRANSLATIONS } from '@/contexts/TranslationContext';
import { Languages } from 'lucide-react';

export const TranslationToggle: React.FC = () => {
  const { showTranslation, setShowTranslation, currentTranslationId, setCurrentTranslationId, availableTranslations } =
    useTranslationSettings();

  return (
    <div className="flex items-center gap-3 text-sm">
      <div className="flex items-center gap-2">
        <Languages className="h-4 w-4 text-muted-foreground" />
        <Switch checked={showTranslation} onCheckedChange={setShowTranslation} id="translation-toggle" />
        <label htmlFor="translation-toggle" className="text-muted-foreground cursor-pointer select-none">
          Traduction
        </label>
      </div>
      {showTranslation && (
        <Select value={currentTranslationId} onValueChange={(val) => setCurrentTranslationId(val as TranslationId)}>
          <SelectTrigger className="w-40 h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {availableTranslations.map((t) => (
              <SelectItem key={t.id} value={t.id}>
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
};
