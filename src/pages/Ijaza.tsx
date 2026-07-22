import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Award, BookOpen, CheckCircle2, Calendar, Star, Users,
  GraduationCap, ArrowLeft, Plus, Clock, ExternalLink
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { GeometricPattern, Star8Point } from '@/components/decorative/GeometricPattern';
import { useIjaza } from '@/hooks/useIjaza';
import { useAuth } from '@/hooks/useAuth';
import { SheikhCard } from '@/components/ijaza/SheikhCard';
import { IjazaRequestForm } from '@/components/ijaza/IjazaRequestForm';
import { MyIjazaRequests } from '@/components/ijaza/MyIjazaRequests';
import { IjazaCalendar } from '@/components/ijaza/IjazaCalendar';
import { PageSeo } from '@/components/seo/PageSeo';

interface IjazaPageProps {
  userName?: string;
  masteredSurahs: number;
  totalSurahs: number;
  averageScore: number;
  onBack: () => void;
}

interface SelectedSlotData {
  sheikh: { id: string; name: string; specialty: string | null; languages: string[] };
  slot: { id: string; sheikhId: string; dayOfWeek: number; startTime: string; endTime: string; isBooked: boolean; booking_date?: string };
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
  const { sheikhs, availability, myRequests, loading, getSheikhAvailability, getDayName, formatTime, submitRequest, getStatusLabel, getStatusColor } = useIjaza();
  const [showForm, setShowForm] = useState(false);
  const [selectedSlotData, setSelectedSlotData] = useState<SelectedSlotData | null>(null);
  const [activeTab, setActiveTab] = useState<'ijaza' | 'private'>('ijaza');

  const prerequisites = [
    { title: 'Mémorisation complète', description: 'Avoir mémorisé le Coran en entier ou la partie concernée', icon: BookOpen, required: true, met: undefined },
    { title: 'Maîtrise du Tajwid', description: 'Score moyen de 85% ou plus sur les récitations', icon: Star, met: averageScore >= 85, required: true },
    { title: 'Régularité', description: 'Au moins 30 sourates maîtrisées', icon: CheckCircle2, met: masteredSurahs >= 30, required: true },
    { title: 'Recommandation', description: "Lettre de recommandation d'un enseignant (optionnel)", icon: Users, required: false, met: undefined },
  ];

  const handleSelectSlot = (sheikh: any, slot: any) => { setSelectedSlotData({ sheikh, slot }); setShowForm(true); };
  const handleSubmitRequest = async (data: any) => { const result = await submitRequest(data); if (result) { setShowForm(false); setSelectedSlotData(null); } };
  const handleCancelForm = () => { setShowForm(false); setSelectedSlotData(null); };

  const progressPercent = (masteredSurahs / totalSurahs) * 100;
  const isEligible = masteredSurahs >= 30 && averageScore >= 85;

