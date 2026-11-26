/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LanguageProvider } from './context/LanguageContext';
import { AppProvider, useApp } from './context/AppContext';
import { LanguageEntryModal } from './components/LanguageEntryModal';
import { StaffAccountRole } from './types';
import { MenuPage } from './pages/customer/MenuPage';
import { CartPage } from './pages/customer/CartPage';
import { OrderTrackPage } from './pages/customer/OrderTrackPage';
import { AccountPage } from './pages/customer/AccountPage';
import { CustomerAuthModal } from './components/CustomerAuthModal';
import { StaffAccountModal } from './components/StaffAccountModal';
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
import { CustomersManagementPage } from './pages/admin/CustomersManagementPage';
import { KitchenEfficiencyPage } from './pages/admin/KitchenEfficiencyPage';
import { LoginPage } from './pages/auth/LoginPage';

interface StaffProtectedRouteProps {
  requiredRole: StaffAccountRole;
  children: React.ReactElement;
}

const StaffProtectedRoute: React.FC<StaffProtectedRouteProps> = ({ requiredRole, children }) => {
  const { activeStaffAccount, isStaffAccountsLoaded } = useApp();

  if (!isStaffAccountsLoaded) {
    return (
      <div className="min-h-screen bg-[#FAF8F3] flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-[#173F35] border-t-[#F59E0B] animate-spin" />
          <span className="text-xs font-semibold text-[#59635E]">Tekshirilmoqda...</span>
        </div>
      </div>
    );
  }

  if (
    !activeStaffAccount ||
    activeStaffAccount.status !== 'active' ||
    activeStaffAccount.role !== requiredRole
  ) {
    return <Navigate to={`/login?role=${requiredRole}`} replace />;
  }

  return children;
};

export default function App() {
  return (
    <LanguageProvider>
      <BrowserRouter>
        <AppProvider>
        <Routes>
          {/* Root / opens Staff & Admin Login/Register Portal; QR codes go straight to /t/:tableNum */}
          <Route path="/" element={<LoginPage />} />
          <Route path="/login" element={<LoginPage />} />

          {/* Pure Customer QR Routes (Instant locked menu, zero staff UI) */}
          <Route path="/t/:tableNum" element={<MenuPage />} />
          <Route path="/t/:tableNum/*" element={<MenuPage />} />
          <Route path="/table/:tableNum" element={<MenuPage />} />
          <Route path="/menu" element={<MenuPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/orders" element={<OrderTrackPage />} />
          <Route path="/account" element={<AccountPage />} />

          {/* Waiter & Kitchen Terminals (Strictly protected — require role account + PIN) */}
          <Route
            path="/waiter"
            element={
              <StaffProtectedRoute requiredRole="waiter">
                <WaiterDashboard />
              </StaffProtectedRoute>
            }
          />
          <Route
            path="/kitchen"
            element={
              <StaffProtectedRoute requiredRole="kitchen">
                <KitchenDisplayPage />
              </StaffProtectedRoute>
            }
          />

          {/* Admin Suite (Strictly protected — require admin account + PIN) */}
          <Route
            path="/admin"
            element={
              <StaffProtectedRoute requiredRole="admin">
                <AdminDashboard />
              </StaffProtectedRoute>
            }
          />
          <Route
            path="/admin/tables"
            element={
              <StaffProtectedRoute requiredRole="admin">
                <TableManagementPage />
              </StaffProtectedRoute>
            }
          />
          <Route
            path="/admin/menu"
            element={
              <StaffProtectedRoute requiredRole="admin">
                <MenuManagementPage />
              </StaffProtectedRoute>
            }
          />
          <Route
            path="/admin/orders"
            element={
              <StaffProtectedRoute requiredRole="admin">
                <OrdersHistoryPage />
              </StaffProtectedRoute>
            }
          />
          <Route
            path="/admin/reports"
            element={
              <StaffProtectedRoute requiredRole="admin">
                <ReportsPage />
              </StaffProtectedRoute>
            }
          />
          <Route
            path="/admin/export-reports"
            element={
              <StaffProtectedRoute requiredRole="admin">
                <ExportReportsPage />
              </StaffProtectedRoute>
            }
          />
          <Route
            path="/admin/market-benchmark"
            element={
              <StaffProtectedRoute requiredRole="admin">
                <MarketBenchmarkPage />
              </StaffProtectedRoute>
            }
          />
          <Route
            path="/admin/kitchen-efficiency"
            element={
              <StaffProtectedRoute requiredRole="admin">
                <KitchenEfficiencyPage />
              </StaffProtectedRoute>
            }
          />
          <Route
            path="/admin/customers"
            element={
              <StaffProtectedRoute requiredRole="admin">
                <CustomersManagementPage />
              </StaffProtectedRoute>
            }
          />
          <Route
            path="/admin/waiters"
            element={
              <StaffProtectedRoute requiredRole="admin">
                <StaffManagementPage />
              </StaffProtectedRoute>
            }
          />
          <Route
            path="/admin/staff"
            element={
              <StaffProtectedRoute requiredRole="admin">
                <StaffManagementPage />
              </StaffProtectedRoute>
            }
          />
          <Route
            path="/admin/settings"
            element={
              <StaffProtectedRoute requiredRole="admin">
                <SettingsPage />
              </StaffProtectedRoute>
            }
          />
          <Route
            path="/admin/panel-settings"
            element={
              <StaffProtectedRoute requiredRole="admin">
                <SettingsPage />
              </StaffProtectedRoute>
            }
          />

          {/* Catch-all redirect to Staff/Admin login */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>

        {/* Customer Personal Cabinet / 1st-time Guest Auth Modal */}
        <CustomerAuthModal />

          {/* Staff Account Create / Edit Modal (Admin, Waiter, Chef) */}
          <StaffAccountModal />

          {/* First-Entry Language Picker (Customer, Admin, Waiter, Chef) */}
          <LanguageEntryModal />
        </AppProvider>
      </BrowserRouter>
    </LanguageProvider>
  );
}
