import React, { useMemo } from 'react';

type AudioWaveformProps = {
  isRecording: boolean;
  level: number;
  peak: number;
  waveform: number[];
};

export const AudioWaveform: React.FC<AudioWaveformProps> = ({
  isRecording,
  level,
  peak,
  waveform,
}) => {
  const bars = useMemo(() => {
    if (!isRecording || waveform.length === 0) return [];

    // Sample to 18 bars
    const BAR_COUNT = 18;
    const step = Math.floor(waveform.length / BAR_COUNT);
    const out: number[] = [];

    for (let i = 0; i < BAR_COUNT; i++) {
      const start = i * step;
      const end = Math.min(waveform.length, start + step);
      let max = 0;
      for (let j = start; j < end; j++) max = Math.max(max, Math.abs(waveform[j]));
      out.push(max);
    }

    return out;
  }, [isRecording, waveform]);

  const ringScale = isRecording ? 1 + Math.min(0.22, level * 0.22) : 1;
  const ringOpacity = isRecording ? 0.15 + Math.min(0.25, peak * 0.25) : 0;

  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
      {/* Outer reactive ring */}
      <div
        className="absolute rounded-full border border-primary/30"
        style={{
          width: '120px',
          height: '120px',
          transform: `scale(${ringScale})`,
          opacity: ringOpacity,
          transition: 'transform 80ms linear, opacity 120ms linear',
        }}
      />

      {/* Bars */}
      {isRecording && bars.length > 0 && (
        <div className="absolute -bottom-8 flex items-end justify-center gap-0.5">
          {bars.map((v, idx) => (
            <div
              key={idx}
              className="w-1 rounded-sm bg-primary/60"
              style={{
                height: `${Math.max(2, Math.round(v * 26))}px`,
                transition: 'height 80ms linear',
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};
