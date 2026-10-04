import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { stripDiacritics, charSimilarity } from '../../supabase/functions/_shared/recitation-metrics';

export type LiveWordState = 'pending' | 'active' | 'correct' | 'doubt' | 'wrong';

const SEGMENT_MS = 1200; // envoi serveur ~toutes les 1,2 s
const VOICED_SEC_PER_LETTER = 0.11; // tempo moyen pour le curseur local

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
  const confirmed = useRef(0); // nb de mots confirmés par le serveur
  const [cursor, setCursor] = useState(-1);
  const [latencyMs, setLatencyMs] = useState<number | null>(null);

  useEffect(() => {
    setStates(verseText.split(/\s+/).filter(Boolean).map(() => 'pending'));
    confirmed.current = 0; setCursor(-1);
  }, [verseText, active]);

  // Réveille le moteur spécialisé dès le début (évite le démarrage à froid).
  useEffect(() => {
    if (!active) return;
    supabase.functions.invoke('tajweed-asr-analyze', { body: { warmup: true } }).catch(() => {});
  }, [active]);

  // Curseur local instantané : temps de voix détecté → position estimée dans le verset.
  useEffect(() => {
    if (!active || !stream) return;
    const ws = verseText.split(/\s+/).filter(Boolean);
    const lens = ws.map((w) => stripDiacritics(w).length || 1);
    let ctx: AudioContext;
    try { ctx = new AudioContext(); } catch { return; }
    const an = ctx.createAnalyser(); an.fftSize = 512;
    ctx.createMediaStreamSource(stream).connect(an);
    const buf = new Float32Array(an.fftSize);
    let voiced = 0, last = performance.now(), noise = 0.01, raf = 0;
    const tick = () => {
      const now = performance.now(); const dt = (now - last) / 1000; last = now;
      an.getFloatTimeDomainData(buf);
      let e = 0; for (const v of buf) e += v * v; e = Math.sqrt(e / buf.length);
      noise = Math.min(noise * 0.995 + e * 0.005, 0.05);
      if (e > noise * 3 && e > 0.01) voiced += dt;
      let acc = 0, idx = -1;
      for (let i = 0; i < lens.length; i++) { acc += lens[i] * VOICED_SEC_PER_LETTER; if (voiced < acc) { idx = i; break; } }
      if (idx < 0) idx = lens.length - 1;
      setCursor((c) => (idx !== c ? Math.max(idx, confirmed.current) : c));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(raf); ctx.close().catch(() => {}); };
  }, [active, stream, verseText]);

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
      const t0 = performance.now();
      try {
        const audio = await blobToBase64(new Blob(chunks.current, { type: mime }));
        const { data, error } = await supabase.functions.invoke('tajweed-asr-analyze', {
          body: { audio, mimeType: mime.split(';')[0], surahNumber, verseNumber, live: true },
        });
        setLatencyMs(Math.round(performance.now() - t0));
        if (error || !data?.transcription) { if (error) setUnavailable(true); return; }
        const heard = String(data.transcription).split(/\s+/).filter(Boolean);
        const next = alignLive(verseText.split(/\s+/).filter(Boolean), heard);
        confirmed.current = next.reduce((n, st, i) => (st !== 'pending' ? i + 1 : n), 0);
        setStates(next);
      } catch { setUnavailable(true); }
      finally { busy.current = false; }
    };
    rec.start(SEGMENT_MS);
    return () => { try { rec.stop(); } catch { /* ignore */ } };
  }, [active, stream, verseText, surahNumber, verseNumber]);

  const display: LiveWordState[] = states.map((st, i) =>
    st === 'pending' && active && i === cursor ? 'active' : st);

  return { words, states: display, unavailable, latencyMs };
};
