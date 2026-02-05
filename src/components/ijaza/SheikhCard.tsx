import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Globe, Calendar, Clock, User } from 'lucide-react';

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

  return (
    <Card className={`overflow-hidden ${!sheikh.isAvailable ? 'opacity-60' : ''}`}>
      <CardContent className="p-0">
        <div className="flex flex-col md:flex-row">
          {/* Sheikh info */}
          <div className="p-6 flex-1">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                {sheikh.imageUrl ? (
                  <img 
                    src={sheikh.imageUrl} 
                    alt={sheikh.name}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                ) : (
                  <User className="w-8 h-8 text-primary" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold text-lg">{sheikh.name}</h3>
                  <Badge variant={sheikh.isAvailable ? 'default' : 'secondary'}>
                    {sheikh.isAvailable ? 'Disponible' : 'Indisponible'}
                  </Badge>
                </div>
                {sheikh.specialty && (
                  <p className="text-sm text-muted-foreground mt-1">{sheikh.specialty}</p>
                )}
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <Globe className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {sheikh.languages.join(', ')}
                  </span>
                </div>
                {sheikh.bio && (
                  <p className="text-sm text-muted-foreground mt-3 line-clamp-2">{sheikh.bio}</p>
                )}
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
