import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { CustomerHeader } from '../../components/CustomerHeader';
import { CustomerBottomNav } from '../../components/CustomerBottomNav';
import { DishCard } from '../../components/DishCard';
import { DishDetailModal, DishModalTab } from '../../components/DishDetailModal';
import { RestaurantReviewsModal } from '../../components/RestaurantReviewsModal';
import { MenuItem } from '../../types';
import { formatUZS, ORDER_STATUS_MAP } from '../../utils/formatters';
import {
  Search,
  X,
  ShoppingBag,
  ArrowRight,
  Utensils,
  UserCheck,
  Bell,
  CheckCircle2,
  Clock,
  Star,
  ChevronRight,
} from 'lucide-react';
import { useNavigate, useSearchParams, useParams } from 'react-router-dom';

export const MenuPage: React.FC = () => {
  const {
    categories,
    menuItems,
    tables,
    waiters,
    orders,
    serviceCalls,
    activeTableNumber,
    setActiveTableNumber,
    callWaiter,
    placeOrder,
    cart,
    cartTotal,
    cartItemCount,
    restaurantName,
    restaurantRating,
  } = useApp();
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('cat-all');
  const [selectedTier, setSelectedTier] = useState<'all' | 'oddiy' | 'biznes' | 'vip'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedDish, setSelectedDish] = useState<MenuItem | null>(null);
  const [selectedDishTab, setSelectedDishTab] = useState<DishModalTab>('order');
  const [isRestaurantReviewsOpen, setIsRestaurantReviewsOpen] = useState<boolean>(false);
  const [isQuickOrdering, setIsQuickOrdering] = useState<boolean>(false);
  const [searchParams] = useSearchParams();
  const { tableNum } = useParams<{ tableNum?: string }>();
  const navigate = useNavigate();

  const handleOpenDish = (dish: MenuItem, initialTab: DishModalTab = 'order') => {
    setSelectedDishTab(initialTab);
    setSelectedDish(dish);
  };

  // Automatically detect and lock table number from scanned QR URL (/t/1 or /menu?table=1)
  useEffect(() => {
    const rawTable = tableNum || searchParams.get('table');
    if (rawTable) {
      const parsed = parseInt(rawTable, 10);
      if (!isNaN(parsed) && parsed > 0 && parsed !== activeTableNumber) {
        setActiveTableNumber(parsed);
      }
    }
  }, [tableNum, searchParams, activeTableNumber, setActiveTableNumber]);

  const currentTable = useMemo(() => {
    return tables.find((t) => t.table_number === activeTableNumber) || null;
  }, [tables, activeTableNumber]);

  const assignedWaiter = useMemo(() => {
    return (
      waiters.find((w) => w.assigned_tables?.includes(activeTableNumber)) || null
    );
  }, [waiters, activeTableNumber]);

  const activeTableCall = useMemo(() => {
    return (
      serviceCalls.find(
        (c) => c.table_number === activeTableNumber && c.status === 'pending'
      ) || null
    );
  }, [serviceCalls, activeTableNumber]);

  const activeTableOrder = useMemo(() => {
    return (
      orders.find(
        (o) =>
          o.table_number === activeTableNumber &&
          o.status !== 'delivered' &&
          o.status !== 'cancelled'
      ) || null
    );
  }, [orders, activeTableNumber]);

  const zoneLabel = useMemo(() => {
    if (!currentTable) return 'Asosiy zal';
    if (currentTable.zone === 'vip' || currentTable.tier === 'vip') return 'VIP Xona';
    if (currentTable.zone === 'terrace' || currentTable.tier === 'biznes')
      return 'Biznes / Veranda';
    return 'Asosiy zal';
  }, [currentTable]);

  // Filter dishes
  const filteredDishes = useMemo(() => {
    return menuItems.filter((dish) => {
      const matchesCategory =
        selectedCategoryId === 'cat-all' || dish.category_id === selectedCategoryId;
      const matchesTier = selectedTier === 'all' || dish.tier === selectedTier;
      const matchesSearch =
        searchQuery.trim() === '' ||
        dish.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        dish.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesTier && matchesSearch;
    });
  }, [menuItems, selectedCategoryId, selectedTier, searchQuery]);

  // 1-Click Instant Order directly from MenuPage
  const handleQuickOrder = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (cart.length === 0 || isQuickOrdering) return;
    setIsQuickOrdering(true);
    try {
      const created = await placeOrder();
      navigate(`/orders?orderId=${created.id}`);
    } catch {
      setIsQuickOrdering(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F3] pb-28 md:pb-16 flex flex-col">
      <CustomerHeader />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 pt-3">
        {/* STOL PASPORTI (Automatic Scanned Table Info for Customer Only) */}
        <div className="mb-3 bg-white rounded-2xl border border-[#E5E0D8] p-3.5 shadow-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-[#173F35] text-white flex flex-col items-center justify-center shrink-0 shadow-xs">
              <span className="text-[9px] uppercase tracking-wider text-amber-300 font-bold leading-none">
                STOL
              </span>
              <span className="font-mono font-extrabold text-base tabular-nums leading-tight mt-0.5">
                №{activeTableNumber}
              </span>
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-xs text-[#737A75] flex-wrap">
                <span className="font-display font-bold text-sm text-[#202622]">
                  Siz №{activeTableNumber}-stoldasiz
                </span>
                <span aria-hidden="true">·</span>
                <span className="font-medium text-[#173F35]">{zoneLabel}</span>
                <span aria-hidden="true">·</span>
                <span className="tabular-nums">{currentTable?.seats || 4} o'rinli</span>
              </div>

              <div className="flex items-center gap-1.5 text-xs text-[#737A75] mt-0.5 truncate">
                <UserCheck className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                <span>Xizmatda:</span>
                <span className="font-semibold text-[#173F35] truncate">
                  {assignedWaiter
                    ? `${assignedWaiter.badge_id} · ${assignedWaiter.full_name}`
                    : currentTable?.assigned_waiter_name || 'Karimov Dilshod'}
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => callWaiter()}
            className={`px-3.5 py-2.5 rounded-xl border text-xs font-bold flex items-center gap-2 transition-all active:scale-95 whitespace-nowrap shrink-0 ${
              activeTableCall
                ? (activeTableCall.call_count || 1) >= 2
                  ? 'bg-red-600 hover:bg-red-700 text-white border-red-700 shadow-sm'
                  : 'bg-amber-500 hover:bg-amber-600 text-slate-950 border-amber-600 shadow-sm'
                : 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-300 shadow-2xs'
            }`}
          >
            <span className="relative flex items-center justify-center">
              {activeTableCall && (
                <span
                  className={`animate-ping absolute inline-flex h-3.5 w-3.5 rounded-full opacity-60 ${
                    (activeTableCall.call_count || 1) >= 2 ? 'bg-white' : 'bg-[#173F35]'
                  }`}
                />
              )}
              <Bell className={`w-4 h-4 relative ${activeTableCall ? 'animate-bounce' : ''}`} />
            </span>
            <span>
              {activeTableCall
                ? (activeTableCall.call_count || 1) >= 2
                  ? `Adminga xabar berildi (${activeTableCall.call_count}x)`
                  : `Chaqiruv faol (${activeTableCall.call_count || 1}x)`
                : 'Ofitsiantni chaqirish'}
            </span>
          </button>
        </div>

        {/* Live Restaurant Rating & Reviews Trigger Bar */}
        <button
          type="button"
          onClick={() => setIsRestaurantReviewsOpen(true)}
          className="w-full mb-3 min-h-[48px] bg-white hover:bg-[#FCFBF8] active:scale-[0.995] rounded-2xl border border-[#E5E0D8] px-3.5 py-2.5 shadow-xs flex items-center justify-between gap-3 text-left transition-all"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex items-center gap-1 text-[#173F35] shrink-0">
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              <span className="font-display font-extrabold text-sm tabular-nums">
                {restaurantRating.averageRating.toFixed(1)}
              </span>
            </div>
            <span className="text-[#D6D1C7]" aria-hidden="true">·</span>
            <div className="text-xs text-[#57605B] truncate">
              <span className="font-semibold text-[#202622]">
                {restaurantName || 'Zafaran Grand'} reytingi
              </span>
              <span className="mx-1.5 text-[#A5A096]" aria-hidden="true">·</span>
              <span className="tabular-nums">{restaurantRating.totalReviews} ta baho</span>
            </div>
          </div>
          <span className="inline-flex items-center gap-1 text-xs font-bold text-[#173F35] whitespace-nowrap shrink-0">
            <span>Baholash va sharhlar</span>
            <ChevronRight className="w-4 h-4" />
          </span>
        </button>

        {/* Live Active Order Banner if table has an active order */}
        {activeTableOrder && (
          <div
            onClick={() => navigate(`/orders?orderId=${activeTableOrder.id}`)}
            className="mb-3 bg-[#173F35] text-white rounded-2xl px-4 py-2.5 shadow-xs flex items-center justify-between gap-3 cursor-pointer hover:bg-[#235B4E] transition-colors"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <Clock className="w-4 h-4 text-amber-400 shrink-0 animate-pulse" />
              <div className="text-xs truncate">
                <span className="font-bold text-amber-300">{activeTableOrder.order_number}</span>
                <span className="mx-1.5 opacity-60">·</span>
                <span className="font-semibold">
                  {ORDER_STATUS_MAP[activeTableOrder.status]?.label || 'Tayyorlanmoqda'}
                </span>
                <span className="mx-1.5 opacity-60 hidden sm:inline">·</span>
                <span className="tabular-nums hidden sm:inline opacity-90">
                  {formatUZS(activeTableOrder.total_amount)}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1 text-xs font-bold text-amber-300 shrink-0">
              <span>Kuzatish</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>
        )}

        {/* Search Bar */}
        <div className="relative mb-3">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#737A75]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Taom nomi yoki tarkibi bo'yicha qidiruv..."
            className="w-full pl-10 pr-10 py-2.5 rounded-2xl bg-white border border-[#E5E0D8] text-sm text-[#202622] placeholder:text-[#737A75] focus:outline-none focus:border-[#173F35] focus:ring-1 focus:ring-[#173F35] shadow-xs"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#737A75] hover:text-[#202622] p-1"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Category Horizontal Filter Buttons */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 mb-2 no-scrollbar scroll-smooth">
          {categories.map((cat) => {
            const isSelected = selectedCategoryId === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategoryId(cat.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-[#173F35] text-white shadow-sm'
                    : 'bg-white text-[#737A75] hover:text-[#202622] border border-[#E5E0D8]'
                }`}
              >
                <span>{cat.name}</span>
              </button>
            );
          })}
        </div>

        {/* Dish Tier Filter Bar: Oddiy / Biznes / VIP */}
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#E5E0D8]/60 gap-2 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold text-[#737A75] uppercase tracking-wider mr-1 hidden sm:inline">
              Turi:
            </span>
            {[
              { id: 'all', label: 'Barcha turlar' },
              { id: 'oddiy', label: 'Oddiy' },
              { id: 'biznes', label: 'Biznes' },
              { id: 'vip', label: 'VIP' },
            ].map((t) => {
              const active = selectedTier === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setSelectedTier(t.id as any)}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                    active
                      ? t.id === 'vip'
                        ? 'bg-amber-500 text-slate-950 shadow-xs'
                        : t.id === 'biznes'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : t.id === 'oddiy'
                        ? 'bg-emerald-700 text-white shadow-xs'
                        : 'bg-[#173F35] text-white shadow-xs'
                      : 'bg-white text-[#737A75] border border-[#E5E0D8] hover:border-[#173F35]'
                  }`}
                >
                  {t.label}
                </button>
              );
            })}
          </div>

          <span className="text-xs text-[#737A75] whitespace-nowrap tabular-nums">
            {filteredDishes.length} ta taom
          </span>
        </div>

        {/* Menu Grid Header */}
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display font-bold text-lg text-[#202622]">
            {categories.find((c) => c.id === selectedCategoryId)?.name || 'Barcha taomlar'}
            {selectedTier !== 'all' && (
              <span className="text-xs font-bold text-[#173F35] ml-2">
                ({selectedTier === 'vip' ? 'VIP' : selectedTier === 'biznes' ? 'Biznes' : 'Oddiy'})
              </span>
            )}
          </h2>
        </div>

        {/* Dishes Grid */}
        {filteredDishes.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
            {filteredDishes.map((dish) => (
              <DishCard key={dish.id} dish={dish} onSelect={handleOpenDish} />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-[#E5E0D8] p-10 text-center my-6">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3 text-slate-500">
              <Utensils className="w-6 h-6" />
            </div>
            <h3 className="font-display font-semibold text-base text-[#202622] mb-1">
              Taom topilmadi
            </h3>
            <p className="text-xs text-[#737A75] mb-4">
              "{searchQuery}" so'rovi bo'yicha hech qanday taom mavjud emas.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategoryId('cat-all');
              }}
              className="px-4 py-2 rounded-xl bg-[#173F35] text-white text-xs font-semibold hover:bg-[#235B4E] transition-colors"
            >
              Barcha taomlarni ko'rsatish
            </button>
          </div>
        )}
      </main>

      {/* Fast 1-Click Order & Cart Floating Bar */}
      {cart.length > 0 && (
        <div className="fixed bottom-18 md:bottom-5 left-3 right-3 z-40 max-w-2xl mx-auto">
          <div className="bg-[#173F35] text-white p-2.5 sm:p-3 rounded-2xl shadow-2xl flex items-center justify-between gap-2 border border-emerald-800">
            <button
              type="button"
              onClick={() => navigate('/cart')}
              className="flex items-center gap-2.5 text-left hover:bg-white/10 p-1.5 rounded-xl transition-colors min-w-0 flex-1"
            >
              <div className="w-10 h-10 rounded-xl bg-white/15 text-amber-300 flex items-center justify-center font-bold text-sm shrink-0 relative">
                <ShoppingBag className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 bg-amber-500 text-slate-950 text-[10px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center tabular-nums">
                  {cartItemCount}
                </span>
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-display font-bold text-sm tabular-nums truncate">
                  {formatUZS(cartTotal)}
                </span>
                <span className="text-[11px] text-emerald-200 truncate">
                  {cartItemCount} ta taom · Savatni ko'rish
                </span>
              </div>
            </button>

            <button
              type="button"
              onClick={handleQuickOrder}
              disabled={isQuickOrdering}
              className="bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-display font-extrabold text-xs sm:text-sm px-4 py-3 rounded-xl shadow-md flex items-center gap-1.5 transition-all shrink-0"
            >
              <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
              <span>{isQuickOrdering ? 'Yuborilmoqda...' : 'Buyurtma berish'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Dish Detail & Rating Modal */}
      <DishDetailModal
        dish={selectedDish}
        initialTab={selectedDishTab}
        onClose={() => setSelectedDish(null)}
      />

      {/* Restaurant Overall Rating & Reviews Modal */}
      <RestaurantReviewsModal
        isOpen={isRestaurantReviewsOpen}
        onClose={() => setIsRestaurantReviewsOpen(false)}
      />

      {/* Mobile Bottom Navigation */}
      <CustomerBottomNav />
    </div>
  );
};
