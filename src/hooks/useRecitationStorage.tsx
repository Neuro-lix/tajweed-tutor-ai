import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface StoredRecitation {
  id: string;
  surahNumber: number;
  verseNumber: number;
  storagePath: string;
  durationSeconds: number | null;
  analysisScore: number | null;
  qiraat: string;
  createdAt: string;
}

interface UseRecitationStorageReturn {
  recordings: StoredRecitation[];
  loading: boolean;
  saveRecording: (params: {
    audioBlob: Blob;
    surahNumber: number;
    verseNumber: number;
    durationSeconds?: number;
    analysisScore?: number;
    qiraat?: string;
  }) => Promise<string | null>;
  deleteRecording: (id: string, storagePath: string) => Promise<boolean>;
  downloadRecording: (storagePath: string, filename?: string) => Promise<void>;
  fetchRecordings: () => Promise<void>;
}

export const useRecitationStorage = (): UseRecitationStorageReturn => {
  const { user } = useAuth();
  const [recordings, setRecordings] = useState<StoredRecitation[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchRecordings = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_recitations')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setRecordings(
        (data || []).map((r: any) => ({
          id: r.id,
          surahNumber: r.surah_number,
          verseNumber: r.verse_number,
          storagePath: r.storage_path,
          durationSeconds: r.duration_seconds,
          analysisScore: r.analysis_score,
          qiraat: r.qiraat,
          createdAt: r.created_at,
        }))
      );
    } catch (err) {
      console.error('[RecitationStorage] fetchRecordings error:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const saveRecording = useCallback(
    async (params: {
      audioBlob: Blob;
      surahNumber: number;
      verseNumber: number;
      durationSeconds?: number;
      analysisScore?: number;
      qiraat?: string;
    }): Promise<string | null> => {
      if (!user) {
        toast.error('Connecte-toi pour sauvegarder tes récitations.');
        return null;
      }

      const { audioBlob, surahNumber, verseNumber, durationSeconds, analysisScore, qiraat } = params;

      const ext = audioBlob.type.includes('wav') ? 'wav' : audioBlob.type.includes('mp4') ? 'mp4' : 'webm';
      const timestamp = Date.now();
      const storagePath = `${user.id}/${surahNumber}-${verseNumber}-${timestamp}.${ext}`;

      try {
        // 1) Upload to storage
        const { error: uploadError } = await supabase.storage
          .from('recitations')
          .upload(storagePath, audioBlob, {
            contentType: audioBlob.type,
            upsert: false,
          });

        if (uploadError) throw uploadError;

        // 2) Insert metadata
        const { data, error: insertError } = await supabase
          .from('user_recitations')
          .insert({
            user_id: user.id,
            surah_number: surahNumber,
            verse_number: verseNumber,
            storage_path: storagePath,
            duration_seconds: durationSeconds ?? null,
            analysis_score: analysisScore ?? null,
            qiraat: qiraat ?? 'hafs_asim',
          })
          .select('id')
          .single();

        if (insertError) throw insertError;

        toast.success('Récitation sauvegardée !');
        await fetchRecordings();
        return data?.id ?? null;
      } catch (err) {
        console.error('[RecitationStorage] saveRecording error:', err);
        toast.error('Erreur lors de la sauvegarde.');
        return null;
      }
    },
    [user, fetchRecordings]
  );

  const deleteRecording = useCallback(
    async (id: string, storagePath: string): Promise<boolean> => {
      if (!user) return false;

      try {
        // 1) Delete from storage
        const { error: storageError } = await supabase.storage.from('recitations').remove([storagePath]);
        if (storageError) console.warn('[RecitationStorage] storage delete warning:', storageError);

        // 2) Delete metadata
        const { error: dbError } = await supabase.from('user_recitations').delete().eq('id', id);
        if (dbError) throw dbError;

        toast.success('Récitation supprimée.');
        setRecordings((prev) => prev.filter((r) => r.id !== id));
        return true;
      } catch (err) {
        console.error('[RecitationStorage] deleteRecording error:', err);
        toast.error('Erreur lors de la suppression.');
        return false;
      }
    },
    [user]
  );

  const downloadRecording = useCallback(
    async (storagePath: string, filename?: string): Promise<void> => {
      try {
        const { data, error } = await supabase.storage.from('recitations').download(storagePath);
        if (error) throw error;

        const url = URL.createObjectURL(data);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename || storagePath.split('/').pop() || 'recitation.wav';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } catch (err) {
        console.error('[RecitationStorage] downloadRecording error:', err);
        toast.error('Erreur lors du téléchargement.');
      }
    },
    []
  );

  return {
    recordings,
    loading,
    saveRecording,
    deleteRecording,
    downloadRecording,
    fetchRecordings,
  };
};
