import React, { useEffect, useMemo, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { StaffAccountRole } from '../../types';
import { STAFF_ROLE_LABELS } from '../../services/staffAccount';
import { UzPhoneInput } from '../../components/UzPhoneInput';
import { BrandLogo } from '../../components/BrandLogo';
import {
  Lock,
  User,
  ArrowRight,
  ShieldCheck,
  ChefHat,
  UserCheck,
  UserPlus,
  LogIn,
  AlertCircle,
  CheckCircle2,
  LogOut,
  Info,
  Star,
  QrCode,
  Sparkles,
  CheckCheck,
} from 'lucide-react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';

const ROLE_OPTIONS: {
  id: StaffAccountRole;
  label: string;
  icon: typeof ShieldCheck;
}[] = [
  { id: 'admin', label: 'Admin', icon: ShieldCheck },
  { id: 'waiter', label: 'Ofitsiant', icon: UserCheck },
  { id: 'kitchen', label: 'Oshpaz', icon: ChefHat },
];

function parseRoleParam(raw: string | null): StaffAccountRole {
  if (raw === 'waiter' || raw === 'kitchen' || raw === 'admin') return raw;
  return 'admin';
}

export const LoginPage: React.FC = () => {
  const {
    staffAccounts,
    activeStaffAccount,
    isStaffAccountsLoaded,
    loginStaffAccount,
    registerStaffAccount,
    logoutStaffAccount,
    addToast,
    restaurantName,
    restaurantRating,
    tables,
  } = useApp();

  const [searchParams, setSearchParams] = useSearchParams();
  const initialRole = parseRoleParam(searchParams.get('role'));

  const [selectedRole, setSelectedRole] = useState<StaffAccountRole>(initialRole);
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('+998 ');
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showCreateCta, setShowCreateCta] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const paramRole = searchParams.get('role');
    if (paramRole === 'admin' || paramRole === 'waiter' || paramRole === 'kitchen') {
      setSelectedRole(paramRole);
    }
  }, [searchParams]);

  const roleAccountsCount = useMemo(
    () => staffAccounts.filter((a) => a.role === selectedRole && a.status === 'active').length,
    [staffAccounts, selectedRole]
  );

  const hasAccountForRole = roleAccountsCount > 0;

  useEffect(() => {
    if (!isStaffAccountsLoaded) return;
    setError(null);
    setShowCreateCta(false);
    setMode(hasAccountForRole ? 'login' : 'register');
  }, [isStaffAccountsLoaded, selectedRole, hasAccountForRole]);

  const routeByRole = (role: StaffAccountRole) => {
    if (role === 'admin') navigate('/admin');
    else if (role === 'waiter') navigate('/waiter');
    else navigate('/kitchen');
  };

  const handleRoleSwitch = (role: StaffAccountRole) => {
    setSelectedRole(role);
    setSearchParams({ role }, { replace: true });
    setError(null);
    setShowCreateCta(false);
    setPin('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setShowCreateCta(false);
    setIsSubmitting(true);
    try {
      if (mode === 'login') {
        if (!hasAccountForRole) {
          setError(
            `Hozircha ${STAFF_ROLE_LABELS[selectedRole]} akkaunti yaratilmagan. Kirish uchun avval akkaunt yarating.`
          );
          setShowCreateCta(true);
          return;
        }
        const acc = await loginStaffAccount(selectedRole, phone, pin);
        addToast(
          'success',
          'Kirish tasdiqlandi',
          `${acc.full_name} (${STAFF_ROLE_LABELS[acc.role]}) sifatida kirdingiz.`
        );
        routeByRole(acc.role);
      } else {
        const acc = await registerStaffAccount({
          role: selectedRole,
          fullName,
          phone,
          pin,
        });
        await loginStaffAccount(acc.role, phone, pin);
        addToast(
          'success',
          'Akkaunt yaratildi!',
          `${acc.full_name} (${STAFF_ROLE_LABELS[acc.role]}) tizimga kirdi.`
        );
        routeByRole(acc.role);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Amaliyotda xatolik yuz berdi.';
      setError(msg);
      if (mode === 'login' && msg.toLowerCase().includes('topilmadi')) {
        setShowCreateCta(true);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F3] text-[#202622] flex flex-col">
      {/* Clean Single-Row Top Header (64px) */}
      <header className="sticky top-0 z-30 h-16 bg-[#173F35] text-white border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between gap-6">
          <Link to="/" className="shrink-0 whitespace-nowrap">
            <BrandLogo size="sm" compact theme="dark" />
          </Link>

          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-emerald-100/80">
            <button
              type="button"
              onClick={() => handleRoleSwitch('admin')}
              className={`whitespace-nowrap transition-colors ${
                selectedRole === 'admin' ? 'text-[#F59E0B] font-semibold' : 'hover:text-white'
              }`}
            >
              Admin paneli
            </button>
            <button
              type="button"
              onClick={() => handleRoleSwitch('waiter')}
              className={`whitespace-nowrap transition-colors ${
                selectedRole === 'waiter' ? 'text-[#F59E0B] font-semibold' : 'hover:text-white'
              }`}
            >
              Ofitsiant terminali
            </button>
            <button
              type="button"
              onClick={() => handleRoleSwitch('kitchen')}
              className={`whitespace-nowrap transition-colors ${
                selectedRole === 'kitchen' ? 'text-[#F59E0B] font-semibold' : 'hover:text-white'
              }`}
            >
              Oshxona KDS
            </button>
          </nav>

          <Link
            to="/t/1"
            className="min-h-[40px] px-4 py-2 rounded-full bg-[#F59E0B] hover:bg-[#FBBF24] text-[#173F35] text-xs sm:text-sm font-bold flex items-center gap-2 transition-all whitespace-nowrap shrink-0"
          >
            <QrCode className="w-4 h-4" />
            <span>QR Menyu</span>
          </Link>
        </div>
      </header>

      {/* Balanced Single-Viewport Split Main */}
      <main className="flex-1 flex items-center">
        <div className="max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-10 lg:py-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Left Overview Column */}
            <div className="lg:col-span-6 space-y-6">
              {/* Live Restaurant Status Line */}
              <div className="inline-flex items-center flex-wrap gap-2.5 px-3.5 py-2 rounded-full bg-white border border-[#E5E0D8] text-xs sm:text-sm text-[#202622]">
                <span className="inline-flex items-center gap-1 font-mono font-bold text-[#173F35] tabular-nums">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  {restaurantRating.averageRating.toFixed(1)}
                </span>
                <span className="text-[#D8D1C5]" aria-hidden="true">·</span>
                <span className="font-semibold text-[#1E5245]">
                  {restaurantRating.level.title} ({restaurantRating.level.levelNumber}/5)
                </span>
                <span className="text-[#D8D1C5]" aria-hidden="true">·</span>
                <span className="text-[#59635E] tabular-nums">{tables.length} ta stol</span>
              </div>

              <div className="space-y-3">
                <h1 className="font-display font-extrabold text-3xl sm:text-4xl lg:text-[42px] leading-[1.12] tracking-tight text-[#173F35]">
                  {restaurantName || 'Zafaran Grand'} boshqaruv tizimi
                </h1>
                <p className="text-sm sm:text-base text-[#59635E] leading-relaxed max-w-lg">
                  Admin, ofitsiant va oshxona xodimlari uchun himoyalangan kirish portali. Har bir
                  bo&apos;lim faqat tasdiqlangan telefon raqami va PIN-kod orqali ochiladi.
                </p>
              </div>

              {/* Clean Compact Key Capabilities */}
              <div className="space-y-3 pt-1">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#173F35] text-[#F59E0B] flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#173F35]">
                      1 va 2 pitichkali jonli buyurtma nazorati
                    </p>
                    <p className="text-xs sm:text-sm text-[#59635E] mt-0.5">
                      Ofitsiant qabul qilguniga qadar bekor qilish va oshxonaga tezkor uzatish.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#173F35] text-[#F59E0B] flex items-center justify-center shrink-0 mt-0.5">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#173F35]">
                      2% keshbek va jonli restoran reytingi
                    </p>
                    <p className="text-xs sm:text-sm text-[#59635E] mt-0.5">
                      Yakunlangan buyurtmadan 2% bonus va mehmon baholari asosida daraja hisobi.
                    </p>
                  </div>
                </div>
              </div>

              {/* Quick Actions & Active Session */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                {activeStaffAccount && activeStaffAccount.status === 'active' ? (
                  <>
                    <button
                      type="button"
                      onClick={() => routeByRole(activeStaffAccount.role)}
                      className="min-h-[46px] px-6 py-2.5 rounded-full bg-[#173F35] hover:bg-[#1E5245] text-white font-display font-bold text-sm inline-flex items-center gap-2 transition-all active:scale-[0.98]"
                    >
                      <span>Davom etish ({STAFF_ROLE_LABELS[activeStaffAccount.role]})</span>
                      <ArrowRight className="w-4 h-4 text-[#F59E0B]" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        logoutStaffAccount();
                        setPhone('+998 ');
                        setPin('');
                      }}
                      className="min-h-[46px] px-4 py-2.5 rounded-full bg-white hover:bg-red-50 text-red-700 border border-[#E5E0D8] text-sm font-semibold inline-flex items-center gap-1.5 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Chiqish</span>
                    </button>
                  </>
                ) : (
                  <Link
                    to="/t/1"
                    className="min-h-[46px] px-6 py-2.5 rounded-full bg-white hover:bg-[#F3EFE6] border border-[#E5E0D8] text-[#173F35] font-semibold text-sm inline-flex items-center gap-2 transition-all"
                  >
                    <QrCode className="w-4 h-4 text-[#1E5245]" />
                    <span>Mijoz QR menyusini ko&apos;rish</span>
                    <ArrowRight className="w-4 h-4 text-[#1E5245]" />
                  </Link>
                )}
              </div>
            </div>

            {/* Right Auth Card */}
            <div className="lg:col-span-6">
              <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-[0_18px_48px_-24px_rgba(23,63,53,0.22)] border border-[#E5E0D8] max-w-[500px] lg:ml-auto w-full">
                {/* Role Selector */}
                <div className="mb-5">
                  <label className="block text-xs sm:text-sm font-semibold text-[#59635E] mb-2">
                    Xodim vazifasini tanlang
                  </label>
                  <div className="grid grid-cols-3 gap-2.5">
                    {ROLE_OPTIONS.map((r) => {
                      const Icon = r.icon;
                      const isSel = selectedRole === r.id;
                      const count = staffAccounts.filter(
                        (a) => a.role === r.id && a.status === 'active'
                      ).length;
                      return (
                        <button
                          type="button"
                          key={r.id}
                          onClick={() => handleRoleSwitch(r.id)}
                          className={`min-h-[68px] p-3 rounded-2xl border text-center flex flex-col items-center justify-center gap-1 transition-all ${
                            isSel
                              ? 'bg-[#173F35] text-white border-[#173F35] shadow-xs'
                              : 'bg-[#FAF8F3] text-[#59635E] border-[#E5E0D8] hover:border-[#173F35]/40 hover:text-[#173F35]'
                          }`}
                        >
                          <Icon className={`w-4 h-4 ${isSel ? 'text-[#F59E0B]' : ''}`} />
                          <span className="font-bold text-xs sm:text-[13px]">{r.label}</span>
                          {isStaffAccountsLoaded && (
                            <span
                              className={`text-[11px] font-medium tabular-nums ${
                                isSel ? 'text-emerald-200/90' : 'text-[#737A75]'
                              }`}
                            >
                              {count > 0 ? `${count} ta` : 'Yangi'}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Login / Register Switcher */}
                <div className="grid grid-cols-2 p-1 rounded-2xl bg-[#F3EFE6] border border-[#E5E0D8] mb-5">
                  <button
                    type="button"
                    onClick={() => {
                      setMode('login');
                      setError(null);
                      setShowCreateCta(false);
                      setPin('');
                    }}
                    className={`min-h-[44px] rounded-xl text-xs sm:text-[13px] font-bold flex items-center justify-center gap-1.5 transition-all ${
                      mode === 'login'
                        ? 'bg-[#173F35] text-white shadow-xs'
                        : 'text-[#59635E] hover:text-[#173F35]'
                    }`}
                  >
                    <LogIn className="w-4 h-4" />
                    <span>Parol bilan kirish</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('register');
                      setError(null);
                      setShowCreateCta(false);
                      setPin('');
                    }}
                    className={`min-h-[44px] rounded-xl text-xs sm:text-[13px] font-bold flex items-center justify-center gap-1.5 transition-all ${
                      mode === 'register'
                        ? 'bg-[#173F35] text-white shadow-xs'
                        : 'text-[#59635E] hover:text-[#173F35]'
                    }`}
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Akkaunt yaratish</span>
                  </button>
                </div>

                {/* Empty Role Notice */}
                {isStaffAccountsLoaded && !hasAccountForRole && (
                  <div className="mb-4 p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs sm:text-[13px] text-amber-950 flex items-start gap-2.5">
                    <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                    <div className="space-y-0.5">
                      <p className="font-bold">
                        {STAFF_ROLE_LABELS[selectedRole]} uchun hali akkaunt yaratilmagan
                      </p>
                      <p className="text-xs text-amber-900/80 leading-relaxed">
                        Avval <span className="font-mono font-bold">+998</span> raqam va 4 xonali
                        PIN-kod bilan akkaunt yarating.
                      </p>
                    </div>
                  </div>
                )}

                <h2 className="font-display font-bold text-lg sm:text-xl text-[#173F35]">
                  {mode === 'login'
                    ? `${STAFF_ROLE_LABELS[selectedRole]} kabinetiga kirish`
                    : `Yangi ${STAFF_ROLE_LABELS[selectedRole]} akkaunti`}
                </h2>
                <p className="text-xs sm:text-[13px] text-[#59635E] mt-1 mb-5">
                  Faqat O&apos;zbekiston raqami (<span className="font-mono font-semibold text-[#173F35]">+998</span>) va 4 xonali PIN-kod orqali
                </p>

                {error && (
                  <div className="mb-4 p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs sm:text-[13px] text-red-800 space-y-2.5">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{error}</span>
                    </div>
                    {showCreateCta && (
                      <button
                        type="button"
                        onClick={() => {
                          setMode('register');
                          setError(null);
                          setShowCreateCta(false);
                          setPin('');
                        }}
                        className="w-full min-h-[40px] rounded-xl bg-[#173F35] hover:bg-[#1E5245] text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <UserPlus className="w-4 h-4 text-[#F59E0B]" />
                        <span>Yangi akkaunt yaratishga o&apos;tish</span>
                      </button>
                    )}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  {mode === 'register' && (
                    <div>
                      <label className="block text-xs sm:text-[13px] font-semibold text-[#202622] mb-1.5">
                        Ism-familiya
                      </label>
                      <div className="relative">
                        <User className="w-4 h-4 text-[#737A75] absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          required
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="Masalan: Karimov Dilshod"
                          className="w-full min-h-[48px] pl-10 pr-3.5 rounded-xl bg-[#FAF8F3] border border-[#D8D1C5] text-sm text-[#202622] focus:outline-none focus:bg-white focus:border-[#173F35] focus:ring-2 focus:ring-[#F59E0B]/35"
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs sm:text-[13px] font-semibold text-[#202622] mb-1.5">
                      O&apos;zbekiston telefon raqami (+998 o&apos;zgarmas)
                    </label>
                    <UzPhoneInput
                      value={phone}
                      onChange={setPhone}
                      required
                      placeholder="90 123-45-67"
                    />
                  </div>

                  <div>
                    <label className="block text-xs sm:text-[13px] font-semibold text-[#202622] mb-1.5">
                      {mode === 'login' ? '4 xonali parol (PIN-kod)' : "4 xonali PIN-kod o'ylab toping"}
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-[#737A75] absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="password"
                        inputMode="numeric"
                        pattern="\d{4}"
                        maxLength={4}
                        required
                        autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                        value={pin}
                        onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                        placeholder="••••"
                        className="w-full min-h-[48px] pl-10 pr-3.5 rounded-xl bg-[#FAF8F3] border border-[#D8D1C5] text-base font-mono tracking-[0.4em] text-[#202622] focus:outline-none focus:bg-white focus:border-[#173F35] focus:ring-2 focus:ring-[#F59E0B]/35"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting || !isStaffAccountsLoaded}
                    className="w-full min-h-[50px] py-3 px-5 rounded-full bg-[#173F35] hover:bg-[#1E5245] disabled:opacity-60 text-white font-display font-bold text-sm sm:text-[15px] flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.99]"
                  >
                    {mode === 'login' ? (
                      <>
                        <span>{isSubmitting ? 'Tekshirilmoqda...' : 'Parol bilan kirish'}</span>
                        <ArrowRight className="w-4 h-4 text-[#F59E0B]" />
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-[#F59E0B]" />
                        <span>
                          {isSubmitting
                            ? 'Yaratilmoqda...'
                            : `${STAFF_ROLE_LABELS[selectedRole]} akkauntini yaratish`}
                        </span>
                      </>
                    )}
                  </button>
                </form>

                <div className="mt-5 pt-4 border-t border-[#E5E0D8] text-center">
                  {mode === 'login' ? (
                    <button
                      type="button"
                      onClick={() => {
                        setMode('register');
                        setError(null);
                        setShowCreateCta(false);
                        setPin('');
                      }}
                      className="text-xs sm:text-[13px] font-semibold text-[#173F35] hover:text-[#1E5245] hover:underline"
                    >
                      Akkauntingiz yo&apos;qmi? Yangi akkaunt yaratish
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setMode('login');
                        setError(null);
                        setShowCreateCta(false);
                        setPin('');
                      }}
                      className="text-xs sm:text-[13px] font-semibold text-[#173F35] hover:text-[#1E5245] hover:underline"
                    >
                      Allaqachon akkauntingiz bormi? Parol bilan kirish
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
