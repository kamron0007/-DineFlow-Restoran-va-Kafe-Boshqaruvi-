import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { useLanguage } from '../../context/LanguageContext';
import { CustomerHeader } from '../../components/CustomerHeader';
import { CustomerBottomNav } from '../../components/CustomerBottomNav';
import { formatUZS, formatTimeAgo, formatShortTime, ORDER_STATUS_MAP } from '../../utils/formatters';
import { MenuItem, OrderStatus } from '../../types';
import {
  Clock,
  CheckCircle2,
  Bell,
  FileText,
  AlertCircle,
  Receipt,
  Utensils,
  ChevronRight,
  Star,
  Sparkles,
  Check,
  CheckCheck,
  XCircle,
  Lock,
  RotateCcw,
  LogOut,
  UserPlus,
} from 'lucide-react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CustomerFeedbackModal } from '../../components/CustomerFeedbackModal';
import { DishDetailModal } from '../../components/DishDetailModal';
import { OrderTickBadge } from '../../components/OrderTickBadge';
import { useLiveClock } from '../../hooks/useLiveClock';

function formatRealDateTime(isoDate: string): string {
  try {
    const d = new Date(isoDate);
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    const hh = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    const ss = String(d.getSeconds()).padStart(2, '0');
    return `${dd}.${mm}.${yyyy} · ${hh}:${min}:${ss}`;
  } catch {
    return formatShortTime(isoDate);
  }
}

const STATUS_STEPS: { key: OrderStatus; label: string; desc: string }[] = [
  { key: 'new', label: 'Yuborildi (✓)', desc: 'Ofitsiant kutilmoqda' },
  { key: 'preparing', label: 'Qabul qilindi (✓✓)', desc: 'Tayyorlanmoqda' },
  { key: 'ready', label: 'Tayyor', desc: 'Zalga chiqmoqda' },
  { key: 'delivered', label: 'Yetkazildi', desc: 'Yoqimli ishtaha!' },
];

