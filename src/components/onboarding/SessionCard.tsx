import React from 'react';
import { Card } from '@/components/ui/card';
import { Star8Point } from '@/components/decorative/GeometricPattern';

interface SessionCardProps {
  type: 'homme' | 'femme';
  isSelected: boolean;
  onClick: () => void;
}

export const SessionCard: React.FC<SessionCardProps> = ({ type, isSelected, onClick }) => {
  const isHomme = type === 'homme';
  
  return (
    <Card 
      variant="session"
      onClick={onClick}
      className={`
        relative p-8 md:p-12 cursor-pointer transition-all duration-500 group
        ${isSelected ? 'border-primary shadow-glow scale-[1.02]' : ''}
        hover:scale-[1.02]
      `}
    >
      {/* Decorative corner */}
      <div className="absolute top-4 right-4 text-primary/30 group-hover:text-primary/60 transition-colors">
        <Star8Point size={20} />
      </div>
      
      {/* Icon */}
      <div className={`
        w-20 h-20 md:w-24 md:h-24 mx-auto mb-6 rounded-full 
        flex items-center justify-center
        bg-gradient-to-br from-primary/10 to-primary/5
        border-2 border-primary/20 group-hover:border-primary/40
        transition-all duration-300
        ${isSelected ? 'border-primary/60 bg-primary/15' : ''}
      `}>
        {isHomme ? (
          <svg className="w-10 h-10 md:w-12 md:h-12 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="12" cy="7" r="4" />
            <path d="M5.5 21v-2a6.5 6.5 0 0 1 13 0v2" />
          </svg>
        ) : (
          <svg className="w-10 h-10 md:w-12 md:h-12 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="12" cy="7" r="4" />
            <path d="M5.5 21v-2a6.5 6.5 0 0 1 13 0v2" />
            <path d="M12 11v4M10 13h4" strokeOpacity="0" />
          </svg>
        )}
      </div>
      
      {/* Text */}
      <h3 className="text-2xl md:text-3xl font-semibold text-center text-foreground mb-2">
        {isHomme ? 'Session Homme' : 'Session Femme'}
      </h3>
      <p className="text-muted-foreground text-center text-sm md:text-base">
        {isHomme 
          ? 'Accéder à l\'espace d\'apprentissage masculin' 
          : 'Accéder à l\'espace d\'apprentissage féminin'
        }
      </p>
      
      {/* Selection indicator */}
      {isSelected && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
        </div>
      )}
    </Card>
  );
};
