import React, { useState, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play, Pause, Volume2 } from 'lucide-react';

interface ReciterInfo {
  id: string;
  name: string;
  nameArabic: string;
  style: string;
  audioBaseUrl: string;
}

const RECITERS: ReciterInfo[] = [
  {
    id: 'mishary',
    name: 'Mishary Rashid Al-Afasy',
    nameArabic: 'مشاري راشد العفاسي',
    style: 'Précision cristalline des makhārij',
    audioBaseUrl: 'https://cdn.islamic.network/quran/audio/128/ar.alafasy',
  },
  {
    id: 'minshawi',
    name: 'Mohamed Siddiq El-Minshawi',
    nameArabic: 'محمد صديق المنشاوي',
    style: 'Rigueur académique impeccable',
    audioBaseUrl: 'https://cdn.islamic.network/quran/audio/128/ar.minshawi',
  },
  {
    id: 'husary',
    name: 'Mahmoud Khalil Al-Husary',
    nameArabic: 'محمود خليل الحصري',
    style: 'Maître du tajwīd murattal',
    audioBaseUrl: 'https://cdn.islamic.network/quran/audio/128/ar.husary',
  },
];

interface ReferenceRecitationsProps {
  surahNumber: number;
  verseNumber: number;
}

export const ReferenceRecitations: React.FC<ReferenceRecitationsProps> = ({
  surahNumber,
  verseNumber,
}) => {
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Calculate ayah number (cumulative across all surahs)
  // This is a simplified calculation - in production, you'd use a lookup table
  const getAyahNumber = (surah: number, verse: number): number => {
    // Simplified: for demo, we'll use a basic approach
    // Real implementation would need cumulative verse counts
    const verseCounts = [0, 7, 293, 493, 669, 789, 954, 1160, 1235, 1364, 1473, 1596, 1707, 1750, 1802, 1901, 2029, 2140, 2250, 2348, 2483]; // First 20 surahs
    
    if (surah <= verseCounts.length - 1) {
      return verseCounts[surah - 1] + verse;
    }
    // Fallback for demo
    return (surah - 1) * 10 + verse;
  };

  const handlePlay = async (reciter: ReciterInfo) => {
    try {
      if (playingId === reciter.id) {
        // Stop current playback
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current = null;
        }
        setPlayingId(null);
        return;
      }

      // Stop any existing playback
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }

      setLoadingId(reciter.id);
      
      const ayahNumber = getAyahNumber(surahNumber, verseNumber);
      const audioUrl = `${reciter.audioBaseUrl}/${ayahNumber}.mp3`;
      
      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.oncanplaythrough = () => {
        setLoadingId(null);
        setPlayingId(reciter.id);
        audio.play();
      };

      audio.onended = () => {
        setPlayingId(null);
        audioRef.current = null;
      };

      audio.onerror = () => {
        setLoadingId(null);
        console.error('Error loading audio');
      };

      audio.load();
    } catch (error) {
      console.error('Error playing recitation:', error);
      setLoadingId(null);
    }
  };

  return (
    <Card variant="outline" className="mt-6">
      <CardContent className="py-4">
        <div className="flex items-center gap-2 mb-4">
          <Volume2 className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-foreground">Récitations de référence</h3>
        </div>
        
        <div className="space-y-3">
          {RECITERS.map((reciter) => (
            <div 
              key={reciter.id}
              className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
            >
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground text-sm truncate">
                  {reciter.name}
                </p>
                <p className="text-xs text-muted-foreground truncate" dir="rtl">
                  {reciter.nameArabic}
                </p>
                <p className="text-xs text-primary/70 mt-0.5">{reciter.style}</p>
              </div>
              
              <Button
                variant="ghost"
                size="icon"
                className="flex-shrink-0 ml-2"
                onClick={() => handlePlay(reciter)}
                disabled={loadingId === reciter.id}
              >
                {loadingId === reciter.id ? (
                  <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                ) : playingId === reciter.id ? (
                  <Pause className="w-4 h-4" />
                ) : (
                  <Play className="w-4 h-4" />
                )}
              </Button>
            </div>
          ))}
        </div>
        
        <p className="text-xs text-muted-foreground mt-3 text-center">
          Écoute et compare avec les maîtres du tajwīd
        </p>
      </CardContent>
    </Card>
  );
};
