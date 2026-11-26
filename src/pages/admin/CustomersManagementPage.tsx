import React, { useEffect, useMemo, useState } from 'react';
import { AdminSidebar } from '../../components/AdminSidebar';
import { AdminHeader } from '../../components/AdminHeader';
import { useApp } from '../../context/AppContext';
import { useLanguage } from '../../context/LanguageContext';
import {
  CASHBACK_PERCENT_LABEL,
  TIER_CONFIG,
  customerAccountService,
} from '../../services/customerAccount';
import { CashbackTransaction, CustomerAccount, CustomerTier } from '../../types';
import { formatPrice, formatTimeAgo } from '../../utils/formatters';
import {
  UserCheck,
  Users,
  Wallet,
  Crown,
  Search,
  RefreshCw,
  Download,
  Eye,
  X,
  Receipt,
  CalendarClock,
  Phone,
  ArrowUpRight,
  ArrowDownLeft,
  Gift,
  RotateCcw,
  ShoppingBag,
  Sparkles,
} from 'lucide-react';

function formatDateTime(iso: string): string {
  try {
    const d = new Date(iso);
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    const hh = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return `${dd}.${mm}.${yyyy} · ${hh}:${min}`;
  } catch {
    return '--.--.---- · --:--';
  }
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'M';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export const CustomersManagementPage: React.FC = () => {
  const { allCustomerAccounts, refreshCustomerAccounts, orders, menuItems, addToast } = useApp();
  const { localizeOrderItem } = useLanguage();

  const [searchQuery, setSearchQuery] = useState('');
  const [tierFilter, setTierFilter] = useState<'all' | CustomerTier>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'spent' | 'orders' | 'cashback'>('newest');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Customer Detail Modal State
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerAccount | null>(null);
  const [detailTab, setDetailTab] = useState<'orders' | 'cashback'>('orders');
  const [selectedTransactions, setSelectedTransactions] = useState<CashbackTransaction[]>([]);
  const [isLoadingTx, setIsLoadingTx] = useState(false);

  useEffect(() => {
    refreshCustomerAccounts();
  }, [refreshCustomerAccounts]);

  useEffect(() => {
    if (!selectedCustomer) {
      setSelectedTransactions([]);
      return;
    }
    let active = true;
    setIsLoadingTx(true);
    customerAccountService
      .getTransactions(selectedCustomer.id)
      .then((txs) => {
        if (active) setSelectedTransactions(txs);
      })
      .finally(() => {
        if (active) setIsLoadingTx(false);
      });
    return () => {
      active = false;
    };
  }, [selectedCustomer]);

  // Orders grouped per registered customer account
  const ordersByAccountId = useMemo(() => {
    const map = new Map<string, typeof orders>();
    orders.forEach((o) => {
      if (!o.customer_account_id) return;
      const list = map.get(o.customer_account_id) || [];
      list.push(o);
      map.set(o.customer_account_id, list);
    });
    map.forEach((list, key) => {
      list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      map.set(key, list);
    });
    return map;
  }, [orders]);

  // Aggregate KPI metrics
  const metrics = useMemo(() => {
    const totalCustomers = allCustomerAccounts.length;
    const totalCashbackBalance = allCustomerAccounts.reduce(
      (sum, c) => sum + (c.cashback_balance || 0),
      0
    );
    const totalMemberSpent = allCustomerAccounts.reduce(
      (sum, c) => sum + (c.total_spent || 0),
      0
    );
    const totalMemberOrders = allCustomerAccounts.reduce(
      (sum, c) => sum + (c.total_orders || 0),
      0
    );
    const vipGoldCount = allCustomerAccounts.filter(
      (c) => c.tier === 'gold' || c.tier === 'platinum'
    ).length;

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const joinedToday = allCustomerAccounts.filter(
      (c) => new Date(c.created_at).getTime() >= todayStart.getTime()
    ).length;

    return {
      totalCustomers,
      totalCashbackBalance,
      totalMemberSpent,
      totalMemberOrders,
      vipGoldCount,
      joinedToday,
    };
  }, [allCustomerAccounts]);

  // Filtered and sorted customers
  const filteredCustomers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return [...allCustomerAccounts]
      .filter((c) => {
        if (tierFilter !== 'all' && c.tier !== tierFilter) return false;
        if (!q) return true;
        return (
          c.full_name.toLowerCase().includes(q) ||
          c.phone_masked.toLowerCase().includes(q) ||
          c.id.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        if (sortBy === 'spent') return (b.total_spent || 0) - (a.total_spent || 0);
        if (sortBy === 'orders') return (b.total_orders || 0) - (a.total_orders || 0);
        if (sortBy === 'cashback') return (b.cashback_balance || 0) - (a.cashback_balance || 0);
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
  }, [allCustomerAccounts, searchQuery, tierFilter, sortBy]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshCustomerAccounts();
      addToast('success', 'Yangilandi', "Ro'yxatdan o'tgan mijozlar ro'yxati yangilandi.");
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleExportCsv = () => {
    if (filteredCustomers.length === 0) {
      addToast('info', "Ma'lumot yo'q", "Eksport qilish uchun ro'yxatdan o'tgan mijozlar topilmadi.");
      return;
    }

    const headers = [
      'ID',
      'Ism-familiya',
      'Telefon (niqoblangan)',
      'Daraja',
      'Keshbek balansi (UZS)',
      'Buyurtmalar soni',
      'Jami xarid (UZS)',
      "Qo'shilgan sana",
      'Oxirgi faollik',
    ];

    const escapeCsv = (val: string | number) => {
      const str = String(val ?? '');
      return `"${str.replace(/"/g, '""')}"`;
    };

    const rows = filteredCustomers.map((c) => [
      c.id,
      c.full_name,
      c.phone_masked,
      TIER_CONFIG[c.tier]?.label || c.tier,
      c.cashback_balance || 0,
      c.total_orders || 0,
      c.total_spent || 0,
      formatDateTime(c.created_at),
      formatDateTime(c.updated_at),
    ]);

    const csvContent =
      '\uFEFF' + [headers.map(escapeCsv).join(','), ...rows.map((r) => r.map(escapeCsv).join(','))].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `mijozlar_akkauntlar_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    addToast('success', 'CSV yuklab olindi', `${filteredCustomers.length} ta mijoz ma'lumoti eksport qilindi.`);
  };

  const getTierBadgeClass = (tier: CustomerTier) => {
    if (tier === 'platinum') {
      return 'bg-[#173F35] text-[#F59E0B] border border-[#1E5245]';
    }
    if (tier === 'gold') {
      return 'bg-amber-50 text-amber-800 border border-amber-200';
    }
    return 'bg-[#F3EFE6] text-[#173F35] border border-[#E5E0D8]';
  };

  const selectedCustomerOrders = selectedCustomer
    ? ordersByAccountId.get(selectedCustomer.id) || []
    : [];

  return (
    <div className="min-h-screen bg-[#FAF8F3] flex">
      <AdminSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <AdminHeader />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1440px] w-full mx-auto">
          {/* Page Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-[#1E5245]">
                <UserCheck className="w-4 h-4 text-[#F59E0B]" />
                <span>Mijozlar bazasi va sodiqlik tizimi</span>
              </div>
              <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-[#173F35] mt-1">
                Mijozlar &amp; Akkauntlar
              </h1>
              <p className="text-xs sm:text-sm text-[#59635E] mt-1">
                QR orqali shaxsiy kabinet ochgan barcha mijozlar, ularning keshbek balansi va buyurtma tarixi.
              </p>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              <button
                type="button"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="min-h-[42px] px-4 py-2 rounded-xl bg-white hover:bg-[#F3EFE6] border border-[#E5E0D8] text-xs font-bold text-[#173F35] flex items-center gap-2 transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span>Yangilash</span>
              </button>
              <button
                type="button"
                onClick={handleExportCsv}
                className="min-h-[42px] px-4 py-2 rounded-xl bg-[#173F35] hover:bg-[#1E5245] text-white text-xs font-bold flex items-center gap-2 transition-colors shadow-xs"
              >
                <Download className="w-4 h-4 text-[#F59E0B]" />
                <span>CSV eksport</span>
              </button>
            </div>
          </div>

          {/* KPI Summary Strip */}
          <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl border border-[#E5E0D8] p-5 flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold text-[#737A75]">Jami mijoz akkauntlari</p>
                <p className="font-mono font-extrabold text-2xl sm:text-3xl text-[#173F35] tabular-nums mt-1.5">
                  {metrics.totalCustomers}
                </p>
                <p className="text-[11px] font-semibold text-emerald-700 mt-1">
                  Bugun qo&apos;shilgan: +{metrics.joinedToday}
                </p>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-[#E8F0EC] text-[#173F35] flex items-center justify-center shrink-0">
                <Users className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-[#E5E0D8] p-5 flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold text-[#737A75]">Jami keshbek balansi</p>
                <p className="font-mono font-extrabold text-xl sm:text-2xl text-[#173F35] tabular-nums mt-1.5">
                  {formatPrice(metrics.totalCashbackBalance)}
                </p>
                <p className="text-[11px] text-[#737A75] mt-1">
                  Har bir buyurtmadan {CASHBACK_PERCENT_LABEL} keshbek
                </p>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
                <Wallet className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-[#E5E0D8] p-5 flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold text-[#737A75]">A&apos;zolar jami xaridi</p>
                <p className="font-mono font-extrabold text-xl sm:text-2xl text-[#173F35] tabular-nums mt-1.5">
                  {formatPrice(metrics.totalMemberSpent)}
                </p>
                <p className="text-[11px] text-[#737A75] mt-1 tabular-nums">
                  Jami buyurtmalar: {metrics.totalMemberOrders} ta
                </p>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-[#E8F0EC] text-[#1E5245] flex items-center justify-center shrink-0">
                <ShoppingBag className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-[#E5E0D8] p-5 flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold text-[#737A75]">Oltin &amp; VIP mijozlar</p>
                <p className="font-mono font-extrabold text-2xl sm:text-3xl text-[#173F35] tabular-nums mt-1.5">
                  {metrics.vipGoldCount}
                </p>
                <p className="text-[11px] text-[#737A75] mt-1">
                  Doimiy faol sodiq mehmonlar
                </p>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-[#173F35] text-[#F59E0B] flex items-center justify-center shrink-0">
                <Crown className="w-5 h-5" />
              </div>
            </div>
          </section>

          {/* Search, Tier Filter & Sort Controls */}
          <section className="bg-white rounded-2xl border border-[#E5E0D8] p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-[#737A75] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Mijoz ismi yoki telefon raqami bo'yicha qidirish..."
                className="w-full min-h-[42px] pl-10 pr-4 rounded-xl bg-[#FAF8F3] border border-[#E5E0D8] text-xs sm:text-sm text-[#202622] focus:outline-none focus:border-[#173F35]"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                {(
                  [
                    { id: 'all', label: `Barchasi (${allCustomerAccounts.length})` },
                    { id: 'silver', label: 'Doimiy mehmon' },
                    { id: 'gold', label: 'Oltin mehmon' },
                    { id: 'platinum', label: 'VIP mehmon' },
                  ] as const
                ).map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setTierFilter(item.id)}
                    className={`min-h-[36px] px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${
                      tierFilter === item.id
                        ? 'bg-[#173F35] text-white'
                        : 'bg-[#FAF8F3] text-[#59635E] border border-[#E5E0D8] hover:border-[#173F35]'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                className="min-h-[38px] px-3 py-1.5 rounded-xl bg-[#FAF8F3] border border-[#E5E0D8] text-xs font-bold text-[#173F35] focus:outline-none focus:border-[#173F35]"
              >
                <option value="newest">Eng yangi qo&apos;shilganlar</option>
                <option value="spent">Eng ko&apos;p xarid qilganlar</option>
                <option value="orders">Eng ko&apos;p buyurtma</option>
                <option value="cashback">Eng katta keshbek</option>
              </select>
            </div>
          </section>

          {/* Registered Customers Table / Empty State */}
          {filteredCustomers.length === 0 ? (
            <section className="bg-white rounded-3xl border border-[#E5E0D8] p-12 text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-[#FAF8F3] border border-[#E5E0D8] text-[#737A75] flex items-center justify-center mx-auto">
                <Users className="w-7 h-7" />
              </div>
              <h3 className="font-display font-bold text-lg text-[#173F35]">
                Ro&apos;yxatdan o&apos;tgan mijozlar topilmadi
              </h3>
              <p className="text-xs sm:text-sm text-[#59635E] max-w-md mx-auto">
                Mijozlar QR menyu orqali shaxsiy kabinet ochishi bilan ularning barcha ma&apos;lumotlari shu yerda real vaqtda ko&apos;rinadi.
              </p>
            </section>
          ) : (
            <section className="bg-white rounded-3xl border border-[#E5E0D8] overflow-hidden shadow-xs">
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#FAF8F3] border-b border-[#E5E0D8] text-[11px] font-bold text-[#737A75] uppercase tracking-wider">
                      <th className="py-3.5 px-5">Mijoz</th>
                      <th className="py-3.5 px-4">Telefon raqami</th>
                      <th className="py-3.5 px-4">Daraja</th>
                      <th className="py-3.5 px-4 text-right">Keshbek balansi</th>
                      <th className="py-3.5 px-4 text-right">Buyurtmalar / Xarid</th>
                      <th className="py-3.5 px-4">Qo&apos;shilgan vaqt</th>
                      <th className="py-3.5 px-5 text-right">Amal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F2EFE9] text-sm">
                    {filteredCustomers.map((acc) => {
                      const linkedOrdersCount = Math.max(
                        acc.total_orders || 0,
                        (ordersByAccountId.get(acc.id) || []).length
                      );
                      return (
                        <tr
                          key={acc.id}
                          className="hover:bg-[#FAF8F3]/80 transition-colors group"
                        >
                          <td className="py-3.5 px-5">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-10 h-10 rounded-2xl bg-[#173F35] text-[#F59E0B] font-display font-extrabold text-xs flex items-center justify-center shrink-0">
                                {getInitials(acc.full_name)}
                              </div>
                              <div className="min-w-0">
                                <p className="font-display font-bold text-sm text-[#173F35] truncate">
                                  {acc.full_name}
                                </p>
                                <p className="text-[11px] font-mono text-[#737A75] truncate">
                                  ID: {acc.id.slice(0, 14)}...
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="inline-flex items-center gap-1.5 font-mono text-xs font-semibold text-[#202622]">
                              <Phone className="w-3.5 h-3.5 text-[#1E5245]" />
                              <span>{acc.phone_masked}</span>
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${getTierBadgeClass(
                                acc.tier
                              )}`}
                            >
                              <Crown className="w-3 h-3" />
                              <span>{TIER_CONFIG[acc.tier]?.label || acc.tier}</span>
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <span className="font-mono font-extrabold text-sm text-[#1E5245] tabular-nums">
                              {formatPrice(acc.cashback_balance || 0)}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <p className="font-mono font-bold text-xs text-[#202622] tabular-nums">
                              {formatPrice(acc.total_spent || 0)}
                            </p>
                            <p className="text-[11px] text-[#737A75] tabular-nums">
                              {linkedOrdersCount} ta buyurtma
                            </p>
                          </td>
                          <td className="py-3.5 px-4">
                            <p className="font-mono text-xs text-[#202622] tabular-nums">
                              {formatDateTime(acc.created_at)}
                            </p>
                            <p className="text-[11px] text-[#737A75]">
                              {formatTimeAgo(acc.created_at)}
                            </p>
                          </td>
                          <td className="py-3.5 px-5 text-right">
                            <button
                              type="button"
                              onClick={() => {
                                setDetailTab('orders');
                                setSelectedCustomer(acc);
                              }}
                              className="min-h-[36px] px-3.5 py-1.5 rounded-xl bg-[#FAF8F3] hover:bg-[#173F35] text-[#173F35] hover:text-white border border-[#E5E0D8] hover:border-[#173F35] text-xs font-bold inline-flex items-center gap-1.5 transition-colors"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Batafsil</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden divide-y divide-[#F2EFE9]">
                {filteredCustomers.map((acc) => {
                  const linkedOrdersCount = Math.max(
                    acc.total_orders || 0,
                    (ordersByAccountId.get(acc.id) || []).length
                  );
                  return (
                    <div key={acc.id} className="p-4 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-2xl bg-[#173F35] text-[#F59E0B] font-display font-extrabold text-xs flex items-center justify-center shrink-0">
                            {getInitials(acc.full_name)}
                          </div>
                          <div className="min-w-0">
                            <p className="font-display font-bold text-sm text-[#173F35] truncate">
                              {acc.full_name}
                            </p>
                            <p className="text-xs font-mono text-[#59635E] mt-0.5">
                              {acc.phone_masked}
                            </p>
                          </div>
                        </div>
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold shrink-0 ${getTierBadgeClass(
                            acc.tier
                          )}`}
                        >
                          <Crown className="w-3 h-3" />
                          <span>{TIER_CONFIG[acc.tier]?.label || acc.tier}</span>
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-2 bg-[#FAF8F3] rounded-xl p-2.5 text-center">
                        <div>
                          <p className="text-[10px] text-[#737A75]">Keshbek</p>
                          <p className="font-mono font-bold text-xs text-[#1E5245] tabular-nums mt-0.5">
                            {formatPrice(acc.cashback_balance || 0)}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] text-[#737A75]">Buyurtmalar</p>
                          <p className="font-mono font-bold text-xs text-[#173F35] tabular-nums mt-0.5">
                            {linkedOrdersCount} ta
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] text-[#737A75]">Jami xarid</p>
                          <p className="font-mono font-bold text-xs text-[#202622] tabular-nums mt-0.5 truncate">
                            {formatPrice(acc.total_spent || 0)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-2 text-[11px] text-[#737A75]">
                        <span className="inline-flex items-center gap-1 font-mono tabular-nums">
                          <CalendarClock className="w-3.5 h-3.5 text-[#1E5245]" />
                          <span>{formatDateTime(acc.created_at)}</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setDetailTab('orders');
                            setSelectedCustomer(acc);
                          }}
                          className="min-h-[34px] px-3 py-1 rounded-xl bg-[#173F35] text-white text-xs font-bold inline-flex items-center gap-1.5"
                        >
                          <Eye className="w-3.5 h-3.5 text-[#F59E0B]" />
                          <span>Batafsil</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </main>
      </div>

      {/* Customer Detail Modal */}
      {selectedCustomer && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-[#FAF8F3] w-full sm:max-w-2xl rounded-t-3xl sm:rounded-3xl border border-[#E5E0D8] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="bg-[#173F35] text-white px-6 py-5 flex items-start justify-between gap-3 shrink-0">
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-12 h-12 rounded-2xl bg-[#F59E0B] text-[#173F35] font-display font-extrabold text-base flex items-center justify-center shrink-0">
                  {getInitials(selectedCustomer.full_name)}
                </div>
                <div className="min-w-0">
                  <div className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#F59E0B]">
                    <Crown className="w-3.5 h-3.5" />
                    <span>{TIER_CONFIG[selectedCustomer.tier]?.label || selectedCustomer.tier}</span>
                  </div>
                  <h2 className="font-display font-extrabold text-xl truncate mt-0.5">
                    {selectedCustomer.full_name}
                  </h2>
                  <p className="text-xs font-mono text-emerald-100/80 mt-0.5">
                    {selectedCustomer.phone_masked} · Qo&apos;shilgan: {formatDateTime(selectedCustomer.created_at)}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCustomer(null)}
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors shrink-0"
                aria-label="Yopish"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Summary Metrics */}
            <div className="p-5 border-b border-[#E5E0D8] bg-white grid grid-cols-3 gap-3 shrink-0">
              <div className="rounded-2xl bg-[#FAF8F3] border border-[#E5E0D8] p-3">
                <p className="text-[11px] text-[#737A75]">Keshbek balansi</p>
                <p className="font-mono font-extrabold text-base sm:text-lg text-[#1E5245] tabular-nums mt-0.5">
                  {formatPrice(selectedCustomer.cashback_balance || 0)}
                </p>
              </div>
              <div className="rounded-2xl bg-[#FAF8F3] border border-[#E5E0D8] p-3">
                <p className="text-[11px] text-[#737A75]">Jami xarid</p>
                <p className="font-mono font-extrabold text-base sm:text-lg text-[#173F35] tabular-nums mt-0.5 truncate">
                  {formatPrice(selectedCustomer.total_spent || 0)}
                </p>
              </div>
              <div className="rounded-2xl bg-[#FAF8F3] border border-[#E5E0D8] p-3">
                <p className="text-[11px] text-[#737A75]">Buyurtmalar</p>
                <p className="font-mono font-extrabold text-base sm:text-lg text-[#202622] tabular-nums mt-0.5">
                  {Math.max(selectedCustomer.total_orders || 0, selectedCustomerOrders.length)} ta
                </p>
              </div>
            </div>

            {/* Tabs */}
            <div className="px-5 pt-4 shrink-0">
              <div className="grid grid-cols-2 p-1 rounded-2xl bg-[#EFEAE0] border border-[#E5E0D8]">
                <button
                  type="button"
                  onClick={() => setDetailTab('orders')}
                  className={`min-h-[40px] rounded-xl text-xs font-bold transition-all ${
                    detailTab === 'orders'
                      ? 'bg-white text-[#173F35] shadow-xs'
                      : 'text-[#59635E] hover:text-[#173F35]'
                  }`}
                >
                  Buyurtma tarixi ({selectedCustomerOrders.length})
                </button>
                <button
                  type="button"
                  onClick={() => setDetailTab('cashback')}
                  className={`min-h-[40px] rounded-xl text-xs font-bold transition-all ${
                    detailTab === 'cashback'
                      ? 'bg-white text-[#173F35] shadow-xs'
                      : 'text-[#59635E] hover:text-[#173F35]'
                  }`}
                >
                  Keshbek tarixi ({selectedTransactions.length})
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="p-5 overflow-y-auto flex-1 space-y-3">
              {detailTab === 'orders' ? (
                selectedCustomerOrders.length === 0 ? (
                  <div className="bg-white rounded-2xl border border-[#E5E0D8] p-8 text-center space-y-2">
                    <Receipt className="w-7 h-7 text-[#737A75] mx-auto" />
                    <p className="text-xs text-[#59635E]">
                      Bu mijoz hali buyurtma bermagan.
                    </p>
                  </div>
                ) : (
                  selectedCustomerOrders.map((ord) => (
                    <div
                      key={ord.id}
                      className="bg-white rounded-2xl border border-[#E5E0D8] p-4 space-y-2.5"
                    >
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-extrabold text-sm text-[#173F35]">
                            {ord.order_number}
                          </span>
                          <span className="text-xs text-[#737A75]">· Stol №{ord.table_number}</span>
                        </div>
                        <span
                          className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                            ord.status === 'delivered'
                              ? 'bg-emerald-100 text-emerald-800'
                              : ord.status === 'cancelled'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {ord.status === 'delivered'
                            ? 'Yetkazildi'
                            : ord.status === 'cancelled'
                            ? 'Bekor qilindi'
                            : ord.status === 'ready'
                            ? 'Tayyor'
                            : ord.status === 'preparing'
                            ? 'Tayyorlanmoqda'
                            : 'Yangi'}
                        </span>
                      </div>

                      <div className="space-y-1 border-t border-[#F2EFE9] pt-2">
                        {ord.items.map((it) => (
                          <div key={it.id} className="flex items-center justify-between text-xs gap-2">
                            <span className="text-[#202622]">
                              <strong className="font-mono text-[#173F35]">{it.quantity}×</strong>{' '}
                              {localizeOrderItem(it.item_name, it.menu_item_id, menuItems)}
                            </span>
                            <span className="font-mono text-[#59635E] tabular-nums shrink-0">
                              {formatPrice(it.line_total)}
                            </span>
                          </div>
                        ))}
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-[#F2EFE9] text-xs">
                        <span className="font-mono text-[#737A75] tabular-nums">
                          {formatDateTime(ord.created_at)}
                        </span>
                        <span className="font-mono font-extrabold text-sm text-[#173F35] tabular-nums">
                          {formatPrice(ord.total_amount)}
                        </span>
                      </div>
                    </div>
                  ))
                )
              ) : isLoadingTx ? (
                <div className="bg-white rounded-2xl border border-[#E5E0D8] p-8 text-center text-xs text-[#737A75]">
                  Yuklanmoqda...
                </div>
              ) : selectedTransactions.length === 0 ? (
                <div className="bg-white rounded-2xl border border-[#E5E0D8] p-8 text-center space-y-2">
                  <Sparkles className="w-7 h-7 text-[#737A75] mx-auto" />
                  <p className="text-xs text-[#59635E]">
                    Hozircha keshbek operatsiyalari mavjud emas.
                  </p>
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-[#E5E0D8] divide-y divide-[#F2EFE9] overflow-hidden">
                  {selectedTransactions.map((tx) => {
                    const isPositive = tx.type !== 'spent';
                    return (
                      <div key={tx.id} className="p-3.5 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                              tx.type === 'spent'
                                ? 'bg-amber-50 text-amber-700'
                                : tx.type === 'welcome_bonus'
                                ? 'bg-[#E8F0EC] text-[#173F35]'
                                : tx.type === 'refunded'
                                ? 'bg-slate-100 text-slate-700'
                                : 'bg-[#E8F0EC] text-emerald-700'
                            }`}
                          >
                            {tx.type === 'spent' ? (
                              <ArrowUpRight className="w-4 h-4" />
                            ) : tx.type === 'welcome_bonus' ? (
                              <Gift className="w-4 h-4" />
                            ) : tx.type === 'refunded' ? (
                              <RotateCcw className="w-4 h-4" />
                            ) : (
                              <ArrowDownLeft className="w-4 h-4" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-[#202622] leading-snug">
                              {tx.description}
                            </p>
                            <p className="text-[11px] font-mono text-[#737A75] tabular-nums mt-0.5">
                              {formatDateTime(tx.created_at)}
                            </p>
                          </div>
                        </div>
                        <span
                          className={`font-mono font-bold text-sm tabular-nums shrink-0 ${
                            isPositive ? 'text-emerald-700' : 'text-amber-700'
                          }`}
                        >
                          {isPositive ? '+' : '-'}
                          {formatPrice(tx.amount)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
