import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { CustomerHeader } from '../../components/CustomerHeader';
import { CustomerBottomNav } from '../../components/CustomerBottomNav';
import { OrderTickBadge } from '../../components/OrderTickBadge';
import { UzPhoneInput } from '../../components/UzPhoneInput';
import {
  CASHBACK_PERCENT_LABEL,
  TIER_CONFIG,
  WELCOME_BONUS_UZS,
  customerAccountService,
} from '../../services/customerAccount';
import { useLiveClock } from '../../hooks/useLiveClock';
import { formatPrice, formatTimeAgo } from '../../utils/formatters';
import {
  Wallet,
  Crown,
  ArrowUpRight,
  ArrowDownLeft,
  RotateCcw,
  Gift,
  LogOut,
  UserPlus,
  LogIn,
  Receipt,
  Utensils,
  ChevronRight,
  Sparkles,
  Pencil,
  X,
  User,
  Lock,
  Clock,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

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
    return '--.--.---- · --:--:--';
  }
}

export const AccountPage: React.FC = () => {
  const {
    customerAccount,
    customerTransactions,
    orders,
    activeTableNumber,
    openCustomerAuth,
    updateCustomerAccount,
    logoutCustomerAccount,
  } = useApp();

  const { timeString, dateString } = useLiveClock();
  const [activeTab, setActiveTab] = useState<'orders' | 'cashback'>('orders');
  const [orderStatusFilter, setOrderStatusFilter] = useState<'all' | 'active' | 'delivered' | 'cancelled'>('all');

  // Edit Profile Modal State
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editFullName, setEditFullName] = useState('');
  const [editPhone, setEditPhone] = useState('+998 ');
  const [editCurrentPin, setEditCurrentPin] = useState('');
  const [editNewPin, setEditNewPin] = useState('');
  const [editError, setEditError] = useState<string | null>(null);
  const [editSuccess, setEditSuccess] = useState<string | null>(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const openEditModal = () => {
    if (!customerAccount) return;
    setEditFullName(customerAccount.full_name);
    setEditPhone(customerAccountService.getLocalPhoneForAccount(customerAccount.id));
    setEditCurrentPin('');
    setEditNewPin('');
    setEditError(null);
    setEditSuccess(null);
    setIsEditOpen(true);
  };

  const handleSaveProfileEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerAccount) return;
    setEditError(null);
    setEditSuccess(null);
    setIsSavingEdit(true);
    try {
      const phoneHasLocalDigits = editPhone.replace(/\D/g, '').length > 3;
      await updateCustomerAccount({
        fullName: editFullName,
        newPhone: phoneHasLocalDigits ? editPhone : undefined,
        currentPin: editCurrentPin.trim() || undefined,
        newPin: editNewPin.trim() || undefined,
      });
      setEditSuccess("Akkaunt ma'lumotlari muvaffaqiyatli yangilandi.");
      setTimeout(() => {
        setIsEditOpen(false);
        setEditSuccess(null);
      }, 750);
    } catch (err: unknown) {
      setEditError(err instanceof Error ? err.message : "Ma'lumotlarni saqlashda xatolik yuz berdi.");
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Show customer's personal orders + current table orders (deduped & sorted newest first)
  const relevantOrders = useMemo(() => {
    const map = new Map<string, (typeof orders)[number]>();
    orders.forEach((o) => {
      const isMine = Boolean(customerAccount && o.customer_account_id === customerAccount.id);
      const isMyTable = o.table_number === activeTableNumber;
      if (customerAccount ? isMine || isMyTable : isMyTable) {
        map.set(o.id, o);
      }
    });
    return Array.from(map.values()).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }, [orders, customerAccount, activeTableNumber]);

  const filteredOrders = useMemo(() => {
    return relevantOrders.filter((o) => {
      if (orderStatusFilter === 'active') {
        return o.status === 'new' || o.status === 'preparing' || o.status === 'ready';
      }
      if (orderStatusFilter === 'delivered') return o.status === 'delivered';
      if (orderStatusFilter === 'cancelled') return o.status === 'cancelled';
      return true;
    });
  }, [relevantOrders, orderStatusFilter]);

  const tierInfo = customerAccount ? TIER_CONFIG[customerAccount.tier] : TIER_CONFIG.silver;

  const progressPercent = useMemo(() => {
    if (!customerAccount || !tierInfo.nextTierThreshold) return 100;
    const min = tierInfo.minSpent;
    const span = tierInfo.nextTierThreshold - min;
    if (span <= 0) return 100;
    return Math.min(100, Math.max(4, Math.round(((customerAccount.total_spent - min) / span) * 100)));
  }, [customerAccount, tierInfo]);

  const remainingToNextTier = useMemo(() => {
    if (!customerAccount || !tierInfo.nextTierThreshold) return 0;
    return Math.max(0, tierInfo.nextTierThreshold - customerAccount.total_spent);
  }, [customerAccount, tierInfo]);

  const renderOrderHistorySection = () => (
    <section className="space-y-3">
      {/* Real-time Clock & Filter Bar */}
      <div className="bg-white rounded-2xl border border-[#E5E0D8] p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#173F35] text-[#F59E0B] flex items-center justify-center shrink-0">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-[#737A75] leading-none">
              Real vaqt · {dateString}
            </p>
            <p className="font-mono font-extrabold text-base text-[#173F35] tabular-nums mt-1">
              {timeString}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {(
            [
              { id: 'all', label: `Barchasi (${relevantOrders.length})` },
              { id: 'active', label: 'Faol' },
              { id: 'delivered', label: 'Yakunlangan' },
              { id: 'cancelled', label: 'Bekor' },
            ] as const
          ).map((chip) => (
            <button
              key={chip.id}
              type="button"
              onClick={() => setOrderStatusFilter(chip.id)}
              className={`min-h-[36px] px-3 py-1 rounded-full text-[11px] font-bold whitespace-nowrap transition-colors ${
                orderStatusFilter === chip.id
                  ? 'bg-[#173F35] text-white'
                  : 'bg-[#FAF8F3] text-[#59635E] border border-[#E5E0D8] hover:border-[#173F35]'
              }`}
            >
              {chip.label}
            </button>
          ))}
        </div>
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <div className="bg-white rounded-3xl border border-[#E5E0D8] p-10 text-center space-y-3">
          <Receipt className="w-8 h-8 text-[#737A75] mx-auto" />
          <p className="text-xs text-[#59635E]">
            Bu bo&apos;limda hozircha buyurtmalar tarixi mavjud emas.
          </p>
          <Link
            to={`/t/${activeTableNumber}`}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-[#173F35] text-white text-xs font-bold hover:bg-[#1E5245]"
          >
            <Utensils className="w-3.5 h-3.5 text-[#F59E0B]" />
            <span>Menyuga o&apos;tish</span>
          </Link>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredOrders.map((ord) => (
            <Link
              key={ord.id}
              to={`/orders?orderId=${ord.id}`}
              className="block bg-white rounded-2xl border border-[#E5E0D8] p-4 hover:border-[#173F35]/40 transition-colors"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono font-extrabold text-sm text-[#173F35]">
                    {ord.order_number}
                  </span>
                  <span className="text-[11px] font-semibold text-[#59635E]">
                    · Stol №{ord.table_number}
                  </span>
                </div>
                <OrderTickBadge status={ord.status} />
              </div>

              {/* Exact Real Date + Time + Live Elapsed */}
              <div className="mt-2 flex items-center justify-between gap-2 text-[11px] text-[#59635E] flex-wrap">
                <span className="inline-flex items-center gap-1 font-mono tabular-nums">
                  <Clock className="w-3 h-3 text-[#1E5245]" />
                  <span>{formatRealDateTime(ord.created_at)}</span>
                </span>
                <span className="font-semibold text-[#173F35]">{formatTimeAgo(ord.created_at)}</span>
              </div>

              {/* Dishes Preview */}
              <p className="mt-2 text-xs text-[#202622] line-clamp-1">
                {ord.items.map((it) => `${it.quantity}× ${it.item_name}`).join(', ')}
              </p>

              <div className="mt-2.5 pt-2.5 border-t border-[#F2EFE9] flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-[11px] flex-wrap">
                  {(ord.cashback_used || 0) > 0 && (
                    <span className="text-[#1E5245] font-semibold tabular-nums">
                      Ishlatildi: -{formatPrice(ord.cashback_used || 0)}
                    </span>
                  )}
                  {ord.status === 'cancelled' ? (
                    <span className="text-[#737A75] font-medium">
                      Bekor qilingan — keshbek berilmaydi
                    </span>
                  ) : ord.status === 'delivered' && (ord.cashback_earned || 0) > 0 ? (
                    <span className="text-emerald-700 font-semibold tabular-nums">
                      +{formatPrice(ord.cashback_earned || 0)} keshbek ({CASHBACK_PERCENT_LABEL})
                    </span>
                  ) : (ord.cashback_earned || 0) > 0 ? (
                    <span className="text-[#59635E] font-medium tabular-nums">
                      Kutilmoqda: +{formatPrice(ord.cashback_earned || 0)} ({CASHBACK_PERCENT_LABEL})
                    </span>
                  ) : null}
                </div>
                <span className="font-mono font-extrabold text-sm text-[#173F35] tabular-nums shrink-0">
                  {formatPrice(ord.total_amount)}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );

  return (
    <div className="min-h-screen bg-[#FAF8F3] pb-24 md:pb-14">
      <CustomerHeader />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-5">
        {!customerAccount ? (
          /* Guest / Not Signed In View + Table Real-Time Order History */
          <section className="space-y-5">
            <div className="rounded-3xl bg-[#173F35] text-white p-6 sm:p-7 shadow-[0_18px_46px_-24px_rgba(15,45,37,0.55)]">
              <div>
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-white/10 text-[#F59E0B] flex items-center justify-center shrink-0">
                    <Wallet className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-[#F59E0B] uppercase tracking-wider">
                      Shaxsiy kabinet va Keshbek
                    </p>
                    <h1 className="font-display font-extrabold text-2xl sm:text-3xl mt-0.5 leading-tight">
                      Har bir buyurtmadan <span className="text-[#F59E0B]">keshbek</span> yig&apos;ing
                    </h1>
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-emerald-100/85 mt-4 leading-relaxed max-w-xl">
                  Hozir siz <strong className="text-white">mehmon</strong> rejimidasiz. Xohlasangiz
                  O&apos;zbekiston raqami (<strong className="font-mono text-[#F59E0B]">+998</strong>) bilan kabinet oching va yakunlangan har bir buyurtmadan{' '}
                  <strong className="text-[#F59E0B]">{CASHBACK_PERCENT_LABEL} keshbek</strong> yig&apos;ing.
                </p>

                <div className="grid grid-cols-3 gap-3 mt-6 pt-5 border-t border-white/12 text-center">
                  <div>
                    <p className="font-mono font-extrabold text-base sm:text-lg text-[#F59E0B] tabular-nums">
                      +{formatPrice(WELCOME_BONUS_UZS)}
                    </p>
                    <p className="text-[11px] text-emerald-100/75 mt-0.5">Boshlang&apos;ich bonus</p>
                  </div>
                  <div>
                    <p className="font-mono font-extrabold text-base sm:text-lg text-white tabular-nums">{CASHBACK_PERCENT_LABEL}</p>
                    <p className="text-[11px] text-emerald-100/75 mt-0.5">Yakunlangan buyurtmadan</p>
                  </div>
                  <div>
                    <p className="font-mono font-extrabold text-base sm:text-lg text-white tabular-nums">100%</p>
                    <p className="text-[11px] text-emerald-100/75 mt-0.5">To&apos;lovda ishlatish</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => openCustomerAuth('register')}
                    className="min-h-[48px] px-5 py-3 rounded-full bg-[#F59E0B] hover:bg-[#FBBF24] text-[#173F35] font-extrabold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-[0_10px_28px_-10px_rgba(245,158,11,0.65)]"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Akkaunt yaratish</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => openCustomerAuth('login')}
                    className="min-h-[48px] px-5 py-3 rounded-full bg-white/10 hover:bg-white/16 text-white border border-white/20 font-semibold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                  >
                    <LogIn className="w-4 h-4 text-[#F59E0B]" />
                    <span>Kabinetga kirish</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-1 space-y-2.5">
              <h2 className="font-display font-bold text-lg text-[#202622]">
                Stol №{activeTableNumber} buyurtmalar tarixi
              </h2>
              {renderOrderHistorySection()}
            </div>

            <Link
              to={`/t/${activeTableNumber}`}
              className="w-full min-h-[48px] px-5 py-3 rounded-2xl bg-white border border-[#E5E0D8] text-[#173F35] font-semibold text-sm flex items-center justify-between hover:bg-[#F3EFE6] transition-colors"
            >
              <span className="flex items-center gap-2">
                <Utensils className="w-4 h-4 text-[#1E5245]" />
                Menyuga qaytish (Stol №{activeTableNumber})
              </span>
              <ChevronRight className="w-4 h-4 text-[#737A75]" />
            </Link>
          </section>
        ) : (
          /* Signed-in Personal Cabinet View */
          <>
            {/* Digital Loyalty Card */}
            <section className="rounded-3xl bg-[#173F35] text-white p-6 sm:p-7 shadow-[0_18px_46px_-24px_rgba(15,45,37,0.55)]">
              <div>
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="min-w-0">
                    <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#F59E0B]">
                      <Crown className="w-3.5 h-3.5" />
                      <span>{tierInfo.label} · {tierInfo.percentLabel} keshbek</span>
                    </div>
                    <h1 className="font-display font-extrabold text-2xl sm:text-3xl mt-1.5 truncate">
                      {customerAccount.full_name}
                    </h1>
                    <p className="text-xs text-emerald-100/75 font-mono mt-0.5">
                      {customerAccount.phone_masked}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={openEditModal}
                      className="min-h-[40px] px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/18 text-white border border-white/18 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                      title="Akkauntni tahrirlash"
                    >
                      <Pencil className="w-3.5 h-3.5 text-[#F59E0B]" />
                      <span>Tahrirlash</span>
                    </button>
                    <button
                      type="button"
                      onClick={logoutCustomerAccount}
                      className="min-h-[40px] px-3.5 py-1.5 rounded-full bg-white/8 hover:bg-white/16 text-emerald-100/90 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                      title="Kabinetdan chiqish"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Chiqish</span>
                    </button>
                  </div>
                </div>

                {/* Main Cashback Balance */}
                <div className="mt-6 pt-5 border-t border-white/12 flex items-end justify-between gap-4 flex-wrap">
                  <div>
                    <p className="text-xs text-emerald-100/75 font-medium">
                      Mavjud keshbek balansingiz
                    </p>
                    <p className="font-mono font-extrabold text-3xl sm:text-4xl text-[#F59E0B] tracking-tight tabular-nums mt-1">
                      {formatPrice(customerAccount.cashback_balance)}
                    </p>
                  </div>

                  <Link
                    to="/cart"
                    className="min-h-[44px] px-5 py-2.5 rounded-full bg-[#F59E0B] hover:bg-[#FBBF24] text-[#173F35] font-extrabold text-xs flex items-center gap-1.5 transition-all active:scale-95 shadow-[0_10px_24px_-8px_rgba(245,158,11,0.65)]"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Savatda ishlatish</span>
                  </Link>
                </div>

                {/* Tier Progress Bar */}
                {tierInfo.nextTierThreshold && tierInfo.nextTierLabel && (
                  <div className="mt-5 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] text-emerald-100/80">
                      <span>Keyingi daraja: {tierInfo.nextTierLabel}</span>
                      <span className="font-mono tabular-nums">
                        Yana {formatPrice(remainingToNextTier)}
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-white/12 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[#F59E0B] transition-all duration-500"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* Compact KPI Strip */}
            <section className="grid grid-cols-3 gap-3">
              <div className="bg-white rounded-2xl border border-[#E5E0D8] p-4">
                <p className="text-[11px] text-[#737A75]">Buyurtmalar</p>
                <p className="font-mono font-extrabold text-lg text-[#173F35] tabular-nums mt-0.5">
                  {customerAccount.total_orders} ta
                </p>
              </div>
              <div className="bg-white rounded-2xl border border-[#E5E0D8] p-4">
                <p className="text-[11px] text-[#737A75]">Jami xarid</p>
                <p className="font-mono font-extrabold text-sm sm:text-base text-[#202622] tabular-nums mt-1 truncate">
                  {formatPrice(customerAccount.total_spent)}
                </p>
              </div>
              <div className="bg-white rounded-2xl border border-[#E5E0D8] p-4">
                <p className="text-[11px] text-[#737A75]">Keshbek foizi</p>
                <p className="font-mono font-extrabold text-lg text-[#1E5245] tabular-nums mt-0.5">
                  {tierInfo.percentLabel}
                </p>
              </div>
            </section>

            {/* Segmented Control */}
            <div className="grid grid-cols-2 p-1 rounded-2xl bg-[#EFEAE0] border border-[#E5E0D8]">
              <button
                type="button"
                onClick={() => setActiveTab('orders')}
                className={`min-h-[44px] rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'orders'
                    ? 'bg-white text-[#173F35] shadow-xs'
                    : 'text-[#59635E] hover:text-[#173F35]'
                }`}
              >
                Buyurtma tarixi ({relevantOrders.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('cashback')}
                className={`min-h-[44px] rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'cashback'
                    ? 'bg-white text-[#173F35] shadow-xs'
                    : 'text-[#59635E] hover:text-[#173F35]'
                }`}
              >
                Keshbek tarixi ({customerTransactions.length})
              </button>
            </div>

            {activeTab === 'orders' ? (
              renderOrderHistorySection()
            ) : (
              <section className="bg-white rounded-3xl border border-[#E5E0D8] divide-y divide-[#F2EFE9] overflow-hidden">
                {customerTransactions.length === 0 ? (
                  <div className="p-10 text-center text-xs text-[#737A75]">
                    Hozircha keshbek operatsiyalari mavjud emas.
                  </div>
                ) : (
                  customerTransactions.map((tx) => {
                    const isPositive = tx.type !== 'spent';
                    return (
                      <div key={tx.id} className="p-4 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                              tx.type === 'spent'
                                ? 'bg-amber-50 text-amber-700'
                                : tx.type === 'welcome_bonus'
                                ? 'bg-[#E8F0EC] text-[#173F35]'
                                : tx.type === 'refunded'
                                ? 'bg-slate-100 text-slate-700'
                                : 'bg-[#E8F0EC] text-emerald-700'
                            }`}
                          >
                            {tx.type === 'spent' ? (
                              <ArrowUpRight className="w-4 h-4" />
                            ) : tx.type === 'welcome_bonus' ? (
                              <Gift className="w-4 h-4" />
                            ) : tx.type === 'refunded' ? (
                              <RotateCcw className="w-4 h-4" />
                            ) : (
                              <ArrowDownLeft className="w-4 h-4" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-[#202622] leading-snug">
                              {tx.description}
                            </p>
                            <p className="text-[11px] text-[#737A75] font-mono mt-0.5 tabular-nums">
                              {formatRealDateTime(tx.created_at)}
                            </p>
                          </div>
                        </div>
                        <span
                          className={`font-mono font-bold text-sm tabular-nums shrink-0 ${
                            isPositive ? 'text-emerald-700' : 'text-amber-700'
                          }`}
                        >
                          {isPositive ? '+' : '-'}
                          {formatPrice(tx.amount)}
                        </span>
                      </div>
                    );
                  })
                )}
              </section>
            )}
          </>
        )}
      </main>

      {/* Customer Account Edit Modal */}
      {isEditOpen && customerAccount && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-[#FAF8F3] w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl border border-[#E5E0D8] shadow-2xl overflow-hidden max-h-[92vh] overflow-y-auto">
            <div className="bg-[#173F35] text-white px-6 py-4 flex items-center justify-between gap-2">
              <div>
                <p className="text-xs font-semibold text-[#F59E0B]">
                  Shaxsiy kabinet sozlamalari
                </p>
                <h2 className="font-display font-bold text-lg mt-0.5">
                  Akkauntni tahrirlash
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsEditOpen(false)}
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                aria-label="Yopish"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProfileEdit} className="p-5 space-y-3.5">
              {editError && (
                <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{editError}</span>
                </div>
              )}

              {editSuccess && (
                <div className="flex items-start gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{editSuccess}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-[#202622] mb-1.5">
                  Ismingiz
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-[#737A75] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={editFullName}
                    onChange={(e) => setEditFullName(e.target.value)}
                    placeholder="Ism-familiyangiz"
                    className="w-full min-h-[46px] pl-10 pr-3.5 rounded-xl bg-white border border-[#D8D1C5] text-sm text-[#202622] focus:outline-none focus:border-[#173F35] focus:ring-2 focus:ring-[#F59E0B]/25"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#202622] mb-1.5">
                  O&apos;zbekiston telefon raqami (+998 o&apos;zgarmas)
                </label>
                <UzPhoneInput
                  value={editPhone}
                  onChange={setEditPhone}
                  placeholder="90 123-45-67"
                />
                <p className="text-[11px] text-[#737A75] mt-1">
                  Joriy raqam: <span className="font-mono font-semibold">{customerAccount.phone_masked}</span>. Raqamni o&apos;zgartirsangiz keshbek balansingiz saqlanib qoladi.
                </p>
              </div>

              <div className="pt-2 border-t border-[#E5E0D8] space-y-3">
                <p className="text-[11px] font-semibold text-[#59635E]">
                  Telefon raqam yoki PIN-kodni o&apos;zgartirish (ixtiyoriy):
                </p>
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-semibold text-[#202622] mb-1">
                      Joriy 4 xonali PIN
                    </label>
                    <div className="relative">
                      <Lock className="w-3.5 h-3.5 text-[#737A75] absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="password"
                        inputMode="numeric"
                        maxLength={4}
                        value={editCurrentPin}
                        onChange={(e) => setEditCurrentPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                        placeholder="••••"
                        className="w-full min-h-[44px] pl-9 pr-2.5 rounded-xl bg-white border border-[#D8D1C5] text-sm font-mono tracking-[0.35em] focus:outline-none focus:border-[#173F35]"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-[#202622] mb-1">
                      Yangi 4 xonali PIN
                    </label>
                    <div className="relative">
                      <Lock className="w-3.5 h-3.5 text-[#737A75] absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="password"
                        inputMode="numeric"
                        maxLength={4}
                        value={editNewPin}
                        onChange={(e) => setEditNewPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                        placeholder="••••"
                        className="w-full min-h-[44px] pl-9 pr-2.5 rounded-xl bg-white border border-[#D8D1C5] text-sm font-mono tracking-[0.35em] focus:outline-none focus:border-[#173F35]"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  className="flex-1 min-h-[46px] rounded-full bg-white border border-[#D8D1C5] text-xs font-bold text-[#202622] hover:bg-[#F3EFE6]"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={isSavingEdit}
                  className="flex-[1.5] min-h-[46px] rounded-full bg-[#F59E0B] hover:bg-[#FBBF24] disabled:opacity-60 text-[#173F35] text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all active:scale-[0.98]"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isSavingEdit ? 'Saqlanmoqda...' : 'Saqlash'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <CustomerBottomNav />
    </div>
  );
};
