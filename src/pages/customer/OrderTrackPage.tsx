import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
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
    orders,
    menuItems,
    activeTableNumber,
    callWaiter,
    requestBill,
    getDishRating,
    cancelCustomerOrder,
  } = useApp();
  const [searchParams] = useSearchParams();
  const urlOrderId = searchParams.get('orderId');
  const navigate = useNavigate();
  const { timeString, dateString } = useLiveClock();

  // Find all orders for this table
  const tableOrders = useMemo(() => {
    return orders.filter((o) => o.table_number === activeTableNumber);
  }, [orders, activeTableNumber]);

  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(urlOrderId);

  useEffect(() => {
    if (urlOrderId) {
      setSelectedOrderId(urlOrderId);
    } else if (tableOrders.length > 0) {
      setSelectedOrderId(tableOrders[0].id);
    }
  }, [urlOrderId, tableOrders]);

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
                          <span className="font-semibold text-[#202622] block">{item.item_name}</span>
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

            {/* Multiple orders switcher */}
            {tableOrders.length > 1 && (
              <div className="bg-white rounded-3xl border border-[#E5E0D8] p-4 sm:p-5 shadow-xs">
                <h4 className="font-display font-bold text-xs text-[#737A75] mb-2.5 uppercase tracking-wider">
                  Ushbu stoldagi boshqa buyurtmalar:
                </h4>
                <div className="space-y-2">
                  {tableOrders.map((ord) => (
                    <button
                      key={ord.id}
                      type="button"
                      onClick={() => setSelectedOrderId(ord.id)}
                      className={`w-full p-3 rounded-2xl text-xs flex items-center justify-between border transition-all ${
                        ord.id === activeOrder.id
                          ? 'bg-[#E8F0EC] border-[#173F35] font-bold text-[#173F35]'
                          : 'bg-[#FAF8F3] border-transparent hover:border-[#E5E0D8] text-[#202622]'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <OrderTickBadge status={ord.status} compact />
                        <span className="font-mono shrink-0">{ord.order_number}</span>
                        <span className="text-[10px] font-mono text-[#737A75] truncate">
                          {formatRealDateTime(ord.created_at)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono tabular-nums font-bold">{formatUZS(ord.total_amount)}</span>
                        <ChevronRight className="w-3.5 h-3.5 text-[#737A75]" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-[#E5E0D8] p-12 text-center shadow-[0_12px_36px_-22px_rgba(23,63,53,0.16)] my-8">
            <div className="w-16 h-16 rounded-2xl bg-[#F3EFE6] text-[#173F35] flex items-center justify-center mx-auto mb-4">
              <Utensils className="w-8 h-8" />
            </div>
            <h2 className="font-display font-bold text-xl text-[#202622] mb-1.5">
              Faol buyurtma topilmadi
            </h2>
            <p className="text-xs text-[#59635E] max-w-xs mx-auto mb-6 leading-relaxed">
              Stol №{activeTableNumber} uchun hozircha hech qanday buyurtma berilmagan.
            </p>
            <button
              type="button"
              onClick={() => navigate(`/t/${activeTableNumber}`)}
              className="min-h-[46px] py-3 px-7 rounded-full bg-[#173F35] text-white text-xs font-bold hover:bg-[#1E5245] transition-all shadow-sm"
            >
              Menyuni ko&apos;rish
            </button>
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
