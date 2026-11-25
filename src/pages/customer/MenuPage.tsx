import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { CustomerHeader } from '../../components/CustomerHeader';
import { CustomerBottomNav } from '../../components/CustomerBottomNav';
import { DishCard } from '../../components/DishCard';
import { DishDetailModal, DishModalTab } from '../../components/DishDetailModal';
import { RestaurantReviewsModal } from '../../components/RestaurantReviewsModal';
import { OrderTickBadge } from '../../components/OrderTickBadge';
import { CASHBACK_PERCENT_LABEL, TIER_CONFIG } from '../../services/customerAccount';
import { MenuItem } from '../../types';
import { formatUZS, formatPrice, ORDER_STATUS_MAP } from '../../utils/formatters';
import {
  Search,
  X,
  ShoppingBag,
  ArrowRight,
  Utensils,
  UserCheck,
  Bell,
  CheckCircle2,
  Star,
  ChevronRight,
  Wallet,
  UserPlus,
  LogIn,
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
    restaurantRating,
    customerAccount,
    customerSessionMode,
    openCustomerAuth,
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
  const promptedAuthRef = React.useRef<boolean>(false);

  // On every fresh QR scan session without a logged-in personal cabinet, clearly show the 3 entry options
  useEffect(() => {
    if (customerAccount || promptedAuthRef.current) return;
    let alreadySeenInSession = false;
    try {
      alreadySeenInSession = sessionStorage.getItem('dineflow_qr_choice_seen_v1') === '1';
    } catch {
      alreadySeenInSession = false;
    }

    if (customerSessionMode === 'undecided' || !alreadySeenInSession) {
      promptedAuthRef.current = true;
      const timer = setTimeout(() => {
        openCustomerAuth('choice');
      }, 260);
      return () => clearTimeout(timer);
    }
  }, [customerAccount, customerSessionMode, openCustomerAuth]);

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

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-5 space-y-5">
        {/* Compact, Ideally Proportioned Table & Loyalty Status Bar */}
        <section className="rounded-2xl bg-[#173F35] text-white px-5 py-4 sm:px-6 sm:py-5 shadow-[0_14px_36px_-22px_rgba(15,45,37,0.55)]">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Left: Table Context + Live Rating */}
            <div className="space-y-1.5 min-w-0">
              <div className="flex items-center flex-wrap gap-x-2.5 gap-y-1 text-xs sm:text-sm">
                <span className="font-mono font-extrabold text-[#F59E0B] tabular-nums">
                  Stol №{activeTableNumber}
                </span>
                <span className="opacity-35" aria-hidden="true">·</span>
                <span className="font-semibold text-white">{zoneLabel}</span>
                <span className="opacity-35" aria-hidden="true">·</span>
                <span className="text-emerald-100/80 tabular-nums">
                  {currentTable?.seats || 4} o&apos;rinli
                </span>
                <span className="opacity-35 hidden sm:inline" aria-hidden="true">·</span>
                <span className="inline-flex items-center gap-1 text-emerald-100/85">
                  <UserCheck className="w-3.5 h-3.5 text-[#F59E0B]" />
                  <span>
                    {assignedWaiter
                      ? assignedWaiter.full_name
                      : currentTable?.assigned_waiter_name || 'Karimov Dilshod'}
                  </span>
                </span>
              </div>

              <div className="flex items-center flex-wrap gap-x-3 gap-y-1">
                <button
                  type="button"
                  onClick={() => setIsRestaurantReviewsOpen(true)}
                  className="inline-flex items-center gap-1.5 text-xs sm:text-[13px] text-emerald-100 hover:text-white transition-colors group"
                >
                  <span className="inline-flex items-center gap-1 font-mono font-bold text-white tabular-nums">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    {restaurantRating.averageRating.toFixed(1)}
                  </span>
                  <span className="opacity-40" aria-hidden="true">·</span>
                  <span
                    className={`font-semibold ${
                      restaurantRating.level.isAtRisk ? 'text-amber-300' : 'text-[#F59E0B]'
                    }`}
                  >
                    {restaurantRating.level.title} ({restaurantRating.level.levelNumber}/5)
                  </span>
                  <span className="opacity-40 hidden sm:inline" aria-hidden="true">·</span>
                  <span className="hidden sm:inline text-emerald-100/75 tabular-nums">
                    {restaurantRating.totalReviews} ta baho
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-[#F59E0B] transition-transform group-hover:translate-x-0.5" />
                </button>

                <span className="hidden md:inline text-white/25" aria-hidden="true">|</span>
                <span className="text-xs text-emerald-100/80">
                  {customerAccount
                    ? `${customerAccount.full_name} · ${TIER_CONFIG[customerAccount.tier].percentLabel} keshbek faol`
                    : `Mehmon rejimi · Akkaunt ochsangiz ${CASHBACK_PERCENT_LABEL} keshbek yig'iladi`}
                </span>
              </div>
            </div>

            {/* Right: Clean Action Controls */}
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              {customerAccount ? (
                <button
                  type="button"
                  onClick={() => navigate('/account')}
                  className="min-h-[42px] px-4 py-2 rounded-full bg-[#F59E0B] hover:bg-[#FBBF24] active:scale-[0.98] text-[#173F35] text-xs sm:text-[13px] font-extrabold flex items-center gap-2 transition-all"
                >
                  <Wallet className="w-4 h-4" />
                  <span className="font-mono tabular-nums">
                    {formatPrice(customerAccount.cashback_balance)}
                  </span>
                  <span className="opacity-40">·</span>
                  <span>Kabinet</span>
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => openCustomerAuth('register')}
                    className="min-h-[42px] px-4 py-2 rounded-full bg-[#F59E0B] hover:bg-[#FBBF24] active:scale-[0.98] text-[#173F35] text-xs sm:text-[13px] font-extrabold flex items-center gap-1.5 transition-all"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Akkaunt ({CASHBACK_PERCENT_LABEL})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => openCustomerAuth('login')}
                    className="min-h-[42px] px-4 py-2 rounded-full bg-white/10 hover:bg-white/18 border border-white/18 text-white text-xs sm:text-[13px] font-semibold flex items-center gap-1.5 transition-all"
                  >
                    <LogIn className="w-3.5 h-3.5 text-[#F59E0B]" />
                    <span>Kirish</span>
                  </button>
                </>
              )}

              <button
                type="button"
                onClick={() => callWaiter()}
                className={`min-h-[42px] px-4 py-2 rounded-full border text-xs sm:text-[13px] font-bold flex items-center gap-2 transition-all active:scale-95 ${
                  activeTableCall
                    ? (activeTableCall.call_count || 1) >= 2
                      ? 'bg-red-600 hover:bg-red-700 text-white border-red-500'
                      : 'bg-amber-400 hover:bg-amber-300 text-[#173F35] border-amber-300'
                    : 'bg-white/10 hover:bg-white/18 text-white border-white/18'
                }`}
              >
                <Bell className={`w-4 h-4 ${activeTableCall ? 'animate-bounce' : 'text-[#F59E0B]'}`} />
                <span>
                  {activeTableCall
                    ? (activeTableCall.call_count || 1) >= 2
                      ? `Adminga xabar (${activeTableCall.call_count}x)`
                      : `Chaqiruv (${activeTableCall.call_count || 1}x)`
                    : 'Ofitsiant chaqirish'}
                </span>
              </button>
            </div>
          </div>
        </section>

        {/* Live Active Order Banner */}
        {activeTableOrder && (
          <div
            onClick={() => navigate(`/orders?orderId=${activeTableOrder.id}`)}
            className="bg-white rounded-2xl px-4 sm:px-5 py-3.5 shadow-xs flex items-center justify-between gap-3 cursor-pointer hover:border-[#173F35]/40 transition-colors border border-[#E5E0D8]"
          >
            <div className="flex items-center gap-3 min-w-0">
              <OrderTickBadge status={activeTableOrder.status} compact />
              <div className="text-xs sm:text-sm truncate text-[#202622]">
                <span className="font-mono font-bold text-[#173F35]">{activeTableOrder.order_number}</span>
                <span className="mx-1.5 text-[#D8D1C5]">·</span>
                <span className="font-semibold">
                  {activeTableOrder.status === 'new'
                    ? 'Yuborildi (1 pitichka)'
                    : ORDER_STATUS_MAP[activeTableOrder.status]?.label || 'Tayyorlanmoqda'}
                </span>
                <span className="mx-1.5 text-[#D8D1C5] hidden sm:inline">·</span>
                <span className="font-mono tabular-nums hidden sm:inline text-[#59635E]">
                  {formatUZS(activeTableOrder.total_amount)}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1 text-xs sm:text-sm font-bold text-[#173F35] shrink-0">
              <span>Kuzatish</span>
              <ArrowRight className="w-4 h-4 text-[#1E5245]" />
            </div>
          </div>
        )}

        {/* Search & Filter Toolbar */}
        <div className="bg-white rounded-2xl border border-[#E5E0D8] p-4 sm:p-5 shadow-[0_6px_24px_-18px_rgba(23,63,53,0.16)] space-y-3.5">
          {/* Search + Dish Count Row */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#737A75]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Taom nomi yoki tarkibi bo'yicha qidiruv..."
              className="w-full min-h-[46px] pl-10 pr-10 py-2.5 rounded-xl bg-[#FAF8F3] border border-[#E5E0D8] text-sm text-[#202622] placeholder:text-[#737A75] focus:outline-none focus:bg-white focus:border-[#173F35] focus:ring-2 focus:ring-[#F59E0B]/30 transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#737A75] hover:text-[#202622] p-1"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Category Horizontal Filter */}
          <div className="flex items-center gap-2 overflow-x-auto pb-0.5 no-scrollbar scroll-smooth">
            {categories.map((cat) => {
              const isSelected = selectedCategoryId === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategoryId(cat.id)}
                  className={`min-h-[40px] px-4 py-1.5 rounded-full text-xs sm:text-[13px] font-semibold whitespace-nowrap transition-all ${
                    isSelected
                      ? 'bg-[#173F35] text-white shadow-xs'
                      : 'bg-[#FAF8F3] text-[#59635E] hover:text-[#173F35] border border-[#E5E0D8] hover:border-[#173F35]/30'
                  }`}
                >
                  {cat.name}
                </button>
              );
            })}
          </div>

          {/* Dish Tier Filter Bar: Oddiy / Biznes / VIP */}
          <div className="flex items-center justify-between pt-3 border-t border-[#F2EFE9] gap-2 overflow-x-auto no-scrollbar">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-[#737A75] mr-1 hidden sm:inline">
                Turi:
              </span>
              {[
                { id: 'all', label: 'Barchasi' },
                { id: 'oddiy', label: 'Oddiy' },
                { id: 'biznes', label: 'Biznes' },
                { id: 'vip', label: 'VIP' },
              ].map((t) => {
                const active = selectedTier === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setSelectedTier(t.id as 'all' | 'oddiy' | 'biznes' | 'vip')}
                    className={`min-h-[34px] px-3.5 py-1 rounded-full text-xs font-bold transition-all ${
                      active
                        ? t.id === 'vip'
                          ? 'bg-amber-400 text-[#173F35]'
                          : 'bg-[#F59E0B] text-[#173F35]'
                        : 'bg-white text-[#59635E] border border-[#E5E0D8] hover:border-[#173F35]/40'
                    }`}
                  >
                    {t.label}
                  </button>
                );
              })}
            </div>

            <span className="text-xs sm:text-[13px] font-medium text-[#737A75] whitespace-nowrap font-mono tabular-nums">
              {filteredDishes.length} ta taom
            </span>
          </div>
        </div>

        {/* Menu Grid Header */}
        <div className="flex items-center justify-between pt-1">
          <h1 className="font-display font-bold text-xl sm:text-2xl text-[#202622]">
            {categories.find((c) => c.id === selectedCategoryId)?.name || 'Barcha taomlar'}
            {selectedTier !== 'all' && (
              <span className="text-sm font-bold text-[#1E5245] ml-2">
                ({selectedTier === 'vip' ? 'VIP' : selectedTier === 'biznes' ? 'Biznes' : 'Oddiy'})
              </span>
            )}
          </h1>
          <button
            type="button"
            onClick={() => setIsRestaurantReviewsOpen(true)}
            className="text-xs sm:text-sm font-semibold text-[#1E5245] hover:text-[#173F35] inline-flex items-center gap-1"
          >
            <span>Restoran sharhlari</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Dishes Grid */}
        {filteredDishes.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {filteredDishes.map((dish) => (
              <DishCard key={dish.id} dish={dish} onSelect={handleOpenDish} />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-[#E5E0D8] p-12 text-center my-6">
            <div className="w-14 h-14 rounded-2xl bg-[#F3EFE6] text-[#173F35] flex items-center justify-center mx-auto mb-3">
              <Utensils className="w-6 h-6" />
            </div>
            <h3 className="font-display font-bold text-lg text-[#202622] mb-1">
              Taom topilmadi
            </h3>
            <p className="text-sm text-[#59635E] mb-5">
              &ldquo;{searchQuery}&rdquo; so&apos;rovi bo&apos;yicha hech qanday taom mavjud emas.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategoryId('cat-all');
                setSelectedTier('all');
              }}
              className="min-h-[44px] px-6 py-2.5 rounded-full bg-[#173F35] text-white text-sm font-bold hover:bg-[#1E5245] transition-colors"
            >
              Barcha taomlarni ko&apos;rsatish
            </button>
          </div>
        )}
      </main>

      {/* Fast 1-Click Order & Cart Floating Bar */}
      {cart.length > 0 && (
        <div className="fixed bottom-18 md:bottom-6 left-3 right-3 z-40 max-w-2xl mx-auto">
          <div className="bg-[#173F35]/98 backdrop-blur-md text-white p-3 rounded-2xl shadow-[0_22px_50px_-14px_rgba(15,45,37,0.65)] flex items-center justify-between gap-3 border border-white/12">
            <button
              type="button"
              onClick={() => navigate('/cart')}
              className="flex items-center gap-3 text-left hover:bg-white/8 p-1.5 rounded-xl transition-colors min-w-0 flex-1"
            >
              <div className="w-11 h-11 rounded-xl bg-white/10 text-[#F59E0B] flex items-center justify-center font-bold text-sm shrink-0 relative">
                <ShoppingBag className="w-5 h-5" />
                <span className="absolute -top-1.5 -right-1.5 bg-[#F59E0B] text-[#173F35] text-[11px] font-extrabold min-w-[20px] h-[20px] px-1 rounded-full flex items-center justify-center font-mono tabular-nums">
                  {cartItemCount}
                </span>
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-mono font-extrabold text-base text-white tabular-nums truncate">
                  {formatUZS(cartTotal)}
                </span>
                <span className="text-xs text-emerald-100/75 truncate">
                  {cartItemCount} ta taom · Savatni ko&apos;rish
                </span>
              </div>
            </button>

            <button
              type="button"
              onClick={handleQuickOrder}
              disabled={isQuickOrdering}
              className="min-h-[46px] bg-[#F59E0B] hover:bg-[#FBBF24] active:scale-95 text-[#173F35] font-display font-extrabold text-xs sm:text-sm px-5 py-3 rounded-xl flex items-center gap-1.5 transition-all shrink-0"
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
