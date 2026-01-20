import { useEffect, useMemo, useRef, useState } from 'react';

export type AudioWaveformState = {
  level: number; // RMS 0..1
  peak: number; // Peak 0..1 (decaying)
  waveform: number[]; // normalized [-1..1]
};

export const useAudioWaveform = (stream: MediaStream | null, opts?: { fftSize?: number }) => {
  const fftSize = opts?.fftSize ?? 1024;

  const [state, setState] = useState<AudioWaveformState>({
    level: 0,
    peak: 0,
    waveform: [],
  });

  const rafRef = useRef<number | null>(null);
  const peakRef = useRef(0);

  const isSupported = useMemo(() => {
    return typeof window !== 'undefined' && (!!(window.AudioContext || (window as any).webkitAudioContext));
  }, []);

  useEffect(() => {
    if (!stream || !isSupported) {
      setState({ level: 0, peak: 0, waveform: [] });
      return;
    }

    const AudioContextCtor = window.AudioContext || (window as any).webkitAudioContext;
    const ctx: AudioContext = new AudioContextCtor();
    const analyser = ctx.createAnalyser();
    analyser.fftSize = fftSize;
    analyser.smoothingTimeConstant = 0.85;

    const source = ctx.createMediaStreamSource(stream);
    source.connect(analyser);

    const timeDomain = new Uint8Array(analyser.fftSize);

    const tick = () => {
      analyser.getByteTimeDomainData(timeDomain);

      // Convert to [-1..1]
      let sum = 0;
      let peak = 0;
      const wf: number[] = new Array(timeDomain.length);
      for (let i = 0; i < timeDomain.length; i++) {
        const v = (timeDomain[i] - 128) / 128;
        wf[i] = v;
        const av = Math.abs(v);
        peak = Math.max(peak, av);
        sum += v * v;
      }

      const rms = Math.sqrt(sum / timeDomain.length);

      // Decaying peak for nicer UI
      peakRef.current = Math.max(peak, peakRef.current * 0.92);

      setState({
        level: Math.min(1, rms * 1.8),
        peak: Math.min(1, peakRef.current),
        waveform: wf,
      });

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      try {
        source.disconnect();
        analyser.disconnect();
      } catch {
        // ignore
      }
      ctx.close().catch(() => null);
    };
  }, [stream, fftSize, isSupported]);

  return { ...state, isSupported };
};
