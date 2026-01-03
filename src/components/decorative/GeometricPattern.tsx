import React from 'react';

interface GeometricPatternProps {
  className?: string;
  opacity?: number;
}

export const GeometricPattern: React.FC<GeometricPatternProps> = ({ 
  className = "", 
  opacity = 0.03 
}) => {
  return (
    <svg 
      className={`absolute inset-0 w-full h-full pointer-events-none ${className}`}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <pattern id="geometric" x="0" y="0" width="80" height="80" patternUnits="userSpaceOnUse">
          <g fill="none" stroke="currentColor" strokeWidth="0.5" opacity={opacity}>
            {/* Central octagon */}
            <polygon points="40,10 60,20 70,40 60,60 40,70 20,60 10,40 20,20" />
            {/* Inner star */}
            <polygon points="40,20 50,30 60,40 50,50 40,60 30,50 20,40 30,30" />
            {/* Corner elements */}
            <path d="M0,0 L20,20 M80,0 L60,20 M0,80 L20,60 M80,80 L60,60" />
            {/* Connecting lines */}
            <line x1="0" y1="40" x2="10" y2="40" />
            <line x1="70" y1="40" x2="80" y2="40" />
            <line x1="40" y1="0" x2="40" y2="10" />
            <line x1="40" y1="70" x2="40" y2="80" />
          </g>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#geometric)" />
    </svg>
  );
};

export const Ornament: React.FC<{ className?: string }> = ({ className = "" }) => {
  return (
    <svg 
      viewBox="0 0 200 20" 
      className={`w-48 h-5 ${className}`}
      fill="currentColor"
    >
      <path 
        d="M100,2 L105,10 L100,18 L95,10 Z M80,10 L100,10 M100,10 L120,10 M60,10 Q80,2 100,10 Q120,18 140,10 M0,10 L60,10 M140,10 L200,10" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="1"
        opacity="0.4"
      />
      <circle cx="100" cy="10" r="3" opacity="0.6" />
      <circle cx="70" cy="10" r="2" opacity="0.3" />
      <circle cx="130" cy="10" r="2" opacity="0.3" />
    </svg>
  );
};

export const Star8Point: React.FC<{ className?: string; size?: number }> = ({ 
  className = "", 
  size = 24 
}) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      className={className}
      fill="currentColor"
    >
      <path d="M12,1 L14,9 L22,12 L14,15 L12,23 L10,15 L2,12 L10,9 Z" opacity="0.8" />
      <path d="M12,4 L13.5,10.5 L20,12 L13.5,13.5 L12,20 L10.5,13.5 L4,12 L10.5,10.5 Z" fill="none" stroke="currentColor" strokeWidth="0.5" />
    </svg>
  );
};
