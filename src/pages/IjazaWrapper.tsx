import React from 'react';
import { useNavigate } from 'react-router-dom';
import { IjazaPage } from './Ijaza';
import { useAuth } from '@/hooks/useAuth';
import { useUserProgress } from '@/hooks/useUserProgress';
import { useIjaza } from '@/hooks/useIjaza';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  ArrowLeft, 
  GraduationCap, 
  Users, 
  Calendar as CalendarIcon,
  Clock,
  Globe,
  CheckCircle2,
  Send,
  Loader2
} from 'lucide-react';
import { GeometricPattern, Star8Point } from '@/components/decorative/GeometricPattern';
import { useState } from 'react';
import { toast } from 'sonner';

const IjazaWrapper: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { surahProgress } = useUserProgress();
  const { 
    sheikhs, 
    availability, 
    myRequests, 
    loading,
    getSheikhAvailability,
    getDayName,
    formatTime,
    submitRequest,
    getStatusLabel,
    getStatusColor
  } = useIjaza();

  const [selectedSheikh, setSelectedSheikh] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    fullName: '',
    email: user?.email || '',
    phone: '',
    experience: '',
    motivation: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Calculate progress
  const masteredSurahs = surahProgress.filter(s => s.status === 'mastered').length;
  const totalSurahs = 114;
  const averageScore = surahProgress.length > 0 
    ? Math.round(surahProgress.reduce((acc, s) => acc + (s.masteredVerses / s.totalVerses) * 100, 0) / surahProgress.length)
    : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName || !formData.email) {
      toast.error('Veuillez remplir les champs obligatoires');
      return;
    }

    setIsSubmitting(true);
    const result = await submitRequest({
      sheikhId: selectedSheikh || undefined,
      fullName: formData.fullName,
      email: formData.email,
      phone: formData.phone,
      experience: formData.experience,
      motivation: formData.motivation,
      slotId: selectedSlot || undefined,
    });
    setIsSubmitting(false);

    if (result) {
      setSelectedSheikh(null);
      setSelectedSlot(null);
      setFormData({ ...formData, phone: '', experience: '', motivation: '' });
    }
  };

  const isEligible = masteredSurahs >= 30 && averageScore >= 85;

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="py-8 text-center space-y-4">
            <GraduationCap className="w-12 h-12 mx-auto text-primary" />
            <h2 className="text-xl font-semibold">Connexion requise</h2>
            <p className="text-muted-foreground">
              Connecte-toi pour accéder à la page Ijaza
            </p>
            <Button onClick={() => navigate('/auth')}>Se connecter</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative">
      <GeometricPattern className="text-primary" opacity={0.03} />

      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={() => navigate('/')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour
            </Button>
            <div className="flex items-center gap-3">
              <Star8Point size={24} className="text-primary" />
              <span className="font-semibold">Ijaza</span>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-5xl space-y-8">
        {/* Hero */}
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
              <GraduationCap className="w-10 h-10 text-primary" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-foreground">Certification Ijaza</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Obtiens ta certification officielle en récitation coranique auprès de nos cheikhs qualifiés
          </p>
        </div>

        {/* Progress */}
        <Card>
          <CardHeader>
            <CardTitle>Ta progression</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-3xl font-bold text-primary">{masteredSurahs}</div>
              <p className="text-sm text-muted-foreground">Sourates maîtrisées</p>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary">{averageScore}%</div>
              <p className="text-sm text-muted-foreground">Score moyen</p>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary">{totalSurahs}</div>
              <p className="text-sm text-muted-foreground">Sourates totales</p>
            </div>
          </CardContent>
        </Card>

        {/* My Requests */}
        {myRequests.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="w-5 h-5" />
                Mes demandes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {myRequests.map((request) => (
                  <div key={request.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{request.fullName}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(request.createdAt).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                    <Badge className={getStatusColor(request.status)}>
                      {getStatusLabel(request.status)}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Available Sheikhs with Calendar */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Cheikhs disponibles
            </CardTitle>
            <CardDescription>
              Sélectionne un cheikh et un créneau pour ta session d'évaluation
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : sheikhs.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                Aucun cheikh disponible pour le moment
              </p>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {sheikhs.map((sheikh) => {
                  const slots = getSheikhAvailability(sheikh.id);
                  const isSelected = selectedSheikh === sheikh.id;

                  return (
                    <Card 
                      key={sheikh.id}
                      variant="outline"
                      className={`cursor-pointer transition-all ${
                        isSelected ? 'border-primary ring-2 ring-primary/20' : ''
                      } ${!sheikh.isAvailable ? 'opacity-60' : ''}`}
                      onClick={() => sheikh.isAvailable && setSelectedSheikh(isSelected ? null : sheikh.id)}
                    >
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-semibold">{sheikh.name}</h4>
                            {sheikh.specialty && (
                              <p className="text-sm text-muted-foreground">{sheikh.specialty}</p>
                            )}
                          </div>
                          <Badge variant={sheikh.isAvailable ? 'default' : 'secondary'}>
                            {sheikh.isAvailable ? 'Disponible' : 'Indisponible'}
                          </Badge>
                        </div>

                        {sheikh.languages.length > 0 && (
                          <div className="flex items-center gap-2 text-sm">
                            <Globe className="w-4 h-4 text-muted-foreground" />
                            <span className="text-muted-foreground">
                              {sheikh.languages.join(', ')}
                            </span>
                          </div>
                        )}

                        {/* Availability slots */}
                        {isSelected && slots.length > 0 && (
                          <div className="pt-3 border-t space-y-2">
                            <p className="text-sm font-medium flex items-center gap-2">
                              <Clock className="w-4 h-4" />
                              Créneaux disponibles
                            </p>
                            <ScrollArea className="h-32">
                              <div className="space-y-2">
                                {slots.map((slot) => (
                                  <Button
                                    key={slot.id}
                                    variant={selectedSlot === slot.id ? 'default' : 'outline'}
                                    size="sm"
                                    className="w-full justify-start"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedSlot(selectedSlot === slot.id ? null : slot.id);
                                    }}
                                  >
                                    {getDayName(slot.dayOfWeek)} • {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                                  </Button>
                                ))}
                              </div>
                            </ScrollArea>
                          </div>
                        )}

                        {isSelected && slots.length === 0 && (
                          <p className="text-sm text-muted-foreground pt-3 border-t">
                            Aucun créneau disponible actuellement
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Request Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="w-5 h-5 text-primary" />
              Demander une Ijaza
            </CardTitle>
            <CardDescription>
              Remplis ce formulaire pour planifier ta session d'évaluation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
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
                <label className="text-sm font-medium">Expérience en récitation</label>
                <Textarea
                  value={formData.experience}
                  onChange={e => setFormData({ ...formData, experience: e.target.value })}
                  placeholder="Décris ton parcours d'apprentissage du Coran..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Motivation</label>
                <Textarea
                  value={formData.motivation}
                  onChange={e => setFormData({ ...formData, motivation: e.target.value })}
                  placeholder="Pourquoi souhaites-tu obtenir une Ijaza ?"
                  rows={3}
                />
              </div>

              {selectedSheikh && selectedSlot && (
                <div className="p-3 bg-primary/5 rounded-lg flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                  <span className="text-sm">
                    Créneau sélectionné avec {sheikhs.find(s => s.id === selectedSheikh)?.name}
                  </span>
                </div>
              )}

              <Button 
                type="submit" 
                className="w-full"
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
                    Envoyer ma demande
                  </>
                )}
              </Button>

              {!isEligible && (
                <p className="text-sm text-muted-foreground text-center">
                  Tu dois maîtriser au moins 30 sourates avec un score moyen de 85% pour demander une Ijaza
                </p>
              )}
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default IjazaWrapper;
