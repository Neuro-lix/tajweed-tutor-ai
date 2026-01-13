import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Globe } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface LanguageSelectorProps {
  compact?: boolean;
  showIcon?: boolean;
  className?: string;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  compact = false,
  showIcon = true,
  className = '',
}) => {
  const { language, setLanguage, languages } = useLanguage();

  const currentLang = languages.find(l => l.code === language);

  return (
    <Select value={language} onValueChange={(value) => setLanguage(value as any)}>
      <SelectTrigger className={`${compact ? 'w-20' : 'w-40'} ${className}`}>
        {showIcon && <Globe className="w-4 h-4 mr-2 flex-shrink-0" />}
        <SelectValue>
          {compact ? currentLang?.code.toUpperCase() : currentLang?.nativeName}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {languages.map((lang) => (
          <SelectItem key={lang.code} value={lang.code}>
            <div className="flex items-center gap-2">
              <span className={lang.dir === 'rtl' ? 'font-arabic' : ''}>
                {lang.nativeName}
              </span>
              {!compact && (
                <span className="text-xs text-muted-foreground">
                  ({lang.name})
                </span>
              )}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
