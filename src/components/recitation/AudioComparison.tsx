import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Repeat, 
  GitCompare,
  Volume2,
  Loader2
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface AudioComparisonProps {
  userAudioBlob: Blob | null;
  referenceAudioUrl: string;
  surahNumber: number;
  verseNumber: number;
}

type PlayMode = 'user' | 'reference' | 'ab';

export const AudioComparison: React.FC<AudioComparisonProps> = ({
  userAudioBlob,
  referenceAudioUrl,
  surahNumber,
  verseNumber,
}) => {
  const { t } = useLanguage();
  const [playMode, setPlayMode] = useState<PlayMode>('user');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLooping, setIsLooping] = useState(false);
  const [abProgress, setAbProgress] = useState<'A' | 'B'>('A');
  
  const userAudioRef = useRef<HTMLAudioElement | null>(null);
  const refAudioRef = useRef<HTMLAudioElement | null>(null);
  const userAudioUrl = useRef<string | null>(null);

  // Create user audio URL from blob
  useEffect(() => {
    if (userAudioBlob) {
      if (userAudioUrl.current) {
        URL.revokeObjectURL(userAudioUrl.current);
      }
      userAudioUrl.current = URL.createObjectURL(userAudioBlob);
    }
    return () => {
      if (userAudioUrl.current) {
        URL.revokeObjectURL(userAudioUrl.current);
      }
    };
  }, [userAudioBlob]);

  // Reset on verse change
  useEffect(() => {
    stopAll();
    setCurrentTime(0);
    setDuration(0);
  }, [surahNumber, verseNumber]);

  const stopAll = () => {
    if (userAudioRef.current) {
      userAudioRef.current.pause();
      userAudioRef.current.currentTime = 0;
    }
    if (refAudioRef.current) {
      refAudioRef.current.pause();
      refAudioRef.current.currentTime = 0;
    }
    setIsPlaying(false);
  };

  const playUser = async () => {
    if (!userAudioUrl.current) return;
    
    stopAll();
    setPlayMode('user');
    setIsLoading(true);

    const audio = new Audio(userAudioUrl.current);
    userAudioRef.current = audio;
    
    audio.onloadedmetadata = () => {
      setDuration(audio.duration);
      setIsLoading(false);
    };
    
    audio.ontimeupdate = () => setCurrentTime(audio.currentTime);
    
    audio.onended = () => {
      if (isLooping) {
        audio.currentTime = 0;
        audio.play();
      } else {
        setIsPlaying(false);
        setCurrentTime(0);
      }
    };

    audio.onerror = () => {
      setIsLoading(false);
      setIsPlaying(false);
    };

    await audio.play();
    setIsPlaying(true);
  };

  const playReference = async () => {
    stopAll();
    setPlayMode('reference');
    setIsLoading(true);

    const audio = new Audio(referenceAudioUrl);
    refAudioRef.current = audio;
    
    audio.onloadedmetadata = () => {
      setDuration(audio.duration);
      setIsLoading(false);
    };
    
    audio.ontimeupdate = () => setCurrentTime(audio.currentTime);
    
    audio.onended = () => {
      if (isLooping) {
        audio.currentTime = 0;
        audio.play();
      } else {
        setIsPlaying(false);
        setCurrentTime(0);
      }
    };

    audio.onerror = () => {
      setIsLoading(false);
      setIsPlaying(false);
    };

    await audio.play();
    setIsPlaying(true);
  };

  const playAB = async () => {
    if (!userAudioUrl.current) return;

    stopAll();
    setPlayMode('ab');
    setAbProgress('A');
    setIsLoading(true);

    // Play user first (A)
    const userAudio = new Audio(userAudioUrl.current);
    userAudioRef.current = userAudio;

    userAudio.onloadedmetadata = () => {
      setDuration(userAudio.duration);
      setIsLoading(false);
    };

    userAudio.ontimeupdate = () => setCurrentTime(userAudio.currentTime);

    userAudio.onended = async () => {
      // Switch to reference (B)
      setAbProgress('B');
      setCurrentTime(0);

      const refAudio = new Audio(referenceAudioUrl);
      refAudioRef.current = refAudio;

      refAudio.onloadedmetadata = () => setDuration(refAudio.duration);
      refAudio.ontimeupdate = () => setCurrentTime(refAudio.currentTime);

      refAudio.onended = () => {
        if (isLooping) {
          // Restart A/B cycle
          playAB();
        } else {
          setIsPlaying(false);
          setCurrentTime(0);
          setAbProgress('A');
        }
      };

      await refAudio.play();
    };

    await userAudio.play();
    setIsPlaying(true);
  };

  const togglePlayPause = () => {
    const currentAudio = playMode === 'user' || (playMode === 'ab' && abProgress === 'A')
      ? userAudioRef.current
      : refAudioRef.current;

    if (isPlaying && currentAudio) {
      currentAudio.pause();
      setIsPlaying(false);
    } else if (currentAudio) {
      currentAudio.play();
      setIsPlaying(true);
    }
  };

  const handleSeek = (value: number[]) => {
    const newTime = value[0];
    setCurrentTime(newTime);
    
    const currentAudio = playMode === 'user' || (playMode === 'ab' && abProgress === 'A')
      ? userAudioRef.current
      : refAudioRef.current;

    if (currentAudio) {
      currentAudio.currentTime = newTime;
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!userAudioBlob) {
    return null;
  }

  return (
    <Card className="mt-4">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <GitCompare className="w-5 h-5 text-primary" />
            {t.compareAB}
          </CardTitle>
          {playMode === 'ab' && isPlaying && (
            <Badge variant={abProgress === 'A' ? 'default' : 'secondary'}>
              {abProgress === 'A' ? t.yourRecitation : 'Référence'}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Mode buttons */}
        <div className="grid grid-cols-3 gap-2">
          <Button
            variant={playMode === 'user' ? 'default' : 'outline'}
            size="sm"
            onClick={playUser}
            disabled={isLoading}
            className="text-xs"
          >
            <Volume2 className="w-3 h-3 mr-1" />
            {t.yourRecitation}
          </Button>
          <Button
            variant={playMode === 'reference' ? 'default' : 'outline'}
            size="sm"
            onClick={playReference}
            disabled={isLoading}
            className="text-xs"
          >
            <Volume2 className="w-3 h-3 mr-1" />
            Référence
          </Button>
          <Button
            variant={playMode === 'ab' ? 'default' : 'outline'}
            size="sm"
            onClick={playAB}
            disabled={isLoading}
            className="text-xs"
          >
            <GitCompare className="w-3 h-3 mr-1" />
            A/B
          </Button>
        </div>

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

        {/* Controls */}
        <div className="flex items-center justify-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setCurrentTime(0);
              const audio = playMode === 'user' ? userAudioRef.current : refAudioRef.current;
              if (audio) audio.currentTime = 0;
            }}
            className="h-8 w-8"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>

          <Button
            variant="default"
            size="icon"
            onClick={togglePlayPause}
            disabled={isLoading || !duration}
            className="h-10 w-10 rounded-full"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : isPlaying ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4 ml-0.5" />
            )}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsLooping(!isLooping)}
            className={`h-8 w-8 ${isLooping ? 'text-primary' : ''}`}
          >
            <Repeat className="h-4 w-4" />
          </Button>
        </div>

        <p className="text-xs text-muted-foreground text-center">
          💡 Compare ta récitation avec celle du récitateur sélectionné
        </p>
      </CardContent>
    </Card>
  );
};
