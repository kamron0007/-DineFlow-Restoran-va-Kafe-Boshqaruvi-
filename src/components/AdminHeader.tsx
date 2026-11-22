import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Bell, Volume2, VolumeX, User, ChefHat, UserCheck, Utensils, Clock } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const MONTH_NAMES_UZ = [
  'Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun',
  'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'
];

const WEEKDAY_NAMES_UZ = [
  'Yakshanba', 'Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba'
];

export const AdminHeader: React.FC = () => {
  const { tables, orders, serviceCalls, soundEnabled, setSoundEnabled, currentUser, setUserRole } =
    useApp();
  const navigate = useNavigate();

  // Jonli real-vaqt soati
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  const timeString = `${hours}:${minutes}:${seconds}`;

  const day = now.getDate();
  const monthName = MONTH_NAMES_UZ[now.getMonth()];
  const weekday = WEEKDAY_NAMES_UZ[now.getDay()];
  const dateString = `${weekday}, ${day}-${monthName}`;

  // Faol band stollar soni
  const busyTablesCount = new Set(
    orders
      .filter((o) => o.status !== 'delivered' && o.status !== 'cancelled')
      .map((o) => o.table_number)
  ).size;

  const allPendingCalls = serviceCalls.filter((c) => c.status === 'pending');
  const escalatedCalls = allPendingCalls.filter(
    (c) => (c.call_count || 1) >= 2 || c.escalated_to_admin || allPendingCalls.length >= 3
  );
  const escalatedCallsCount = escalatedCalls.length;

  return (
    <header className="sticky top-0 z-40 h-16 bg-white/95 backdrop-blur-md border-b border-[#E5E0D8] px-3 sm:px-6 flex items-center justify-between gap-2 shadow-[0_1px_8px_rgba(0,0,0,0.04)] min-w-0">
      {/* Chap tomon: Band stollar va Jonli Soat */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0 shrink-0">
        <div className="flex items-center gap-1.5 bg-[#FAF8F3] px-2.5 sm:px-3.5 py-1.5 rounded-xl border border-[#E5E0D8] shrink-0">
          <span className="text-[11px] sm:text-xs text-[#737A75] font-medium hidden xs:inline">Stollar:</span>
          <span className="font-display font-bold text-xs sm:text-sm text-[#173F35]">
            {busyTablesCount}/{tables.length}
          </span>
        </div>

        {/* Real vaqt jonli soati (sekundomerli) */}
        <div className="flex items-center gap-2 bg-[#173F35] text-white px-2.5 sm:px-3 py-1.5 rounded-xl shadow-md border border-[#235B4E] shrink-0">
          <div className="flex items-center gap-1">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
            </span>
            <Clock className="w-3.5 h-3.5 text-emerald-300" />
          </div>
          <div className="flex items-center gap-1.5 font-mono">
            <span className="hidden 2xl:inline text-xs font-sans text-emerald-100 font-medium capitalize">
              {dateString}
            </span>
            <span className="text-emerald-400/50 hidden 2xl:inline">•</span>
            <span className="font-extrabold text-xs sm:text-sm text-white tabular-nums tracking-wider bg-black/30 px-2 py-0.5 rounded-md border border-white/10 shadow-inner">
              {timeString}
            </span>
          </div>
        </div>

        {escalatedCallsCount > 0 ? (
          <Link
            to="/admin/tables"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-600 text-white text-xs font-bold animate-pulse shrink-0 shadow-sm"
            title="Ofitsiant javob bermagan yoki yig'ilib qolgan chaqiruvlar"
          >
            <Bell className="w-3.5 h-3.5 text-amber-300" />
            <span>{escalatedCallsCount} ta kechikkan chaqiruv!</span>
          </Link>
        ) : null}
      </div>

      {/* O'ng tomon: Rejimlar, ovoz va profil */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Tezkor o'tish tugmalari */}
        <div className="flex items-center gap-0.5 sm:gap-1 bg-[#FAF8F3] p-1 rounded-xl border border-[#E5E0D8] text-xs shrink-0">
          <Link
            to="/menu"
            className="flex items-center gap-1 px-2 py-1 rounded-lg text-[#737A75] hover:text-[#173F35] hover:bg-white transition-all font-medium"
            title="Mijoz menyusi"
          >
            <Utensils className="w-3.5 h-3.5" />
            <span className="hidden xl:inline">Menyu</span>
          </Link>

          <button
            onClick={() => {
              setUserRole('waiter');
              navigate('/waiter');
            }}
            className="flex items-center gap-1 px-2 py-1 rounded-lg text-[#737A75] hover:text-[#173F35] hover:bg-white transition-all font-medium"
            title="Ofitsiant rejimi"
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span className="hidden xl:inline">Ofitsiant</span>
          </button>

          <button
            onClick={() => {
              setUserRole('kitchen');
              navigate('/kitchen');
            }}
            className="flex items-center gap-1 px-2 py-1 rounded-lg text-[#737A75] hover:text-[#173F35] hover:bg-white transition-all font-medium"
            title="Oshxona KDS"
          >
            <ChefHat className="w-3.5 h-3.5" />
            <span className="hidden xl:inline">KDS</span>
          </button>
        </div>

        {/* Ovoz tugmasi */}
        <button
          onClick={() => setSoundEnabled(!soundEnabled)}
          className="p-1.5 sm:p-2 rounded-xl text-[#737A75] hover:text-[#202622] hover:bg-[#FAF8F3] transition-colors border border-transparent hover:border-[#E5E0D8] shrink-0"
          title={soundEnabled ? "Ovozni o'chirish" : "Ovozni yoqish"}
        >
          {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-700" /> : <VolumeX className="w-4 h-4" />}
        </button>

        <div className="h-5 w-px bg-[#E5E0D8] hidden sm:block shrink-0" />

        {/* Foydalanuvchi profili */}
        <div className="flex items-center gap-2 pl-1 shrink-0">
          <div className="hidden sm:flex flex-col items-end text-right justify-center">
            <span className="text-[11px] font-bold text-[#173F35] leading-snug whitespace-nowrap">
              {currentUser?.full_name || 'B. Kamronbek'}
            </span>
            <span className="text-[9px] text-[#737A75] font-medium whitespace-nowrap leading-none">
              Bosh administrator
            </span>
          </div>
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-[#173F35] to-[#235B4E] text-white flex items-center justify-center font-bold text-xs shadow-xs border border-[#235B4E] shrink-0">
            <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-300" />
          </div>
        </div>
      </div>
    </header>
  );
};
