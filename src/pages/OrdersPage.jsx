/* =======================================
 * FILE: src/pages/OrdersPage.jsx
 * Admin Orders – Redesigned for UI Consistency
 * ======================================= */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

/* ================= ICONS ================= */
import { LuLogOut, LuMenu, LuX, LuStore, LuCoffee } from 'react-icons/lu';
import { VscFeedback } from "react-icons/vsc";
import { MdCampaign, MdLocalOffer } from "react-icons/md";
import { 
    FaPlusCircle, 
    FaUtensils, 
    FaClipboardList, 
    FaChartLine, 
    FaSearch, 
    FaClock, 
    FaCheckCircle 
} from 'react-icons/fa';

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
    const NavItem = ({ to, icon: Icon, name, active = false }) => (
        <Link to={to} className="block w-full" onClick={onClose}>
            <button className={`w-full flex items-center p-3 rounded-lg transition-colors duration-200 space-x-3 text-left ${
                active ? 'bg-orange-500 text-white shadow-lg' : 'text-slate-300 hover:bg-slate-700 hover:text-orange-400'
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
            <NavItem to="/orders" icon={FaClipboardList} name="Orders" active={true} />
            <NavItem to="/revenue" icon={FaChartLine} name="Revenue & Sales" />
            <NavItem to="/admin/offers" icon={MdLocalOffer} name="Offers & Discounts" />
            <NavItem to="/feedback" icon={VscFeedback} name="Student Feedback" />
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

/* ================= MAIN PAGE COMPONENT ================= */
const OrdersPage = () => {
    const navigate = useNavigate();
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [serviceMode, setServiceMode] = useState(localStorage.getItem('admin_service_mode') || 'canteen');
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");

    const handleLogout = useCallback(() => {
        localStorage.removeItem("admin_token");
        navigate("/login");
    }, [navigate]);

    const fetchOrders = async () => {
        try {
            const token = localStorage.getItem("admin_token");
            if (!token) return handleLogout();

            const res = await axios.get(
                `${API_BASE_URL}/orders/admin/all?location=${serviceMode}`,
                { headers: getAdminAuthHeaders(token) }
            );

            setOrders(res.data || []);
            setError(null);
        } catch (err) {
            setError("Failed to fetch orders");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setLoading(true);
        fetchOrders();
        const interval = setInterval(fetchOrders, POLLING_INTERVAL);
        return () => clearInterval(interval);
    }, [serviceMode]);

    const handleModeChange = (newMode) => {
        setServiceMode(newMode);
        localStorage.setItem('admin_service_mode', newMode);
    };

    const filteredOrders = useMemo(() => {
        return orders.filter((o) =>
            (o.billNumber || "").toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [orders, searchTerm]);

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
                        <div className="text-xl font-extrabold text-orange-400 italic tracking-tighter">JJ SMART DASHBOARD</div>
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
                    {/* HERO HEADER SECTION */}
                    <div className={`w-full h-48 md:h-64 mb-8 rounded-2xl flex flex-col items-center justify-center border transition-all duration-500 shadow-2xl backdrop-blur-sm ${serviceMode === 'canteen' ? 'bg-orange-900/10 border-orange-500/30' : 'bg-blue-900/10 border-blue-500/30'}`}>
                        <p className={`text-4xl md:text-5xl font-black uppercase tracking-tighter text-center px-4 ${serviceMode === 'canteen' ? 'text-orange-500' : 'text-blue-400'}`}>{serviceMode} Orders</p>
                        <p className="text-slate-400 font-bold mt-2 tracking-widest uppercase text-xs">Live Order Monitoring & Management</p>
                    </div>

                    <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                        <h2 className="text-3xl font-extrabold text-slate-100 flex items-center gap-3">
                            <FaClipboardList className="text-orange-400" /> Recent Transactions
                        </h2>
                        <div className="relative w-full md:w-64">
                            <input 
                                type="search" 
                                placeholder="Search Bill Number..." 
                                value={searchTerm} 
                                onChange={e => setSearchTerm(e.target.value)} 
                                className="w-full p-2 pl-10 rounded-lg bg-slate-700 border border-slate-600 text-white focus:ring-2 focus:ring-orange-500 outline-none text-sm transition-all" 
                            />
                            <FaSearch size={14} className="absolute left-3 top-3 text-slate-400" />
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-4">
                            <div className={`w-12 h-12 border-4 border-t-transparent rounded-full animate-spin ${serviceMode === 'canteen' ? 'border-orange-500' : 'border-blue-500'}`}></div>
                            <p className="font-bold italic text-sm tracking-widest uppercase">Fetching {serviceMode} orders...</p>
                        </div>
                    ) : error ? (
                        <div className="bg-red-900/20 border border-red-500 p-8 rounded-xl text-center shadow-xl">
                            <p className="text-red-400 font-bold mb-4">{error}</p>
                            <button onClick={fetchOrders} className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-500 transition-all font-bold">Retry Connection</button>
                        </div>
                    ) : filteredOrders.length === 0 ? (
                        <div className="text-center py-20 bg-slate-800/50 rounded-2xl border border-dashed border-slate-700">
                            <FaClipboardList size={48} className="mx-auto mb-4 opacity-10" />
                            <p className="text-slate-500 font-bold italic">No {serviceMode} orders found matching your search.</p>
                        </div>
                    ) : (
                        <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden shadow-2xl">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="bg-slate-900/50 text-slate-400 uppercase text-[10px] font-black tracking-[0.2em]">
                                            <th className="px-6 py-5">Bill #</th>
                                            <th className="px-6 py-5">Order Items</th>
                                            <th className="px-6 py-5 text-center">Total Amount</th>
                                            <th className="px-6 py-5 text-center">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-700/50">
                                        {filteredOrders.map((o) => {
                                            const isDelivered = o.orderStatus === "DELIVERED";
                                            return (
                                                <tr key={o._id} className="hover:bg-slate-700/30 transition-colors group">
                                                    <td className="px-6 py-5 font-mono font-bold text-orange-400">
                                                        {o.billNumber}
                                                    </td>
                                                    <td className="px-6 py-5">
                                                        <div className="flex flex-col gap-1">
                                                            {o.items.map((i, idx) => (
                                                                <span key={idx} className="text-sm text-slate-200">
                                                                    <span className="font-bold text-orange-500/80">{i.quantity}x</span> {i.name}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-5 text-center">
                                                        <span className="text-lg font-black text-white">₹{o.totalAmount}</span>
                                                    </td>
                                                    <td className="px-6 py-5 text-center">
                                                        <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest uppercase border ${
                                                            isDelivered 
                                                            ? "bg-green-500/10 text-green-400 border-green-500/30" 
                                                            : "bg-orange-500/10 text-orange-400 border-orange-500/30 animate-pulse"
                                                        }`}>
                                                            {isDelivered && <FaCheckCircle />}
                                                            {isDelivered ? "DELIVERED" : "PENDING"}
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

export default OrdersPage;