/**
 * Convert an audio Blob to WAV format (PCM 16-bit, mono, 16kHz) for Whisper compatibility.
 * Falls back to the original blob if conversion fails.
 */

const TARGET_SAMPLE_RATE = 16000;

export const convertToWav = async (blob: Blob): Promise<{ blob: Blob; mimeType: string }> => {
  try {
    // Use OfflineAudioContext to decode and resample
    const arrayBuffer = await blob.arrayBuffer();

    const AudioContextCtor = window.AudioContext || (window as any).webkitAudioContext;
    const tempCtx = new AudioContextCtor();

    let audioBuffer: AudioBuffer;
    try {
      audioBuffer = await tempCtx.decodeAudioData(arrayBuffer);
    } finally {
      await tempCtx.close().catch(() => null);
    }

    // Resample to 16kHz mono
    const offlineCtx = new OfflineAudioContext(
      1,
      Math.ceil(audioBuffer.duration * TARGET_SAMPLE_RATE),
      TARGET_SAMPLE_RATE,
    );

    const source = offlineCtx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(offlineCtx.destination);
    source.start(0);

    const rendered = await offlineCtx.startRendering();
    const samples = rendered.getChannelData(0);

    const wavBlob = encodeWav(samples, TARGET_SAMPLE_RATE);
    console.log('[AudioConverter] Converted to WAV:', wavBlob.size, 'bytes');
    return { blob: wavBlob, mimeType: 'audio/wav' };
  } catch (err) {
    console.warn('[AudioConverter] WAV conversion failed, falling back to original blob:', err);
    // Return original
    return { blob, mimeType: blob.type || 'audio/webm' };
  }
};

/**
 * Encode Float32 PCM samples to a WAV blob (16-bit PCM).
 */
function encodeWav(samples: Float32Array, sampleRate: number): Blob {
  const numChannels = 1;
  const bytesPerSample = 2; // 16-bit
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataLength = samples.length * bytesPerSample;
  const bufferLength = 44 + dataLength;

  const buffer = new ArrayBuffer(bufferLength);
  const view = new DataView(buffer);

  // RIFF header
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataLength, true);
  writeString(view, 8, 'WAVE');

  // fmt chunk
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // chunk size
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true); // bits per sample

  // data chunk
  writeString(view, 36, 'data');
  view.setUint32(40, dataLength, true);

  // PCM samples
  floatTo16BitPCM(view, 44, samples);

  return new Blob([buffer], { type: 'audio/wav' });
}

function writeString(view: DataView, offset: number, str: string) {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}

function floatTo16BitPCM(view: DataView, offset: number, input: Float32Array) {
  for (let i = 0; i < input.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, input[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
}
