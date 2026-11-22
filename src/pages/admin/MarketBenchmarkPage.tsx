import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { AdminSidebar } from '../../components/AdminSidebar';
import { AdminHeader } from '../../components/AdminHeader';
import { formatUZS } from '../../utils/formatters';
import {
  TrendingUp,
  TrendingDown,
  Building2,
  Award,
  Users,
  Timer,
  ShoppingBag,
  ArrowUpRight,
  ShieldCheck,
  Compass,
  BarChart2,
  PieChart as PieIcon,
  Sparkles,
  Layers,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

interface CompetitorData {
  id: string;
  name: string;
  segment: string;
  avgCheck: number;
  growthRateYoY: number; // in %
  tableTurnover: number; // turns per day
  csatScore: number;     // customer satisfaction %
  avgPrepTimeMinutes: number;
  marketSharePercent: number;
  isUs: boolean;
  notes: string;
}

export const MarketBenchmarkPage: React.FC = () => {
  const { restaurantName, restaurantBranch, orders } = useApp();
  const [activeTab, setActiveTab] = useState<'overview' | 'comparison' | 'market_share' | 'insights'>('overview');

  // Competitor benchmark dataset across Uzbekistan (Tashkent HoReCa segment)
  const competitors: CompetitorData[] = [
    {
      id: 'zafaran',
      name: restaurantName || 'Zafaran Grand',
      segment: 'Premium Milliy & Zamonaviy Gastronomiya',
      avgCheck: 1430000,
      growthRateYoY: 18.4,
      tableTurnover: 4.2,
      csatScore: 96.4,
      avgPrepTimeMinutes: 15,
      marketSharePercent: 24,
      isUs: true,
      notes: 'Raqamli QR buyurtma, tezkor oshxona KDS va yuqori premium servis',
    },
    {
      id: 'rayhon',
      name: 'Rayhon Milliy Taomlar',
      segment: 'Ommaviy Milliy Restoranlar Tarmog\'i',
      avgCheck: 680000,
      growthRateYoY: 9.8,
      tableTurnover: 3.8,
      csatScore: 89.2,
      avgPrepTimeMinutes: 22,
      marketSharePercent: 28,
      isUs: false,
      notes: 'Katta oqimli ommaviy segment, arzonroq o\'rtacha chek',
    },
    {
      id: 'caravan',
      name: 'Caravan Group (Caravan / Sato / Bahor)',
      segment: 'Etnik Fine Dining & Sayyohlik',
      avgCheck: 1850000,
      growthRateYoY: 7.2,
      tableTurnover: 2.4,
      csatScore: 92.0,
      avgPrepTimeMinutes: 28,
      marketSharePercent: 16,
      isUs: false,
      notes: 'An\'anaviy bezaklar, yuqori chek, lekin stol aylanmasi sekinroq',
    },
    {
      id: 'simsim',
      name: 'SimSim & Yapona Mama',
      segment: 'Zamonaviy Oilaviy & Casual Dining',
      avgCheck: 950000,
      growthRateYoY: 13.5,
      tableTurnover: 3.5,
      csatScore: 90.5,
      avgPrepTimeMinutes: 19,
      marketSharePercent: 18,
      isUs: false,
      notes: 'Faol marketing, sushi va sharqona miks taomlar',
    },
    {
      id: 'paul',
      name: 'Paul & Breadly Lounge',
      segment: 'Yevropa Premium Kafe & Desertlar',
      avgCheck: 820000,
      growthRateYoY: 11.0,
      tableTurnover: 3.0,
      csatScore: 91.8,
      avgPrepTimeMinutes: 17,
      marketSharePercent: 14,
      isUs: false,
      notes: 'Ertalabki nonushtalar va qahva segmenti yetakchisi',
    },
  ];

  // 6-month comparative growth timeline data (Uzbekistan HoReCa index)
  const growthTimelineData = [
    { month: 'May', zafaran: 12.1, marketAvg: 8.4, rayhon: 7.2, caravan: 6.0 },
    { month: 'Iyun', zafaran: 14.5, marketAvg: 9.1, rayhon: 8.5, caravan: 6.8 },
    { month: 'Iyul', zafaran: 15.8, marketAvg: 10.0, rayhon: 9.0, caravan: 7.1 },
    { month: 'Avgust', zafaran: 16.2, marketAvg: 9.8, rayhon: 9.4, caravan: 6.9 },
    { month: 'Sentabr', zafaran: 17.5, marketAvg: 10.6, rayhon: 9.6, caravan: 7.0 },
    { month: 'Oktabr (Hozir)', zafaran: 18.4, marketAvg: 11.2, rayhon: 9.8, caravan: 7.2 },
  ];

  // Market share donut data
  const marketShareData = competitors.map((c) => ({
    name: c.name,
    value: c.marketSharePercent,
    isUs: c.isUs,
  }));

  const COLORS = ['#173F35', '#FEA619', '#2563EB', '#0BB880', '#9333EA'];

  // Table turnover comparison
  const turnoverComparisonData = competitors.map((c) => ({
    name: c.name.split(' ')[0],
    turnover: c.tableTurnover,
    csat: c.csatScore,
    isUs: c.isUs,
  }));

  return (
    <div className="min-h-screen bg-[#FAF8F3] text-[#202622] flex">
      <AdminSidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <AdminHeader />

        <main className="flex-1 p-6 lg:p-8 space-y-6 max-w-7xl w-full mx-auto">
          {/* Header Banner */}
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-gradient-to-r from-emerald-50/80 via-white to-amber-50/40 p-6 rounded-3xl border border-[#E5E0D8] shadow-xs">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-display font-bold text-2xl text-[#173F35] tracking-tight">
                  O'zbekiston HoReCa Bozori & Benchmark Tahlili
                </h1>
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-amber-500" />
                  <span>Raqobatchilar bilan solishtirma</span>
                </span>
              </div>
              <p className="text-xs text-[#737A75] mt-1 max-w-3xl">
                <strong>"{restaurantName || 'Zafaran Grand'}"</strong> restoranining Toshkent va O'zbekiston umumiy ovqatlanish bozoridagi o'sish sur'ati, o'rtacha chek va raqobatchilar bilan qiyosiy ko'rsatkichlari.
              </p>
            </div>

            {/* Benchmark Status Chip */}
            <div className="flex items-center gap-3 bg-white p-3 rounded-2xl border border-[#E5E0D8] shadow-xs shrink-0">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                <TrendingUp className="w-5 h-5 text-emerald-700" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-[#737A75] uppercase tracking-wider block">
                  Bozordan O'sish Ustunligi
                </span>
                <span className="font-display font-bold text-base text-emerald-800">
                  +7.2% yuqori sur'at
                </span>
              </div>
            </div>
          </div>

          {/* 4 Big Benchmark KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Annual Growth Rate */}
            <div className="bg-white p-5 rounded-2xl border border-[#E5E0D8] shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-[#737A75] uppercase tracking-wider">
                    Yillik O'sish Sur'ati (YoY)
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    №1 o'sish
                  </span>
                </div>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="font-display font-bold text-3xl text-[#173F35]">18.4%</span>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-[#FAF8F3] text-xs flex items-center justify-between">
                <span className="text-emerald-700 font-bold flex items-center gap-0.5">
                  <TrendingUp className="w-3.5 h-3.5" />
                  +7.2%
                </span>
                <span className="text-[#737A75]">Bozor o'rtachasi: 11.2%</span>
              </div>
            </div>

            {/* Card 2: Average Check */}
            <div className="bg-white p-5 rounded-2xl border border-[#E5E0D8] shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-[#737A75] uppercase tracking-wider">
                    O'rtacha Chek Hajmi
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900">
                    Premium
                  </span>
                </div>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="font-display font-bold text-2xl text-[#173F35] tabular-nums">
                    {formatUZS(1430000)}
                  </span>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-[#FAF8F3] text-xs flex items-center justify-between">
                <span className="text-emerald-700 font-bold">+68.2%</span>
                <span className="text-[#737A75]">Bozor: 850,000 so'm</span>
              </div>
            </div>

            {/* Card 3: Table Turnover */}
            <div className="bg-white p-5 rounded-2xl border border-[#E5E0D8] shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-[#737A75] uppercase tracking-wider">
                    Stol Aylanmasi Tezligi
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-900">
                    A'lo
                  </span>
                </div>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="font-display font-bold text-3xl text-[#173F35]">4.2x</span>
                  <span className="text-xs text-[#737A75]">marta / kuniga</span>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-[#FAF8F3] text-xs flex items-center justify-between">
                <span className="text-emerald-700 font-bold">+35.5%</span>
                <span className="text-[#737A75]">Bozor: 3.1x / kun</span>
              </div>
            </div>

            {/* Card 4: CSAT & Loyalty */}
            <div className="bg-white p-5 rounded-2xl border border-[#E5E0D8] shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-[#737A75] uppercase tracking-wider">
                    Mijozlar Qoniqishi (CSAT)
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    96.4%
                  </span>
                </div>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="font-display font-bold text-3xl text-emerald-800">96.4%</span>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-[#FAF8F3] text-xs flex items-center justify-between">
                <span className="text-emerald-700 font-bold">+8.4 ball</span>
                <span className="text-[#737A75]">Bozor: 88.0%</span>
              </div>
            </div>
          </div>

          {/* Interactive Charts: Growth Dynamics & Market Share */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: 6-Month Growth Dynamics vs Competitors (8 cols) */}
            <div className="lg:col-span-8 bg-white p-6 rounded-3xl border border-[#E5E0D8] shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#FAF8F3] flex-wrap gap-2">
                <div>
                  <h3 className="font-display font-bold text-lg text-[#173F35] flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-emerald-700" />
                    <span>O'sish Dinamikasi Taqqoslovi (Oxirgi 6 oy, % da)</span>
                  </h3>
                  <p className="text-xs text-[#737A75] mt-0.5">
                    "{restaurantName || 'Zafaran Grand'}" vs O'zbekiston HoReCa bozor o'rtachasi vs Raqobatchilar
                  </p>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <span className="flex items-center gap-1 font-bold text-[#173F35]">
                    <span className="w-3 h-3 rounded-full bg-[#173F35]" />
                    <span>{restaurantName || 'Zafaran Grand'}</span>
                  </span>
                  <span className="flex items-center gap-1 text-[#737A75]">
                    <span className="w-3 h-3 rounded-full bg-amber-500" />
                    <span>Bozor o'rtachasi</span>
                  </span>
                </div>
              </div>

              <div className="h-72 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={growthTimelineData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorZafaran" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#173F35" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#173F35" stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="colorMarket" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#FEA619" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#FEA619" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F2EFE9" />
                    <XAxis dataKey="month" stroke="#737A75" fontSize={11} tickLine={false} />
                    <YAxis stroke="#737A75" fontSize={11} tickLine={false} tickFormatter={(v) => `${v}%`} />
                    <Tooltip
                      formatter={(val: any, name: any) => [
                        `${val}%`,
                        name === 'zafaran'
                          ? (restaurantName || 'Zafaran Grand')
                          : name === 'marketAvg'
                          ? 'Bozor O\'rtachasi'
                          : name === 'rayhon'
                          ? 'Rayhon'
                          : 'Caravan Group',
                      ]}
                      contentStyle={{
                        backgroundColor: '#FFFFFF',
                        borderRadius: '12px',
                        borderColor: '#E5E0D8',
                        fontSize: '12px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="zafaran"
                      stroke="#173F35"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#colorZafaran)"
                    />
                    <Area
                      type="monotone"
                      dataKey="marketAvg"
                      stroke="#FEA619"
                      strokeWidth={2}
                      strokeDasharray="4 4"
                      fillOpacity={1}
                      fill="url(#colorMarket)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="pt-2 border-t border-[#FAF8F3] flex items-center justify-between text-xs text-[#737A75] flex-wrap gap-2">
                <span>* Ma'lumotlar Toshkent shahri HoReCa uyushmasi va buyurtmalar tahlili asosida shakllantirilgan.</span>
                <span className="font-bold text-emerald-800">Barqaror ijobiy o'sish</span>
              </div>
            </div>

            {/* Right: Market Share & Segment Distribution (4 cols) */}
            <div className="lg:col-span-4 bg-white p-6 rounded-3xl border border-[#E5E0D8] shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-[#FAF8F3]">
                  <div>
                    <h3 className="font-display font-bold text-base text-[#173F35]">
                      Toshkent Premium Bozor Ulushi
                    </h3>
                    <p className="text-xs text-[#737A75]">
                      Asosiy o'yinchilar ulushi (%)
                    </p>
                  </div>
                  <PieIcon className="w-5 h-5 text-amber-500" />
                </div>

                <div className="h-44 w-full flex items-center justify-center relative my-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={marketShareData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={70}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {marketShareData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={entry.isUs ? '#173F35' : COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(val: any) => [`${val}%`, 'Ulush']}
                        contentStyle={{
                          backgroundColor: '#FFFFFF',
                          borderRadius: '10px',
                          borderColor: '#E5E0D8',
                          fontSize: '11px',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="font-display font-bold text-xl text-[#173F35]">24%</span>
                    <span className="text-[10px] text-[#737A75]">Zafaran</span>
                  </div>
                </div>

                <div className="space-y-1.5 pt-2 text-xs">
                  {competitors.map((c, idx) => (
                    <div key={c.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-2 truncate">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: c.isUs ? '#173F35' : COLORS[idx % COLORS.length] }}
                        />
                        <span className={`truncate ${c.isUs ? 'font-bold text-[#173F35]' : 'text-[#202622]'}`}>
                          {c.name}
                        </span>
                      </div>
                      <span className="font-bold text-[#173F35] tabular-nums shrink-0">
                        {c.marketSharePercent}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Detailed Competitors Benchmark Comparison Matrix Table */}
          <div className="bg-white rounded-3xl border border-[#E5E0D8] shadow-xs overflow-hidden">
            <div className="p-5 border-b border-[#E5E0D8] flex items-center justify-between flex-wrap gap-2">
              <div>
                <h3 className="font-display font-bold text-base text-[#173F35] flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-emerald-700" />
                  <span>O'zbekiston Restoranlari Solishtirma Matritsasi</span>
                </h3>
                <p className="text-xs text-[#737A75] mt-0.5">
                  Bozor ko'rsatkichlari, chek hajmi va stol aylanmasi bo'yicha to'liq taqqoslash
                </p>
              </div>
              <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-200">
                2026-yil dolzarb ko'rsatkichlari
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#FAF8F3] text-[#737A75] font-bold uppercase text-[10px] tracking-wider border-b border-[#E5E0D8]">
                    <th className="py-3 px-4">Restoran Nomi</th>
                    <th className="py-3 px-4">Segment / Format</th>
                    <th className="py-3 px-4 text-right">O'rtacha Chek</th>
                    <th className="py-3 px-4 text-center">O'sish Sur'ati</th>
                    <th className="py-3 px-4 text-center">Stol Aylanmasi</th>
                    <th className="py-3 px-4 text-center">Mijoz CSAT</th>
                    <th className="py-3 px-4 text-center">Tayyorlash Vaqti</th>
                    <th className="py-3 px-4">Bozor Xususiyati</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#FAF8F3]">
                  {competitors.map((c) => (
                    <tr
                      key={c.id}
                      className={c.isUs ? 'bg-emerald-50/50 font-semibold' : 'hover:bg-[#FAF8F3]/60 transition-colors'}
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          {c.isUs && (
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                          )}
                          <span className={`font-bold ${c.isUs ? 'text-[#173F35]' : 'text-[#202622]'}`}>
                            {c.name}
                          </span>
                          {c.isUs && (
                            <span className="text-[9px] font-extrabold bg-[#173F35] text-amber-300 px-1.5 py-0.5 rounded uppercase">
                              Bizniki
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-[#737A75]">{c.segment}</td>
                      <td className="py-3.5 px-4 text-right font-display font-bold text-[#173F35] tabular-nums whitespace-nowrap">
                        {formatUZS(c.avgCheck)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            c.growthRateYoY >= 15
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          +{c.growthRateYoY}%
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono font-bold text-[#202622]">
                        {c.tableTurnover}x / kun
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold text-emerald-700">
                        {c.csatScore}%
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono text-[#737A75]">
                        {c.avgPrepTimeMinutes} daqiqa
                      </td>
                      <td className="py-3.5 px-4 text-[#737A75] max-w-xs">{c.notes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Strategic Market Insights & Actions for Zafaran Grand */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-3xl border border-[#E5E0D8] shadow-xs space-y-2">
              <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Asosiy Raqobat Ustunliklari</span>
              </div>
              <ul className="text-xs text-[#737A75] space-y-1.5 list-disc pl-4">
                <li>Oshxona KDS tufayli taom tayyorlash tezligi bozordan 7 daqiqaga tezroq (15 daqiqa).</li>
                <li>QR raqamli menyu orqali mijozlar buyurtmani mustaqil va xatosiz yuborishi.</li>
                <li>Stol aylanmasi (4.2x) yuqori bo'lgani hisobiga tushum o'sishi barqaror.</li>
              </ul>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-[#E5E0D8] shadow-xs space-y-2">
              <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
                <Sparkles className="w-4 h-4 text-amber-600" />
                <span>O'sish Drayverlari & Imkoniyatlar</span>
              </div>
              <ul className="text-xs text-[#737A75] space-y-1.5 list-disc pl-4">
                <li>VIP va Biznes stollarda korporativ banketlar va oilaviy bayramlar xizmatini kengaytirish.</li>
                <li>Mavsumiy mualliflik ichimliklari va milliy shirinliklar ulushini 15% ga oshirish.</li>
                <li>Muntazam mehmonlar uchun sodiqlik va oldindan bron qilish tizimini joriy etish.</li>
              </ul>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-[#E5E0D8] shadow-xs space-y-2">
              <div className="flex items-center gap-2 text-blue-900 font-bold text-sm">
                <Compass className="w-4 h-4 text-blue-600" />
                <span>Bozor Xavflari & Tavsiyalar</span>
              </div>
              <ul className="text-xs text-[#737A75] space-y-1.5 list-disc pl-4">
                <li>Go'sht va sifatli qishloq xo'jaligi mahsulotlari narxining tebranishini nazorat qilish.</li>
                <li>Zal ofitsiantlari malakasini oshirish orqali o'rtacha chekni 1,500,000 so'mga yetkazish.</li>
                <li>Dam olish kunlari kechki piki vaqtida stollar navbatini boshqarish.</li>
              </ul>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};
