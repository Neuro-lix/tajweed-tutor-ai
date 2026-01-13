import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Award, 
  BookOpen, 
  CheckCircle2, 
  Calendar, 
  MessageSquare,
  Star,
  Users,
  GraduationCap,
  ArrowLeft,
  Send,
  Clock,
  Globe
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { GeometricPattern, Star8Point } from '@/components/decorative/GeometricPattern';
import { toast } from 'sonner';

interface IjazaPageProps {
  userName?: string;
  masteredSurahs: number;
  totalSurahs: number;
  averageScore: number;
  onBack: () => void;
}

export const IjazaPage: React.FC<IjazaPageProps> = ({
  userName = 'Étudiant',
  masteredSurahs,
  totalSurahs,
  averageScore,
  onBack,
}) => {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    fullName: userName,
    email: '',
    phone: '',
    preferredLanguage: 'ar',
    preferredTime: '',
    motivation: '',
    experience: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const prerequisites = [
    { 
      title: 'Mémorisation complète',
      description: 'Avoir mémorisé le Coran en entier ou la partie concernée',
      icon: BookOpen,
      required: true,
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
    },
  ];

  const sheikhs = [
    {
      name: 'Sheikh Ahmad Al-Tijani',
      specialty: 'Lecture Ḥafṣ \'an \'Āṣim',
      languages: ['Arabe', 'Français', 'Anglais'],
      available: true,
    },
    {
      name: 'Sheikh Muhammad Al-Azhari',
      specialty: 'Lectures multiples (Qira\'at)',
      languages: ['Arabe', 'Anglais', 'Ourdou'],
      available: true,
    },
    {
      name: 'Sheikh Yusuf Ibn Abdallah',
      specialty: 'Lecture Warsh \'an Nāfi\'',
      languages: ['Arabe', 'Français'],
      available: false,
    },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));

    setIsSubmitting(false);
    setIsSubmitted(true);
    toast.success('Votre demande d\'Ijaza a été envoyée avec succès !');
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
                return (
                  <div 
                    key={index}
                    className={`flex items-start gap-4 p-4 rounded-lg border ${
                      prereq.met ? 'bg-primary/5 border-primary/30' : 'bg-muted/50'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      prereq.met ? 'bg-primary text-primary-foreground' : 'bg-muted'
                    }`}>
                      {prereq.met ? (
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
                      </div>
                      <p className="text-sm text-muted-foreground">{prereq.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Available Sheikhs */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Cheikhs disponibles
            </CardTitle>
            <CardDescription>
              Nos cheikhs certifiés sont prêts à vous accompagner dans votre parcours
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              {sheikhs.map((sheikh, index) => (
                <div 
                  key={index}
                  className={`p-4 rounded-lg border ${
                    sheikh.available ? 'border-primary/30' : 'opacity-60'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-medium">{sheikh.name}</h4>
                      <p className="text-sm text-muted-foreground">{sheikh.specialty}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Globe className="w-3 h-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                          {sheikh.languages.join(', ')}
                        </span>
                      </div>
                    </div>
                    <Badge variant={sheikh.available ? 'default' : 'secondary'}>
                      {sheikh.available ? 'Disponible' : 'Indisponible'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Request form */}
        {!isSubmitted ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                {t.requestIjaza}
              </CardTitle>
              <CardDescription>
                Remplis ce formulaire pour demander une session d'évaluation avec un cheikh
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
                    <label className="text-sm font-medium">Créneaux préférés *</label>
                    <Input
                      value={formData.preferredTime}
                      onChange={e => setFormData({ ...formData, preferredTime: e.target.value })}
                      placeholder="Ex: Weekends après-midi"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Expérience en récitation *</label>
                  <Textarea
                    value={formData.experience}
                    onChange={e => setFormData({ ...formData, experience: e.target.value })}
                    placeholder="Décris ton parcours d'apprentissage du Coran..."
                    rows={3}
                    required
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

                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={isSubmitting || !isEligible}
                >
                  {isSubmitting ? (
                    <>
                      <Clock className="w-4 h-4 mr-2 animate-spin" />
                      Envoi en cours...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      {t.requestIjaza}
                    </>
                  )}
                </Button>

                {!isEligible && (
                  <p className="text-sm text-muted-foreground text-center">
                    Tu dois remplir les prérequis avant de pouvoir demander une Ijaza
                  </p>
                )}
              </form>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-primary/30">
            <CardContent className="py-12 text-center space-y-4">
              <div className="flex justify-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8 text-primary" />
                </div>
              </div>
              <h3 className="text-xl font-semibold">Demande envoyée !</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                Ta demande a été transmise à notre équipe. Un cheikh te contactera 
                dans les 48 heures pour planifier ta session d'évaluation.
              </p>
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <MessageSquare className="w-4 h-4" />
                <span>Vérifie tes emails (et les spams)</span>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default IjazaPage;
