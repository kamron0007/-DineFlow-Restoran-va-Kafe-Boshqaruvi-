import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { StaffAccountRole } from '../types';
import { STAFF_ROLE_LABELS, staffAccountService } from '../services/staffAccount';
import { UzPhoneInput } from './UzPhoneInput';
import {
  X,
  ShieldCheck,
  UserCheck,
  ChefHat,
  User,
  Lock,
  BadgeCheck,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

export const StaffAccountModal: React.FC = () => {
  const {
    isStaffAccountModalOpen,
    editingStaffAccount,
    staffModalDefaultRole,
    closeStaffAccountModal,
    registerStaffAccount,
    updateStaffAccount,
    staffAccounts,
    activeStaffAccount,
    tables,
  } = useApp();

  const isAdminActor = activeStaffAccount?.role === 'admin';

  const [role, setRole] = useState<StaffAccountRole>('admin');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('+998 ');
  const [badgeId, setBadgeId] = useState('');
  const [pin, setPin] = useState('');
  const [status, setStatus] = useState<'active' | 'inactive'>('active');
  const [assignedTables, setAssignedTables] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isStaffAccountModalOpen) return;
    setError(null);
    setPin('');
    if (editingStaffAccount) {
      setRole(editingStaffAccount.role);
      setFullName(editingStaffAccount.full_name);
      setPhone(editingStaffAccount.phone_local || '+998 ');
      setBadgeId(editingStaffAccount.badge_id);
      setStatus(editingStaffAccount.status);
      setAssignedTables(editingStaffAccount.assigned_tables || []);
    } else {
      const nextRole = staffModalDefaultRole || 'admin';
      setRole(nextRole);
      setFullName('');
      setPhone('+998 ');
      setBadgeId(staffAccountService.suggestBadgeId(nextRole, staffAccounts));
      setStatus('active');
      setAssignedTables([]);
    }
  }, [isStaffAccountModalOpen, editingStaffAccount, staffModalDefaultRole, staffAccounts]);

  if (!isStaffAccountModalOpen) return null;

  const handleRoleSelect = (nextRole: StaffAccountRole) => {
    if (!isAdminActor) return;
    setRole(nextRole);
    if (!editingStaffAccount) {
      setBadgeId(staffAccountService.suggestBadgeId(nextRole, staffAccounts));
    }
  };

  const toggleTable = (num: number) => {
    if (!isAdminActor) return;
    setAssignedTables((prev) =>
      prev.includes(num) ? prev.filter((n) => n !== num) : [...prev, num].sort((a, b) => a - b)
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSaving(true);
    try {
      if (editingStaffAccount) {
        const phoneInputHasDigits = phone.replace(/\D/g, '').length > 3;
        await updateStaffAccount(editingStaffAccount.id, {
          fullName,
          role: isAdminActor ? role : editingStaffAccount.role,
          phone: phoneInputHasDigits ? phone : undefined,
          newPin: pin.trim() || undefined,
          badgeId,
          status: isAdminActor ? status : editingStaffAccount.status,
          assignedTables: isAdminActor
            ? assignedTables
            : editingStaffAccount.assigned_tables || [],
        });
      } else {
        await registerStaffAccount({
          role,
          fullName,
          phone,
          pin,
          badgeId,
          assignedTables: isAdminActor ? assignedTables : [],
        });
      }
      closeStaffAccountModal();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Saqlashda xatolik yuz berdi.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-[#FAF8F3] w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl border border-[#E5E0D8] shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="bg-[#173F35] text-white px-6 py-4 flex items-center justify-between gap-3 shrink-0">
          <div>
            <p className="text-xs font-semibold text-[#F59E0B]">
              Xodimlar akkaunti · Admin · Ofitsiant · Oshpaz
            </p>
            <h2 className="font-display font-extrabold text-lg mt-0.5">
              {editingStaffAccount ? 'Xodim akkauntini tahrirlash' : 'Yangi xodim akkaunti yaratish'}
            </h2>
          </div>
          <button
            type="button"
            onClick={closeStaffAccountModal}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors shrink-0"
            aria-label="Yopish"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto">
          {error && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Role Selector (Editable by Admin only) */}
          <div>
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <label className="block text-xs font-semibold text-[#202622]">
                Vazifa (Rol)
              </label>
              {!isAdminActor && (
                <span className="text-[11px] text-[#737A75] flex items-center gap-1">
                  <Lock className="w-3 h-3" />
                  <span>Faqat Admin o&apos;zgartiradi</span>
                </span>
              )}
            </div>
            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  { id: 'admin', label: 'Admin', icon: ShieldCheck },
                  { id: 'waiter', label: 'Ofitsiant', icon: UserCheck },
                  { id: 'kitchen', label: 'Oshpaz', icon: ChefHat },
                ] as const
              ).map((item) => {
                const Icon = item.icon;
                const active = role === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    disabled={!isAdminActor}
                    onClick={() => handleRoleSelect(item.id)}
                    className={`min-h-[48px] px-2.5 py-2 rounded-xl border text-xs font-bold flex flex-col items-center justify-center gap-1 transition-all ${
                      active
                        ? 'bg-[#173F35] text-[#F59E0B] border-[#173F35] shadow-xs'
                        : 'bg-white text-[#59635E] border-[#E5E0D8] hover:border-[#173F35]'
                    } ${!isAdminActor ? 'opacity-70 cursor-not-allowed' : ''}`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className={active ? 'text-white' : ''}>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Full Name & Badge */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-[#202622] mb-1.5">
                Ism-familiya
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-[#737A75] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Masalan: Aliyev Sardor"
                  className="w-full min-h-[46px] pl-10 pr-3 rounded-xl bg-white border border-[#D8D1C5] text-sm text-[#202622] focus:outline-none focus:border-[#173F35] focus:ring-2 focus:ring-[#173F35]/15"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#202622] mb-1.5">
                Xodim kodi
              </label>
              <div className="relative">
                <BadgeCheck className="w-4 h-4 text-[#737A75] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  maxLength={16}
                  value={badgeId}
                  onChange={(e) => setBadgeId(e.target.value.toUpperCase())}
                  placeholder="OF-01"
                  className="w-full min-h-[46px] pl-9 pr-2.5 rounded-xl bg-white border border-[#D8D1C5] text-sm font-mono font-bold text-[#173F35] uppercase focus:outline-none focus:border-[#173F35]"
                />
              </div>
            </div>
          </div>

          {/* Strict Uzbekistan +998 Phone */}
          <div>
            <label className="block text-xs font-semibold text-[#202622] mb-1.5">
              O&apos;zbekiston telefon raqami (+998 o&apos;zgarmas)
            </label>
            <UzPhoneInput
              value={phone}
              onChange={setPhone}
              required={!editingStaffAccount}
              placeholder="90 123-45-67"
            />
            {editingStaffAccount && (
              <p className="text-[11px] text-[#737A75] mt-1">
                Joriy raqam: <span className="font-mono font-semibold">{editingStaffAccount.phone_masked}</span>. Raqamni o&apos;zgartirsangiz yangi 4 xonali PIN ham kiriting.
              </p>
            )}
          </div>

          {/* 4-Digit PIN */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#202622] mb-1.5">
                {editingStaffAccount ? "Yangi 4 xonali PIN (ixtiyoriy)" : "4 xonali kirish PIN-kodi"}
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#737A75] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  required={!editingStaffAccount}
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  placeholder="••••"
                  className="w-full min-h-[46px] pl-10 pr-3 rounded-xl bg-white border border-[#D8D1C5] text-base font-mono tracking-[0.4em] text-[#202622] focus:outline-none focus:border-[#173F35] focus:ring-2 focus:ring-[#173F35]/15"
                />
              </div>
            </div>

            {editingStaffAccount && isAdminActor && (
              <div>
                <label className="block text-xs font-semibold text-[#202622] mb-1.5">
                  Holati
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setStatus('active')}
                    className={`min-h-[46px] rounded-xl text-xs font-bold border transition-all ${
                      status === 'active'
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-white text-[#59635E] border-[#D8D1C5]'
                    }`}
                  >
                    Faol
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatus('inactive')}
                    className={`min-h-[46px] rounded-xl text-xs font-bold border transition-all ${
                      status === 'inactive'
                        ? 'bg-red-600 text-white border-red-600'
                        : 'bg-white text-[#59635E] border-[#D8D1C5]'
                    }`}
                  >
                    Nofaol
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Assigned Tables for Waiter — Strictly Editable by Admin ONLY */}
          {role === 'waiter' && tables.length > 0 && (
            <div>
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <label className="block text-xs font-semibold text-[#202622]">
                  Biriktirilgan stollar ({assignedTables.length} ta)
                </label>
                {isAdminActor ? (
                  <div className="flex items-center gap-2 text-[11px] font-bold">
                    <button
                      type="button"
                      onClick={() =>
                        setAssignedTables(
                          tables.map((t) => t.table_number).sort((a, b) => a - b)
                        )
                      }
                      className="text-[#173F35] hover:underline"
                    >
                      Barchasini tanlash
                    </button>
                    <span className="text-[#D8D1C5]">·</span>
                    <button
                      type="button"
                      onClick={() => setAssignedTables([])}
                      className="text-[#737A75] hover:text-red-600 hover:underline"
                    >
                      Tozalash
                    </button>
                  </div>
                ) : (
                  <span className="text-[11px] font-semibold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                    <Lock className="w-3 h-3" />
                    <span>Faqat Admin o&apos;zgartira oladi</span>
                  </span>
                )}
              </div>

              {isAdminActor ? (
                <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-2.5 rounded-xl bg-white border border-[#E5E0D8]">
                  {tables.map((t) => {
                    const selected = assignedTables.includes(t.table_number);
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => toggleTable(t.table_number)}
                        className={`min-w-[40px] min-h-[34px] px-2 rounded-lg text-xs font-mono font-bold border transition-colors ${
                          selected
                            ? 'bg-[#173F35] text-[#F59E0B] border-[#173F35]'
                            : 'bg-[#FAF8F3] text-[#59635E] border-[#E5E0D8] hover:border-[#173F35]'
                        }`}
                      >
                        №{t.table_number}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-[#F3EFE6] border border-[#E5E0D8]">
                  {assignedTables.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {assignedTables.map((num) => (
                        <span
                          key={num}
                          className="px-2.5 py-1 rounded-lg bg-[#173F35] text-[#F59E0B] text-xs font-mono font-bold"
                        >
                          Stol №{num}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-[#737A75]">
                      Sizga hali stol biriktirilmagan. Stollarni faqat Administrator biriktira oladi.
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Footer Buttons */}
          <div className="pt-2 flex items-center gap-2.5">
            <button
              type="button"
              onClick={closeStaffAccountModal}
              className="flex-1 min-h-[46px] rounded-full bg-white border border-[#E5E0D8] text-[#202622] text-xs font-bold hover:bg-[#F3EFE6] transition-colors"
            >
              Bekor qilish
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex-[1.6] min-h-[46px] rounded-full bg-[#F59E0B] hover:bg-[#FBBF24] disabled:opacity-60 text-[#173F35] text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all active:scale-[0.98]"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>
                {isSaving
                  ? 'Saqlanmoqda...'
                  : editingStaffAccount
                  ? "O'zgarishlarni saqlash"
                  : `${STAFF_ROLE_LABELS[role]} akkauntini yaratish`}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
