/* =======================================
 * FILE: src/pages/AdminFeedbackPage.jsx
 * ======================================= */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

// Icons
import { LuLogOut, LuMenu, LuX, LuStore, LuCoffee, LuTrash2 } from 'react-icons/lu';
import { VscFeedback } from "react-icons/vsc";
import { MdCampaign, MdLocalOffer } from "react-icons/md";
import { FaPlusCircle, FaUtensils, FaClipboardList, FaChartLine, FaArrowLeft } from 'react-icons/fa';

/* ================= API CONFIG ================= */
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:10000/api';
const POLLING_INTERVAL = 15 * 1000;

const getAdminAuthHeaders = (token) => ({
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
});

/* ================= SHARED UI COMPONENTS ================= */
const SparkleOverlay = () => {
    const random = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
    const sparks = Array.from({ length: 40 }).map((_, i) => ({
        '--x': `${random(-150, 150)}vw`,
        '--y': `${random(-150, 150)}vh`,
        '--duration': `${random(8, 20)}s`,
        '--delay': `${random(1, 10)}s`,
        '--size': `${random(1, 3)}px`,
    }));
    return (
        <>
            <style>{`
                @keyframes sparkle-animation { 0% { transform: scale(0) translate(0, 0); opacity: 0; } 50% { opacity: 1; } 100% { transform: scale(1) translate(var(--x), var(--y)); opacity: 0; } }
                .sparkle-container { position: fixed; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 0; overflow: hidden; }
                .spark { position: absolute; top: 50%; left: 50%; width: var(--size); height: var(--size); background-color: #fbbF24; border-radius: 50%; animation: sparkle-animation var(--duration) var(--delay) infinite linear; box-shadow: 0 0 4px #fbbF24, 0 0 8px #fbbF24; }
            `}</style>
            <div className="sparkle-container">{sparks.map((style, i) => <div key={i} className="spark" style={style}></div>)}</div>
        </>
    );
};

const RealTimeClock = () => {
    const [time, setTime] = useState(new Date());
    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);
    return (
        <div className="text-right mt-1 px-4 md:px-8">
            <p className="text-sm text-slate-400 font-medium leading-none">Current Time:</p>
            <p className="text-lg font-extrabold text-orange-400 leading-none">
                {time.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
            </p>
        </div>
    );
};

const AdminSidebarNav = ({ onClose, serviceMode }) => {
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
        <div className="space-y-2 p-4 pt-0 text-white">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-3 border-b border-slate-700 pb-2">Actions</h3>
            <NavItem to="/menu" icon={FaUtensils} name="Menu Management" />
            <NavItem to="/orders" icon={FaClipboardList} name="Orders" />
            <NavItem to="/revenue" icon={FaChartLine} name="Revenue & Sales" />
            <NavItem to="/admin/offers" icon={MdLocalOffer} name="Offers & Discounts" />
            <NavItem to="/feedback" icon={VscFeedback} name="Student Feedback" isActive={true} />
            <NavItem to="/advertisement" icon={MdCampaign} name="Ads Management" />
            <div className="pt-4 border-t border-slate-700 mt-4">
                <button onClick={() => { navigate(`/admin/menu/add?location=${serviceMode}`); onClose(); }} 
                        className="w-full flex items-center p-3 rounded-lg transition-colors duration-200 space-x-3 text-left bg-green-600 text-white hover:bg-green-700 shadow-md">
                    <FaPlusCircle size={20} className="flex-shrink-0" />
                    <span className="font-bold">Add to {serviceMode === 'cafeteria' ? 'Cafeteria' : 'Canteen'}</span>
                </button>
            </div>
        </div>
    );
};

