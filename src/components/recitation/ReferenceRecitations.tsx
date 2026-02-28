import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  RotateCcw, 
  Loader2,
  SkipBack,
  Repeat,
  Download,
  CheckCircle2,
} from 'lucide-react';
import { useOfflineMode } from '@/hooks/useOfflineMode';

interface ReciterInfo {
  id: string;
  name: string;
  nameArabic: string;
  style: string;
  audioBaseUrl: string;
  color: string;
}

const RECITERS: ReciterInfo[] = [
  {
    id: 'mishary',
    name: 'Mishary Rashid Al-Afasy',
    nameArabic: 'مشاري راشد العفاسي',
    style: 'Précision cristalline des makhārij',
    audioBaseUrl: 'https://everyayah.com/data/Alafasy_128kbps',
    color: 'bg-emerald-500',
  },


  {
    id: 'minshawi',
    name: 'Mohamed Siddiq El-Minshawi',
    nameArabic: 'محمد صديق المنشاوي',
    style: 'Rigueur académique impeccable',
    audioBaseUrl: 'https://everyayah.com/data/Minshawy_Murattal_128kbps',
    color: 'bg-amber-500',
  },
  {
    id: 'husary',
    name: 'Mahmoud Khalil Al-Husary',
    nameArabic: 'محمود خليل الحصري',
    style: 'Maître du tajwīd murattal',
    audioBaseUrl: 'https://everyayah.com/data/Husary_128kbps',
    color: 'bg-blue-500',
  },
  {
    id: 'husary_mujawwad',
    name: 'Al-Husary (Mujawwad)',
    nameArabic: 'الحصري مجود',
    style: 'Style mujawwad mélodique',
    audioBaseUrl: 'https://everyayah.com/data/Husary_Mujawwad_128kbps',
    color: 'bg-cyan-500',
  },
  {
    id: 'abdulbasit',
    name: 'Abdul Basit Abdul Samad',
    nameArabic: 'عبدالباسط عبدالصمد',
    style: 'Légende mondiale du tajwīd',
    audioBaseUrl: 'https://everyayah.com/data/Abdul_Basit_Murattal_192kbps',
    color: 'bg-orange-500',
  },
  {
    id: 'ghamdi',
    name: 'Saad Al-Ghamdi',
    nameArabic: 'سعد الغامدي',
    style: 'Voix douce et apaisante',
    audioBaseUrl: 'https://everyayah.com/data/Saad_Al-Ghamdi_128kbps',
    color: 'bg-teal-500',
  },
];

// Cumulative verse counts for each surah (1-114)
const CUMULATIVE_VERSES = [
  0, 7, 293, 493, 669, 789, 954, 1160, 1235, 1364, 1473, 1596, 1707, 1750, 1802, 
  1901, 2029, 2140, 2250, 2348, 2483, 2593, 2673, 2791, 2855, 2932, 3159, 3252, 
  3340, 3409, 3469, 3503, 3533, 3606, 3660, 3705, 3788, 3970, 4058, 4133, 4218, 
  4272, 4325, 4414, 4473, 4510, 4545, 4583, 4612, 4630, 4675, 4735, 4784, 4846, 
  4901, 4979, 5075, 5104, 5126, 5150, 5163, 5177, 5188, 5199, 5217, 5229, 5241, 
  5271, 5323, 5375, 5419, 5447, 5496, 5551, 5591, 5622, 5672, 5712, 5758, 5800, 
  5829, 5848, 5884, 5909, 5931, 5948, 5967, 5993, 6023, 6043, 6058, 6079, 6090, 
  6098, 6106, 6125, 6130, 6138, 6146, 6157, 6168, 6176, 6179, 6188, 6193, 6197, 
  6204, 6207, 6213, 6216, 6221, 6225, 6230, 6236
];

interface ReferenceRecitationsProps {
  surahNumber: number;
  verseNumber: number;
}

