import React, { useEffect, useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import { BellRing, CheckCircle2, Clock, Radio, ShieldAlert, UserCheck, X } from 'lucide-react';

export const WaiterCallIndicator: React.FC = () => {
  const {
    activeTableNumber,
    serviceCalls,
    waiters,
    tables,
    callWaiter,
    lastResolvedCall,
    dismissResolvedCall,
  } = useApp();

  const [elapsedSec, setElapsedSec] = useState<number>(0);
  const [isRecalling, setIsRecalling] = useState<boolean>(false);

  const activeCall = useMemo(() => {
    return (
      serviceCalls.find(
        (c) => c.table_number === activeTableNumber && c.status === 'pending'
      ) || null
    );
  }, [serviceCalls, activeTableNumber]);

  const resolvedForThisTable = useMemo(() => {
    if (!lastResolvedCall || lastResolvedCall.tableNumber !== activeTableNumber) return null;
    return lastResolvedCall;
  }, [lastResolvedCall, activeTableNumber]);

  const assignedWaiterName = useMemo(() => {
    if (activeCall?.assigned_waiter_name) return activeCall.assigned_waiter_name;
    const assigned = waiters.find((w) => w.assigned_tables?.includes(activeTableNumber));
    if (assigned) return `${assigned.badge_id} · ${assigned.full_name}`;
    const tbl = tables.find((t) => t.table_number === activeTableNumber);
    return tbl?.assigned_waiter_name || 'Karimov Dilshod';
  }, [activeCall, waiters, tables, activeTableNumber]);

  // Live waiting timer while call is pending
  useEffect(() => {
    if (!activeCall) {
      setElapsedSec(0);
      return;
    }

    const computeElapsed = () => {
      const refTime = new Date(activeCall.last_called_at || activeCall.created_at).getTime();
      const diff = Math.max(0, Math.floor((Date.now() - refTime) / 1000));
      setElapsedSec(diff);
    };

    computeElapsed();
    const interval = setInterval(computeElapsed, 1000);
    return () => clearInterval(interval);
  }, [activeCall]);

  // Auto-clear accepted banner after 45 seconds
  useEffect(() => {
    if (!resolvedForThisTable) return;
    const timeout = setTimeout(() => {
      dismissResolvedCall();
    }, 45000);
    return () => clearTimeout(timeout);
  }, [resolvedForThisTable, dismissResolvedCall]);

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const handleRecall = async () => {
    if (isRecalling) return;
    setIsRecalling(true);
    await callWaiter();
    setTimeout(() => setIsRecalling(false), 1000);
  };

  // State 1: Active pending waiter call
  if (activeCall) {
    const count = activeCall.call_count || 1;
    const isEscalated = Boolean(activeCall.escalated_to_admin || count >= 2);
    const isBill = activeCall.type === 'bill';

    return (
      <div className="max-w-4xl mx-auto w-full px-3 sm:px-4 pt-2.5">
        <div
          role="status"
          aria-live="polite"
          className={`rounded-2xl border-2 p-3.5 shadow-md transition-all relative overflow-hidden ${
            isEscalated
              ? 'bg-red-50/95 border-red-400 text-red-950'
              : 'bg-amber-50/95 border-amber-400 text-slate-900'
          }`}
        >
          {/* Animated top progress bar */}
          <div
            className={`absolute top-0 left-0 right-0 h-1 animate-pulse ${
              isEscalated
                ? 'bg-gradient-to-r from-red-600 via-orange-500 to-red-600'
                : 'bg-gradient-to-r from-[#173F35] via-amber-500 to-[#173F35]'
            }`}
          />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Left: Live Radar Pulse + Status Details */}
            <div className="flex items-start gap-3 min-w-0">
              <div className="relative shrink-0 mt-0.5">
                <span
                  className={`animate-ping absolute inline-flex h-full w-full rounded-xl opacity-50 ${
                    isEscalated ? 'bg-red-500' : 'bg-amber-500'
                  }`}
                />
                <div
                  className={`relative w-10 h-10 rounded-xl flex items-center justify-center shadow-xs ${
                    isEscalated
                      ? 'bg-red-600 text-white'
                      : 'bg-amber-500 text-slate-950'
                  }`}
                >
                  {isEscalated ? (
                    <ShieldAlert className="w-5 h-5" />
                  ) : (
                    <BellRing className="w-5 h-5 animate-bounce" />
                  )}
                </div>
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`inline-flex items-center gap-1 text-[11px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                      isEscalated
                        ? 'bg-red-600 text-white'
                        : 'bg-[#173F35] text-amber-300'
                    }`}
                  >
                    <Radio className="w-3 h-3 animate-pulse" />
                    <span>
                      {isEscalated
                        ? `Qayta chaqiruv (${count}x)`
                        : isBill
                        ? "Hisob so'rovi faol"
                        : 'Chaqiruv faol'}
                    </span>
                  </span>

                  <span className="inline-flex items-center gap-1 text-xs font-mono font-bold tabular-nums text-slate-700 bg-white/80 border border-black/10 px-2 py-0.5 rounded-md">
                    <Clock className="w-3 h-3 text-amber-600" />
                    <span>{formatTimer(elapsedSec)}</span>
                  </span>
                </div>

                <h3 className="font-display font-bold text-sm mt-1 leading-snug">
                  {isEscalated
                    ? `Ofitsiant kelmagani uchun Adminga ham xabar yuborildi`
                    : isBill
                    ? `Hisob varaqasi so'rovi ofitsiant ekraniga yuborildi`
                    : `Ofitsiant ekraniga real vaqtda xabar yuborildi`}
                </h3>

                <div className="flex items-center gap-1.5 text-xs text-slate-700 mt-0.5 flex-wrap">
                  <UserCheck className="w-3.5 h-3.5 text-[#173F35] shrink-0" />
                  <span>Mas'ul:</span>
                  <span className="font-semibold text-[#173F35]">{assignedWaiterName}</span>
                  <span className="opacity-50">·</span>
                  <span className="font-medium">Stol №{activeTableNumber}</span>
                </div>
              </div>
            </div>

            {/* Right: Visual Steps & Recall Action */}
            <div className="flex items-center justify-between sm:justify-end gap-2.5 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-black/10">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold">
                <span className="inline-flex items-center gap-1 text-emerald-800 bg-emerald-100 px-2 py-1 rounded-lg">
                  <CheckCircle2 className="w-3 h-3" />
                  Yuborildi
                </span>
                <span className="text-slate-400">→</span>
                <span
                  className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg ${
                    isEscalated
                      ? 'bg-red-100 text-red-900'
                      : 'bg-amber-200/80 text-amber-950'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full animate-pulse ${
                      isEscalated ? 'bg-red-600' : 'bg-amber-600'
                    }`}
                  />
                  Kutilmoqda
                </span>
              </div>

              <button
                type="button"
                onClick={handleRecall}
                disabled={isRecalling}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 shrink-0 ${
                  isEscalated
                    ? 'bg-red-600 hover:bg-red-700 text-white shadow-xs'
                    : 'bg-[#173F35] hover:bg-[#235B4E] text-white shadow-xs'
                }`}
              >
                {isRecalling ? 'Yuborilmoqda...' : 'Yana chaqirish'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // State 2: Waiter accepted/resolved the call
  if (resolvedForThisTable) {
    return (
      <div className="max-w-4xl mx-auto w-full px-3 sm:px-4 pt-2.5">
        <div
          role="status"
          aria-live="polite"
          className="rounded-2xl border-2 border-emerald-500 bg-emerald-50/95 p-3.5 shadow-md flex items-center justify-between gap-3 relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-400" />
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] font-extrabold uppercase tracking-wider bg-emerald-600 text-white px-2 py-0.5 rounded-md">
                  Qabul qilindi
                </span>
                <span className="text-xs font-mono font-bold text-emerald-900">
                  Stol №{activeTableNumber}
                </span>
              </div>
              <h3 className="font-display font-bold text-sm text-emerald-950 mt-0.5">
                Ofitsiant chaqiruvingizni qabul qildi!
              </h3>
              <p className="text-xs text-emerald-800 truncate">
                {resolvedForThisTable.waiterName || assignedWaiterName} hozir stolingizga kelmoqda.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={dismissResolvedCall}
            className="p-1.5 rounded-xl text-emerald-700 hover:bg-emerald-100 transition-colors shrink-0"
            title="Yopish"
            aria-label="Yopish"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return null;
};
