import React from 'react';
import { useApp } from '../context/AppContext';
import { useLiveClock } from '../hooks/useLiveClock';
import { Bell, Volume2, VolumeX, User, ChefHat, UserCheck, Utensils, Clock, Pencil, LogOut } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { STAFF_ROLE_LABELS } from '../services/staffAccount';
import { LanguageSwitcher } from './LanguageSwitcher';

export const AdminHeader: React.FC = () => {
  const {
    tables,
    orders,
    serviceCalls,
    soundEnabled,
    setSoundEnabled,
    currentUser,
    activeStaffAccount,
    staffAccounts,
    openStaffAccountModal,
    logoutStaffAccount,
  } = useApp();
  const navigate = useNavigate();

  const activeAdminAccount =
    (activeStaffAccount?.role === 'admin' ? activeStaffAccount : null) ||
    staffAccounts.find((a) => a.role === 'admin') ||
    null;

  const { timeString, weekday, shortDate } = useLiveClock();
  const dateString = `${weekday}, ${shortDate}`;

  const busyTablesCount = new Set(
    orders
      .filter((o) => o.status !== 'delivered' && o.status !== 'cancelled')
      .map((o) => o.table_number)
  ).size;

  const allPendingCalls = serviceCalls.filter((c) => c.status === 'pending');
  const escalatedCalls = allPendingCalls.filter(
    (c) => (c.call_count || 1) >= 3 || c.escalated_to_admin
  );
  const escalatedCallsCount = escalatedCalls.length;

  return (
    <header className="sticky top-0 z-40 h-16 bg-white/95 backdrop-blur-md border-b border-[#E5E0D8] px-3 sm:px-6 flex items-center justify-between gap-2 min-w-0">
      {/* Left: Busy Tables & Live Clock */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0 shrink-0">
        <div className="flex items-center gap-1.5 bg-[#FAF8F3] px-3 py-1.5 rounded-full border border-[#E5E0D8] shrink-0">
          <span className="text-[11px] sm:text-xs text-[#737A75] font-medium hidden xs:inline">Stollar:</span>
          <span className="font-mono font-bold text-xs sm:text-sm text-[#173F35] tabular-nums">
            {busyTablesCount}/{tables.length}
          </span>
        </div>

        {/* Real-time live clock */}
        <div className="flex items-center gap-2 bg-[#173F35] text-white px-3 py-1.5 rounded-full border border-[#1E5245] shrink-0">
          <Clock className="w-3.5 h-3.5 text-[#F59E0B]" />
          <div className="flex items-center gap-1.5 font-mono">
            <span className="hidden 2xl:inline text-xs font-sans text-emerald-100/80 font-medium capitalize">
              {dateString}
            </span>
            <span className="text-white/25 hidden 2xl:inline">·</span>
            <span className="font-bold text-xs sm:text-sm text-white tabular-nums tracking-wider">
              {timeString}
            </span>
          </div>
        </div>

        {escalatedCallsCount > 0 ? (
          <Link
            to="/admin/tables"
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-red-600 text-white text-xs font-bold shrink-0 shadow-sm"
            title="Ofitsiant javob bermagan yoki yig'ilib qolgan chaqiruvlar"
          >
            <Bell className="w-3.5 h-3.5 text-amber-300" />
            <span>{escalatedCallsCount} ta kechikkan chaqiruv</span>
          </Link>
        ) : null}
      </div>

      {/* Right: Quick Workspaces, Audio & Profile */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <div className="flex items-center gap-0.5 sm:gap-1 bg-[#FAF8F3] p-1 rounded-full border border-[#E5E0D8] text-xs shrink-0">
          <Link
            to="/menu"
            className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[#59635E] hover:text-[#173F35] hover:bg-white transition-all font-medium"
            title="Mijoz menyusi"
          >
            <Utensils className="w-3.5 h-3.5" />
            <span className="hidden xl:inline">Menyu</span>
          </Link>

          <button
            type="button"
            onClick={() => {
              logoutStaffAccount();
              navigate('/login?role=waiter');
            }}
            className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[#59635E] hover:text-[#173F35] hover:bg-white transition-all font-medium"
            title="Ofitsiant kabinetiga kirish"
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span className="hidden xl:inline">Ofitsiant</span>
          </button>

          <button
            type="button"
            onClick={() => {
              logoutStaffAccount();
              navigate('/login?role=kitchen');
            }}
            className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[#59635E] hover:text-[#173F35] hover:bg-white transition-all font-medium"
            title="Oshxona KDS kabinetiga kirish"
          >
            <ChefHat className="w-3.5 h-3.5" />
            <span className="hidden xl:inline">KDS</span>
          </button>
        </div>

        {/* Sound toggle */}
        <button
          type="button"
          onClick={() => setSoundEnabled(!soundEnabled)}
          className="p-2 rounded-full text-[#59635E] hover:text-[#173F35] hover:bg-[#FAF8F3] transition-colors border border-transparent hover:border-[#E5E0D8] shrink-0"
          title={soundEnabled ? "Ovozni o'chirish" : "Ovozni yoqish"}
        >
          {soundEnabled ? <Volume2 className="w-4 h-4 text-[#1E5245]" /> : <VolumeX className="w-4 h-4" />}
        </button>

        {/* Circular Flag Language Switcher */}
        <LanguageSwitcher theme="light" />

        <div className="h-5 w-px bg-[#E5E0D8] hidden sm:block shrink-0" />

        {/* Profile Edit */}
        <button
          type="button"
          onClick={() => openStaffAccountModal(activeAdminAccount, 'admin')}
          className="flex items-center gap-2 pl-2 pr-1.5 py-1 rounded-full hover:bg-[#FAF8F3] border border-transparent hover:border-[#E5E0D8] transition-all shrink-0 group"
          title="Admin akkauntini tahrirlash"
        >
          <div className="hidden sm:flex flex-col items-end text-right justify-center">
            <span className="text-xs font-bold text-[#173F35] leading-snug whitespace-nowrap flex items-center gap-1">
              <span>{activeAdminAccount?.full_name || currentUser?.full_name || 'Administrator'}</span>
              <Pencil className="w-3 h-3 text-[#737A75] group-hover:text-[#173F35]" />
            </span>
            <span className="text-[11px] text-[#737A75] font-medium whitespace-nowrap leading-tight">
              {activeAdminAccount
                ? `${STAFF_ROLE_LABELS[activeAdminAccount.role]} · ${activeAdminAccount.badge_id}`
                : 'Bosh administrator'}
            </span>
          </div>
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#173F35] text-[#F59E0B] flex items-center justify-center font-bold text-xs shrink-0">
            <User className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
        </button>

        <button
          type="button"
          onClick={() => {
            logoutStaffAccount();
            navigate('/login?role=admin');
          }}
          className="p-2 rounded-full text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 transition-colors shrink-0"
          title="Tizimdan chiqish"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
