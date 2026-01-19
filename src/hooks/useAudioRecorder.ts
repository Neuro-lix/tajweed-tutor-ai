import { useState, useRef, useCallback } from 'react';

interface UseAudioRecorderReturn {
  isRecording: boolean;
  audioBlob: Blob | null;
  audioBase64: string | null;
  audioMimeType: string | null;
  mediaStream: MediaStream | null;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<string | null>;
  error: string | null;
}

export const useAudioRecorder = (): UseAudioRecorderReturn => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioBase64, setAudioBase64] = useState<string | null>(null);
  const [audioMimeType, setAudioMimeType] = useState<string | null>(null);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const mimeTypeRef = useRef<string>('audio/webm');

  const startRecording = useCallback(async () => {
    try {
      setError(null);
      setAudioBlob(null);
      setAudioBase64(null);
      setAudioMimeType(null);
      chunksRef.current = [];

      if (typeof MediaRecorder === 'undefined') {
        setError("L'enregistrement audio n'est pas supporté sur ce navigateur.");
        return;
      }

      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            sampleRate: 16000,
            channelCount: 1,
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });
      } catch (e) {
        // Fallback: some browsers reject strict constraints (sampleRate/channelCount)
        console.warn('[AudioRecorder] getUserMedia with constraints failed, retrying with audio:true', e);
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      }

      streamRef.current = stream;
      setMediaStream(stream);

      // Determine best MIME type for browser compatibility
      let mimeType = 'audio/webm';
      if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        mimeType = 'audio/webm;codecs=opus';
      } else if (MediaRecorder.isTypeSupported('audio/webm')) {
        mimeType = 'audio/webm';
      } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
        mimeType = 'audio/mp4';
      } else if (MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')) {
        mimeType = 'audio/ogg;codecs=opus';
      }

      mimeTypeRef.current = mimeType;
      console.log('[AudioRecorder] Using MIME type:', mimeType);

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      setAudioMimeType(mimeType);

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
          console.log('[AudioRecorder] Chunk received, size:', event.data.size);
        }
      };

      mediaRecorder.start(250);
      setIsRecording(true);
      console.log('[AudioRecorder] Recording started');
    } catch (err) {
      console.error('[AudioRecorder] Error starting recording:', err);
      setError("Impossible d'accéder au microphone. Veuillez vérifier les permissions.");
    }
  }, []);

  const stopRecording = useCallback(async (): Promise<string | null> => {
    return new Promise<string | null>((resolve) => {
      const recorder = mediaRecorderRef.current;

      if (recorder && isRecording) {
        recorder.onstop = async () => {
          const mimeType = mimeTypeRef.current;

          const cleanup = () => {
            // Stop all tracks (AFTER recorder stops, to avoid missing final chunk on some browsers)
            if (streamRef.current) {
              streamRef.current.getTracks().forEach((track) => track.stop());
              streamRef.current = null;
            }
            setMediaStream(null);
            mediaRecorderRef.current = null;
          };

          console.log('[AudioRecorder] Recording stopped, chunks:', chunksRef.current.length);
          console.log('[AudioRecorder] Total size:', chunksRef.current.reduce((acc, c) => acc + c.size, 0));

          if (chunksRef.current.length === 0) {
            console.error('[AudioRecorder] No audio chunks recorded');
            setError("Aucun audio capturé. Réessayez.");
            cleanup();
            resolve(null);
            return;
          }

          const blob = new Blob(chunksRef.current, { type: mimeType });
          setAudioBlob(blob);
          setAudioMimeType(mimeType);

          console.log('[AudioRecorder] Final blob size:', blob.size, 'type:', blob.type);

          // Convert to base64
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64 = reader.result as string;
            const base64Data = base64.includes(',') ? base64.split(',')[1] : base64;
            setAudioBase64(base64Data);
            console.log('[AudioRecorder] Base64 length:', base64Data.length);
            cleanup();
            resolve(base64Data);
          };
          reader.onerror = () => {
            console.error('[AudioRecorder] FileReader error');
            setError("Erreur de lecture audio.");
            cleanup();
            resolve(null);
          };
          reader.readAsDataURL(blob);
        };

        recorder.stop();
        setIsRecording(false);
      } else {
        console.warn('[AudioRecorder] No active recording to stop');
        resolve(null);
      }
    });
  }, [isRecording]);

  return {
    isRecording,
    audioBlob,
    audioBase64,
    audioMimeType,
    mediaStream,
    startRecording,
    stopRecording,
    error,
  };
};
