import React, { useState, useMemo } from 'react';
import { MenuItem } from '../types';
import { formatUZS } from '../utils/formatters';
import { Plus, Minus, Clock, Utensils, Check, Star, ClipboardList } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { DishModalTab } from './DishDetailModal';

interface DishCardProps {
  dish: MenuItem;
  onSelect: (dish: MenuItem, initialTab?: DishModalTab) => void;
}

export const DishCard: React.FC<DishCardProps> = React.memo(({ dish, onSelect }) => {
  const { cart, addToCart, updateCartQuantity, getDishRating } = useApp();
  const [imageError, setImageError] = useState(false);
  const [imgSrc, setImgSrc] = useState<string>(() => {
    return dish.image_url || `/images/dishes/${dish.id}.jpg`;
  });

  React.useEffect(() => {
    setImageError(false);
    setImgSrc(dish.image_url || `/images/dishes/${dish.id}.jpg`);
  }, [dish.id, dish.image_url]);

  const { quantityInCart, hasSpecialNote } = useMemo(() => {
    const matching = cart.filter((item) => item.menuItem.id === dish.id);
    return {
      quantityInCart: matching.reduce((sum, item) => sum + item.quantity, 0),
      hasSpecialNote: matching.some((item) => Boolean(item.item_note && item.item_note.trim())),
    };
  }, [cart, dish.id]);

  const dishRating = getDishRating(dish.id);

  const handleImageError = () => {
    const fallback = `/images/dishes/${dish.id}.jpg`;
    if (imgSrc !== fallback) {
      setImgSrc(fallback);
    } else {
      setImageError(true);
    }
  };

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!dish.is_available) return;
    addToCart(dish, 1);
  };

  const handleDecrement = (e: React.MouseEvent) => {
    e.stopPropagation();
    updateCartQuantity(dish.id, quantityInCart - 1);
  };

  const handleOpenReviews = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(dish, 'reviews');
  };

  const tierLabel =
    dish.tier === 'vip' ? 'VIP' : dish.tier === 'biznes' ? 'Biznes' : dish.tier === 'oddiy' ? 'Oddiy' : null;

  return (
    <article
      onClick={() => onSelect(dish, 'order')}
      className={`group relative bg-white rounded-2xl p-4 border transition-all duration-200 cursor-pointer flex flex-col justify-between ${
        !dish.is_available
          ? 'opacity-65 grayscale-[30%] border-[#E5E0D8]'
          : quantityInCart > 0
          ? 'border-[#173F35] ring-2 ring-[#F59E0B]/45 shadow-[0_12px_28px_-12px_rgba(23,63,53,0.18)]'
          : 'border-[#E5E0D8] hover:border-[#1E5245]/45 hover:-translate-y-0.5 hover:shadow-[0_14px_30px_-14px_rgba(23,63,53,0.14)]'
      }`}
    >
      <div>
        {/* Uniform 4:3 Image Frame */}
        <div className="relative aspect-[4/3] w-full rounded-xl overflow-hidden bg-[#F3EFE6] mb-3.5">
          {imgSrc && !imageError ? (
            <img
              src={imgSrc}
              alt={dish.name}
              loading="lazy"
              decoding="async"
              referrerPolicy="no-referrer"
              onError={handleImageError}
              className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center bg-gradient-to-br from-[#E8F0EC] to-[#FAF8F3]">
              <div className="w-10 h-10 rounded-xl bg-[#173F35]/10 flex items-center justify-center text-[#173F35] mb-1.5">
                <Utensils className="w-5 h-5" />
              </div>
              <span className="text-xs font-medium text-[#59635E] line-clamp-1">
                {dish.name}
              </span>
            </div>
          )}

          {/* Selected Count or Prep Time */}
          {quantityInCart > 0 ? (
            <div className="absolute top-2.5 left-2.5 bg-[#173F35] text-[#F59E0B] text-xs font-bold px-2.5 py-1 rounded-full shadow-md flex items-center gap-1 tabular-nums">
              <Check className="w-3.5 h-3.5" />
              <span>{quantityInCart} dona</span>
            </div>
          ) : (
            <div className="absolute top-2.5 left-2.5 bg-[#173F35]/80 backdrop-blur-xs text-white text-xs font-medium px-2.5 py-1 rounded-full flex items-center gap-1 tabular-nums">
              <Clock className="w-3.5 h-3.5 text-[#F59E0B]" />
              <span>{dish.preparation_time_minutes} daq</span>
            </div>
          )}

          {/* Subtle single tier tag on media */}
          {tierLabel && (
            <span className="absolute top-2.5 right-2.5 bg-white/95 backdrop-blur-xs text-[#173F35] text-[11px] font-bold px-2.5 py-0.5 rounded-md shadow-2xs">
              {tierLabel}
            </span>
          )}

          {/* Availability Overlay */}
          {!dish.is_available && (
            <div className="absolute inset-0 bg-[#173F35]/60 backdrop-blur-[2px] flex items-center justify-center">
              <span className="bg-red-600 text-white text-xs font-semibold px-3 py-1 rounded-full shadow">
                Vaqtincha tugagan
              </span>
            </div>
          )}
        </div>

        {/* Dish Title */}
        <h3 className="font-display font-bold text-base sm:text-[17px] text-[#173F35] group-hover:text-[#1E5245] transition-colors line-clamp-1">
          {dish.name}
        </h3>

        {/* Clean Unboxed Metadata Row */}
        <div className="flex items-center justify-between gap-2 mt-1.5 mb-2 text-xs">
          <button
            type="button"
            onClick={handleOpenReviews}
            className="inline-flex items-center gap-1 text-[#202622] hover:text-[#1E5245] font-semibold transition-colors"
            title="Taomni baholash va sharhlarni ko'rish"
          >
            <Star
              className={`w-3.5 h-3.5 ${
                dishRating.count > 0 ? 'fill-amber-400 text-amber-400' : 'text-[#C8C2B6]'
              }`}
            />
            {dishRating.count > 0 ? (
              <span className="tabular-nums">
                {dishRating.average.toFixed(1)}{' '}
                <span className="text-[#737A75] font-normal">({dishRating.count})</span>
              </span>
            ) : (
              <span className="text-[#737A75] font-medium hover:text-[#173F35]">Baholash</span>
            )}
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSelect(dish, 'order');
            }}
            className={`inline-flex items-center gap-1 text-xs font-medium transition-colors ${
              hasSpecialNote
                ? 'text-[#1E5245] font-semibold'
                : 'text-[#737A75] hover:text-[#173F35]'
            }`}
            title="Taomga talabnoma yozish"
          >
            <ClipboardList className="w-3.5 h-3.5" />
            <span>{hasSpecialNote ? 'Talabnoma bor' : 'Talabnoma'}</span>
          </button>
        </div>

        <p className="text-[13px] text-[#59635E] line-clamp-2 leading-relaxed mb-4">
          {dish.description}
        </p>
      </div>

      {/* Bottom Price & Action */}
      <div className="pt-3.5 border-t border-[#F2EFE9] flex items-center justify-between gap-2 mt-auto">
        <div className="flex flex-col min-w-0">
          <span className="font-display font-bold text-base text-[#173F35] tabular-nums">
            {formatUZS(dish.price)}
          </span>
          {dish.weight_or_portion && (
            <span className="text-xs text-[#737A75] truncate">{dish.weight_or_portion}</span>
          )}
        </div>

        {quantityInCart > 0 ? (
          <div
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-1 bg-[#173F35] text-white rounded-full p-1 shadow-xs shrink-0"
          >
            <button
              type="button"
              onClick={handleDecrement}
              className="w-8 h-8 rounded-full bg-white/12 hover:bg-white/22 active:scale-95 flex items-center justify-center transition-all"
              aria-label="Kamaytirish"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="w-6 text-center font-mono font-bold text-xs tabular-nums">
              {quantityInCart}
            </span>
            <button
              type="button"
              onClick={handleQuickAdd}
              className="w-8 h-8 rounded-full bg-[#F59E0B] hover:bg-[#D97706] text-[#173F35] active:scale-95 flex items-center justify-center transition-all"
              aria-label="Ko'paytirish"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleQuickAdd}
            disabled={!dish.is_available}
            className={`min-h-[42px] px-4 py-2 rounded-full text-xs sm:text-[13px] font-bold flex items-center gap-1.5 transition-all shrink-0 whitespace-nowrap ${
              dish.is_available
                ? 'bg-[#173F35] text-white hover:bg-[#1E5245] active:scale-95'
                : 'bg-[#EFEAE0] text-[#9CA39E] cursor-not-allowed'
            }`}
          >
            <Plus className="w-4 h-4 text-[#F59E0B]" />
            <span>Qo&apos;shish</span>
          </button>
        )}
      </div>
    </article>
  );
});
