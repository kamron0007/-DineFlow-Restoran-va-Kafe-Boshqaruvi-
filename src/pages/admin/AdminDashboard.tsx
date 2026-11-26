import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { AdminSidebar } from '../../components/AdminSidebar';
import { AdminHeader } from '../../components/AdminHeader';
import { formatUZS, formatShortTime, formatTimeAgo, ORDER_STATUS_MAP } from '../../utils/formatters';
import { useLiveClock } from '../../hooks/useLiveClock';
import {
  CreditCard,
  Receipt,
  TrendingUp,
  TrendingDown,
  Timer,
  Bell,
  ArrowUpRight,
  Download,
  FileSpreadsheet,
  PlusCircle,
  Eye,
  Store,
  ChevronRight,
  ChevronLeft,
  PieChart as PieIcon,
  ChefHat,
  Utensils,
  Clock,
  Play,
  Pause,
  BarChart2,
  Users,
  UserCheck,
  Star,
  Award,
  AlertTriangle,
} from 'lucide-react';
import { RESTAURANT_LEVEL_SCALE } from '../../utils/restaurantLevel';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { Link, useNavigate } from 'react-router-dom';

import {
  computePeriodStats,
  computeSalesDynamics,
  computeCategoryShare,
  computeTopDishes,
  AnalyticsPeriod,
  CATEGORY_PALETTE,
} from '../../utils/analytics';

