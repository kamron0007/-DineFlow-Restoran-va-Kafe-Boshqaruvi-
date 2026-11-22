import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Order } from '../../types';
import { formatShortTime } from '../../utils/formatters';
import { useLiveClock } from '../../hooks/useLiveClock';
import { soundService } from '../../services/sound';
import {
  Flame,
  ChefHat,
  Volume2,
  VolumeX,
  Maximize2,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Clock,
  Bell,
  Sparkles,
  Filter,
  Sliders,
  Check,
  Zap,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const KitchenDisplayPage: React.FC = () => {
  const {
    orders,
    menuItems,
    updateOrderStatus,
    soundEnabled,
    setSoundEnabled,
    setUserRole,
    restaurantName,
    restaurantBranch,
    addToast,
  } = useApp();

  const { timeString, dateString } = useLiveClock();
  const [completedItems, setCompletedItems] = useState<Record<string, boolean>>({});
  const [, setTicker] = useState(0);

  // Delay settings and filters
  const [delayThreshold, setDelayThreshold] = useState<number>(20); // standard prep delay threshold in minutes
  const [onlyDelayedFilter, setOnlyDelayedFilter] = useState<boolean>(false);
  const [testAlertTriggered, setTestAlertTriggered] = useState<boolean>(false);

  useEffect(() => {
    document.title = 'DineFlow — Oshxona KDS (Kechikish Ogohlantirishli)';
  }, []);

  // Tick elapsed time counter every 1 second so seconds and timers update smoothly in real time
  useEffect(() => {
    const timer = setInterval(() => {
      setTicker((t) => t + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const toggleItemCheck = (itemId: string) => {
    setCompletedItems((prev) => ({
      ...prev,
      [itemId]: !prev[itemId],
    }));
  };

  // Helper to calculate exact elapsed minutes and seconds
  const getOrderTimeInfo = (isoDate: string, targetMinutes: number = 20) => {
    const diffMs = Date.now() - new Date(isoDate).getTime();
    const totalSeconds = Math.max(0, Math.floor(diffMs / 1000));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const formattedSeconds = seconds < 10 ? `0${seconds}` : `${seconds}`;
    const formattedStopwatch = `${minutes}:${formattedSeconds}`;

    let delayStatus: 'normal' | 'warning' | 'delayed';
    if (minutes >= targetMinutes) {
      delayStatus = 'delayed'; // Critical delay: turn time RED!
    } else if (minutes >= targetMinutes - 5) {
      delayStatus = 'warning'; // Amber warning: nearing limit
    } else {
      delayStatus = 'normal'; // Calm standard
    }

    const overtimeMinutes = Math.max(0, minutes - targetMinutes);

    return {
      totalSeconds,
      minutes,
      seconds,
      formattedStopwatch,
      delayStatus,
      overtimeMinutes,
    };
  };

  // Determine target preparation time for an order based on its dishes
  const getOrderTargetMinutes = (order: Order, defaultMin: number = 20) => {
    if (!order.items || order.items.length === 0) return defaultMin;
    const times = order.items.map((it) => {
      const match = menuItems.find((m) => m.id === it.menu_item_id);
      return match?.preparation_time_minutes || defaultMin;
    });
    // Target time is the max preparation time of ordered dishes
    return Math.max(defaultMin, ...times);
  };

  // Group orders into 3 columns
  const rawNewOrders = useMemo(
    () =>
      orders
        .filter((o) => o.status === 'new')
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()),
    [orders]
  );

  const rawPreparingOrders = useMemo(
    () =>
      orders
        .filter((o) => o.status === 'preparing')
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()),
    [orders]
  );

  const rawReadyOrders = useMemo(
    () =>
      orders
        .filter((o) => o.status === 'ready')
        .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()),
    [orders]
  );

  // Count delayed orders across KDS
  const delayedNewOrdersCount = useMemo(() => {
    return rawNewOrders.filter((o) => {
      const { delayStatus } = getOrderTimeInfo(o.created_at, 10);
      return delayStatus === 'delayed';
    }).length;
  }, [rawNewOrders]);

  const delayedPreparingOrdersCount = useMemo(() => {
    return rawPreparingOrders.filter((o) => {
      const target = getOrderTargetMinutes(o, delayThreshold);
      const { delayStatus } = getOrderTimeInfo(o.created_at, target);
      return delayStatus === 'delayed';
    }).length;
  }, [rawPreparingOrders, delayThreshold, menuItems]);

  const totalDelayedCount = delayedNewOrdersCount + delayedPreparingOrdersCount;

  // Sound alert test for delay warning
  const handleTestDelayAlert = () => {
    soundService.playDelayWarning();
    setTestAlertTriggered(true);
    addToast(
      'error',
      'Kechikish Ogohlantirishi (Test)',
      "Buyurtma vaqti qizil rangga o'tdi va audio ogohlantirish yangradi!"
    );
    setTimeout(() => setTestAlertTriggered(false), 5000);
  };

  // Filter orders if onlyDelayedFilter is active
  const newOrders = useMemo(() => {
    if (!onlyDelayedFilter) return rawNewOrders;
    return rawNewOrders.filter((o) => {
      const { delayStatus } = getOrderTimeInfo(o.created_at, 10);
      return delayStatus === 'delayed';
    });
  }, [rawNewOrders, onlyDelayedFilter]);

  const preparingOrders = useMemo(() => {
    if (!onlyDelayedFilter) return rawPreparingOrders;
    return rawPreparingOrders.filter((o) => {
      const target = getOrderTargetMinutes(o, delayThreshold);
      const { delayStatus } = getOrderTimeInfo(o.created_at, target);
      return delayStatus === 'delayed';
    });
  }, [rawPreparingOrders, onlyDelayedFilter, delayThreshold, menuItems]);

  const readyOrders = rawReadyOrders;

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  return (
    <div className="min-h-screen bg-[#0F172A] text-white flex flex-col font-sans select-none">
      {/* Top KDS Header */}
      <header className="h-16 px-4 sm:px-6 bg-[#1E293B] border-b border-gray-700/80 flex items-center justify-between shrink-0 shadow-md gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold shadow-sm">
            <ChefHat className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display font-black text-base sm:text-lg leading-none tracking-tight">
                {restaurantName || 'Zafaran Grand'} KDS
              </h1>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-md">
                Oshxona Ekrani
              </span>
            </div>
            <span className="text-xs text-gray-400 mt-0.5 block truncate max-w-[220px] sm:max-w-none">
              {restaurantBranch || 'Toshkent filiali'} • Real vaqt rejimi
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 flex-wrap justify-end">
          {/* Live Clock Widget */}
          <div className="flex items-center gap-2.5 bg-gray-900 px-3 py-1.5 rounded-xl border border-gray-700 font-mono text-xs shadow-inner">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400"></span>
            </span>
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden xl:inline text-gray-300 font-sans">{dateString}</span>
            <span className="text-emerald-400/50 hidden xl:inline">•</span>
            <span className="text-white font-extrabold text-xs sm:text-sm tabular-nums tracking-wider bg-black/50 px-2 py-0.5 rounded-lg border border-gray-600 shadow-inner">
              {timeString}
            </span>
          </div>

          {/* Quick status counter pills */}
          <div className="hidden lg:flex items-center gap-2.5 text-xs font-bold">
            <span className="text-red-400 flex items-center gap-1.5 bg-red-950/40 px-2.5 py-1 rounded-lg border border-red-900/60">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span>Yangi: {rawNewOrders.length}</span>
            </span>
            <span className="text-amber-400 flex items-center gap-1.5 bg-amber-950/40 px-2.5 py-1 rounded-lg border border-amber-900/60">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span>Oshxonada: {rawPreparingOrders.length}</span>
            </span>
            <span className="text-emerald-400 flex items-center gap-1.5 bg-emerald-950/40 px-2.5 py-1 rounded-lg border border-emerald-900/60">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Tayyor: {rawReadyOrders.length}</span>
            </span>
          </div>

          {/* Critical Delay Alert Badge in Header if any order is delayed */}
          {totalDelayedCount > 0 && (
            <div className="flex items-center gap-1.5 bg-red-600 text-white font-black text-xs px-3 py-1.5 rounded-xl animate-pulse shadow-md border border-red-400 ring-2 ring-red-500/50">
              <AlertTriangle className="w-4 h-4 animate-bounce" />
              <span>{totalDelayedCount} ta kechikmoqda!</span>
            </div>
          )}

          {/* Sound Toggle */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2 rounded-xl border transition-colors ${
              soundEnabled
                ? 'bg-emerald-950/60 text-emerald-400 border-emerald-500/80 shadow-xs'
                : 'bg-gray-800 text-gray-400 border-gray-600'
            }`}
            title={soundEnabled ? "Ovoz yoqilgan" : "Ovoz o'chirilgan"}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Fullscreen Toggle */}
          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-xl bg-gray-800 border border-gray-600 text-gray-300 hover:text-white hover:bg-gray-700 transition-colors"
            title="To'liq ekranga o'tish"
          >
            <Maximize2 className="w-4 h-4" />
          </button>

          {/* Quick link to Admin */}
          <button
            onClick={() => setUserRole('admin')}
            className="text-xs font-bold text-gray-300 hover:text-white bg-gray-800 hover:bg-gray-700 px-3 py-1.5 rounded-xl border border-gray-700 transition-colors"
          >
            Admin Panel
          </button>

          <Link
            to="/admin/kitchen-efficiency"
            className="text-xs font-bold text-amber-400 hover:underline hidden sm:inline"
          >
            Samaradorlik
          </Link>
        </div>
      </header>

      {/* Visual Delay Warning & Filter Bar */}
      <div className="bg-[#1E293B]/90 border-b border-gray-700 px-4 py-2.5 flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
        {/* Left: Delay Alert Notice */}
        <div className="flex items-center gap-2.5 flex-wrap w-full md:w-auto">
          {totalDelayedCount > 0 ? (
            <div className="flex items-center gap-2 text-red-400 font-bold bg-red-950/80 px-3 py-1.5 rounded-xl border border-red-500/80 animate-pulse">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
              </span>
              <AlertTriangle className="w-4 h-4 text-red-400" />
              <span>
                DIQQAT: {totalDelayedCount} ta buyurtma kechikmoqda! Tayyorlanish vaqti QIZIL rangda yonib-o'chmoqda.
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-emerald-400 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Barcha buyurtmalar belgilangan me'yoriy vaqt ichida tayyorlanmoqda.</span>
            </div>
          )}
        </div>

        {/* Right: Controls & Delay Threshold */}
        <div className="flex items-center gap-2.5 flex-wrap w-full md:w-auto justify-end">
          {/* Filter: Only Delayed */}
          <button
            onClick={() => setOnlyDelayedFilter(!onlyDelayedFilter)}
            className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all border ${
              onlyDelayedFilter
                ? 'bg-red-600 text-white border-red-500 shadow-md ring-2 ring-red-500/50'
                : 'bg-gray-800 text-gray-300 border-gray-700 hover:text-white'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            <span>
              {onlyDelayedFilter ? 'Faqat kechikkanlar faol' : `Kechikkanlarni filtrlash (${totalDelayedCount})`}
            </span>
          </button>

          {/* Delay Threshold Setting */}
          <div className="flex items-center gap-1.5 bg-gray-900 px-2.5 py-1 rounded-xl border border-gray-700">
            <Sliders className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-gray-400 text-[11px]">Kechikish me'yori:</span>
            <select
              value={delayThreshold}
              onChange={(e) => setDelayThreshold(Number(e.target.value))}
              className="bg-transparent text-amber-300 font-bold focus:outline-hidden cursor-pointer text-xs"
            >
              <option value={15} className="bg-gray-800 text-white">15 daqiqa (Tezkor)</option>
              <option value={20} className="bg-gray-800 text-white">20 daqiqa (Standart)</option>
              <option value={25} className="bg-gray-800 text-white">25 daqiqa (Kengaytirilgan)</option>
            </select>
          </div>

          {/* Test Delay Alert Button */}
          <button
            onClick={handleTestDelayAlert}
            className={`px-3 py-1 rounded-xl font-bold text-[11px] transition-all flex items-center gap-1.5 border ${
              testAlertTriggered
                ? 'bg-red-600 text-white border-red-500 animate-pulse'
                : 'bg-gray-800 hover:bg-gray-700 text-gray-300 border-gray-700'
            }`}
            title="Qizil kechikish ko'rsatkichi va ovozli ogohlantirishni sinovdan o'tkazish"
          >
            <Zap className="w-3 h-3 text-amber-400" />
            <span>Test Kechikish Signali</span>
          </button>
        </div>
      </div>

      {/* 3-Column Touchscreen Grid */}
      <main className="flex-1 p-3 sm:p-4 grid grid-cols-1 md:grid-cols-3 gap-4 overflow-hidden">
        {/* ========================================================
            COLUMN 1: YANGI BUYURTMALAR (NEW)
           ======================================================== */}
        <div className="flex flex-col bg-[#1E293B]/60 rounded-2xl border border-red-950/60 p-3 h-full overflow-hidden">
          <div className="flex items-center justify-between pb-3 mb-2 border-b border-gray-700/80 px-1">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500 ring-4 ring-red-500/20 animate-ping" />
              <h2 className="font-display font-bold text-base text-red-400 uppercase tracking-wider">
                Yangi Buyurtmalar
              </h2>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-red-500/20 text-red-300 font-bold text-xs">
              {newOrders.length}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {newOrders.map((order) => {
              const timeInfo = getOrderTimeInfo(order.created_at, 10);
              const isCriticallyDelayed = timeInfo.delayStatus === 'delayed'; // >= 10 min untouched
              const isWarning = timeInfo.delayStatus === 'warning'; // 5-9 min

              return (
                <div
                  key={order.id}
                  className={`rounded-2xl p-4 shadow-xl flex flex-col justify-between transition-all relative overflow-hidden ${
                    isCriticallyDelayed
                      ? 'bg-gradient-to-b from-red-950/70 via-gray-900 to-[#0F172A] border-2 border-red-500 shadow-[0_0_25px_rgba(239,68,68,0.35)] ring-2 ring-red-500/40'
                      : isWarning
                      ? 'bg-[#111827] border-2 border-amber-500/80 ring-1 ring-amber-500/30'
                      : 'bg-[#111827] border border-gray-800'
                  }`}
                >
                  {/* Top Critical Warning Ribbon */}
                  {isCriticallyDelayed && (
                    <div className="mb-2 py-1 px-2.5 rounded-lg bg-red-600 text-white text-[11px] font-black uppercase tracking-wider flex items-center justify-between animate-pulse shadow-md">
                      <div className="flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>QABUL QILINMAGAN - KECHIKMOQDA!</span>
                      </div>
                      <span className="font-mono">+{timeInfo.overtimeMinutes} daq</span>
                    </div>
                  )}

                  <div>
                    {/* Ticket Header */}
                    <div className="flex items-start justify-between pb-2.5 border-b border-gray-800">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-display font-black text-xl text-amber-400">
                            Stol №{order.table_number}
                          </span>
                          <span className="font-mono text-xs text-gray-400">
                            {order.order_number}
                          </span>
                        </div>
                        <span className="text-[11px] text-gray-400 mt-0.5 block">
                          Kelgan vaqti: {formatShortTime(order.created_at)}
                        </span>
                      </div>

                      {/* VIZUAL VAQT KO'RSATKICHI: Kechikganda yorqin QIZIL rangga o'tadi */}
                      <div
                        className={`px-3 py-1.5 rounded-xl text-xs font-black font-mono flex items-center gap-1.5 transition-all ${
                          isCriticallyDelayed
                            ? 'bg-red-600 text-white animate-pulse shadow-lg ring-4 ring-red-500/50 border border-red-300'
                            : isWarning
                            ? 'bg-amber-500 text-slate-950 animate-pulse border border-amber-300'
                            : 'bg-gray-800 text-emerald-400 border border-emerald-500/30'
                        }`}
                        title={
                          isCriticallyDelayed
                            ? `Kechikmoqda! Buyurtma berilganiga ${timeInfo.minutes} daqiqa bo'ldi`
                            : `Buyurtma qabul qilingan vaqt: ${timeInfo.minutes} daqiqa`
                        }
                      >
                        {isCriticallyDelayed ? (
                          <AlertTriangle className="w-3.5 h-3.5 text-white animate-bounce" />
                        ) : (
                          <Clock className="w-3.5 h-3.5" />
                        )}
                        <span>{timeInfo.formattedStopwatch} daq</span>
                      </div>
                    </div>

                    {/* Dish Checklist */}
                    <div className="py-3 space-y-2">
                      {order.items.map((it) => {
                        const checked = !!completedItems[it.id];
                        return (
                          <div
                            key={it.id}
                            onClick={() => toggleItemCheck(it.id)}
                            className={`p-2 rounded-xl cursor-pointer transition-colors flex items-start gap-2.5 ${
                              checked
                                ? 'bg-gray-800/40 opacity-50 line-through'
                                : 'bg-gray-800/80 hover:bg-gray-800'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              readOnly
                              className="mt-0.5 rounded accent-amber-500 cursor-pointer"
                            />
                            <div className="flex-1">
                              <span className="text-sm font-bold text-white block">
                                <span className="text-amber-400 mr-1.5">{it.quantity}x</span>
                                {it.item_name}
                              </span>
                              {it.item_note && (
                                <p className="text-xs text-amber-300 italic mt-0.5 font-medium">
                                  "{it.item_note}"
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}

                      {order.customer_note && (
                        <div className="p-2 rounded-xl bg-amber-950/40 border border-amber-900/60 text-xs text-amber-300 italic">
                          <span>Mijoz izohi: "{order.customer_note}"</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Advance to Preparing */}
                  <button
                    onClick={() => updateOrderStatus(order.id, 'preparing')}
                    className="w-full mt-2 py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-display font-bold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-all shadow-md"
                  >
                    <Flame className="w-4 h-4" />
                    <span>Tayyorlashni boshlash</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              );
            })}

            {newOrders.length === 0 && (
              <div className="h-48 flex flex-col items-center justify-center text-gray-500 text-xs">
                <ChefHat className="w-8 h-8 mb-2 opacity-30" />
                <span>
                  {onlyDelayedFilter ? "Kechikkan yangi buyurtmalar yo'q" : "Yangi buyurtmalar yo'q"}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* ========================================================
            COLUMN 2: TAYYORLANMOQDA (PREPARING - ASOSIY BOSQICH)
           ======================================================== */}
        <div className="flex flex-col bg-[#1E293B]/60 rounded-2xl border border-amber-950/60 p-3 h-full overflow-hidden">
          <div className="flex items-center justify-between pb-3 mb-2 border-b border-gray-700/80 px-1">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-amber-500" />
              <h2 className="font-display font-bold text-base text-amber-400 uppercase tracking-wider">
                Tayyorlanmoqda (Oshxonada)
              </h2>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold text-xs">
              {preparingOrders.length}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {preparingOrders.map((order) => {
              const targetTime = getOrderTargetMinutes(order, delayThreshold);
              const timeInfo = getOrderTimeInfo(order.created_at, targetTime);
              const isCriticallyDelayed = timeInfo.delayStatus === 'delayed'; // Overdue: Time turns RED!
              const isWarning = timeInfo.delayStatus === 'warning'; // 15-19 min: Amber

              // Count checked items
              const totalItems = order.items.length;
              const completedCount = order.items.filter((it) => !!completedItems[it.id]).length;

              return (
                <div
                  key={order.id}
                  className={`rounded-2xl p-4 shadow-xl flex flex-col justify-between transition-all relative overflow-hidden ${
                    isCriticallyDelayed
                      ? 'bg-gradient-to-b from-red-950/80 via-[#181d29] to-[#0F172A] border-2 border-red-500 shadow-[0_0_30px_rgba(239,68,68,0.4)] ring-2 ring-red-500/50'
                      : isWarning
                      ? 'bg-[#111827] border-2 border-amber-400 ring-1 ring-amber-400/40'
                      : 'bg-[#111827] border border-gray-800'
                  }`}
                >
                  {/* Top Critical Warning Ribbon */}
                  {isCriticallyDelayed && (
                    <div className="mb-2 py-1 px-3 rounded-lg bg-red-600 text-white text-[11px] font-black uppercase tracking-wider flex items-center justify-between animate-pulse shadow-md">
                      <div className="flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-white animate-bounce" />
                        <span>⚠️ KECHIKMOQDA (+{timeInfo.overtimeMinutes} daqiqa oshib ketdi)</span>
                      </div>
                      <span className="font-mono bg-black/30 px-1.5 py-0.5 rounded">
                        ME'YOR: {targetTime} daq
                      </span>
                    </div>
                  )}

                  {/* Warning Ribbon if approaching limit */}
                  {isWarning && (
                    <div className="mb-2 py-0.5 px-2.5 rounded-lg bg-amber-500 text-slate-950 text-[10px] font-bold uppercase tracking-wider flex items-center justify-between">
                      <span>⚡ Me'yoriy vaqt tugashiga oz qoldi</span>
                      <span className="font-mono">Me'yor: {targetTime} daq</span>
                    </div>
                  )}

                  <div>
                    {/* Header */}
                    <div className="flex items-start justify-between pb-2.5 border-b border-gray-800">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-display font-black text-xl text-amber-400">
                            Stol №{order.table_number}
                          </span>
                          <span className="font-mono text-xs text-gray-400">
                            {order.order_number}
                          </span>
                        </div>
                        <span className="text-[11px] text-gray-400 mt-0.5 block">
                          Oshxonaga berildi: {formatShortTime(order.updated_at)}
                        </span>
                      </div>

                      {/* VIZUAL VAQT KO'RSATKICHI: KECHIKGANDA YORQIN QIZIL RANGGA O'TADI */}
                      <div
                        className={`px-3 py-1.5 rounded-xl text-xs font-black font-mono flex items-center gap-1.5 transition-all shadow-md ${
                          isCriticallyDelayed
                            ? 'bg-red-600 text-white animate-pulse ring-4 ring-red-500/50 border border-red-300'
                            : isWarning
                            ? 'bg-amber-500 text-slate-950 animate-pulse border border-amber-300'
                            : 'bg-gray-800 text-emerald-400 border border-emerald-500/30'
                        }`}
                        title={
                          isCriticallyDelayed
                            ? `Kechikmoqda! Belgilangan me'yor ${targetTime} daqiqa edi`
                            : `Tayyorlanish vaqti: ${timeInfo.minutes} daqiqa`
                        }
                      >
                        {isCriticallyDelayed ? (
                          <AlertTriangle className="w-3.5 h-3.5 text-white animate-bounce" />
                        ) : (
                          <Clock className="w-3.5 h-3.5" />
                        )}
                        <span>{timeInfo.formattedStopwatch} daq</span>
                        {isCriticallyDelayed && (
                          <span className="text-[10px] bg-black/40 px-1 py-0.2 rounded font-sans uppercase">
                            Kechikish
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Progress Bar of Completed Items */}
                    <div className="py-2 flex items-center justify-between text-[11px] text-gray-400">
                      <span>Tayyorlangan taomlar:</span>
                      <span className="font-mono font-bold text-amber-300">
                        {completedCount}/{totalItems}
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden mb-2">
                      <div
                        className="h-full bg-emerald-500 transition-all duration-300"
                        style={{
                          width: `${totalItems > 0 ? (completedCount / totalItems) * 100 : 0}%`,
                        }}
                      />
                    </div>

                    {/* Dish Checklist */}
                    <div className="py-1 space-y-2">
                      {order.items.map((it) => {
                        const checked = !!completedItems[it.id];
                        const menuItem = menuItems.find((m) => m.id === it.menu_item_id);
                        const itemPrepTime = menuItem?.preparation_time_minutes;

                        return (
                          <div
                            key={it.id}
                            onClick={() => toggleItemCheck(it.id)}
                            className={`p-2 rounded-xl cursor-pointer transition-colors flex items-start gap-2.5 ${
                              checked
                                ? 'bg-gray-800/40 opacity-50 line-through'
                                : 'bg-gray-800/80 hover:bg-gray-800'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              readOnly
                              className="mt-0.5 rounded accent-emerald-500 cursor-pointer"
                            />
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-bold text-white block">
                                  <span className="text-amber-400 mr-1.5">{it.quantity}x</span>
                                  {it.item_name}
                                </span>
                                {itemPrepTime && (
                                  <span className="text-[10px] font-mono text-gray-400">
                                    ~{itemPrepTime}m
                                  </span>
                                )}
                              </div>
                              {it.item_note && (
                                <p className="text-xs text-amber-300 italic mt-0.5 font-medium">
                                  "{it.item_note}"
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Mark as Ready Button */}
                  <div className="flex items-center gap-2 mt-3 pt-2 border-t border-gray-800/80">
                    <button
                      onClick={() => updateOrderStatus(order.id, 'new')}
                      className="p-3 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-400 transition-colors"
                      title="Qayta yangiga o'tkazish"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => updateOrderStatus(order.id, 'ready')}
                      className={`flex-1 py-3 px-4 rounded-xl font-display font-bold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-all shadow-md ${
                        isCriticallyDelayed
                          ? 'bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black'
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      }`}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Tayyor (Zalga chaqirish)</span>
                    </button>
                  </div>
                </div>
              );
            })}

            {preparingOrders.length === 0 && (
              <div className="h-48 flex flex-col items-center justify-center text-gray-500 text-xs">
                <span>
                  {onlyDelayedFilter ? "Kechikkan taomlar mavjud emas" : "Hozirda pishirilayotgan taom yo'q"}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* ========================================================
            COLUMN 3: TAYYOR (READY - OFITSIANT KUTMOQDA)
           ======================================================== */}
        <div className="flex flex-col bg-[#1E293B]/60 rounded-2xl border border-emerald-950/60 p-3 h-full overflow-hidden">
          <div className="flex items-center justify-between pb-3 mb-2 border-b border-gray-700/80 px-1">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500" />
              <h2 className="font-display font-bold text-base text-emerald-400 uppercase tracking-wider">
                Tayyor (Olib ketish kutilmoqda)
              </h2>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-xs">
              {readyOrders.length}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {readyOrders.map((order) => {
              const readyTimeInfo = getOrderTimeInfo(order.updated_at, 5); // Warning if ready > 5 min without pickup
              const isWaitingLong = readyTimeInfo.minutes >= 5;

              return (
                <div
                  key={order.id}
                  className={`rounded-2xl p-4 shadow-xl flex flex-col justify-between transition-all ${
                    isWaitingLong
                      ? 'bg-[#111827] border-2 border-amber-400/80 shadow-[0_0_20px_rgba(245,158,11,0.2)]'
                      : 'bg-[#111827] border border-emerald-900/60'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between pb-2.5 border-b border-gray-800">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-display font-black text-xl text-emerald-400">
                            Stol №{order.table_number}
                          </span>
                          <span className="font-mono text-xs text-gray-400">
                            {order.order_number}
                          </span>
                        </div>
                        <span className="text-[11px] text-gray-400 mt-0.5 block">
                          Tayyor bo'ldi: {formatShortTime(order.updated_at)}
                        </span>
                      </div>

                      <div
                        className={`px-2.5 py-1 rounded-xl text-xs font-bold font-mono flex items-center gap-1 ${
                          isWaitingLong
                            ? 'bg-amber-500 text-slate-950 animate-pulse'
                            : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                        }`}
                      >
                        <Clock className="w-3 h-3" />
                        <span>{readyTimeInfo.formattedStopwatch} daq</span>
                      </div>
                    </div>

                    {isWaitingLong && (
                      <div className="mt-2 p-1.5 rounded-lg bg-amber-500/20 border border-amber-500/40 text-[10px] text-amber-300 font-bold flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 shrink-0" />
                        <span>Ofitsiant olib ketishi kechikmoqda!</span>
                      </div>
                    )}

                    <div className="py-3 space-y-1">
                      {order.items.map((it) => (
                        <div key={it.id} className="text-xs text-gray-300">
                          <strong className="text-white">{it.quantity}x</strong> {it.item_name}
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => updateOrderStatus(order.id, 'delivered')}
                    className="w-full mt-2 py-3 px-4 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-200 font-display font-bold text-xs flex items-center justify-center gap-1.5 transition-colors border border-gray-700 active:scale-95"
                  >
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>Mijozga yetkazildi (Yopish)</span>
                  </button>
                </div>
              );
            })}

            {readyOrders.length === 0 && (
              <div className="h-48 flex flex-col items-center justify-center text-gray-500 text-xs">
                <span>Barcha tayyor taomlar tarqatilgan</span>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};
