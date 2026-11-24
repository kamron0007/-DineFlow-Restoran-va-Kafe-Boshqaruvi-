import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { AdminSidebar } from '../../components/AdminSidebar';
import { AdminHeader } from '../../components/AdminHeader';
import { RestaurantTable, TableZone, TableStatus } from '../../types';
import { formatUZS } from '../../utils/formatters';
import {
  Download,
  Plus,
  QrCode,
  Printer,
  Copy,
  Check,
  CheckCircle2,
  Receipt,
  MapPin,
  Users,
  UtensilsCrossed,
  Wifi,
  X,
  Store,
  Layers,
  ExternalLink,
} from 'lucide-react';
import { dataService } from '../../services/storage';
import { RealQrCode } from '../../components/RealQrCode';
import QRCode from 'qrcode';

export const TableManagementPage: React.FC = () => {
  const {
    tables,
    orders,
    serviceCalls,
    waiters,
    refreshData,
    addToast,
    resolveServiceCall,
    settleAndFreeTable,
    restaurantName,
  } = useApp();
  const [selectedZone, setSelectedZone] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedTableId, setSelectedTableId] = useState<string>(tables[0]?.id || 'table-12');
  const [copied, setCopied] = useState(false);

  // QR Base URL resolution (auto-detect Wi-Fi LAN IP on localhost, or allow custom public URL)
  const QR_BASE_URL_KEY = 'dineflow_qr_base_url_v1';
  const [customQrBaseUrl, setCustomQrBaseUrl] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(QR_BASE_URL_KEY) || '';
    }
    return '';
  });
  const [detectedLanUrl, setDetectedLanUrl] = useState<string | null>(null);
  const [editingQrUrl, setEditingQrUrl] = useState(false);
  const [qrUrlInput, setQrUrlInput] = useState('');

  useEffect(() => {
    fetch('/api/network-info')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.lanUrl) {
          setDetectedLanUrl(data.lanUrl);
        }
      })
      .catch(() => {});
  }, []);

  const isLocalhostOrigin =
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

  const isPrivateDevPreview =
    typeof window !== 'undefined' && window.location.hostname.startsWith('ais-dev-');

  const effectiveQrBaseUrl = useMemo(() => {
    const trimmed = customQrBaseUrl.trim().replace(/\/+$/, '');
    if (trimmed) return trimmed;
    if (isLocalhostOrigin && detectedLanUrl) return detectedLanUrl;
    if (typeof window !== 'undefined') return window.location.origin;
    return '';
  }, [customQrBaseUrl, isLocalhostOrigin, detectedLanUrl]);

  const isPublicHttpsQr = useMemo(() => {
    return (
      effectiveQrBaseUrl.startsWith('https://') &&
      !effectiveQrBaseUrl.includes('localhost') &&
      !effectiveQrBaseUrl.includes('127.0.0.1') &&
      !effectiveQrBaseUrl.includes('ais-dev-')
    );
  }, [effectiveQrBaseUrl]);

  // Short clean QR URL (/t/1) -> fewer QR dots -> scans 2x faster on any smartphone camera
  const getTableQrUrl = (table: RestaurantTable) => {
    return `${effectiveQrBaseUrl}/t/${table.table_number}`;
  };

  const handleSaveQrBaseUrl = () => {
    let cleaned = qrUrlInput.trim().replace(/\/+$/, '');
    if (cleaned && !/^https?:\/\//i.test(cleaned)) {
      cleaned = `https://${cleaned}`;
    }
    setCustomQrBaseUrl(cleaned);
    if (cleaned) {
      localStorage.setItem(QR_BASE_URL_KEY, cleaned);
      addToast('success', 'Ochiq QR manzili saqlandi', `Barcha stol QR kodlari ${cleaned} manziliga ulandi.`);
    } else {
      localStorage.removeItem(QR_BASE_URL_KEY);
      addToast('info', 'Avtomatik manzil', 'QR kodlar avtomatik tarmoq manziliga qaytarildi.');
    }
    setEditingQrUrl(false);
  };

  // New table modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTableNumber, setNewTableNumber] = useState<number>(tables.length + 1);
  const [newTableZone, setNewTableZone] = useState<TableZone>('main');
  const [newTableSeats, setNewTableSeats] = useState<number>(4);
  const [newTableWaiter, setNewTableWaiter] = useState<string>('Dilshod Karimiy');

  // Currently inspected table
  const inspectedTable = useMemo(() => {
    return tables.find((t) => t.id === selectedTableId) || tables[0] || null;
  }, [tables, selectedTableId]);

  // Active order on inspected table
  const inspectedOrder = useMemo(() => {
    if (!inspectedTable) return null;
    return (
      orders.find(
        (o) =>
          o.table_number === inspectedTable.table_number &&
          o.status !== 'delivered' &&
          o.status !== 'cancelled'
      ) || null
    );
  }, [inspectedTable, orders]);

  // Zone & Tier filters
  const filteredTables = useMemo(() => {
    return tables.filter((table) => {
      let matchZone = true;
      const isVip = table.zone === 'vip' || table.tier === 'vip';
      const isBiznes = table.zone === 'biznes' || table.zone === 'business' || table.zone === 'terrace' || table.tier === 'biznes';
      const isOddiy = table.zone === 'oddiy' || table.zone === 'standard' || table.zone === 'main' || table.tier === 'oddiy' || (!isVip && !isBiznes);

      if (selectedZone === 'oddiy' || selectedZone === 'standard') {
        matchZone = isOddiy;
      } else if (selectedZone === 'biznes' || selectedZone === 'business') {
        matchZone = isBiznes;
      } else if (selectedZone === 'vip') {
        matchZone = isVip;
      }

      const activeOrder = orders.find(
        (o) =>
          o.table_number === table.table_number &&
          o.status !== 'delivered' &&
          o.status !== 'cancelled'
      );
      const isBill = activeOrder?.bill_requested || serviceCalls.some((c) => c.table_number === table.table_number && c.status === 'pending' && c.type === 'bill');
      const isBusy = !!activeOrder;
      const isService = serviceCalls.some(
        (c) => c.table_number === table.table_number && c.status === 'pending' && c.type !== 'bill'
      );

      let matchStatus = true;
      if (selectedStatus === 'busy') matchStatus = isBusy && !isBill;
      if (selectedStatus === 'free') matchStatus = !isBusy;
      if (selectedStatus === 'service') matchStatus = isService;
      if (selectedStatus === 'bill') matchStatus = !!isBill;

      return matchZone && matchStatus;
    });
  }, [tables, selectedZone, selectedStatus, orders, serviceCalls]);

  const handleCopyUrl = () => {
    if (!inspectedTable) return;
    const url = getTableQrUrl(inspectedTable);
    navigator.clipboard.writeText(url);
    setCopied(true);
    addToast('success', 'Nusxalandi', `Stol №${inspectedTable.table_number} QR havolasi nusxalandi.`);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCreateTable = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const table: RestaurantTable = {
        id: 'table-' + Date.now(),
        table_number: Number(newTableNumber),
        label: newTableZone === 'vip' ? `VIP №${newTableNumber}` : `Stol №${newTableNumber}`,
        zone: newTableZone,
        seats: Number(newTableSeats),
        qr_token: `qr-${newTableNumber}-${Math.random().toString(36).substring(2, 7)}`,
        is_active: true,
        assigned_waiter_name: newTableWaiter,
        created_at: new Date().toISOString(),
      };
      await dataService.saveTable(table);
      await refreshData();
      setSelectedTableId(table.id);
      setShowAddModal(false);
      addToast('success', 'Stol yaratildi', `${table.label} muvaffaqiyatli qo'shildi.`);
    } catch {
      addToast('error', 'Xatolik', 'Stol yaratishda xatolik yuz berdi');
    }
  };

  const handlePrintCard = () => {
    window.print();
  };

  const handleDownloadQr = async () => {
    if (!inspectedTable) return;
    try {
      const qrUrl = getTableQrUrl(inspectedTable);
      const qrDataUrl = await QRCode.toDataURL(qrUrl, {
        width: 500,
        margin: 2,
        color: { dark: '#173F35', light: '#FFFFFF' },
        errorCorrectionLevel: 'H',
      });

      const canvas = document.createElement('canvas');
      canvas.width = 600;
      canvas.height = 780;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.fillStyle = '#FAF8F3';
      ctx.fillRect(0, 0, 600, 780);

      ctx.fillStyle = '#173F35';
      ctx.fillRect(0, 0, 600, 110);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 28px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(restaurantName || 'Zafaran Grand', 300, 52);

      ctx.fillStyle = '#F59E0B';
      ctx.font = 'bold 16px sans-serif';
      ctx.fillText('DINEFLOW RAQAMLI QR MENYU', 300, 84);

      ctx.fillStyle = '#173F35';
      ctx.font = 'bold 40px sans-serif';
      ctx.fillText(`STOL № ${inspectedTable.table_number}`, 300, 175);

      const zoneName =
        inspectedTable.zone === 'vip' || inspectedTable.tier === 'vip'
          ? 'VIP Xona'
          : inspectedTable.zone === 'terrace' || inspectedTable.tier === 'biznes'
          ? 'Biznes / Veranda'
          : 'Asosiy Zal';
      ctx.fillStyle = '#5C6460';
      ctx.font = '18px sans-serif';
      ctx.fillText(`${zoneName} · ${inspectedTable.seats} kishilik`, 300, 208);

      const img = new Image();
      img.onload = () => {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(110, 235, 380, 380);
        ctx.strokeStyle = '#E5E0D8';
        ctx.lineWidth = 3;
        ctx.strokeRect(110, 235, 380, 380);
        ctx.drawImage(img, 130, 255, 340, 340);

        ctx.fillStyle = '#173F35';
        ctx.font = 'bold 20px sans-serif';
        ctx.fillText('Smartfon kamerasini QR-kodga tuting', 300, 665);

        ctx.fillStyle = '#737A75';
        ctx.font = '15px monospace';
        ctx.fillText(qrUrl, 300, 705);

        const link = document.createElement('a');
        link.download = `dineflow-stol-${inspectedTable.table_number}-qr.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();

        addToast(
          'success',
          'QR kod yuklab olindi',
          `Stol №${inspectedTable.table_number} uchun haqiqiy skanerlanadigan PNG QR-karta yuklandi.`
        );
      };
      img.src = qrDataUrl;
    } catch {
      addToast('error', 'Xatolik', 'QR kodni yuklab olishda xatolik yuz berdi');
    }
  };

  const handleBulkDownload = () => {
    handleDownloadQr();
  };

  return (
    <div className="min-h-screen bg-[#FAF8F3] text-[#202622] flex">
      <AdminSidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <AdminHeader />

        <main className="flex-1 p-6 lg:p-8 space-y-6 max-w-7xl w-full mx-auto">
          {/* Top Header */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-[#737A75] uppercase tracking-wider mb-1">
                <span>Zal boshqaruvi & Raqamlashtirish</span>
                <span>·</span>
                <span className="text-emerald-700">Jonli sinxronizatsiya</span>
              </div>
              <h1 className="font-display font-bold text-2xl text-[#173F35] tracking-tight">
                Stollar va QR Kodlar boshqaruvi
              </h1>
              <p className="text-xs text-[#737A75] mt-0.5">
                Zal xaritasi, real vaqt rejimidagi stollar holati va shaxsiy QR menyu generatori
              </p>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <button
                onClick={handleBulkDownload}
                className="bg-white hover:bg-slate-50 text-[#173F35] px-4 py-2.5 rounded-xl border border-[#E5E0D8] text-xs font-semibold flex items-center gap-2 shadow-xs transition-all active:scale-95"
              >
                <Download className="w-4 h-4 text-[#173F35]" />
                <span>QR to'plamini yuklash (ZIP/PDF)</span>
              </button>

              <button
                onClick={() => setShowAddModal(true)}
                className="bg-[#173F35] hover:bg-[#235B4E] text-white px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-sm transition-all active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Yangi stol qo'shish</span>
              </button>
            </div>
          </div>

          {/* Zone & Status Filter Strips */}
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-[#E5E0D8] shadow-xs">
            {/* Zones: Oddiy (14), Biznes (6), VIP (5) */}
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
              {[
                { id: 'all', label: `Barchasi (${tables.length})` },
                {
                  id: 'oddiy',
                  label: `Oddiy (${tables.filter((t) => t.tier === 'oddiy' || t.zone === 'oddiy' || t.zone === 'standard' || t.zone === 'main').length})`,
                },
                {
                  id: 'biznes',
                  label: `Biznes (${tables.filter((t) => t.tier === 'biznes' || t.zone === 'biznes' || t.zone === 'business' || t.zone === 'terrace').length})`,
                },
                {
                  id: 'vip',
                  label: `VIP (${tables.filter((t) => t.tier === 'vip' || t.zone === 'vip').length})`,
                },
              ].map((z) => (
                <button
                  key={z.id}
                  onClick={() => setSelectedZone(z.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                    selectedZone === z.id
                      ? 'bg-[#173F35] text-white shadow-xs'
                      : 'text-[#737A75] hover:bg-[#FAF8F3] hover:text-[#202622]'
                  }`}
                >
                  {z.label}
                </button>
              ))}
            </div>

            {/* Status Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              {[
                { id: 'all', label: `Barchasi (${tables.length})` },
                {
                  id: 'free',
                  label: `Bo'sh (${tables.filter((t) => !orders.some((o) => o.table_number === t.table_number && o.status !== 'delivered' && o.status !== 'cancelled')).length})`,
                },
                {
                  id: 'busy',
                  label: `Band (${tables.filter((t) => orders.some((o) => o.table_number === t.table_number && o.status !== 'delivered' && o.status !== 'cancelled' && !o.bill_requested)).length})`,
                },
                {
                  id: 'bill',
                  label: `Chek berilgan (${tables.filter((t) => orders.some((o) => o.table_number === t.table_number && o.bill_requested && o.status !== 'delivered' && o.status !== 'cancelled') || serviceCalls.some((c) => c.table_number === t.table_number && c.status === 'pending' && c.type === 'bill')).length})`,
                },
                {
                  id: 'service',
                  label: `Chaqiruv (${tables.filter((t) => serviceCalls.some((c) => c.table_number === t.table_number && c.status === 'pending' && c.type !== 'bill')).length})`,
                },
              ].map((st) => (
                <button
                  key={st.id}
                  onClick={() => setSelectedStatus(st.id)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-all border whitespace-nowrap ${
                    selectedStatus === st.id
                      ? 'bg-[#173F35] text-white border-[#173F35] shadow-xs'
                      : 'bg-white text-[#737A75] border-[#E5E0D8] hover:border-[#173F35]'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>
          </div>

          {/* Main Work Area: Table Grid (8 cols) + QR Inspector (4 cols) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Table Cards Grid (8 cols) */}
            <div className="lg:col-span-7 xl:col-span-8 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3.5">
                {filteredTables.map((tbl) => {
                  const isSelected = tbl.id === selectedTableId;
                  const activeOrder = orders.find(
                    (o) =>
                      o.table_number === tbl.table_number &&
                      o.status !== 'delivered' &&
                      o.status !== 'cancelled'
                  );
                  const isBusy = !!activeOrder;
                  const serviceCall = serviceCalls.find(
                    (c) => c.table_number === tbl.table_number && c.status === 'pending'
                  );
                  const isBill = activeOrder?.bill_requested || serviceCall?.type === 'bill';
                  const isService = !!serviceCall && serviceCall.type !== 'bill';

                  return (
                    <div
                      key={tbl.id}
                      onClick={() => setSelectedTableId(tbl.id)}
                      className={`relative bg-white rounded-2xl p-4 border transition-all cursor-pointer shadow-xs hover:shadow-md flex flex-col justify-between ${
                        isSelected
                          ? 'border-[#173F35] ring-2 ring-[#173F35]/20'
                          : isBill
                          ? 'border-amber-400 bg-amber-50/20 ring-1 ring-amber-300'
                          : isBusy
                          ? 'border-blue-200'
                          : 'border-[#E5E0D8]'
                      }`}
                    >
                      {/* Urgent Call Badge */}
                      {isService && (
                        <div className="absolute -top-2.5 -right-1 z-10">
                          <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500 text-slate-950 text-[10px] font-bold shadow-md animate-bounce">
                            Chaqiruv!
                          </span>
                        </div>
                      )}

                      {/* Chek olingan / To'lov kutilmoqda Top Ribbon */}
                      {isBill && (
                        <div className="absolute -top-2.5 left-3 z-10">
                          <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500 text-slate-950 text-[10px] font-extrabold shadow-md">
                            <Receipt className="w-3 h-3" />
                            <span>Chek berilgan</span>
                          </span>
                        </div>
                      )}

                      <div>
                        {/* Table Header */}
                        <div className="flex items-start justify-between pb-3 border-b border-[#FAF8F3]">
                          <div className="flex items-center gap-2.5">
                            <div
                              className={`w-11 h-11 rounded-xl flex flex-col items-center justify-center font-bold text-white shadow-xs ${
                                isBill
                                  ? 'bg-amber-600'
                                  : isBusy
                                  ? 'bg-blue-800'
                                  : 'bg-[#173F35]'
                              }`}
                            >
                              <span className="text-[9px] uppercase tracking-wider opacity-70">
                                Stol
                              </span>
                              <span className="font-display text-base leading-none">
                                {tbl.table_number}
                              </span>
                            </div>
                            <div>
                              <h3 className="font-display font-bold text-sm text-[#202622]">
                                {tbl.label || `Stol №${tbl.table_number}`}
                              </h3>
                              <span className="text-[11px] text-[#737A75] flex items-center gap-1">
                                <Users className="w-3 h-3" />
                                <span>
                                  {tbl.seats} kishilik ·{' '}
                                  {tbl.tier === 'vip' || tbl.zone === 'vip' ? (
                                    <span className="font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded text-[10px]">
                                      ★ VIP
                                    </span>
                                  ) : tbl.tier === 'biznes' || tbl.zone === 'biznes' || tbl.zone === 'business' ? (
                                    <span className="font-bold text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded text-[10px]">
                                      Biznes
                                    </span>
                                  ) : (
                                    <span className="font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded text-[10px]">
                                      Oddiy
                                    </span>
                                  )}
                                </span>
                              </span>
                            </div>
                          </div>

                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                              isBill
                                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                : isService
                                ? 'bg-orange-100 text-orange-900'
                                : isBusy
                                ? 'bg-blue-100 text-blue-900'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {isBill ? (
                              <>
                                <Receipt className="w-3 h-3 text-amber-700" />
                                <span>Chek olingan</span>
                              </>
                            ) : isService ? (
                              <span>Xizmat kerak</span>
                            ) : isBusy ? (
                              <>
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
                                <span>Band</span>
                              </>
                            ) : (
                              <>
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                <span>Bo'sh / Toza</span>
                              </>
                            )}
                          </span>
                        </div>

                        {/* Order snippet */}
                        <div className="my-3 p-2.5 rounded-xl bg-[#FAF8F3] border border-[#E5E0D8]/60 text-xs space-y-1">
                          {isBusy ? (
                            <>
                              <div className="flex justify-between text-[#737A75]">
                                <span>Buyurtma:</span>
                                <span className="font-mono font-bold text-[#173F35]">
                                  {activeOrder.order_number}
                                </span>
                              </div>
                              <div className="flex justify-between font-bold">
                                <span>Jami hisob:</span>
                                <span className="font-display text-[#173F35] tabular-nums">
                                  {formatUZS(activeOrder.total_amount)}
                                </span>
                              </div>
                              <div className="flex justify-between text-[11px] text-[#737A75] pt-1 border-t border-[#E5E0D8]/60">
                                <span>Xodim: {tbl.assigned_waiter_name || 'Mas\'ul'}</span>
                                {isBill && (
                                  <span className="text-amber-800 font-bold">
                                    To'lov kutilmoqda
                                  </span>
                                )}
                              </div>
                            </>
                          ) : (
                            <div className="py-2 text-center text-[#737A75] text-[11px] flex items-center justify-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-emerald-500" />
                              <span>Stol toza va mehmon qabuliga tayyor</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Card Bottom Actions */}
                      <div className="pt-2 flex items-center justify-between gap-2 border-t border-[#FAF8F3]">
                        {isBusy ? (
                          <div className="flex items-center gap-1.5 flex-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                settleAndFreeTable(tbl.table_number);
                              }}
                              className={`flex-1 py-1.5 px-2.5 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1 ${
                                isBill
                                  ? 'bg-[#173F35] hover:bg-[#235B4E] text-white active:scale-95'
                                  : 'bg-emerald-600 hover:bg-emerald-700 text-white active:scale-95'
                              }`}
                              title="Mijoz chekni oldi va to'lov qildi. Stolni bo'shatish."
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                              <span>{isBill ? "To'lov olindi & Bo'shatish" : "Chek & Bo'shatish"}</span>
                            </button>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedTableId(tbl.id);
                              }}
                              className="p-1.5 rounded-xl bg-[#FAF8F3] hover:bg-[#E8F0EC] text-[#173F35] border border-[#E5E0D8]"
                              title="QR ko'rish"
                            >
                              <QrCode className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : isService ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              resolveServiceCall(serviceCall.id);
                            }}
                            className="flex-1 py-1.5 px-2 bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold text-xs rounded-xl transition-colors"
                          >
                            Xizmatga javob berish
                          </button>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedTableId(tbl.id);
                            }}
                            className="flex-1 py-1.5 px-2 bg-[#FAF8F3] hover:bg-[#E8F0EC] text-[#173F35] font-semibold text-xs rounded-xl transition-colors text-center border border-[#E5E0D8] flex items-center justify-center gap-1.5"
                          >
                            <QrCode className="w-3.5 h-3.5" />
                            <span>QR & Stol ma'lumoti</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Interactive Floor Mini-Map */}
              <div className="bg-white p-5 rounded-3xl border border-[#E5E0D8] shadow-xs">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-[#173F35]" />
                    <h3 className="font-display font-bold text-sm text-[#202622]">
                      Interaktiv zal sxemasi
                    </h3>
                  </div>
                  <span className="text-xs text-[#737A75]">
                    Zonalar: Asosiy zal, Veranda, Oshxona darchasi
                  </span>
                </div>

                <div className="relative w-full h-44 bg-[#FAF8F3] rounded-2xl p-4 flex flex-col justify-between border border-[#E5E0D8] overflow-hidden">
                  <div className="flex items-center justify-between text-xs text-[#737A75] z-10">
                    <span className="bg-white px-2.5 py-1 rounded-lg border border-[#E5E0D8]">
                      Oshxona / KDS Tarqatish
                    </span>
                    <span className="bg-white px-2.5 py-1 rounded-lg border border-[#E5E0D8]">
                      Yozgi Verandaga chiqish
                    </span>
                  </div>

                  {/* Stylized tables */}
                  <div className="flex items-center justify-around z-10">
                    {tables.slice(0, 5).map((t) => (
                      <button
                        key={t.id}
                        onClick={() => setSelectedTableId(t.id)}
                        className={`w-10 h-10 rounded-xl flex items-center justify-center font-display font-bold text-xs transition-transform hover:scale-110 shadow-xs ${
                          t.id === selectedTableId
                            ? 'bg-[#173F35] text-white ring-4 ring-[#173F35]/20 scale-105'
                            : 'bg-white border border-[#E5E0D8] text-[#202622]'
                        }`}
                      >
                        {t.table_number}
                      </button>
                    ))}
                  </div>

                  <div className="text-[11px] text-[#737A75] z-10 flex items-center justify-between">
                    <span>* Stol ustiga bosib QR kodini ko'ring</span>
                    <span className="text-emerald-700 font-semibold">Jonli rejim</span>
                  </div>
                </div>
              </div>
            </div>

            {/* QR Code Preview & Inspector Panel (5 cols / 4 cols) */}
            <div className="lg:col-span-5 xl:col-span-4 sticky top-20">
              {inspectedTable && (
                <div className="bg-white rounded-3xl p-6 border border-[#E5E0D8] shadow-sm space-y-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-1.5 text-xs text-[#737A75]">
                        <span className="bg-[#E8F0EC] text-[#173F35] font-bold px-2 py-0.5 rounded-full">
                          Individual QR
                        </span>
                        <span>A6 formati</span>
                      </div>
                      <h2 className="font-display font-bold text-xl text-[#202622] mt-1">
                        {inspectedTable.label || `Stol №${inspectedTable.table_number}`}
                      </h2>
                      <span className="text-xs text-[#737A75]">
                        {inspectedTable.zone === 'main'
                          ? 'Asosiy zal'
                          : inspectedTable.zone === 'terrace'
                          ? 'Veranda'
                          : 'VIP xona'}{' '}
                        · {inspectedTable.seats} kishilik sig'im
                      </span>
                    </div>

                    <div className="w-10 h-10 rounded-xl bg-[#FAF8F3] text-[#173F35] flex items-center justify-center border border-[#E5E0D8]">
                      <QrCode className="w-5 h-5" />
                    </div>
                  </div>

                  {/* Printable QR Card Graphic Mockup */}
                  <div
                    id="printable-qr-card"
                    className="bg-[#FAF8F3] rounded-2xl p-6 border border-[#E5E0D8] flex flex-col items-center text-center shadow-inner relative"
                  >
                    <div className="w-full flex items-center justify-between mb-3 text-xs text-[#737A75]">
                      <div className="flex items-center gap-1 font-bold text-[#173F35]">
                        <UtensilsCrossed className="w-4 h-4 text-amber-500" />
                        <span>{restaurantName || 'Zafaran Grand'}</span>
                      </div>
                      <span className="text-[10px] uppercase tracking-wider">DineFlow QR</span>
                    </div>

                    <h3 className="font-display font-bold text-base text-[#202622] mb-0.5">
                      Menyuni skanerlang
                    </h3>
                    <p className="text-[11px] text-[#737A75] mb-4 max-w-[200px]">
                      Smartfon kamerangizni yo'naltiring va buyurtma bering
                    </p>

                    {/* Real High-Contrast Scannable QR Code with Logo Badge */}
                    <div className="relative p-3 bg-white rounded-2xl shadow-md border border-[#E5E0D8]">
                      <RealQrCode
                        value={getTableQrUrl(inspectedTable)}
                        size={176}
                      />
                      {/* Center Brand Icon */}
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-9 h-9 rounded-xl bg-white shadow-md border border-[#E5E0D8] flex items-center justify-center text-[#173F35]">
                          <UtensilsCrossed className="w-4 h-4 text-amber-500" />
                        </div>
                      </div>
                    </div>

                    <div className="mt-3">
                      <span className="font-display font-bold text-sm tracking-wider px-3 py-1 rounded-full bg-[#173F35] text-white">
                        STOL № {inspectedTable.table_number}
                      </span>
                      <div className="text-[11px] text-[#737A75] mt-1 flex items-center justify-center gap-1">
                        <Wifi className="w-3 h-3 text-emerald-600" />
                        <span>Wi-Fi: rayhon2025</span>
                      </div>
                    </div>

                    {/* Direct Real QR URL Box */}
                    <div className="mt-3 w-full py-1.5 px-3 bg-white rounded-xl border border-[#E5E0D8] flex items-center justify-between text-xs">
                      <span
                        className="text-[#737A75] truncate mr-2 select-all font-mono text-[11px]"
                        title={getTableQrUrl(inspectedTable)}
                      >
                        {effectiveQrBaseUrl.replace(/^https?:\/\//, '')}/t/{inspectedTable.table_number}
                      </span>
                      <button
                        onClick={handleCopyUrl}
                        className="text-[#173F35] hover:text-[#235B4E] p-1 rounded shrink-0"
                        title="Nusxalash"
                      >
                        {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>

                    {/* QR Public Domain Configurator (Anti-Localhost & Private Dev Guard) */}
                    <div className="mt-2.5 w-full text-left print:hidden">
                      {editingQrUrl ? (
                        <div className="p-3 bg-white rounded-xl border border-[#173F35]/30 space-y-2">
                          <label className="block text-[10px] font-bold text-[#173F35] uppercase tracking-wider">
                            Ochiq internet domeni (Publish URL)
                          </label>
                          <input
                            type="text"
                            value={qrUrlInput}
                            onChange={(e) => setQrUrlInput(e.target.value)}
                            placeholder="https://sizning-saytingiz.run.app"
                            className="w-full px-2.5 py-2 rounded-lg border border-[#E5E0D8] text-xs font-mono text-[#202622] focus:outline-none focus:border-[#173F35]"
                          />
                          {detectedLanUrl && (
                            <button
                              type="button"
                              onClick={() => setQrUrlInput(detectedLanUrl)}
                              className="text-[11px] font-semibold text-emerald-700 hover:underline"
                            >
                              Lokal Wi-Fi IP ni qo'yish ({detectedLanUrl})
                            </button>
                          )}
                          <div className="flex items-center justify-end gap-1.5 pt-1">
                            <button
                              type="button"
                              onClick={() => setEditingQrUrl(false)}
                              className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold text-[#737A75] hover:bg-slate-100"
                            >
                              Bekor
                            </button>
                            <button
                              type="button"
                              onClick={handleSaveQrBaseUrl}
                              className="px-3 py-1.5 rounded-lg text-[11px] font-bold bg-[#173F35] text-white hover:bg-[#235B4E]"
                            >
                              Saqlash
                            </button>
                          </div>
                        </div>
                      ) : !isPublicHttpsQr ? (
                        <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-300/80 space-y-1.5">
                          <p className="text-[11px] text-amber-950 leading-snug">
                            {effectiveQrBaseUrl.includes('localhost') || effectiveQrBaseUrl.includes('127.0.0.1') ? (
                              <span>
                                <strong>Diqqat:</strong> localhost telefondan ochilmaydi. Ochiq (Publish) domenni kiriting.
                              </span>
                            ) : isPrivateDevPreview && !customQrBaseUrl ? (
                              <span>
                                <strong>Yopiq dev havola:</strong> Istalgan telefondan skanerlash uchun Publish qilingan ochiq domenni kiriting.
                              </span>
                            ) : (
                              <span>
                                <strong>Lokal Wi-Fi rejimi:</strong> Faqat bitta Wi-Fi da ishlaydi. Internet orqali ochish uchun ochiq domenni kiriting.
                              </span>
                            )}
                          </p>
                          <button
                            type="button"
                            onClick={() => {
                              setQrUrlInput(customQrBaseUrl || '');
                              setEditingQrUrl(true);
                            }}
                            className="w-full py-1.5 px-3 rounded-lg bg-[#173F35] hover:bg-[#235B4E] text-white text-[11px] font-bold transition-colors"
                          >
                            Ochiq domenni sozlash
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between gap-2 px-1">
                          <span className="text-[11px] text-emerald-700 font-semibold">
                            Ochiq internet domeni faol
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setQrUrlInput(customQrBaseUrl || effectiveQrBaseUrl);
                              setEditingQrUrl(true);
                            }}
                            className="text-[11px] font-bold text-[#173F35] hover:underline shrink-0"
                          >
                            O'zgartirish
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Table details & controls */}
                  <div className="space-y-2 text-xs">
                    {(() => {
                      const matchedWaiter = waiters.find((w) =>
                        w.assigned_tables?.includes(inspectedTable.table_number)
                      );
                      return (
                        <div className="py-2 border-b border-[#FAF8F3] space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[#737A75]">Mas'ul ofitsiant:</span>
                            <div className="flex items-center gap-1.5">
                              {matchedWaiter?.badge_id && (
                                <span className="font-mono text-[10px] font-bold bg-[#173F35] text-amber-300 px-1.5 py-0.5 rounded">
                                  {matchedWaiter.badge_id}
                                </span>
                              )}
                              <span className="font-semibold text-[#202622]">
                                {matchedWaiter?.full_name ||
                                  inspectedTable.assigned_waiter_name ||
                                  'Dilshod Karimiy'}
                              </span>
                            </div>
                          </div>
                          {matchedWaiter && (
                            <div className="flex items-center justify-between text-[10px] text-[#737A75] font-mono bg-[#FAF8F3] px-2 py-1 rounded-lg border border-[#E5E0D8]/60">
                              <span>Tel: {matchedWaiter.phone}</span>
                              {matchedWaiter.jshir && (
                                <span>JSHIR: {matchedWaiter.jshir}</span>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })()}

                    <div className="flex items-center justify-between py-1.5 border-b border-[#FAF8F3]">
                      <span className="text-[#737A75]">Buyurtma qabul qilish:</span>
                      <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                        Faol (Ochiq)
                      </span>
                    </div>

                    {inspectedOrder && (
                      <div className="p-3 rounded-2xl bg-gradient-to-r from-amber-50/90 to-emerald-50/90 border border-amber-200/90 space-y-2 mt-2">
                        <div className="flex items-center justify-between text-xs">
                          <div>
                            <span className="font-bold text-[#173F35] block">
                              Chek {inspectedOrder.order_number}
                            </span>
                            <span className="text-[11px] text-[#737A75]">
                              Summa: {formatUZS(inspectedOrder.total_amount)}
                            </span>
                          </div>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              inspectedOrder.bill_requested
                                ? 'bg-amber-500 text-slate-950 font-extrabold animate-pulse'
                                : 'bg-blue-100 text-blue-900'
                            }`}
                          >
                            {inspectedOrder.bill_requested ? 'Chek olingan' : 'Ovqatlanmoqda'}
                          </span>
                        </div>
                        <button
                          onClick={() => settleAndFreeTable(inspectedTable.table_number)}
                          className="w-full py-2 px-3 rounded-xl bg-[#173F35] hover:bg-[#235B4E] text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all active:scale-95"
                          title="To'lovni qabul qilish va stolni yangi mehmonlar uchun bo'shatish"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                          <span>To'lov olindi & Stolni bo'shatish</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="space-y-2 pt-2">
                    <button
                      onClick={handlePrintCard}
                      className="w-full py-3 px-4 rounded-xl bg-[#173F35] hover:bg-[#235B4E] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all"
                    >
                      <Printer className="w-4 h-4" />
                      <span>A6 Formatda Chop Etish</span>
                    </button>

                    <button
                      onClick={handleDownloadQr}
                      className="w-full py-2.5 px-4 rounded-xl bg-[#FAF8F3] hover:bg-[#E8F0EC] text-[#173F35] text-xs font-semibold flex items-center justify-center gap-2 border border-[#E5E0D8] transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      <span>PNG QR-kartani yuklab olish</span>
                    </button>

                    <a
                      href={`/t/${inspectedTable.table_number}`}
                      className="w-full py-2.5 px-4 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-bold flex items-center justify-center gap-2 border border-amber-300 transition-colors"
                    >
                      <ExternalLink className="w-4 h-4 text-amber-700" />
                      <span>Stol №{inspectedTable.table_number} QR menyusini sinab ko'rish</span>
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* New Table Creation Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-[#E5E0D8]">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E0D8]">
              <h3 className="font-display font-bold text-lg text-[#173F35]">
                Yangi stol qo'shish
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateTable} className="my-4 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-[#202622] mb-1">
                  Stol raqami (Raqamli identifikator):
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={newTableNumber}
                  onChange={(e) => setNewTableNumber(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl bg-[#FAF8F3] border border-[#E5E0D8] font-bold text-sm text-[#173F35] focus:outline-none focus:border-[#173F35]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#202622] mb-1">
                  Zal zonasi:
                </label>
                <select
                  value={newTableZone}
                  onChange={(e) => setNewTableZone(e.target.value as TableZone)}
                  className="w-full p-2.5 rounded-xl bg-[#FAF8F3] border border-[#E5E0D8] text-xs focus:outline-none focus:border-[#173F35]"
                >
                  <option value="main">Asosiy Zal</option>
                  <option value="terrace">Veranda / Terrasa</option>
                  <option value="vip">VIP Xona</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-[#202622] mb-1">
                  O'rindiqlar soni (Kishilik sig'imi):
                </label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  required
                  value={newTableSeats}
                  onChange={(e) => setNewTableSeats(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl bg-[#FAF8F3] border border-[#E5E0D8] text-xs focus:outline-none focus:border-[#173F35]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#202622] mb-1">
                  Mas'ul ofitsiant:
                </label>
                <input
                  type="text"
                  required
                  value={newTableWaiter}
                  onChange={(e) => setNewTableWaiter(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-[#FAF8F3] border border-[#E5E0D8] text-xs focus:outline-none focus:border-[#173F35]"
                />
              </div>

              <div className="pt-3 border-t border-[#E5E0D8] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#173F35] text-white hover:bg-[#235B4E] font-bold shadow-xs"
                >
                  Stol yaratish va QR biriktirish
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
