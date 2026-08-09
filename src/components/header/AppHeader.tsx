import React from 'react';
import { Button } from '@/components/ui/button';
import { LanguageSelector } from '@/components/settings/LanguageSelector';
import { ThemeToggle } from '@/components/settings/ThemeToggle';
import { OfflineIndicator } from '@/components/offline/OfflineIndicator';
import { LogOut, MessageSquareHeart, Award, Music, ShoppingBag, GraduationCap, Zap, BrainCircuit } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import logoImage from '@/logo.png';
import { formatCredits } from '@/lib/credits';

interface AppHeaderProps {
  fullName?: string | null;
  isOnline: boolean;
  isOfflineReady: boolean;
  cacheStats: { verses: number; audio: number; size: number };
  formatCacheSize: (bytes: number) => string;
  correctionsCount: number;
  credits?: number | null;
  isLowCredits?: boolean;
  onFeedbackClick: () => void;
  onRecordingsClick: () => void;
  onCorrectionsClick: () => void;
  onRecitationClick: () => void;
  onBoutiqueClick?: () => void;
  onIjazaClick?: () => void;
  onSignOut: () => void;
  onLogoClick?: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  fullName, isOnline, isOfflineReady, cacheStats, formatCacheSize,
  correctionsCount, credits, isLowCredits, onFeedbackClick, onRecordingsClick, onCorrectionsClick,
  onRecitationClick, onBoutiqueClick, onIjazaClick, onSignOut, onLogoClick,
}) => {
  const { t } = useLanguage();
  const navigate = useNavigate();

  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src={logoImage}
              alt="Tajweed Tutor AI"
              onClick={onLogoClick}
              className={`h-10 w-10 object-contain rounded-xl ${onLogoClick ? 'cursor-pointer select-none' : ''}`}
            />
            <div className="flex flex-col">
              <span className="font-semibold text-lg text-foreground leading-tight">Tajweed Tutor AI</span>
              {fullName && <span className="text-xs text-muted-foreground">{fullName}</span>}
            </div>
            <OfflineIndicator isOnline={isOnline} isOfflineReady={isOfflineReady} cacheStats={cacheStats} formatCacheSize={formatCacheSize} />
          </div>
          <nav className="flex items-center gap-1 md:gap-2">
            {credits !== null && credits !== undefined && (
              <button
                type="button"
                onClick={() => navigate('/my-credits')}
                title="Voir mes crédits et mon historique"
                aria-label="Voir mes crédits et mon historique"
                className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold transition-opacity hover:opacity-80 ${
                  credits === 0
                    ? 'bg-destructive/15 text-destructive'
                    : isLowCredits
                      ? 'bg-amber-500/15 text-amber-600'
                      : 'bg-primary/15 text-primary'
                }`}
              >
                <Zap className="h-3.5 w-3.5" />
                <span>{formatCredits(credits)}</span>
              </button>
            )}
            <LanguageSelector />
            <ThemeToggle />
            <Button variant="ghost" size="sm" onClick={() => navigate('/hifz')} className="hidden sm:flex">
              <BrainCircuit className="h-4 w-4 md:mr-1" />
              <span className="hidden md:inline">Ḥifẓ</span>
            </Button>
            <Button variant="ghost" size="sm" onClick={onFeedbackClick} className="hidden sm:flex">
              <MessageSquareHeart className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={onIjazaClick} className="hidden sm:flex">
              <GraduationCap className="h-4 w-4 md:mr-1" />
              <span className="hidden md:inline">{t.ijaza}</span>
            </Button>
            <Button variant="ghost" size="sm" onClick={() => navigate('/shop')} className="hidden sm:flex">
              <ShoppingBag className="h-4 w-4 md:mr-1" />
              <span className="hidden md:inline">{t.boutiqueLabel}</span>
            </Button>
            <Button variant="ghost" size="sm" onClick={onRecordingsClick} className="hidden sm:flex">
              <Music className="h-4 w-4 md:mr-1" />
              <span className="hidden md:inline">{t.myRecitations}</span>
            </Button>
            <Button variant="ghost" size="sm" onClick={onCorrectionsClick}>
              <span className="hidden sm:inline">{t.corrections}</span>
              <span className="sm:hidden">📝</span>
              <span className="ml-1">({correctionsCount})</span>
            </Button>
            <Button variant="default" size="sm" onClick={onRecitationClick}>
              <span className="hidden sm:inline">{t.recitation}</span>
              <span className="sm:hidden">🎤</span>
            </Button>
            <Button variant="outline" size="sm" onClick={onSignOut}>
              <LogOut className="h-4 w-4" />
            </Button>
          </nav>
        </div>
      </div>
    </header>
  );
};
