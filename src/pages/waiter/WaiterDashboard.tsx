import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { formatUZS, formatTimeAgo, formatShortTime, ORDER_STATUS_MAP } from '../../utils/formatters';
import { Order, OrderStatus } from '../../types';
import { useLiveClock } from '../../hooks/useLiveClock';
import {
  Bell,
  BellRing,
  CheckCircle2,
  Clock,
  Receipt,
  UtensilsCrossed,
  Volume2,
  VolumeX,
  X,
  Eye,
  Check,
  ChefHat,
  HandPlatter,
  Users,
  Phone,
  ShieldCheck,
  Wallet,
  Pencil,
  UserPlus,
  LogOut,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { OrderTickBadge } from '../../components/OrderTickBadge';
import { soundService } from '../../services/sound';

export const WaiterDashboard: React.FC = () => {
  const {
    orders,
    tables,
    serviceCalls,
    waiters,
    resolveServiceCall,
    updateOrderStatus,
    settleAndFreeTable,
    soundEnabled,
    setSoundEnabled,
    audioUnlocked,
    unlockAudio,
    simulateWaiterNotification,
    restaurantName,
    restaurantBranch,
    activeStaffAccount,
    staffAccounts,
    openStaffAccountModal,
    logoutStaffAccount,
  } = useApp();
  const navigate = useNavigate();

  const activeWaiterAccount =
    (activeStaffAccount?.role === 'waiter' ? activeStaffAccount : null) ||
    staffAccounts.find((a) => a.role === 'waiter') ||
    null;

  const { timeString, dateString } = useLiveClock();

  const newOrders = useMemo(() => {
    return orders.filter((o) => o.status === 'new');
  }, [orders]);

  useEffect(() => {
    if (newOrders.length > 0) {
      document.title = `🔔 (${newOrders.length}) Yangi buyurtma! — Ofitsiant Terminali`;
    } else {
      document.title = 'DineFlow — Ofitsiant Terminali (/waiter)';
    }
  }, [newOrders.length]);

  // If entering /waiter while a brand-new (< 2 min) unaccepted order exists and audio is unlocked, chime once
  const hasPlayedInitialFreshChimeRef = React.useRef(false);
  useEffect(() => {
    if (hasPlayedInitialFreshChimeRef.current || !soundEnabled || !audioUnlocked) return;
    const hasFreshOrder = newOrders.some((o) => {
      const createdMs = new Date(o.created_at).getTime();
      return !Number.isNaN(createdMs) && Date.now() - createdMs < 2 * 60 * 1000;
    });
    if (hasFreshOrder) {
      hasPlayedInitialFreshChimeRef.current = true;
      soundService.playNewOrderChime();
    }
  }, [newOrders, soundEnabled, audioUnlocked]);

  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedTableFilter, setSelectedTableFilter] = useState<number | 'all'>('all');
  const [inspectOrder, setInspectOrder] = useState<Order | null>(null);

  const [activeWaiterId, setActiveWaiterId] = useState<string>(() => {
    return localStorage.getItem('dineflow_active_waiter_id') || (waiters[0]?.id || 'waiter-1');
  });
  const [filterMyTablesOnly, setFilterMyTablesOnly] = useState<boolean>(false);

  const activeWaiter = useMemo(() => {
    return waiters.find((w) => w.id === activeWaiterId) || waiters[0];
  }, [waiters, activeWaiterId]);

  const handleSelectWaiter = (id: string) => {
    setActiveWaiterId(id);
    localStorage.setItem('dineflow_active_waiter_id', id);
  };

  // Filter orders
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const matchStatus = statusFilter === 'all' || o.status === statusFilter;
      const matchTable = selectedTableFilter === 'all' || o.table_number === selectedTableFilter;
      const matchMyTables =
        !filterMyTablesOnly ||
        (activeWaiter?.assigned_tables && activeWaiter.assigned_tables.includes(o.table_number));
      return matchStatus && matchTable && matchMyTables;
    });
  }, [orders, statusFilter, selectedTableFilter, filterMyTablesOnly, activeWaiter]);

  // Pending service calls
  const pendingCalls = useMemo(() => {
    return serviceCalls.filter((c) => c.status === 'pending');
  }, [serviceCalls]);

  // Counts
  const newOrdersCount = newOrders.length;
  const readyOrdersCount = orders.filter((o) => o.status === 'ready').length;

  return (
    <div className="min-h-screen bg-[#FAF8F3] text-[#202622] flex flex-col">
      {/* Deep Oceanic Teal Top Bar for Waiter Terminal */}
      <header className="sticky top-0 z-40 bg-[#173F35] text-white border-b border-white/10 px-4 sm:px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#F59E0B] text-[#173F35] flex items-center justify-center font-bold shadow-[0_6px_18px_-6px_rgba(245,158,11,0.6)]">
              <UtensilsCrossed className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-display font-extrabold text-lg text-white leading-none">
                  Ofitsiant Terminali
                </h1>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#F59E0B]">
                  · Zal smenasi
                </span>
              </div>
              <p className="text-xs text-emerald-100/70 mt-0.5">
                {restaurantName || 'Zafaran Grand'} — {restaurantBranch || 'Toshkent'}
              </p>
            </div>
          </div>

          {/* Clean Real-Time Clock Widget */}
          <div className="flex items-center gap-2 bg-white/8 text-white px-3.5 py-1.5 rounded-full border border-white/14">
            <Clock className="w-4 h-4 text-[#F59E0B]" />
            <div className="flex items-center gap-2 font-mono">
              <span className="hidden sm:inline text-xs font-sans text-emerald-100/80 font-medium">
                {dateString}
              </span>
              <span className="text-white/25 hidden sm:inline">·</span>
              <span className="font-extrabold text-sm sm:text-base text-[#F59E0B] tabular-nums tracking-wider">
                {timeString}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap justify-end">
            {/* Quick alert tester */}
            <div className="hidden xl:flex items-center gap-1.5 bg-white/6 p-1 rounded-full border border-white/12 text-xs">
              <button
                type="button"
                onClick={() => simulateWaiterNotification('new_order')}
                className="bg-[#F59E0B]/25 hover:bg-[#F59E0B]/35 text-amber-200 font-semibold px-3 py-1 rounded-full flex items-center gap-1 transition-all active:scale-95 text-[11px]"
                title="Yangi buyurtma ovozli bildirishnomasini tekshirish"
              >
                <HandPlatter className="w-3.5 h-3.5 text-[#F59E0B]" />
                <span>Buyurtma</span>
              </button>
              <button
                type="button"
                onClick={() => simulateWaiterNotification('kitchen_ready')}
                className="bg-white/10 hover:bg-white/18 text-emerald-50 font-semibold px-3 py-1 rounded-full flex items-center gap-1 transition-all active:scale-95 text-[11px]"
                title="Oshxona buyurtmasi tayyor bo'lganini bildirishnoma orqali tekshirish"
              >
                <ChefHat className="w-3.5 h-3.5 text-[#F59E0B]" />
                <span>Oshxona</span>
              </button>
              <button
                type="button"
                onClick={() => simulateWaiterNotification('customer_call')}
                className="bg-amber-400/20 hover:bg-amber-400/30 text-amber-200 font-semibold px-3 py-1 rounded-full flex items-center gap-1 transition-all active:scale-95 text-[11px]"
                title="Mijoz ofitsiantni chaqirganini bildirishnoma orqali tekshirish"
              >
                <Bell className="w-3.5 h-3.5 text-amber-300" />
                <span>Chaqiruv</span>
              </button>
            </div>

            {/* Sound toggle */}
            <button
              type="button"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-2 rounded-full border border-white/14 text-emerald-100 hover:text-white bg-white/8 hover:bg-white/14 transition-colors"
              title={soundEnabled ? "Ovozni o'chirish" : 'Ovozni yoqish'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-[#F59E0B]" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Role login links & Logout */}
            <div className="flex items-center gap-1 bg-white/8 p-1 rounded-full border border-white/14 text-xs">
              <button
                type="button"
                onClick={() => {
                  logoutStaffAccount();
                  navigate('/login?role=admin');
                }}
                className="px-2.5 py-1 rounded-full text-emerald-100/80 hover:text-white hover:bg-white/10"
              >
                Admin
              </button>
              <button
                type="button"
                onClick={() => {
                  logoutStaffAccount();
                  navigate('/login?role=kitchen');
                }}
                className="px-2.5 py-1 rounded-full text-emerald-100/80 hover:text-white hover:bg-white/10"
              >
                KDS
              </button>
              <Link
                to="/menu"
                className="px-2.5 py-1 rounded-full text-emerald-100/80 hover:text-white hover:bg-white/10"
              >
                Menyu
              </Link>
              <button
                type="button"
                onClick={() => {
                  logoutStaffAccount();
                  navigate('/login?role=waiter');
                }}
                className="px-2.5 py-1 rounded-full text-red-200 hover:text-white hover:bg-red-500/25 font-semibold flex items-center gap-1"
                title="Tizimdan chiqish"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Chiqish</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 space-y-5">
        {/* Active Waiter Profile Bar */}
        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-[#E5E0D8] shadow-[0_8px_28px_-18px_rgba(23,63,53,0.14)] flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-[#173F35] text-[#F59E0B] flex flex-col items-center justify-center font-bold shrink-0">
              <span className="text-[9px] uppercase tracking-wider opacity-75">ID</span>
              <span className="text-xs font-mono font-extrabold">{activeWaiter?.badge_id || 'OF-01'}</span>
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-[#737A75] font-semibold">Smenadagi ofitsiant:</span>
                <span className="font-display font-bold text-sm text-[#173F35]">
                  {activeWaiter?.full_name || 'Karimov Dilshod Baxtiyorovich'}
                </span>
                <span className="text-[10px] font-bold text-[#1E5245]">
                  · {activeWaiter?.role_title || 'Ofitsiant'}
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-[#737A75] font-mono mt-0.5 flex-wrap">
                <span className="flex items-center gap-1">
                  <Phone className="w-3 h-3 text-[#1E5245]" />
                  <span>{activeWaiter?.phone || '+998 90 123 45 67'}</span>
                </span>
                {activeWaiter?.jshir && (
                  <span className="flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-[#1E5245]" />
                    <span>JSHIR: {activeWaiter.jshir}</span>
                  </span>
                )}
                {activeWaiter?.assigned_tables && activeWaiter.assigned_tables.length > 0 && (
                  <span className="text-[#173F35] font-sans font-semibold">
                    Stollar: {activeWaiter.assigned_tables.map((t) => `№${t}`).join(', ')}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {waiters.length > 1 && (
              <select
                value={activeWaiterId}
                onChange={(e) => handleSelectWaiter(e.target.value)}
                className="px-3.5 py-2 bg-[#FAF8F3] border border-[#E5E0D8] rounded-full text-xs font-bold text-[#173F35] focus:outline-none focus:border-[#173F35]"
              >
                {waiters.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.badge_id} — {w.full_name}
                  </option>
                ))}
              </select>
            )}

            {activeWaiter?.assigned_tables && activeWaiter.assigned_tables.length > 0 && (
              <button
                type="button"
                onClick={() => setFilterMyTablesOnly(!filterMyTablesOnly)}
                className={`px-3.5 py-2 rounded-full text-xs font-bold transition-all border ${
                  filterMyTablesOnly
                    ? 'bg-[#173F35] text-white border-[#173F35]'
                    : 'bg-[#FAF8F3] text-[#59635E] border-[#E5E0D8] hover:text-[#173F35]'
                }`}
              >
                {filterMyTablesOnly ? '✓ Mening stollarim' : 'Mening stollarim'}
              </button>
            )}

            <button
              type="button"
              onClick={() => openStaffAccountModal(activeWaiterAccount, 'waiter')}
              className="px-3.5 py-2 rounded-full bg-[#E8F0EC] hover:bg-[#DCE8E2] border border-[#F59E0B]/40 text-xs font-bold text-[#173F35] flex items-center gap-1.5 transition-all"
              title="Ofitsiant akkauntini tahrirlash"
            >
              <Pencil className="w-3.5 h-3.5" />
              <span>Tahrirlash</span>
            </button>

            <button
              type="button"
              onClick={() => openStaffAccountModal(null, 'waiter')}
              className="px-3.5 py-2 rounded-full bg-[#173F35] hover:bg-[#1E5245] text-xs font-bold text-white flex items-center gap-1.5 transition-all"
              title="Yangi ofitsiant akkaunti yaratish"
            >
              <UserPlus className="w-3.5 h-3.5 text-[#F59E0B]" />
              <span>+ Akkaunt</span>
            </button>

            <Link
              to="/admin/waiters"
              className="px-3.5 py-2 rounded-full bg-[#FAF8F3] hover:bg-[#EFEAE0] border border-[#E5E0D8] text-xs font-bold text-[#173F35] flex items-center gap-1.5 transition-all"
            >
              <Users className="w-3.5 h-3.5 text-[#1E5245]" />
              <span>Xodimlar</span>
            </Link>
          </div>
        </div>

        {/* Browser Autoplay Audio Unlock Prompt (guarantees audible incoming order chime on Vercel/mobile) */}
        {soundEnabled && !audioUnlocked && (
          <div className="bg-amber-50 border-2 border-[#F59E0B] p-4 rounded-2xl shadow-sm flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#F59E0B] text-[#173F35] flex items-center justify-center shrink-0">
                <Volume2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-display font-bold text-sm text-[#173F35]">
                  Ovozli bildirishnomani faollashtiring
                </h3>
                <p className="text-xs text-[#59635E] mt-0.5">
                  Yangi buyurtma kelganda qo&apos;ng&apos;iroq ovozi va bildirishnoma ishlashi uchun tugmani bir marta bosing.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                void unlockAudio(true);
              }}
              className="px-4 py-2.5 rounded-xl bg-[#173F35] hover:bg-[#1E5245] active:scale-95 text-white font-display font-bold text-xs flex items-center gap-2 shadow-sm transition-all"
            >
              <BellRing className="w-4 h-4 text-[#F59E0B]" />
              <span>Ovozni yoqish va tekshirish</span>
            </button>
          </div>
        )}

        {/* Prominent Incoming New Orders Strip (Always visible regardless of table/status filter) */}
        {newOrders.length > 0 && (
          <div className="bg-[#173F35] text-white rounded-3xl p-4 sm:p-5 border-2 border-[#F59E0B] shadow-[0_14px_34px_-14px_rgba(23,63,53,0.45)] space-y-3">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#F59E0B] text-[#173F35] flex items-center justify-center shrink-0 animate-bounce">
                  <BellRing className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="font-display font-extrabold text-base text-white">
                      Yangi buyurtmalar keldi ({newOrders.length})
                    </h2>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#F59E0B] text-[#173F35]">
                      Qabul qilish kutilmoqda
                    </span>
                  </div>
                  <p className="text-xs text-emerald-100/80 mt-0.5">
                    Mijoz buyurtmani tasdiqlashingizni kutmoqda (✓ → ✓✓).
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setStatusFilter('new');
                  setSelectedTableFilter('all');
                  setFilterMyTablesOnly(false);
                }}
                className="text-xs font-bold text-[#F59E0B] hover:text-amber-200 underline underline-offset-4"
              >
                Barcha yangi buyurtmalarni ko&apos;rish
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {newOrders.slice(0, 6).map((ord) => (
                <div
                  key={ord.id}
                  className="bg-white/10 border border-white/15 rounded-2xl p-3.5 flex items-center justify-between gap-3 flex-wrap"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="bg-[#F59E0B] text-[#173F35] font-mono font-black text-xs px-2.5 py-0.5 rounded-lg tabular-nums">
                        STOL №{ord.table_number}
                      </span>
                      <span className="font-mono text-xs font-bold text-emerald-100">
                        {ord.order_number}
                      </span>
                      <span className="text-[11px] text-emerald-100/70">
                        · {formatTimeAgo(ord.created_at)}
                      </span>
                    </div>
                    <p className="text-xs text-white/95 font-medium mt-1.5 truncate">
                      {ord.items.map((it) => `${it.quantity}x ${it.item_name}`).join(', ')}
                    </p>
                    <span className="text-xs font-mono font-bold text-[#F59E0B] mt-0.5 block tabular-nums">
                      {formatUZS(ord.total_amount)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => setInspectOrder(ord)}
                      className="px-3 py-2 rounded-xl bg-white/12 hover:bg-white/20 text-white text-xs font-bold transition-colors"
                    >
                      Chek
                    </button>
                    <button
                      type="button"
                      onClick={() => updateOrderStatus(ord.id, 'preparing')}
                      className="px-3.5 py-2 rounded-xl bg-[#F59E0B] hover:bg-amber-400 active:scale-95 text-[#173F35] text-xs font-extrabold flex items-center gap-1.5 shadow-sm transition-all"
                    >
                      <Check className="w-4 h-4" />
                      <span>Qabul qilish</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Real-time Toast Alerts Status Banner */}
        <div className="bg-white p-3.5 rounded-2xl border border-[#E5E0D8] flex items-center justify-between gap-3 flex-wrap text-xs">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-bold text-[#173F35]">Jonli bildirishnomalar faol:</span>
              <span className="text-[#59635E]">
                Mijoz buyurtma berganda, chaqirganda yoki taom tayyor bo&apos;lganda real vaqtda ovozli ogohlantirish chiqadi.
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => simulateWaiterNotification('new_order')}
              className="bg-[#173F35] hover:bg-[#1E5245] text-white font-bold px-3 py-1.5 rounded-full flex items-center gap-1 transition-all active:scale-95 text-[11px]"
            >
              <HandPlatter className="w-3.5 h-3.5 text-[#F59E0B]" />
              <span>Yangi buyurtma testi</span>
            </button>
            <button
              type="button"
              onClick={() => simulateWaiterNotification('kitchen_ready')}
              className="bg-[#FAF8F3] hover:bg-[#E8F0EC] text-[#173F35] font-bold px-3 py-1.5 rounded-full border border-[#E5E0D8] flex items-center gap-1 transition-all active:scale-95 text-[11px]"
            >
              <ChefHat className="w-3.5 h-3.5 text-[#1E5245]" />
              <span>Tayyor taom testi</span>
            </button>
            <button
              type="button"
              onClick={() => simulateWaiterNotification('customer_call')}
              className="bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold px-3 py-1.5 rounded-full border border-amber-200 flex items-center gap-1 transition-all active:scale-95 text-[11px]"
            >
              <Bell className="w-3.5 h-3.5 text-amber-600" />
              <span>Mijoz chaqiruvi testi</span>
            </button>
          </div>
        </div>

        {/* Urgent Service Calls Strip */}
        {pendingCalls.length > 0 && (
          <div className="space-y-2">
            {pendingCalls.map((call) => {
              const count = call.call_count || 1;
              const isEscalated = count >= 2 || call.escalated_to_admin;
              return (
                <div
                  key={call.id}
                  className={`${
                    isEscalated
                      ? 'bg-red-600 text-white border-2 border-red-300'
                      : 'bg-amber-500 text-slate-950'
                  } p-3.5 rounded-2xl shadow-md flex items-center justify-between flex-wrap gap-3 animate-pulse`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        isEscalated ? 'bg-white text-red-600' : 'bg-slate-950 text-amber-400'
                      }`}
                    >
                      <Bell className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-display font-bold text-sm">
                          Stol №{call.table_number}:{' '}
                          {call.type === 'bill' ? "Hisob-kitob so'radi" : 'Ofitsiantni chaqirdi!'}
                        </h3>
                        <span
                          className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md uppercase ${
                            isEscalated
                              ? 'bg-amber-300 text-slate-950'
                              : 'bg-slate-950 text-amber-300'
                          }`}
                        >
                          {isEscalated
                            ? `${count}-marta chaqiruv • Adminga xabar ketdi!`
                            : '1-chaqiruv (Faqat Ofitsiantga)'}
                        </span>
                      </div>
                      <p
                        className={`text-xs font-medium mt-0.5 ${
                          isEscalated ? 'text-red-100' : 'text-slate-900/80'
                        }`}
                      >
                        {call.note} • {formatTimeAgo(call.last_called_at || call.created_at)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {call.type === 'bill' && (
                      <button
                        onClick={async () => {
                          await settleAndFreeTable(call.table_number);
                          await resolveServiceCall(call.id);
                        }}
                        className="px-3.5 py-2 rounded-xl bg-emerald-800 text-white font-display font-bold text-xs hover:bg-emerald-900 transition-colors shadow-sm flex items-center gap-1.5"
                        title="To'lovni qabul qilib stolni darhol bo'shatish"
                      >
                        <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                        <span>To'lov olindi & Bo'shatish</span>
                      </button>
                    )}
                    <button
                      onClick={() => resolveServiceCall(call.id)}
                      className="px-4 py-2 rounded-xl bg-slate-950 text-white font-display font-bold text-xs hover:bg-slate-900 transition-colors shadow-sm flex items-center gap-1.5"
                    >
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span>Xizmat ko'rsatildi (Yopish)</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Stats Quick Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white p-4 rounded-2xl border border-[#E5E0D8] shadow-xs">
            <span className="text-xs text-[#737A75] font-medium block">Yangi buyurtmalar</span>
            <span className="font-display font-bold text-2xl text-red-600 mt-1 block">
              {newOrdersCount}
            </span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-[#E5E0D8] shadow-xs">
            <span className="text-xs text-[#737A75] font-medium block">Zalga tayyor taomlar</span>
            <span className="font-display font-bold text-2xl text-emerald-700 mt-1 block">
              {readyOrdersCount}
            </span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-[#E5E0D8] shadow-xs">
            <span className="text-xs text-[#737A75] font-medium block">Faol chaqiruvlar</span>
            <span className="font-display font-bold text-2xl text-amber-600 mt-1 block">
              {pendingCalls.length}
            </span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-[#E5E0D8] shadow-xs">
            <span className="text-xs text-[#737A75] font-medium block">Jami stollar</span>
            <span className="font-display font-bold text-2xl text-[#173F35] mt-1 block">
              {tables.length}
            </span>
          </div>
        </div>

        {/* Filters Strip */}
        <div className="bg-white p-3 rounded-2xl border border-[#E5E0D8] shadow-xs flex flex-wrap items-center justify-between gap-3">
          {/* Status Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
            {[
              { id: 'all', label: 'Barchasi' },
              { id: 'new', label: 'Yangi' },
              { id: 'preparing', label: 'Oshxonada' },
              { id: 'ready', label: 'Tayyor (Olib chiqish)' },
              { id: 'delivered', label: 'Yetkazilgan' },
            ].map((st) => (
              <button
                key={st.id}
                onClick={() => setStatusFilter(st.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                  statusFilter === st.id
                    ? 'bg-[#173F35] text-white shadow-xs'
                    : 'text-[#737A75] hover:bg-[#FAF8F3] hover:text-[#202622]'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>

          {/* Table Selector Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#737A75]">Stol:</span>
            <select
              value={selectedTableFilter}
              onChange={(e) =>
                setSelectedTableFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))
              }
              className="text-xs font-semibold p-1.5 rounded-xl bg-[#FAF8F3] border border-[#E5E0D8] focus:outline-none focus:border-[#173F35]"
            >
              <option value="all">Barcha 25 ta stol</option>
              <optgroup label="Oddiy Stollar (1-14)">
                {tables
                  .filter((t) => t.tier === 'oddiy' || t.zone === 'oddiy' || t.zone === 'standard')
                  .map((t) => (
                    <option key={t.id} value={t.table_number}>
                      {t.label || `Stol №${t.table_number}`} (Oddiy)
                    </option>
                  ))}
              </optgroup>
              <optgroup label="Biznes Stollar (15-20)">
                {tables
                  .filter((t) => t.tier === 'biznes' || t.zone === 'biznes' || t.zone === 'business')
                  .map((t) => (
                    <option key={t.id} value={t.table_number}>
                      {t.label || `Stol №${t.table_number}`} (Biznes)
                    </option>
                  ))}
              </optgroup>
              <optgroup label="VIP Xonalar (21-25)">
                {tables
                  .filter((t) => t.tier === 'vip' || t.zone === 'vip')
                  .map((t) => (
                    <option key={t.id} value={t.table_number}>
                      {t.label || `VIP №${t.table_number}`} (VIP)
                    </option>
                  ))}
              </optgroup>
            </select>
          </div>
        </div>

        {/* Orders Stream Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredOrders.length > 0 ? (
            filteredOrders.map((order) => {
              const statusCfg = ORDER_STATUS_MAP[order.status] || ORDER_STATUS_MAP.new;
              return (
                <div
                  key={order.id}
                  className={`bg-white rounded-2xl border p-4 shadow-sm hover:shadow-md transition-all flex flex-col justify-between ${
                    order.status === 'new'
                      ? 'border-red-300 ring-1 ring-red-200'
                      : order.status === 'ready'
                      ? 'border-emerald-300 ring-1 ring-emerald-200'
                      : 'border-[#E5E0D8]'
                  }`}
                >
                  <div>
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2 pb-3 border-b border-[#FAF8F3]">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-display font-bold text-base text-[#173F35]">
                            Stol №{order.table_number}
                          </span>
                          <span className="text-xs font-mono font-semibold text-[#737A75]">
                            {order.order_number}
                          </span>
                        </div>
                        <span className="text-[11px] text-[#737A75] flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3" />
                          <span>{formatShortTime(order.created_at)} ({formatTimeAgo(order.created_at)})</span>
                        </span>
                        {(order.customer_name || (order.cashback_used || 0) > 0) && (
                          <div className="flex items-center gap-1.5 mt-1 text-[11px] text-[#173F35] font-semibold flex-wrap">
                            <Wallet className="w-3 h-3 text-amber-600 shrink-0" />
                            {order.customer_name && <span>{order.customer_name}</span>}
                            {(order.cashback_used || 0) > 0 && (
                              <span className="text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded-md tabular-nums">
                                Keshbek: -{formatUZS(order.cashback_used || 0)}
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${statusCfg.badgeBg}`}>
                          {statusCfg.label}
                        </span>
                        <OrderTickBadge status={order.status} />
                      </div>
                    </div>

                    {/* Dishes summary */}
                    <div className="py-3 space-y-1.5">
                      {order.items.map((item) => (
                        <div key={item.id} className="text-xs flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <span className="text-[#202622] block">
                              <strong className="text-[#173F35]">{item.quantity}x</strong> {item.item_name}
                            </span>
                            {item.item_note && (
                              <span className="text-[11px] text-amber-800 block mt-0.5">
                                Talabnoma: <span className="italic">"{item.item_note}"</span>
                              </span>
                            )}
                          </div>
                          <span className="text-[#737A75] font-mono tabular-nums shrink-0">
                            {formatUZS(item.line_total)}
                          </span>
                        </div>
                      ))}

                      {order.customer_note && (
                        <p className="text-[11px] text-amber-800 bg-amber-50 p-2 rounded-lg mt-2 italic">
                          Umumiy izoh: "{order.customer_note}"
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions & Status Advancement */}
                  <div className="pt-3 border-t border-[#FAF8F3] flex items-center justify-between gap-2">
                    <button
                      onClick={() => setInspectOrder(order)}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#202622] text-xs font-semibold flex items-center gap-1 transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Chek</span>
                    </button>

                    <div className="flex items-center gap-1.5">
                      {order.status === 'new' && (
                        <button
                          onClick={() => updateOrderStatus(order.id, 'preparing')}
                          className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-900 text-xs font-bold transition-all shadow-xs"
                        >
                          Qabul qilish
                        </button>
                      )}

                      {order.status === 'preparing' && (
                        <button
                          onClick={() => updateOrderStatus(order.id, 'ready')}
                          className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs"
                        >
                          Tayyor deb belgilash
                        </button>
                      )}

                      {order.status === 'ready' && (
                        <button
                          onClick={() => updateOrderStatus(order.id, 'delivered')}
                          className="px-3 py-1.5 rounded-xl bg-[#173F35] hover:bg-[#235B4E] text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                          <span>Yetkazildi</span>
                        </button>
                      )}

                      {(order.bill_requested || order.status === 'delivered') && (
                        <button
                          onClick={() => settleAndFreeTable(order.table_number)}
                          className="px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1"
                          title="To'lov qabul qilinib stolni yangi mehmonlar uchun bo'shatish"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-200" />
                          <span>Stolni bo'shatish</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-full bg-white rounded-2xl border border-[#E5E0D8] p-12 text-center text-[#737A75]">
              <Receipt className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p className="text-sm font-semibold text-[#202622]">Bu toifada buyurtmalar mavjud emas</p>
              <p className="text-xs text-[#737A75] mt-1">Mijozlar buyurtma berganda bu yerda avtomatik ko'rinadi.</p>
            </div>
          )}
        </div>
      </main>

      {/* Order Chit Full Modal */}
      {inspectOrder && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-[#E5E0D8] flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E0D8]">
              <div>
                <h3 className="font-display font-bold text-lg text-[#173F35]">
                  Chek: {inspectOrder.order_number}
                </h3>
                <span className="text-xs text-[#737A75]">
                  Stol №{inspectOrder.table_number} • {formatShortTime(inspectOrder.created_at)}
                </span>
              </div>
              <button
                onClick={() => setInspectOrder(null)}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="my-4 overflow-y-auto space-y-3 flex-1">
              <div className="divide-y divide-[#FAF8F3]">
                {inspectOrder.items.map((it) => (
                  <div key={it.id} className="py-2.5 flex items-start justify-between gap-3 text-xs">
                    <div>
                      <span className="font-semibold text-[#202622]">
                        {it.quantity}x {it.item_name}
                      </span>
                      {it.item_note && (
                        <p className="text-[11px] text-amber-700 italic">"{it.item_note}"</p>
                      )}
                    </div>
                    <span className="font-mono font-bold text-[#173F35] tabular-nums">
                      {formatUZS(it.line_total)}
                    </span>
                  </div>
                ))}
              </div>

              {inspectOrder.customer_note && (
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900">
                  <span className="font-semibold block">Maxsus eslatma:</span>
                  <p className="italic">"{inspectOrder.customer_note}"</p>
                </div>
              )}

              <div className="p-3 bg-[#FAF8F3] rounded-xl flex items-center justify-between font-bold text-sm">
                <span>Jami hisob:</span>
                <span className="text-[#173F35] font-display text-base tabular-nums">
                  {formatUZS(inspectOrder.total_amount)}
                </span>
              </div>
            </div>

            <div className="pt-3 border-t border-[#E5E0D8] flex items-center justify-end gap-2">
              <button
                onClick={() => setInspectOrder(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-800"
              >
                Yopish
              </button>
              {inspectOrder.status !== 'delivered' && (
                <button
                  onClick={async () => {
                    await updateOrderStatus(inspectOrder.id, 'delivered');
                    setInspectOrder(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-[#173F35] text-white hover:bg-[#235B4E] text-xs font-bold"
                >
                  Yetkazildi deb belgilash
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
