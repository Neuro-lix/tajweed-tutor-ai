import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { stripDiacritics, charSimilarity } from '../../supabase/functions/_shared/recitation-metrics';

export type LiveWordState = 'pending' | 'correct' | 'doubt' | 'wrong';

const SEGMENT_MS = 4000;

const blobToBase64 = (b: Blob) =>
  new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result).split(',')[1] ?? '');
    r.onerror = reject;
    r.readAsDataURL(b);
  });

/** Aligne les mots entendus sur les mots attendus, dans l'ordre (style Tarteel). */
export const alignLive = (expected: string[], heard: string[]): LiveWordState[] => {
  const out: LiveWordState[] = expected.map(() => 'pending');
  const h = heard.map(stripDiacritics);
  let j = 0;
  for (let i = 0; i < expected.length && j < h.length; i++) {
    const target = stripDiacritics(expected[i]);
    let best = 0, bestK = -1;
    for (let k = j; k < Math.min(h.length, j + 3); k++) {
      const s = charSimilarity(target, h[k]);
      if (s > best) { best = s; bestK = k; }
    }
    if (bestK < 0) break;
    out[i] = best >= 0.8 ? 'correct' : best >= 0.5 ? 'doubt' : 'wrong';
    j = bestK + 1;
  }
  return out;
};

/**
 * Pendant l'enregistrement, envoie l'audio accumulé toutes les ~4 s au moteur
 * de reconnaissance et renvoie l'état de chaque mot du verset au fil de l'eau.
 */
export const useLiveRecitation = (
  stream: MediaStream | null,
  active: boolean,
  verseText: string,
  surahNumber: number,
  verseNumber: number,
) => {
  const words = verseText.split(/\s+/).filter(Boolean);
  const [states, setStates] = useState<LiveWordState[]>(() => words.map(() => 'pending'));
  const [unavailable, setUnavailable] = useState(false);
  const chunks = useRef<Blob[]>([]);
  const busy = useRef(false);

  useEffect(() => {
    setStates(verseText.split(/\s+/).filter(Boolean).map(() => 'pending'));
  }, [verseText, active]);

  useEffect(() => {
    if (!active || !stream || typeof MediaRecorder === 'undefined') return;
    chunks.current = [];
    let rec: MediaRecorder;
    try { rec = new MediaRecorder(stream); } catch { return; }
    const mime = rec.mimeType || 'audio/webm';
    rec.ondataavailable = async (e) => {
      if (e.data.size) chunks.current.push(e.data);
      if (busy.current || rec.state !== 'recording') return;
      busy.current = true;
      try {
        const audio = await blobToBase64(new Blob(chunks.current, { type: mime }));
        const { data, error } = await supabase.functions.invoke('tajweed-asr-analyze', {
          body: { audio, mimeType: mime.split(';')[0], surahNumber, verseNumber },
        });
        if (error || !data?.transcription) { if (error) setUnavailable(true); return; }
        const heard = String(data.transcription).split(/\s+/).filter(Boolean);
        setStates(alignLive(verseText.split(/\s+/).filter(Boolean), heard));
      } catch { setUnavailable(true); }
      finally { busy.current = false; }
    };
    rec.start(SEGMENT_MS);
    return () => { try { rec.stop(); } catch { /* ignore */ } };
  }, [active, stream, verseText, surahNumber, verseNumber]);

  return { words, states, unavailable };
};
