import React, { useEffect, useId, useRef, useState } from 'react';
import { AppLanguage, LANGUAGE_OPTIONS } from '../i18n/types';
import { useLanguage } from '../context/LanguageContext';

export const CircularFlagIcon: React.FC<{ code: AppLanguage; size?: number; className?: string }> = ({
  code,
  size = 24,
  className = '',
}) => {
  const clipId = useId();

  if (code === 'en') {
    // Crisp circular United Kingdom (Union Jack) SVG flag
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        className={`rounded-full shrink-0 block ${className}`}
        aria-hidden="true"
      >
        <defs>
          <clipPath id={clipId}>
            <circle cx="16" cy="16" r="16" />
          </clipPath>
        </defs>
        <g clipPath={`url(#${clipId})`}>
          <rect width="32" height="32" fill="#012169" />
          <path d="M0 0 L32 32 M32 0 L0 32" stroke="#FFFFFF" strokeWidth="6" />
          <path d="M0 0 L32 32 M32 0 L0 32" stroke="#C8102E" strokeWidth="2.6" />
          <path d="M16 0 V32 M0 16 H32" stroke="#FFFFFF" strokeWidth="8.5" />
          <path d="M16 0 V32 M0 16 H32" stroke="#C8102E" strokeWidth="5" />
        </g>
      </svg>
    );
  }

  if (code === 'ru') {
    // Crisp circular Russian tricolor SVG flag
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        className={`rounded-full shrink-0 block ring-1 ring-black/10 ${className}`}
        aria-hidden="true"
      >
        <defs>
          <clipPath id={clipId}>
            <circle cx="16" cy="16" r="16" />
          </clipPath>
        </defs>
        <g clipPath={`url(#${clipId})`}>
          <rect y="0" width="32" height="10.7" fill="#FFFFFF" />
          <rect y="10.7" width="32" height="10.7" fill="#0039A6" />
          <rect y="21.4" width="32" height="10.6" fill="#D52B1E" />
        </g>
      </svg>
    );
  }

  // Crisp circular Uzbekistan SVG flag
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      className={`rounded-full shrink-0 block ${className}`}
      aria-hidden="true"
    >
      <defs>
        <clipPath id={clipId}>
          <circle cx="16" cy="16" r="16" />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clipId})`}>
        <rect y="0" width="32" height="10.2" fill="#0099B5" />
        <rect y="10.2" width="32" height="1.1" fill="#CE1126" />
        <rect y="11.3" width="32" height="9.4" fill="#FFFFFF" />
        <rect y="20.7" width="32" height="1.1" fill="#CE1126" />
        <rect y="21.8" width="32" height="10.2" fill="#1EB53A" />
        {/* Crescent & tiny stars in upper-left */}
        <circle cx="8.6" cy="5.4" r="2.7" fill="#FFFFFF" />
        <circle cx="9.7" cy="5.4" r="2.2" fill="#0099B5" />
        <circle cx="13.2" cy="4.0" r="0.6" fill="#FFFFFF" />
        <circle cx="15.1" cy="4.0" r="0.6" fill="#FFFFFF" />
        <circle cx="17.0" cy="4.0" r="0.6" fill="#FFFFFF" />
        <circle cx="13.2" cy="6.2" r="0.6" fill="#FFFFFF" />
        <circle cx="15.1" cy="6.2" r="0.6" fill="#FFFFFF" />
        <circle cx="17.0" cy="6.2" r="0.6" fill="#FFFFFF" />
      </g>
    </svg>
  );
};

interface LanguageSwitcherProps {
  theme?: 'dark' | 'light';
  align?: 'right' | 'left';
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  theme = 'dark',
  align = 'right',
}) => {
  const { language, setLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handlePointerDown = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const currentOpt = LANGUAGE_OPTIONS.find((o) => o.code === language) || LANGUAGE_OPTIONS[2];

  return (
    <div ref={containerRef} className="relative shrink-0" data-no-translate="true">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-95 border ${
          theme === 'dark'
            ? 'bg-white/10 hover:bg-white/20 border-white/18 shadow-xs'
            : 'bg-[#FAF8F3] hover:bg-[#EFECE4] border-[#E5E0D8] shadow-2xs'
        } ${isOpen ? 'ring-2 ring-[#F59E0B]/70' : ''}`}
        title={currentOpt.nativeLabel}
        aria-label={`Language: ${currentOpt.nativeLabel}`}
        aria-expanded={isOpen}
        aria-haspopup="menu"
      >
        <CircularFlagIcon code={language} size={24} />
      </button>

      {isOpen && (
        <div
          role="menu"
          className={`absolute top-[calc(100%+10px)] ${
            align === 'right' ? 'right-0' : 'left-0'
          } z-[80] min-w-[180px] rounded-[22px] bg-[#EBF1EE]/95 backdrop-blur-xl shadow-[0_20px_48px_-12px_rgba(15,45,37,0.34)] border border-[#173F35]/12 p-2 space-y-1`}
        >
          {LANGUAGE_OPTIONS.map((opt) => {
            const isActive = opt.code === language;
            return (
              <button
                key={opt.code}
                type="button"
                role="menuitemradio"
                aria-checked={isActive}
                onClick={() => {
                  setLanguage(opt.code);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-[14px] text-left text-[15px] transition-colors ${
                  isActive
                    ? 'bg-[#D6E3DD] text-[#173F35] font-semibold'
                    : 'text-[#202622] hover:bg-white/65 font-medium'
                }`}
              >
                <CircularFlagIcon code={opt.code} size={24} />
                <span className="tracking-[-0.01em]">{opt.nativeLabel}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
