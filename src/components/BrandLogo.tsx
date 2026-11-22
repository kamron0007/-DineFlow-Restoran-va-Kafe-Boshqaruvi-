import React from 'react';
import { useApp } from '../context/AppContext';

interface BrandLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg';
  showText?: boolean;
  compact?: boolean;
  className?: string;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = 'md',
  showText = true,
  compact = false,
  className = '',
}) => {
  const { restaurantName, restaurantBranch, restaurantTagline } = useApp();

  const iconSizes = {
    xs: 'w-7 h-7 rounded-lg',
    sm: 'w-8 h-8 rounded-xl',
    md: 'w-10 h-10 rounded-2xl',
    lg: 'w-14 h-14 rounded-3xl',
  };

  const svgSizes = {
    xs: 'w-4 h-4',
    sm: 'w-4.5 h-4.5',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  const textSizes = {
    xs: 'text-sm',
    sm: 'text-sm sm:text-base',
    md: 'text-lg sm:text-xl',
    lg: 'text-2xl',
  };

  const subSizes = {
    xs: 'text-[9px]',
    sm: 'text-[10px]',
    md: 'text-[11px]',
    lg: 'text-xs',
  };

  return (
    <div className={`flex items-center gap-2.5 sm:gap-3 min-w-0 ${className}`}>
      {/* Zamonaviy Premium Gastronomiya Logotipi / Belgisi */}
      <div
        className={`${iconSizes[size]} relative shrink-0 bg-gradient-to-br from-[#0D2A22] via-[#173F35] to-[#061813] text-white flex items-center justify-center shadow-[0_4px_16px_rgba(23,63,53,0.22)] border border-amber-400/40 ring-1 ring-amber-400/20 group-hover:scale-105 transition-transform overflow-hidden`}
      >
        {/* Yuqori nozik olmos yulduz aksenti */}
        <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-amber-300 ring-2 ring-amber-400/30 animate-pulse" />

        {/* Zamonaviy Shohona Gastronomiya Kloshi va Toji SVG */}
        <svg
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={`${svgSizes[size]} drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)]`}
        >
          <defs>
            <linearGradient id="modernGold" x1="4" y1="4" x2="28" y2="28" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#FFFBEB" />
              <stop offset="35%" stopColor="#FBBF24" />
              <stop offset="70%" stopColor="#F59E0B" />
              <stop offset="100%" stopColor="#D97706" />
            </linearGradient>
            <linearGradient id="goldGlow" x1="16" y1="6" x2="16" y2="22" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#FDE68A" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#B45309" stopOpacity="0.05" />
            </linearGradient>
          </defs>

          {/* Yuqori shohona toj cho'qqisi */}
          <circle cx="16" cy="6" r="1.8" fill="url(#modernGold)" />
          <path d="M16 7.8V10" stroke="url(#modernGold)" strokeWidth="1.8" strokeLinecap="round" />

          {/* Klosh gumbazi (Modern silliq egri chiziq) */}
          <path
            d="M7 21C7 14.5 10.8 10 16 10C21.2 10 25 14.5 25 21H7Z"
            fill="url(#goldGlow)"
            stroke="url(#modernGold)"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />

          {/* Saffron / Za'faron nafis gulbarglari naqshi */}
          <path
            d="M13 21C13 17 14.5 14.5 16 13C17.5 14.5 19 17 19 21"
            stroke="url(#modernGold)"
            strokeWidth="1.3"
            strokeLinecap="round"
            strokeOpacity="0.75"
          />

          {/* Klosh tayanchi / Likopcha tekis chizig'i */}
          <path
            d="M4 23.5H28"
            stroke="url(#modernGold)"
            strokeWidth="2"
            strokeLinecap="round"
          />

          {/* Pastki shohona poydevor */}
          <path
            d="M10 24.5L12 26.5H20L22 24.5"
            stroke="url(#modernGold)"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {/* Restoran Nomi va Tavsifi */}
      {showText && (
        <div className="flex flex-col min-w-0">
          <span
            className={`font-display font-extrabold ${textSizes[size]} text-[#173F35] tracking-tight leading-none truncate`}
          >
            {restaurantName || 'Zafaran Grand'}
          </span>
          {!compact && (
            <span
              className={`${subSizes[size]} font-semibold text-[#737A75] mt-1 tracking-wider uppercase truncate max-w-[170px] sm:max-w-none`}
            >
              {restaurantBranch || restaurantTagline || 'Toshkent Markaziy filiali'}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