export const ReferenceRecitations: React.FC<ReferenceRecitationsProps> = ({
  surahNumber,
  verseNumber,
}) => {
  const [selectedReciter, setSelectedReciter] = useState<ReciterInfo>(RECITERS[0]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(80);
  const [isMuted, setIsMuted] = useState(false);
  const [isLooping, setIsLooping] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [isCached, setIsCached] = useState(false);
  const [isCaching, setIsCaching] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { cacheAudio, getCachedAudio, isOnline } = useOfflineMode();

  // Get ayah number (cumulative)
  const getAyahNumber = (surah: number, verse: number): number => {
    if (surah <= 1) return verse;
    if (surah > CUMULATIVE_VERSES.length) return verse;
    return CUMULATIVE_VERSES[surah - 1] + verse;
  };

  // Fallback URLs for reciters
  const FALLBACK_URLS: Record<string, string> = {
      };

  // Build audio URL
  const getAudioUrl = (reciter: ReciterInfo): string => {
    const ayahNumber = getAyahNumber(surahNumber, verseNumber);
    // everyayah.com format: SSSAAA.mp3 (e.g. 001001.mp3)
    const surahPad = String(surahNumber).padStart(3, '0');
    const versePad = String(verseNumber).padStart(3, '0');
    return `${reciter.audioBaseUrl}/${surahPad}${versePad}.mp3`;
  };
  
  const getFallbackUrl = (reciter: ReciterInfo): string | null => {
    const fallback = FALLBACK_URLS[reciter.id];
    if (!fallback) return null;
    const surahPad2 = String(surahNumber).padStart(3, '0');
    const versePad2 = String(verseNumber).padStart(3, '0');
    return `${fallback}/${surahPad2}${versePad2}.mp3`;
  };

  // Cleanup audio on unmount or verse change
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [surahNumber, verseNumber]);

  // Reset when verse changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setError(null);
    setIsCached(false);
    // Check if audio is already cached
    (async () => {
      const cached = await getCachedAudio(surahNumber, verseNumber, selectedReciter.id);
      setIsCached(Boolean(cached));
    })();
  }, [surahNumber, verseNumber, selectedReciter.id, getCachedAudio]);

  // Check cache when reciter changes
  useEffect(() => {
    (async () => {
      const cached = await getCachedAudio(surahNumber, verseNumber, selectedReciter.id);
      setIsCached(Boolean(cached));
    })();
  }, [selectedReciter.id, surahNumber, verseNumber, getCachedAudio]);

  // Handle play/pause with on-demand caching
  const togglePlay = async () => {
    try {
      setError(null);
      
      if (isPlaying && audioRef.current) {
        audioRef.current.pause();
        setIsPlaying(false);
        return;
      }

      const audioUrl = getAudioUrl(selectedReciter);

      // Create new audio if needed
      if (!audioRef.current || audioRef.current.src !== audioUrl) {
        if (audioRef.current) {
          audioRef.current.pause();
        }
        
        setIsLoading(true);

        // Check cache first
        let audioSrc = audioUrl;
        const cachedBlob = await getCachedAudio(surahNumber, verseNumber, selectedReciter.id);
        if (cachedBlob) {
          audioSrc = URL.createObjectURL(cachedBlob);
          setIsCached(true);
        }

        const audio = new Audio(audioSrc);
        audio.volume = isMuted ? 0 : volume / 100;
        audio.playbackRate = playbackSpeed;
        audio.loop = isLooping;
        
        audio.onloadedmetadata = () => {
          setDuration(audio.duration);
          setIsLoading(false);

          // Cache audio if played from network
          if (!cachedBlob && isOnline) {
            (async () => {
              try {
                const res = await fetch(audioUrl);
                if (res.ok) {
                  const blob = await res.blob();
                  await cacheAudio(surahNumber, verseNumber, selectedReciter.id, blob);
                  setIsCached(true);
                }
              } catch (e) {
                console.warn('[ReferenceRecitations] Failed to cache audio', e);
              }
            })();
          }
        };
        
        audio.ontimeupdate = () => {
          setCurrentTime(audio.currentTime);
        };
        
        audio.onended = () => {
          if (!isLooping) {
            setIsPlaying(false);
            setCurrentTime(0);
          }
        };
        
        audio.onerror = () => {
          const fallbackUrl = getFallbackUrl(selectedReciter);
          if (fallbackUrl && audio.src !== fallbackUrl) {
            audio.src = fallbackUrl;
            audio.load();
            audio.play().catch(() => {
              setError('Audio non disponible pour ce verset');
              setIsLoading(false);
              setIsPlaying(false);
            });
          } else {
            setError('Audio non disponible pour ce verset');
            setIsLoading(false);
            setIsPlaying(false);
          }
        };
        
        audioRef.current = audio;
        
        await audio.play();
        setIsPlaying(true);
      } else {
        await audioRef.current.play();
        setIsPlaying(true);
      }
    } catch (err) {
      console.error('Error playing audio:', err);
      setError('Erreur de lecture audio');
      setIsLoading(false);
    }
  };

  // Manually cache audio for offline
  const handleCacheAudio = useCallback(async () => {
    if (!isOnline || isCaching || isCached) return;
    setIsCaching(true);
    try {
      const res = await fetch(getAudioUrl(selectedReciter));
      if (res.ok) {
        const blob = await res.blob();
        await cacheAudio(surahNumber, verseNumber, selectedReciter.id, blob);
        setIsCached(true);
      }
    } catch (e) {
      console.warn('[ReferenceRecitations] Manual cache failed', e);
    } finally {
      setIsCaching(false);
    }
  }, [isOnline, isCaching, isCached, selectedReciter, surahNumber, verseNumber, cacheAudio]);

  // Handle reciter change
  const handleReciterChange = (reciter: ReciterInfo) => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setSelectedReciter(reciter);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setError(null);
  };

  // Handle seek
  const handleSeek = (value: number[]) => {
    const newTime = value[0];
    setCurrentTime(newTime);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
    }
  };

  // Handle volume change
  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
    if (audioRef.current) {
      audioRef.current.volume = newVolume / 100;
    }
  };

  // Toggle mute
  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? volume / 100 : 0;
    }
  };

  // Toggle loop
  const toggleLoop = () => {
    setIsLooping(!isLooping);
    if (audioRef.current) {
      audioRef.current.loop = !isLooping;
    }
  };

  // Change playback speed
  const cycleSpeed = () => {
    const speeds = [0.5, 0.75, 1, 1.25, 1.5];
    const currentIndex = speeds.indexOf(playbackSpeed);
    const nextIndex = (currentIndex + 1) % speeds.length;
    const newSpeed = speeds[nextIndex];
    setPlaybackSpeed(newSpeed);
    if (audioRef.current) {
      audioRef.current.playbackRate = newSpeed;
    }
  };

  // Restart
  const restart = () => {
    setCurrentTime(0);
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
    }
  };

  // Format time
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Card className="mt-6">
      <CardContent className="py-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Volume2 className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-foreground">Récitations de référence</h3>
          </div>
          <Badge variant="outline" className="text-xs">
            Sourate {surahNumber} : Verset {verseNumber}
          </Badge>
        </div>

        {/* Reciter selection - scrollable grid */}
        <div className="max-h-48 overflow-y-auto">
          <div className="grid grid-cols-2 gap-2 pr-1">
            {RECITERS.map((reciter) => (
              <button
                key={reciter.id}
                onClick={() => handleReciterChange(reciter)}
                className={`
                  p-2 rounded-lg text-left transition-all
                  ${selectedReciter.id === reciter.id 
                    ? 'bg-primary/10 border-2 border-primary' 
                    : 'bg-muted/50 border-2 border-transparent hover:bg-muted'
                  }
                `}
              >
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${reciter.color}`} />
                  <span className="text-xs font-medium text-foreground truncate">
                    {reciter.name.split(' ').slice(-1)[0]}
                  </span>
                </div>
                <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
                  {reciter.style}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Selected reciter info */}
        <div className="text-center py-2 bg-muted/30 rounded-lg">
          <p className="font-arabic text-lg text-foreground" dir="rtl">
            {selectedReciter.nameArabic}
          </p>
          <p className="text-sm text-muted-foreground">{selectedReciter.name}</p>
        </div>

        {/* Player controls */}
        <div className="space-y-3">
          {/* Progress bar */}
          <div className="space-y-1">
            <Slider
              value={[currentTime]}
              max={duration || 100}
              step={0.1}
              onValueChange={handleSeek}
              disabled={!duration}
              className="cursor-pointer"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Main controls */}
          <div className="flex items-center justify-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={restart}
              disabled={isLoading}
              className="h-8 w-8"
            >
              <SkipBack className="h-4 w-4" />
            </Button>

            <Button
              variant="default"
              size="icon"
              onClick={togglePlay}
              disabled={isLoading}
              className="h-12 w-12 rounded-full"
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : isPlaying ? (
                <Pause className="h-5 w-5" />
              ) : (
                <Play className="h-5 w-5 ml-0.5" />
              )}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={toggleLoop}
              className={`h-8 w-8 ${isLooping ? 'text-primary' : ''}`}
            >
              <Repeat className="h-4 w-4" />
            </Button>
          </div>

          {/* Secondary controls */}
          <div className="flex items-center justify-between px-2">
            {/* Volume */}
            <div className="flex items-center gap-2 w-1/3">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleMute}
                className="h-7 w-7"
              >
                {isMuted ? (
                  <VolumeX className="h-4 w-4" />
                ) : (
                  <Volume2 className="h-4 w-4" />
                )}
              </Button>
              <Slider
                value={[isMuted ? 0 : volume]}
                max={100}
                step={1}
                onValueChange={handleVolumeChange}
                className="w-16"
              />
            </div>

            {/* Speed */}
            <Button
              variant="outline"
              size="sm"
              onClick={cycleSpeed}
              className="h-7 text-xs px-2"
            >
              {playbackSpeed}x
            </Button>

            {/* Cache for offline */}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleCacheAudio}
              disabled={isCached || isCaching || !isOnline}
              className={`h-7 w-7 ${isCached ? 'text-primary' : ''}`}
              title={isCached ? 'En cache' : 'Télécharger pour hors-ligne'}
            >
              {isCaching ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : isCached ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <Download className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Cached indicator */}
        {isCached && (
          <div className="flex items-center justify-center gap-1 text-xs text-primary">
            <CheckCircle2 className="h-3 w-3" />
            Audio en cache (disponible hors-ligne)
          </div>
        )}

        {/* Error message */}
        {error && (
          <p className="text-sm text-destructive text-center">{error}</p>
        )}

        {/* Tips */}
        <p className="text-xs text-muted-foreground text-center">
          💡 Écoute plusieurs fois, ajuste la vitesse, et compare ta récitation
        </p>
      </CardContent>
    </Card>
  );
};
