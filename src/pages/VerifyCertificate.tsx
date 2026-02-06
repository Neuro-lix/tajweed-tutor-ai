import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  CheckCircle2, 
  XCircle, 
  Award, 
  Calendar, 
  User, 
  BookOpen,
  ArrowLeft,
  Shield,
  Star
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { SURAHS } from '@/data/quranData';
import { GeometricPattern, Star8Point } from '@/components/decorative/GeometricPattern';

const QIRAAT_NAMES: Record<string, string> = {
  hafs_asim: 'Ḥafṣ ʿan ʿĀṣim',
  warsh_nafi: 'Warsh ʿan Nāfiʿ',
  qalun_nafi: 'Qālūn ʿan Nāfiʿ',
  duri_amr: 'Ad-Dūrī ʿan Abī ʿAmr',
  susi_amr: 'As-Sūsī ʿan Abī ʿAmr',
  ibn_kathir: 'Ibn Kathīr',
  ibn_amir: 'Ibn ʿĀmir',
  shuaba_asim: 'Shuʿba ʿan ʿĀṣim',
  khalaf: 'Khalaf',
  khallad: 'Khallād',
};

interface CertificateData {
  id: string;
  userName: string;
  surahNumber: number;
  qiraat: string | null;
  averageScore: number;
  completedAt: string;
  certificateType: string;
}

export default function VerifyCertificate() {
  const { id } = useParams<{ id: string }>();
  const [certificate, setCertificate] = useState<CertificateData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCertificate() {
      if (!id) {
        setError('ID de certificat manquant');
        setLoading(false);
        return;
      }

      try {
        const { data, error: fetchError } = await supabase
          .from('user_certificates')
          .select('*')
          .eq('id', id)
          .single();

        if (fetchError) {
          if (fetchError.code === 'PGRST116') {
            setError('Certificat introuvable');
          } else {
            throw fetchError;
          }
        } else if (data) {
          setCertificate({
            id: data.id,
            userName: data.user_name,
            surahNumber: data.surah_number,
            qiraat: data.qiraat,
            averageScore: data.average_score,
            completedAt: data.completed_at,
            certificateType: data.certificate_type,
          });
        }
      } catch (err) {
        console.error('Error fetching certificate:', err);
        setError('Erreur lors de la vérification');
      } finally {
        setLoading(false);
      }
    }

    fetchCertificate();
  }, [id]);

  const surah = certificate ? SURAHS.find(s => s.id === certificate.surahNumber) : null;

  return (
    <div className="min-h-screen bg-background relative">
      <GeometricPattern className="text-primary" opacity={0.03} />
      
      <div className="relative z-10 container mx-auto px-4 py-12 max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/">
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour à l'accueil
            </Button>
          </Link>
          
          <Star8Point size={48} className="mx-auto text-primary mb-4" />
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
            Vérification de Certificat
          </h1>
          <p className="text-muted-foreground">
            Quran Tajwīd Coach
          </p>
        </div>

        {/* Loading State */}
        {loading && (
          <Card>
            <CardContent className="py-8">
              <div className="space-y-4">
                <Skeleton className="h-8 w-48 mx-auto" />
                <Skeleton className="h-4 w-64 mx-auto" />
                <Skeleton className="h-32 w-full" />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Error State */}
        {!loading && error && (
          <Card className="border-destructive/50">
            <CardContent className="py-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-destructive/10 flex items-center justify-center">
                <XCircle className="w-8 h-8 text-destructive" />
              </div>
              <h2 className="text-xl font-semibold text-destructive mb-2">
                Certificat Non Valide
              </h2>
              <p className="text-muted-foreground mb-6">
                {error}
              </p>
              <p className="text-sm text-muted-foreground">
                Si vous pensez qu'il s'agit d'une erreur, veuillez contacter le support.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Valid Certificate */}
        {!loading && !error && certificate && (
          <div className="space-y-6">
            {/* Verification Badge */}
            <Card className="border-primary/50 bg-primary/5">
              <CardContent className="py-6">
                <div className="flex items-center justify-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-primary">
                      Certificat Authentique
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Ce certificat a été vérifié avec succès
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Certificate Details */}
            <Card>
              <CardHeader className="text-center pb-2">
                <div className="flex justify-center mb-2">
                  <Award className="w-8 h-8 text-primary" />
                </div>
                <CardTitle className="text-xl">
                  Certificat de Maîtrise
                </CardTitle>
                <CardDescription>
                  {certificate.certificateType === 'surah_mastery' ? 'Maîtrise de Sourate' : certificate.certificateType}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-6">
                {/* Surah Info */}
                <div className="text-center py-4 border rounded-lg bg-muted/30">
                  <p className="font-arabic text-3xl mb-2" dir="rtl">
                    {surah?.name}
                  </p>
                  <p className="text-lg font-medium text-foreground">
                    Sourate {surah?.transliteration || certificate.surahNumber}
                  </p>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg text-center">
                    <User className="w-5 h-5 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground mb-1">Récitant</p>
                    <p className="font-medium text-foreground">{certificate.userName}</p>
                  </div>
                  
                  <div className="p-4 border rounded-lg text-center">
                    <Star className="w-5 h-5 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground mb-1">Score moyen</p>
                    <p className="font-medium text-foreground">{certificate.averageScore.toFixed(0)}%</p>
                  </div>
                  
                  <div className="p-4 border rounded-lg text-center">
                    <BookOpen className="w-5 h-5 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground mb-1">Lecture</p>
                    <p className="font-medium text-foreground">
                      {certificate.qiraat ? QIRAAT_NAMES[certificate.qiraat] || certificate.qiraat : 'N/A'}
                    </p>
                  </div>
                  
                  <div className="p-4 border rounded-lg text-center">
                    <Calendar className="w-5 h-5 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground mb-1">Délivré le</p>
                    <p className="font-medium text-foreground">
                      {new Date(certificate.completedAt).toLocaleDateString('fr-FR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                </div>

                {/* Certificate ID */}
                <div className="pt-4 border-t text-center">
                  <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                    <Shield className="w-4 h-4" />
                    <span>ID: {certificate.id}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Footer */}
            <p className="text-center text-sm text-muted-foreground">
              Ce certificat atteste la maîtrise de la récitation selon les règles du Tajwīd,
              validée par l'intelligence artificielle de Quran Tajwīd Coach.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
