/* =======================================
 * FILE: src/pages/AdminFeedbackPage.jsx
 * ======================================= */

import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
// Icons for Header and Sidebar
import { LuLogOut, LuMenu, LuX, LuMailCheck } from 'react-icons/lu';
import { VscFeedback } from "react-icons/vsc";
import { MdCampaign } from "react-icons/md";
// Icons for Page and Sidebar
import { FaPlusCircle, FaUtensils, FaClipboardList, FaChartLine } from 'react-icons/fa';
// Modal Component
import FeedbackDetailModal from '../components/FeedbackDetailModal'; 

// ================================================
// !!! VERCEL DEPLOYMENT FIX: API URLS !!!
// ================================================
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:10000/api';
// ================================================
// !!! END OF FIX !!!
// ================================================

const POLLING_INTERVAL = 15 * 1000; // 15 seconds

// --- SparkleOverlay Component (from Dashboard) ---
const SparkleOverlay = () => {
    const random = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
    const sparks = Array.from({ length: 40 }).map((_, i) => {
        const style = {
            '--x': `${random(-150, 150)}vw`, '--y': `${random(-150, 150)}vh`,
            '--duration': `${random(8, 20)}s`, '--delay': `${random(1, 10)}s`,
            '--size': `${random(1, 3)}px`,
        };
        return <div key={i} className="spark" style={style}></div>;
    });
    return (
        <>
            <style>{`
                @keyframes sparkle-animation { 0% { transform: scale(0) translate(0, 0); opacity: 0; } 50% { opacity: 1; } 100% { transform: scale(1) translate(var(--x), var(--y)); opacity: 0; } }
                .sparkle-container { position: fixed; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 0; overflow: hidden; }
                .spark { position: absolute; top: 50%; left: 50%; width: var(--size); height: var(--size); background-color: #fbbF24; border-radius: 50%; animation: sparkle-animation var(--duration) var(--delay) infinite linear; box-shadow: 0 0 4px #fbbF24, 0 0 8px #fbbF24; }
            `}</style>
            <div className="sparkle-container">{sparks}</div>
        </>
    );
};

// --- RealTimeClock Component (from Dashboard) ---
const RealTimeClock = () => {
    const [time, setTime] = useState(new Date());
    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);
    const formattedTime = time.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
    return (
        <div className="text-right mt-1 px-4 md:px-8">
            <p className="text-sm text-slate-400 font-medium leading-none">Current Time:</p>
            <p className="text-lg font-extrabold text-orange-400 leading-none">{formattedTime}</p>
        </div>
    );
};

// --- AdminSidebarNav Component (from Dashboard) ---
const AdminSidebarNav = ({ onClose }) => {
    const navigate = useNavigate();
    const NavItem = ({ to, icon: Icon, name, isActive = false }) => (
        <Link to={to} className="block w-full" onClick={onClose}>
            <button className={`w-full flex items-center p-3 rounded-lg transition-colors duration-200 space-x-3 text-left ${
                isActive ? 'bg-orange-500 text-white shadow-lg' : 'text-slate-300 hover:bg-slate-700 hover:text-orange-400'
            }`}>
                <Icon size={20} className="flex-shrink-0" />
                <span className="font-semibold">{name}</span>
            </button>
        </Link>
    );

    return (
        <div className="space-y-2 p-4 pt-0">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-3 border-b border-slate-700 pb-2">Actions</h3>
            <NavItem to="/menu" icon={FaUtensils} name="Menu Management" />
            <NavItem to="/orders" icon={FaClipboardList} name="Orders" />
            <NavItem to="/revenue" icon={FaChartLine} name="Revenue & Sales" />
            <NavItem to="/feedback" icon={VscFeedback} name="Student Feedback" isActive={true} />
            <NavItem to="/advertisement" icon={MdCampaign} name="Ads Management" />
            
            <div className="pt-4 border-t border-slate-700 mt-4">
                <button 
                    onClick={() => { navigate('/admin/menu/add'); onClose(); }} 
                    className="w-full flex items-center p-3 rounded-lg transition-colors duration-200 space-x-3 text-left bg-green-600 text-white hover:bg-green-700 shadow-md"
                >
                    <FaPlusCircle size={20} className="flex-shrink-0" />
                    <span className="font-bold">Add New Menu Item</span>
                </button>
            </div>
        </div>
    );
};


