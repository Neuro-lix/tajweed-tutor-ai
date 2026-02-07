/**
 * Convert an audio Blob to WAV format (PCM 16-bit, mono, 16kHz) for Whisper compatibility.
 * Falls back to the original blob if conversion fails.
 */

const TARGET_SAMPLE_RATE = 16000;

export const convertToWav = async (blob: Blob): Promise<{ blob: Blob; mimeType: string }> => {
  console.log('[AudioConverter] Starting conversion, input blob size:', blob.size, 'type:', blob.type);
  
  // Skip conversion if blob is too small (likely no audio content)
  if (blob.size < 1000) {
    console.warn('[AudioConverter] Blob too small, likely no audio content:', blob.size, 'bytes');
    return { blob, mimeType: blob.type || 'audio/webm' };
  }
  
  try {
    // Use OfflineAudioContext to decode and resample
    const arrayBuffer = await blob.arrayBuffer();
    console.log('[AudioConverter] ArrayBuffer size:', arrayBuffer.byteLength);

    const AudioContextCtor = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextCtor) {
      console.warn('[AudioConverter] AudioContext not available, returning original blob');
      return { blob, mimeType: blob.type || 'audio/webm' };
    }
    
    const tempCtx = new AudioContextCtor();

    let audioBuffer: AudioBuffer;
    try {
      audioBuffer = await tempCtx.decodeAudioData(arrayBuffer.slice(0));
      console.log('[AudioConverter] Decoded audio buffer:', {
        duration: audioBuffer.duration,
        sampleRate: audioBuffer.sampleRate,
        channels: audioBuffer.numberOfChannels,
        length: audioBuffer.length
      });
    } catch (decodeError) {
      console.error('[AudioConverter] Failed to decode audio data:', decodeError);
      await tempCtx.close().catch(() => null);
      // Return original blob as fallback
      return { blob, mimeType: blob.type || 'audio/webm' };
    } finally {
      await tempCtx.close().catch(() => null);
    }
    
    // Check if audio has any content
    if (audioBuffer.duration < 0.1) {
      console.warn('[AudioConverter] Audio duration too short:', audioBuffer.duration, 's');
      return { blob, mimeType: blob.type || 'audio/webm' };
    }

    // Resample to 16kHz mono
    const outputLength = Math.ceil(audioBuffer.duration * TARGET_SAMPLE_RATE);
    console.log('[AudioConverter] Creating OfflineAudioContext with length:', outputLength);
    
    const offlineCtx = new OfflineAudioContext(
      1, // mono
      outputLength,
      TARGET_SAMPLE_RATE,
    );

    const source = offlineCtx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(offlineCtx.destination);
    source.start(0);

    const rendered = await offlineCtx.startRendering();
    const samples = rendered.getChannelData(0);
    
    // Validate samples
    const maxSample = samples.reduce((max, s) => Math.max(max, Math.abs(s)), 0);
    console.log('[AudioConverter] Rendered samples:', {
      length: samples.length,
      maxAmplitude: maxSample.toFixed(4),
      hasSilence: maxSample < 0.001
    });
    
    if (maxSample < 0.001) {
      console.warn('[AudioConverter] Audio appears to be silent, returning original blob');
      return { blob, mimeType: blob.type || 'audio/webm' };
    }

    const wavBlob = encodeWav(samples, TARGET_SAMPLE_RATE);
    console.log('[AudioConverter] Converted to WAV:', wavBlob.size, 'bytes');
    return { blob: wavBlob, mimeType: 'audio/wav' };
  } catch (err) {
    console.error('[AudioConverter] WAV conversion failed, falling back to original blob:', err);
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