export const OrderTrackPage: React.FC = () => {
  const {
    customerOrders,
    menuItems,
    activeTableNumber,
    customerAccount,
    openCustomerAuth,
    endGuestSession,
    addToCart,
    callWaiter,
    requestBill,
    getDishRating,
    cancelCustomerOrder,
  } = useApp();
  const { localizeOrderItem } = useLanguage();
  const [searchParams] = useSearchParams();
  const urlOrderId = searchParams.get('orderId');
  const navigate = useNavigate();
  const { timeString, dateString } = useLiveClock();

  // Scoped customer orders:
  // - Account: permanent full personal history across visits & tables
  // - Guest: ONLY unsettled orders from this active guest session
  const tableOrders = customerOrders;

  const [historyFilter, setHistoryFilter] = useState<'all' | 'active' | 'delivered' | 'cancelled'>('all');

  const filteredHistoryOrders = useMemo(() => {
    return tableOrders.filter((o) => {
      if (historyFilter === 'active') {
        return o.status === 'new' || o.status === 'preparing' || o.status === 'ready';
      }
      if (historyFilter === 'delivered') return o.status === 'delivered';
      if (historyFilter === 'cancelled') return o.status === 'cancelled';
      return true;
    });
  }, [tableOrders, historyFilter]);

  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(urlOrderId);

  useEffect(() => {
    if (urlOrderId) {
      setSelectedOrderId(urlOrderId);
    } else if (tableOrders.length > 0 && !selectedOrderId) {
      setSelectedOrderId(tableOrders[0].id);
    }
  }, [urlOrderId, tableOrders, selectedOrderId]);

  const handleReorder = (orderId: string) => {
    const ord = tableOrders.find((o) => o.id === orderId);
    if (!ord) return;
    let addedAny = false;
    ord.items.forEach((it) => {
      const dish = menuItems.find((m) => m.id === it.menu_item_id && m.is_available);
      if (dish) {
        addToCart(dish, it.quantity, it.item_note || undefined);
        addedAny = true;
      }
    });
    if (addedAny) {
      navigate('/cart');
    }
  };

  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState<boolean>(false);
  const [dishToRate, setDishToRate] = useState<MenuItem | null>(null);
  const [confirmCancelOrderId, setConfirmCancelOrderId] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState<boolean>(false);
  const [cancelNotice, setCancelNotice] = useState<string | null>(null);
  const autoPromptRef = React.useRef<Set<string>>(new Set());

  const activeOrder = useMemo(() => {
    if (!selectedOrderId) return tableOrders[0] || null;
    return tableOrders.find((o) => o.id === selectedOrderId) || tableOrders[0] || null;
  }, [selectedOrderId, tableOrders]);

  useEffect(() => {
    setConfirmCancelOrderId(null);
    setCancelNotice(null);
  }, [activeOrder?.id, activeOrder?.status]);

  const handleConfirmCancel = async () => {
    if (!activeOrder || isCancelling) return;
    setIsCancelling(true);
    setCancelNotice(null);
    const res = await cancelCustomerOrder(activeOrder.id);
    setIsCancelling(false);
    setConfirmCancelOrderId(null);
    if (!res.ok) {
      setCancelNotice("Ofitsiant buyurtmani allaqachon qabul qilgani uchun bekor qilib bo'lmaydi.");
    }
  };

  // Prompt feedback modal automatically once when order is delivered if not reviewed yet
  useEffect(() => {
    if (activeOrder && activeOrder.status === 'delivered' && !activeOrder.customer_review) {
      if (!autoPromptRef.current.has(activeOrder.id)) {
        autoPromptRef.current.add(activeOrder.id);
        const timer = setTimeout(() => {
          setIsFeedbackModalOpen(true);
        }, 1200);
        return () => clearTimeout(timer);
      }
    }
  }, [activeOrder]);

  const getStepState = (stepKey: OrderStatus, currentStatus: OrderStatus) => {
    const orderRanks: Record<OrderStatus, number> = {
      new: 1,
      preparing: 2,
      ready: 3,
      delivered: 4,
      cancelled: 0,
    };
    const stepRank = orderRanks[stepKey];
    const currentRank = orderRanks[currentStatus];

    if (currentStatus === 'cancelled') return 'cancelled';
    if (currentRank > stepRank) return 'completed';
    if (currentRank === stepRank) return 'current';
    return 'pending';
  };

  return (
    <div className="min-h-screen bg-[#FAF8F3] pb-24 md:pb-14 flex flex-col">
      <CustomerHeader />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div>
            <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-[#202622]">
              Buyurtmalar holati
            </h1>
            <p className="text-xs sm:text-sm text-[#59635E] mt-1">
              Real vaqtda stol buyurtmasi kuzatuvi
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-white border border-[#E5E0D8] px-3.5 py-2 rounded-full">
              <Clock className="w-3.5 h-3.5 text-[#1E5245]" />
              <span className="font-mono font-bold text-xs sm:text-sm text-[#173F35] tabular-nums">
                {timeString}
              </span>
              <span className="hidden sm:inline text-xs text-[#737A75] border-l border-[#E5E0D8] pl-2">
                {dateString}
              </span>
            </div>
            <span className="text-xs sm:text-sm font-bold px-4 py-2 rounded-full bg-[#173F35] text-[#F59E0B] font-mono tabular-nums">
              Stol №{activeTableNumber}
            </span>
          </div>
        </div>

        {activeOrder ? (
          <div className="flex flex-col gap-5">
            {/* Main Order Status Tracker Card */}
            <div className="bg-white rounded-3xl border border-[#E5E0D8] p-5 sm:p-6 shadow-[0_10px_32px_-20px_rgba(23,63,53,0.16)]">
              <div className="flex items-center justify-between pb-4 border-b border-[#F2EFE9] gap-3 flex-wrap">
                <div>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="font-mono font-extrabold text-lg text-[#173F35]">
                      {activeOrder.order_number}
                    </span>
                    <span
                      className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                        ORDER_STATUS_MAP[activeOrder.status]?.badgeBg || 'bg-slate-100 text-slate-800'
                      }`}
                    >
                      {ORDER_STATUS_MAP[activeOrder.status]?.label || activeOrder.status}
                    </span>
                  </div>
                  <span className="text-xs text-[#737A75] flex items-center gap-1.5 mt-1 font-mono tabular-nums">
                    <Clock className="w-3.5 h-3.5 text-[#1E5245]" />
                    <span>{formatRealDateTime(activeOrder.created_at)}</span>
                    <span className="font-sans text-[11px] text-[#737A75]">
                      ({formatTimeAgo(activeOrder.created_at)})
                    </span>
                  </span>
                </div>

                <div className="text-right">
                  <span className="text-[11px] text-[#737A75] block">Jami summa</span>
                  <span className="font-mono font-extrabold text-xl text-[#173F35] tabular-nums">
                    {formatUZS(activeOrder.total_amount)}
                  </span>
                </div>
              </div>

              {/* Telegram-style 1-Tick / 2-Tick Confirmation & 1-Tick Cancel Zone */}
              {activeOrder.status === 'new' && (
                <div className="mt-4 p-4 rounded-2xl bg-amber-50/85 border border-amber-200/90 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-amber-400 text-[#173F35] flex items-center justify-center shrink-0">
                        <Check className="w-5 h-5 stroke-[2.8]" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-amber-950">
                          Buyurtma yuborildi (1 ta pitichka ✓)
                        </p>
                        <p className="text-[11px] text-amber-900/80 mt-0.5 leading-snug">
                          Ofitsiant qabul qilishini kutmoqda. Qabul qilinmasidan oldin buyurtmani
                          bekor qilishingiz mumkin.
                        </p>
                      </div>
                    </div>
                  </div>

                  {cancelNotice && (
                    <p className="text-xs font-semibold text-red-700 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
                      {cancelNotice}
                    </p>
                  )}

                  {confirmCancelOrderId === activeOrder.id ? (
                    <div className="pt-2.5 border-t border-amber-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                      <span className="text-xs font-bold text-red-800">
                        Buyurtmani haqiqatan ham bekor qilasizmi?
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setConfirmCancelOrderId(null)}
                          disabled={isCancelling}
                          className="min-h-[40px] px-4 py-2 rounded-full bg-white border border-[#E5E0D8] text-xs font-semibold text-[#202622] hover:bg-[#FAF8F3]"
                        >
                          Yo&apos;q, qolsin
                        </button>
                        <button
                          type="button"
                          onClick={handleConfirmCancel}
                          disabled={isCancelling}
                          className="min-h-[40px] px-4 py-2 rounded-full bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95"
                        >
                          <XCircle className="w-4 h-4" />
                          <span>{isCancelling ? 'Bekor qilinmoqda...' : 'Ha, bekor qilish'}</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmCancelOrderId(activeOrder.id)}
                      className="w-full sm:w-auto min-h-[42px] px-4 py-2 rounded-full bg-white hover:bg-red-50 text-red-700 border border-red-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>Buyurtmani bekor qilish</span>
                    </button>
                  )}
                </div>
              )}

              {(activeOrder.status === 'preparing' ||
                activeOrder.status === 'ready' ||
                activeOrder.status === 'delivered') && (
                <div className="mt-4 p-4 rounded-2xl bg-[#E8F0EC] border border-[#F59E0B]/45 flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#173F35] text-[#F59E0B] flex items-center justify-center shrink-0">
                      <CheckCheck className="w-5 h-5 stroke-[2.6]" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[#173F35]">
                        Ofitsiant qabul qildi (2 ta pitichka ✓✓)
                      </p>
                      <p className="text-[11px] text-[#59635E] mt-0.5">
                        Buyurtma tayyorlashga olingan — endi bekor qilib bo&apos;lmaydi.
                      </p>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#173F35]">
                    <Lock className="w-3.5 h-3.5 text-[#1E5245]" />
                    <span>Tasdiqlangan</span>
                  </span>
                </div>
              )}

              {/* Status Stepper */}
              {activeOrder.status === 'cancelled' ? (
                <div className="py-7 text-center text-red-600 flex flex-col items-center">
                  <AlertCircle className="w-10 h-10 mb-2" />
                  <h4 className="font-display font-bold text-base">Ushbu buyurtma bekor qilingan</h4>
                  <p className="text-xs text-[#59635E] mt-1 max-w-sm">
                    {(activeOrder.cashback_used || 0) > 0
                      ? "Ishlatilgan keshbek balansingizga qaytarildi. Bekor qilingan buyurtmaga keshbek berilmaydi."
                      : "Bekor qilingan buyurtmaga keshbek berilmaydi. Yangi buyurtma uchun menyuga qaytishingiz mumkin."}
                  </p>
                </div>
              ) : (
                <div className="py-6">
                  <div className="relative flex items-center justify-between">
                    <div className="absolute left-6 right-6 top-4 h-1 bg-[#E5E0D8] -z-0" />

                    {STATUS_STEPS.map((st, idx) => {
                      const state = getStepState(st.key, activeOrder.status);
                      return (
                        <div key={st.key} className="flex flex-col items-center text-center z-10 w-1/4">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-300 ${
                              state === 'completed'
                                ? 'bg-[#173F35] text-[#F59E0B] ring-4 ring-[#F59E0B]/20'
                                : state === 'current'
                                ? 'bg-[#F59E0B] text-[#173F35] ring-4 ring-[#F59E0B]/30'
                                : 'bg-white border-2 border-[#E5E0D8] text-[#737A75]'
                            }`}
                          >
                            {state === 'completed' ? (
                              <CheckCircle2 className="w-5 h-5 text-[#F59E0B]" />
                            ) : (
                              <span className="font-mono">{idx + 1}</span>
                            )}
                          </div>
                          <span
                            className={`text-xs font-bold mt-2 ${
                              state === 'current'
                                ? 'text-[#173F35]'
                                : state === 'completed'
                                ? 'text-[#1E5245]'
                                : 'text-[#737A75]'
                            }`}
                          >
                            {st.label}
                          </span>
                          <span className="text-[10px] text-[#737A75] hidden sm:block">
                            {st.desc}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Bill Status Indicator if Bill Requested */}
              {activeOrder.bill_requested && (
                <div className="mb-4 p-3.5 bg-[#E8F0EC] rounded-2xl border border-[#F59E0B]/45 flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-[#173F35] text-[#F59E0B] flex items-center justify-center font-bold">
                      <Receipt className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold text-xs text-[#173F35] block">
                        Chek so&apos;rovi yuborildi
                      </span>
                      <span className="text-[11px] text-[#59635E]">
                        Ofitsiant hisob-kitobni olib kelmoqda.
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Service Rating & Review Callout if Delivered */}
              {activeOrder.status === 'delivered' && (
                <div className="mb-4 p-4 rounded-2xl bg-[#173F35] text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#F59E0B]/15 text-[#F59E0B] flex items-center justify-center font-bold shrink-0">
                      <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-white block">
                          {activeOrder.customer_review ? 'Fikringiz saqlandi' : 'Xizmat sifatini baholang'}
                        </span>
                        {activeOrder.customer_review && (
                          <span className="text-[10px] font-bold bg-[#F59E0B] text-[#173F35] px-2 py-0.5 rounded-full font-mono">
                            {activeOrder.customer_review.overall_rating} ★
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-emerald-100/80 mt-0.5">
                        {activeOrder.customer_review
                          ? `"${activeOrder.customer_review.comment || 'Ajoyib xizmat va mazali taomlar'}"`
                          : "Taomlar va ofitsiant xizmatidan rozi bo'ldingizmi? Bahongiz restoran darajasini belgilaydi."}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsFeedbackModalOpen(true)}
                    className="min-h-[40px] px-4 py-2 rounded-full bg-[#F59E0B] hover:bg-[#FBBF24] text-[#173F35] text-xs font-extrabold transition-all flex items-center justify-center gap-1.5 active:scale-95 shrink-0"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{activeOrder.customer_review ? 'Tahrirlash' : 'Baholash'}</span>
                  </button>
                </div>
              )}

              {/* Waiter & Quick Action Buttons */}
              <div className="pt-4 border-t border-[#F2EFE9] flex flex-wrap items-center justify-between gap-3">
                <div className="text-xs text-[#59635E]">
                  <span>Mas&apos;ul ofitsiant: </span>
                  <span className="font-bold text-[#202622]">
                    {activeOrder.waiter_name || 'Zal xodimi'}
                  </span>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {activeOrder.status === 'delivered' && (
                    <button
                      type="button"
                      onClick={() => setIsFeedbackModalOpen(true)}
                      className="min-h-[38px] px-3.5 py-1.5 rounded-full bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                      <span>{activeOrder.customer_review ? 'Baho berilgan' : 'Baholash'}</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => callWaiter('Stol №' + activeTableNumber + ' ofitsiantni kutmoqda')}
                    className="min-h-[38px] px-3.5 py-1.5 rounded-full bg-[#FAF8F3] hover:bg-[#EFEAE0] text-[#173F35] border border-[#E5E0D8] text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <Bell className="w-3.5 h-3.5 text-[#1E5245]" />
                    <span>Ofitsiantni chaqirish</span>
                  </button>
                  <button
                    type="button"
                    onClick={requestBill}
                    className={`min-h-[38px] px-4 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-colors ${
                      activeOrder.bill_requested
                        ? 'bg-[#F59E0B] text-[#173F35]'
                        : 'bg-[#173F35] text-white hover:bg-[#1E5245]'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>{activeOrder.bill_requested ? "Chek so'ralgan" : "Hisob so'rash"}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Order Items Breakdown Chit */}
            <div className="bg-white rounded-3xl border border-[#E5E0D8] p-5 sm:p-6 shadow-[0_8px_28px_-18px_rgba(23,63,53,0.14)]">
              <h3 className="font-display font-bold text-base text-[#202622] mb-3 flex items-center gap-2">
                <Receipt className="w-4 h-4 text-[#1E5245]" />
                <span>Buyurtma tarkibi ({activeOrder.items.length} xil taom)</span>
              </h3>

              <div className="divide-y divide-[#F2EFE9]">
                {activeOrder.items.map((item) => {
                  const matchedDish = menuItems.find((m) => m.id === item.menu_item_id);
                  const dRating = getDishRating(item.menu_item_id);
                  return (
                    <div key={item.id} className="py-3 flex items-start justify-between gap-2 text-xs">
                      <div className="flex items-start gap-2.5 min-w-0">
                        <span className="w-7 h-7 rounded-lg bg-[#F3EFE6] text-[#173F35] font-mono font-bold flex items-center justify-center text-[11px] shrink-0 mt-0.5 tabular-nums">
                          {item.quantity}x
                        </span>
                        <div className="min-w-0">
                          <span className="font-semibold text-[#202622] block">
                            {localizeOrderItem(item.item_name, item.menu_item_id, menuItems)}
                          </span>
                          {item.item_note && (
                            <span className="text-[11px] text-amber-800 block mt-0.5">
                              Talabnoma: <span className="italic">&ldquo;{item.item_note}&rdquo;</span>
                            </span>
                          )}
                          {matchedDish && (
                            <button
                              type="button"
                              onClick={() => setDishToRate(matchedDish)}
                              className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold text-[#1E5245] hover:underline"
                            >
                              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                              <span>
                                Taomni baholash
                                {dRating.count > 0 ? ` (${dRating.average.toFixed(1)} ★)` : ''}
                              </span>
                            </button>
                          )}
                        </div>
                      </div>
                      <span className="font-mono font-bold text-[#173F35] tabular-nums shrink-0">
                        {formatUZS(item.line_total)}
                      </span>
                    </div>
                  );
                })}
              </div>

              {((activeOrder.cashback_used || 0) > 0 ||
                (activeOrder.cashback_earned || 0) > 0 ||
                activeOrder.status === 'cancelled') && (
                <div className="mt-4 pt-3 border-t border-[#F2EFE9] space-y-1.5 text-xs">
                  {activeOrder.subtotal_amount && activeOrder.subtotal_amount !== activeOrder.total_amount && (
                    <div className="flex items-center justify-between text-[#59635E]">
                      <span>Taomlar qiymati:</span>
                      <span className="font-mono tabular-nums">{formatUZS(activeOrder.subtotal_amount)}</span>
                    </div>
                  )}
                  {(activeOrder.cashback_used || 0) > 0 && (
                    <div className="flex items-center justify-between text-[#1E5245] font-semibold">
                      <span>
                        {activeOrder.status === 'cancelled'
                          ? 'Qaytarilgan keshbek:'
                          : 'Keshbekdan foydalanildi:'}
                      </span>
                      <span className="font-mono tabular-nums">
                        {activeOrder.status === 'cancelled' ? '+' : '-'}
                        {formatUZS(activeOrder.cashback_used || 0)}
                      </span>
                    </div>
                  )}
                  {activeOrder.status === 'cancelled' ? (
                    <div className="flex items-center justify-between text-[#737A75]">
                      <span>Keshbek holati:</span>
                      <span className="font-medium">Bekor qilingan — 0 so&apos;m</span>
                    </div>
                  ) : activeOrder.status === 'delivered' && (activeOrder.cashback_earned || 0) > 0 ? (
                    <div className="flex items-center justify-between text-emerald-700 font-semibold">
                      <span>Hisoblangan keshbek (2%):</span>
                      <span className="font-mono tabular-nums">+{formatUZS(activeOrder.cashback_earned || 0)}</span>
                    </div>
                  ) : (activeOrder.cashback_earned || 0) > 0 ? (
                    <div className="flex items-center justify-between text-[#59635E] font-medium">
                      <span>Kutilayotgan keshbek (2% · yetkazilgach):</span>
                      <span className="font-mono tabular-nums">+{formatUZS(activeOrder.cashback_earned || 0)}</span>
                    </div>
                  ) : null}
                </div>
              )}

              {activeOrder.customer_note && (
                <div className="mt-4 p-3.5 rounded-2xl bg-[#FAF8F3] border border-[#E5E0D8] text-xs text-[#202622]">
                  <span className="font-bold text-[#173F35] block mb-0.5">Umumiy talabnoma / izoh:</span>
                  <p className="italic text-[#59635E]">&ldquo;{activeOrder.customer_note}&rdquo;</p>
                </div>
              )}
            </div>

            {/* Guest Session Retention Notice (History cleared on bill settlement or exit) */}
            {!customerAccount && (
              <div className="bg-amber-50/90 border border-amber-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="text-xs text-amber-950 leading-relaxed">
                  <p className="font-bold">Mehmon rejimi — vaqtinchalik tarix</p>
                  <p className="text-amber-900/85 mt-0.5">
                    Bu buyurtmalar faqat chek (hisob) yopilgunicha ko&apos;rinadi. Chiqib qayta kirsangiz yoki hisob yopilgach tarix o&apos;chadi. Doimiy saqlash uchun akkaunt oching.
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0 flex-wrap">
                  <button
                    type="button"
                    onClick={() => openCustomerAuth('register')}
                    className="min-h-[36px] px-3.5 py-1.5 rounded-full bg-[#173F35] hover:bg-[#1E5245] text-white text-xs font-bold flex items-center gap-1.5 transition-colors"
                  >
                    <UserPlus className="w-3.5 h-3.5 text-[#F59E0B]" />
                    <span>Akkaunt ochish</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      endGuestSession(true);
                      navigate(`/t/${activeTableNumber}`);
                    }}
                    className="min-h-[36px] px-3.5 py-1.5 rounded-full bg-white hover:bg-red-50 text-red-700 border border-red-200 text-xs font-bold flex items-center gap-1.5 transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Chiqish</span>
                  </button>
                </div>
              </div>
            )}

            {/* Complete Customer Order History (Every Dish, Exact Time, Delivered vs Cancelled Status) */}
            {tableOrders.length > 0 && (
              <section className="bg-white rounded-3xl border border-[#E5E0D8] p-5 sm:p-6 shadow-[0_8px_28px_-18px_rgba(23,63,53,0.14)] space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="font-display font-extrabold text-base sm:text-lg text-[#173F35]">
                      {customerAccount
                        ? `Barcha buyurtmalar tarixi (${tableOrders.length})`
                        : `Joriy chek buyurtmalari (${tableOrders.length})`}
                    </h3>
                    <p className="text-xs text-[#59635E] mt-0.5">
                      {customerAccount
                        ? "Akkauntingizda doimiy saqlangan barcha taomlar, aniq vaqti va holati"
                        : "Hozirgi tashrifingizdagi barcha taomlar (chek yopilgunicha saqlanadi)"}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                    {(
                      [
                        { id: 'all', label: `Barchasi (${tableOrders.length})` },
                        {
                          id: 'active',
                          label: `Faol (${tableOrders.filter((o) => o.status !== 'delivered' && o.status !== 'cancelled').length})`,
                        },
                        {
                          id: 'delivered',
                          label: `Olindi (${tableOrders.filter((o) => o.status === 'delivered').length})`,
                        },
                        {
                          id: 'cancelled',
                          label: `Bekor (${tableOrders.filter((o) => o.status === 'cancelled').length})`,
                        },
                      ] as const
                    ).map((tab) => (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setHistoryFilter(tab.id)}
                        className={`min-h-[34px] px-3 py-1 rounded-full text-[11px] font-bold whitespace-nowrap transition-colors ${
                          historyFilter === tab.id
                            ? 'bg-[#173F35] text-white'
                            : 'bg-[#FAF8F3] text-[#59635E] border border-[#E5E0D8] hover:border-[#173F35]'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>

                {filteredHistoryOrders.length === 0 ? (
                  <p className="text-xs text-[#737A75] text-center py-6 bg-[#FAF8F3] rounded-2xl border border-[#E5E0D8]">
                    Ushbu toifada buyurtmalar topilmadi.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {filteredHistoryOrders.map((ord) => {
                      const isSelected = ord.id === activeOrder.id;
                      const isDelivered = ord.status === 'delivered';
                      const isCancelled = ord.status === 'cancelled';

                      return (
                        <div
                          key={ord.id}
                          onClick={() => {
                            setSelectedOrderId(ord.id);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-[#E8F0EC]/70 border-[#173F35] shadow-xs'
                              : isCancelled
                              ? 'bg-red-50/30 border-red-200/70 hover:border-red-300'
                              : 'bg-[#FAF8F3] border-[#E5E0D8] hover:border-[#173F35]/50'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2 flex-wrap pb-2.5 border-b border-[#E5E0D8]/70">
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-mono font-extrabold text-sm text-[#173F35]">
                                  {ord.order_number}
                                </span>
                                <span className="text-[11px] font-semibold text-[#59635E]">
                                  · Stol №{ord.table_number}
                                </span>
                                <OrderTickBadge status={ord.status} compact />
                              </div>
                              <div className="flex items-center gap-1.5 text-[11px] font-mono text-[#59635E] mt-1 tabular-nums">
                                <Clock className="w-3 h-3 text-[#1E5245]" />
                                <span>{formatRealDateTime(ord.created_at)}</span>
                                <span className="font-sans text-[#737A75]">
                                  ({formatTimeAgo(ord.created_at)})
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              {isDelivered ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>Olindi (Yetkazildi)</span>
                                </span>
                              ) : isCancelled ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-red-100 text-red-700 border border-red-200">
                                  <XCircle className="w-3.5 h-3.5" />
                                  <span>Bekor qilindi</span>
                                </span>
                              ) : (
                                <span
                                  className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${
                                    ORDER_STATUS_MAP[ord.status]?.badgeBg || 'bg-amber-100 text-amber-800'
                                  }`}
                                >
                                  {ORDER_STATUS_MAP[ord.status]?.label || ord.status}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Complete itemized dishes in this order */}
                          <div className="py-2.5 space-y-1.5">
                            {ord.items.map((it) => (
                              <div key={it.id} className="flex items-start justify-between gap-2 text-xs">
                                <div className="min-w-0">
                                  <span className="text-[#202622] font-medium">
                                    <strong className="font-mono text-[#173F35]">{it.quantity}×</strong>{' '}
                                    {localizeOrderItem(it.item_name, it.menu_item_id, menuItems)}
                                  </span>
                                  {it.item_note && (
                                    <span className="block text-[11px] text-amber-800 italic">
                                      &ldquo;{it.item_note}&rdquo;
                                    </span>
                                  )}
                                </div>
                                <span className="font-mono font-semibold text-[#59635E] tabular-nums shrink-0">
                                  {formatUZS(it.line_total)}
                                </span>
                              </div>
                            ))}
                          </div>

                          <div className="pt-2.5 border-t border-[#E5E0D8]/70 flex items-center justify-between gap-2 flex-wrap">
                            <div className="flex items-center gap-2 text-xs">
                              <span className="text-[#737A75]">Jami:</span>
                              <span className="font-mono font-extrabold text-[#173F35] tabular-nums">
                                {formatUZS(ord.total_amount)}
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              {(isDelivered || isCancelled) && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleReorder(ord.id);
                                  }}
                                  className="min-h-[32px] px-3 py-1 rounded-full bg-[#173F35] hover:bg-[#1E5245] text-white text-[11px] font-bold flex items-center gap-1 transition-colors"
                                >
                                  <RotateCcw className="w-3 h-3 text-[#F59E0B]" />
                                  <span>Qayta buyurtma</span>
                                </button>
                              )}
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#1E5245]">
                                <span>{isSelected ? 'Tanlangan' : "Ko'rish"}</span>
                                <ChevronRight className="w-3.5 h-3.5" />
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-[#E5E0D8] p-12 text-center shadow-[0_12px_36px_-22px_rgba(23,63,53,0.16)] my-8">
            <div className="w-16 h-16 rounded-2xl bg-[#F3EFE6] text-[#173F35] flex items-center justify-center mx-auto mb-4">
              <Utensils className="w-8 h-8" />
            </div>
            <h2 className="font-display font-bold text-xl text-[#202622] mb-1.5">
              {customerAccount ? 'Buyurtmalar tarixi hozircha bo\'sh' : 'Joriy buyurtma topilmadi'}
            </h2>
            <p className="text-xs text-[#59635E] max-w-sm mx-auto mb-6 leading-relaxed">
              {customerAccount
                ? "Akkauntingiz orqali bergan barcha buyurtmalaringiz shu yerda to'liq saqlanib boradi."
                : `Mehmon rejimida faqat hozirgi chek yopilgunicha berilgan buyurtmalar ko'rinadi. Tarixingiz doimiy saqlanishi uchun akkaunt ochishingiz mumkin.`}
            </p>
            <div className="flex items-center justify-center gap-2.5 flex-wrap">
              <button
                type="button"
                onClick={() => navigate(`/t/${activeTableNumber}`)}
                className="min-h-[46px] py-3 px-7 rounded-full bg-[#173F35] text-white text-xs font-bold hover:bg-[#1E5245] transition-all shadow-sm"
              >
                Menyuni ko&apos;rish
              </button>
              {!customerAccount && (
                <button
                  type="button"
                  onClick={() => openCustomerAuth('choice')}
                  className="min-h-[46px] py-3 px-6 rounded-full bg-[#F59E0B] text-[#173F35] text-xs font-extrabold hover:bg-[#FBBF24] transition-all"
                >
                  Akkaunt ochish / Kirish
                </button>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Rate individual ordered dish */}
      <DishDetailModal
        dish={dishToRate}
        initialTab="reviews"
        onClose={() => setDishToRate(null)}
      />

      {/* Overall Order Feedback Modal */}
      {activeOrder && (
        <CustomerFeedbackModal
          order={activeOrder}
          isOpen={isFeedbackModalOpen}
          onClose={() => setIsFeedbackModalOpen(false)}
        />
      )}

      <CustomerBottomNav />
    </div>
  );
};
