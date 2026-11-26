import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { AppLanguage, LANGUAGE_OPTIONS } from '../i18n/types';
import { CircularFlagIcon } from './LanguageSwitcher';
import { BrandLogo } from './BrandLogo';
import { Globe, ChevronRight } from 'lucide-react';

const SUBTITLES: Record<AppLanguage, string> = {
  en: 'Continue in English',
  ru: 'Продолжить на русском',
  uz: "O'zbek tilida davom etish",
};

export const LanguageEntryModal: React.FC = () => {
  const { hasSelectedLanguage, language, confirmInitialLanguage } = useLanguage();

  if (hasSelectedLanguage) return null;

  return (
    <div
      className="fixed inset-0 z-[100] bg-[#173F35]/75 backdrop-blur-md flex items-center justify-center p-4"
      data-no-translate="true"
    >
      <div className="bg-[#FAF8F3] rounded-3xl max-w-sm w-full overflow-hidden shadow-[0_28px_70px_-18px_rgba(12,35,28,0.65)] border border-[#E5E0D8]">
        {/* Header */}
        <div className="bg-[#173F35] text-white px-6 py-6 text-center space-y-3">
          <div className="flex justify-center">
            <BrandLogo size="sm" compact theme="dark" />
          </div>
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#F59E0B]">
            <Globe className="w-3.5 h-3.5" />
            <span>Tilni tanlang · Language · Язык</span>
          </div>
          <h2 className="font-display font-bold text-lg text-white leading-snug">
            Ilova tilini tanlang
          </h2>
        </div>

        {/* Language Options matching Image 2's clean circular flag list */}
        <div className="p-5 space-y-2.5">
          {LANGUAGE_OPTIONS.map((opt) => {
            const isSelected = opt.code === language;
            return (
              <button
                key={opt.code}
                type="button"
                onClick={() => confirmInitialLanguage(opt.code)}
                className={`w-full min-h-[60px] px-4 py-3 rounded-2xl border flex items-center justify-between gap-3 transition-all active:scale-[0.98] ${
                  isSelected
                    ? 'bg-[#E8F0EC] border-[#173F35] shadow-xs'
                    : 'bg-white border-[#E5E0D8] hover:border-[#173F35]/50 hover:bg-[#F3EFE6]'
                }`}
              >
                <div className="flex items-center gap-3.5 text-left">
                  <CircularFlagIcon code={opt.code} size={32} />
                  <div>
                    <div className="font-display font-bold text-[15px] text-[#173F35] leading-tight">
                      {opt.nativeLabel}
                    </div>
                    <div className="text-xs text-[#59635E] mt-0.5">{SUBTITLES[opt.code]}</div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-[#173F35]/70 shrink-0" />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
