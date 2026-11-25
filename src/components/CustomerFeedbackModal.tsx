import React, { useState } from 'react';
import { Order, CustomerFeedback } from '../types';
import { useApp } from '../context/AppContext';
import {
  Star,
  X,
  CheckCircle2,
  Heart,
  MessageSquare,
  ThumbsUp,
  Sparkles,
  Send,
  Coffee,
  Award,
} from 'lucide-react';

interface CustomerFeedbackModalProps {
  order: Order;
  isOpen: boolean;
  onClose: () => void;
  onSubmitted?: () => void;
}

const RATING_EMOTIONS = [
  { rating: 1, label: 'Juda yomon', icon: '😠', color: 'text-rose-500' },
  { rating: 2, label: 'Qoniqarsiz', icon: '🙁', color: 'text-amber-600' },
  { rating: 3, label: 'Yaxshi', icon: '😐', color: 'text-yellow-500' },
  { rating: 4, label: 'Juda yaxshi', icon: '😊', color: 'text-emerald-600' },
  { rating: 5, label: "A'lo darajada!", icon: '🌟', color: 'text-amber-500' },
];

const PRESET_TAGS = [
  'Mazali taomlar 🍲',
  'Tezkor yetkazildi ⚡',
  'Xushmuomala ofitsiant 🤵',
  'Issiq va yangi 🔥',
  'Toza va ozoda ✨',
  'Ajoyib atmosfera 🎵',
  'Chiroyli taqdimot 🍽️',
  'Yana tashrif buyuramiz ❤️',
];

const TIP_OPTIONS = [0, 5000, 10000, 20000, 50000];

