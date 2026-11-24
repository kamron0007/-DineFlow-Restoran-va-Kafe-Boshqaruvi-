import React, { useState, useMemo, useEffect } from 'react';
import { MenuItem } from '../types';
import { formatUZS, formatTimeAgo } from '../utils/formatters';
import {
  X,
  Minus,
  Plus,
  Clock,
  Flame,
  ShoppingBag,
  Utensils,
  Star,
  MessageSquare,
  Send,
  CheckCircle2,
  ClipboardList,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export type DishModalTab = 'order' | 'reviews';

interface DishDetailModalProps {
  dish: MenuItem | null;
  initialTab?: DishModalTab;
  onClose: () => void;
}

const QUICK_REQUEST_PRESETS = [
  'Piyozsiz',
  "Achchiq bo'lmasin",
  'Achchiqroq',
  'Tuzsizroq',
  'Sousi alohida',
  'Qattiqroq pishsin',
  'Issiqroq keltiring',
  'Muzsiz',
];

const STAR_LABELS: Record<number, string> = {
  1: 'Juda yomon',
  2: 'Qoniqarsiz',
  3: "O'rtacha",
  4: 'Juda yaxshi',
  5: "A'lo!",
};

export const DishDetailModal: React.FC<DishDetailModalProps> = ({
  dish,
  initialTab = 'order',
  onClose,
}) => {
  const {
    addToCart,
    dishReviews,
    getDishRating,
    submitDishReview,
    restaurantRating,
  } = useApp();

  const [activeTab, setActiveTab] = useState<DishModalTab>(initialTab);
  const [quantity, setQuantity] = useState(1);
  const [note, setNote] = useState('');
  const [imageError, setImageError] = useState(false);
  const [imgSrc, setImgSrc] = useState<string>(() => {
    return dish?.image_url || (dish ? `/images/dishes/${dish.id}.jpg` : '');
  });

  // Review form state
  const [starRating, setStarRating] = useState<number>(5);
  const [hoverStar, setHoverStar] = useState<number | null>(null);
  const [reviewComment, setReviewComment] = useState<string>('');
  const [reviewerName, setReviewerName] = useState<string>('');
  const [isSubmittingReview, setIsSubmittingReview] = useState<boolean>(false);
  const [reviewSubmitted, setReviewSubmitted] = useState<boolean>(false);

  useEffect(() => {
    setImageError(false);
    setQuantity(1);
    setNote('');
    setActiveTab(initialTab);
    setStarRating(5);
    setHoverStar(null);
    setReviewComment('');
    setReviewSubmitted(false);
    if (dish) {
      setImgSrc(dish.image_url || `/images/dishes/${dish.id}.jpg`);
    }
  }, [dish?.id, dish?.image_url, initialTab]);

  const dishSpecificReviews = useMemo(() => {
    if (!dish) return [];
    return dishReviews.filter((r) => r.menu_item_id === dish.id);
  }, [dishReviews, dish]);

  const ratingStats = useMemo(() => {
    if (!dish) return { average: 0, count: 0 };
    return getDishRating(dish.id);
  }, [dish, getDishRating]);

  const handleImageError = () => {
    if (!dish) return;
    const fallback = `/images/dishes/${dish.id}.jpg`;
    if (imgSrc !== fallback) {
      setImgSrc(fallback);
    } else {
      setImageError(true);
    }
  };

  if (!dish) return null;

  const togglePresetRequest = (preset: string) => {
    const parts = note
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const existsIdx = parts.findIndex((p) => p.toLowerCase() === preset.toLowerCase());
    let nextParts: string[];
    if (existsIdx >= 0) {
      nextParts = parts.filter((_, idx) => idx !== existsIdx);
    } else {
      nextParts = [...parts, preset];
    }
    const nextText = nextParts.join(', ').slice(0, 160);
    setNote(nextText);
  };

  const isPresetActive = (preset: string) => {
    return note
      .split(',')
      .map((s) => s.trim().toLowerCase())
      .includes(preset.toLowerCase());
  };

  const handleAddToCart = () => {
    addToCart(dish, quantity, note.trim() ? note.trim() : undefined);
    onClose();
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmittingReview) return;
    setIsSubmittingReview(true);
    try {
      await submitDishReview({
        menu_item_id: dish.id,
        dish_name: dish.name,
        rating: starRating,
        comment: reviewComment,
        customer_name: reviewerName,
      });
      setReviewComment('');
      setReviewSubmitted(true);
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const totalPrice = dish.price * quantity;
  const displayedStar = hoverStar || starRating;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/55 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-t-3xl sm:rounded-3xl max-w-lg w-full max-h-[92vh] overflow-hidden shadow-2xl border border-[#E5E0D8] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Image Header */}
        <div className="relative aspect-[16/9] w-full bg-[#FAF8F3] overflow-hidden shrink-0">
          {imgSrc && !imageError ? (
            <img
              src={imgSrc}
              alt={dish.name}
              referrerPolicy="no-referrer"
              onError={handleImageError}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center p-6 bg-gradient-to-br from-[#E8F0EC] to-[#FAF8F3]">
              <div className="w-14 h-14 rounded-2xl bg-[#173F35]/10 flex items-center justify-center text-[#173F35] mb-2">
                <Utensils className="w-7 h-7" />
              </div>
              <span className="font-display font-bold text-lg text-[#173F35]">{dish.name}</span>
            </div>
          )}

          {/* Scrim for high-contrast overlay text */}
          <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/75 via-black/30 to-transparent pointer-events-none" />

          {/* Close Button (>= 44x44 touch target) */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Yopish"
            className="absolute top-3 right-3 min-h-[44px] min-w-[44px] rounded-full bg-black/55 hover:bg-black/75 text-white flex items-center justify-center backdrop-blur-md transition-colors shadow"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Bottom overlay clean metadata */}
          <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between gap-2 text-white text-xs font-medium">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="flex items-center gap-1 tabular-nums">
                <Clock className="w-3.5 h-3.5 text-amber-300" />
                <span>{dish.preparation_time_minutes} daq</span>
              </span>
              {dish.calories && (
                <>
                  <span className="opacity-60" aria-hidden="true">·</span>
                  <span className="flex items-center gap-1 tabular-nums">
                    <Flame className="w-3.5 h-3.5 text-orange-300" />
                    <span>{dish.calories} kkal</span>
                  </span>
                </>
              )}
              {dish.weight_or_portion && (
                <>
                  <span className="opacity-60" aria-hidden="true">·</span>
                  <span>{dish.weight_or_portion}</span>
                </>
              )}
            </div>

            <button
              type="button"
              onClick={() => setActiveTab('reviews')}
              className="flex items-center gap-1 bg-black/55 hover:bg-black/75 backdrop-blur-sm px-2.5 py-1 rounded-lg text-amber-300 font-bold tabular-nums transition-colors shrink-0"
            >
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span>
                {ratingStats.count > 0 ? `${ratingStats.average.toFixed(1)} (${ratingStats.count})` : 'Baholash'}
              </span>
            </button>
          </div>
        </div>

        {/* Dish Title, Price & Segmented Mode Switch */}
        <div className="px-5 pt-4 pb-3 border-b border-[#E5E0D8] shrink-0 bg-white">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="min-w-0">
              <h2 className="font-display font-bold text-xl text-[#202622] leading-snug">
                {dish.name}
              </h2>
              <div className="flex items-center gap-1.5 text-xs text-[#737A75] mt-0.5">
                {dish.tier && (
                  <>
                    <span className="font-semibold text-[#173F35]">
                      {dish.tier === 'vip' ? 'VIP taom' : dish.tier === 'biznes' ? 'Biznes taom' : 'Oddiy taom'}
                    </span>
                    <span aria-hidden="true">·</span>
                  </>
                )}
                <span className="tabular-nums">
                  {ratingStats.count > 0
                    ? `${ratingStats.average.toFixed(1)} yulduz (${ratingStats.count} sharh)`
                    : 'Hali baholanmagan'}
                </span>
              </div>
            </div>
            <span className="font-display font-bold text-lg text-[#173F35] whitespace-nowrap tabular-nums">
              {formatUZS(dish.price)}
            </span>
          </div>

          {/* 2-Tab Segmented Switch: Buyurtma & Talabnoma | Baholash & Izohlar */}
          <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-[#FAF8F3] border border-[#E5E0D8]">
            <button
              type="button"
              onClick={() => setActiveTab('order')}
              className={`min-h-[40px] px-3 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all whitespace-nowrap ${
                activeTab === 'order'
                  ? 'bg-[#173F35] text-white shadow-xs'
                  : 'text-[#737A75] hover:text-[#202622]'
              }`}
            >
              <ClipboardList className="w-3.5 h-3.5 shrink-0" />
              <span>Buyurtma va talabnoma</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('reviews')}
              className={`min-h-[40px] px-3 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all whitespace-nowrap ${
                activeTab === 'reviews'
                  ? 'bg-[#173F35] text-white shadow-xs'
                  : 'text-[#737A75] hover:text-[#202622]'
              }`}
            >
              <Star
                className={`w-3.5 h-3.5 shrink-0 ${
                  activeTab === 'reviews' ? 'fill-amber-400 text-amber-400' : ''
                }`}
              />
              <span className="tabular-nums">
                Baholash va izoh ({ratingStats.count})
              </span>
            </button>
          </div>
        </div>

        {/* Scrollable Tab Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {activeTab === 'order' ? (
            <div className="space-y-4">
              <p className="text-sm text-[#57605B] leading-relaxed">{dish.description}</p>

              {/* Dish Special Request (Taomga talabnoma) */}
              <div className="bg-[#FAF8F3] rounded-2xl border border-[#E5E0D8] p-3.5 space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <label
                    htmlFor="dish-special-request"
                    className="text-xs font-bold text-[#202622] flex items-center gap-1.5"
                  >
                    <ClipboardList className="w-4 h-4 text-[#173F35]" />
                    <span>Taomga talabnoma (oshpaz uchun)</span>
                  </label>
                  <span className="text-[11px] text-[#737A75] tabular-nums">{note.length}/160</span>
                </div>

                {/* Quick-tap preset request buttons */}
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_REQUEST_PRESETS.map((preset) => {
                    const active = isPresetActive(preset);
                    return (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => togglePresetRequest(preset)}
                        className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border transition-all active:scale-95 ${
                          active
                            ? 'bg-[#173F35] text-white border-[#173F35]'
                            : 'bg-white text-[#57605B] border-[#E5E0D8] hover:border-[#173F35] hover:text-[#173F35]'
                        }`}
                      >
                        {preset}
                      </button>
                    );
                  })}
                </div>

                <textarea
                  id="dish-special-request"
                  value={note}
                  onChange={(e) => setNote(e.target.value.slice(0, 160))}
                  maxLength={160}
                  placeholder="O'z talabnomangizni yozing: masalan, piyozsiz, kamroq yog'li, qo'shimcha limon bilan..."
                  rows={2}
                  className="w-full text-xs p-3 rounded-xl bg-white border border-[#E5E0D8] text-[#202622] focus:outline-none focus:border-[#173F35] focus:ring-1 focus:ring-[#173F35] resize-none placeholder:text-[#737A75]"
                />
              </div>

              {/* Latest review preview prompt */}
              <div className="flex items-center justify-between pt-1 text-xs">
                <span className="text-[#737A75]">
                  {ratingStats.count > 0
                    ? `Bu taomga ${ratingStats.count} ta mehmon baho bergan`
                    : "Taomni tatib ko'rdingizmi? Birinchi bo'lib baholang"}
                </span>
                <button
                  type="button"
                  onClick={() => setActiveTab('reviews')}
                  className="font-bold text-[#173F35] hover:underline whitespace-nowrap"
                >
                  Baholash →
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Rating impact notice */}
              <div className="bg-[#FAF8F3] rounded-2xl border border-[#E5E0D8] p-3.5 flex items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-display font-extrabold text-2xl text-[#173F35] tabular-nums">
                      {ratingStats.count > 0 ? ratingStats.average.toFixed(1) : '—'}
                    </span>
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`w-4 h-4 ${
                            ratingStats.count > 0 && s <= Math.round(ratingStats.average)
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-[#D6D1C7]'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-[11px] text-[#737A75] mt-0.5">
                    Bahongiz restoran umumiy reytingiga (
                    <strong className="text-[#173F35] tabular-nums">
                      {restaurantRating.averageRating.toFixed(1)} ★
                    </strong>
                    ) ta'sir qiladi
                  </p>
                </div>
                <span className="text-xs font-semibold text-[#737A75] tabular-nums shrink-0">
                  {ratingStats.count} ta baho
                </span>
              </div>

              {/* Submit Dish Star Rating & Comment Form */}
              <form onSubmit={handleReviewSubmit} className="space-y-3">
                {reviewSubmitted && (
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                    <span>
                      Rahmat! Bahongiz qabul qilindi. Restoran reytingi:{' '}
                      <strong className="tabular-nums">
                        {restaurantRating.averageRating.toFixed(1)} ★
                      </strong>{' '}
                      ({restaurantRating.totalReviews} ta baho)
                    </span>
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-[#202622]">
                      Yulduzcha bilan baholang
                    </span>
                    <span className="text-xs font-bold text-amber-700">
                      {displayedStar} ★ · {STAR_LABELS[displayedStar]}
                    </span>
                  </div>
                  <div className="flex items-center justify-center gap-1 py-1.5 bg-[#FAF8F3] rounded-xl border border-[#E5E0D8]">
                    {[1, 2, 3, 4, 5].map((star) => {
                      const active = displayedStar >= star;
                      return (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setStarRating(star)}
                          onMouseEnter={() => setHoverStar(star)}
                          onMouseLeave={() => setHoverStar(null)}
                          aria-label={`${star} yulduzcha`}
                          className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl transition-transform active:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#173F35]"
                        >
                          <Star
                            className={`w-7 h-7 transition-colors ${
                              active ? 'fill-amber-400 text-amber-400' : 'text-[#C8C2B6]'
                            }`}
                          />
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label htmlFor="dish-review-comment" className="text-xs font-semibold text-[#202622]">
                      Taom haqida izohingiz (ixtiyoriy)
                    </label>
                    <span className="text-[10px] text-[#737A75] tabular-nums">
                      {reviewComment.length}/400
                    </span>
                  </div>
                  <textarea
                    id="dish-review-comment"
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value.slice(0, 400))}
                    maxLength={400}
                    rows={3}
                    placeholder="Masalan: Ta'mi juda zo'r, issiq tortildi, porsiyasi yetarli..."
                    className="w-full text-xs p-3 rounded-xl bg-[#FAF8F3] border border-[#E5E0D8] text-[#202622] focus:outline-none focus:border-[#173F35] focus:ring-1 focus:ring-[#173F35] resize-none placeholder:text-[#737A75]"
                  />
                </div>

                <input
                  type="text"
                  value={reviewerName}
                  onChange={(e) => setReviewerName(e.target.value.slice(0, 60))}
                  maxLength={60}
                  placeholder="Ismingiz (ixtiyoriy)"
                  className="w-full min-h-[44px] px-3 py-2 rounded-xl bg-[#FAF8F3] border border-[#E5E0D8] text-xs text-[#202622] focus:outline-none focus:border-[#173F35] focus:ring-1 focus:ring-[#173F35] placeholder:text-[#737A75]"
                />

                <button
                  type="submit"
                  disabled={isSubmittingReview}
                  className="w-full min-h-[46px] py-3 px-4 rounded-xl bg-[#173F35] hover:bg-[#235B4E] active:scale-[0.99] text-white font-display font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-sm disabled:opacity-50"
                >
                  <Send className="w-4 h-4 text-amber-300" />
                  <span>{isSubmittingReview ? 'Yuborilmoqda...' : 'Baho va izohni yuborish'}</span>
                </button>
              </form>

              {/* Existing Dish Reviews List */}
              <div className="pt-2 border-t border-[#E5E0D8]">
                <h4 className="font-display font-bold text-xs text-[#202622] mb-2 flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-[#173F35]" />
                  <span>Ushbu taom bo'yicha sharhlar ({dishSpecificReviews.length})</span>
                </h4>

                {dishSpecificReviews.length > 0 ? (
                  <div className="divide-y divide-[#FAF8F3]">
                    {dishSpecificReviews.map((rev) => (
                      <div key={rev.id} className="py-3 first:pt-1">
                        <div className="flex items-center justify-between gap-2">
                          <div className="text-xs">
                            <span className="font-bold text-[#202622]">
                              {rev.customer_name || `Stol №${rev.table_number} mehmoni`}
                            </span>
                            <span className="mx-1.5 text-[#737A75]" aria-hidden="true">·</span>
                            <span className="text-[11px] text-[#737A75]">
                              {formatTimeAgo(rev.created_at)}
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
                          <p className="text-xs text-[#3C4440] mt-1 leading-relaxed">
                            {rev.comment}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-[#737A75] py-4 text-center">
                    Ushbu taomga hali sharh yozilmagan. Birinchi bahoni siz qoldiring!
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Bottom Sticky Add-to-Cart Action Bar (shown on Order tab) */}
        {activeTab === 'order' && (
          <div className="px-5 py-4 border-t border-[#E5E0D8] bg-white flex items-center gap-3 shrink-0">
            {/* Quantity Stepper */}
            <div className="flex items-center gap-1.5 bg-[#FAF8F3] border border-[#E5E0D8] rounded-xl p-1 shrink-0">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                aria-label="Kamaytirish"
                className="w-10 h-10 rounded-lg bg-white text-[#173F35] shadow-xs flex items-center justify-center hover:bg-slate-50 active:scale-95 transition-all disabled:opacity-40"
                disabled={quantity <= 1}
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-7 text-center text-sm font-bold font-display tabular-nums">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => setQuantity((q) => q + 1)}
                aria-label="Ko'paytirish"
                className="w-10 h-10 rounded-lg bg-[#173F35] text-white shadow-xs flex items-center justify-center hover:bg-[#235B4E] active:scale-95 transition-all"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Submit Add to Cart Button */}
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={!dish.is_available}
              className={`flex-1 min-h-[48px] py-3 px-4 rounded-xl font-display font-semibold text-sm flex items-center justify-center gap-2 shadow-sm transition-all whitespace-nowrap ${
                dish.is_available
                  ? 'bg-[#173F35] text-white hover:bg-[#235B4E] active:scale-[0.98]'
                  : 'bg-slate-200 text-slate-500 cursor-not-allowed'
              }`}
            >
              <ShoppingBag className="w-4 h-4 shrink-0" />
              <span>Savatga qo'shish</span>
              <span className="text-xs opacity-90 tabular-nums">· {formatUZS(totalPrice)}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
