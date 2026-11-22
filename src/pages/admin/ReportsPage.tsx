import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { AdminSidebar } from '../../components/AdminSidebar';
import { AdminHeader } from '../../components/AdminHeader';
import { formatUZS } from '../../utils/formatters';
import { useNavigate } from 'react-router-dom';
import {
  Download,
  Calendar,
  FileSpreadsheet,
  TrendingUp,
  TrendingDown,
  CreditCard,
  Receipt,
  Utensils,
  BarChart2,
  Clock,
  Timer,
  PieChart as PieIcon,
  CheckCircle2,
  Flame,
  ChefHat,
  ArrowUpRight,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

import {
  computePeriodStats,
  computeSalesDynamics,
  computeTopDishes,
  computeCategoryShare,
  AnalyticsPeriod,
  CATEGORY_PALETTE,
} from '../../utils/analytics';

export const ReportsPage: React.FC = () => {
  const navigate = useNavigate();
  const { orders, menuItems, categories, addToast } = useApp();
  const [range, setRange] = useState<AnalyticsPeriod>('hourly');
  const [selectedHour, setSelectedHour] = useState<string | 'all'>('all');
  const [chartMetric, setChartMetric] = useState<'revenue' | 'orders'>('revenue');

  const numericHour = useMemo(() => {
    if (selectedHour === 'all' || (range !== 'hourly' && range !== 'today')) return undefined;
    return parseInt(selectedHour.split(':')[0], 10);
  }, [selectedHour, range]);

  // Real period KPIs computed dynamically from actual orders (or specific hour)
  const periodStats = useMemo(() => {
    return computePeriodStats(orders, range, numericHour);
  }, [orders, range, numericHour]);

  // Real dynamic chart data (hourly, 7 days, 10 days dekada, 30 days)
  const dynamics = useMemo(() => {
    return computeSalesDynamics(orders, range);
  }, [orders, range]);

  // Real Top Dishes computed dynamically from actual ordered items in this period
  const topDishes = useMemo(() => {
    return computeTopDishes(orders, menuItems, range, 10, numericHour);
  }, [orders, menuItems, range, numericHour]);

  // Real Category Distribution for this period
  const categoryShare = useMemo(() => {
    return computeCategoryShare(orders, categories, menuItems, range, numericHour);
  }, [orders, categories, menuItems, range, numericHour]);

  const salesData = useMemo(() => {
    return dynamics.data.map((d) => ({
      time: d.time,
      revenue: d.sales,
      orders: d.orders,
      avgCheck: d.avgCheck || 0,
      peakType: d.peakType,
      rawDate: d.rawDate,
    }));
  }, [dynamics]);

  const totalPeriodRevenue = periodStats.periodRevenue;
  const totalPeriodOrders = periodStats.periodOrdersCount;
  const avgCheck = periodStats.avgCheck;
  const avgPrepMinutes = periodStats.avgPrepMinutes;

  const getPeriodLabel = (p: AnalyticsPeriod) => {
    switch (p) {
      case 'hourly':
      case 'today':
        return 'Bugun (Soatbay)';
      case 'week':
        return 'Haftalik (7 kun)';
      case 'tendays':
        return "O'nlik (10 kunlik Dekada)";
      case 'month':
        return 'Oylik (30 kun)';
      default:
        return 'Davriy';
    }
  };

  const exportReport = () => {
    const csvRows = [
      ['Davr / Vaqt', 'Tushum (so\'m)', 'Buyurtmalar soni', 'O\'rtacha chek (so\'m)'],
      ...salesData.map((d) => [`"${d.time}"`, `"${d.revenue}"`, `"${d.orders}"`, `"${d.avgCheck}"`]),
      [],
      ['Top Taomlar Reytingi (Tanlangan davr bo\'yicha)'],
      ['O\'rin', 'Taom nomi', 'Kategoriya', 'Sotilgan miqdor', 'Tushum (so\'m)', 'Ulush (%)'],
      ...topDishes.map((t) => [
        `"${t.rank}"`,
        `"${t.name}"`,
        `"${t.category}"`,
        `"${t.quantity} ${t.portionUnit}"`,
        `"${t.revenue}"`,
        `"${t.sharePercent}%"`,
      ]),
    ];

    const csvContent =
      'data:text/csv;charset=utf-8,' + csvRows.map((r) => r.join(',')).join('\n');
    const encoded = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encoded);
    link.setAttribute('download', `dineflow_hisobot_${range}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast('success', 'Eksport qilindi', `${getPeriodLabel(range)} hisoboti CSV formatida yuklab olindi.`);
  };

  return (
    <div className="min-h-screen bg-[#FAF8F3] text-[#202622] flex">
      <AdminSidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <AdminHeader />

        <main className="flex-1 p-6 lg:p-8 space-y-6 max-w-7xl w-full mx-auto">
          {/* Header & Period Switcher */}
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-gradient-to-r from-emerald-50/60 via-white to-amber-50/30 p-5 rounded-3xl border border-[#E5E0D8] shadow-xs">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-display font-bold text-2xl text-[#173F35] tracking-tight">
                  Hisobotlar & Moliyaviy Tahlil
                </h1>
                <span className="text-[11px] font-bold bg-[#E8F0EC] text-[#173F35] px-2.5 py-0.5 rounded-full">
                  Real buyurtmalar asosida
                </span>
              </div>
              <p className="text-xs text-[#737A75] mt-1">
                Soatbay, haftalik, 10-kunlik (dekada) va oylik ko'rsatkichlar real vaqt rejimida
              </p>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              {/* 4 Mode Tab Switcher: Soatlik / Haftalik / O'nlik / Oylik */}
              <div className="bg-white p-1 rounded-2xl border border-[#E5E0D8] shadow-xs flex items-center flex-wrap gap-1">
                <button
                  onClick={() => setRange('hourly')}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    range === 'hourly' || range === 'today'
                      ? 'bg-[#173F35] text-white shadow-xs'
                      : 'text-[#737A75] hover:text-[#202622] hover:bg-[#FAF8F3]'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>Soatbay (Bugun)</span>
                </button>

                <button
                  onClick={() => setRange('week')}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    range === 'week'
                      ? 'bg-[#173F35] text-white shadow-xs'
                      : 'text-[#737A75] hover:text-[#202622] hover:bg-[#FAF8F3]'
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Haftalik (7 kun)</span>
                </button>

                <button
                  onClick={() => setRange('tendays')}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    range === 'tendays'
                      ? 'bg-[#173F35] text-white shadow-xs'
                      : 'text-[#737A75] hover:text-[#202622] hover:bg-[#FAF8F3]'
                  }`}
                >
                  <Flame className="w-3.5 h-3.5 text-amber-500" />
                  <span>O'nlik (10 kunlik Dekada)</span>
                </button>

                <button
                  onClick={() => setRange('month')}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    range === 'month'
                      ? 'bg-[#173F35] text-white shadow-xs'
                      : 'text-[#737A75] hover:text-[#202622] hover:bg-[#FAF8F3]'
                  }`}
                >
                  <BarChart2 className="w-3.5 h-3.5" />
                  <span>Oylik (30 kun)</span>
                </button>
              </div>

              <button
                onClick={() => navigate('/admin/kitchen-efficiency')}
                className="bg-emerald-50 hover:bg-emerald-100 text-[#173F35] border border-emerald-300 px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-all active:scale-95"
                title="D3.js orqali har bir taomning tayyorlanish vaqti va oshxona unumdorligi"
              >
                <ChefHat className="w-4 h-4 text-emerald-700" />
                <span>Oshxona Samaradorligi (D3)</span>
              </button>

              <button
                onClick={() => navigate('/admin/export-reports')}
                className="bg-[#173F35] hover:bg-[#235B4E] text-white px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-all active:scale-95"
                title="Kunlik, haftalik, 10-kunlik va oylik hisobotlarni yuklab olish markazi"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-300" />
                <span>CSV Eksport Markazi</span>
              </button>

              <button
                onClick={() => navigate('/admin/market-benchmark')}
                className="bg-white hover:bg-slate-50 text-[#173F35] border border-[#E5E0D8] px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-all active:scale-95"
                title="O'zbekistonda restoran o'sishi va raqobatchilar tahlili"
              >
                <TrendingUp className="w-4 h-4 text-amber-500" />
                <span>Bozor Tahlili</span>
              </button>
            </div>
          </div>

          {/* 4 Bento KPI Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Revenue */}
            <div className="bg-white p-5 rounded-2xl border border-[#E5E0D8] shadow-xs flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[11px] font-bold text-[#737A75] uppercase tracking-wider">
                    {getPeriodLabel(range)} jami tushum
                  </span>
                  <div className="mt-1 flex items-baseline gap-1">
                    <span className="font-display font-bold text-2xl text-[#173F35] tabular-nums">
                      {formatUZS(totalPeriodRevenue)}
                    </span>
                  </div>
                </div>
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                  <CreditCard className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-[#FAF8F3] flex items-center justify-between text-xs">
                <span
                  className={`font-bold flex items-center gap-1 ${
                    periodStats.isGrowthPositive ? 'text-emerald-700' : 'text-rose-600'
                  }`}
                >
                  {periodStats.isGrowthPositive ? (
                    <TrendingUp className="w-3.5 h-3.5" />
                  ) : (
                    <TrendingDown className="w-3.5 h-3.5" />
                  )}
                  {periodStats.growthPercent}
                </span>
                <span className="text-[#737A75]">{periodStats.growthLabel}</span>
              </div>
            </div>

            {/* Card 2: Orders Count */}
            <div className="bg-white p-5 rounded-2xl border border-[#E5E0D8] shadow-xs flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[11px] font-bold text-[#737A75] uppercase tracking-wider">
                    Jami buyurtmalar
                  </span>
                  <div className="mt-1 flex items-baseline gap-1">
                    <span className="font-display font-bold text-2xl text-[#173F35] tabular-nums">
                      {totalPeriodOrders}
                    </span>
                    <span className="text-xs text-[#737A75]">ta chek</span>
                  </div>
                </div>
                <div className="w-10 h-10 rounded-xl bg-[#FAF8F3] text-[#173F35] flex items-center justify-center shrink-0">
                  <Receipt className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-[#FAF8F3] flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-[11px] flex-wrap">
                  <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md font-bold">
                    {periodStats.deliveredCount} yetkazilgan
                  </span>
                  {periodStats.activeCount > 0 && (
                    <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded-md font-bold">
                      {periodStats.activeCount} faol
                    </span>
                  )}
                </div>
                <span
                  className={`font-bold flex items-center gap-0.5 ${
                    periodStats.isOrdersGrowthPositive ? 'text-emerald-700' : 'text-rose-600'
                  }`}
                >
                  {periodStats.isOrdersGrowthPositive ? (
                    <TrendingUp className="w-3 h-3" />
                  ) : (
                    <TrendingDown className="w-3 h-3" />
                  )}
                  {periodStats.ordersGrowthPercent}
                </span>
              </div>
            </div>

            {/* Card 3: Average Check */}
            <div className="bg-white p-5 rounded-2xl border border-[#E5E0D8] shadow-xs flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[11px] font-bold text-[#737A75] uppercase tracking-wider">
                    O'rtacha chek qiymati
                  </span>
                  <div className="mt-1 flex items-baseline gap-1">
                    <span className="font-display font-bold text-2xl text-[#173F35] tabular-nums">
                      {formatUZS(avgCheck)}
                    </span>
                  </div>
                </div>
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
                  <ArrowUpRight className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-[#FAF8F3] flex items-center justify-between text-xs">
                <span
                  className={`font-bold flex items-center gap-1 ${
                    periodStats.isAvgCheckGrowthPositive ? 'text-emerald-700' : 'text-rose-600'
                  }`}
                >
                  {periodStats.isAvgCheckGrowthPositive ? (
                    <TrendingUp className="w-3.5 h-3.5" />
                  ) : (
                    <TrendingDown className="w-3.5 h-3.5" />
                  )}
                  {periodStats.avgCheckGrowthPercent} dinamika
                </span>
                <span className="text-[#737A75]">Bitta stol uchun o'rtacha</span>
              </div>
            </div>

            {/* Card 4: Prep Time */}
            <div className="bg-white p-5 rounded-2xl border border-[#E5E0D8] shadow-xs flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[11px] font-bold text-[#737A75] uppercase tracking-wider">
                    O'rtacha tayyorlash
                  </span>
                  <div className="mt-1 flex items-baseline gap-1">
                    <span className="font-display font-bold text-2xl text-[#173F35] tabular-nums">
                      {avgPrepMinutes}
                    </span>
                    <span className="text-xs text-[#737A75]">daqiqa</span>
                  </div>
                </div>
                <div className="w-10 h-10 rounded-xl bg-[#E8F0EC] text-[#173F35] flex items-center justify-center shrink-0">
                  <Timer className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-[#FAF8F3] flex items-center justify-between text-xs">
                <span className="text-[#173F35] font-bold">KDS ko'rsatkichi: A'lo</span>
                <span className="text-[#737A75]">Maksimal norma: 25 daq</span>
              </div>
            </div>
          </div>

          {/* Main Visual Sales Dynamics Section */}
          <div className="bg-white p-6 rounded-3xl border border-[#E5E0D8] shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#FAF8F3] gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-display font-bold text-lg text-[#173F35]">
                    {dynamics.title}
                  </h3>
                  <span className="text-[10px] font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded-md">
                    {range === 'hourly'
                      ? '15 ta soat oralig\'i'
                      : range === 'week'
                      ? 'Oxirgi 7 kun'
                      : range === 'tendays'
                      ? '10 kunlik dekada'
                      : '30 kun (3 dekada)'}
                  </span>
                </div>
                <p className="text-xs text-[#737A75] mt-0.5">{dynamics.subtitle}</p>
              </div>

              {/* Chart Metric Switcher */}
              <div className="flex items-center gap-2">
                <div className="bg-[#FAF8F3] p-1 rounded-xl border border-[#E5E0D8] flex items-center text-xs">
                  <button
                    onClick={() => setChartMetric('revenue')}
                    className={`px-3 py-1 rounded-lg font-bold transition-all ${
                      chartMetric === 'revenue'
                        ? 'bg-[#173F35] text-white shadow-xs'
                        : 'text-[#737A75]'
                    }`}
                  >
                    Tushum (so'm)
                  </button>
                  <button
                    onClick={() => setChartMetric('orders')}
                    className={`px-3 py-1 rounded-lg font-bold transition-all ${
                      chartMetric === 'orders'
                        ? 'bg-[#173F35] text-white shadow-xs'
                        : 'text-[#737A75]'
                    }`}
                  >
                    Buyurtmalar (dona)
                  </button>
                </div>
                <BarChart2 className="w-5 h-5 text-[#737A75]" />
              </div>
            </div>

            {/* Hourly Filter Bar when range is hourly */}
            {range === 'hourly' && (
              <div className="bg-[#FAF8F3] p-2.5 rounded-2xl border border-[#E5E0D8]/80 space-y-2">
                <div className="flex items-center justify-between text-xs flex-wrap gap-2">
                  <div className="flex items-center gap-1.5 font-bold text-[#173F35]">
                    <Clock className="w-4 h-4 text-emerald-700" />
                    <span>Soat bo'yicha filter:</span>
                    <span className="text-[#737A75] font-normal">
                      {selectedHour === 'all'
                        ? 'Barcha soatlar (09:00 - 23:00)'
                        : `Tanlangan soat: ${selectedHour}`}
                    </span>
                  </div>
                  {selectedHour !== 'all' && (
                    <button
                      onClick={() => setSelectedHour('all')}
                      className="text-[11px] font-bold text-emerald-700 hover:underline"
                    >
                      Barchasini ko'rsatish
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pt-0.5">
                  <button
                    onClick={() => setSelectedHour('all')}
                    className={`px-3 py-1 rounded-xl text-[11px] font-bold whitespace-nowrap transition-all ${
                      selectedHour === 'all'
                        ? 'bg-[#173F35] text-white shadow-xs'
                        : 'bg-white text-[#737A75] border border-[#E5E0D8] hover:border-[#173F35]'
                    }`}
                  >
                    Barchasi
                  </button>
                  {salesData.map((dp) => {
                    const isSel = selectedHour === dp.time;
                    return (
                      <button
                        key={dp.time}
                        onClick={() => setSelectedHour(dp.time)}
                        className={`px-2.5 py-1 rounded-xl text-[11px] font-bold whitespace-nowrap transition-all flex items-center gap-1 ${
                          isSel
                            ? 'bg-amber-500 text-slate-950 shadow-md ring-2 ring-amber-300'
                            : dp.revenue > 0
                            ? 'bg-white text-[#173F35] border border-emerald-200'
                            : 'bg-white/60 text-[#737A75] border border-[#E5E0D8]'
                        }`}
                      >
                        <span>{dp.time}</span>
                        {dp.revenue > 0 && (
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

            {/* Dynamic Recharts Visualization */}
            <div className="h-80 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={salesData}
                  margin={{ top: 10, right: 10, left: 10, bottom: 20 }}
                  onClick={(state: any) => {
                    if (range === 'hourly' && state && state.activeLabel) {
                      setSelectedHour(state.activeLabel);
                    }
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F2EFE9" />
                  <XAxis
                    dataKey="time"
                    stroke="#737A75"
                    fontSize={11}
                    tickLine={false}
                    interval={0}
                    angle={range === 'hourly' || range === 'tendays' ? -25 : 0}
                    textAnchor={range === 'hourly' || range === 'tendays' ? 'end' : 'middle'}
                  />
                  <YAxis
                    stroke="#737A75"
                    fontSize={11}
                    tickLine={false}
                    tickFormatter={(val) => {
                      if (chartMetric === 'orders') return `${val} ta`;
                      if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
                      if (val >= 1000) return `${Math.round(val / 1000)}K`;
                      return String(val);
                    }}
                  />
                  <Tooltip
                    formatter={(val: any) => [
                      chartMetric === 'revenue' ? formatUZS(Number(val) || 0) : `${val} ta buyurtma`,
                      chartMetric === 'revenue' ? 'Tushum' : 'Cheklar soni',
                    ]}
                    labelFormatter={(label) =>
                      range === 'hourly'
                        ? `Soat: ${label}`
                        : range === 'tendays'
                        ? `Dekada kuni: ${label}`
                        : range === 'week'
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
                  <Bar
                    dataKey={chartMetric === 'revenue' ? 'revenue' : 'orders'}
                    radius={[6, 6, 0, 0]}
                    cursor="pointer"
                  >
                    {salesData.map((entry, index) => {
                      const isSelected = selectedHour === entry.time;
                      let barColor = '#173F35';
                      if (range === 'hourly' && selectedHour !== 'all') {
                        barColor = isSelected ? '#FEA619' : '#D1DCD6';
                      } else if (entry.peakType === 'lunch' || entry.peakType === 'dinner') {
                        barColor = '#FEA619';
                      }
                      return <Cell key={`cell-${index}`} fill={barColor} />;
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Peak Highlights and Summary Bar */}
            <div className="pt-3 border-t border-[#FAF8F3] flex items-center justify-between text-xs text-[#737A75] flex-wrap gap-2">
              {range === 'hourly' ? (
                <>
                  {selectedHour !== 'all' ? (
                    <div className="flex items-center gap-1.5 text-[#173F35] font-bold">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
                      <span>
                        Tanlangan soat: {selectedHour} · Tushum: {formatUZS(periodStats.periodRevenue)} ({periodStats.periodOrdersCount} ta chek)
                      </span>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-1.5 text-[#173F35] font-semibold">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                        <span>{dynamics.lunchPeakText}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-amber-800 font-bold">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                        <span>{dynamics.dinnerPeakText}</span>
                      </div>
                    </>
                  )}
                </>
              ) : (
                <>
                  <span className="text-[#173F35] font-bold">{dynamics.topSummaryText}</span>
                  <span className="text-emerald-700 font-semibold">
                    Jami {periodStats.periodOrdersCount} ta chek · O'rtacha {formatUZS(avgCheck)}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Granular Breakdown Table (Soatlik taqsimot yoki 10-kunlik dekada jadvali) */}
          <div className="bg-white p-6 rounded-3xl border border-[#E5E0D8] shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-[#FAF8F3] mb-4">
              <div>
                <h3 className="font-display font-bold text-lg text-[#173F35]">
                  {range === 'hourly'
                    ? 'Soatbay taqsimot jadvali'
                    : range === 'tendays'
                    ? "10-kunlik dekada kunbay hisoboti"
                    : range === 'week'
                    ? 'Hafta kunlari tahlili'
                    : 'Oylik davrlar taqsimoti'}
                </h3>
                <p className="text-xs text-[#737A75]">
                  Har bir oraliqdagi aniq tushum, cheklar va o'rtacha qiymat
                </p>
              </div>
              <span className="text-xs text-[#737A75]">
                {salesData.length} ta oraliq
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#FAF8F3] text-[#737A75] font-semibold border-b border-[#E5E0D8]">
                    <th className="py-3 px-3">
                      {range === 'hourly' ? 'Soat oralig\'i' : 'Sana / Davr'}
                    </th>
                    <th className="py-3 px-3">Buyurtmalar soni</th>
                    <th className="py-3 px-3">Tushum</th>
                    <th className="py-3 px-3">O'rtacha chek</th>
                    <th className="py-3 px-3">Davrdagi ulush</th>
                    <th className="py-3 px-3 text-right">Holat</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#FAF8F3]">
                  {salesData.map((row, idx) => {
                    const share =
                      totalPeriodRevenue > 0
                        ? Math.round((row.revenue / totalPeriodRevenue) * 100)
                        : 0;
                    return (
                      <tr key={idx} className="hover:bg-[#FAF8F3]/60 transition-colors">
                        <td className="py-3 px-3 font-bold text-[#173F35]">
                          {row.time}
                        </td>
                        <td className="py-3 px-3 font-semibold text-[#202622]">
                          {row.orders} ta chek
                        </td>
                        <td className="py-3 px-3 font-display font-bold text-[#173F35] tabular-nums">
                          {formatUZS(row.revenue)}
                        </td>
                        <td className="py-3 px-3 text-[#737A75] tabular-nums">
                          {formatUZS(row.avgCheck)}
                        </td>
                        <td className="py-3 px-3 font-bold text-emerald-700">
                          {share}%
                        </td>
                        <td className="py-3 px-3 text-right">
                          {row.peakType === 'lunch' ? (
                            <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                              Tushlik piki
                            </span>
                          ) : row.peakType === 'dinner' ? (
                            <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                              Kechki pik
                            </span>
                          ) : row.revenue > 0 ? (
                            <span className="text-[10px] font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full">
                              Faol savdo
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400">
                              Buyurtmasiz
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Bottom Grid: Best-Selling Dishes + Category Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Real Top 10 Best-Selling Dishes Table (8 cols) */}
            <div className="lg:col-span-8 bg-white p-6 rounded-3xl border border-[#E5E0D8] shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-[#FAF8F3] mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-display font-bold text-lg text-[#173F35]">
                      Top 10 ta eng ko'p sotilgan taomlar
                    </h3>
                    <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md">
                      {getPeriodLabel(range)}
                    </span>
                  </div>
                  <p className="text-xs text-[#737A75]">
                    Tanlangan davr ichida mijozlar tomonidan eng ko'p buyurtma qilingan taomlar
                  </p>
                </div>
                <Utensils className="w-5 h-5 text-[#737A75]" />
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#FAF8F3] text-[#737A75] font-semibold border-b border-[#E5E0D8]">
                      <th className="py-3 px-3">№</th>
                      <th className="py-3 px-3">Taom nomi</th>
                      <th className="py-3 px-3">Kategoriya</th>
                      <th className="py-3 px-3">Sotilgan miqdor</th>
                      <th className="py-3 px-3">Jami tushum</th>
                      <th className="py-3 px-3">Ulush</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#FAF8F3]">
                    {topDishes.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-[#737A75]">
                          Bu davrda hozircha buyurtma qayd etilmagan
                        </td>
                      </tr>
                    ) : (
                      topDishes.map((row) => (
                        <tr key={row.rank} className="hover:bg-[#FAF8F3]/60 transition-colors">
                          <td className="py-3 px-3 font-bold text-[#173F35]">#{row.rank}</td>
                          <td className="py-3 px-3 font-bold text-[#202622]">{row.name}</td>
                          <td className="py-3 px-3 text-[#737A75]">{row.category}</td>
                          <td className="py-3 px-3 text-[#202622] font-semibold">
                            {row.quantity} {row.portionUnit}
                          </td>
                          <td className="py-3 px-3 font-display font-bold text-[#173F35] tabular-nums">
                            {formatUZS(row.revenue)}
                          </td>
                          <td className="py-3 px-3 font-bold text-emerald-700">
                            {row.sharePercent}%
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Category Share Distribution Donut (4 cols) */}
            <div className="lg:col-span-4 bg-white p-6 rounded-3xl border border-[#E5E0D8] shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-[#FAF8F3]">
                  <div>
                    <h3 className="font-display font-bold text-lg text-[#173F35]">
                      Kategoriyalar ulushi
                    </h3>
                    <p className="text-xs text-[#737A75]">{getPeriodLabel(range)} kesimida</p>
                  </div>
                  <PieIcon className="w-5 h-5 text-[#737A75]" />
                </div>

                <div className="h-52 w-full flex items-center justify-center relative my-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryShare}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={75}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {categoryShare.map((_, index) => (
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
                      {categoryShare.length}
                    </span>
                    <span className="text-[10px] text-[#737A75]">Kategoriya</span>
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-[#FAF8F3] text-xs">
                  {categoryShare.map((item, idx) => (
                    <div key={item.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{
                            backgroundColor:
                              CATEGORY_PALETTE[idx % CATEGORY_PALETTE.length],
                          }}
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

              <div className="mt-4 pt-3 border-t border-[#FAF8F3] text-[11px] text-[#737A75] flex items-center justify-between">
                <span>Eng katta tushum ulushi:</span>
                <strong className="text-[#173F35]">
                  {categoryShare[0]?.name || 'Milliy taomlar'}
                </strong>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};
