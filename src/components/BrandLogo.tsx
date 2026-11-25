import React from 'react';
import { useApp } from '../context/AppContext';

interface BrandLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg';
  showText?: boolean;
  compact?: boolean;
  theme?: 'light' | 'dark';
  className?: string;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = 'md',
  showText = true,
  compact = false,
  theme = 'light',
  className = '',
}) => {
  const { restaurantName, restaurantBranch, restaurantTagline } = useApp();

  const iconSizes = {
    xs: 'w-7 h-7 rounded-lg',
    sm: 'w-9 h-9 rounded-xl',
    md: 'w-10 h-10 rounded-xl',
    lg: 'w-12 h-12 rounded-2xl',
  };

  const svgSizes = {
    xs: 'w-4 h-4',
    sm: 'w-5 h-5',
    md: 'w-6 h-6',
    lg: 'w-7 h-7',
  };

  const textSizes = {
    xs: 'text-sm',
    sm: 'text-[15px] sm:text-base',
    md: 'text-lg sm:text-xl',
    lg: 'text-2xl',
  };

  const subSizes = {
    xs: 'text-[10px]',
    sm: 'text-[10px]',
    md: 'text-[11px]',
    lg: 'text-xs',
  };

  const isDark = theme === 'dark';

  return (
    <div className={`flex items-center gap-2.5 sm:gap-3 min-w-0 ${className}`}>
      <div
        className={`${iconSizes[size]} relative shrink-0 flex items-center justify-center transition-transform duration-200 group-hover:scale-105 overflow-hidden ${
          isDark
            ? 'bg-[#1E5245] border border-amber-400/40 shadow-[0_4px_16px_rgba(0,0,0,0.28)]'
            : 'bg-gradient-to-br from-[#173F35] to-[#1E5245] border border-amber-400/35 shadow-[0_4px_14px_rgba(23,63,53,0.18)]'
        }`}
      >
        <svg
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={svgSizes[size]}
        >
          <defs>
            <linearGradient id="dineGoldGrad" x1="4" y1="4" x2="28" y2="28" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#FDE68A" />
              <stop offset="50%" stopColor="#F59E0B" />
              <stop offset="100%" stopColor="#D97706" />
            </linearGradient>
          </defs>

          {/* Refined culinary cloche crown */}
          <circle cx="16" cy="6.2" r="1.7" fill="url(#dineGoldGrad)" />
          <path d="M16 8V10.2" stroke="url(#dineGoldGrad)" strokeWidth="1.8" strokeLinecap="round" />
          <path
            d="M7 20.5C7 14.3 10.9 10.2 16 10.2C21.1 10.2 25 14.3 25 20.5H7Z"
            fill="#F59E0B"
            fillOpacity="0.16"
            stroke="url(#dineGoldGrad)"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          <path
            d="M12.8 20.5C12.8 16.8 14.3 14.5 16 13C17.7 14.5 19.2 16.8 19.2 20.5"
            stroke="url(#dineGoldGrad)"
            strokeWidth="1.35"
            strokeLinecap="round"
            strokeOpacity="0.85"
          />
          <path d="M4.5 23.5H27.5" stroke="url(#dineGoldGrad)" strokeWidth="1.9" strokeLinecap="round" />
          <path
            d="M10.5 24.6L12.3 26.5H19.7L21.5 24.6"
            stroke="url(#dineGoldGrad)"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {showText && (
        <div className="flex flex-col min-w-0">
          <span
            className={`font-display font-bold ${textSizes[size]} tracking-tight leading-none truncate ${
              isDark ? 'text-white' : 'text-[#173F35]'
            }`}
          >
            {restaurantName || 'Zafaran Grand'}
          </span>
          {!compact && (
            <span
              className={`${subSizes[size]} font-medium mt-1 truncate max-w-[180px] sm:max-w-none ${
                isDark ? 'text-emerald-100/80' : 'text-[#737A75]'
              }`}
            >
              {restaurantBranch || restaurantTagline || 'Toshkent Markaziy filiali'}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
