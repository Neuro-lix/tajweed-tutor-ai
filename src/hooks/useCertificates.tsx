import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

interface Certificate {
  id: string;
  surahNumber: number;
  certificateType: string;
  userName: string;
  qiraat: string;
  averageScore: number;
  completedAt: string;
}

interface SurahProgress {
  surahNumber: number;
  masteredVerses: number;
  totalVerses: number;
  status: 'not_started' | 'in_progress' | 'mastered';
}

export const useCertificates = () => {
  const { user } = useAuth();
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [newCertificate, setNewCertificate] = useState<Certificate | null>(null);

  const fetchCertificates = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_certificates')
        .select('*')
        .eq('user_id', user.id)
        .order('completed_at', { ascending: false });

      if (error) throw error;

      setCertificates(
        (data || []).map((c: any) => ({
          id: c.id,
          surahNumber: c.surah_number,
          certificateType: c.certificate_type,
          userName: c.user_name,
          qiraat: c.qiraat,
          averageScore: Number(c.average_score),
          completedAt: c.completed_at,
        }))
      );
    } catch (error) {
      console.error('Error fetching certificates:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchCertificates();
  }, [fetchCertificates]);

  // Check if a surah should receive a certificate (100% mastery)
  const checkAndAwardCertificate = useCallback(
    async (
      surahProgress: SurahProgress,
      userName: string,
      qiraat: string = 'hafs_asim',
      averageScore: number = 100
    ) => {
      if (!user) return null;

      // Check if surah is fully mastered
      if (surahProgress.masteredVerses < surahProgress.totalVerses) {
        return null;
      }

      // Check if certificate already exists
      const existing = certificates.find(
        (c) => c.surahNumber === surahProgress.surahNumber && c.certificateType === 'surah_mastery'
      );

      if (existing) {
        return existing;
      }

      try {
        const { data, error } = await supabase
          .from('user_certificates')
          .insert({
            user_id: user.id,
            surah_number: surahProgress.surahNumber,
            certificate_type: 'surah_mastery',
            user_name: userName,
            qiraat,
            average_score: averageScore,
            completed_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (error) {
          // Unique constraint violation - certificate already exists
          if (error.code === '23505') {
            return null;
          }
          throw error;
        }

        const newCert: Certificate = {
          id: data.id,
          surahNumber: data.surah_number,
          certificateType: data.certificate_type,
          userName: data.user_name,
          qiraat: data.qiraat,
          averageScore: Number(data.average_score),
          completedAt: data.completed_at,
        };

        setCertificates((prev) => [newCert, ...prev]);
        setNewCertificate(newCert);

        toast.success('🎉 Félicitations ! Tu as obtenu un nouveau certificat !', {
          description: `Sourate maîtrisée à 100%`,
          duration: 6000,
        });

        return newCert;
      } catch (error) {
        console.error('Error awarding certificate:', error);
        return null;
      }
    },
    [user, certificates]
  );

  const dismissNewCertificate = () => {
    setNewCertificate(null);
  };

  const hasCertificate = (surahNumber: number) => {
    return certificates.some((c) => c.surahNumber === surahNumber);
  };

  return {
    certificates,
    loading,
    newCertificate,
    checkAndAwardCertificate,
    dismissNewCertificate,
    hasCertificate,
    refetch: fetchCertificates,
  };
};
