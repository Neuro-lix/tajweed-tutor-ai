import { useState, useRef, useCallback } from 'react';

interface UseAudioRecorderReturn {
  isRecording: boolean;
  audioBlob: Blob | null;
  audioBase64: string | null;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<void>;
  error: string | null;
}

export const useAudioRecorder = (): UseAudioRecorderReturn => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioBase64, setAudioBase64] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  const startRecording = useCallback(async () => {
    try {
      setError(null);
      setAudioBlob(null);
      setAudioBase64(null);
      chunksRef.current = [];

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        }
      });

      streamRef.current = stream;

      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') 
        ? 'audio/webm;codecs=opus' 
        : 'audio/webm';

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        setAudioBlob(blob);

        // Convert to base64
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = reader.result as string;
          // Remove data URL prefix
          const base64Data = base64.split(',')[1];
          setAudioBase64(base64Data);
        };
        reader.readAsDataURL(blob);
      };

      mediaRecorder.start(100); // Collect data every 100ms
      setIsRecording(true);
    } catch (err) {
      console.error('Error starting recording:', err);
      setError('Impossible d\'accéder au microphone. Veuillez vérifier les permissions.');
    }
  }, []);

  const stopRecording = useCallback(async () => {
    return new Promise<void>((resolve) => {
      if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.onstop = async () => {
          const mimeType = mediaRecorderRef.current?.mimeType || 'audio/webm';
          const blob = new Blob(chunksRef.current, { type: mimeType });
          setAudioBlob(blob);

          // Convert to base64
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64 = reader.result as string;
            const base64Data = base64.split(',')[1];
            setAudioBase64(base64Data);
            resolve();
          };
          reader.readAsDataURL(blob);
        };

        mediaRecorderRef.current.stop();
        
        // Stop all tracks
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
        
        setIsRecording(false);
      } else {
        resolve();
      }
    });
  }, [isRecording]);

  return {
    isRecording,
    audioBlob,
    audioBase64,
    startRecording,
    stopRecording,
    error,
  };
};
