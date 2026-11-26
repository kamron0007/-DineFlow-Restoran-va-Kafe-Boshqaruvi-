import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Receipt,
  QrCode,
  MenuSquare,
  BarChart3,
  FileSpreadsheet,
  TrendingUp,
  Users,
  UserCheck,
  ChefHat,
  Settings,
  Store,
  Wifi,
  LogOut,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { BrandLogo } from './BrandLogo';

export const AdminSidebar: React.FC = () => {
  const { orders, allCustomerAccounts, restaurantBranch, logoutStaffAccount } = useApp();
  const navigate = useNavigate();
  const newOrdersCount = orders.filter((o) => o.status === 'new').length;
  const customersCount = allCustomerAccounts.length;

  const navClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[13px] font-semibold transition-all ${
      isActive
        ? 'bg-[#F59E0B] text-[#173F35] font-bold shadow-[0_8px_22px_-8px_rgba(245,158,11,0.55)]'
        : 'text-emerald-100/80 hover:bg-white/8 hover:text-white'
    }`;

  return (
    <aside className="w-64 bg-[#173F35] text-white border-r border-white/10 hidden lg:flex flex-col justify-between py-5 shrink-0 h-screen sticky top-0 overflow-y-auto">
      <div className="flex flex-col gap-5">
        {/* Brand Header */}
        <div className="px-5">
          <BrandLogo size="md" theme="dark" />
        </div>

        {/* Branch Selector */}
        <div className="px-4">
          <div className="bg-white/6 rounded-2xl p-3 border border-white/10 flex flex-col gap-1">
            <span className="text-[11px] font-semibold text-[#F59E0B]">
              Faol Filial
            </span>
            <div className="flex items-center justify-between text-xs font-semibold text-white">
              <div className="flex items-center gap-2 truncate">
                <Store className="w-4 h-4 text-[#F59E0B] shrink-0" />
                <span className="truncate">{restaurantBranch || 'Chilonzor filiali'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex flex-col gap-1 px-3.5">
          <NavLink to="/admin" end className={navClass}>
            <LayoutDashboard className="w-4 h-4 shrink-0" />
            <span>Dashboard</span>
          </NavLink>

          <NavLink
            to="/admin/orders"
            className={({ isActive }) =>
              `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-[13px] font-semibold transition-all ${
                isActive
                  ? 'bg-[#F59E0B] text-[#173F35] font-bold shadow-[0_8px_22px_-8px_rgba(245,158,11,0.55)]'
                  : 'text-emerald-100/80 hover:bg-white/8 hover:text-white'
              }`
            }
          >
            <div className="flex items-center gap-3">
              <Receipt className="w-4 h-4 shrink-0" />
              <span>Buyurtmalar oqimi</span>
            </div>
            {newOrdersCount > 0 && (
              <span className="bg-amber-400 text-[#173F35] text-[10px] font-extrabold px-2 py-0.5 rounded-full font-mono tabular-nums">
                {newOrdersCount}
              </span>
            )}
          </NavLink>

          <NavLink to="/admin/tables" className={navClass}>
            <QrCode className="w-4 h-4 shrink-0" />
            <span>Stollar & Cheklar</span>
          </NavLink>

          <NavLink to="/admin/menu" className={navClass}>
            <MenuSquare className="w-4 h-4 shrink-0" />
            <span>Raqamli Menyu</span>
          </NavLink>

          <NavLink to="/admin/reports" className={navClass}>
            <BarChart3 className="w-4 h-4 shrink-0" />
            <span>Hisobotlar & Moliya</span>
          </NavLink>

          <NavLink to="/admin/export-reports" className={navClass}>
            <FileSpreadsheet className="w-4 h-4 shrink-0" />
            <span>CSV Eksport Markazi</span>
          </NavLink>

          <NavLink to="/admin/market-benchmark" className={navClass}>
            <TrendingUp className="w-4 h-4 shrink-0" />
            <span>O&apos;zbekiston Bozor Tahlili</span>
          </NavLink>

          <NavLink to="/admin/kitchen-efficiency" className={navClass}>
            <ChefHat className="w-4 h-4 shrink-0" />
            <span>Oshxona Samaradorligi (D3)</span>
          </NavLink>

          <NavLink
            to="/admin/customers"
            className={({ isActive }) =>
              `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-[13px] font-semibold transition-all ${
                isActive
                  ? 'bg-[#F59E0B] text-[#173F35] font-bold shadow-[0_8px_22px_-8px_rgba(245,158,11,0.55)]'
                  : 'text-emerald-100/80 hover:bg-white/8 hover:text-white'
              }`
            }
          >
            <div className="flex items-center gap-3">
              <UserCheck className="w-4 h-4 shrink-0" />
              <span>Mijozlar &amp; Akkauntlar</span>
            </div>
            {customersCount > 0 && (
              <span className="bg-white/15 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full font-mono tabular-nums">
                {customersCount}
              </span>
            )}
          </NavLink>

          <NavLink to="/admin/waiters" className={navClass}>
            <Users className="w-4 h-4 shrink-0" />
            <span>Ofitsiantlar (F.I.SH, JSHIR)</span>
          </NavLink>

          <NavLink to="/admin/settings" className={navClass}>
            <Settings className="w-4 h-4 shrink-0" />
            <span>Admin Panel Sozlamalari</span>
          </NavLink>
        </nav>
      </div>

      {/* System Status & Logout Footer */}
      <div className="px-5 space-y-2.5 pt-4 border-t border-white/10">
        <div className="bg-white/6 rounded-2xl p-3 border border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]" />
            <div className="flex flex-col">
              <span className="text-xs font-bold text-white">Tizim holati</span>
              <span className="text-[11px] text-emerald-100/70">Smena ochiq</span>
            </div>
          </div>
          <Wifi className="w-4 h-4 text-[#F59E0B]" />
        </div>

        <button
          type="button"
          onClick={() => {
            logoutStaffAccount();
            navigate('/login?role=admin');
          }}
          className="w-full min-h-[42px] px-3 py-2 rounded-xl bg-white/8 hover:bg-red-500/20 border border-white/12 hover:border-red-400/40 text-xs font-bold text-red-200 hover:text-white flex items-center justify-center gap-2 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Tizimdan chiqish</span>
        </button>
      </div>
    </aside>
  );
};
