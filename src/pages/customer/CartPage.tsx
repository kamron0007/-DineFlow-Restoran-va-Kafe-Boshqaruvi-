import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { CustomerHeader } from '../../components/CustomerHeader';
import { CustomerBottomNav } from '../../components/CustomerBottomNav';
import { formatUZS } from '../../utils/formatters';
import {
  CASHBACK_PERCENT_LABEL,
  CASHBACK_RATE,
  WELCOME_BONUS_UZS,
} from '../../services/customerAccount';
import {
  Trash2,
  Plus,
  Minus,
  ArrowLeft,
  ShoppingBag,
  CheckCircle2,
  AlertCircle,
  ClipboardList,
  ChevronDown,
  ChevronUp,
  Wallet,
  Sparkles,
  UserPlus,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const CART_QUICK_REQUESTS = [
  'Piyozsiz',
  "Achchiq bo'lmasin",
  'Achchiqroq',
  'Sousi alohida',
  'Issiqroq',
  'Muzsiz',
];

export const CartPage: React.FC = () => {
  const {
    cart,
    updateCartQuantity,
    updateCartItemNote,
    removeFromCart,
    clearCart,
    cartTotal,
    activeTableNumber,
    placeOrder,
    customerAccount,
    openCustomerAuth,
  } = useApp();

  const [customerNote, setCustomerNote] = useState('');
  const [expandedNoteIndexes, setExpandedNoteIndexes] = useState<Record<number, boolean>>({});
  const [useCashback, setUseCashback] = useState<boolean>(false);
  const [cashbackInputAmount, setCashbackInputAmount] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const navigate = useNavigate();

  const maxRedeemableCashback = customerAccount
    ? Math.min(customerAccount.cashback_balance, cartTotal)
    : 0;

  useEffect(() => {
    if (!customerAccount || maxRedeemableCashback <= 0) {
      setUseCashback(false);
      setCashbackInputAmount(0);
    } else if (useCashback && cashbackInputAmount > maxRedeemableCashback) {
      setCashbackInputAmount(maxRedeemableCashback);
    }
  }, [customerAccount, maxRedeemableCashback, useCashback, cashbackInputAmount]);

  const effectiveCashbackUsed = useCashback
    ? Math.min(maxRedeemableCashback, Math.max(0, Math.round(cashbackInputAmount)))
    : 0;
  const finalPayable = Math.max(0, cartTotal - effectiveCashbackUsed);
  const estimatedCashbackEarned = Math.round(finalPayable * CASHBACK_RATE);

  const handleToggleCashback = () => {
    if (!customerAccount || maxRedeemableCashback <= 0) return;
    if (!useCashback) {
      setUseCashback(true);
      setCashbackInputAmount(maxRedeemableCashback);
    } else {
      setUseCashback(false);
      setCashbackInputAmount(0);
    }
  };

  const toggleNoteEditor = (idx: number) => {
    setExpandedNoteIndexes((prev) => ({
      ...prev,
      [idx]: !prev[idx],
    }));
  };

  const toggleQuickChipForItem = (idx: number, currentNote: string, chip: string) => {
    const parts = currentNote
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const existsIdx = parts.findIndex((p) => p.toLowerCase() === chip.toLowerCase());
    const nextParts =
      existsIdx >= 0 ? parts.filter((_, i) => i !== existsIdx) : [...parts, chip];
    updateCartItemNote(idx, nextParts.join(', '));
  };

  const handleSubmitOrder = async () => {
    if (cart.length === 0 || isSubmitting) return;

    if (!activeTableNumber || activeTableNumber <= 0) {
      setErrorMessage("Iltimos, avval to'g'ri stol raqamini tanlang.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const order = await placeOrder(customerNote.trim(), {
        useCashbackAmount: effectiveCashbackUsed,
      });
      navigate(`/orders?orderId=${order.id}`);
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error ? err.message : "Buyurtma yuborishda kutilmagan xatolik yuz berdi"
      );
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F3] pb-24 md:pb-14 flex flex-col">
      <CustomerHeader />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-6">
        {/* Back Link & Clear Cart */}
        <div className="flex items-center justify-between mb-4">
          <button
            type="button"
            onClick={() => navigate(`/t/${activeTableNumber}`)}
            className="min-h-[40px] flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[#173F35] hover:text-[#1E5245] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Menyuga qaytish</span>
          </button>

          {cart.length > 0 && (
            <button
              type="button"
              onClick={clearCart}
              className="min-h-[40px] text-xs sm:text-sm font-semibold text-red-600 hover:text-red-700 flex items-center gap-1.5"
            >
              <Trash2 className="w-4 h-4" />
              <span>Savatni tozalash</span>
            </button>
          )}
        </div>

        <div className="flex items-end justify-between mb-6">
          <div>
            <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-[#202622]">
              Savatingiz
            </h1>
            <p className="text-xs sm:text-sm text-[#59635E] mt-1">
              Har bir taomga alohida talabnoma yozishingiz mumkin · Stol №{activeTableNumber}
            </p>
          </div>
        </div>

        {errorMessage && (
          <div className="mb-4 p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {cart.length > 0 ? (
          <div className="flex flex-col gap-4">
            {/* Cart Items List with Per-Dish Talabnoma */}
            <div className="bg-white rounded-3xl border border-[#E5E0D8] p-4 sm:p-5 shadow-[0_8px_28px_-18px_rgba(23,63,53,0.16)] divide-y divide-[#F2EFE9]">
              {cart.map((item, idx) => {
                const lineTotal = item.menuItem.price * item.quantity;
                const currentNote = item.item_note || '';
                const isNoteOpen = Boolean(expandedNoteIndexes[idx] || currentNote.trim().length > 0);
                const activeChipSet = new Set(
                  currentNote
                    .split(',')
                    .map((s) => s.trim().toLowerCase())
                    .filter(Boolean)
                );

                return (
                  <div key={`${item.menuItem.id}-${idx}`} className="py-4 first:pt-0 last:pb-0 space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      {/* Item details */}
                      <div className="flex items-center gap-3.5 min-w-0 flex-1">
                        <div className="w-16 h-16 rounded-2xl overflow-hidden bg-[#F3EFE6] shrink-0 border border-[#E5E0D8]">
                          <img
                            src={item.menuItem.image_url || `/images/dishes/${item.menuItem.id}.jpg`}
                            alt={item.menuItem.name}
                            referrerPolicy="no-referrer"
                            onError={(e) => {
                              const target = e.currentTarget;
                              const fallback = `/images/dishes/${item.menuItem.id}.jpg`;
                              if (target.src !== fallback) {
                                target.src = fallback;
                              }
                            }}
                            className="w-full h-full object-cover"
                          />
                        </div>

                        <div className="flex flex-col min-w-0">
                          <h4 className="font-display font-bold text-sm sm:text-base text-[#202622] truncate">
                            {item.menuItem.name}
                          </h4>
                          <span className="text-xs text-[#737A75] font-mono tabular-nums">
                            {formatUZS(item.menuItem.price)} / dona
                          </span>
                          <button
                            type="button"
                            onClick={() => toggleNoteEditor(idx)}
                            className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold text-[#1E5245] hover:text-[#173F35] w-fit"
                          >
                            <ClipboardList className="w-3.5 h-3.5 text-[#1E5245]" />
                            <span>
                              {currentNote.trim()
                                ? 'Talabnomani tahrirlash'
                                : 'Taomga talabnoma yozish'}
                            </span>
                            {isNoteOpen ? (
                              <ChevronUp className="w-3 h-3" />
                            ) : (
                              <ChevronDown className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Quantity Stepper & Removal */}
                      <div className="flex items-center gap-3 shrink-0">
                        <div className="flex items-center gap-1 bg-[#FAF8F3] border border-[#E5E0D8] rounded-full p-1">
                          <button
                            type="button"
                            onClick={() => updateCartQuantity(item.menuItem.id, item.quantity - 1, idx)}
                            aria-label="Kamaytirish"
                            className="w-8 h-8 rounded-full bg-white text-[#173F35] border border-[#E5E0D8] flex items-center justify-center hover:bg-[#F3EFE6] transition-colors"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="w-6 text-center text-xs font-extrabold font-mono text-[#202622] tabular-nums">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateCartQuantity(item.menuItem.id, item.quantity + 1, idx)}
                            aria-label="Ko'paytirish"
                            className="w-8 h-8 rounded-full bg-[#173F35] text-[#F59E0B] flex items-center justify-center hover:bg-[#1E5245] transition-colors"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="text-right min-w-[78px]">
                          <span className="font-mono font-bold text-sm text-[#173F35] block tabular-nums">
                            {formatUZS(lineTotal)}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeFromCart(item.menuItem.id, idx)}
                            className="text-[11px] text-[#737A75] hover:text-red-600 transition-colors"
                          >
                            O&apos;chirish
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Expandable Per-Dish Special Request Input (Taomga talabnoma) */}
                    {isNoteOpen && (
                      <div className="bg-[#FAF8F3] rounded-2xl border border-[#E5E0D8] p-3.5 space-y-2.5">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-semibold text-[#173F35]">
                            &ldquo;{item.menuItem.name}&rdquo; uchun talabnoma:
                          </span>
                          <span className="text-[#737A75] font-mono tabular-nums">{currentNote.length}/160</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {CART_QUICK_REQUESTS.map((chip) => {
                            const active = activeChipSet.has(chip.toLowerCase());
                            return (
                              <button
                                key={chip}
                                type="button"
                                onClick={() => toggleQuickChipForItem(idx, currentNote, chip)}
                                className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-all ${
                                  active
                                    ? 'bg-[#173F35] text-white border-[#173F35]'
                                    : 'bg-white text-[#59635E] border-[#E5E0D8] hover:border-[#173F35]'
                                }`}
                              >
                                {chip}
                              </button>
                            );
                          })}
                        </div>
                        <input
                          type="text"
                          value={currentNote}
                          onChange={(e) => updateCartItemNote(idx, e.target.value)}
                          maxLength={160}
                          placeholder="Masalan: piyozsiz, kamroq tuzli, go'shti yumshoq bo'lsin..."
                          className="w-full min-h-[40px] px-3.5 py-2 rounded-xl bg-white border border-[#E5E0D8] text-xs text-[#202622] placeholder:text-[#737A75] focus:outline-none focus:border-[#173F35] focus:ring-2 focus:ring-[#F59E0B]/25"
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Optional General Customer Note for Kitchen / Waiter */}
            <div className="bg-white rounded-3xl border border-[#E5E0D8] p-4 sm:p-5 shadow-[0_8px_28px_-18px_rgba(23,63,53,0.14)]">
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="general-order-note" className="text-xs font-bold text-[#202622]">
                  Oshxona yoki ofitsiant uchun umumiy izoh (ixtiyoriy):
                </label>
                <span className="text-[11px] text-[#737A75] font-mono tabular-nums">{customerNote.length}/200</span>
              </div>
              <textarea
                id="general-order-note"
                value={customerNote}
                onChange={(e) => setCustomerNote(e.target.value.slice(0, 200))}
                placeholder="Masalan: Barcha taomlar bir vaqtda tortilsin, bolalar uchun kichik qoshiq..."
                rows={2}
                maxLength={200}
                className="w-full text-xs p-3.5 rounded-2xl bg-[#FAF8F3] border border-[#E5E0D8] text-[#202622] focus:outline-none focus:bg-white focus:border-[#173F35] focus:ring-2 focus:ring-[#F59E0B]/25 resize-none placeholder:text-[#737A75]"
              />
            </div>

            {/* Cashback Redemption or Personal Cabinet Invite Card */}
            {customerAccount ? (
              <div className="bg-white rounded-3xl border border-[#E5E0D8] p-4 sm:p-5 shadow-[0_8px_28px_-18px_rgba(23,63,53,0.14)] space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-[#173F35] text-[#F59E0B] flex items-center justify-center shrink-0">
                      <Wallet className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-[#202622]">
                        Keshbekdan foydalanish ({customerAccount.full_name})
                      </p>
                      <p className="text-[11px] text-[#59635E] tabular-nums">
                        Mavjud balans:{' '}
                        <strong className="font-mono text-[#173F35]">
                          {formatUZS(customerAccount.cashback_balance)}
                        </strong>
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    role="switch"
                    aria-checked={useCashback}
                    disabled={maxRedeemableCashback <= 0}
                    onClick={handleToggleCashback}
                    className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors shrink-0 disabled:opacity-40 ${
                      useCashback ? 'bg-[#173F35]' : 'bg-[#D8D1C5]'
                    }`}
                  >
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full shadow transition-transform ${
                        useCashback ? 'translate-x-6 bg-[#F59E0B]' : 'translate-x-1 bg-white'
                      }`}
                    />
                  </button>
                </div>

                {useCashback && maxRedeemableCashback > 0 && (
                  <div className="pt-3 border-t border-[#F2EFE9] space-y-2.5">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setCashbackInputAmount(maxRedeemableCashback)}
                        className={`min-h-[36px] px-3.5 py-1 rounded-full text-xs font-semibold border transition-colors ${
                          effectiveCashbackUsed === maxRedeemableCashback
                            ? 'bg-[#173F35] text-white border-[#173F35]'
                            : 'bg-[#FAF8F3] text-[#173F35] border-[#E5E0D8]'
                        }`}
                      >
                        Barchasi ({formatUZS(maxRedeemableCashback)})
                      </button>
                      <button
                        type="button"
                        onClick={() => setCashbackInputAmount(Math.floor(maxRedeemableCashback / 2))}
                        className={`min-h-[36px] px-3.5 py-1 rounded-full text-xs font-semibold border transition-colors ${
                          effectiveCashbackUsed === Math.floor(maxRedeemableCashback / 2)
                            ? 'bg-[#173F35] text-white border-[#173F35]'
                            : 'bg-[#FAF8F3] text-[#173F35] border-[#E5E0D8]'
                        }`}
                      >
                        50%
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={0}
                        max={maxRedeemableCashback}
                        step={500}
                        value={cashbackInputAmount || ''}
                        onChange={(e) => {
                          const val = Math.max(0, Math.min(maxRedeemableCashback, Number(e.target.value) || 0));
                          setCashbackInputAmount(val);
                        }}
                        placeholder="Summani kiriting"
                        className="flex-1 min-h-[44px] px-3.5 rounded-xl bg-[#FAF8F3] border border-[#E5E0D8] text-sm font-mono font-bold text-[#173F35] tabular-nums focus:outline-none focus:bg-white focus:border-[#173F35]"
                      />
                      <span className="text-xs font-semibold text-[#737A75]">so&apos;m</span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-[#173F35] text-white rounded-3xl p-5 sm:p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3 min-w-0">
                  <Sparkles className="w-5 h-5 text-[#F59E0B] shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-white">
                      Ushbu buyurtmadan <span className="text-[#F59E0B] font-mono">+{formatUZS(estimatedCashbackEarned)}</span> ({CASHBACK_PERCENT_LABEL}) keshbek olishingiz mumkin
                    </p>
                    <p className="text-xs text-emerald-100/80 mt-0.5">
                      Xohlasangiz kabinet oching (+{formatUZS(WELCOME_BONUS_UZS)} bonus) yoki mehmon sifatida davom eting.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => openCustomerAuth('choice')}
                  className="min-h-[44px] px-5 py-2.5 rounded-full bg-[#F59E0B] hover:bg-[#FBBF24] text-[#173F35] text-xs sm:text-sm font-extrabold flex items-center justify-center gap-1.5 shrink-0 transition-all active:scale-95"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Kabinet / Kirish</span>
                </button>
              </div>
            )}

            {/* Price Summary Breakdown */}
            <div className="bg-white rounded-3xl border border-[#E5E0D8] p-5 sm:p-6 shadow-[0_8px_28px_-18px_rgba(23,63,53,0.14)] space-y-3">
              <div className="flex items-center justify-between text-xs sm:text-sm text-[#59635E]">
                <span>Taomlar qiymati:</span>
                <span className="font-mono font-semibold text-[#202622] tabular-nums">{formatUZS(cartTotal)}</span>
              </div>
              {effectiveCashbackUsed > 0 && (
                <div className="flex items-center justify-between text-xs sm:text-sm text-[#1E5245]">
                  <span className="font-semibold">Keshbekdan chegirildi:</span>
                  <span className="font-mono font-bold tabular-nums">-{formatUZS(effectiveCashbackUsed)}</span>
                </div>
              )}
              <div className="flex items-center justify-between text-xs sm:text-sm text-[#59635E]">
                <span>Xizmat ko&apos;rsatish (0%):</span>
                <span className="font-semibold text-emerald-700">Tekin</span>
              </div>
              {customerAccount && estimatedCashbackEarned > 0 && (
                <div className="bg-[#E8F0EC] border border-[#F59E0B]/35 px-4 py-3 rounded-2xl space-y-0.5">
                  <div className="flex items-center justify-between text-xs sm:text-sm text-[#173F35]">
                    <span className="font-bold">
                      Kutilayotgan keshbek ({CASHBACK_PERCENT_LABEL}):
                    </span>
                    <span className="font-mono font-extrabold tabular-nums">+{formatUZS(estimatedCashbackEarned)}</span>
                  </div>
                  <p className="text-xs text-[#59635E]">
                    Buyurtma yetkazilgach tushadi · Bekor qilinsa berilmaydi
                  </p>
                </div>
              )}
              <div className="pt-3.5 border-t border-[#F2EFE9] flex items-center justify-between">
                <div>
                  <span className="font-display font-bold text-base sm:text-lg text-[#202622] block">
                    Jami to&apos;lov:
                  </span>
                  <span className="text-xs text-[#737A75]">
                    {finalPayable === 0
                      ? "To'liq keshbek hisobidan to'lanadi"
                      : "To'lov taom yetkazilgach amalga oshiriladi"}
                  </span>
                </div>
                <span className="font-mono font-extrabold text-xl sm:text-2xl text-[#173F35] tabular-nums">
                  {formatUZS(finalPayable)}
                </span>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="button"
              onClick={handleSubmitOrder}
              disabled={isSubmitting}
              className={`w-full min-h-[54px] py-4 px-6 rounded-full font-display font-extrabold text-base flex items-center justify-center gap-2 transition-all ${
                isSubmitting
                  ? 'bg-slate-400 text-white cursor-wait'
                  : 'bg-[#F59E0B] hover:bg-[#FBBF24] active:scale-[0.99] text-[#173F35] shadow-[0_14px_34px_-12px_rgba(245,158,11,0.75)]'
              }`}
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-[#173F35] border-t-transparent rounded-full animate-spin" />
                  <span>Buyurtma yuborilmoqda...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
                  <span>Buyurtma berish · {formatUZS(finalPayable)}</span>
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-[#E5E0D8] p-12 text-center shadow-[0_12px_36px_-22px_rgba(23,63,53,0.16)] my-8">
            <div className="w-16 h-16 rounded-2xl bg-[#F3EFE6] text-[#173F35] flex items-center justify-center mx-auto mb-4">
              <ShoppingBag className="w-8 h-8" />
            </div>
            <h2 className="font-display font-bold text-xl text-[#202622] mb-1.5">
              Savatingiz hozircha bo&apos;sh
            </h2>
            <p className="text-xs text-[#59635E] max-w-xs mx-auto mb-6 leading-relaxed">
              Milliy taomlar, qarsildoq somsalar va salqin ichimliklardan tanlab, har bir taomga o&apos;z talabnomangizni yozishingiz mumkin.
            </p>
            <button
              type="button"
              onClick={() => navigate(`/t/${activeTableNumber}`)}
              className="min-h-[46px] py-3 px-7 rounded-full bg-[#173F35] text-white text-xs font-bold hover:bg-[#1E5245] transition-all shadow-sm"
            >
              Menyudan tanlash
            </button>
          </div>
        )}
      </main>

      <CustomerBottomNav />
    </div>
  );
};