/* ================= PAGE COMPONENT ================= */
const AdminFeedbackPage = () => {
    const navigate = useNavigate();
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [serviceMode, setServiceMode] = useState(localStorage.getItem('admin_service_mode') || 'canteen');
    const [feedbacks, setFeedbacks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedFeedback, setSelectedFeedback] = useState(null);

    const handleLogout = useCallback(() => {
        localStorage.removeItem('admin_token');
        navigate('/login');
    }, [navigate]);

    const fetchFeedbacks = useCallback(async () => {
        const token = localStorage.getItem('admin_token');
        if (!token) return handleLogout();

        try {
            setLoading(true);
            // Added ?location query to match Canteen/Cafeteria switch
            const res = await axios.get(`${API_BASE_URL}/admin/feedback?location=${serviceMode}`, {
                headers: getAdminAuthHeaders(token)
            });
            setFeedbacks(res.data);
        } catch (err) {
            console.error(err);
            if (err.response?.status === 401) handleLogout();
        } finally {
            setLoading(false);
        }
    }, [serviceMode, handleLogout]);

    useEffect(() => {
        fetchFeedbacks();
        const interval = setInterval(fetchFeedbacks, POLLING_INTERVAL);
        return () => clearInterval(interval);
    }, [fetchFeedbacks]);

    const handleModeChange = (newMode) => {
        setServiceMode(newMode);
        localStorage.setItem('admin_service_mode', newMode);
        setSelectedFeedback(null);
    };

    const markAsRead = async (id) => {
        const token = localStorage.getItem('admin_token');
        try {
            await axios.patch(`${API_BASE_URL}/admin/feedback/${id}/read`, {}, {
                headers: getAdminAuthHeaders(token)
            });
            setFeedbacks(prev => prev.map(fb => fb._id === id ? { ...fb, isRead: true } : fb));
        } catch (err) { console.error("Mark read failed", err); }
    };

    const deleteFeedback = async (id) => {
        if (!window.confirm("Delete this feedback permanently?")) return;
        const token = localStorage.getItem('admin_token');
        try {
            await axios.delete(`${API_BASE_URL}/admin/feedback/${id}`, {
                headers: getAdminAuthHeaders(token)
            });
            setFeedbacks(prev => prev.filter(fb => fb._id !== id));
            setSelectedFeedback(null);
        } catch (err) { console.error("Delete failed", err); }
    };

    const deleteAllFeedback = async () => {
        if (!window.confirm(`⚠️ Delete ALL ${serviceMode} feedback permanently?`)) return;
        const token = localStorage.getItem('admin_token');
        try {
            await axios.delete(`${API_BASE_URL}/admin/feedback/delete-all?location=${serviceMode}`, {
                headers: getAdminAuthHeaders(token)
            });
            setFeedbacks([]);
            setSelectedFeedback(null);
        } catch (err) { console.error("Delete all failed", err); }
    };

    return (
        <div className="min-h-screen bg-slate-900 font-sans relative flex text-white">
            <SparkleOverlay />

            {/* MOBILE DRAWER */}
            <div className={`fixed inset-0 z-40 md:hidden transition-all ${isDrawerOpen ? 'bg-black/50 block' : 'hidden'}`} onClick={() => setIsDrawerOpen(false)}>
                <div className="w-64 h-full bg-slate-800 p-4 shadow-2xl" onClick={e => e.stopPropagation()}>
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-bold text-orange-400">Admin Menu</h3>
                        <button onClick={() => setIsDrawerOpen(false)}><LuX size={24} /></button>
                    </div>
                    <AdminSidebarNav onClose={() => setIsDrawerOpen(false)} serviceMode={serviceMode} />
                </div>
            </div>

            {/* DESKTOP SIDEBAR */}
            <aside className="hidden md:block w-64 bg-slate-800 border-r border-slate-700 sticky top-0 h-screen overflow-y-auto z-20">
                <div className="p-6">
                    <h1 className="text-2xl font-extrabold text-orange-400">Admin Portal</h1>
                    <div className={`mt-2 px-3 py-1 rounded-full text-[10px] font-black tracking-widest text-center uppercase border ${serviceMode === 'canteen' ? 'border-orange-500 text-orange-400 bg-orange-500/10' : 'border-blue-500 text-blue-400 bg-blue-500/10'}`}>
                        {serviceMode} Mode Active
                    </div>
                </div>
                <AdminSidebarNav onClose={() => {}} serviceMode={serviceMode} />
            </aside>

            {/* MAIN CONTENT AREA */}
            <div className="flex-grow relative z-10">
                <header className="bg-gray-900 text-white p-4 flex justify-between items-center sticky top-0 z-30 border-b border-slate-700">
                    <div className="flex items-center space-x-3">
                        <button className="md:hidden" onClick={() => setIsDrawerOpen(true)}><LuMenu size={24} /></button>
                        <div className="text-xl font-extrabold text-orange-400 italic tracking-tighter uppercase">JJ SMART DASHBOARD</div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                        <div className="flex items-center bg-slate-800 rounded-full p-1 border border-slate-700 shadow-inner">
                            <button onClick={() => handleModeChange('canteen')} className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-black transition-all duration-300 ${serviceMode === 'canteen' ? 'bg-orange-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}><LuStore size={14} /> CANTEEN</button>
                            <button onClick={() => handleModeChange('cafeteria')} className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-black transition-all duration-300 ${serviceMode === 'cafeteria' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}><LuCoffee size={14} /> CAFETERIA</button>
                        </div>
                        <button onClick={handleLogout} className="bg-red-600 font-semibold py-2 px-4 rounded-lg flex items-center space-x-2 hover:bg-red-700 transition-colors shadow-lg"><LuLogOut size={18} /><span className="hidden sm:inline">Log Out</span></button>
                    </div>
                </header>

                <RealTimeClock />

                <main className="container mx-auto p-4 md:p-8">
                    {/* HERO SECTION */}
                    <div className={`w-full h-48 md:h-64 mb-8 rounded-2xl flex flex-col items-center justify-center border transition-all duration-500 shadow-2xl backdrop-blur-sm ${serviceMode === 'canteen' ? 'bg-orange-900/10 border-orange-500/30' : 'bg-blue-900/10 border-blue-500/30'}`}>
                        <VscFeedback size={48} className={serviceMode === 'canteen' ? 'text-orange-500 mb-2' : 'text-blue-400 mb-2'} />
                        <p className={`text-4xl md:text-5xl font-black uppercase tracking-tighter text-center px-4 ${serviceMode === 'canteen' ? 'text-orange-500' : 'text-blue-400'}`}>{serviceMode} Feedback</p>
                        <p className="text-slate-400 font-bold mt-2 tracking-widest uppercase text-xs">Student Voice & Suggestions</p>
                    </div>

                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-3xl font-extrabold text-slate-100 flex items-center gap-3">
                            Inbox <span className="bg-slate-700 text-orange-400 text-sm py-1 px-3 rounded-full">{feedbacks.length}</span>
                        </h2>
                        {feedbacks.length > 0 && (
                            <button onClick={deleteAllFeedback} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-bold text-sm shadow-lg transition-all active:scale-95">
                                <LuTrash2 size={16} /> Delete All {serviceMode}
                            </button>
                        )}
                    </div>

                    {loading && feedbacks.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-4">
                            <div className={`w-12 h-12 border-4 border-t-transparent rounded-full animate-spin ${serviceMode === 'canteen' ? 'border-orange-500' : 'border-blue-500'}`}></div>
                            <p className="font-bold italic text-sm tracking-widest uppercase">Fetching {serviceMode} feedback...</p>
                        </div>
                    ) : feedbacks.length === 0 ? (
                        <div className="text-center py-20 bg-slate-800/50 rounded-2xl border border-dashed border-slate-700">
                            <VscFeedback size={64} className="mx-auto mb-4 opacity-10" />
                            <p className="text-slate-500 font-bold italic text-lg">No feedback found for {serviceMode}.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-4">
                            {feedbacks.map(fb => (
                                <div 
                                    key={fb._id}
                                    onClick={() => { setSelectedFeedback(fb); if (!fb.isRead) markAsRead(fb._id); }}
                                    className={`bg-slate-800 p-6 rounded-xl cursor-pointer transition-all border-l-8 hover:translate-x-1 shadow-lg ${fb.isRead ? 'border-slate-600 opacity-75' : 'border-orange-500'}`}
                                >
                                    <div className="flex justify-between items-start">
                                        <div className="max-w-2xl">
                                            <p className="text-slate-100 text-lg font-medium leading-relaxed italic mb-4">"{fb.feedbackText}"</p>
                                            <div className="flex flex-wrap gap-3 items-center text-sm">
                                                <span className="bg-slate-700 text-orange-400 px-3 py-1 rounded-md font-bold">{fb.studentName}</span>
                                                <span className="text-slate-500">•</span>
                                                <span className="text-slate-400">{fb.department}</span>
                                                <span className="text-slate-500">•</span>
                                                <span className="text-slate-400">{new Date(fb.createdAt).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                        {!fb.isRead && <span className="bg-orange-600 text-white text-[10px] font-black px-2 py-1 rounded uppercase tracking-tighter animate-pulse">New</span>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </main>

                {/* MODAL VIEW */}
                {selectedFeedback && (
                    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                        <div className="bg-slate-800 w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl border border-slate-700 animate-in zoom-in duration-200">
                            <div className="p-6 border-b border-slate-700 flex justify-between items-center bg-slate-900/50">
                                <h3 className="text-2xl font-black text-orange-400 uppercase tracking-tighter">Student Profile</h3>
                                <button onClick={() => setSelectedFeedback(null)} className="text-slate-400 hover:text-white transition-colors"><LuX size={28} /></button>
                            </div>
                            <div className="p-8 space-y-6">
                                <div className="grid grid-cols-2 gap-6 text-sm">
                                    <div><p className="text-slate-500 uppercase font-black text-[10px] tracking-widest mb-1">Full Name</p><p className="text-white font-bold text-lg">{selectedFeedback.studentName}</p></div>
                                    <div><p className="text-slate-500 uppercase font-black text-[10px] tracking-widest mb-1">Year of Study</p><p className="text-white font-bold text-lg">{selectedFeedback.year}</p></div>
                                    <div><p className="text-slate-500 uppercase font-black text-[10px] tracking-widest mb-1">Branch</p><p className="text-white font-bold text-lg">{selectedFeedback.branch}</p></div>
                                    <div><p className="text-slate-500 uppercase font-black text-[10px] tracking-widest mb-1">Department</p><p className="text-white font-bold text-lg">{selectedFeedback.department}</p></div>
                                </div>
                                <div className="p-6 bg-slate-900 rounded-xl border border-slate-700">
                                    <p className="text-slate-500 uppercase font-black text-[10px] tracking-widest mb-3">Feedback Message</p>
                                    <p className="text-slate-100 text-lg leading-relaxed italic">"{selectedFeedback.feedbackText}"</p>
                                </div>
                                <div className="flex justify-end gap-4">
                                    <button onClick={() => setSelectedFeedback(null)} className="px-6 py-2 rounded-lg font-bold text-slate-400 hover:text-white transition-colors">Close</button>
                                    <button onClick={() => deleteFeedback(selectedFeedback._id)} className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg flex items-center gap-2 font-bold shadow-lg shadow-red-900/20"><LuTrash2 size={18} /> Delete Entry</button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminFeedbackPage;