import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LuLogOut } from 'react-icons/lu';
import { VscFeedback } from "react-icons/vsc";
import FeedbackModal from '../components/FeedbackDetailModal'; // Import the new modal

const AdminLayout = () => {
    const navigate = useNavigate();
    const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);

    const handleLogout = () => {
        localStorage.removeItem('admin_token');
        navigate('/login');
    };

    // Style for active NavLink
    const activeLinkStyle = {
        color: 'white',
        fontWeight: 'bold',
    };

    return (
        <div className="min-h-screen bg-gray-100">
            <header className="bg-gray-800 text-white shadow-md p-4 flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold">Admin Dashboard</h1>
                    <p className="text-sm">JJ Smart Canteen</p>
                </div>
                <nav className="flex items-center space-x-6">
                    <NavLink to="/menu" style={({ isActive }) => isActive ? activeLinkStyle : undefined} className="text-gray-300 hover:text-white transition">Menu</NavLink>
                    <NavLink to="/orders" style={({ isActive }) => isActive ? activeLinkStyle : undefined} className="text-gray-300 hover:text-white transition">Orders</NavLink>
                    <NavLink to="/revenue" style={({ isActive }) => isActive ? activeLinkStyle : undefined} className="text-gray-300 hover:text-white transition">Revenue</NavLink>
                    <button onClick={() => setIsFeedbackModalOpen(true)} className="text-gray-300 hover:text-white transition flex items-center space-x-2">
                        <VscFeedback />
                        <span>Feedback</span>
                    </button>
                    <button onClick={handleLogout} className="bg-red-500 font-semibold py-2 px-4 rounded-lg hover:bg-red-600 transition duration-300 flex items-center space-x-2">
                        <LuLogOut />
                        <span>Log Out</span>
                    </button>
                </nav>
            </header>
            
            {/* This will render the specific page content (e.g., AdminDashboardPage) */}
            <main>
                <Outlet />
            </main>

            {/* The Feedback Modal is rendered here, controlled by the layout */}
            <FeedbackModal isOpen={isFeedbackModalOpen} onClose={() => setIsFeedbackModalOpen(false)} />
        </div>
    );
};

export default AdminLayout;