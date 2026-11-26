import React, { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import { useLiveClock } from '../hooks/useLiveClock';
import { Bell, BellRing, CheckCircle2, ShoppingBag, Clock, Wallet, User, Receipt } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { BrandLogo } from './BrandLogo';
import { WaiterCallIndicator } from './WaiterCallIndicator';
import { LanguageSwitcher } from './LanguageSwitcher';
import { formatPrice } from '../utils/formatters';

export const CustomerHeader: React.FC = () => {
  const {
    activeTableNumber,
    callWaiter,
    cartItemCount,
    customerOrders,
    serviceCalls,
    lastResolvedCall,
    customerAccount,
    openCustomerAuth,
  } = useApp();
  const { timeString } = useLiveClock();
  const [isCalling, setIsCalling] = useState(false);
  const navigate = useNavigate();

  const myOrdersCount = customerOrders.length;

  const activeCall = useMemo(() => {
    return (
      serviceCalls.find(
        (c) => c.table_number === activeTableNumber && c.status === 'pending'
      ) || null
    );
  }, [serviceCalls, activeTableNumber]);

  const isRecentlyAccepted = Boolean(
    !activeCall && lastResolvedCall && lastResolvedCall.tableNumber === activeTableNumber
  );

  const isEscalated = Boolean(
    activeCall && ((activeCall.call_count || 1) >= 3 || activeCall.escalated_to_admin)
  );

  const handleCallWaiter = async () => {
    if (isCalling) return;
    setIsCalling(true);
    await callWaiter();
    setTimeout(() => setIsCalling(false), 900);
  };

  return (
    <>
      <header className="sticky top-0 z-40 h-16 bg-[#173F35]/95 backdrop-blur-md border-b border-white/10 px-4 sm:px-6 lg:px-8 flex items-center">
        <div className="max-w-6xl mx-auto w-full flex items-center justify-between gap-3 min-w-0">
          {/* Brand Wordmark (Dark Oceanic Surface) */}
          <Link to={`/t/${activeTableNumber}`} className="group min-w-0 shrink">
            <BrandLogo size="sm" compact theme="dark" className="truncate" />
          </Link>

          {/* Right Action Cluster */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            {/* Clean Tabular Clock & Table */}
            <div className="hidden md:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/8 border border-white/12 text-xs sm:text-[13px] text-emerald-100">
              <Clock className="w-3.5 h-3.5 text-[#F59E0B]" />
              <span className="font-mono font-semibold tabular-nums text-white">{timeString}</span>
              <span className="text-white/25" aria-hidden="true">·</span>
              <span className="font-semibold text-[#F59E0B] tabular-nums whitespace-nowrap">
                Stol №{activeTableNumber}
              </span>
            </div>

            <div className="md:hidden inline-flex items-center px-2.5 py-1.5 rounded-full bg-white/10 border border-white/15 text-[#F59E0B] text-xs font-bold tabular-nums whitespace-nowrap">
              Stol №{activeTableNumber}
            </div>

            {/* Waiter Call Action */}
            <button
              type="button"
              onClick={handleCallWaiter}
              disabled={isCalling}
              className={`min-h-[42px] min-w-[42px] px-3 sm:px-3.5 py-2 rounded-full transition-all flex items-center justify-center gap-1.5 shrink-0 font-semibold text-xs active:scale-95 whitespace-nowrap ${
                isEscalated
                  ? 'bg-red-600 text-white hover:bg-red-700'
                  : activeCall
                  ? 'bg-amber-400 text-[#173F35] hover:bg-amber-300'
                  : isRecentlyAccepted
                  ? 'bg-emerald-500 text-[#173F35] hover:bg-emerald-400'
                  : 'bg-white/10 hover:bg-white/18 text-white border border-white/15'
              }`}
              title="Ofitsiantni chaqirish"
              aria-label="Ofitsiantni chaqirish"
            >
              {isRecentlyAccepted ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : activeCall ? (
                <BellRing className="w-4 h-4" />
              ) : (
                <Bell className="w-4 h-4 text-[#F59E0B]" />
              )}
              <span className="hidden sm:inline">
                {isCalling
                  ? 'Yuborilmoqda...'
                  : activeCall
                  ? `Chaqirildi (${activeCall.call_count || 1}x)`
                  : isRecentlyAccepted
                  ? 'Kelmoqda'
                  : 'Ofitsiant'}
              </span>
            </button>

            {/* Personal Cabinet / Cashback Button */}
            <button
              type="button"
              onClick={() => (customerAccount ? navigate('/account') : openCustomerAuth('choice'))}
              className={`min-h-[42px] px-3 sm:px-3.5 py-2 rounded-full transition-all flex items-center justify-center gap-1.5 shrink-0 text-xs font-bold active:scale-95 whitespace-nowrap ${
                customerAccount
                  ? 'bg-[#F59E0B] text-[#173F35] hover:bg-[#D97706]'
                  : 'bg-white/10 hover:bg-white/18 text-white border border-white/15'
              }`}
              title={
                customerAccount
                  ? `${customerAccount.full_name} · Keshbek: ${formatPrice(customerAccount.cashback_balance)}`
                  : 'Shaxsiy kabinet'
              }
              aria-label="Shaxsiy kabinet"
            >
              {customerAccount ? (
                <>
                  <Wallet className="w-4 h-4 shrink-0" />
                  <span className="hidden sm:inline font-mono tabular-nums">
                    {formatPrice(customerAccount.cashback_balance)}
                  </span>
                </>
              ) : (
                <>
                  <User className="w-4 h-4 shrink-0 text-[#F59E0B]" />
                  <span className="hidden sm:inline">Kabinet</span>
                </>
              )}
            </button>

            {/* 1-Tap Order History Button */}
            <button
              type="button"
              onClick={() => navigate('/orders')}
              className="relative min-h-[42px] px-3 sm:px-3.5 py-2 rounded-full bg-white/10 hover:bg-white/18 border border-white/15 text-white active:scale-95 transition-all shrink-0 flex items-center justify-center gap-1.5 text-xs font-bold whitespace-nowrap"
              title="Oldingi va faol buyurtmalar tarixi"
              aria-label="Buyurtmalar tarixi"
            >
              <Receipt className="w-4 h-4 text-[#F59E0B]" />
              <span className="hidden lg:inline">Buyurtmalar</span>
              {myOrdersCount > 0 && (
                <span className="bg-[#F59E0B] text-[#173F35] text-[10px] font-extrabold min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center shadow tabular-nums">
                  {myOrdersCount}
                </span>
              )}
            </button>

            {/* Cart Button */}
            <button
              type="button"
              onClick={() => navigate('/cart')}
              className="relative min-h-[42px] min-w-[42px] p-2 rounded-full bg-white/10 hover:bg-white/18 border border-white/15 text-white active:scale-95 transition-all shrink-0 flex items-center justify-center"
              title="Savatni ko'rish"
              aria-label="Savat"
            >
              <ShoppingBag className="w-4 h-4" />
              {cartItemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#F59E0B] text-[#173F35] text-[10px] font-extrabold min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center shadow tabular-nums">
                  {cartItemCount}
                </span>
              )}
            </button>

            {/* Circular Flag Language Switcher */}
            <LanguageSwitcher theme="dark" />
          </div>
        </div>
      </header>

      {/* Live Waiter Call Visual Status Indicator Banner */}
      <WaiterCallIndicator />
    </>
  );
};
