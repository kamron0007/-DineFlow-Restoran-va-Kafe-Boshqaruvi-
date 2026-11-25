import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { formatTimeAgo } from '../utils/formatters';
import { RESTAURANT_LEVEL_SCALE } from '../utils/restaurantLevel';
import { Star, X, MessageSquare, Send, CheckCircle2, Utensils, Award, AlertTriangle } from 'lucide-react';

interface RestaurantReviewsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectDishToRate?: (dishId: string) => void;
}

const STAR_LABELS: Record<number, string> = {
  1: 'Juda yomon',
  2: 'Qoniqarsiz',
  3: "O'rtacha",
  4: 'Juda yaxshi',
  5: "A'lo darajada!",
};

export const RestaurantReviewsModal: React.FC<RestaurantReviewsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    restaurantName,
    restaurantRating,
    dishReviews,
    feedbacks,
    menuItems,
    submitDishReview,
  } = useApp();

  const [selectedDishId, setSelectedDishId] = useState<string>(menuItems[0]?.id || 'dish-1');
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [comment, setComment] = useState<string>('');
  const [customerName, setCustomerName] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submittedSuccess, setSubmittedSuccess] = useState<boolean>(false);

  // Merge dish reviews & order feedbacks into a single chronological feed
  const combinedReviews = useMemo(() => {
    const dishEntries = dishReviews.map((r) => ({
      id: r.id,
      kind: 'dish' as const,
      title: r.dish_name,
      rating: r.rating,
      comment: r.comment,
      author: r.customer_name || `Stol №${r.table_number} mehmoni`,
      tableNumber: r.table_number,
      createdAt: r.created_at,
    }));

    const orderEntries = feedbacks.map((f) => ({
      id: f.id,
      kind: 'order' as const,
      title: `Umumiy xizmat (${f.order_number})`,
      rating: f.overall_rating,
      comment: f.comment,
      author: f.customer_name || `Stol №${f.table_number} mehmoni`,
      tableNumber: f.table_number,
      createdAt: f.created_at,
    }));

    return [...dishEntries, ...orderEntries].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [dishReviews, feedbacks]);

  if (!isOpen) return null;

  const activeStarValue = hoverRating || rating;

  const handleQuickSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetDish = menuItems.find((m) => m.id === selectedDishId) || menuItems[0];
    if (!targetDish || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await submitDishReview({
        menu_item_id: targetDish.id,
        dish_name: targetDish.name,
        rating,
        comment,
        customer_name: customerName,
      });
      setComment('');
      setSubmittedSuccess(true);
      setTimeout(() => setSubmittedSuccess(false), 4500);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/55 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-t-3xl sm:rounded-3xl max-w-xl w-full max-h-[92vh] flex flex-col overflow-hidden shadow-2xl border border-[#E5E0D8]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile grab handle */}
        <div className="sm:hidden pt-2.5 pb-1 flex justify-center bg-[#173F35]">
          <div className="w-10 h-1.5 rounded-full bg-white/25" />
        </div>

        {/* Header */}
        <div className="bg-[#173F35] text-white px-6 py-4 flex items-center justify-between gap-3 shrink-0">
          <div className="min-w-0">
            <h2 className="font-display font-extrabold text-lg leading-tight truncate">
              {restaurantName || 'Zafaran Grand'} — Daraja va Reyting
            </h2>
            <p className="text-xs text-emerald-100/80 mt-0.5">
              Har bir baho restoran darajasini real vaqtda ko&apos;taradi yoki tushiradi
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Yopish"
            className="min-h-[40px] min-w-[40px] rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Live Restaurant Level Card (Driven Dynamically by Guest Ratings) */}
          <div
            className={`rounded-2xl border p-4 space-y-3.5 ${
              restaurantRating.level.isAtRisk
                ? 'bg-amber-50/75 border-amber-200'
                : 'bg-[#173F35] text-white border-[#173F35]'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
                    restaurantRating.level.isAtRisk
                      ? 'bg-amber-200 text-amber-950'
                      : 'bg-[#F59E0B] text-[#173F35]'
                  }`}
                >
                  {restaurantRating.level.isAtRisk ? (
                    <AlertTriangle className="w-5 h-5" />
                  ) : (
                    <Award className="w-5 h-5" />
                  )}
                </div>
                <div className="min-w-0">
                  <p
                    className={`text-[11px] font-bold uppercase tracking-wider ${
                      restaurantRating.level.isAtRisk ? 'text-amber-800' : 'text-[#F59E0B]'
                    }`}
                  >
                    Restoran darajasi · {restaurantRating.level.levelNumber} / 5
                  </p>
                  <h3
                    className={`font-display font-extrabold text-lg leading-tight ${
                      restaurantRating.level.isAtRisk ? 'text-[#202622]' : 'text-white'
                    }`}
                  >
                    {restaurantRating.level.title}
                  </h3>
                </div>
              </div>
              <div className="text-right shrink-0">
                <span
                  className={`font-mono font-extrabold text-2xl tabular-nums leading-none ${
                    restaurantRating.level.isAtRisk ? 'text-amber-900' : 'text-[#F59E0B]'
                  }`}
                >
                  {restaurantRating.averageRating.toFixed(1)} ★
                </span>
                <p
                  className={`text-[11px] mt-1 tabular-nums ${
                    restaurantRating.level.isAtRisk ? 'text-amber-900/75' : 'text-emerald-100/75'
                  }`}
                >
                  {restaurantRating.totalReviews} ta baho
                </p>
              </div>
            </div>

            <p
              className={`text-xs leading-relaxed ${
                restaurantRating.level.isAtRisk ? 'text-amber-950/85' : 'text-emerald-100/85'
              }`}
            >
              {restaurantRating.level.subtitle}
            </p>

            {/* 5-Level Visual Scale */}
            <div className="grid grid-cols-5 gap-1.5 pt-1">
              {RESTAURANT_LEVEL_SCALE.map((lvl) => {
                const isReached = restaurantRating.level.levelNumber >= lvl.levelNumber;
                const isCurrent = restaurantRating.level.levelNumber === lvl.levelNumber;
                return (
                  <div key={lvl.tier} className="space-y-1">
                    <div
                      className={`h-1.5 rounded-full transition-all ${
                        isCurrent
                          ? 'bg-[#F59E0B]'
                          : isReached
                          ? restaurantRating.level.isAtRisk
                            ? 'bg-amber-500/70'
                            : 'bg-emerald-300/75'
                          : restaurantRating.level.isAtRisk
                          ? 'bg-amber-900/15'
                          : 'bg-white/15'
                      }`}
                    />
                    <p
                      className={`text-[10px] truncate ${
                        isCurrent
                          ? restaurantRating.level.isAtRisk
                            ? 'font-bold text-amber-950'
                            : 'font-bold text-[#F59E0B]'
                          : restaurantRating.level.isAtRisk
                          ? 'text-amber-900/60'
                          : 'text-emerald-100/60'
                      }`}
                    >
                      {lvl.levelNumber}. {lvl.title.split(' ')[0]}
                    </p>
                  </div>
                );
              })}
            </div>

            {restaurantRating.level.nextLevelTitle && (
              <div
                className={`text-[11px] pt-2 border-t flex items-center justify-between gap-2 ${
                  restaurantRating.level.isAtRisk
                    ? 'border-amber-200 text-amber-900'
                    : 'border-white/15 text-emerald-100/85'
                }`}
              >
                <span>Keyingi daraja: {restaurantRating.level.nextLevelTitle}</span>
                <span className="font-mono font-semibold tabular-nums">
                  {restaurantRating.level.nextLevelMinScore?.toFixed(1)}★ kerak
                </span>
              </div>
            )}
          </div>

          {/* Overall Restaurant Rating Summary */}
          <div className="bg-[#FAF8F3] rounded-2xl border border-[#E5E0D8] p-4 grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
            <div className="sm:col-span-5 text-center sm:border-r sm:border-[#E5E0D8] sm:pr-4">
              <div className="font-display font-extrabold text-4xl text-[#173F35] tabular-nums leading-none">
                {restaurantRating.averageRating.toFixed(1)}
              </div>
              <div className="flex items-center justify-center gap-1 my-2">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    className={`w-4 h-4 ${
                      s <= Math.round(restaurantRating.averageRating)
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-[#D6D1C7]'
                    }`}
                  />
                ))}
              </div>
              <p className="text-xs text-[#737A75] tabular-nums">
                Jami {restaurantRating.totalReviews} ta baho · {restaurantRating.dishReviewsCount} ta taom sharhi
              </p>
            </div>

            {/* 5 -> 1 Distribution Bars */}
            <div className="sm:col-span-7 space-y-1.5">
              {([5, 4, 3, 2, 1] as const).map((starLevel) => {
                const count = restaurantRating.distribution[starLevel] || 0;
                const pct =
                  restaurantRating.totalReviews > 0
                    ? Math.round((count / restaurantRating.totalReviews) * 100)
                    : 0;
                return (
                  <div key={starLevel} className="flex items-center gap-2 text-xs">
                    <span className="w-7 text-right font-semibold text-[#202622] tabular-nums flex items-center justify-end gap-0.5 shrink-0">
                      {starLevel}
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                    </span>
                    <div className="flex-1 h-2 bg-[#E5E0D8] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#173F35] rounded-full transition-all duration-300"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="w-8 text-right text-[11px] text-[#737A75] tabular-nums shrink-0">
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Rate a Dish Form */}
          <form
            onSubmit={handleQuickSubmit}
            className="bg-white rounded-2xl border border-[#E5E0D8] p-4 space-y-3.5"
          >
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-display font-bold text-sm text-[#202622] flex items-center gap-1.5">
                <Utensils className="w-4 h-4 text-[#173F35]" />
                <span>Taomni baholash va izoh qoldirish</span>
              </h3>
              <span className="text-[11px] font-semibold text-[#173F35]">
                {STAR_LABELS[activeStarValue]}
              </span>
            </div>

            {submittedSuccess && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>
                  Rahmat! Bahongiz saqlandi. Yangilangan daraja:{' '}
                  <strong>{restaurantRating.level.title}</strong> (
                  <strong className="tabular-nums">{restaurantRating.averageRating.toFixed(1)} ★</strong>).
                </span>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-[#737A75] mb-1">
                Qaysi taomni baholaysiz?
              </label>
              <select
                value={selectedDishId}
                onChange={(e) => setSelectedDishId(e.target.value)}
                className="w-full min-h-[44px] px-3 py-2 rounded-xl bg-[#FAF8F3] border border-[#E5E0D8] text-xs font-semibold text-[#202622] focus:outline-none focus:border-[#173F35] focus:ring-1 focus:ring-[#173F35]"
              >
                {menuItems.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Interactive 5-Star Selector */}
            <div className="flex items-center justify-center gap-1 py-1 bg-[#FAF8F3] rounded-xl border border-[#E5E0D8]">
              {[1, 2, 3, 4, 5].map((star) => {
                const filled = activeStarValue >= star;
                return (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(null)}
                    aria-label={`${star} yulduzcha`}
                    className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl transition-transform active:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#173F35]"
                  >
                    <Star
                      className={`w-7 h-7 transition-colors ${
                        filled ? 'fill-amber-400 text-amber-400' : 'text-[#C8C2B6]'
                      }`}
                    />
                  </button>
                );
              })}
            </div>

            <div className="grid grid-cols-1 gap-2.5">
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                maxLength={60}
                placeholder="Ismingiz (ixtiyoriy, masalan: Aziz)"
                className="w-full min-h-[44px] px-3 py-2 rounded-xl bg-[#FAF8F3] border border-[#E5E0D8] text-xs text-[#202622] placeholder:text-[#737A75] focus:outline-none focus:border-[#173F35] focus:ring-1 focus:ring-[#173F35]"
              />
              <div>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  maxLength={400}
                  rows={2}
                  placeholder="Taom mazasi, harorati yoki xizmat haqida izohingizni yozing..."
                  className="w-full px-3 py-2.5 rounded-xl bg-[#FAF8F3] border border-[#E5E0D8] text-xs text-[#202622] placeholder:text-[#737A75] focus:outline-none focus:border-[#173F35] focus:ring-1 focus:ring-[#173F35] resize-none"
                />
                <div className="flex justify-end mt-0.5">
                  <span className="text-[10px] text-[#737A75] tabular-nums">{comment.length}/400</span>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full min-h-[46px] py-2.5 px-4 rounded-full bg-[#F59E0B] hover:bg-[#FBBF24] active:scale-[0.99] text-[#173F35] font-display font-extrabold text-xs flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Saqlanmoqda...' : 'Baho va izohni yuborish'}</span>
            </button>
          </form>

          {/* Guest Reviews List */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <h3 className="font-display font-bold text-sm text-[#202622] flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4 text-[#173F35]" />
                <span>Mehmonlar sharhlari ({combinedReviews.length})</span>
              </h3>
            </div>

            {combinedReviews.length > 0 ? (
              <div className="divide-y divide-[#E5E0D8] border-t border-[#E5E0D8]">
                {combinedReviews.slice(0, 20).map((rev) => (
                  <div key={rev.id} className="py-3.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap text-xs">
                          <span className="font-bold text-[#202622]">{rev.author}</span>
                          <span className="text-[#737A75]" aria-hidden="true">·</span>
                          <span className="font-semibold text-[#173F35] truncate">{rev.title}</span>
                        </div>
                        <span className="text-[11px] text-[#737A75] block mt-0.5">
                          Stol №{rev.tableNumber} · {formatTimeAgo(rev.createdAt)}
                        </span>
                      </div>

                      <div className="flex items-center gap-0.5 shrink-0">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className={`w-3.5 h-3.5 ${
                              s <= rev.rating ? 'fill-amber-400 text-amber-400' : 'text-[#D6D1C7]'
                            }`}
                          />
                        ))}
                      </div>
                    </div>

                    {rev.comment && (
                      <p className="text-xs text-[#3C4440] mt-1.5 leading-relaxed">
                        {rev.comment}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[#737A75] py-6 text-center">
                Hozircha sharhlar yo'q. Birinchi bo'lib baho qoldiring!
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