export const AdminDashboard: React.FC = () => {
  const {
    orders,
    categories,
    menuItems,
    tables,
    allCustomerAccounts,
    serviceCalls,
    waiters,
    dishReviews,
    restaurantRating,
    resolveServiceCall,
    currentUser,
    restaurantName,
    restaurantBranch,
  } = useApp();
  const { timeString, shortDate, dateString, weekday } = useLiveClock();
  const [period, setPeriod] = useState<AnalyticsPeriod>('hourly');
  const [selectedHour, setSelectedHour] = useState<string | 'all'>('all');
  const [chartType, setChartType] = useState<'area' | 'bar'>('bar');
  const [isPlaying, setIsPlaying] = useState(false);
  const navigate = useNavigate();

  const ALL_HOURS = useMemo(
    () => [
      '09:00',
      '10:00',
      '11:00',
      '12:00',
      '13:00',
      '14:00',
      '15:00',
      '16:00',
      '17:00',
      '18:00',
      '19:00',
      '20:00',
      '21:00',
      '22:00',
      '23:00',
    ],
    []
  );

  const numericHour = useMemo(() => {
    if (selectedHour === 'all' || (period !== 'hourly' && period !== 'today')) return undefined;
    return parseInt(selectedHour.split(':')[0], 10);
  }, [selectedHour, period]);

  // Metrics calculated dynamically from current orders for the selected period & hour
  const periodStats = useMemo(() => {
    return computePeriodStats(orders, period, numericHour);
  }, [orders, period, numericHour]);

  // Real dynamic sales dynamics chart data (hourly for today, daily for week, weekly for month)
  const salesDynamics = useMemo(() => {
    return computeSalesDynamics(orders, period);
  }, [orders, period]);

  // Real dynamic category distribution calculated from ordered items
  const categoryShareData = useMemo(() => {
    return computeCategoryShare(orders, categories, menuItems, period, numericHour);
  }, [orders, categories, menuItems, period, numericHour]);

  // Real dynamic top 5 best sellers calculated from ordered items
  const topDishes = useMemo(() => {
    return computeTopDishes(orders, menuItems, period, 5, numericHour);
  }, [orders, menuItems, period, numericHour]);

  // Auto-play across hours timer
  useEffect(() => {
    if (!isPlaying || (period !== 'hourly' && period !== 'today')) return;
    const interval = setInterval(() => {
      setSelectedHour((prev) => {
        if (prev === 'all') return ALL_HOURS[0];
        const idx = ALL_HOURS.indexOf(prev);
        if (idx === -1 || idx >= ALL_HOURS.length - 1) return ALL_HOURS[0];
        return ALL_HOURS[idx + 1];
      });
    }, 2000);
    return () => clearInterval(interval);
  }, [isPlaying, period, ALL_HOURS]);

  const allPendingCalls = serviceCalls.filter((c) => c.status === 'pending');
  // Admin only sees calls after 2 waiter-only calls (on the 3rd+ call)
  const escalatedCalls = allPendingCalls.filter(
    (c) => (c.call_count || 1) >= 3 || c.escalated_to_admin
  );

  const exportReport = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      ['Buyurtma Raqami,Stol,Summa,Holati,Vaqti',
        ...orders.map(
          (o) =>
            `${o.order_number},${o.table_number},${o.total_amount},${o.status},${o.created_at}`
        ),
      ].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `dineflow_hisobot_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-[#FAF8F3] text-[#202622] flex">
      {/* Sidebar */}
      <AdminSidebar />

      {/* Main Viewport */}
      <div className="flex-1 flex flex-col min-w-0">
        <AdminHeader />

        <main className="flex-1 p-4 sm:p-6 lg:p-7 space-y-5 max-w-[1400px] w-full mx-auto">
          {/* Compact, Ideally Proportioned Executive Control Header */}
          <div className="rounded-2xl bg-[#173F35] text-white px-5 py-4 sm:px-6 sm:py-5 shadow-[0_14px_36px_-22px_rgba(15,45,37,0.55)]">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center flex-wrap gap-x-2.5 gap-y-1 text-xs sm:text-[13px] text-emerald-100/80">
                    <span className="inline-flex items-center gap-1.5 font-semibold text-white">
                      <Store className="w-3.5 h-3.5 text-[#F59E0B]" />
                      {restaurantName || 'Zafaran Grand'} — {restaurantBranch || 'Toshkent Markaziy filiali'}
                    </span>
                    <span className="opacity-35" aria-hidden="true">·</span>
                    <span>{tables.length} ta stol faol</span>
                    <span className="opacity-35" aria-hidden="true">·</span>
                    <span className="inline-flex items-center gap-1 font-mono font-bold text-white tabular-nums">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span>{restaurantRating.averageRating.toFixed(1)}</span>
                      <span className="text-[#F59E0B] font-sans font-semibold ml-0.5">
                        {restaurantRating.level.title} ({restaurantRating.level.levelNumber}/5)
                      </span>
                    </span>
                  </div>

                  <h1 className="font-display font-extrabold text-xl sm:text-2xl mt-1.5 tracking-tight">
                    <span className="text-white">Boshqaruv paneli · </span>
                    <span className="text-[#F59E0B]">
                      {currentUser?.full_name || 'Boymurodov Kamronbek'}
                    </span>
                  </h1>
                </div>

                {/* Primary Quick Action Row */}
                <div className="flex items-center gap-2 flex-wrap shrink-0">
                  <button
                    type="button"
                    onClick={() => navigate('/admin/orders')}
                    className="min-h-[42px] px-4 py-2 rounded-full bg-[#F59E0B] hover:bg-[#FBBF24] text-[#173F35] text-xs sm:text-[13px] font-extrabold flex items-center gap-1.5 transition-all active:scale-95"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>Yangi buyurtma</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate('/admin/export-reports')}
                    className="min-h-[42px] px-4 py-2 rounded-full bg-white/10 hover:bg-white/18 border border-white/18 text-white text-xs sm:text-[13px] font-semibold flex items-center gap-1.5 transition-all"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-[#F59E0B]" />
                    <span>CSV Eksport</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate('/admin/customers')}
                    className="min-h-[42px] px-4 py-2 rounded-full bg-white/10 hover:bg-white/18 border border-white/18 text-white text-xs sm:text-[13px] font-semibold flex items-center gap-1.5 transition-all"
                  >
                    <UserCheck className="w-3.5 h-3.5 text-[#F59E0B]" />
                    <span>Mijozlar ({allCustomerAccounts.length})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate('/admin/waiters')}
                    className="min-h-[42px] px-4 py-2 rounded-full bg-white/10 hover:bg-white/18 border border-white/18 text-white text-xs sm:text-[13px] font-semibold flex items-center gap-1.5 transition-all"
                  >
                    <Users className="w-3.5 h-3.5 text-[#F59E0B]" />
                    <span>Ofitsiantlar ({waiters.length})</span>
                  </button>
                </div>
              </div>

              {/* Clean Period Switcher */}
              <div className="pt-3.5 border-t border-white/12 flex flex-wrap items-center justify-between gap-3">
                <div className="bg-white/8 p-1 rounded-full border border-white/14 flex items-center flex-wrap gap-1">
                  <button
                    type="button"
                    onClick={() => setPeriod('hourly')}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 ${
                      period === 'hourly' || period === 'today'
                        ? 'bg-[#F59E0B] text-[#173F35] font-bold'
                        : 'text-emerald-100/80 hover:text-white'
                    }`}
                  >
                    <span>Bugun (Soatbay)</span>
                    <span className="font-mono text-xs tabular-nums font-bold">
                      {timeString}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPeriod('week')}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                      period === 'week'
                        ? 'bg-[#F59E0B] text-[#173F35] font-bold'
                        : 'text-emerald-100/80 hover:text-white'
                    }`}
                  >
                    Haftalik (7 kun)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPeriod('tendays')}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                      period === 'tendays'
                        ? 'bg-[#F59E0B] text-[#173F35] font-bold'
                        : 'text-emerald-100/80 hover:text-white'
                    }`}
                  >
                    O&apos;nlik (10 kun)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPeriod('month')}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                      period === 'month'
                        ? 'bg-[#F59E0B] text-[#173F35] font-bold'
                        : 'text-emerald-100/80 hover:text-white'
                    }`}
                  >
                    Oylik (30 kun)
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => navigate('/admin/market-benchmark')}
                  className="text-xs sm:text-[13px] font-semibold text-[#F59E0B] hover:text-[#FDE68A] inline-flex items-center gap-1 transition-colors"
                >
                  <span>O&apos;zbekiston bozor tahlili</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Admin Escalation Alert Strip (Only shown when waiter didn't come / called 2+ times / calls accumulated) */}
          {escalatedCalls.length > 0 && (
            <div className="space-y-2.5">
              {escalatedCalls.map((call) => (
                <div
                  key={call.id}
                  className="bg-red-50 rounded-2xl p-4 border-2 border-red-400 shadow-md flex items-center justify-between flex-wrap gap-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center text-white shrink-0 shadow-sm">
                      <Bell className="w-5 h-5 animate-bounce" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="bg-red-600 text-white text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md">
                          Admin Eskalatsiyasi • {call.call_count || 3}-marta chaqiruv
                        </span>
                        <h4 className="font-display font-bold text-sm text-red-950">
                          Stol №{call.table_number} ga ofitsiant bormadi!
                        </h4>
                      </div>
                      <p className="text-xs text-red-800 mt-0.5 font-medium">
                        Mas'ul ofitsiant: <span className="font-bold">{call.assigned_waiter_name || 'Zal xodimi'}</span> — {call.note || 'Mijoz qayta chaqirmoqda'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => resolveServiceCall(call.id)}
                      className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors shadow-xs"
                    >
                      Nazoratga olindi (Yopish)
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Live Restaurant Level & Rating Impact Panel */}
          <div className="bg-white rounded-3xl border border-[#E5E0D8] p-5 sm:p-6 shadow-[0_8px_28px_-18px_rgba(23,63,53,0.14)]">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
              {/* Left: Current Level Identity */}
              <div className="lg:col-span-5 flex items-start gap-3.5">
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                    restaurantRating.level.isAtRisk
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-[#173F35] text-[#F59E0B]'
                  }`}
                >
                  {restaurantRating.level.isAtRisk ? (
                    <AlertTriangle className="w-6 h-6" />
                  ) : (
                    <Award className="w-6 h-6" />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#737A75]">
                      Restoran darajasi · {restaurantRating.level.levelNumber}/5
                    </span>
                    {restaurantRating.level.isAtRisk && (
                      <span className="text-[11px] font-bold text-amber-800">
                        · Reyting pasaygan
                      </span>
                    )}
                  </div>
                  <div className="flex items-baseline gap-2.5 mt-0.5 flex-wrap">
                    <h2 className="font-display font-extrabold text-xl text-[#173F35]">
                      {restaurantRating.level.title}
                    </h2>
                    <span className="inline-flex items-center gap-1 font-mono font-extrabold text-base text-[#173F35] tabular-nums">
                      <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                      {restaurantRating.averageRating.toFixed(1)}
                    </span>
                  </div>
                  <p className="text-xs text-[#59635E] mt-1 leading-relaxed">
                    {restaurantRating.level.subtitle}
                  </p>
                </div>
              </div>

              {/* Center: 5-Level Scale Bar */}
              <div className="lg:col-span-4 space-y-2 lg:border-x lg:border-[#F2EFE9] lg:px-5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-[#202622]">
                    Mehmon baholari: {restaurantRating.totalReviews} ta
                  </span>
                  <span className="text-[#737A75] tabular-nums">
                    {restaurantRating.level.nextLevelTitle
                      ? `Keyingi: ${restaurantRating.level.nextLevelTitle} (${restaurantRating.level.nextLevelMinScore?.toFixed(1)}★)`
                      : 'Maksimal daraja (5/5)'}
                  </span>
                </div>
                <div className="grid grid-cols-5 gap-1.5">
                  {RESTAURANT_LEVEL_SCALE.map((lvl) => {
                    const active = restaurantRating.level.levelNumber === lvl.levelNumber;
                    const passed = restaurantRating.level.levelNumber >= lvl.levelNumber;
                    return (
                      <div key={lvl.tier} className="space-y-1">
                        <div
                          className={`h-2 rounded-full transition-all ${
                            active
                              ? 'bg-[#F59E0B]'
                              : passed
                              ? 'bg-[#173F35]'
                              : 'bg-[#E5E0D8]'
                          }`}
                        />
                        <span
                          className={`block text-[10px] truncate ${
                            active ? 'font-bold text-[#173F35]' : 'text-[#737A75]'
                          }`}
                        >
                          {lvl.title.split(' ')[0]}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <p className="text-[11px] text-[#737A75] tabular-nums">
                  {restaurantRating.dishReviewsCount} ta taom bahosi · {restaurantRating.orderReviewsCount} ta xizmat bahosi
                </p>
              </div>

              {/* Right: Service Criteria Breakdown */}
              <div className="lg:col-span-3 grid grid-cols-2 gap-2.5">
                {[
                  { label: 'Taom', val: restaurantRating.level.categoryAverages.food },
                  { label: 'Tezlik', val: restaurantRating.level.categoryAverages.speed },
                  { label: 'Ofitsiant', val: restaurantRating.level.categoryAverages.waiter },
                  { label: 'Muhit', val: restaurantRating.level.categoryAverages.atmosphere },
                ].map((metric) => (
                  <div
                    key={metric.label}
                    className="rounded-xl bg-[#FAF8F3] border border-[#E5E0D8] px-3 py-2 flex items-center justify-between"
                  >
                    <span className="text-[11px] text-[#59635E] font-medium">{metric.label}</span>
                    <span className="font-mono font-bold text-xs text-[#173F35] tabular-nums">
                      {metric.val !== null ? `${metric.val.toFixed(1)}★` : `${restaurantRating.averageRating.toFixed(1)}★`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 4 Bento KPI Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5">
            {/* Card 1: Revenue */}
            <div className="bg-white p-5 rounded-2xl border border-[#E5E0D8] shadow-xs flex flex-col justify-between">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-xs font-semibold text-[#59635E]">
                    {period === 'hourly' || period === 'today'
                      ? 'Bugungi tushum'
                      : period === 'week'
                      ? 'Haftalik tushum'
                      : period === 'tendays'
                      ? "O'nlik tushum (10 kun)"
                      : 'Oylik tushum'}
                  </span>
                  <div className="mt-1.5 flex items-baseline gap-1">
                    <span className="font-display font-bold text-2xl text-[#173F35] tabular-nums">
                      {formatUZS(periodStats.periodRevenue)}
                    </span>
                  </div>
                </div>
                <div className="w-10 h-10 rounded-xl bg-[#E8F0EC] text-[#173F35] flex items-center justify-center shrink-0">
                  <CreditCard className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-[#F2EFE9] flex items-center justify-between text-xs">
                <div
                  className={`flex items-center gap-1 font-bold ${
                    periodStats.isGrowthPositive ? 'text-emerald-700' : 'text-rose-600'
                  }`}
                >
                  {periodStats.isGrowthPositive ? (
                    <TrendingUp className="w-3.5 h-3.5" />
                  ) : (
                    <TrendingDown className="w-3.5 h-3.5" />
                  )}
                  <span>{periodStats.growthPercent}</span>
                </div>
                <span className="text-[#737A75] truncate ml-1">{periodStats.growthLabel}</span>
              </div>
            </div>

            {/* Card 2: Total Orders */}
            <div className="bg-white p-5 rounded-2xl border border-[#E5E0D8] shadow-xs flex flex-col justify-between">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-xs font-semibold text-[#59635E]">
                    {period === 'hourly' || period === 'today'
                      ? 'Bugungi buyurtmalar'
                      : period === 'week'
                      ? 'Haftalik buyurtmalar'
                      : period === 'tendays'
                      ? "O'nlik buyurtmalar (10 kun)"
                      : 'Oylik buyurtmalar'}
                  </span>
                  <div className="mt-1.5 flex items-baseline gap-1.5">
                    <span className="font-display font-bold text-2xl text-[#173F35] tabular-nums">
                      {periodStats.periodOrdersCount}
                    </span>
                    <span className="text-xs text-[#737A75]">ta chek</span>
                  </div>
                </div>
                <div className="w-10 h-10 rounded-xl bg-[#F3EFE6] text-[#173F35] flex items-center justify-center shrink-0">
                  <Receipt className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-[#F2EFE9] flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="bg-amber-100 text-amber-900 px-2 py-0.5 rounded-md font-semibold">
                    {periodStats.activeCount} faol
                  </span>
                  <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md font-semibold">
                    {periodStats.deliveredCount} yetkazilgan
                  </span>
                </div>
                <div
                  className={`flex items-center gap-0.5 font-bold ${
                    periodStats.isOrdersGrowthPositive ? 'text-emerald-700' : 'text-rose-600'
                  }`}
                >
                  {periodStats.isOrdersGrowthPositive ? (
                    <TrendingUp className="w-3.5 h-3.5" />
                  ) : (
                    <TrendingDown className="w-3.5 h-3.5" />
                  )}
                  <span>{periodStats.ordersGrowthPercent}</span>
                </div>
              </div>
            </div>

            {/* Card 3: Avg Check */}
            <div className="bg-white p-5 rounded-2xl border border-[#E5E0D8] shadow-xs flex flex-col justify-between">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-xs font-semibold text-[#59635E]">
                    O&apos;rtacha chek qiymati
                  </span>
                  <div className="mt-1.5 flex items-baseline gap-1">
                    <span className="font-display font-bold text-2xl text-[#173F35] tabular-nums">
                      {formatUZS(periodStats.avgCheck)}
                    </span>
                  </div>
                </div>
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
                  <ArrowUpRight className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-[#F2EFE9] flex items-center justify-between text-xs">
                <div
                  className={`flex items-center gap-1 font-bold ${
                    periodStats.isAvgCheckGrowthPositive ? 'text-emerald-700' : 'text-rose-600'
                  }`}
                >
                  {periodStats.isAvgCheckGrowthPositive ? (
                    <TrendingUp className="w-3.5 h-3.5" />
                  ) : (
                    <TrendingDown className="w-3.5 h-3.5" />
                  )}
                  <span>{periodStats.avgCheckGrowthPercent} dinamika</span>
                </div>
                <span className="text-[#737A75]">
                  {period === 'today' || period === 'hourly'
                    ? 'Kechagiga nisbatan'
                    : period === 'week'
                    ? "O'tgan 7 kunga"
                    : 'Oldingi davrga'}
                </span>
              </div>
            </div>

            {/* Card 4: Prep Time */}
            <div className="bg-white p-5 rounded-2xl border border-[#E5E0D8] shadow-xs flex flex-col justify-between">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-xs font-semibold text-[#59635E]">
                    O&apos;rtacha tayyorlash
                  </span>
                  <div className="mt-1.5 flex items-baseline gap-1.5">
                    <span className="font-display font-bold text-2xl text-[#173F35] tabular-nums">
                      {periodStats.avgPrepMinutes}
                    </span>
                    <span className="text-xs text-[#737A75]">daqiqa</span>
                  </div>
                </div>
                <div className="w-10 h-10 rounded-xl bg-[#E8F0EC] text-[#173F35] flex items-center justify-center shrink-0">
                  <Timer className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-[#F2EFE9] flex items-center justify-between text-xs">
                <span className="text-[#173F35] font-bold">Oshxona tezligi: A&apos;lo</span>
                <span className="text-[#737A75]">Standart: &lt; 20 daq</span>
              </div>
            </div>
          </div>

          {/* Visual Analytics Grid (Hourly dynamics + Category donut) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Hourly Dynamics Chart (8 cols) */}
            <div className="lg:col-span-8 bg-white p-6 rounded-3xl border border-[#E5E0D8] shadow-xs flex flex-col justify-between space-y-3">
              <div className="flex items-center justify-between pb-3 border-b border-[#FAF8F3] flex-wrap gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-display font-bold text-lg text-[#173F35]">
                      {salesDynamics.title}
                    </h3>
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md">
                      Real buyurtmalar
                    </span>
                    {selectedHour !== 'all' && (
                      <span className="text-[10px] font-black bg-amber-500 text-slate-950 px-2 py-0.5 rounded-md shadow-xs animate-pulse">
                        Soat: {selectedHour}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#737A75] mt-0.5">
                    {salesDynamics.subtitle}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {/* Chart Type Toggle: Bar vs Area */}
                  <div className="bg-[#FAF8F3] p-1 rounded-xl border border-[#E5E0D8] flex items-center text-xs">
                    <button
                      onClick={() => setChartType('bar')}
                      className={`px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1 ${
                        chartType === 'bar' ? 'bg-[#173F35] text-white shadow-xs' : 'text-[#737A75]'
                      }`}
                      title="Ustunli diagramma"
                    >
                      <BarChart2 className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Ustunli</span>
                    </button>
                    <button
                      onClick={() => setChartType('area')}
                      className={`px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1 ${
                        chartType === 'area' ? 'bg-[#173F35] text-white shadow-xs' : 'text-[#737A75]'
                      }`}
                      title="Chiziqli grafik"
                    >
                      <TrendingUp className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Chiziqli</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Hourly Scrubber Controls (Soatlab o'zgartirish paneli) */}
              {(period === 'hourly' || period === 'today') && (
                <div className="bg-[#FAF8F3] p-2.5 rounded-2xl border border-[#E5E0D8]/80 space-y-2">
                  <div className="flex items-center justify-between gap-2 flex-wrap text-xs">
                    <div className="flex items-center gap-1.5 font-bold text-[#173F35]">
                      <Clock className="w-4 h-4 text-emerald-700" />
                      <span>Soatbay tahlil:</span>
                      <span className="text-[#737A75] font-normal">
                        {selectedHour === 'all'
                          ? 'Barcha 15 soatlik tushum ko\'rsatilmoqda'
                          : `Faqat ${selectedHour} dagi tushum va xaridorgir taomlar`}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {/* Auto play button */}
                      <button
                        onClick={() => setIsPlaying(!isPlaying)}
                        className={`px-2.5 py-1 rounded-xl font-bold flex items-center gap-1 text-[11px] transition-all shadow-xs ${
                          isPlaying
                            ? 'bg-amber-500 text-slate-950 animate-pulse'
                            : 'bg-white text-[#173F35] border border-[#E5E0D8] hover:bg-slate-50'
                        }`}
                        title="Soatlarni ketma-ket avtomatik aylantirib ko'rish"
                      >
                        {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                        <span>{isPlaying ? 'To\'xtatish' : '▶ Soatlab aylantirish'}</span>
                      </button>

                      {/* Step prev / next */}
                      <button
                        onClick={() => {
                          const idx = ALL_HOURS.indexOf(selectedHour as any);
                          if (idx <= 0) setSelectedHour(ALL_HOURS[ALL_HOURS.length - 1]);
                          else setSelectedHour(ALL_HOURS[idx - 1]);
                        }}
                        className="p-1 rounded-lg bg-white border border-[#E5E0D8] text-[#737A75] hover:text-[#173F35]"
                        title="Oldingi soat"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          const idx = ALL_HOURS.indexOf(selectedHour as any);
                          if (idx === -1 || idx >= ALL_HOURS.length - 1) setSelectedHour(ALL_HOURS[0]);
                          else setSelectedHour(ALL_HOURS[idx + 1]);
                        }}
                        className="p-1 rounded-lg bg-white border border-[#E5E0D8] text-[#737A75] hover:text-[#173F35]"
                        title="Keyingi soat"
                      >
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Hourly Pills Strip */}
                  <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pt-1">
                    <button
                      onClick={() => {
                        setSelectedHour('all');
                        setIsPlaying(false);
                      }}
                      className={`px-3 py-1 rounded-xl text-[11px] font-bold whitespace-nowrap transition-all ${
                        selectedHour === 'all'
                          ? 'bg-[#173F35] text-white shadow-xs'
                          : 'bg-white text-[#737A75] border border-[#E5E0D8] hover:border-[#173F35]'
                      }`}
                    >
                      Barchasi (09:00 - 23:00)
                    </button>
                    {salesDynamics.data.map((dp) => {
                      const isSel = selectedHour === dp.time;
                      return (
                        <button
                          key={dp.time}
                          onClick={() => {
                            setSelectedHour(dp.time);
                            setIsPlaying(false);
                          }}
                          className={`px-2.5 py-1 rounded-xl text-[11px] font-bold whitespace-nowrap transition-all flex items-center gap-1 ${
                            isSel
                              ? 'bg-amber-500 text-slate-950 shadow-md ring-2 ring-amber-300'
                              : dp.sales > 0
                              ? 'bg-white text-[#173F35] border border-emerald-200 hover:border-emerald-500'
                              : 'bg-white/60 text-[#737A75] border border-[#E5E0D8]'
                          }`}
                        >
                          <span>{dp.time}</span>
                          {dp.sales > 0 && (
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                isSel ? 'bg-slate-950' : 'bg-emerald-600'
                              }`}
                            />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Dynamic Recharts Diagram Area (Bar or Area Chart) */}
              <div className="h-64 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  {chartType === 'bar' ? (
                    <BarChart
                      data={salesDynamics.data}
                      margin={{ top: 10, right: 10, left: 10, bottom: 10 }}
                      onClick={(state: any) => {
                        if (state && state.activeLabel) {
                          setSelectedHour(state.activeLabel);
                          setIsPlaying(false);
                        }
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F2EFE9" />
                      <XAxis dataKey="time" stroke="#737A75" fontSize={11} tickLine={false} />
                      <YAxis
                        stroke="#737A75"
                        fontSize={11}
                        tickLine={false}
                        tickFormatter={(val) => {
                          if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
                          if (val >= 1000) return `${Math.round(val / 1000)}K`;
                          return String(val);
                        }}
                      />
                      <Tooltip
                        formatter={(val: any) => [formatUZS(Number(val) || 0), 'Tushum']}
                        labelFormatter={(label) =>
                          period === 'hourly' || period === 'today'
                            ? `Soat: ${label}`
                            : period === 'tendays'
                            ? `Dekada kuni: ${label}`
                            : period === 'week'
                            ? `Kun: ${label}`
                            : `Davr: ${label}`
                        }
                        contentStyle={{
                          backgroundColor: '#FFFFFF',
                          borderRadius: '12px',
                          borderColor: '#E5E0D8',
                          fontSize: '12px',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                        }}
                      />
                      <Bar dataKey="sales" radius={[8, 8, 0, 0]} cursor="pointer">
                        {salesDynamics.data.map((entry, index) => {
                          const isSelected = selectedHour === entry.time;
                          let barColor = '#173F35';
                          if (selectedHour !== 'all') {
                            barColor = isSelected ? '#F59E0B' : '#D8D1C5';
                          } else if (entry.peakType === 'lunch' || entry.peakType === 'dinner') {
                            barColor = '#F59E0B';
                          }
                          return <Cell key={`cell-${index}`} fill={barColor} />;
                        })}
                      </Bar>
                    </BarChart>
                  ) : (
                    <AreaChart
                      data={salesDynamics.data}
                      margin={{ top: 10, right: 10, left: 10, bottom: 10 }}
                      onClick={(state: any) => {
                        if (state && state.activeLabel) {
                          setSelectedHour(state.activeLabel);
                          setIsPlaying(false);
                        }
                      }}
                    >
                      <defs>
                        <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.45} />
                          <stop offset="95%" stopColor="#173F35" stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="time" stroke="#737A75" fontSize={11} tickLine={false} />
                      <YAxis
                        stroke="#737A75"
                        fontSize={11}
                        tickLine={false}
                        tickFormatter={(val) => {
                          if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
                          if (val >= 1000) return `${Math.round(val / 1000)}K`;
                          return String(val);
                        }}
                      />
                      <Tooltip
                        formatter={(val: any) => [formatUZS(Number(val) || 0), 'Tushum']}
                        labelFormatter={(label) =>
                          period === 'hourly' || period === 'today'
                            ? `Soat: ${label}`
                            : period === 'tendays'
                            ? `Dekada kuni: ${label}`
                            : period === 'week'
                            ? `Kun: ${label}`
                            : `Davr: ${label}`
                        }
                        contentStyle={{
                          backgroundColor: '#FFFFFF',
                          borderRadius: '12px',
                          borderColor: '#E5E0D8',
                          fontSize: '12px',
                          boxShadow: '0 8px 24px rgba(23,63,53,0.1)',
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="sales"
                        stroke="#173F35"
                        strokeWidth={3}
                        fillOpacity={1}
                        fill="url(#colorSales)"
                        cursor="pointer"
                      />
                    </AreaChart>
                  )}
                </ResponsiveContainer>
              </div>

              <div className="pt-3 border-t border-[#FAF8F3] flex items-center justify-between text-xs text-[#737A75] flex-wrap gap-2">
                {selectedHour !== 'all' ? (
                  <>
                    <div className="flex items-center gap-1.5 text-[#173F35] font-bold">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
                      <span>
                        Tanlangan soat: {selectedHour} · Tushum: {formatUZS(periodStats.periodRevenue)}
                      </span>
                    </div>
                    <button
                      onClick={() => setSelectedHour('all')}
                      className="text-emerald-700 font-bold hover:underline"
                    >
                      Barcha soatlarga qaytish
                    </button>
                  </>
                ) : period === 'hourly' || period === 'today' ? (
                  <>
                    <span>{salesDynamics.lunchPeakText}</span>
                    <span className="text-amber-700 font-bold">{salesDynamics.dinnerPeakText}</span>
                  </>
                ) : (
                  <>
                    <span className="text-[#173F35] font-semibold">{salesDynamics.topSummaryText}</span>
                    <span className="text-amber-700 font-bold">
                      Jami: {periodStats.periodOrdersCount} ta chek
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Right: Category Share Donut (4 cols) */}
            <div className="lg:col-span-4 bg-white p-6 rounded-3xl border border-[#E5E0D8] shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between pb-3 border-b border-[#FAF8F3]">
                <div>
                  <h3 className="font-display font-bold text-lg text-[#173F35]">
                    Kategoriyalar ulushi
                  </h3>
                  <p className="text-xs text-[#737A75]">
                    {period === 'today'
                      ? "Bugungi buyurtmalar bo'yicha"
                      : period === 'week'
                      ? "Haftalik buyurtmalar bo'yicha"
                      : "Oylik buyurtmalar bo'yicha"}
                  </p>
                </div>
                <PieIcon className="w-5 h-5 text-[#737A75]" />
              </div>

              {/* Donut Chart */}
              <div className="h-44 w-full flex items-center justify-center relative my-2">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryShareData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={70}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {categoryShareData.map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={CATEGORY_PALETTE[index % CATEGORY_PALETTE.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val: any, name: any, item: any) => [
                        `${val}% (${item?.payload?.amount || ''})`,
                        'Ulush',
                      ]}
                      contentStyle={{
                        backgroundColor: '#FFFFFF',
                        borderRadius: '10px',
                        borderColor: '#E5E0D8',
                        fontSize: '11px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="font-display font-bold text-xl text-[#173F35]">
                    {periodStats.periodOrdersCount}
                  </span>
                  <span className="text-[10px] text-[#737A75]">Buyurtma</span>
                </div>
              </div>

              {/* Category details legend */}
              <div className="space-y-1.5 pt-2 border-t border-[#FAF8F3] text-xs">
                {categoryShareData.map((item, idx) => (
                  <div key={item.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: CATEGORY_PALETTE[idx % CATEGORY_PALETTE.length] }}
                      />
                      <span className="text-[#202622] font-medium">{item.name}</span>
                    </div>
                    <span className="font-bold text-[#173F35] tabular-nums">
                      {item.value}% ({item.amount})
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Floor Tables Live Status Map */}
          <div className="bg-white p-6 rounded-3xl border border-[#E5E0D8] shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-display font-bold text-lg text-[#173F35]">
                    Faol stollar jonli xaritasi
                  </h3>
                  <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2 py-0.5 rounded-md">
                    Jami {tables.length} ta stol
                  </span>
                </div>
                <p className="text-xs text-[#737A75]">
                  25 ta stol: Oddiy (1-14), Biznes (15-20), VIP (21-25)
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <Link
                  to="/admin/tables"
                  className="px-3.5 py-1.5 rounded-xl bg-[#FAF8F3] hover:bg-[#E8F0EC] text-[#173F35] text-xs font-bold border border-[#E5E0D8] transition-colors"
                >
                  Barcha stollarni boshqarish →
                </Link>
              </div>
            </div>

            {/* Quick Interactive Table Cards (Oddiy, Biznes, VIP) */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {tables.map((tbl) => {
                const activeOrder = orders.find(
                  (o) =>
                    o.table_number === tbl.table_number &&
                    o.status !== 'delivered' &&
                    o.status !== 'cancelled'
                );
                const isBusy = !!activeOrder;
                const hasCall = activeOrder?.waiter_called;
                const isVip = tbl.tier === 'vip' || tbl.zone === 'vip';
                const isBiznes = tbl.tier === 'biznes' || tbl.zone === 'biznes' || tbl.zone === 'business';

                return (
                  <div
                    key={tbl.id}
                    onClick={() => navigate('/admin/tables')}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between hover:shadow-md ${
                      hasCall
                        ? 'bg-amber-50 border-amber-400 ring-2 ring-amber-200'
                        : isBusy
                        ? 'bg-[#FAF8F3] border-[#173F35]/40'
                        : isVip
                        ? 'bg-amber-50/40 border-amber-200'
                        : isBiznes
                        ? 'bg-blue-50/30 border-blue-200'
                        : 'bg-white border-[#E5E0D8]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-display font-bold text-xs text-[#173F35]">
                        №{tbl.table_number}
                      </span>
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                          isVip
                            ? 'bg-amber-500 text-slate-950'
                            : isBiznes
                            ? 'bg-blue-600 text-white'
                            : 'bg-emerald-700 text-white'
                        }`}
                      >
                        {isVip ? 'VIP' : isBiznes ? 'Biznes' : 'Oddiy'}
                      </span>
                    </div>

                    <div className="my-1.5">
                      <span className="text-[10px] text-[#737A75] block truncate font-medium">
                        {tbl.label || `Stol №${tbl.table_number}`}
                      </span>
                      <span className="font-display font-bold text-[11px] text-[#173F35] tabular-nums block">
                        {isBusy ? formatUZS(activeOrder.total_amount) : `${tbl.seats} o'rin`}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[10px] font-semibold pt-1 border-t border-slate-100">
                      <span className={isBusy ? 'text-red-700' : 'text-emerald-700'}>
                        {isBusy ? 'Band' : "Bo'sh"}
                      </span>
                      <span
                        className={`w-2 h-2 rounded-full ${
                          hasCall
                            ? 'bg-amber-500 animate-ping'
                            : isBusy
                            ? 'bg-red-500'
                            : 'bg-emerald-500'
                        }`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bottom Grid: Best Sellers & Recent Orders Stream */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Best Sellers (5 cols) */}
            <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-[#E5E0D8] shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-[#FAF8F3]">
                  <div>
                    <h3 className="font-display font-bold text-lg text-[#173F35]">
                      Eng xaridorgir taomlar
                    </h3>
                    <p className="text-xs text-[#737A75]">
                      {selectedHour !== 'all'
                        ? `Soat ${selectedHour} dagi buyurtmalar tahlili`
                        : period === 'hourly' || period === 'today'
                        ? 'Bugungi buyurtmalar reytingi'
                        : period === 'week'
                        ? 'Haftalik buyurtmalar reytingi'
                        : period === 'tendays'
                        ? "10-kunlik dekada reytingi"
                        : 'Oylik buyurtmalar reytingi'}
                    </p>
                  </div>
                  <span className="bg-[#E8F0EC] text-[#173F35] text-xs font-bold px-2 py-0.5 rounded-md">
                    Top {topDishes.length}
                  </span>
                </div>

                <div className="space-y-3 pt-3">
                  {topDishes.length === 0 ? (
                    <div className="text-center py-6 text-xs text-[#737A75]">
                      Bu davrda buyurtma mavjud emas
                    </div>
                  ) : (
                    topDishes.map((dish) => (
                      <div
                        key={dish.name}
                        className="flex items-center justify-between p-2.5 rounded-xl hover:bg-[#FAF8F3] transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-[#E8F0EC] text-[#173F35] flex items-center justify-center shrink-0">
                            <Utensils className="w-5 h-5" />
                          </div>
                          <div>
                            <span className="font-display font-bold text-xs text-[#202622] block">
                              {dish.name}
                            </span>
                            <span className="text-[11px] text-[#737A75]">
                              {dish.quantity} {dish.portionUnit} · {dish.category}
                            </span>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="font-display font-bold text-xs text-[#173F35] block tabular-nums">
                            {formatUZS(dish.revenue)}
                          </span>
                          <span className="text-[10px] text-emerald-700 font-semibold">
                            {dish.sharePercent}% ulush
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <Link
                to="/admin/menu"
                className="mt-4 w-full py-2.5 rounded-xl bg-[#FAF8F3] hover:bg-[#E8F0EC] text-[#173F35] text-xs font-bold text-center block transition-colors"
              >
                To'liq oshxona menyusi tahlili →
              </Link>
            </div>

            {/* Recent Orders Stream (7 cols) */}
            <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-[#E5E0D8] shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-[#FAF8F3]">
                  <div>
                    <h3 className="font-display font-bold text-lg text-[#173F35]">
                      Oxirgi buyurtmalar oqimi
                    </h3>
                    <p className="text-xs text-[#737A75]">
                      Real vaqt rejimida oshxona va zal yangilanishlari
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-[#1E5245] font-semibold">
                    <span className="w-2 h-2 rounded-full bg-[#F59E0B]" />
                    <span>Jonli sinxronizatsiya</span>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-[#FAF8F3] text-[#737A75] font-semibold">
                        <th className="py-2.5 px-2">ID</th>
                        <th className="py-2.5 px-2">Stol / Xodim</th>
                        <th className="py-2.5 px-2">Taomlar</th>
                        <th className="py-2.5 px-2">Jami</th>
                        <th className="py-2.5 px-2">Holati</th>
                        <th className="py-2.5 px-2 text-right">Amal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#FAF8F3]">
                      {orders.slice(0, 5).map((ord) => {
                        const statusCfg = ORDER_STATUS_MAP[ord.status] || ORDER_STATUS_MAP.new;
                        const summary = ord.items.map((i) => `${i.quantity}x ${i.item_name}`).join(', ');
                        return (
                          <tr key={ord.id} className="hover:bg-[#FAF8F3]/60 transition-colors">
                            <td className="py-3 px-2 font-mono font-bold text-[#173F35]">
                              {ord.order_number}
                            </td>
                            <td className="py-3 px-2">
                              <span className="font-semibold block text-[#202622]">
                                Stol №{ord.table_number}
                              </span>
                              <span className="text-[10px] text-[#737A75]">
                                {ord.waiter_name || 'Zal'}
                              </span>
                            </td>
                            <td className="py-3 px-2 max-w-[140px] truncate" title={summary}>
                              {summary}
                            </td>
                            <td className="py-3 px-2 font-display font-bold text-[#173F35] tabular-nums whitespace-nowrap">
                              {formatUZS(ord.total_amount)}
                            </td>
                            <td className="py-3 px-2 whitespace-nowrap">
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${statusCfg.badgeBg}`}
                              >
                                {statusCfg.label}
                              </span>
                            </td>
                            <td className="py-3 px-2 text-right">
                              <Link
                                to="/admin/orders"
                                className="text-[#173F35] font-bold hover:underline"
                              >
                                Batafsil
                              </Link>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="pt-4 border-t border-[#FAF8F3] flex items-center justify-between text-xs">
                <span className="text-[#737A75]">
                  Ko'rsatilmoqda: {Math.min(5, orders.length)} ta / Jami {orders.length} ta
                </span>
                <Link
                  to="/admin/orders"
                  className="bg-[#173F35] text-white hover:bg-[#235B4E] font-semibold px-3.5 py-1.5 rounded-xl transition-colors"
                >
                  Barcha buyurtmalar oqimiga o'tish →
                </Link>
              </div>
            </div>
          </div>

          {/* Live Restaurant Rating & Guest Dish Reviews Section */}
          <div className="bg-white p-6 rounded-3xl border border-[#E5E0D8] shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#FAF8F3]">
              <div>
                <h3 className="font-display font-bold text-lg text-[#173F35]">
                  Restoran reytingi va mijozlar sharhlari
                </h3>
                <p className="text-xs text-[#737A75] mt-0.5">
                  Mijozlar tomonidan qoldirilgan taom baholari va izohlar restoran umumiy reytingini jonli shakllantiradi
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <div className="flex items-center gap-1.5">
                  <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
                  <span className="font-display font-extrabold text-2xl text-[#173F35] tabular-nums">
                    {restaurantRating.averageRating.toFixed(1)}
                  </span>
                  <span className="text-xs text-[#737A75]">/ 5.0</span>
                </div>
                <span className="text-xs text-[#737A75] tabular-nums">
                  {restaurantRating.totalReviews} ta baho
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Distribution Breakdown */}
              <div className="lg:col-span-4 bg-[#FAF8F3] rounded-2xl border border-[#E5E0D8] p-4 space-y-2.5">
                <span className="text-xs font-bold text-[#173F35] block">
                  Yulduzlar taqsimoti
                </span>
                {([5, 4, 3, 2, 1] as const).map((star) => {
                  const count = restaurantRating.distribution[star] || 0;
                  const pct =
                    restaurantRating.totalReviews > 0
                      ? Math.round((count / restaurantRating.totalReviews) * 100)
                      : 0;
                  return (
                    <div key={star} className="flex items-center gap-2 text-xs">
                      <span className="w-8 font-semibold text-[#202622] tabular-nums flex items-center gap-0.5 shrink-0">
                        {star}
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      </span>
                      <div className="flex-1 h-2 bg-[#E5E0D8] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#173F35] rounded-full transition-all duration-300"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="w-10 text-right text-[11px] text-[#737A75] tabular-nums shrink-0">
                        {count} ({pct}%)
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Latest Dish Reviews */}
              <div className="lg:col-span-8 divide-y divide-[#FAF8F3]">
                {dishReviews.slice(0, 6).map((rev) => (
                  <div key={rev.id} className="py-3 first:pt-0 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap text-xs">
                        <span className="font-bold text-[#202622]">{rev.dish_name}</span>
                        <span className="text-[#A5A096]" aria-hidden="true">·</span>
                        <span className="text-[#57605B]">
                          {rev.customer_name || `Stol №${rev.table_number} mehmoni`}
                        </span>
                        <span className="text-[#A5A096]" aria-hidden="true">·</span>
                        <span className="text-[11px] text-[#737A75]">
                          Stol №{rev.table_number} · {formatTimeAgo(rev.created_at)}
                        </span>
                      </div>
                      {rev.comment && (
                        <p className="text-xs text-[#3C4440] mt-1 leading-relaxed">{rev.comment}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-0.5 shrink-0 pt-0.5">
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
                ))}
                {dishReviews.length === 0 && (
                  <p className="text-xs text-[#737A75] py-6 text-center">
                    Hozircha mijozlardan taom baholari kelib tushmagan.
                  </p>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};
