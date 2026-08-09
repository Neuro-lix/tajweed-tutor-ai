import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useCredits } from './useCredits';
import { CREDIT_COSTS } from '@/lib/credits';

export const useTextToSpeech = () => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { hasCreditsFor, refetch: refetchCredits } = useCredits();

  const speak = useCallback(async (
    text: string,
    language: string = 'fr',
    options?: { speed?: number },
  ) => {
    if (!text.trim()) return;

    if (!hasCreditsFor(CREDIT_COSTS.textToSpeech)) {
      setError('Crédits insuffisants pour la synthèse vocale, achetez un pack de crédits.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Stop any currently playing audio
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }

      // invoke() attaches the signed-in user's JWT, which the function requires.
      const { data, error: fnError } = await supabase.functions.invoke('text-to-speech', {
        body: { text, language, speed: options?.speed },
      });
      if (fnError) {
        throw new Error(
          (data as { message?: string } | null)?.message
            || fnError.message
            || 'Failed to generate speech',
        );
      }
      if (!data?.audioContent) throw new Error(data?.error || 'Failed to generate speech');
      refetchCredits();

      // Play audio from base64
      const audioUrl = `data:audio/mpeg;base64,${data.audioContent}`;
      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.onplay = () => setIsSpeaking(true);
      audio.onended = () => {
        setIsSpeaking(false);
        audioRef.current = null;
      };
      audio.onerror = () => {
        setError('Error playing audio');
        setIsSpeaking(false);
        audioRef.current = null;
      };

      await audio.play();
    } catch (err) {
      console.error('TTS error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [hasCreditsFor, refetchCredits]);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
      setIsSpeaking(false);
    }
  }, []);

  // Stop playback when the component using the hook unmounts.
  useEffect(() => () => {
    audioRef.current?.pause();
    audioRef.current = null;
  }, []);

  return {
    speak,
    stop,
    isSpeaking,
    isLoading,
    error,
  };
};