export const CustomerFeedbackModal: React.FC<CustomerFeedbackModalProps> = ({
  order,
  isOpen,
  onClose,
  onSubmitted,
}) => {
  const { submitOrderFeedback, restaurantName, restaurantRating } = useApp();

  const [overallRating, setOverallRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);

  // Sub-criteria ratings
  const [foodRating, setFoodRating] = useState<number>(5);
  const [speedRating, setSpeedRating] = useState<number>(5);
  const [waiterRating, setWaiterRating] = useState<number>(5);
  const [atmosphereRating, setAtmosphereRating] = useState<number>(5);

  const [selectedTags, setSelectedTags] = useState<string[]>([
    'Mazali taomlar 🍲',
    'Xushmuomala ofitsiant 🤵',
  ]);
  const [comment, setComment] = useState<string>('');
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [selectedTip, setSelectedTip] = useState<number>(0);

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  if (!isOpen) return null;

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const activeEmotion = RATING_EMOTIONS.find((e) => e.rating === (hoverRating || overallRating)) || RATING_EMOTIONS[4];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await submitOrderFeedback({
        order_id: order.id,
        order_number: order.order_number,
        table_number: order.table_number,
        waiter_name: order.waiter_name || undefined,
        overall_rating: overallRating,
        food_rating: foodRating,
        speed_rating: speedRating,
        waiter_rating: waiterRating,
        atmosphere_rating: atmosphereRating,
        tags: selectedTags,
        comment: comment.trim(),
        customer_name: customerName.trim() || undefined,
        customer_phone: customerPhone.trim() || undefined,
        tip_amount: selectedTip > 0 ? selectedTip : undefined,
      });

      setIsSuccess(true);
      if (onSubmitted) onSubmitted();
    } catch {
      // Handled in context
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full border border-[#E5E0D8] shadow-2xl overflow-hidden my-6 relative">
        {/* Modal Top Header */}
        <div className="bg-[#173F35] text-white px-6 py-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#F59E0B] text-[#173F35] flex items-center justify-center shadow-sm">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-extrabold text-base sm:text-lg leading-tight">
                Xizmat Sifatini Baholash
              </h3>
              <p className="text-xs text-emerald-100/80 mt-0.5">
                Stol №{order.table_number} · {order.order_number} · {restaurantName || 'Zafaran Grand'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {isSuccess ? (
          /* Thank You Celebration View */
          <div className="p-8 text-center space-y-4">
            <div className="w-20 h-20 rounded-full bg-[#E8F0EC] border-4 border-[#F59E0B]/30 flex items-center justify-center mx-auto text-[#173F35]">
              <CheckCircle2 className="w-10 h-10 text-[#1E5245]" />
            </div>

            <div className="space-y-1.5">
              <h4 className="font-display font-extrabold text-xl text-[#173F35]">
                Fikringiz Uchun Katta Rahmat!
              </h4>
              <p className="text-xs text-[#59635E] max-w-sm mx-auto leading-relaxed">
                Siz qoldirgan baho restoran darajasini jonli yangiladi. Hozirgi maqom:{' '}
                <strong className="text-[#173F35]">
                  {restaurantRating.level.title} ({restaurantRating.averageRating.toFixed(1)} ★)
                </strong>
                .
              </p>
            </div>

            {selectedTip > 0 && (
              <div className="bg-amber-50 p-3 rounded-2xl border border-amber-200 text-xs text-amber-900 inline-block font-medium">
                Mas&apos;ul ofitsiantga <strong className="font-bold">{selectedTip.toLocaleString()} so&apos;m</strong> choypuli biriktirildi. Tashakkur!
              </div>
            )}

            <div className="pt-4">
              <button
                type="button"
                onClick={onClose}
                className="py-3 px-8 rounded-full bg-[#173F35] hover:bg-[#1E5245] text-white text-xs font-bold transition-all shadow-md active:scale-95"
              >
                Yopish
              </button>
            </div>
          </div>
        ) : (
          /* Rating Form */
          <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5 max-h-[78vh] overflow-y-auto">
            {/* Live Restaurant Level Impact Strip */}
            <div className="flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-2xl bg-[#E8F0EC] border border-[#F59E0B]/40 text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <Award className="w-4 h-4 text-[#173F35] shrink-0" />
                <span className="text-[#173F35] font-bold truncate">
                  Joriy daraja: {restaurantRating.level.title} ({restaurantRating.averageRating.toFixed(1)} ★)
                </span>
              </div>
              <span className="text-[11px] text-[#59635E] shrink-0">
                Bahoyingiz darajaga ta&apos;sir qiladi
              </span>
            </div>

            {/* Overall Star Rating Box */}
            <div className="bg-[#FAF8F3] p-4 sm:p-5 rounded-2xl border border-[#E5E0D8] text-center space-y-2">
              <span className="text-xs font-bold text-[#173F35] uppercase tracking-wider block">
                Umumiy taassurotingiz
              </span>

              {/* 5 Big Animated Stars */}
              <div className="flex items-center justify-center gap-2 py-1">
                {[1, 2, 3, 4, 5].map((star) => {
                  const isActive = (hoverRating || overallRating) >= star;
                  return (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setOverallRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(null)}
                      className="p-1 rounded-lg transition-transform active:scale-125 hover:scale-110 focus:outline-hidden"
                    >
                      <Star
                        className={`w-9 h-9 sm:w-10 sm:h-10 transition-colors ${
                          isActive
                            ? 'fill-amber-400 text-amber-400 drop-shadow-sm'
                            : 'text-gray-300 stroke-1'
                        }`}
                      />
                    </button>
                  );
                })}
              </div>

              {/* Emotional feedback badge */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-[#E5E0D8] text-xs font-bold shadow-2xs">
                <span>{activeEmotion.icon}</span>
                <span className={activeEmotion.color}>{activeEmotion.label}</span>
              </div>
            </div>

            {/* Criteria Mini Sliders / Stars */}
            <div className="space-y-2.5 bg-white p-4 rounded-2xl border border-[#E5E0D8]">
              <span className="text-xs font-bold text-[#173F35] block">
                Alohida mezonlar bo'yicha baholash:
              </span>

              {/* Criterion 1: Food Quality */}
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#737A75] font-medium">Taomlar mazasi va harorati:</span>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      type="button"
                      key={s}
                      onClick={() => setFoodRating(s)}
                      className="p-0.5"
                    >
                      <Star
                        className={`w-4 h-4 ${
                          foodRating >= s ? 'fill-amber-400 text-amber-400' : 'text-gray-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Criterion 2: Speed */}
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#737A75] font-medium">Xizmat tezligi:</span>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      type="button"
                      key={s}
                      onClick={() => setSpeedRating(s)}
                      className="p-0.5"
                    >
                      <Star
                        className={`w-4 h-4 ${
                          speedRating >= s ? 'fill-amber-400 text-amber-400' : 'text-gray-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Criterion 3: Waiter */}
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#737A75] font-medium">
                  Ofitsiant xizmati ({order.waiter_name || "Xodim"}):
                </span>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      type="button"
                      key={s}
                      onClick={() => setWaiterRating(s)}
                      className="p-0.5"
                    >
                      <Star
                        className={`w-4 h-4 ${
                          waiterRating >= s ? 'fill-amber-400 text-amber-400' : 'text-gray-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Criterion 4: Atmosphere */}
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#737A75] font-medium">Restoran muhiti va tozaligi:</span>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      type="button"
                      key={s}
                      onClick={() => setAtmosphereRating(s)}
                      className="p-0.5"
                    >
                      <Star
                        className={`w-4 h-4 ${
                          atmosphereRating >= s ? 'fill-amber-400 text-amber-400' : 'text-gray-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick Tag Chips */}
            <div>
              <span className="block text-xs font-bold text-[#173F35] mb-2">
                Nimalar sizga ayniqsa yoqdi?
              </span>
              <div className="flex flex-wrap gap-1.5">
                {PRESET_TAGS.map((tag) => {
                  const isSelected = selectedTags.includes(tag);
                  return (
                    <button
                      type="button"
                      key={tag}
                      onClick={() => toggleTag(tag)}
                      className={`text-xs font-semibold px-2.5 py-1.5 rounded-xl border transition-all active:scale-95 ${
                        isSelected
                          ? 'bg-[#173F35] text-white border-[#173F35] shadow-xs'
                          : 'bg-[#FAF8F3] text-[#737A75] border-[#E5E0D8] hover:border-[#173F35]'
                      }`}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Text Comment */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-[#173F35] flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-[#173F35]" />
                  <span>Sizning izohingiz yoki taklifingiz</span>
                </label>
                <span className="text-[10px] text-[#737A75] font-mono">{comment.length}/500</span>
              </div>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value.slice(0, 500))}
                rows={3}
                placeholder="Taomlar, xizmat ko'rsatish tezligi yoki xodimlarga iliq tilaklaringizni yozib qoldiring..."
                className="w-full px-3.5 py-2.5 bg-[#FAF8F3] border border-[#E5E0D8] rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-[#173F35] placeholder:text-[#737A75] resize-none"
              />
            </div>

            {/* Optional Waiter Tip */}
            <div className="bg-[#FAF8F3] p-3.5 rounded-2xl border border-[#E5E0D8] space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-[#173F35] flex items-center gap-1.5">
                  <Coffee className="w-3.5 h-3.5 text-amber-600" />
                  <span>Ofitsiantga choypuli (ixtiyoriy)</span>
                </span>
                {selectedTip > 0 && (
                  <span className="font-mono font-bold text-[#173F35]">
                    +{selectedTip.toLocaleString()} so'm
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {TIP_OPTIONS.map((tip) => (
                  <button
                    type="button"
                    key={tip}
                    onClick={() => setSelectedTip(tip)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all border ${
                      selectedTip === tip
                        ? 'bg-[#173F35] text-white border-[#173F35]'
                        : 'bg-white text-[#737A75] border-[#E5E0D8] hover:text-[#173F35]'
                    }`}
                  >
                    {tip === 0 ? "Choypulisiz" : `${tip.toLocaleString()} so'm`}
                  </button>
                ))}
              </div>
            </div>

            {/* Optional Customer Contact info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-[#737A75] font-medium mb-1">
                  Ismingiz (ixtiyoriy):
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Masalan: Sardor"
                  className="w-full px-3 py-2 bg-[#FAF8F3] border border-[#E5E0D8] rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-[#173F35]"
                />
              </div>

              <div>
                <label className="block text-[#737A75] font-medium mb-1">
                  Telefon raqam (ixtiyoriy):
                </label>
                <input
                  type="text"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="+998 90 123 45 67"
                  className="w-full px-3 py-2 bg-[#FAF8F3] border border-[#E5E0D8] rounded-xl text-xs font-mono focus:outline-hidden focus:ring-2 focus:ring-[#173F35]"
                />
              </div>
            </div>

            {/* Submit Action Buttons */}
            <div className="pt-2 flex items-center justify-end gap-3 border-t border-[#F2EFE9]">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-full border border-[#E5E0D8] text-xs font-bold text-[#59635E] hover:bg-[#FAF8F3] transition-colors"
              >
                Keyinroq
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-full bg-[#F59E0B] hover:bg-[#FBBF24] text-[#173F35] text-xs font-extrabold shadow-sm active:scale-95 transition-all flex items-center gap-1.5 disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSubmitting ? 'Yuborilmoqda...' : 'Bahoni Yuborish'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
