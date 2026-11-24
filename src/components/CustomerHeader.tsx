import React, { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import { useLiveClock } from '../hooks/useLiveClock';
import { Bell, BellRing, CheckCircle2, ShoppingBag, Clock } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { BrandLogo } from './BrandLogo';
import { WaiterCallIndicator } from './WaiterCallIndicator';

export const CustomerHeader: React.FC = () => {
  const {
    activeTableNumber,
    callWaiter,
    cartItemCount,
    serviceCalls,
    lastResolvedCall,
  } = useApp();
  const { timeString } = useLiveClock();
  const [isCalling, setIsCalling] = useState(false);
  const navigate = useNavigate();

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
    activeCall && ((activeCall.call_count || 1) >= 2 || activeCall.escalated_to_admin)
  );

  const handleCallWaiter = async () => {
    if (isCalling) return;
    setIsCalling(true);
    await callWaiter();
    setTimeout(() => setIsCalling(false), 900);
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-[#FAF8F3]/95 backdrop-blur-md border-b border-[#E5E0D8] px-3 sm:px-4 py-2.5 sm:py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-2 min-w-0">
          {/* Brand Wordmark */}
          <Link to={`/t/${activeTableNumber}`} className="group min-w-0 shrink">
            <BrandLogo size="sm" compact className="truncate" />
          </Link>

          {/* Locked Table Badge, Real-time Clock & Customer Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Live Clock Badge */}
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#173F35] text-white text-xs font-mono shadow-sm border border-[#235B4E]">
              <Clock className="w-3.5 h-3.5 text-emerald-300" />
              <span className="font-bold tabular-nums tracking-wide text-xs">{timeString}</span>
            </div>

            {/* Locked Scanned Table Badge */}
            <div
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#173F35] text-white text-xs font-semibold shadow-sm shrink-0"
              title={`Stol №${activeTableNumber}`}
            >
              <span className="font-bold tabular-nums">Stol №{activeTableNumber}</span>
            </div>

            {/* Call Waiter Quick Action with Live Status Indicator */}
            <button
              type="button"
              onClick={handleCallWaiter}
              disabled={isCalling}
              className={`relative min-h-[44px] min-w-[44px] px-3 py-2 rounded-full transition-all flex items-center justify-center gap-1.5 shrink-0 font-bold text-xs shadow-sm active:scale-95 ${
                isEscalated
                  ? 'bg-red-600 text-white hover:bg-red-700 ring-2 ring-red-400/50'
                  : activeCall
                  ? 'bg-amber-500 text-slate-950 hover:bg-amber-600 ring-2 ring-amber-400/50'
                  : isRecentlyAccepted
                  ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                  : 'bg-amber-100 text-amber-900 hover:bg-amber-200 border border-amber-300/70'
              }`}
              title="Ofitsiantni chaqirish"
              aria-label="Ofitsiantni chaqirish"
            >
              {activeCall && (
                <span className="relative flex h-2 w-2">
                  <span
                    className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                      isEscalated ? 'bg-white' : 'bg-[#173F35]'
                    }`}
                  />
                  <span
                    className={`relative inline-flex rounded-full h-2 w-2 ${
                      isEscalated ? 'bg-white' : 'bg-[#173F35]'
                    }`}
                  />
                </span>
              )}

              {isRecentlyAccepted ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : activeCall ? (
                <BellRing className="w-4 h-4 animate-bounce" />
              ) : (
                <Bell className="w-4 h-4" />
              )}

              <span className="hidden sm:inline whitespace-nowrap">
                {isCalling
                  ? 'Yuborilmoqda...'
                  : activeCall
                  ? `Chaqirildi (${activeCall.call_count || 1}x)`
                  : isRecentlyAccepted
                  ? 'Kelmoqda'
                  : 'Ofitsiant'}
              </span>
            </button>

            {/* Cart Button */}
            <button
              type="button"
              onClick={() => navigate('/cart')}
              className="relative min-h-[44px] min-w-[44px] p-2 rounded-full bg-white border border-[#E5E0D8] text-[#173F35] hover:bg-[#FAF8F3] active:scale-95 transition-all shadow-sm shrink-0 flex items-center justify-center"
              title="Savatni ko'rish"
              aria-label="Savat"
            >
              <ShoppingBag className="w-4 h-4 text-[#173F35]" />
              {cartItemCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-amber-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow tabular-nums">
                  {cartItemCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Live Waiter Call Visual Status Indicator Banner */}
      <WaiterCallIndicator />
    </>
  );
};
