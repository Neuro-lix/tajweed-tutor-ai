import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Award, 
  BookOpen, 
  CheckCircle2, 
  Calendar, 
  Star,
  Users,
  GraduationCap,
  ArrowLeft,
  Plus,
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { GeometricPattern, Star8Point } from '@/components/decorative/GeometricPattern';
import { useIjaza } from '@/hooks/useIjaza';
import { useAuth } from '@/hooks/useAuth';
import { SheikhCard } from '@/components/ijaza/SheikhCard';
import { IjazaRequestForm } from '@/components/ijaza/IjazaRequestForm';
import { MyIjazaRequests } from '@/components/ijaza/MyIjazaRequests';

interface IjazaPageProps {
  userName?: string;
  masteredSurahs: number;
  totalSurahs: number;
  averageScore: number;
  onBack: () => void;
}

interface SelectedSlotData {
  sheikh: {
    id: string;
    name: string;
    specialty: string | null;
    languages: string[];
  };
  slot: {
    id: string;
    sheikhId: string;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    isBooked: boolean;
  };
}

export const IjazaPage: React.FC<IjazaPageProps> = ({
  userName = 'Étudiant',
  masteredSurahs,
  totalSurahs,
  averageScore,
  onBack,
}) => {
  const { t } = useLanguage();
  const { user } = useAuth();
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
    getStatusColor,
  } = useIjaza();

  const [showForm, setShowForm] = useState(false);
  const [selectedSlotData, setSelectedSlotData] = useState<SelectedSlotData | null>(null);

  const prerequisites = [
    { 
      title: 'Mémorisation complète',
      description: 'Avoir mémorisé le Coran en entier ou la partie concernée',
      icon: BookOpen,
      required: true,
      met: undefined,
    },
    { 
      title: 'Maîtrise du Tajwīd',
      description: 'Score moyen de 85% ou plus sur les récitations',
      icon: Star,
      met: averageScore >= 85,
      required: true,
    },
    { 
      title: 'Régularité',
      description: 'Au moins 30 sourates maîtrisées',
      icon: CheckCircle2,
      met: masteredSurahs >= 30,
      required: true,
    },
    { 
      title: 'Recommandation',
      description: 'Lettre de recommandation d\'un enseignant (optionnel)',
      icon: Users,
      required: false,
      met: undefined,
    },
  ];

  const handleSelectSlot = (sheikh: { id: string; name: string; specialty: string | null; languages: string[] }, slot: { id: string; sheikhId: string; dayOfWeek: number; startTime: string; endTime: string; isBooked: boolean }) => {
    setSelectedSlotData({ sheikh, slot });
    setShowForm(true);
  };

  const handleSubmitRequest = async (data: {
    sheikhId?: string;
    fullName: string;
    email: string;
    phone?: string;
    preferredLanguage?: string;
    preferredTime?: string;
    experience?: string;
    motivation?: string;
    slotId?: string;
  }) => {
    const result = await submitRequest(data);
    if (result) {
      setShowForm(false);
      setSelectedSlotData(null);
    }
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setSelectedSlotData(null);
  };

  const progressPercent = (masteredSurahs / totalSurahs) * 100;
  const isEligible = masteredSurahs >= 30 && averageScore >= 85;

  return (
    <div className="min-h-screen bg-background relative">
      <GeometricPattern className="text-primary" opacity={0.03} />

      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={onBack}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t.back}
            </Button>
            <div className="flex items-center gap-3">
              <Star8Point size={24} className="text-primary" />
              <span className="font-semibold">{t.ijaza}</span>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl space-y-8">
        {/* Hero section */}
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
              <GraduationCap className="w-10 h-10 text-primary" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-foreground">{t.ijazaTitle}</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            {t.ijazaDescription}
          </p>
        </div>

        {/* Progress overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="w-5 h-5 text-primary" />
              Ta progression vers l'Ijaza
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4 text-center">
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
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progression globale</span>
                <span className="font-medium">{Math.round(progressPercent)}%</span>
              </div>
              <Progress value={progressPercent} className="h-3" />
            </div>
            {isEligible ? (
              <Badge variant="default" className="w-full justify-center py-2">
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Tu es éligible pour demander une Ijaza !
              </Badge>
            ) : (
              <Badge variant="secondary" className="w-full justify-center py-2">
                Continue tes efforts pour atteindre les prérequis
              </Badge>
            )}
          </CardContent>
        </Card>

        {/* My Requests */}
        <MyIjazaRequests 
          requests={myRequests}
          sheikhs={sheikhs}
          getStatusLabel={getStatusLabel}
          getStatusColor={getStatusColor}
        />

        {/* Prerequisites */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-primary" />
              {t.prerequisites}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {prerequisites.map((prereq, index) => {
                const Icon = prereq.icon;
                const isMet = prereq.met === true;
                const isUnknown = prereq.met === undefined;
                return (
                  <div 
                    key={index}
                    className={`flex items-start gap-4 p-4 rounded-lg border ${
                      isMet ? 'bg-primary/5 border-primary/30' : 'bg-muted/50'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      isMet ? 'bg-primary text-primary-foreground' : 'bg-muted'
                    }`}>
                      {isMet ? (
                        <CheckCircle2 className="w-5 h-5" />
                      ) : (
                        <Icon className="w-5 h-5" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{prereq.title}</h4>
                        {prereq.required && (
                          <Badge variant="outline" className="text-xs">Requis</Badge>
                        )}
                        {isMet && (
                          <Badge variant="default" className="text-xs">✓ Atteint</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{prereq.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Request form */}
        {showForm ? (
          <IjazaRequestForm
            userName={userName}
            userEmail={user?.email || ''}
            selectedSheikh={selectedSlotData?.sheikh || null}
            selectedSlot={selectedSlotData?.slot || null}
            sheikhs={sheikhs}
            onSubmit={handleSubmitRequest}
            onCancel={handleCancelForm}
            getDayName={getDayName}
            formatTime={formatTime}
            isEligible={isEligible}
          />
        ) : (
          <>
            {/* Available Sheikhs */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="w-5 h-5 text-primary" />
                      Cheikhs disponibles
                    </CardTitle>
                    <CardDescription>
                      Sélectionne un créneau pour demander une session d'évaluation
                    </CardDescription>
                  </div>
                  <Button onClick={() => setShowForm(true)} disabled={!isEligible}>
                    <Plus className="w-4 h-4 mr-2" />
                    Nouvelle demande
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-32 w-full" />
                    ))}
                  </div>
                ) : sheikhs.length > 0 ? (
                  <div className="space-y-4">
                    {sheikhs.map((sheikh) => (
                      <SheikhCard
                        key={sheikh.id}
                        sheikh={sheikh}
                        availability={getSheikhAvailability(sheikh.id)}
                        onSelectSlot={handleSelectSlot}
                        getDayName={getDayName}
                        formatTime={formatTime}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Aucun cheikh n'est disponible pour le moment.</p>
                    <p className="text-sm">Reviens plus tard ou fais une demande générale.</p>
                    <Button 
                      className="mt-4" 
                      onClick={() => setShowForm(true)}
                      disabled={!isEligible}
                    >
                      <Calendar className="w-4 h-4 mr-2" />
                      Faire une demande
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </div>
  );
};

export default IjazaPage;
