import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { QIRAAT } from '@/data/quranData';

interface QiraatSelectorProps {
  selectedQiraat: string | null;
  onSelect: (id: string) => void;
}

export const QiraatSelector: React.FC<QiraatSelectorProps> = ({ selectedQiraat, onSelect }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {QIRAAT.map((qiraat) => {
        const isSelected = selectedQiraat === qiraat.id;
        const isPopular = qiraat.id === 'hafs' || qiraat.id === 'warsh';
        
        return (
          <Card
            key={qiraat.id}
            variant="reading"
            onClick={() => onSelect(qiraat.id)}
            className={`
              p-5 cursor-pointer transition-all duration-300
              ${isSelected ? 'border-primary shadow-glow ring-2 ring-primary/20' : ''}
              hover:scale-[1.01]
            `}
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <h4 className="font-arabic text-xl text-foreground mb-1" dir="rtl">
                  {qiraat.name}
                </h4>
                <p className="text-primary font-medium">{qiraat.transliteration}</p>
              </div>
              <div className="flex flex-col items-end gap-2">
                {isPopular && (
                  <Badge variant="gold">Populaire</Badge>
                )}
                {isSelected && (
                  <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                    <svg className="w-3 h-3 text-primary-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                )}
              </div>
            </div>
            <p className="text-sm text-muted-foreground">{qiraat.description}</p>
          </Card>
        );
      })}
    </div>
  );
};
