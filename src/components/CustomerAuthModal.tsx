import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { CASHBACK_PERCENT_LABEL, WELCOME_BONUS_UZS } from '../services/customerAccount';
import { formatPrice } from '../utils/formatters';
import {
  UserPlus,
  LogIn,
  ArrowRight,
  ChevronLeft,
  X,
  Lock,
  User,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Utensils,
  ShieldCheck,
} from 'lucide-react';
import { UzPhoneInput } from './UzPhoneInput';

type AuthView = 'choice' | 'register' | 'login';

export const CustomerAuthModal: React.FC = () => {
  const {
    isCustomerAuthOpen,
    customerAuthInitialView,
    closeCustomerAuth,
    registerCustomerAccount,
    loginCustomerAccount,
    continueAsGuest,
    activeTableNumber,
    restaurantName,
    restaurantRating,
  } = useApp();

  const [view, setView] = useState<AuthView>(customerAuthInitialView);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('+998 ');
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isCustomerAuthOpen) {
      setView(customerAuthInitialView);
      setError(null);
      setPin('');
    }
  }, [isCustomerAuthOpen, customerAuthInitialView]);

  if (!isCustomerAuthOpen) return null;

  const markQrPromptSeen = () => {
    try {
      sessionStorage.setItem('dineflow_qr_choice_seen_v1', '1');
    } catch {
      // Ignore storage restrictions
    }
  };

  const handleClose = () => {
    markQrPromptSeen();
    closeCustomerAuth();
  };

  const handleContinueAsGuest = () => {
    markQrPromptSeen();
    continueAsGuest();
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await registerCustomerAccount(fullName, phone, pin);
      markQrPromptSeen();
      setFullName('');
      setPhone('+998 ');
      setPin('');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Ro'yxatdan o'tishda xatolik yuz berdi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await loginCustomerAccount(phone, pin);
      markQrPromptSeen();
      setPin('');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Kirishda xatolik yuz berdi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePinChange = (raw: string) => {
    const digitsOnly = raw.replace(/\D/g, '').slice(0, 4);
    setPin(digitsOnly);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="customer-auth-title"
    >
      <div className="bg-white w-full sm:max-w-[448px] rounded-t-3xl sm:rounded-3xl border border-[#E5E0D8] shadow-[0_28px_72px_rgba(15,45,37,0.38)] overflow-hidden max-h-[92vh] overflow-y-auto">
        {/* Clean Deep Forest Emerald Header */}
        <div className="bg-[#173F35] text-white px-6 py-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5 min-w-0">
              {view !== 'choice' && (
                <button
                  type="button"
                  onClick={() => {
                    setView('choice');
                    setError(null);
                  }}
                  className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors shrink-0 mt-0.5"
                  aria-label="Ortga"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              )}
              <div className="min-w-0">
                <p className="text-xs font-medium text-[#F59E0B]">
                  {restaurantName || 'Zafaran Grand'} · Stol №{activeTableNumber}
                </p>
                <h2
                  id="customer-auth-title"
                  className="font-display font-bold text-xl leading-snug mt-1"
                >
                  {view === 'choice'
                    ? 'Qanday kirishni xohlaysiz?'
                    : view === 'register'
                    ? 'Yangi akkaunt yaratish'
                    : 'Akkaunt bilan kirish'}
                </h2>
                {view === 'choice' && (
                  <p className="text-xs text-emerald-100/80 mt-1 tabular-nums">
                    {restaurantRating.averageRating.toFixed(1)} ★ · {restaurantRating.level.title}
                  </p>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={handleClose}
              className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 text-white/85 hover:text-white flex items-center justify-center transition-colors shrink-0"
              aria-label="Yopish"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="p-5 sm:p-6 bg-[#FAF8F3]">
          {view === 'choice' && (
            <div className="space-y-3">
              {/* Choice 1: Guest Mode */}
              <button
                type="button"
                onClick={handleContinueAsGuest}
                className="w-full min-h-[70px] p-4 rounded-2xl bg-white hover:bg-[#F3EFE6] active:scale-[0.99] border border-[#E5E0D8] flex items-center justify-between gap-3.5 text-left transition-all group"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-11 h-11 rounded-2xl bg-[#F3EFE6] text-[#173F35] flex items-center justify-center shrink-0">
                    <Utensils className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-display font-bold text-sm text-[#173F35]">
                      Mehmon sifatida kirish
                    </p>
                    <p className="text-xs text-[#59635E] mt-0.5 leading-snug">
                      Ro&apos;yxatdan o&apos;tmasdan buyurtma bering (tarix faqat chek yopilgunicha saqlanadi)
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-[#737A75] group-hover:text-[#173F35] group-hover:translate-x-0.5 transition-all shrink-0" />
              </button>

              {/* Choice 2: Create New Account (2% Cashback + Full Permanent History) */}
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setView('register');
                }}
                className="w-full min-h-[76px] p-4 rounded-2xl bg-[#173F35] hover:bg-[#1E5245] active:scale-[0.99] text-white flex items-center justify-between gap-3.5 text-left transition-all group shadow-sm"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-11 h-11 rounded-2xl bg-[#F59E0B] text-[#173F35] flex items-center justify-center shrink-0">
                    <UserPlus className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-display font-bold text-sm text-white">
                      Akkaunt yaratish
                    </p>
                    <p className="text-xs text-emerald-100/85 mt-0.5 leading-snug">
                      Barcha buyurtmalar doimiy saqlanadi ·{' '}
                      <strong className="text-[#F59E0B]">{CASHBACK_PERCENT_LABEL} keshbek</strong> +{' '}
                      <strong className="text-[#F59E0B] tabular-nums">{formatPrice(WELCOME_BONUS_UZS)}</strong> bonus
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-[#F59E0B] group-hover:translate-x-0.5 transition-all shrink-0" />
              </button>

              {/* Choice 3: Sign In with Existing Account */}
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setView('login');
                }}
                className="w-full min-h-[70px] p-4 rounded-2xl bg-white hover:bg-[#F3EFE6] active:scale-[0.99] border border-[#E5E0D8] flex items-center justify-between gap-3.5 text-left transition-all group"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-11 h-11 rounded-2xl bg-[#E8F0EC] text-[#173F35] flex items-center justify-center shrink-0">
                    <LogIn className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-display font-bold text-sm text-[#173F35]">
                      Akkaunt bilan kirish
                    </p>
                    <p className="text-xs text-[#59635E] mt-0.5 leading-snug">
                      Avval ochgan kabinetingiz va keshbek balansingizga kiring
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-[#737A75] group-hover:text-[#173F35] group-hover:translate-x-0.5 transition-all shrink-0" />
              </button>

              {/* Cashback Policy Footnote */}
              <div className="pt-2 flex items-start gap-2 text-[11px] text-[#59635E] leading-relaxed">
                <ShieldCheck className="w-4 h-4 text-[#1E5245] shrink-0 mt-0.5" />
                <p>
                  {CASHBACK_PERCENT_LABEL} keshbek buyurtma muvaffaqiyatli yetkazilgach hisobga
                  tushadi. Bekor qilingan buyurtmaga keshbek berilmaydi.
                </p>
              </div>
            </div>
          )}

          {view === 'register' && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="flex items-start gap-2.5 px-3.5 py-3 rounded-xl bg-[#E8F0EC] border border-[#C5DDD3] text-xs text-[#173F35]">
                <Sparkles className="w-4 h-4 text-[#1E5245] shrink-0 mt-0.5" />
                <span>
                  Yangi kabinetga <strong className="tabular-nums">{formatPrice(WELCOME_BONUS_UZS)}</strong>{' '}
                  bonus yoziladi va yakunlangan buyurtmalardan{' '}
                  <strong>{CASHBACK_PERCENT_LABEL} keshbek</strong> yig&apos;asiz.
                </span>
              </div>

              {error && (
                <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-[#202622] mb-1.5">
                  Ismingiz
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-[#737A75] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Masalan: Jasur Karimov"
                    className="w-full min-h-[46px] pl-10 pr-3.5 rounded-xl bg-white border border-[#D8D1C5] text-sm text-[#202622] focus:outline-none focus:border-[#173F35] focus:ring-2 focus:ring-[#F59E0B]/35"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#202622] mb-1.5">
                  O&apos;zbekiston telefon raqamingiz (+998)
                </label>
                <UzPhoneInput
                  value={phone}
                  onChange={setPhone}
                  required
                  placeholder="90 123-45-67"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#202622] mb-1.5">
                  4 xonali PIN-kod o&apos;ylab toping
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#737A75] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    inputMode="numeric"
                    pattern="\d{4}"
                    maxLength={4}
                    required
                    value={pin}
                    onChange={(e) => handlePinChange(e.target.value)}
                    placeholder="••••"
                    className="w-full min-h-[46px] pl-10 pr-3.5 rounded-xl bg-white border border-[#D8D1C5] text-base font-mono tracking-[0.4em] text-[#202622] focus:outline-none focus:border-[#173F35] focus:ring-2 focus:ring-[#F59E0B]/35"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full min-h-[48px] rounded-full bg-[#F59E0B] hover:bg-[#D97706] disabled:opacity-60 text-[#173F35] font-display font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isSubmitting ? 'Yaratilmoqda...' : 'Akkaunt yaratish'}</span>
              </button>

              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setView('login');
                  }}
                  className="text-xs font-semibold text-[#173F35] hover:underline"
                >
                  Akkauntingiz bormi? Kirish
                </button>
                <button
                  type="button"
                  onClick={handleContinueAsGuest}
                  className="text-xs font-medium text-[#59635E] hover:text-[#173F35]"
                >
                  Mehmon sifatida kirish
                </button>
              </div>
            </form>
          )}

          {view === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <p className="text-xs text-[#59635E]">
                Avval yaratgan telefon raqamingiz va 4 xonali PIN-kodingizni kiriting.
              </p>

              {error && (
                <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-[#202622] mb-1.5">
                  O&apos;zbekiston telefon raqamingiz (+998)
                </label>
                <UzPhoneInput
                  value={phone}
                  onChange={setPhone}
                  required
                  placeholder="90 123-45-67"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#202622] mb-1.5">
                  4 xonali PIN-kod
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#737A75] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    inputMode="numeric"
                    pattern="\d{4}"
                    maxLength={4}
                    required
                    value={pin}
                    onChange={(e) => handlePinChange(e.target.value)}
                    placeholder="••••"
                    className="w-full min-h-[46px] pl-10 pr-3.5 rounded-xl bg-white border border-[#D8D1C5] text-base font-mono tracking-[0.4em] text-[#202622] focus:outline-none focus:border-[#173F35] focus:ring-2 focus:ring-[#F59E0B]/35"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full min-h-[48px] rounded-full bg-[#173F35] hover:bg-[#1E5245] disabled:opacity-60 text-white font-display font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
              >
                <LogIn className="w-4 h-4 text-[#F59E0B]" />
                <span>{isSubmitting ? 'Tekshirilmoqda...' : 'Kabinetga kirish'}</span>
              </button>

              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setView('register');
                  }}
                  className="text-xs font-semibold text-[#173F35] hover:underline"
                >
                  Yangi akkaunt yaratish
                </button>
                <button
                  type="button"
                  onClick={handleContinueAsGuest}
                  className="text-xs font-medium text-[#59635E] hover:text-[#173F35]"
                >
                  Mehmon sifatida kirish
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
