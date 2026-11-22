import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { AdminSidebar } from '../../components/AdminSidebar';
import { AdminHeader } from '../../components/AdminHeader';
import { Waiter, WaiterShiftStatus } from '../../types';
import {
  Users,
  UserPlus,
  Search,
  Edit2,
  Trash2,
  Phone,
  ShieldCheck,
  CreditCard,
  CheckCircle2,
  X,
  Check,
  Download,
  AlertTriangle,
  QrCode,
  Star,
  Copy,
  Clock,
  Briefcase,
  Layers,
  Sparkles,
  Printer,
  ChevronRight,
  Filter,
} from 'lucide-react';

export const StaffManagementPage: React.FC = () => {
  const {
    waiters,
    tables,
    addWaiter,
    updateWaiter,
    deleteWaiter,
    updateWaiterStatus,
    restaurantName,
    restaurantBranch,
    addToast,
  } = useApp();

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | WaiterShiftStatus>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Modals state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingWaiter, setEditingWaiter] = useState<Waiter | null>(null);
  const [deletingWaiter, setDeletingWaiter] = useState<Waiter | null>(null);
  const [badgePreviewWaiter, setBadgePreviewWaiter] = useState<Waiter | null>(null);

  // Form Fields
  const [formFullName, setFormFullName] = useState('');
  const [formPhone, setFormPhone] = useState('+998 ');
  const [formBadgeId, setFormBadgeId] = useState('');
  const [formJshir, setFormJshir] = useState('');
  const [formPassport, setFormPassport] = useState('');
  const [formRoleTitle, setFormRoleTitle] = useState('Ofitsiant');
  const [formStatus, setFormStatus] = useState<WaiterShiftStatus>('active');
  const [formAssignedTables, setFormAssignedTables] = useState<number[]>([]);
  const [formHiredAt, setFormHiredAt] = useState<string>(new Date().toISOString().split('T')[0]);
  const [formNotes, setFormNotes] = useState('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Auto-generate next badge ID
  const suggestNextBadgeId = useMemo(() => {
    const existingIds = waiters
      .map((w) => {
        const match = w.badge_id?.match(/OF-(\d+)/i);
        return match ? parseInt(match[1], 10) : 0;
      })
      .filter((n) => !isNaN(n));
    const maxNum = existingIds.length > 0 ? Math.max(...existingIds) : 0;
    const nextNum = maxNum + 1;
    return `OF-${nextNum < 10 ? '0' + nextNum : nextNum}`;
  }, [waiters]);

  // Open Add Waiter Modal
  const handleOpenAddModal = () => {
    setEditingWaiter(null);
    setFormFullName('');
    setFormPhone('+998 ');
    setFormBadgeId(suggestNextBadgeId);
    setFormJshir('');
    setFormPassport('');
    setFormRoleTitle('Ofitsiant');
    setFormStatus('active');
    setFormAssignedTables([1, 2]);
    setFormHiredAt(new Date().toISOString().split('T')[0]);
    setFormNotes('');
    setFormErrors({});
    setIsFormModalOpen(true);
  };

  // Open Edit Waiter Modal
  const handleOpenEditModal = (waiter: Waiter) => {
    setEditingWaiter(waiter);
    setFormFullName(waiter.full_name);
    setFormPhone(waiter.phone);
    setFormBadgeId(waiter.badge_id);
    setFormJshir(waiter.jshir || '');
    setFormPassport(waiter.passport_number || '');
    setFormRoleTitle(waiter.role_title || 'Ofitsiant');
    setFormStatus(waiter.status);
    setFormAssignedTables(waiter.assigned_tables || []);
    setFormHiredAt(waiter.hired_at || new Date().toISOString().split('T')[0]);
    setFormNotes(waiter.notes || '');
    setFormErrors({});
    setIsFormModalOpen(true);
  };

  // Copy helper
  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    addToast('info', "Nusxa olindi", `${label} buferga nusxalandi: ${text}`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Validation
  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formFullName.trim()) {
      errors.fullName = "F.I.SH (Familiya Ism Sharif) kiritilishi shart";
    } else if (formFullName.trim().split(' ').length < 2) {
      errors.fullName = "Kamida Familiya va Ism kiritilishi lozim";
    }

    if (!formBadgeId.trim()) {
      errors.badgeId = "Ofitsiant ID raqami (masalan, OF-01) kiritilishi shart";
    }

    // Phone validation
    const cleanPhone = formPhone.replace(/\s+/g, '');
    if (!cleanPhone || cleanPhone === '+998') {
      errors.phone = "Telefon raqami kiritilishi shart";
    } else if (cleanPhone.length < 13) {
      errors.phone = "Telefon raqamini to'liq kiriting (masalan: +998 90 123 45 67)";
    }

    // JSHIR validation (14 digits)
    const cleanJshir = formJshir.replace(/\D/g, '');
    if (!cleanJshir) {
      errors.jshir = "JShShIR (14 raqamli shaxsiy kod) kiritilishi shart";
    } else if (cleanJshir.length !== 14) {
      errors.jshir = `JShShIR aynan 14 ta raqam bo'lishi shart (hozirda ${cleanJshir.length} ta)`;
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Submit Add or Edit
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const cleanJshir = formJshir.replace(/\D/g, '');

    if (editingWaiter) {
      const updated: Waiter = {
        ...editingWaiter,
        full_name: formFullName.trim(),
        badge_id: formBadgeId.trim().toUpperCase(),
        phone: formPhone.trim(),
        jshir: cleanJshir,
        passport_number: formPassport.trim().toUpperCase() || undefined,
        role_title: formRoleTitle,
        status: formStatus,
        assigned_tables: formAssignedTables.sort((a, b) => a - b),
        hired_at: formHiredAt,
        notes: formNotes.trim() || undefined,
      };
      await updateWaiter(updated);
    } else {
      await addWaiter({
        full_name: formFullName.trim(),
        badge_id: formBadgeId.trim().toUpperCase(),
        phone: formPhone.trim(),
        jshir: cleanJshir,
        passport_number: formPassport.trim().toUpperCase() || undefined,
        role_title: formRoleTitle,
        status: formStatus,
        assigned_tables: formAssignedTables.sort((a, b) => a - b),
        rating: 5.0,
        orders_serviced: 0,
        hired_at: formHiredAt,
        notes: formNotes.trim() || undefined,
      });
    }

    setIsFormModalOpen(false);
  };

  // Confirm delete
  const handleConfirmDelete = async () => {
    if (!deletingWaiter) return;
    await deleteWaiter(deletingWaiter.id);
    setDeletingWaiter(null);
  };

  // Toggle table assignment in form
  const toggleTableAssignment = (tableNum: number) => {
    if (formAssignedTables.includes(tableNum)) {
      setFormAssignedTables(formAssignedTables.filter((t) => t !== tableNum));
    } else {
      setFormAssignedTables([...formAssignedTables, tableNum]);
    }
  };

  // Phone auto format
  const handlePhoneChange = (val: string) => {
    let raw = val;
    if (!raw.startsWith('+998')) {
      raw = '+998 ' + raw.replace(/^\+?998\s*/, '');
    }
    setFormPhone(raw);
  };

  // JSHIR input cleaner (only numbers, max 14)
  const handleJshirChange = (val: string) => {
    const digitsOnly = val.replace(/\D/g, '').slice(0, 14);
    setFormJshir(digitsOnly);
  };

  // Quick preset sample data for testing
  const handleLoadSampleWaiter = () => {
    setFormFullName("Mirzayev Otabek Shuhratovich");
    setFormPhone("+998 91 234 56 78");
    setFormBadgeId(suggestNextBadgeId);
    setFormJshir("31205996140087");
    setFormPassport("AB 4567890");
    setFormRoleTitle("Ofitsiant");
    setFormStatus("active");
    setFormAssignedTables([7, 8, 9, 15]);
    setFormNotes("Xushmuomala, ingliz va turk tillarida gaplasha oladi.");
    setFormErrors({});
  };

  // Filtered Waiters List
  const filteredWaiters = useMemo(() => {
    return waiters.filter((w) => {
      // Status filter
      if (statusFilter !== 'all' && w.status !== statusFilter) return false;
      // Role filter
      if (roleFilter !== 'all' && w.role_title !== roleFilter) return false;
      // Search
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchName = w.full_name.toLowerCase().includes(query);
        const matchPhone = w.phone.replace(/\s+/g, '').includes(query.replace(/\s+/g, ''));
        const matchBadge = w.badge_id.toLowerCase().includes(query);
        const matchJshir = (w.jshir || '').includes(query);
        const matchPassport = (w.passport_number || '').toLowerCase().includes(query);
        if (!matchName && !matchPhone && !matchBadge && !matchJshir && !matchPassport) {
          return false;
        }
      }
      return true;
    });
  }, [waiters, statusFilter, roleFilter, searchQuery]);

  // Statistics
  const stats = useMemo(() => {
    const total = waiters.length;
    const active = waiters.filter((w) => w.status === 'active').length;
    const onBreak = waiters.filter((w) => w.status === 'break').length;
    const vacation = waiters.filter((w) => w.status === 'vacation').length;
    const inactive = waiters.filter((w) => w.status === 'inactive').length;
    const totalServiced = waiters.reduce((sum, w) => sum + (w.orders_serviced || 0), 0);
    const avgRating =
      total > 0
        ? (waiters.reduce((sum, w) => sum + (w.rating || 5.0), 0) / total).toFixed(1)
        : '5.0';

    return { total, active, onBreak, vacation, inactive, totalServiced, avgRating };
  }, [waiters]);

  // Unique roles for filter dropdown
  const uniqueRoles = useMemo(() => {
    const set = new Set<string>();
    waiters.forEach((w) => {
      if (w.role_title) set.add(w.role_title);
    });
    return Array.from(set);
  }, [waiters]);

  // Export Waiters to CSV
  const handleExportCSV = () => {
    const headers = [
      'ID (Kodi)',
      'F.I.SH (Familiya Ism Sharif)',
      'Telefon Raqam',
      'JSHIR (PINFL)',
      'Pasport Seriya',
      'Lavozimi',
      'Smena Holati',
      'Biriktirilgan Stollar',
      'Reyting',
      'Xizmat Ko\'rsatilgan Cheklar',
      'Ishga Olingan Sana',
      'Qo\'shimcha Izoh',
    ];

    const rows = filteredWaiters.map((w) => [
      `"${w.badge_id || ''}"`,
      `"${w.full_name || ''}"`,
      `"${w.phone || ''}"`,
      `="${w.jshir || ''}"`, // Format as text in Excel so 14-digit number isn't scientific notation
      `"${w.passport_number || ''}"`,
      `"${w.role_title || ''}"`,
      `"${w.status === 'active' ? 'Faol smenada' : w.status === 'break' ? 'Tanaffusda' : w.status === 'vacation' ? 'Ta\'tilda' : 'Nofaol'}"`,
      `"${(w.assigned_tables || []).map((t) => `Stol ${t}`).join(', ')}"`,
      `"${w.rating || 5.0}"`,
      `"${w.orders_serviced || 0}"`,
      `"${w.hired_at || ''}"`,
      `"${(w.notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent =
      '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Zafaran_Ofitsiantlar_Royxati_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    addToast('success', 'CSV yuklab olindi', 'Ofitsiantlar ro\'yxati CSV formatida yuklandi');
  };

  return (
    <div className="flex h-screen bg-[#FAF8F3] overflow-hidden text-[#202622]">
      {/* Left Sidebar */}
      <AdminSidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <AdminHeader />

        <main className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
          {/* Header Bar */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-3xl border border-[#E5E0D8] shadow-xs">
            <div>
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-[#173F35] text-white flex items-center justify-center shadow-sm">
                  <Users className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-display font-extrabold text-[#173F35]">
                    Ofitsiantlar & Xodimlar Boshqaruvi
                  </h1>
                  <p className="text-xs sm:text-sm text-[#737A75] mt-0.5">
                    Ofitsiantlar ma'lumotlarini qo'shish, tahrirlash, o'chirish (F.I.SH, TELEFON, ID, JSHIR) va stollarni biriktirish
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              <button
                onClick={handleExportCSV}
                className="px-4 py-2.5 rounded-xl border border-[#E5E0D8] text-xs font-bold text-[#173F35] bg-[#FAF8F3] hover:bg-[#F2ECE1] transition-all flex items-center gap-2 active:scale-95 shadow-xs"
                title="CSV formatida ofitsiantlar ro'yxatini yuklab olish"
              >
                <Download className="w-4 h-4 text-emerald-700" />
                <span>CSV Yuklab Olish</span>
              </button>

              <button
                onClick={handleOpenAddModal}
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-[#173F35] hover:bg-[#235B4E] transition-all flex items-center gap-2 shadow-md active:scale-95"
              >
                <UserPlus className="w-4 h-4 text-amber-300" />
                <span>Yangi Ofitsiant Qo'shish</span>
              </button>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="bg-white p-4 rounded-2xl border border-[#E5E0D8] shadow-xs">
              <span className="text-[11px] font-bold text-[#737A75] uppercase tracking-wider block">Jami Xodimlar</span>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-2xl font-black text-[#173F35]">{stats.total}</span>
                <span className="text-xs text-[#737A75]">nafar</span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-emerald-200 bg-gradient-to-br from-white to-emerald-50/50 shadow-xs">
              <div className="flex items-center gap-1.5 text-emerald-800">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-[11px] font-bold uppercase tracking-wider">Faol Smenada</span>
              </div>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-2xl font-black text-emerald-700">{stats.active}</span>
                <span className="text-xs text-emerald-600">xodim</span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-amber-200 bg-gradient-to-br from-white to-amber-50/40 shadow-xs">
              <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider block">Tanaffusda</span>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-2xl font-black text-amber-700">{stats.onBreak}</span>
                <span className="text-xs text-amber-600">xodim</span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-blue-200 bg-gradient-to-br from-white to-blue-50/40 shadow-xs">
              <span className="text-[11px] font-bold text-blue-800 uppercase tracking-wider block">Ta'tilda</span>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-2xl font-black text-blue-700">{stats.vacation}</span>
                <span className="text-xs text-blue-600">xodim</span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-[#E5E0D8] shadow-xs">
              <span className="text-[11px] font-bold text-[#737A75] uppercase tracking-wider block">Xizmat Cheklari</span>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-2xl font-black text-[#173F35]">{stats.totalServiced}</span>
                <span className="text-xs text-[#737A75]">chek</span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-[#E5E0D8] shadow-xs">
              <div className="flex items-center gap-1 text-amber-500">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#737A75]">O'rtacha Reyting</span>
              </div>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-2xl font-black text-[#173F35]">{stats.avgRating}</span>
                <span className="text-xs text-amber-600">/ 5.0</span>
              </div>
            </div>
          </div>

          {/* Search & Filter Toolbar */}
          <div className="bg-white p-4 rounded-2xl border border-[#E5E0D8] shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Search Input */}
            <div className="relative w-full md:w-96">
              <Search className="w-4 h-4 text-[#737A75] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="F.I.SH, Telefon, ID yoki 14 raqamli JSHIR..."
                className="w-full pl-10 pr-4 py-2 bg-[#FAF8F3] border border-[#E5E0D8] rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-[#173F35] placeholder:text-[#737A75]"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Filter Chips */}
            <div className="flex items-center gap-2 flex-wrap w-full md:w-auto">
              <div className="flex items-center bg-[#FAF8F3] p-1 rounded-xl border border-[#E5E0D8] text-xs">
                <button
                  onClick={() => setStatusFilter('all')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                    statusFilter === 'all'
                      ? 'bg-[#173F35] text-white shadow-xs'
                      : 'text-[#737A75] hover:text-[#173F35]'
                  }`}
                >
                  Barchasi ({waiters.length})
                </button>
                <button
                  onClick={() => setStatusFilter('active')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                    statusFilter === 'active'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-emerald-800 hover:bg-emerald-50'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  <span>Faol ({stats.active})</span>
                </button>
                <button
                  onClick={() => setStatusFilter('break')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                    statusFilter === 'break'
                      ? 'bg-amber-500 text-slate-950 shadow-xs'
                      : 'text-amber-800 hover:bg-amber-50'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                  <span>Tanaffus ({stats.onBreak})</span>
                </button>
                <button
                  onClick={() => setStatusFilter('vacation')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                    statusFilter === 'vacation'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-blue-800 hover:bg-blue-50'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                  <span>Ta'tilda ({stats.vacation})</span>
                </button>
              </div>

              {/* Role Select */}
              {uniqueRoles.length > 0 && (
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="px-3 py-2 bg-[#FAF8F3] border border-[#E5E0D8] rounded-xl text-xs font-semibold text-[#173F35] focus:outline-hidden focus:ring-2 focus:ring-[#173F35]"
                >
                  <option value="all">Barcha lavozimlar</option>
                  {uniqueRoles.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* Waiters Cards / Table View */}
          {filteredWaiters.length === 0 ? (
            <div className="bg-white p-12 rounded-3xl border border-[#E5E0D8] text-center space-y-4 shadow-xs">
              <div className="w-16 h-16 rounded-full bg-[#FAF8F3] border border-[#E5E0D8] text-[#737A75] flex items-center justify-center mx-auto">
                <Users className="w-8 h-8 text-[#737A75]" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#173F35]">Ofitsiantlar topilmadi</h3>
                <p className="text-xs text-[#737A75] max-w-sm mx-auto mt-1">
                  Qidiruv so'rovi yoki filtr bo'yicha hech qanday xodim ma'lumotlari topilmadi.
                </p>
              </div>
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setStatusFilter('all');
                    setRoleFilter('all');
                  }}
                  className="px-4 py-2 bg-[#FAF8F3] hover:bg-[#F2ECE1] border border-[#E5E0D8] rounded-xl text-xs font-bold text-[#173F35]"
                >
                  Filtrlarni tozalash
                </button>
                <button
                  onClick={handleOpenAddModal}
                  className="px-4 py-2 bg-[#173F35] hover:bg-[#235B4E] text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Yangi ofitsiant qo'shish</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredWaiters.map((waiter) => {
                const isCopiedJshir = copiedField === `jshir-${waiter.id}`;
                const isCopiedPhone = copiedField === `phone-${waiter.id}`;

                return (
                  <div
                    key={waiter.id}
                    className="bg-white rounded-3xl border border-[#E5E0D8] p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4 relative overflow-hidden group"
                  >
                    {/* Top status stripe */}
                    <div
                      className={`absolute top-0 left-0 right-0 h-1.5 ${
                        waiter.status === 'active'
                          ? 'bg-emerald-500'
                          : waiter.status === 'break'
                          ? 'bg-amber-400'
                          : waiter.status === 'vacation'
                          ? 'bg-blue-500'
                          : 'bg-gray-300'
                      }`}
                    />

                    {/* Top Row: Avatar, Name, Badge, Actions */}
                    <div className="flex items-start justify-between gap-3 pt-1">
                      <div className="flex items-start gap-3.5">
                        {/* Avatar / Badge ID */}
                        <div className="relative">
                          <div className="w-13 h-13 rounded-2xl bg-[#173F35] text-amber-300 flex flex-col items-center justify-center font-bold shadow-sm border border-emerald-900/30">
                            <span className="text-[10px] uppercase font-mono tracking-wider opacity-80">ID</span>
                            <span className="text-sm font-extrabold tracking-tight">{waiter.badge_id}</span>
                          </div>
                          {/* Live pulse dot */}
                          <span
                            className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white flex items-center justify-center ${
                              waiter.status === 'active'
                                ? 'bg-emerald-500'
                                : waiter.status === 'break'
                                ? 'bg-amber-400'
                                : waiter.status === 'vacation'
                                ? 'bg-blue-500'
                                : 'bg-gray-400'
                            }`}
                            title={`Holati: ${waiter.status}`}
                          />
                        </div>

                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h2 className="font-display font-bold text-base text-[#173F35] leading-tight">
                              {waiter.full_name}
                            </h2>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#FAF8F3] border border-[#E5E0D8] text-[#737A75]">
                              {waiter.role_title || 'Ofitsiant'}
                            </span>
                          </div>

                          {/* Shift status dropdown / badge */}
                          <div className="flex items-center gap-2 mt-1.5">
                            <select
                              value={waiter.status}
                              onChange={(e) =>
                                updateWaiterStatus(waiter.id, e.target.value as WaiterShiftStatus)
                              }
                              className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border cursor-pointer transition-colors ${
                                waiter.status === 'active'
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                  : waiter.status === 'break'
                                  ? 'bg-amber-50 text-amber-800 border-amber-200'
                                  : waiter.status === 'vacation'
                                  ? 'bg-blue-50 text-blue-800 border-blue-200'
                                  : 'bg-gray-100 text-gray-700 border-gray-200'
                              }`}
                            >
                              <option value="active">🟢 Faol smenada</option>
                              <option value="break">🟡 Tanaffusda</option>
                              <option value="vacation">🔵 Ta'tilda</option>
                              <option value="inactive">⚪ Nofaol</option>
                            </select>

                            {waiter.rating && (
                              <div className="flex items-center gap-1 text-[11px] font-bold bg-amber-50 text-amber-900 border border-amber-200 px-2 py-0.5 rounded-lg">
                                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                                <span>{waiter.rating}</span>
                              </div>
                            )}

                            {waiter.orders_serviced !== undefined && (
                              <span className="text-[10px] text-[#737A75]">
                                {waiter.orders_serviced} ta buyurtma
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setBadgePreviewWaiter(waiter)}
                          className="p-2 rounded-xl text-[#737A75] hover:text-[#173F35] hover:bg-[#FAF8F3] transition-colors"
                          title="Beyjik / Nishon kartasini ko'rish"
                        >
                          <QrCode className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenEditModal(waiter)}
                          className="p-2 rounded-xl text-[#737A75] hover:text-[#173F35] hover:bg-[#FAF8F3] transition-colors"
                          title="Tahrirlash"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeletingWaiter(waiter)}
                          className="p-2 rounded-xl text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors"
                          title="O'chirish"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Passport, Phone, JSHIR Data Grid */}
                    <div className="bg-[#FAF8F3] p-3.5 rounded-2xl border border-[#E5E0D8]/80 space-y-2 text-xs">
                      {/* Phone */}
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[#737A75] flex items-center gap-1.5 font-medium">
                          <Phone className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Telefon raqami:</span>
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-[#173F35]">{waiter.phone}</span>
                          <button
                            onClick={() => handleCopy(waiter.phone, `phone-${waiter.id}`)}
                            className="text-[#737A75] hover:text-[#173F35] p-1 rounded-md"
                            title="Nusxa olish"
                          >
                            {isCopiedPhone ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* JSHIR */}
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[#737A75] flex items-center gap-1.5 font-medium">
                          <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                          <span>JSHIR (PINFL 14 raqam):</span>
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-[#173F35] bg-white px-2 py-0.5 rounded-md border border-[#E5E0D8] tracking-wider">
                            {waiter.jshir || 'Kiritilmagan'}
                          </span>
                          {waiter.jshir && (
                            <button
                              onClick={() => handleCopy(waiter.jshir, `jshir-${waiter.id}`)}
                              className="text-[#737A75] hover:text-[#173F35] p-1 rounded-md"
                              title="JSHIR raqamini nusxalash"
                            >
                              {isCopiedJshir ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Passport */}
                      {waiter.passport_number && (
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[#737A75] flex items-center gap-1.5 font-medium">
                            <CreditCard className="w-3.5 h-3.5 text-purple-600" />
                            <span>Pasport seriya va raqam:</span>
                          </span>
                          <span className="font-mono font-bold text-[#173F35]">
                            {waiter.passport_number}
                          </span>
                        </div>
                      )}

                      {/* Hired date */}
                      {waiter.hired_at && (
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[#737A75] flex items-center gap-1.5 font-medium">
                            <Clock className="w-3.5 h-3.5 text-amber-600" />
                            <span>Ishga qabul sanasi:</span>
                          </span>
                          <span className="text-[#173F35] font-semibold">{waiter.hired_at}</span>
                        </div>
                      )}
                    </div>

                    {/* Assigned Tables */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-[#173F35] flex items-center gap-1.5">
                          <Layers className="w-3.5 h-3.5 text-[#173F35]" />
                          <span>Biriktirilgan stollar:</span>
                        </span>
                        <span className="text-[11px] text-[#737A75]">
                          {(waiter.assigned_tables || []).length} ta stol
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 flex-wrap">
                        {(waiter.assigned_tables || []).length === 0 ? (
                          <span className="text-xs text-[#737A75] italic">Hozircha stol biriktirilmagan</span>
                        ) : (
                          waiter.assigned_tables.map((tNum) => {
                            const tableObj = tables.find((t) => t.table_number === tNum);
                            const tierBadge = tableObj?.tier === 'vip' ? '👑 VIP' : tableObj?.tier === 'biznes' ? '💼 Biznes' : '';

                            return (
                              <span
                                key={tNum}
                                className={`text-[11px] font-bold px-2 py-0.5 rounded-lg border ${
                                  tableObj?.tier === 'vip'
                                    ? 'bg-amber-100 text-amber-900 border-amber-300'
                                    : tableObj?.tier === 'biznes'
                                    ? 'bg-purple-100 text-purple-900 border-purple-300'
                                    : 'bg-emerald-50 text-emerald-900 border-emerald-200'
                                }`}
                              >
                                Stol №{tNum} {tierBadge}
                              </span>
                            );
                          })
                        )}
                      </div>
                    </div>

                    {/* Notes if any */}
                    {waiter.notes && (
                      <p className="text-[11px] text-[#737A75] bg-[#FAF8F3] p-2.5 rounded-xl border border-[#E5E0D8]/60 line-clamp-2">
                        💬 <span className="italic">{waiter.notes}</span>
                      </p>
                    )}

                    {/* Bottom Quick Action: Edit / Delete */}
                    <div className="pt-2 border-t border-[#FAF8F3] flex items-center justify-between gap-2">
                      <button
                        onClick={() => handleOpenEditModal(waiter)}
                        className="text-xs font-bold text-[#173F35] hover:text-[#235B4E] flex items-center gap-1 hover:underline"
                      >
                        <span>Ma'lumotlarni tahrirlash</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => setDeletingWaiter(waiter)}
                        className="text-xs font-bold text-rose-600 hover:text-rose-800 flex items-center gap-1 hover:underline"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>O'chirish</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>

      {/* ========================================================
          ADD / EDIT WAITER MODAL
         ======================================================== */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-2xl w-full border border-[#E5E0D8] shadow-2xl overflow-hidden my-8">
            {/* Modal Header */}
            <div className="bg-[#173F35] text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-amber-300">
                  {editingWaiter ? <Edit2 className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="font-display font-bold text-base sm:text-lg">
                    {editingWaiter ? "Ofitsiant Ma'lumotlarini Tahrirlash" : "Yangi Ofitsiant Qo'shish"}
                  </h3>
                  <p className="text-xs text-emerald-200">
                    F.I.SH, Telefon, ID kodi, JSHIR (PINFL 14 raqam) va biriktirilgan stollar
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {!editingWaiter && (
                  <button
                    type="button"
                    onClick={handleLoadSampleWaiter}
                    className="text-[11px] font-bold bg-amber-400 hover:bg-amber-300 text-slate-950 px-2.5 py-1 rounded-lg transition-all flex items-center gap-1"
                    title="Tezkor namunaviy xodim ma'lumotlarini to'ldirish"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Namunaviy ma'lumot</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleSubmitForm} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* Row 1: F.I.SH */}
              <div>
                <label className="block text-xs font-bold text-[#173F35] mb-1">
                  F.I.SH (Familiya Ism Sharif) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formFullName}
                  onChange={(e) => setFormFullName(e.target.value)}
                  placeholder="Masalan: Karimov Dilshod Baxtiyorovich"
                  className={`w-full px-3.5 py-2.5 bg-[#FAF8F3] border rounded-xl text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-[#173F35] ${
                    formErrors.fullName ? 'border-rose-400 bg-rose-50/50' : 'border-[#E5E0D8]'
                  }`}
                />
                {formErrors.fullName && (
                  <p className="text-[11px] text-rose-500 mt-1 font-semibold">{formErrors.fullName}</p>
                )}
              </div>

              {/* Row 2: ID and Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-[#173F35]">
                      Xodim ID kodi <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-[10px] text-[#737A75]">Masalan: OF-01</span>
                  </div>
                  <input
                    type="text"
                    value={formBadgeId}
                    onChange={(e) => setFormBadgeId(e.target.value.toUpperCase())}
                    placeholder="OF-01"
                    className={`w-full px-3.5 py-2.5 bg-[#FAF8F3] border rounded-xl text-xs font-mono font-bold focus:outline-hidden focus:ring-2 focus:ring-[#173F35] uppercase ${
                      formErrors.badgeId ? 'border-rose-400 bg-rose-50/50' : 'border-[#E5E0D8]'
                    }`}
                  />
                  {formErrors.badgeId && (
                    <p className="text-[11px] text-rose-500 mt-1 font-semibold">{formErrors.badgeId}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#173F35] mb-1">
                    Telefon raqam <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formPhone}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    placeholder="+998 90 123 45 67"
                    className={`w-full px-3.5 py-2.5 bg-[#FAF8F3] border rounded-xl text-xs font-mono font-bold focus:outline-hidden focus:ring-2 focus:ring-[#173F35] ${
                      formErrors.phone ? 'border-rose-400 bg-rose-50/50' : 'border-[#E5E0D8]'
                    }`}
                  />
                  {formErrors.phone && (
                    <p className="text-[11px] text-rose-500 mt-1 font-semibold">{formErrors.phone}</p>
                  )}
                </div>
              </div>

              {/* Row 3: JSHIR and Passport */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-[#173F35] flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                      <span>JSHIR (PINFL) <span className="text-rose-500">*</span></span>
                    </label>
                    <span
                      className={`text-[10px] font-mono font-bold ${
                        formJshir.length === 14 ? 'text-emerald-600' : 'text-amber-600'
                      }`}
                    >
                      {formJshir.length}/14 raqam
                    </span>
                  </div>
                  <input
                    type="text"
                    value={formJshir}
                    onChange={(e) => handleJshirChange(e.target.value)}
                    placeholder="32504956120014"
                    maxLength={14}
                    className={`w-full px-3.5 py-2.5 bg-[#FAF8F3] border rounded-xl text-xs font-mono font-bold tracking-wider focus:outline-hidden focus:ring-2 focus:ring-[#173F35] ${
                      formErrors.jshir ? 'border-rose-400 bg-rose-50/50' : 'border-[#E5E0D8]'
                    }`}
                  />
                  <p className="text-[10px] text-[#737A75] mt-1">
                    O'zbekiston fuqarosi pasportidagi 14 ta raqamdan iborat shaxsiy identifikatsiya raqami
                  </p>
                  {formErrors.jshir && (
                    <p className="text-[11px] text-rose-500 mt-0.5 font-semibold">{formErrors.jshir}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#173F35] mb-1">
                    Pasport seriya va raqami
                  </label>
                  <input
                    type="text"
                    value={formPassport}
                    onChange={(e) => setFormPassport(e.target.value.toUpperCase())}
                    placeholder="AA 7654321"
                    maxLength={11}
                    className="w-full px-3.5 py-2.5 bg-[#FAF8F3] border border-[#E5E0D8] rounded-xl text-xs font-mono font-bold focus:outline-hidden focus:ring-2 focus:ring-[#173F35] uppercase"
                  />
                  <p className="text-[10px] text-[#737A75] mt-1">
                    Ixtiyoriy: Pasport yoki ID-karta seriyasi
                  </p>
                </div>
              </div>

              {/* Row 4: Lavozim and Smena Holati */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#173F35] mb-1">Lavozimi</label>
                  <select
                    value={formRoleTitle}
                    onChange={(e) => setFormRoleTitle(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#FAF8F3] border border-[#E5E0D8] rounded-xl text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-[#173F35]"
                  >
                    <option value="Bosh ofitsiant">Bosh ofitsiant</option>
                    <option value="Katta ofitsiant">Katta ofitsiant</option>
                    <option value="Ofitsiant">Ofitsiant</option>
                    <option value="Ofitsiant yordamchisi">Ofitsiant yordamchisi</option>
                    <option value="VIP zal ofitsiant">VIP zal ofitsiant</option>
                    <option value="Kassir-ofitsiant">Kassir-ofitsiant</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#173F35] mb-1">Smena holati</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as WaiterShiftStatus)}
                    className="w-full px-3.5 py-2.5 bg-[#FAF8F3] border border-[#E5E0D8] rounded-xl text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-[#173F35]"
                  >
                    <option value="active">🟢 Faol smenada</option>
                    <option value="break">🟡 Tanaffusda</option>
                    <option value="vacation">🔵 Ta'tilda</option>
                    <option value="inactive">⚪ Nofaol</option>
                  </select>
                </div>
              </div>

              {/* Row 5: Biriktirilgan stollar (Assigned Tables Multi-Selector) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-[#173F35] flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-[#173F35]" />
                    <span>Biriktirilgan stollar ({formAssignedTables.length} ta tanlandi)</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setFormAssignedTables(tables.map((t) => t.table_number))}
                      className="text-[10px] font-bold text-[#173F35] hover:underline"
                    >
                      Barchasi
                    </button>
                    <span className="text-gray-300">•</span>
                    <button
                      type="button"
                      onClick={() => setFormAssignedTables([])}
                      className="text-[10px] font-bold text-rose-600 hover:underline"
                    >
                      Tozalash
                    </button>
                  </div>
                </div>

                <div className="p-3 bg-[#FAF8F3] border border-[#E5E0D8] rounded-2xl max-h-40 overflow-y-auto flex flex-wrap gap-1.5">
                  {tables.map((table) => {
                    const isSelected = formAssignedTables.includes(table.table_number);
                    const tierLabel = table.tier === 'vip' ? 'VIP' : table.tier === 'biznes' ? 'Biznes' : '';

                    return (
                      <button
                        type="button"
                        key={table.id}
                        onClick={() => toggleTableAssignment(table.table_number)}
                        className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 border active:scale-95 ${
                          isSelected
                            ? 'bg-[#173F35] text-white border-[#173F35] shadow-xs'
                            : 'bg-white text-[#737A75] border-[#E5E0D8] hover:border-[#173F35] hover:text-[#173F35]'
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3 text-emerald-400" />}
                        <span>Stol {table.table_number}</span>
                        {tierLabel && (
                          <span
                            className={`text-[9px] px-1 py-0.2 rounded-sm ${
                              isSelected
                                ? 'bg-amber-400 text-slate-950'
                                : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {tierLabel}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Row 6: Ishga olingan sana and Notes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#173F35] mb-1">
                    Ishga qabul sanasi
                  </label>
                  <input
                    type="date"
                    value={formHiredAt}
                    onChange={(e) => setFormHiredAt(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#FAF8F3] border border-[#E5E0D8] rounded-xl text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-[#173F35]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#173F35] mb-1">
                    Qo'shimcha izoh yoki ko'nikmalar
                  </label>
                  <input
                    type="text"
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    placeholder="Chet tillari, tajriba, VIP xizmat..."
                    className="w-full px-3.5 py-2.5 bg-[#FAF8F3] border border-[#E5E0D8] rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-[#173F35]"
                  />
                </div>
              </div>

              {/* Modal Actions */}
              <div className="pt-4 border-t border-[#FAF8F3] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="px-5 py-2.5 bg-[#FAF8F3] hover:bg-[#F2ECE1] border border-[#E5E0D8] rounded-xl text-xs font-bold text-[#737A75]"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-[#173F35] hover:bg-[#235B4E] text-white rounded-xl text-xs font-bold shadow-md active:scale-95 flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4 text-emerald-300" />
                  <span>{editingWaiter ? "O'zgarishlarni Saqlash" : "Ofitsiantni Saqlash"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          DELETE WAITER CONFIRMATION MODAL ("O'chirish")
         ======================================================== */}
      {deletingWaiter && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full border border-rose-200 shadow-2xl overflow-hidden p-6 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="font-display font-bold text-lg text-[#173F35]">
                Ofitsiantni O'chirishni Tasdiqlaysizmi?
              </h3>
              <p className="text-xs text-[#737A75]">
                Ushbu amal qaytarilmas. Xodimning barcha ma'lumotlari tizimdan o'chiriladi.
              </p>
            </div>

            {/* Waiter preview card */}
            <div className="bg-rose-50/50 p-4 rounded-2xl border border-rose-100 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[#737A75]">F.I.SH:</span>
                <span className="font-bold text-[#173F35]">{deletingWaiter.full_name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#737A75]">Xodim ID:</span>
                <span className="font-mono font-bold text-rose-700 bg-white px-2 py-0.5 rounded border border-rose-200">
                  {deletingWaiter.badge_id}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#737A75]">Telefon:</span>
                <span className="font-mono font-semibold text-[#173F35]">{deletingWaiter.phone}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#737A75]">JSHIR (PINFL):</span>
                <span className="font-mono font-bold text-[#173F35]">{deletingWaiter.jshir || '—'}</span>
              </div>
              {(deletingWaiter.assigned_tables || []).length > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-[#737A75]">Biriktirilgan stollar:</span>
                  <span className="font-bold text-[#173F35]">
                    {deletingWaiter.assigned_tables.map((t) => `№${t}`).join(', ')}
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setDeletingWaiter(null)}
                className="flex-1 py-2.5 bg-[#FAF8F3] hover:bg-[#F2ECE1] border border-[#E5E0D8] rounded-xl text-xs font-bold text-[#737A75]"
              >
                Bekor qilish
              </button>
              <button
                onClick={handleConfirmDelete}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-md active:scale-95 flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>Ha, O'chirilsin</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          BADGE / ID CARD PREVIEW MODAL
         ======================================================== */}
      {badgePreviewWaiter && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-sm w-full border border-[#E5E0D8] shadow-2xl overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#FAF8F3]">
              <span className="text-xs font-bold text-[#173F35] uppercase tracking-wider">
                Xodim Beyjik Nishoni
              </span>
              <button
                onClick={() => setBadgePreviewWaiter(null)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Printable ID Card Mockup */}
            <div className="bg-gradient-to-br from-[#173F35] to-[#0D241E] text-white p-5 rounded-2xl shadow-lg border border-emerald-900/40 relative overflow-hidden space-y-4 text-center">
              {/* Pattern watermark */}
              <div className="absolute top-0 right-0 -mr-8 -mt-8 w-28 h-28 rounded-full bg-white/5 pointer-events-none" />

              <div>
                <p className="text-[10px] uppercase font-bold tracking-widest text-emerald-300">
                  {restaurantName || 'Zafaran Grand'}
                </p>
                <p className="text-[9px] text-emerald-100/70">{restaurantBranch || 'Toshkent filiali'}</p>
              </div>

              {/* Avatar Box */}
              <div className="w-20 h-20 mx-auto rounded-2xl bg-white/10 border-2 border-amber-400/80 flex flex-col items-center justify-center shadow-inner">
                <span className="text-xs text-amber-300 font-mono font-bold">XODIM ID</span>
                <span className="text-xl font-black text-white">{badgePreviewWaiter.badge_id}</span>
              </div>

              <div>
                <h3 className="font-display font-bold text-base text-white">
                  {badgePreviewWaiter.full_name}
                </h3>
                <p className="text-xs text-amber-300 font-semibold mt-0.5">
                  {badgePreviewWaiter.role_title || 'Ofitsiant'}
                </p>
              </div>

              <div className="bg-black/30 p-2.5 rounded-xl border border-white/10 text-[11px] font-mono text-emerald-100 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-white/60">Telefon:</span>
                  <span className="font-bold text-white">{badgePreviewWaiter.phone}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white/60">JSHIR:</span>
                  <span className="font-bold text-white tracking-wider">{badgePreviewWaiter.jshir || '—'}</span>
                </div>
              </div>

              <p className="text-[9px] text-emerald-200/60 uppercase tracking-widest">
                DineFlow Smart Restaurant Staff Pass
              </p>
            </div>

            <div className="flex items-center justify-between gap-3 pt-2">
              <button
                onClick={() => window.print()}
                className="flex-1 py-2.5 bg-[#FAF8F3] hover:bg-[#F2ECE1] border border-[#E5E0D8] rounded-xl text-xs font-bold text-[#173F35] flex items-center justify-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5 text-emerald-700" />
                <span>Chop etish</span>
              </button>
              <button
                onClick={() => setBadgePreviewWaiter(null)}
                className="flex-1 py-2.5 bg-[#173F35] hover:bg-[#235B4E] text-white rounded-xl text-xs font-bold shadow-sm"
              >
                Yopish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
