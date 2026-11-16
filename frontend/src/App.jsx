import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { useAuth } from './hooks/useAuth';
import { AppLayout } from './components/layout/AppLayout';
import { Spinner } from './components/ui/Spinner';
import { ROLES } from './utils/constants';

// Pages
import { LoginPage } from './pages/auth/LoginPage';
import { DashboardPage } from './pages/dashboard/DashboardPage';
import { ProductListPage } from './pages/products/ProductListPage';
import { ProductDetailPage } from './pages/products/ProductDetailPage';
import { CategoryListPage } from './pages/categories/CategoryListPage';
import { SupplierListPage } from './pages/suppliers/SupplierListPage';
import { SupplierDetailPage } from './pages/suppliers/SupplierDetailPage';
import { StockInListPage } from './pages/stockIn/StockInListPage';
import { CreateStockInPage } from './pages/stockIn/CreateStockInPage';
import { StockInDetailPage } from './pages/stockIn/StockInDetailPage';
import { StockOutListPage } from './pages/stockOut/StockOutListPage';
import { CreateStockOutPage } from './pages/stockOut/CreateStockOutPage';
import { StockOutDetailPage } from './pages/stockOut/StockOutDetailPage';
import { StockMovementListPage } from './pages/stockMovements/StockMovementListPage';
import { StockMovementDetailPage } from './pages/stockMovements/StockMovementDetailPage';
import { ReportsPage } from './pages/reports/ReportsPage';
import { UserListPage } from './pages/users/UserListPage';
import { ProfilePage } from './pages/account/ProfilePage';
import { SettingsPage } from './pages/account/SettingsPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { UnauthorizedPage } from './pages/UnauthorizedPage';

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F5F7]">
        <Spinner message="Memeriksa autentikasi..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function RoleRoute({ allowedRoles, children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F5F7]">
        <Spinner message="Memverifikasi izin akses..." />
      </div>
    );
  }

  if (!user || !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<LoginPage />} />

        {/* Protected Dashboard Shell */}
        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />

          {/* Products */}
          <Route path="/products" element={<ProductListPage />} />
          <Route path="/products/:id" element={<ProductDetailPage />} />

          {/* Categories */}
          <Route path="/categories" element={<CategoryListPage />} />

          {/* Suppliers */}
          <Route path="/suppliers" element={<SupplierListPage />} />
          <Route path="/suppliers/:id" element={<SupplierDetailPage />} />

          {/* Stock In */}
          <Route path="/stock-in" element={<StockInListPage />} />
          <Route
            path="/stock-in/create"
            element={
              <RoleRoute allowedRoles={[ROLES.ADMIN, ROLES.STAFF]}>
                <CreateStockInPage />
              </RoleRoute>
            }
          />
          <Route path="/stock-in/:id" element={<StockInDetailPage />} />

          {/* Stock Out */}
          <Route path="/stock-out" element={<StockOutListPage />} />
          <Route
            path="/stock-out/create"
            element={
              <RoleRoute allowedRoles={[ROLES.ADMIN, ROLES.STAFF]}>
                <CreateStockOutPage />
              </RoleRoute>
            }
          />
          <Route path="/stock-out/:id" element={<StockOutDetailPage />} />

          {/* Stock Movement */}
          <Route path="/stock-movements" element={<StockMovementListPage />} />
          <Route path="/stock-movements/:id" element={<StockMovementDetailPage />} />

          {/* Reports */}
          <Route
            path="/reports"
            element={
              <RoleRoute allowedRoles={[ROLES.ADMIN, ROLES.MANAGER]}>
                <ReportsPage />
              </RoleRoute>
            }
          />

          {/* Users */}
          <Route
            path="/users"
            element={
              <RoleRoute allowedRoles={[ROLES.ADMIN]}>
                <UserListPage />
              </RoleRoute>
            }
          />

          {/* Account */}
          <Route path="/profile" element={<ProfilePage />} />
          <Route
            path="/settings"
            element={
              <RoleRoute allowedRoles={[ROLES.ADMIN]}>
                <SettingsPage />
              </RoleRoute>
            }
          />

          {/* Status Pages */}
          <Route path="/unauthorized" element={<UnauthorizedPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </AuthProvider>
  );
}
