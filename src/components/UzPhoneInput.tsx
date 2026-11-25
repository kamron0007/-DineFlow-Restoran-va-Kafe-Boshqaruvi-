import React from 'react';

/**
 * Extracts ONLY the 9 local Uzbekistan digits (after +998).
 * Strips any leading 998 or +998 if user pasted a full number.
 */
export function extractUzLocalDigits(raw: string): string {
  let digits = (raw || '').replace(/\D/g, '');
  if (digits.startsWith('998')) {
    digits = digits.slice(3);
  }
  return digits.slice(0, 9);
}

/**
 * Formats 9 local digits as "XX XXX-XX-XX".
 */
export function formatUzLocalPart(localDigits: string): string {
  const d = localDigits.replace(/\D/g, '').slice(0, 9);
  if (d.length <= 2) return d;
  if (d.length <= 5) return `${d.slice(0, 2)} ${d.slice(2)}`;
  if (d.length <= 7) return `${d.slice(0, 2)} ${d.slice(2, 5)}-${d.slice(5)}`;
  return `${d.slice(0, 2)} ${d.slice(2, 5)}-${d.slice(5, 7)}-${d.slice(7, 9)}`;
}

/**
 * Always returns a string prefixed with "+998 " (e.g. "+998 90 123-45-67").
 */
export function formatUzFullPhone(raw: string): string {
  const local = extractUzLocalDigits(raw);
  const formattedLocal = formatUzLocalPart(local);
  return formattedLocal ? `+998 ${formattedLocal}` : '+998 ';
}

/**
 * Strict Uzbekistan phone check: must have +998 + exact 9 digits (12 digits total).
 */
export function isValidUzPhone(raw: string): boolean {
  const local = extractUzLocalDigits(raw);
  return /^\d{9}$/.test(local);
}

interface UzPhoneInputProps {
  value: string;
  onChange: (fullUzPhone: string) => void;
  id?: string;
  disabled?: boolean;
  required?: boolean;
  autoFocus?: boolean;
  placeholder?: string;
  darkSurface?: boolean;
  className?: string;
}

/**
 * Locked Uzbekistan (+998) phone input component.
 * "+998" is rendered as a non-editable locked prefix, so pressing Backspace,
 * Delete, or Select-All can NEVER remove "+998". Only the 9 Uzbekistan local digits
 * (XX XXX-XX-XX) can be entered.
 */
export const UzPhoneInput: React.FC<UzPhoneInputProps> = ({
  value,
  onChange,
  id,
  disabled = false,
  required = false,
  autoFocus = false,
  placeholder = '90 123-45-67',
  darkSurface = false,
  className = '',
}) => {
  const localDigits = extractUzLocalDigits(value);
  const displayLocal = formatUzLocalPart(localDigits);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nextDigits = extractUzLocalDigits(e.target.value);
    const formatted = formatUzLocalPart(nextDigits);
    onChange(formatted ? `+998 ${formatted}` : '+998 ');
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text');
    const nextDigits = extractUzLocalDigits(pasted);
    const formatted = formatUzLocalPart(nextDigits);
    onChange(formatted ? `+998 ${formatted}` : '+998 ');
  };

  return (
    <div
      className={`flex items-stretch rounded-xl border overflow-hidden transition-all focus-within:ring-2 ${
        darkSurface
          ? 'bg-slate-800 border-slate-600 focus-within:border-amber-400 focus-within:ring-amber-400/20'
          : 'bg-white border-[#D8D1C5] focus-within:border-[#173F35] focus-within:ring-[#173F35]/15'
      } ${disabled ? 'opacity-60 cursor-not-allowed' : ''} ${className}`}
    >
      {/* Non-editable locked +998 Uzbekistan prefix */}
      <span
        className={`select-none px-3 flex items-center gap-1.5 font-mono font-bold text-sm border-r shrink-0 ${
          darkSurface
            ? 'bg-slate-900/80 text-amber-300 border-slate-700'
            : 'bg-[#F3EFE6] text-[#173F35] border-[#E5E0D8]'
        }`}
        aria-hidden="true"
        title="O'zbekiston kodi (+998 o'zgarmas)"
      >
        <span className="text-[10px] font-sans font-extrabold uppercase tracking-wider px-1 py-0.5 rounded bg-[#173F35] text-amber-300">
          UZ
        </span>
        <span>+998</span>
      </span>

      <input
        id={id}
        type="tel"
        inputMode="numeric"
        autoComplete="tel-national"
        disabled={disabled}
        required={required}
        autoFocus={autoFocus}
        value={displayLocal}
        onChange={handleChange}
        onPaste={handlePaste}
        placeholder={placeholder}
        maxLength={12} // "XX XXX-XX-XX" = 12 chars
        aria-label="O'zbekiston telefon raqami (+998 dan keyingi 9 ta raqam)"
        className={`flex-1 min-w-0 min-h-[46px] px-3 py-2 text-sm font-mono font-semibold tabular-nums focus:outline-none bg-transparent ${
          darkSurface
            ? 'text-white placeholder:text-slate-400'
            : 'text-[#202622] placeholder:text-[#9CA39E]'
        }`}
      />

      {/* Digit counter hint (0/9 .. 9/9) */}
      <span
        className={`pr-3 flex items-center text-[10px] font-mono tabular-nums shrink-0 ${
          localDigits.length === 9
            ? 'text-emerald-600 font-bold'
            : darkSurface
            ? 'text-slate-400'
            : 'text-[#9CA39E]'
        }`}
      >
        {localDigits.length}/9
      </span>
    </div>
  );
};
