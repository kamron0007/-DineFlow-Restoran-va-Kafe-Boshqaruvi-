/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import { MenuPage } from './pages/customer/MenuPage';
import { CartPage } from './pages/customer/CartPage';
import { OrderTrackPage } from './pages/customer/OrderTrackPage';
import { WaiterDashboard } from './pages/waiter/WaiterDashboard';
import { KitchenDisplayPage } from './pages/kitchen/KitchenDisplayPage';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { TableManagementPage } from './pages/admin/TableManagementPage';
import { MenuManagementPage } from './pages/admin/MenuManagementPage';
import { OrdersHistoryPage } from './pages/admin/OrdersHistoryPage';
import { ReportsPage } from './pages/admin/ReportsPage';
import { ExportReportsPage } from './pages/admin/ExportReportsPage';
import { MarketBenchmarkPage } from './pages/admin/MarketBenchmarkPage';
import { SettingsPage } from './pages/admin/SettingsPage';
import { StaffManagementPage } from './pages/admin/StaffManagementPage';
import { KitchenEfficiencyPage } from './pages/admin/KitchenEfficiencyPage';
import { LoginPage } from './pages/auth/LoginPage';
import { Utensils, UserCheck, ChefHat, LayoutDashboard, ChevronUp, ChevronDown } from 'lucide-react';

const DemoRoleBar: React.FC = () => {
  const { setUserRole, activeTableNumber } = useApp();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  // NEVER show staff role switcher on Customer screens (/t/*, /table/*, /menu, /cart, /orders) or Login (/, /login)
  // When a customer scans a table QR code, ONLY the customer screen must be visible.
  const isStaffWorkspace =
    location.pathname.startsWith('/admin') ||
    location.pathname.startsWith('/waiter') ||
    location.pathname.startsWith('/kitchen');

  if (!isStaffWorkspace) {
    return null;
  }

  return (
    <div className="fixed bottom-2 right-2 z-50 font-sans print:hidden">
      {collapsed ? (
        <button
          onClick={() => setCollapsed(false)}
          className="bg-[#173F35] text-white p-2 rounded-xl shadow-lg border border-emerald-700 hover:bg-[#235B4E] transition-all flex items-center gap-1 text-[11px] font-bold"
          title="Rolni o'zgartirish panelini ochish"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>DineFlow Rol</span>
          <ChevronUp className="w-3.5 h-3.5" />
        </button>
      ) : (
        <div className="bg-[#173F35]/95 backdrop-blur-md text-white p-2 rounded-2xl shadow-2xl border border-emerald-800 flex items-center gap-1.5 text-xs">
          <span className="text-[10px] font-bold text-amber-300 px-2 uppercase tracking-wider hidden sm:inline">
            Terminal:
          </span>

          <Link
            to={`/t/${activeTableNumber}`}
            onClick={() => setUserRole('customer')}
            target="_blank"
            rel="noopener noreferrer"
            className="px-2.5 py-1.5 rounded-xl font-bold flex items-center gap-1 transition-all text-white/80 hover:bg-white/10"
          >
            <Utensils className="w-3.5 h-3.5" />
            <span>Mijoz (Stol №{activeTableNumber})</span>
          </Link>

          <Link
            to="/waiter"
            onClick={() => setUserRole('waiter')}
            className={`px-2.5 py-1.5 rounded-xl font-bold flex items-center gap-1 transition-all ${
              location.pathname.startsWith('/waiter')
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-white/80 hover:bg-white/10'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Ofitsiant</span>
          </Link>

          <Link
            to="/kitchen"
            onClick={() => setUserRole('kitchen')}
            className={`px-2.5 py-1.5 rounded-xl font-bold flex items-center gap-1 transition-all ${
              location.pathname.startsWith('/kitchen')
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-white/80 hover:bg-white/10'
            }`}
          >
            <ChefHat className="w-3.5 h-3.5" />
            <span>Oshpaz (KDS)</span>
          </Link>

          <Link
            to="/admin"
            onClick={() => setUserRole('admin')}
            className={`px-2.5 py-1.5 rounded-xl font-bold flex items-center gap-1 transition-all ${
              location.pathname.startsWith('/admin')
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-white/80 hover:bg-white/10'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>Ega (Admin)</span>
          </Link>

          <button
            onClick={() => setCollapsed(true)}
            className="p-1 rounded-lg text-white/50 hover:text-white hover:bg-white/10 ml-1"
            title="Yashirish"
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};

export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <Routes>
          {/* Root / opens Staff & Admin Entry Portal; QR codes go straight to /t/:tableNum */}
          <Route path="/" element={<LoginPage />} />
          <Route path="/login" element={<LoginPage />} />

          {/* Pure Customer QR Routes (Instant locked menu, zero staff UI) */}
          <Route path="/t/:tableNum" element={<MenuPage />} />
          <Route path="/t/:tableNum/*" element={<MenuPage />} />
          <Route path="/table/:tableNum" element={<MenuPage />} />
          <Route path="/menu" element={<MenuPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/orders" element={<OrderTrackPage />} />

          {/* Waiter & Kitchen Terminals */}
          <Route path="/waiter" element={<WaiterDashboard />} />
          <Route path="/kitchen" element={<KitchenDisplayPage />} />

          {/* Admin Suite */}
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/tables" element={<TableManagementPage />} />
          <Route path="/admin/menu" element={<MenuManagementPage />} />
          <Route path="/admin/orders" element={<OrdersHistoryPage />} />
          <Route path="/admin/reports" element={<ReportsPage />} />
          <Route path="/admin/export-reports" element={<ExportReportsPage />} />
          <Route path="/admin/market-benchmark" element={<MarketBenchmarkPage />} />
          <Route path="/admin/kitchen-efficiency" element={<KitchenEfficiencyPage />} />
          <Route path="/admin/waiters" element={<StaffManagementPage />} />
          <Route path="/admin/staff" element={<StaffManagementPage />} />
          <Route path="/admin/settings" element={<SettingsPage />} />
          <Route path="/admin/panel-settings" element={<SettingsPage />} />

          {/* Catch-all redirect to Staff/Admin entry */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>

        {/* Staff-only Role Switcher (Strictly hidden on Customer QR & Login screens) */}
        <DemoRoleBar />
      </AppProvider>
    </BrowserRouter>
  );
}
