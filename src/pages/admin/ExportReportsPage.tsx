import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { AdminSidebar } from '../../components/AdminSidebar';
import { AdminHeader } from '../../components/AdminHeader';
import { formatUZS, formatShortTime, ORDER_STATUS_MAP } from '../../utils/formatters';
import {
  Download,
  Calendar,
  FileSpreadsheet,
  Printer,
  Receipt,
  CreditCard,
  Utensils,
  Filter,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowDownToLine,
  Layers,
} from 'lucide-react';
import {
  filterOrdersByPeriod,
  AnalyticsPeriod,
  computePeriodStats,
} from '../../utils/analytics';

export const ExportReportsPage: React.FC = () => {
  const { orders, tables, restaurantName, restaurantBranch, addToast } = useApp();
  const [period, setPeriod] = useState<AnalyticsPeriod>('today');
  const [statusFilter, setStatusFilter] = useState<'all' | 'delivered' | 'active'>('all');
  const [searchTable, setSearchTable] = useState<string>('all');

  // Filtered orders for the chosen period
  const rawPeriodOrders = useMemo(() => {
    return filterOrdersByPeriod(orders, period);
  }, [orders, period]);

  const filteredOrders = useMemo(() => {
    return rawPeriodOrders.filter((ord) => {
      if (statusFilter === 'delivered' && ord.status !== 'delivered') return false;
      if (statusFilter === 'active' && (ord.status === 'delivered' || ord.status === 'cancelled')) return false;
      if (searchTable !== 'all' && ord.table_number.toString() !== searchTable) return false;
      return true;
    });
  }, [rawPeriodOrders, statusFilter, searchTable]);

  const stats = useMemo(() => {
    const nonCancelled = filteredOrders.filter((o) => o.status !== 'cancelled');
    const totalRev = nonCancelled.reduce((sum, o) => sum + o.total_amount, 0);
    const count = filteredOrders.length;
    const avg = nonCancelled.length > 0 ? Math.round(totalRev / nonCancelled.length) : 0;
    const totalItems = filteredOrders.reduce(
      (sum, o) => sum + (o.items ? o.items.reduce((s, it) => s + it.quantity, 0) : 0),
      0
    );
    return { totalRev, count, avg, totalItems };
  }, [filteredOrders]);

  const getPeriodTitle = (p: AnalyticsPeriod) => {
    switch (p) {
      case 'today':
      case 'hourly':
        return 'Bugungi kunlik hisobot (Soatbay)';
      case 'week':
        return 'Haftalik hisobot (Oxirgi 7 kun)';
      case 'tendays':
        return "O'nlik hisobot (10 kunlik dekada)";
      case 'month':
        return 'Oylik hisobot (30 kunlik jamlanma)';
      default:
        return 'Davriy hisobot';
    }
  };

  const exportPeriodDirectly = (targetPeriod: AnalyticsPeriod | 'all', format: 'csv' | 'tsv' = 'csv') => {
    const targetOrders = targetPeriod === 'all' ? orders : filterOrdersByPeriod(orders, targetPeriod);
    const nonCancelled = targetOrders.filter((o) => o.status !== 'cancelled');
    const totalRev = nonCancelled.reduce((sum, o) => sum + o.total_amount, 0);
    const count = targetOrders.length;
    const avg = nonCancelled.length > 0 ? Math.round(totalRev / nonCancelled.length) : 0;

    const periodName =
      targetPeriod === 'all'
        ? 'Barcha buyurtmalar arxivi'
        : getPeriodTitle(targetPeriod);

    const separator = format === 'csv' ? ',' : '\t';
    const filename = `${(restaurantName || 'zafaran').toLowerCase().replace(/\s+/g, '_')}_${targetPeriod}_${new Date().toISOString().slice(0, 10)}.${format}`;

    const headers = [
      '№',
      'Chek Raqami',
      'Sana va Vaqt',
      'Stol Raqami',
      'Taomlar Nomi va Miqdori',
      'Jami Summa (so\'m)',
      'Holati',
      'Mas\'ul Ofitsiant',
    ];

    const rows = targetOrders.map((ord, idx) => {
      const itemsStr = (ord.items || [])
        .map((it) => `${it.item_name} (${it.quantity}x)`)
        .join('; ');

      const statusLabel = ORDER_STATUS_MAP[ord.status]?.label || ord.status;
      const formattedDate = new Date(ord.created_at).toLocaleString('uz-UZ');

      return [
        idx + 1,
        `"${ord.order_number}"`,
        `"${formattedDate}"`,
        `"Stol №${ord.table_number}"`,
        `"${itemsStr.replace(/"/g, '""')}"`,
        ord.total_amount,
        `"${statusLabel}"`,
        `"${ord.waiter_name || 'Mas\'ul xodim'}"`,
      ].join(separator);
    });

    const metaInfo = [
      `"${restaurantName || 'Zafaran Grand'}" — ${restaurantBranch || 'Toshkent'}`,
      `"Davr: ${periodName}"`,
      `"Eksport qilingan vaqt: ${new Date().toLocaleString('uz-UZ')}"`,
      `"Jami tushum: ${formatUZS(totalRev)}"`,
      `"Buyurtmalar soni: ${count} ta chek"`,
      `"O'rtacha chek: ${formatUZS(avg)}"`,
      '',
    ].join('\n');

    const bom = '\uFEFF';
    const fileContent = bom + metaInfo + headers.join(separator) + '\n' + rows.join('\n');

    const mimeType = format === 'csv' ? 'text/csv;charset=utf-8;' : 'text/tab-separated-values;charset=utf-8;';
    const blob = new Blob([fileContent], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    addToast(
      'success',
      'Hisobot yuklab olindi',
      `${periodName} bo'yicha ${targetOrders.length} ta chek faylga saqlandi.`
    );
  };

  const handleExport = (format: 'csv' | 'tsv' | 'print') => {
    if (format === 'print') {
      window.print();
      return;
    }
    exportPeriodDirectly(period, format);
  };

  return (
    <div className="min-h-screen bg-[#FAF8F3] text-[#202622] flex">
      <AdminSidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <AdminHeader />

        <main className="flex-1 p-6 lg:p-8 space-y-6 max-w-7xl w-full mx-auto">
          {/* Page Slogan Header */}
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-gradient-to-r from-emerald-50/80 via-white to-amber-50/40 p-6 rounded-3xl border border-[#E5E0D8] shadow-xs">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-display font-bold text-2xl text-[#173F35] tracking-tight">
                  Moliya & Savdo Hisobotlarini Yuklab Olish Markazi
                </h1>
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-1.5">
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Excel & CSV Eksport</span>
                </span>
              </div>
              <p className="text-xs text-[#737A75] mt-1">
                Kunlik, haftalik, 10-kunlik dekada va oylik tushum hamda buyurtmalar hisobotini real ma'lumotlar bilan ko'rib chiqing va yuklab oling.
              </p>
            </div>

            {/* Quick Export Actions */}
            <div className="flex items-center gap-2.5 flex-wrap">
              <button
                onClick={() => handleExport('csv')}
                className="px-4 py-2.5 rounded-xl bg-[#173F35] hover:bg-[#235B4E] active:scale-95 text-white font-bold text-xs flex items-center gap-2 shadow-sm transition-all"
                title="Excel uchun moslashtirilgan CSV formatida yuklab olish"
              >
                <ArrowDownToLine className="w-4 h-4 text-emerald-300" />
                <span>Tanlangan Davrni Yuklab Olish (CSV)</span>
              </button>

              <button
                onClick={() => handleExport('tsv')}
                className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-[#173F35] border border-[#E5E0D8] font-bold text-xs flex items-center gap-2 shadow-xs transition-all"
                title="Tab ajratilgan jadval formatida yuklab olish"
              >
                <FileSpreadsheet className="w-4 h-4 text-[#737A75]" />
                <span>Excel / TSV</span>
              </button>

              <button
                onClick={() => handleExport('print')}
                className="p-2.5 rounded-xl bg-white hover:bg-slate-50 text-[#737A75] hover:text-[#202622] border border-[#E5E0D8] shadow-xs transition-all"
                title="Chop etish yoki PDF sifatida saqlash"
              >
                <Printer className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* 1-Click Fast Download Buttons Strip (Kunlik, Haftalik, O'nlik, Oylik) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <button
              onClick={() => exportPeriodDirectly('today')}
              className="p-4 rounded-2xl bg-white border border-[#E5E0D8] hover:border-emerald-600 hover:shadow-md transition-all text-left group flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold tracking-wider text-[#737A75]">
                  1-bosishda eksport
                </span>
                <Clock className="w-4 h-4 text-emerald-700 group-hover:scale-110 transition-transform" />
              </div>
              <div className="mt-2">
                <span className="font-display font-bold text-sm text-[#173F35] block">
                  Kunlik Hisobot (CSV)
                </span>
                <span className="text-[11px] text-[#737A75]">
                  Bugungi kun cheklari
                </span>
              </div>
              <span className="mt-2 text-[11px] font-bold text-emerald-700 flex items-center gap-1">
                <Download className="w-3.5 h-3.5" />
                <span>Yuklab olish</span>
              </span>
            </button>

            <button
              onClick={() => exportPeriodDirectly('week')}
              className="p-4 rounded-2xl bg-white border border-[#E5E0D8] hover:border-emerald-600 hover:shadow-md transition-all text-left group flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold tracking-wider text-[#737A75]">
                  Oxirgi 7 kun
                </span>
                <Calendar className="w-4 h-4 text-emerald-700 group-hover:scale-110 transition-transform" />
              </div>
              <div className="mt-2">
                <span className="font-display font-bold text-sm text-[#173F35] block">
                  Haftalik Hisobot (CSV)
                </span>
                <span className="text-[11px] text-[#737A75]">
                  7 kunlik aylanma
                </span>
              </div>
              <span className="mt-2 text-[11px] font-bold text-emerald-700 flex items-center gap-1">
                <Download className="w-3.5 h-3.5" />
                <span>Yuklab olish</span>
              </span>
            </button>

            <button
              onClick={() => exportPeriodDirectly('tendays')}
              className="p-4 rounded-2xl bg-gradient-to-br from-amber-50/60 to-white border border-amber-300 hover:border-amber-500 hover:shadow-md transition-all text-left group flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold tracking-wider text-amber-800">
                  10 kunlik Dekada
                </span>
                <Sparkles className="w-4 h-4 text-amber-500 group-hover:scale-110 transition-transform" />
              </div>
              <div className="mt-2">
                <span className="font-display font-bold text-sm text-[#173F35] block">
                  O'nlik Hisobot (CSV)
                </span>
                <span className="text-[11px] text-[#737A75]">
                  O'zbekiston hisob standarti
                </span>
              </div>
              <span className="mt-2 text-[11px] font-bold text-amber-800 flex items-center gap-1">
                <Download className="w-3.5 h-3.5" />
                <span>Yuklab olish</span>
              </span>
            </button>

            <button
              onClick={() => exportPeriodDirectly('month')}
              className="p-4 rounded-2xl bg-white border border-[#E5E0D8] hover:border-emerald-600 hover:shadow-md transition-all text-left group flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold tracking-wider text-[#737A75]">
                  Oxirgi 30 kun
                </span>
                <FileSpreadsheet className="w-4 h-4 text-emerald-700 group-hover:scale-110 transition-transform" />
              </div>
              <div className="mt-2">
                <span className="font-display font-bold text-sm text-[#173F35] block">
                  Oylik Hisobot (CSV)
                </span>
                <span className="text-[11px] text-[#737A75]">
                  30 kunlik jamlanma
                </span>
              </div>
              <span className="mt-2 text-[11px] font-bold text-emerald-700 flex items-center gap-1">
                <Download className="w-3.5 h-3.5" />
                <span>Yuklab olish</span>
              </span>
            </button>

            <button
              onClick={() => exportPeriodDirectly('all')}
              className="p-4 rounded-2xl bg-[#173F35] text-white hover:bg-[#235B4E] hover:shadow-md transition-all text-left group flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold tracking-wider text-amber-300">
                  To'liq Baza ({orders.length} ta chek)
                </span>
                <Layers className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
              </div>
              <div className="mt-2">
                <span className="font-display font-bold text-sm text-white block">
                  Barcha Cheklar (CSV)
                </span>
                <span className="text-[11px] text-white/70">
                  Hech qachon bo'sh chiqmaydi
                </span>
              </div>
              <span className="mt-2 text-[11px] font-bold text-amber-300 flex items-center gap-1">
                <Download className="w-3.5 h-3.5" />
                <span>Barchasini yuklash</span>
              </span>
            </button>
          </div>

          {/* Explanatory Notice: "Bo'sh nima bu uchun ekran och" -> Clear Guide on Empty Reports */}
          <div className="bg-gradient-to-r from-blue-50/80 via-white to-emerald-50/60 p-5 rounded-3xl border border-blue-200/80 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-800 flex items-center justify-center shrink-0 mt-0.5">
                <FileSpreadsheet className="w-5 h-5 text-blue-700" />
              </div>
              <div>
                <h3 className="font-display font-bold text-sm text-[#173F35]">
                  💡 "Hisobot bo'sh" nima degani va nega ma'lumot ko'rinmasligi mumkin?
                </h3>
                <p className="text-xs text-[#737A75] mt-0.5 leading-relaxed">
                  Agar jadvalda buyurtmalar chiqmasa, bu <strong>faqat tanlangan davrda</strong> (masalan, hali mijoz kelmagan soatlarda) yoki juda tor filtrda (masalan, alohida stol) cheklar yo'qligini bildiradi. Restorandagi barcha buyurtmalarni ko'rish uchun yuqoridagi <strong>"Haftalik"</strong>, <strong>"Oylik"</strong> yoki <strong>"Barcha Cheklar (CSV)"</strong> tugmasini bosing — barcha {orders.length} ta buyurtma to'liq yuklanadi!
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => {
                  setPeriod('month');
                  setStatusFilter('all');
                  setSearchTable('all');
                }}
                className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-[#E5E0D8] text-xs font-bold text-[#173F35] shadow-xs transition-colors whitespace-nowrap"
              >
                Oylik barcha cheklarni ko'rish
              </button>
            </div>
          </div>

          {/* Period Selector Tabs (Kunlik / Haftalik / O'nlik / Oylik) */}
          <div className="bg-white p-4 rounded-3xl border border-[#E5E0D8] shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 font-bold text-sm text-[#173F35]">
                <Calendar className="w-4 h-4 text-emerald-700" />
                <span>Hisobot davrini tanlang:</span>
              </div>

              {/* Period Tabs */}
              <div className="bg-[#FAF8F3] p-1 rounded-2xl border border-[#E5E0D8] flex items-center flex-wrap gap-1">
                <button
                  onClick={() => setPeriod('today')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    period === 'today' || period === 'hourly'
                      ? 'bg-[#173F35] text-white shadow-xs'
                      : 'text-[#737A75] hover:text-[#202622]'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>Kunlik (Bugun)</span>
                </button>

                <button
                  onClick={() => setPeriod('week')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    period === 'week'
                      ? 'bg-[#173F35] text-white shadow-xs'
                      : 'text-[#737A75] hover:text-[#202622]'
                  }`}
                >
                  <span>Haftalik (7 kun)</span>
                </button>

                <button
                  onClick={() => setPeriod('tendays')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    period === 'tendays'
                      ? 'bg-[#173F35] text-white shadow-xs'
                      : 'text-[#737A75] hover:text-[#202622]'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>O'nlik (10 kunlik Dekada)</span>
                </button>

                <button
                  onClick={() => setPeriod('month')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    period === 'month'
                      ? 'bg-[#173F35] text-white shadow-xs'
                      : 'text-[#737A75] hover:text-[#202622]'
                  }`}
                >
                  <span>Oylik (30 kun)</span>
                </button>
              </div>
            </div>

            {/* Quick Filter Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#FAF8F3] text-xs">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-[#737A75]">Filtr:</span>
                <button
                  onClick={() => setStatusFilter('all')}
                  className={`px-3 py-1 rounded-lg font-bold transition-colors ${
                    statusFilter === 'all'
                      ? 'bg-[#173F35] text-white'
                      : 'bg-[#FAF8F3] text-[#737A75] hover:text-[#202622]'
                  }`}
                >
                  Barcha cheklar ({rawPeriodOrders.length})
                </button>
                <button
                  onClick={() => setStatusFilter('delivered')}
                  className={`px-3 py-1 rounded-lg font-bold transition-colors ${
                    statusFilter === 'delivered'
                      ? 'bg-emerald-700 text-white'
                      : 'bg-[#FAF8F3] text-[#737A75] hover:text-[#202622]'
                  }`}
                >
                  Yetkazilgan & Yopilgan
                </button>
                <button
                  onClick={() => setStatusFilter('active')}
                  className={`px-3 py-1 rounded-lg font-bold transition-colors ${
                    statusFilter === 'active'
                      ? 'bg-amber-600 text-white'
                      : 'bg-[#FAF8F3] text-[#737A75] hover:text-[#202622]'
                  }`}
                >
                  Faol jarayondagi
                </button>
              </div>

              <div className="flex items-center gap-2">
                <span className="font-semibold text-[#737A75]">Stol bo'yicha:</span>
                <select
                  value={searchTable}
                  onChange={(e) => setSearchTable(e.target.value)}
                  className="bg-[#FAF8F3] border border-[#E5E0D8] rounded-xl px-3 py-1.5 text-xs font-semibold text-[#202622] focus:outline-none focus:border-[#173F35]"
                >
                  <option value="all">Barcha stollar (25 ta)</option>
                  {tables.map((t) => (
                    <option key={t.id} value={t.table_number.toString()}>
                      Stol №{t.table_number} ({t.label || t.zone})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* 4 KPI Summary Cards for Exported Period */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-[#E5E0D8] shadow-xs flex flex-col justify-between">
              <span className="text-[11px] font-bold text-[#737A75] uppercase tracking-wider">
                Davriy jami tushum
              </span>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="font-display font-bold text-2xl text-[#173F35] tabular-nums">
                  {formatUZS(stats.totalRev)}
                </span>
              </div>
              <div className="mt-3 pt-2 border-t border-[#FAF8F3] text-xs text-emerald-700 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{getPeriodTitle(period)}</span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-[#E5E0D8] shadow-xs flex flex-col justify-between">
              <span className="text-[11px] font-bold text-[#737A75] uppercase tracking-wider">
                Jami cheklar soni
              </span>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="font-display font-bold text-2xl text-[#173F35]">
                  {stats.count}
                </span>
                <span className="text-xs text-[#737A75]">ta buyurtma</span>
              </div>
              <div className="mt-3 pt-2 border-t border-[#FAF8F3] text-xs text-[#737A75]">
                Eksport jadvalida to'liq aks etgan
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-[#E5E0D8] shadow-xs flex flex-col justify-between">
              <span className="text-[11px] font-bold text-[#737A75] uppercase tracking-wider">
                O'rtacha chek qiymati
              </span>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="font-display font-bold text-2xl text-[#173F35] tabular-nums">
                  {formatUZS(stats.avg)}
                </span>
              </div>
              <div className="mt-3 pt-2 border-t border-[#FAF8F3] text-xs text-[#737A75]">
                Bitta buyurtma bo'yicha
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-[#E5E0D8] shadow-xs flex flex-col justify-between">
              <span className="text-[11px] font-bold text-[#737A75] uppercase tracking-wider">
                Sotilgan taomlar
              </span>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="font-display font-bold text-2xl text-[#173F35]">
                  {stats.totalItems}
                </span>
                <span className="text-xs text-[#737A75]">porsiya / dona</span>
              </div>
              <div className="mt-3 pt-2 border-t border-[#FAF8F3] text-xs text-emerald-700 font-semibold">
                Oshxona unumdorligi
              </div>
            </div>
          </div>

          {/* Full Interactive Report Preview Table */}
          <div className="bg-white rounded-3xl border border-[#E5E0D8] shadow-xs overflow-hidden">
            <div className="p-5 border-b border-[#E5E0D8] flex items-center justify-between flex-wrap gap-3">
              <div>
                <h3 className="font-display font-bold text-base text-[#173F35] flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-emerald-700" />
                  <span>Hisobot Jadvali Ko'rinishi ({filteredOrders.length} ta yozuv)</span>
                </h3>
                <p className="text-xs text-[#737A75] mt-0.5">
                  Fayl yuklab olinganda aynan ushbu satrlar va ustunlar saqlanadi
                </p>
              </div>

              <div className="text-xs font-semibold text-[#173F35] bg-[#FAF8F3] px-3 py-1.5 rounded-xl border border-[#E5E0D8]">
                Filtr natijasi: {formatUZS(stats.totalRev)}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#FAF8F3] text-[#737A75] font-bold uppercase text-[10px] tracking-wider border-b border-[#E5E0D8]">
                    <th className="py-3 px-4">№</th>
                    <th className="py-3 px-4">Chek Raqami</th>
                    <th className="py-3 px-4">Vaqti</th>
                    <th className="py-3 px-4">Stol</th>
                    <th className="py-3 px-4">Buyurtma qilingan taomlar</th>
                    <th className="py-3 px-4 text-right">Summasi</th>
                    <th className="py-3 px-4 text-center">Holati</th>
                    <th className="py-3 px-4">Ofitsiant</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#FAF8F3]">
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-[#737A75]">
                        Tanlangan davr va filtrlar bo'yicha buyurtmalar topilmadi.
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map((ord, idx) => {
                      const statusBadge = ORDER_STATUS_MAP[ord.status] || {
                        label: ord.status,
                        badgeColor: 'bg-slate-100 text-slate-700',
                      };
                      return (
                        <tr key={ord.id} className="hover:bg-[#FAF8F3]/60 transition-colors">
                          <td className="py-3 px-4 font-mono text-[#737A75]">{idx + 1}</td>
                          <td className="py-3 px-4 font-mono font-bold text-[#173F35]">
                            {ord.order_number}
                          </td>
                          <td className="py-3 px-4 text-[#737A75] whitespace-nowrap">
                            {formatShortTime(ord.created_at)}
                            <span className="text-[10px] block opacity-70">
                              {new Date(ord.created_at).toLocaleDateString('uz-UZ')}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-bold text-[#173F35] bg-[#E8F0EC] px-2 py-0.5 rounded-md text-[11px]">
                              №{ord.table_number}
                            </span>
                          </td>
                          <td className="py-3 px-4 max-w-xs">
                            <div className="flex flex-wrap gap-1">
                              {(ord.items || []).map((it, i) => (
                                <span
                                  key={i}
                                  className="bg-white border border-[#E5E0D8] text-[#202622] px-2 py-0.5 rounded text-[11px]"
                                >
                                  {it.item_name} <strong className="text-[#173F35]">x{it.quantity}</strong>
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-right font-display font-bold text-[#173F35] tabular-nums whitespace-nowrap">
                            {formatUZS(ord.total_amount)}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${statusBadge.badgeBg || 'bg-slate-100 text-slate-700'}`}
                            >
                              {statusBadge.label}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-[#737A75] font-medium whitespace-nowrap">
                            {ord.waiter_name || 'Mas\'ul xodim'}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
                <tfoot>
                  <tr className="bg-[#FAF8F3] font-bold text-[#173F35] border-t-2 border-[#E5E0D8]">
                    <td colSpan={5} className="py-3.5 px-4 text-right uppercase text-[11px]">
                      Jami Jamlanma:
                    </td>
                    <td className="py-3.5 px-4 text-right font-display text-base tabular-nums text-emerald-800">
                      {formatUZS(stats.totalRev)}
                    </td>
                    <td colSpan={2} className="py-3.5 px-4 text-xs text-[#737A75]">
                      ({stats.count} ta chek)
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};
