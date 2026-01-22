/* ==================================
 * FILE: src/App.jsx
 * ================================== */

import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

/* ===== ADMIN AUTH PAGES ===== */
import AdminLoginPage from './pages/AdminLoginPage.jsx';
import AdminDashboardPage from './pages/AdminDashboardPage.jsx';
import OrdersPage from './pages/OrdersPage.jsx';
import RevenuePage from './pages/RevenuePage.jsx';
import AdminFeedbackPage from './pages/AdminFeedbackPage.jsx';
import AdminAdvertisementPage from './pages/AdminAdvertisementPage.jsx';

/* ===== MENU FORM ===== */
import AdminMenuFormPage from './pages/AdminMenuFormPage.jsx';

/* ===== ✅ NEW OFFERS PAGE ===== */
import AdminOffersPage from './pages/AdminOffersPage.jsx';

/* ===== PROTECTED ROUTE ===== */
const AdminProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('admin_token');
  return token ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <Routes>
      {/* ===== DEFAULT ===== */}
      <Route path="/" element={<Navigate to="/login" />} />
      <Route path="/login" element={<AdminLoginPage />} />

      {/* ===== ADMIN DASHBOARD ===== */}
      <Route
        path="/menu"
        element={
          <AdminProtectedRoute>
            <AdminDashboardPage />
          </AdminProtectedRoute>
        }
      />

      {/* ===== MENU CREATE / EDIT ===== */}
      <Route
        path="/admin/menu/add"
        element={
          <AdminProtectedRoute>
            <AdminMenuFormPage />
          </AdminProtectedRoute>
        }
      />

      <Route
        path="/admin/menu/edit/:id"
        element={
          <AdminProtectedRoute>
            <AdminMenuFormPage />
          </AdminProtectedRoute>
        }
      />

      {/* ===== ✅ OFFERS MANAGEMENT ===== */}
      <Route
        path="/admin/offers"
        element={
          <AdminProtectedRoute>
            <AdminOffersPage />
          </AdminProtectedRoute>
        }
      />

      {/* ===== ORDERS ===== */}
      <Route
        path="/orders"
        element={
          <AdminProtectedRoute>
            <OrdersPage />
          </AdminProtectedRoute>
        }
      />

      {/* ===== REVENUE ===== */}
      <Route
        path="/revenue"
        element={
          <AdminProtectedRoute>
            <RevenuePage />
          </AdminProtectedRoute>
        }
      />

      {/* ===== FEEDBACK ===== */}
      <Route
        path="/feedback"
        element={
          <AdminProtectedRoute>
            <AdminFeedbackPage />
          </AdminProtectedRoute>
        }
      />

      {/* ===== ADS ===== */}
      <Route
        path="/advertisement"
        element={
          <AdminProtectedRoute>
            <AdminAdvertisementPage />
          </AdminProtectedRoute>
        }
      />

      {/* ===== FALLBACK ===== */}
      <Route path="/dashboard" element={<Navigate to="/menu" />} />
    </Routes>
  );
}

export default App;
