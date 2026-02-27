import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Globe, Calendar, Clock, User, GraduationCap, Award } from 'lucide-react';

interface Sheikh {
  id: string;
  name: string;
  specialty: string | null;
  languages: string[];
  bio: string | null;
  imageUrl: string | null;
  isAvailable: boolean;
}

interface AvailabilitySlot {
  id: string;
  sheikhId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isBooked: boolean;
}

interface SheikhCardProps {
  sheikh: Sheikh;
  availability: AvailabilitySlot[];
  onSelectSlot: (sheikh: Sheikh, slot: AvailabilitySlot) => void;
  getDayName: (day: number) => string;
  formatTime: (time: string) => string;
}

export const SheikhCard: React.FC<SheikhCardProps> = ({
  sheikh,
  availability,
  onSelectSlot,
  getDayName,
  formatTime,
}) => {
  const availableSlots = availability.filter(s => !s.isBooked);

  // Affichage spécial pour le Cheikh Anas Ahmad Al-Nashrati
  const isAnasNashrati = sheikh.name.includes('أنس') || sheikh.name.includes('Anas') || sheikh.name.toLowerCase().includes('nashrati');

  return (
    <Card className={`overflow-hidden ${!sheikh.isAvailable ? 'opacity-60' : ''} ${isAnasNashrati ? 'border-primary/50 shadow-md' : ''}`}>
      {isAnasNashrati && (
        <div className="bg-primary/10 px-6 py-2 flex items-center gap-2">
          <Award className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-primary">Cheikh certifié — Ijaza authentique</span>
        </div>
      )}
      <CardContent className="p-0">
        <div className="flex flex-col md:flex-row">
          {/* Sheikh info */}
          <div className="p-6 flex-1">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                {sheikh.imageUrl ? (
                  <img src={sheikh.imageUrl} alt={sheikh.name} className="w-16 h-16 rounded-full object-cover" />
                ) : (
                  <User className="w-8 h-8 text-primary" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-arabic text-xl font-semibold" dir="rtl">أنس أحمد النشرتي</h3>
                  <Badge variant={sheikh.isAvailable ? 'default' : 'secondary'}>
                    {sheikh.isAvailable ? 'Disponible' : 'Indisponible'}
                  </Badge>
                </div>
                <p className="text-sm font-medium text-foreground mt-1">Anas Ahmad Al-Nashrati</p>

                {/* Titre azhari */}
                <div className="mt-2 space-y-1">
                  <div className="flex items-start gap-2">
                    <GraduationCap className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-foreground font-arabic leading-relaxed" dir="rtl">
                      طبيب أزهري حافظ لكتاب الله عز وجل وحاصل على إجازة في قراءة الإمام عاصم برواية شعبة وحفص
                    </p>
                  </div>
                  <p className="text-sm text-muted-foreground ml-6">
                    Médecin et Azhari — Hafiz du Coran — Ijaza en lecture de l'Imam Asim (Shu'ba & Hafs)
                  </p>
                </div>

                <div className="flex items-center gap-2 mt-3 flex-wrap">
                  <Globe className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {sheikh.languages.join(', ')}
                  </span>
                </div>
              </div>
            </div>

            {/* Pricing */}
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="bg-primary/5 rounded-lg p-3 text-center border border-primary/20">
                <p className="text-xs text-muted-foreground mb-1">Cours privé (1h)</p>
                <p className="text-2xl font-bold text-primary">30€</p>
                <p className="text-xs text-muted-foreground">/ séance</p>
              </div>
              <div className="bg-gold-warm/5 rounded-lg p-3 text-center border border-gold-warm/20">
                <p className="text-xs text-muted-foreground mb-1">Évaluation Ijaza</p>
                <p className="text-2xl font-bold text-amber-600">150€</p>
                <p className="text-xs text-muted-foreground">dossier complet</p>
              </div>
            </div>
          </div>

          {/* Availability slots */}
          {sheikh.isAvailable && availableSlots.length > 0 && (
            <div className="border-t md:border-t-0 md:border-l border-border p-4 bg-muted/30 md:w-64">
              <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Créneaux disponibles
              </h4>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {availableSlots.slice(0, 4).map((slot) => (
                  <Button
                    key={slot.id}
                    variant="outline"
                    size="sm"
                    className="w-full justify-start text-left"
                    onClick={() => onSelectSlot(sheikh, slot)}
                  >
                    <Clock className="w-3 h-3 mr-2" />
                    <span className="truncate">
                      {getDayName(slot.dayOfWeek)} {formatTime(slot.startTime)}-{formatTime(slot.endTime)}
                    </span>
                  </Button>
                ))}
                {availableSlots.length > 4 && (
                  <p className="text-xs text-muted-foreground text-center">
                    +{availableSlots.length - 4} autres créneaux
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