  return (
    <div className="min-h-screen bg-background relative">
      <PageSeo
        title="Ijāzah — Certification Coran & cours privés | Tajweed Tutor AI"
        description="Passe une Ijāzah avec des sheikhs égyptiens : prérequis, calendrier, réservation de créneaux et cours privés de tajwīd."
        path="/ijaza"
      />
      <GeometricPattern className="text-primary" opacity={0.03} />

      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={onBack}>
              <ArrowLeft className="w-4 h-4 mr-2" />{t.back}
            </Button>
            <div className="flex items-center gap-3">
              <Star8Point size={24} className="text-primary" />
              <span className="font-semibold">{t.ijaza}</span>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl space-y-8">

        {/* Hero */}
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
              <GraduationCap className="w-10 h-10 text-primary" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-foreground">{t.ijazaTitle}</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">{t.ijazaDescription}</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-border">
          <button
            onClick={() => setActiveTab('ijaza')}
            className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${activeTab === 'ijaza' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
          >
            <Award className="w-4 h-4 inline mr-2" />
            Passer une Ijaza
          </button>
          <button
            onClick={() => setActiveTab('private')}
            className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${activeTab === 'private' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
          >
            <Users className="w-4 h-4 inline mr-2" />
            Cours privés
          </button>
        </div>

        {/* TAB IJAZA */}
        {activeTab === 'ijaza' && (
          <div className="space-y-8">

            {/* Tarifs Ijaza */}
            <Card className="border-primary/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-primary" />
                  Tarifs — Évaluation Ijaza
                </CardTitle>
                <CardDescription>Évaluation officielle avec le Cheikh Anas Ahmad Al-Nashrati</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="border rounded-xl p-5 text-center space-y-2">
                    <p className="font-medium text-foreground">Ijaza partielle</p>
                    <p className="text-xs text-muted-foreground">1 à 5 sourates</p>
                    <p className="text-4xl font-bold text-primary">50€</p>
                    <p className="text-xs text-muted-foreground">Évaluation + certificat</p>
                    <Button size="sm" className="w-full mt-2" onClick={() => setShowForm(true)}>Réserver</Button>
                  </div>
                  <div className="border-2 border-primary rounded-xl p-5 text-center space-y-2 bg-primary/5 relative">
                    <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">Populaire</Badge>
                    <p className="font-medium text-foreground">Ijaza Hizb</p>
                    <p className="text-xs text-muted-foreground">Un hizb complet (60 pages)</p>
                    <p className="text-4xl font-bold text-primary">150€</p>
                    <p className="text-xs text-muted-foreground">Évaluation + certificat</p>
                    <Button size="sm" className="w-full mt-2" onClick={() => setShowForm(true)}>Réserver</Button>
                  </div>
                  <div className="border rounded-xl p-5 text-center space-y-2">
                    <p className="font-medium text-foreground">Ijaza complète</p>
                    <p className="text-xs text-muted-foreground">Coran entier (30 juz)</p>
                    <p className="text-4xl font-bold text-primary">500€</p>
                    <p className="text-xs text-muted-foreground">Évaluation + certificat officiel</p>
                    <Button size="sm" className="w-full mt-2" onClick={() => setShowForm(true)}>Réserver</Button>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground text-center mt-4">
                  💳 Paiement sécurisé via Paddle — Remboursement si l'évaluation ne peut avoir lieu
                </p>
              </CardContent>
            </Card>

            {/* Progress */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-primary" />
                  Ta progression vers l'Ijaza
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div><div className="text-3xl font-bold text-primary">{masteredSurahs}</div><p className="text-sm text-muted-foreground">Sourates maîtrisées</p></div>
                  <div><div className="text-3xl font-bold text-primary">{averageScore}%</div><p className="text-sm text-muted-foreground">Score moyen</p></div>
                  <div><div className="text-3xl font-bold text-primary">{totalSurahs}</div><p className="text-sm text-muted-foreground">Sourates totales</p></div>
                </div>
                <Progress value={progressPercent} className="h-3" />
                {isEligible ? (
                  <Badge variant="default" className="w-full justify-center py-2"><CheckCircle2 className="w-4 h-4 mr-2" />Tu es éligible pour demander une Ijaza !</Badge>
                ) : (
                  <Badge variant="secondary" className="w-full justify-center py-2">Continue tes efforts pour atteindre les prérequis</Badge>
                )}
              </CardContent>
            </Card>

            <MyIjazaRequests requests={myRequests} sheikhs={sheikhs} getStatusLabel={getStatusLabel} getStatusColor={getStatusColor} />

            {/* Prerequisites */}
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-primary" />{t.prerequisites}</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {prerequisites.map((prereq, index) => {
                    const Icon = prereq.icon;
                    const isMet = prereq.met === true;
                    return (
                      <div key={index} className={`flex items-start gap-4 p-4 rounded-lg border ${isMet ? 'bg-primary/5 border-primary/30' : 'bg-muted/50'}`}>
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isMet ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                          {isMet ? <CheckCircle2 className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">{prereq.title}</h4>
                            {prereq.required && <Badge variant="outline" className="text-xs">Requis</Badge>}
                            {isMet && <Badge variant="default" className="text-xs">✓ Atteint</Badge>}
                          </div>
                          <p className="text-sm text-muted-foreground">{prereq.description}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Calendrier de réservation */}
            <IjazaCalendar
              isAdmin={false}
              onSlotSelect={(slotId, date, time) => {
                setSelectedSlotData({ sheikh: sheikhs[0] || null, slot: { id: slotId, sheikhId: sheikhs[0]?.id || '', dayOfWeek: 0, startTime: time, endTime: '', isBooked: false, booking_date: date } });
                setShowForm(true);
              }}
            />

            {/* Formulaire de réservation - modal */}
            {showForm && (
              <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
                <div className="bg-background rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                  <IjazaRequestForm
                    userName={userName}
                    userEmail={user?.email || ""}
                    selectedSheikh={selectedSlotData?.sheikh || null}
                    selectedSlot={selectedSlotData?.slot || null}
                    sheikhs={sheikhs}
                    onSubmit={handleSubmitRequest}
                    onCancel={handleCancelForm}
                    getDayName={getDayName}
                    formatTime={formatTime}
                    isEligible={isEligible}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB COURS PRIVÉS */}
        {activeTab === 'private' && (
          <div className="space-y-6">

            {/* Cheikh bio */}
            <Card className="border-primary/30">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <GraduationCap className="w-8 h-8 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-arabic text-2xl font-semibold" dir="rtl">أنس أحمد النشرتي</h3>
                    <p className="text-base font-medium text-foreground">Anas Ahmad Al-Nashrati</p>
                    <p className="text-sm text-muted-foreground font-arabic mt-1" dir="rtl">
                      طبيب حاصل على شهادة الدكتوراه من جامعة الأزهر الشريف بمصر — حافظ لكتاب الله عز وجل — حاصل على إجازة في قراءة الإمام عاصم برواية شعبة وحفص
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Docteur diplômé de l'Université Al-Azhar d'Égypte — Hafiz du Saint Coran — Titulaire de l'Ijaza en lecture de l'Imam Asim selon les deux rivayates Shu'ba et Hafs
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tarifs cours privés */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-primary" />
                  Tarifs — Cours privés
                </CardTitle>
                <CardDescription>Sessions individuelles via visioconférence (Zoom / Google Meet)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="border rounded-xl p-5 text-center space-y-2">
                    <p className="font-medium">Cours à l'unité</p>
                    <p className="text-xs text-muted-foreground">1 séance d'1 heure</p>
                    <p className="text-4xl font-bold text-primary">30€</p>
                    <p className="text-xs text-muted-foreground">/ heure</p>
                    <Button size="sm" className="w-full mt-2" onClick={() => setShowForm(true)}>Réserver</Button>
                  </div>
                  <div className="border-2 border-primary rounded-xl p-5 text-center space-y-2 bg-primary/5 relative">
                    <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">Économique</Badge>
                    <p className="font-medium">Pack 5 cours</p>
                    <p className="text-xs text-muted-foreground">5 séances d'1 heure</p>
                    <p className="text-4xl font-bold text-primary">120€</p>
                    <p className="text-xs text-muted-foreground">24€/séance (−20%)</p>
                    <Button size="sm" className="w-full mt-2" onClick={() => window.open('mailto:contact@tajweedtutorai.com?subject=Pack 5 cours privés', '_blank')}>Réserver</Button>
                  </div>
                  <div className="border rounded-xl p-5 text-center space-y-2">
                    <p className="font-medium">Pack 10 cours</p>
                    <p className="text-xs text-muted-foreground">10 séances d'1 heure</p>
                    <p className="text-4xl font-bold text-primary">200€</p>
                    <p className="text-xs text-muted-foreground">20€/séance (−33%)</p>
                    <Button size="sm" className="w-full mt-2" onClick={() => window.open('mailto:contact@tajweedtutorai.com?subject=Pack 10 cours privés', '_blank')}>Réserver</Button>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground text-center mt-4">
                  💳 Paiement sécurisé via Paddle — Les créneaux sont confirmés sous 24h
                </p>
              </CardContent>
            </Card>

            {/* Ce qu'on apprend */}
            <Card>
              <CardHeader><CardTitle>Ce que couvrent les cours privés</CardTitle></CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-3">
                  {[
                    "Correction des makharij (points d'articulation)",
                    "Règles du tajwid selon la qira'ah choisie",
                    "Mémorisation et révision du Coran",
                    "Préparation à l'évaluation Ijaza",
                    "Règles du waqf et ibtida'",
                    "Lecture selon les 10 qira'at canoniques",
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                      <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                      <span className="text-sm">{item}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Réserver cours privé */}
            <div className="text-center">
              <Button size="lg" onClick={() => window.open('mailto:contact@tajweedtutorai.com?subject=Réservation cours privé', '_blank')} className="gap-2">
                <Calendar className="w-5 h-5" />
                Réserver un cours privé
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default IjazaPage;
