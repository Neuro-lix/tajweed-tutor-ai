import React from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SURAHS } from '@/data/quranData';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

interface VerseNavigatorProps {
  currentSurah: number;
  currentVerse: number;
  onNavigate: (surah: number, verse: number) => void;
}

export const VerseNavigator: React.FC<VerseNavigatorProps> = ({
  currentSurah,
  currentVerse,
  onNavigate,
}) => {
  const surah = SURAHS.find(s => s.id === currentSurah);
  const totalVerses = surah?.verses || 7;

  const handlePrevVerse = () => {
    if (currentVerse > 1) {
      onNavigate(currentSurah, currentVerse - 1);
    } else if (currentSurah > 1) {
      const prevSurah = SURAHS.find(s => s.id === currentSurah - 1);
      onNavigate(currentSurah - 1, prevSurah?.verses || 1);
    }
  };

  const handleNextVerse = () => {
    if (currentVerse < totalVerses) {
      onNavigate(currentSurah, currentVerse + 1);
    } else if (currentSurah < 114) {
      onNavigate(currentSurah + 1, 1);
    }
  };

  const handlePrevSurah = () => {
    if (currentSurah > 1) {
      onNavigate(currentSurah - 1, 1);
    }
  };

  const handleNextSurah = () => {
    if (currentSurah < 114) {
      onNavigate(currentSurah + 1, 1);
    }
  };

  const handleSurahChange = (value: string) => {
    onNavigate(Number(value), 1);
  };

  const handleVerseChange = (value: string) => {
    onNavigate(currentSurah, Number(value));
  };

  return (
    <div className="space-y-4">
      {/* Surah and Verse Selectors */}
      <div className="flex flex-wrap gap-3 justify-center">
        <Select value={currentSurah.toString()} onValueChange={handleSurahChange}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Choisir une sourate" />
          </SelectTrigger>
          <SelectContent className="max-h-[300px]">
            {SURAHS.map((s) => (
              <SelectItem key={s.id} value={s.id.toString()}>
                <span className="flex items-center gap-2">
                  <span className="text-muted-foreground">{s.id}.</span>
                  <span className="font-arabic">{s.name}</span>
                  <span className="text-muted-foreground text-xs">({s.transliteration})</span>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={currentVerse.toString()} onValueChange={handleVerseChange}>
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="Verset" />
          </SelectTrigger>
          <SelectContent className="max-h-[300px]">
            {Array.from({ length: totalVerses }, (_, i) => i + 1).map((v) => (
              <SelectItem key={v} value={v.toString()}>
                Verset {v}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-center gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={handlePrevSurah}
          disabled={currentSurah === 1}
          title="Sourate précédente"
        >
          <ChevronsLeft className="h-4 w-4" />
        </Button>
        
        <Button
          variant="outline"
          size="icon"
          onClick={handlePrevVerse}
          disabled={currentSurah === 1 && currentVerse === 1}
          title="Verset précédent"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <div className="px-4 py-2 bg-muted rounded-lg min-w-[100px] text-center">
          <span className="font-medium">{currentSurah}:{currentVerse}</span>
        </div>

        <Button
          variant="outline"
          size="icon"
          onClick={handleNextVerse}
          disabled={currentSurah === 114 && currentVerse === totalVerses}
          title="Verset suivant"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>

        <Button
          variant="outline"
          size="icon"
          onClick={handleNextSurah}
          disabled={currentSurah === 114}
          title="Sourate suivante"
        >
          <ChevronsRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
