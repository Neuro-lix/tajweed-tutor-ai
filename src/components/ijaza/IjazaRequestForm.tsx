import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Clock, Send, User } from 'lucide-react';
import { Loader2 } from 'lucide-react';

interface Sheikh {
  id: string;
  name: string;
  specialty: string | null;
  languages: string[];
}

interface AvailabilitySlot {
  id: string;
  sheikhId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

interface IjazaRequestFormProps {
  userName: string;
  userEmail: string;
  selectedSheikh: Sheikh | null;
  selectedSlot: AvailabilitySlot | null;
  sheikhs: Sheikh[];
  onSubmit: (data: {
    sheikhId?: string;
    fullName: string;
    email: string;
    phone?: string;
    preferredLanguage?: string;
    preferredTime?: string;
    experience?: string;
    motivation?: string;
    slotId?: string;
  }) => Promise<void>;
  onCancel: () => void;
  getDayName: (day: number) => string;
  formatTime: (time: string) => string;
  isEligible: boolean;
}

export const IjazaRequestForm: React.FC<IjazaRequestFormProps> = ({
  userName,
  userEmail,
  selectedSheikh,
  selectedSlot,
  sheikhs,
  onSubmit,
  onCancel,
  getDayName,
  formatTime,
  isEligible,
}) => {
  const [formData, setFormData] = useState({
    fullName: userName,
    email: userEmail,
    phone: '',
    preferredLanguage: 'ar',
    preferredTime: selectedSlot 
      ? `${getDayName(selectedSlot.dayOfWeek)} ${formatTime(selectedSlot.startTime)}-${formatTime(selectedSlot.endTime)}`
      : '',
    experience: '',
    motivation: '',
    sheikhId: selectedSheikh?.id || '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isEligible) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        sheikhId: formData.sheikhId || undefined,
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone || undefined,
        preferredLanguage: formData.preferredLanguage,
        preferredTime: formData.preferredTime || undefined,
        experience: formData.experience || undefined,
        motivation: formData.motivation || undefined,
        slotId: selectedSlot?.id,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary" />
          Demander une Ijaza
        </CardTitle>
        <CardDescription>
          {selectedSheikh 
            ? `Session avec ${selectedSheikh.name}`
            : 'Remplis ce formulaire pour demander une session d\'évaluation'
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Selected slot info */}
          {selectedSlot && selectedSheikh && (
            <div className="p-4 bg-primary/5 rounded-lg border border-primary/20 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">{selectedSheikh.name}</p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    <span>
                      {getDayName(selectedSlot.dayOfWeek)} {formatTime(selectedSlot.startTime)}-{formatTime(selectedSlot.endTime)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Sheikh selector if no slot selected */}
          {!selectedSlot && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Cheikh préféré (optionnel)</label>
              <Select
                value={formData.sheikhId}
                onValueChange={(value) => setFormData({ ...formData, sheikhId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choisir un cheikh" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Aucune préférence</SelectItem>
                  {sheikhs.map((sheikh) => (
                    <SelectItem key={sheikh.id} value={sheikh.id}>
                      {sheikh.name} - {sheikh.specialty}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nom complet *</label>
              <Input
                value={formData.fullName}
                onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                placeholder="Ton nom complet"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Email *</label>
              <Input
                type="email"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                placeholder="ton@email.com"
                required
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Téléphone</label>
              <Input
                type="tel"
                value={formData.phone}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+33 6 12 34 56 78"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Langue préférée</label>
              <Select
                value={formData.preferredLanguage}
                onValueChange={(value) => setFormData({ ...formData, preferredLanguage: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ar">Arabe</SelectItem>
                  <SelectItem value="fr">Français</SelectItem>
                  <SelectItem value="en">Anglais</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {!selectedSlot && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Créneaux préférés</label>
              <Input
                value={formData.preferredTime}
                onChange={e => setFormData({ ...formData, preferredTime: e.target.value })}
                placeholder="Ex: Weekends après-midi, Mercredi soir..."
              />
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium">Expérience en récitation *</label>
            <Textarea
              value={formData.experience}
              onChange={e => setFormData({ ...formData, experience: e.target.value })}
              placeholder="Décris ton parcours d'apprentissage du Coran, ta mémorisation, tes études de tajwīd..."
              rows={3}
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Motivation</label>
            <Textarea
              value={formData.motivation}
              onChange={e => setFormData({ ...formData, motivation: e.target.value })}
              placeholder="Pourquoi souhaites-tu obtenir une Ijaza ? Quels sont tes objectifs ?"
              rows={3}
            />
          </div>

          <div className="flex gap-3">
            <Button 
              type="button"
              variant="outline"
              onClick={onCancel}
              className="flex-1"
            >
              Annuler
            </Button>
            <Button 
              type="submit" 
              className="flex-1"
              disabled={isSubmitting || !isEligible}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Envoi en cours...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Envoyer la demande
                </>
              )}
            </Button>
          </div>

          {!isEligible && (
            <p className="text-sm text-destructive text-center">
              Tu dois remplir les prérequis avant de pouvoir demander une Ijaza
            </p>
          )}
        </form>
      </CardContent>
    </Card>
  );
};
