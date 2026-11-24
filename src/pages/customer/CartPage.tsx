import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { CustomerHeader } from '../../components/CustomerHeader';
import { CustomerBottomNav } from '../../components/CustomerBottomNav';
import { formatUZS } from '../../utils/formatters';
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
  } = useApp();

  const [customerNote, setCustomerNote] = useState('');
  const [expandedNoteIndexes, setExpandedNoteIndexes] = useState<Record<number, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const navigate = useNavigate();

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
      const order = await placeOrder(customerNote.trim());
      navigate(`/orders?orderId=${order.id}`);
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error ? err.message : "Buyurtma yuborishda kutilmagan xatolik yuz berdi"
      );
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F3] pb-24 md:pb-12 flex flex-col">
      <CustomerHeader />

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 pt-4">
        {/* Back Link & Clear Cart */}
        <div className="flex items-center justify-between mb-4">
          <button
            type="button"
            onClick={() => navigate(`/t/${activeTableNumber}`)}
            className="min-h-[40px] flex items-center gap-1.5 text-xs font-semibold text-[#173F35] hover:underline"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Menyuga qaytish</span>
          </button>

          {cart.length > 0 && (
            <button
              type="button"
              onClick={clearCart}
              className="min-h-[40px] text-xs font-medium text-red-600 hover:text-red-700 flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Savatni tozalash</span>
            </button>
          )}
        </div>

        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="font-display font-bold text-2xl text-[#202622]">Savatingiz</h1>
            <p className="text-xs text-[#737A75]">
              Har bir taomga alohida talabnoma yozishingiz mumkin · Stol №{activeTableNumber}
            </p>
          </div>
        </div>

        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {cart.length > 0 ? (
          <div className="flex flex-col gap-4">
            {/* Cart Items List with Per-Dish Talabnoma */}
            <div className="bg-white rounded-2xl border border-[#E5E0D8] p-4 shadow-sm divide-y divide-[#EFECE4]">
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
                  <div key={`${item.menuItem.id}-${idx}`} className="py-4 first:pt-0 last:pb-0 space-y-2.5">
                    <div className="flex items-center justify-between gap-3">
                      {/* Item details */}
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-14 h-14 rounded-xl overflow-hidden bg-[#FAF8F3] shrink-0 border border-[#E5E0D8]">
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
                          <h4 className="font-display font-bold text-sm text-[#202622] truncate">
                            {item.menuItem.name}
                          </h4>
                          <span className="text-xs text-[#737A75] tabular-nums">
                            {formatUZS(item.menuItem.price)} / dona
                          </span>
                          <button
                            type="button"
                            onClick={() => toggleNoteEditor(idx)}
                            className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold text-[#173F35] hover:underline w-fit"
                          >
                            <ClipboardList className="w-3.5 h-3.5 text-amber-600" />
                            <span>
                              {currentNote.trim()
                                ? 'Talabnomani tahrirlash'
                                : "Taomga talabnoma yozish"}
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
                      <div className="flex items-center gap-2.5 shrink-0">
                        <div className="flex items-center gap-1 bg-[#FAF8F3] border border-[#E5E0D8] rounded-xl p-1">
                          <button
                            type="button"
                            onClick={() => updateCartQuantity(item.menuItem.id, item.quantity - 1, idx)}
                            aria-label="Kamaytirish"
                            className="w-8 h-8 rounded-lg bg-white text-[#173F35] shadow-xs flex items-center justify-center hover:bg-slate-50 transition-colors"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="w-6 text-center text-xs font-bold font-display tabular-nums">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateCartQuantity(item.menuItem.id, item.quantity + 1, idx)}
                            aria-label="Ko'paytirish"
                            className="w-8 h-8 rounded-lg bg-[#173F35] text-white shadow-xs flex items-center justify-center hover:bg-[#235B4E] transition-colors"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="text-right min-w-[74px]">
                          <span className="font-display font-bold text-sm text-[#173F35] block tabular-nums">
                            {formatUZS(lineTotal)}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeFromCart(item.menuItem.id, idx)}
                            className="text-[11px] text-[#737A75] hover:text-red-600 transition-colors"
                          >
                            O'chirish
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Expandable Per-Dish Special Request Input (Taomga talabnoma) */}
                    {isNoteOpen && (
                      <div className="bg-[#FAF8F3] rounded-xl border border-[#E5E0D8] p-3 space-y-2">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-semibold text-[#173F35]">
                            "{item.menuItem.name}" uchun talabnoma:
                          </span>
                          <span className="text-[#737A75] tabular-nums">{currentNote.length}/160</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {CART_QUICK_REQUESTS.map((chip) => {
                            const active = activeChipSet.has(chip.toLowerCase());
                            return (
                              <button
                                key={chip}
                                type="button"
                                onClick={() => toggleQuickChipForItem(idx, currentNote, chip)}
                                className={`px-2 py-1 rounded-lg text-[11px] font-semibold border transition-all ${
                                  active
                                    ? 'bg-[#173F35] text-white border-[#173F35]'
                                    : 'bg-white text-[#57605B] border-[#E5E0D8] hover:border-[#173F35]'
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
                          className="w-full min-h-[40px] px-3 py-2 rounded-lg bg-white border border-[#E5E0D8] text-xs text-[#202622] placeholder:text-[#737A75] focus:outline-none focus:border-[#173F35] focus:ring-1 focus:ring-[#173F35]"
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Optional General Customer Note for Kitchen / Waiter */}
            <div className="bg-white rounded-2xl border border-[#E5E0D8] p-4 shadow-sm">
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="general-order-note" className="text-xs font-semibold text-[#202622]">
                  Oshxona yoki ofitsiant uchun umumiy izoh (ixtiyoriy):
                </label>
                <span className="text-[10px] text-[#737A75] tabular-nums">{customerNote.length}/200</span>
              </div>
              <textarea
                id="general-order-note"
                value={customerNote}
                onChange={(e) => setCustomerNote(e.target.value.slice(0, 200))}
                placeholder="Masalan: Barcha taomlar bir vaqtda tortilsin, bolalar uchun kichik qoshiq..."
                rows={2}
                maxLength={200}
                className="w-full text-xs p-3 rounded-xl bg-[#FAF8F3] border border-[#E5E0D8] text-[#202622] focus:outline-none focus:border-[#173F35] focus:ring-1 focus:ring-[#173F35] resize-none placeholder:text-[#737A75]"
              />
            </div>

            {/* Price Summary Breakdown */}
            <div className="bg-white rounded-2xl border border-[#E5E0D8] p-4 shadow-sm space-y-2.5">
              <div className="flex items-center justify-between text-xs text-[#737A75]">
                <span>Taomlar qiymati:</span>
                <span className="font-medium text-[#202622] tabular-nums">{formatUZS(cartTotal)}</span>
              </div>
              <div className="flex items-center justify-between text-xs text-[#737A75]">
                <span>Xizmat ko'rsatish (0%):</span>
                <span className="font-medium text-emerald-700">Tekin</span>
              </div>
              <div className="pt-2 border-t border-[#E5E0D8] flex items-center justify-between">
                <div>
                  <span className="font-display font-bold text-base text-[#202622] block">
                    Jami to'lov:
                  </span>
                  <span className="text-[11px] text-[#737A75]">
                    To'lov taom yetkazilgach amalga oshiriladi
                  </span>
                </div>
                <span className="font-display font-bold text-xl text-[#173F35] tabular-nums">
                  {formatUZS(cartTotal)}
                </span>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="button"
              onClick={handleSubmitOrder}
              disabled={isSubmitting}
              className={`w-full min-h-[52px] py-4 px-6 rounded-2xl font-display font-bold text-base flex items-center justify-center gap-2 shadow-md transition-all ${
                isSubmitting
                  ? 'bg-slate-400 text-white cursor-wait'
                  : 'bg-amber-500 hover:bg-amber-600 active:scale-[0.99] text-[#202622]'
              }`}
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-slate-700 border-t-transparent rounded-full animate-spin" />
                  <span>Buyurtma yuborilmoqda...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Buyurtma berish (Stol №{activeTableNumber})</span>
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-[#E5E0D8] p-10 text-center shadow-sm my-8">
            <div className="w-16 h-16 rounded-2xl bg-[#E8F0EC] text-[#173F35] flex items-center justify-center mx-auto mb-4">
              <ShoppingBag className="w-8 h-8" />
            </div>
            <h2 className="font-display font-bold text-xl text-[#202622] mb-1">
              Savatingiz hozircha bo'sh
            </h2>
            <p className="text-xs text-[#737A75] max-w-xs mx-auto mb-6 leading-relaxed">
              Milliy taomlar, qarsildoq somsalar va salqin ichimliklardan tanlab, har bir taomga o'z talabnomangizni yozishingiz mumkin.
            </p>
            <button
              type="button"
              onClick={() => navigate(`/t/${activeTableNumber}`)}
              className="min-h-[44px] py-3 px-6 rounded-xl bg-[#173F35] text-white text-xs font-bold hover:bg-[#235B4E] transition-all shadow-sm"
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
