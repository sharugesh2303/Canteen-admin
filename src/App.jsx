/* ==================================
 * FILE: src/App.jsx
 * ================================== */

import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom'; 
import AdminLoginPage from './pages/AdminLoginPage.jsx';
import AdminDashboardPage from './pages/AdminDashboardPage.jsx';
import OrdersPage from './pages/OrdersPage.jsx';
import RevenuePage from './pages/RevenuePage.jsx';
import AdminFeedbackPage from './pages/AdminFeedbackPage.jsx';
import AdminAdvertisementPage from './pages/AdminAdvertisementPage.jsx';

// --- 1. IMPORT YOUR NEW FORM PAGE ---
import AdminMenuFormPage from './pages/AdminMenuFormPage.jsx';

// Helper component to protect admin routes
const AdminProtectedRoute = ({ children }) => {
    const token = localStorage.getItem('admin_token');
    return token ? children : <Navigate to="/login" />;
};

function App() {
    return (
        <Routes>
            <Route path="/" element={<Navigate to="/login" />} />
            <Route path="/login" element={<AdminLoginPage />} />

            <Route 
                path="/menu" 
                element={<AdminProtectedRoute><AdminDashboardPage /></AdminProtectedRoute>} 
            />
            
            {/* --- 2. ADD THE NEW ROUTES FOR THE FORM PAGE --- */}
            <Route 
                path="/admin/menu/add" 
                element={<AdminProtectedRoute><AdminMenuFormPage /></AdminProtectedRoute>} 
            />
            <Route 
                path="/admin/menu/edit/:id" 
                element={<AdminProtectedRoute><AdminMenuFormPage /></AdminProtectedRoute>} 
            />
            {/* --- END OF NEW ROUTES --- */}

            <Route 
                path="/orders" 
                element={<AdminProtectedRoute><OrdersPage /></AdminProtectedRoute>} 
            />

            <Route 
                path="/revenue" 
                element={<AdminProtectedRoute><RevenuePage /></AdminProtectedRoute>} 
            />

            <Route 
                path="/feedback" 
                element={<AdminProtectedRoute><AdminFeedbackPage /></AdminProtectedRoute>} 
            />
            <Route 
                path="/advertisement" 
                element={<AdminProtectedRoute><AdminAdvertisementPage /></AdminProtectedRoute>} 
            />

            <Route path="/dashboard" element={<Navigate to="/menu" />} />
        </Routes>
    );
}

export default App;