// --- AdminFeedbackPage Component ---
const AdminFeedbackPage = () => {
    const navigate = useNavigate();
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [isCanteenOpen, setIsCanteenOpen] = useState(true);

    // --- State specific to Feedback Page ---
    const [feedbacks, setFeedbacks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedFeedback, setSelectedFeedback] = useState(null);

    // --- Auth Header (FIXED) ---
    const getAdminAuthHeaders = (token) => ({
        'Authorization': `Bearer ${token}`, // Use Bearer token
        'Content-Type': 'application/json',
    });

    // --- Canteen Status Functions (from Dashboard Header) ---
    const fetchCanteenStatus = async () => {
        try {
            // Use API_BASE_URL
            const res = await axios.get(`${API_BASE_URL}/canteen-status/public`);
            setIsCanteenOpen(res.data.isOpen);
        } catch (err) { console.warn("Could not fetch canteen status."); }
    };
    
    const handleToggleCanteen = async () => {
        const token = localStorage.getItem('admin_token');
        if (!token) { navigate('/login'); return; }
        try {
            // Use API_BASE_URL
            const response = await axios.patch(`${API_BASE_URL}/admin/canteen-status`, {}, { headers: getAdminAuthHeaders(token) });
            setIsCanteenOpen(response.data.isOpen);
            alert(`Canteen status set to ${response.data.isOpen ? 'OPEN' : 'CLOSED'}.`);
        } catch (error) {
            alert('Failed to update canteen status.');
        }
    };

    // --- Logout Function (from Dashboard Header) ---
    const handleLogout = () => { 
        localStorage.removeItem('admin_token'); 
        navigate('/login'); 
    };

    // --- Feedback Page Functions ---
    const fetchFeedbacks = async () => {
        setLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem('admin_token');
            if (!token) { navigate('/login'); return; }
            
            // Use API_BASE_URL and correct headers
            const response = await axios.get(`${API_BASE_URL}/admin/feedback`, {
                headers: getAdminAuthHeaders(token), // Use correct helper
            });
            
            // Filter for unread feedback only
            const unreadFeedback = response.data.filter(fb => !fb.isRead);

            // Sort by date (newest first)
            const sortedFeedback = unreadFeedback.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            
            setFeedbacks(sortedFeedback);
        } catch (err) {
            setError('Failed to fetch feedback.');
            console.error(err);
            if (err.response?.status === 401) {
                alert('Session expired. Please log in again.');
                handleLogout();
            }
        } finally {
            setLoading(false);
        }
    };

    // --- Mark as read now FILTERS the item from state ---
    const handleMarkAsRead = async (feedbackId) => {
        try {
            const token = localStorage.getItem('admin_token');
            if (!token) { navigate('/login'); return; }
            
            // Optimistic UI update: Remove from state immediately
            setFeedbacks(prevFeedbacks =>
                prevFeedbacks.filter(fb => fb._id !== feedbackId)
            );
            
            // Make API call in the background
            // Use API_BASE_URL and correct headers
            await axios.patch(`${API_BASE_URL}/admin/feedback/${feedbackId}/read`, {}, {
                headers: getAdminAuthHeaders(token), // Use correct helper
            });
        } catch (err) {
            console.error("Failed to mark as read.", err);
            // Re-fetch if API call fails to get correct state
            fetchFeedbacks();
        }
    };

    // --- Mark all items as read ---
    const handleMarkAllAsRead = async () => {
        if (window.confirm('Are you sure you want to mark all feedback as read?')) {
            try {
                const token = localStorage.getItem('admin_token');
                if (!token) { navigate('/login'); return; }
                
                // Optimistic UI update: Clear state immediately
                setFeedbacks([]);
                
                // Use API_BASE_URL and correct headers
                await axios.post(`${API_BASE_URL}/admin/feedback/mark-all-read`, {}, {
                    headers: getAdminAuthHeaders(token), // Use correct helper
                });
                
                // Refetch just in case new feedback arrived during the API call
                fetchFeedbacks();
            } catch (err) {
                alert('Failed to mark all as read.');
                console.error(err);
                // Refetch to get correct state if API call failed
                fetchFeedbacks();
            }
        }
    };

    // --- Handle viewing details (and mark as read) ---
    const handleViewDetails = (fb) => {
        // Mark as read (which will remove it from the list)
        handleMarkAsRead(fb._id);
        // Open the modal
        setSelectedFeedback(fb);
    };

    // Main useEffect
    useEffect(() => {
        const token = localStorage.getItem('admin_token');
        if (!token) {
            navigate('/login');
            return;
        }
        fetchCanteenStatus();
        fetchFeedbacks();
        const interval = setInterval(fetchCanteenStatus, POLLING_INTERVAL);
        return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [navigate]); 

    // Unread count is now just the length of the state array
    const unreadCount = feedbacks.length;

    // New function to render the feedback cards cleanly
    const renderFeedbackCards = () => {
        if (loading) {
            return (
                <div className="text-center p-10 font-semibold text-slate-400 flex justify-center items-center space-x-2">
                    <svg className="animate-spin h-5 w-5 text-orange-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"> <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    <span>Loading feedback...</span>
                </div>
            );
        }
        if (error) {
            return <p className="text-red-400 text-center">{error}</p>;
        }
        if (unreadCount === 0) {
            return <p className="text-slate-400 text-lg text-center">No new feedback. You're all caught up!</p>;
        }

        return (
            <div className="space-y-4">
                {/* This only maps unread items */}
                {feedbacks.map((fb) => (
                    <div 
                        key={fb._id} 
                        className="bg-slate-700 p-5 rounded-lg shadow-lg border-l-4 border-orange-500 hover:bg-slate-700/80 cursor-pointer transition-all duration-300 active:scale-[0.99] relative"
                        onClick={() => handleViewDetails(fb)}
                    >
                        {/* "NEW" badge */}
                        <span className="absolute -top-2 -right-2 px-2 py-0.5 bg-blue-600 text-white text-xs font-bold rounded-full">
                            NEW
                        </span>

                        <p className="text-slate-100 font-medium text-lg truncate">"{fb.feedbackText}"</p>
                        
                        <div className="flex justify-between items-center mt-3 pt-2 border-t border-slate-600/50">
                            <p className="font-bold text-orange-400">
                                {fb.studentName}
                            </p>
                            <p className="text-sm text-slate-400">
                                {new Date(fb.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    // --- Render ---
    return (
        <div className="min-h-screen bg-slate-900 font-sans relative flex">
            <SparkleOverlay />
            
            {/* --- MOBILE DRAWER/OVERLAY (from Dashboard) --- */}
            <div 
                className={`fixed inset-0 z-40 md:hidden transition-all duration-300 ${isDrawerOpen ? 'bg-black/50 pointer-events-auto' : 'bg-black/0 pointer-events-none'}`}
                onClick={() => setIsDrawerOpen(false)}
            >
                <div 
                    className={`absolute left-0 top-0 w-64 h-full bg-slate-800 shadow-2xl transition-transform duration-300 ${isDrawerOpen ? 'translate-x-0' : '-translate-x-full'}`}
                    onClick={e => e.stopPropagation()} 
                >
                    <div className="p-4 flex justify-between items-center border-b border-slate-700">
                        <h3 className="text-xl font-bold text-orange-400">Admin Menu</h3>
                        <button onClick={() => setIsDrawerOpen(false)} className="text-slate-400 hover:text-white">
                            <LuX size={24} />
                        </button>
                    </div>
                    <AdminSidebarNav onClose={() => setIsDrawerOpen(false)} />
                </div>
            </div>

            {/* --- DESKTOP SIDEBAR (from Dashboard) --- */}
            <aside className="hidden md:block w-64 bg-slate-800 border-r border-slate-700 sticky top-0 h-screen overflow-y-auto flex-shrink-0 z-20">
                <div className="p-4 py-6">
                    <h1 className="text-2xl font-extrabold text-orange-400">Admin Portal</h1>
                </div>
                <AdminSidebarNav onClose={() => {}} />
            </aside>

            {/* --- MAIN CONTENT AREA (from Dashboard) --- */}
            <div className="flex-grow relative z-10 min-h-screen">
                
                {/* --- HEADER (from Dashboard) --- */}
                <header className="bg-gray-900 text-white shadow-lg p-4 flex justify-between items-center sticky top-0 z-30 border-b border-slate-700">
                    <div className="flex items-center space-x-3">
                        {/* Hamburger Button for mobile */}
                        <button className="md:hidden text-white" onClick={() => setIsDrawerOpen(true)}>
                            <LuMenu size={24} />
                        </button>
                        <div className="text-xl font-extrabold text-orange-400 hidden md:block">JJ College Smart Canteen</div>
                        <div className="text-xl font-extrabold text-orange-400 md:hidden">Canteen Admin</div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                        {/* Status Toggle */}
                        <div className="flex items-center space-x-2">
                            <span className="text-sm font-semibold text-slate-300 hidden sm:inline">Status:</span>
                            <button onClick={handleToggleCanteen} className={`px-3 py-1 rounded-full font-bold transition-all shadow-md active:scale-95 text-sm flex items-center ${isCanteenOpen ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}> {isCanteenOpen ? 'ON' : 'OFF'} </button>
                        </div>
                        {/* Logout */}
                        <button onClick={handleLogout} className="bg-red-600 font-semibold py-2 px-4 rounded-lg transition duration-300 hover:bg-red-700 flex items-center space-x-2 shadow-md active:scale-95">
                            <LuLogOut size={18} /><span>Log Out</span>
                        </button>
                    </div>
                </header>
                <RealTimeClock />

                {/* --- MAIN CONTENT (Feedback Page Content) --- */}
                <main className="container mx-auto p-4 md:p-8">
                
                    {/* --- Header with Mark All as Read button --- */}
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-8 gap-4">
                        <h2 className="text-4xl font-bold text-slate-100">Customer Feedback Inbox</h2>
                        {unreadCount > 0 && (
                            <button 
                                onClick={handleMarkAllAsRead}
                                className="bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-700 transition active:scale-95 flex items-center justify-center space-x-2 shadow-md shadow-blue-500/30"
                            >
                                <LuMailCheck size={18} />
                                <span>Mark All as Read ({unreadCount})</span>
                            </button>
                        )}
                    </div>
                    
                    <div className="bg-slate-800 p-6 rounded-xl shadow-2xl max-w-5xl mx-auto border border-slate-700">
                        {/* Render the feedback cards via the dedicated function call */}
                        {renderFeedbackCards()}
                    </div>
                </main>

                {/* Modal for displaying full feedback */}
                <FeedbackDetailModal 
                    feedback={selectedFeedback} 
                    onClose={() => setSelectedFeedback(null)} 
                />
            </div>
        </div>
    );
};

export default AdminFeedbackPage;