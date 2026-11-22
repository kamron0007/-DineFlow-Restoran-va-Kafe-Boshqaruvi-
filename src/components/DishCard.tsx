import React, { useState, useMemo } from 'react';
import { MenuItem } from '../types';
import { formatUZS } from '../utils/formatters';
import { Plus, Minus, Clock, Utensils, Check } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface DishCardProps {
  dish: MenuItem;
  onSelect: (dish: MenuItem) => void;
}

export const DishCard: React.FC<DishCardProps> = React.memo(({ dish, onSelect }) => {
  const { cart, addToCart, updateCartQuantity } = useApp();
  const [imageError, setImageError] = useState(false);
  const [imgSrc, setImgSrc] = useState<string>(() => {
    return dish.image_url || `/images/dishes/${dish.id}.jpg`;
  });

  React.useEffect(() => {
    setImageError(false);
    setImgSrc(dish.image_url || `/images/dishes/${dish.id}.jpg`);
  }, [dish.id, dish.image_url]);

  // Total quantity of this dish currently in cart
  const quantityInCart = useMemo(() => {
    return cart
      .filter((item) => item.menuItem.id === dish.id)
      .reduce((sum, item) => sum + item.quantity, 0);
  }, [cart, dish.id]);

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

  return (
    <div
      onClick={() => onSelect(dish)}
      className={`group relative bg-white rounded-2xl p-3 border transition-all duration-150 cursor-pointer flex flex-col justify-between ${
        !dish.is_available
          ? 'opacity-65 grayscale-[30%] border-[#E5E0D8]'
          : quantityInCart > 0
          ? 'border-[#173F35] ring-2 ring-[#173F35]/15 shadow-md'
          : 'border-[#E5E0D8] shadow-[0_2px_8px_-2px_rgba(23,63,53,0.04)] hover:border-[#173F35]/50 hover:shadow-md'
      }`}
    >
      <div>
        {/* Image Frame */}
        <div className="relative aspect-[4/3] w-full rounded-xl overflow-hidden bg-[#FAF8F3] mb-2.5">
          {imgSrc && !imageError ? (
            <img
              src={imgSrc}
              alt={dish.name}
              loading="lazy"
              decoding="async"
              referrerPolicy="no-referrer"
              onError={handleImageError}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center bg-gradient-to-br from-[#E8F0EC] to-[#FAF8F3]">
              <div className="w-10 h-10 rounded-full bg-[#173F35]/10 flex items-center justify-center text-[#173F35] mb-1">
                <Utensils className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-medium text-[#737A75] line-clamp-1">
                {dish.name}
              </span>
            </div>
          )}

          {/* Prep time or Selected Quantity badge */}
          {quantityInCart > 0 ? (
            <div className="absolute top-2 left-2 bg-[#173F35] text-amber-300 text-[11px] font-extrabold px-2.5 py-0.5 rounded-lg shadow-md flex items-center gap-1 tabular-nums">
              <Check className="w-3 h-3 text-emerald-400" />
              <span>{quantityInCart} dona tanlandi</span>
            </div>
          ) : (
            <div className="absolute top-2 left-2 bg-black/65 backdrop-blur-xs text-white text-[10px] font-medium px-2 py-0.5 rounded-md flex items-center gap-1 tabular-nums">
              <Clock className="w-3 h-3 text-amber-300" />
              <span>{dish.preparation_time_minutes} daq</span>
            </div>
          )}

          {/* Tier badge: Oddiy / Biznes / VIP */}
          <div className="absolute top-2 right-2 flex items-center gap-1">
            {dish.tier === 'vip' ? (
              <span className="bg-amber-500 text-slate-950 text-[10px] font-extrabold px-2 py-0.5 rounded-md shadow-xs">
                ★ VIP
              </span>
            ) : dish.tier === 'biznes' ? (
              <span className="bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-xs">
                Biznes
              </span>
            ) : dish.tier === 'oddiy' ? (
              <span className="bg-emerald-700 text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-xs">
                Oddiy
              </span>
            ) : null}
          </div>

          {/* Availability Badge */}
          {!dish.is_available && (
            <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px] flex items-center justify-center">
              <span className="bg-red-500/90 text-white text-xs font-semibold px-2.5 py-1 rounded-full shadow">
                Vaqtincha tugagan
              </span>
            </div>
          )}
        </div>

        {/* Dish Title & Description */}
        <h3 className="font-display font-bold text-base text-[#202622] group-hover:text-[#173F35] transition-colors line-clamp-1 mb-0.5">
          {dish.name}
        </h3>
        <p className="text-xs text-[#737A75] line-clamp-2 leading-relaxed mb-2.5">
          {dish.description}
        </p>
      </div>

      {/* Bottom Price & Instant Inline Stepper / Add Button */}
      <div className="pt-2.5 border-t border-[#FAF8F3] flex items-center justify-between gap-2 mt-auto">
        <div className="flex flex-col min-w-0">
          <span className="font-display font-bold text-base text-[#173F35] tabular-nums">
            {formatUZS(dish.price)}
          </span>
          {dish.weight_or_portion && (
            <span className="text-[10px] text-[#737A75] truncate">{dish.weight_or_portion}</span>
          )}
        </div>

        {quantityInCart > 0 ? (
          <div
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-1 bg-[#173F35] text-white rounded-xl p-1 shadow-xs shrink-0"
          >
            <button
              type="button"
              onClick={handleDecrement}
              className="w-7 h-7 rounded-lg bg-white/15 hover:bg-white/25 active:scale-95 flex items-center justify-center transition-all"
              aria-label="Kamaytirish"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="w-6 text-center font-mono font-extrabold text-xs tabular-nums">
              {quantityInCart}
            </span>
            <button
              type="button"
              onClick={handleQuickAdd}
              className="w-7 h-7 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 active:scale-95 flex items-center justify-center transition-all"
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
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1 transition-all shrink-0 ${
              dish.is_available
                ? 'bg-[#173F35] text-white hover:bg-[#235B4E] active:scale-95 shadow-xs'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
            }`}
          >
            <Plus className="w-4 h-4 text-amber-400" />
            <span>Qo'shish</span>
          </button>
        )}
      </div>
    </div>
  );
});
