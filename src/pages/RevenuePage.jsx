import React, { useState, useEffect, forwardRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

// ICONS from original RevenuePage
import { LuLogOut, LuMenu, LuX } from 'react-icons/lu';
import { FaChartLine, FaCalendarAlt } from 'react-icons/fa';
// ICONS imported from AdminDashboardPage for new layout
import { VscFeedback } from "react-icons/vsc";
import { MdCampaign } from "react-icons/md";
import { FaPlusCircle, FaUtensils, FaClipboardList } from 'react-icons/fa';

// ================================================
// !!! VERCEL DEPLOYMENT FIX: API URLS !!!
// ================================================
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:10000/api';
// ================================================
// !!! END OF FIX !!!
// ================================================

// --- Helper function for Authorization Header (from AdminDashboardPage) ---
const getAdminAuthHeaders = (token) => ({
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
});

// --- SparkleOverlay Component (from AdminDashboardPage) ---
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

// --- AdminSidebarNav Component (from AdminDashboardPage) ---
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
            <NavItem to="/revenue" icon={FaChartLine} name="Revenue & Sales" isActive={true} /> {/* <-- SET TO ACTIVE */}
            <NavItem to="/feedback" icon={VscFeedback} name="Student Feedback" />
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

// --- CustomDateInput Component (Wrapped with forwardRef) ---
const CustomDateInput = forwardRef(({ value, onClick }, ref) => (
    <button 
        className="p-3 border border-slate-600 rounded-lg shadow-md bg-slate-700 text-white font-semibold flex items-center space-x-2 transition-all hover:bg-slate-600 active:scale-95" 
        onClick={onClick}
        ref={ref}
    >
        <FaCalendarAlt size={16} className="text-orange-400" />
        <span>{value}</span>
    </button>
));

// --- Main RevenuePage Component (Modified) ---
const RevenuePage = () => {
    const navigate = useNavigate();
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [dailySummary, setDailySummary] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    // --- NEW STATE from AdminDashboardPage ---
    const [isDrawerOpen, setIsDrawerOpen] = useState(false); 
    const [isCanteenOpen, setIsCanteenOpen] = useState(true);

    // --- NEW: Canteen Status Functions (from AdminDashboardPage) ---
    const fetchCanteenStatus = async () => {
        try {
            // Use API_BASE_URL
            const res = await axios.get(`${API_BASE_URL}/canteen-status/public`);
            setIsCanteenOpen(res.data.isOpen);
            return res.data.isOpen;
        } catch (err) { console.warn("Could not fetch canteen status."); setIsCanteenOpen(false); return false; }
    };
    const handleToggleCanteen = async () => {
        const token = localStorage.getItem('admin_token');
        if (!token) {
            alert('Authentication error. Please log in again.');
            navigate('/login');
            return;
        }
        try {
            // Use API_BASE_URL
            const response = await axios.patch(`${API_BASE_URL}/admin/canteen-status`,
                {},
                { headers: getAdminAuthHeaders(token) } 
            );
            setIsCanteenOpen(response.data.isOpen);
            alert(`Canteen status set to ${response.data.isOpen ? 'OPEN' : 'CLOSED'}.`);
        } catch (error) {
            alert('Failed to update canteen status. Check console/server.');
            console.error("Canteen Toggle Error:", error.response?.data || error.message);
        }
    };

    // --- MODIFIED: fetchDailySummary (Uses new Auth & API_BASE_URL) ---
    const fetchDailySummary = async (date) => {
        setLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem('admin_token');
            if (!token) {
                navigate('/login');
                return;
            }
            const dateString = date.toLocaleDateString('en-CA'); // YYYY-MM-DD
            const config = { headers: getAdminAuthHeaders(token) };
            // Use API_BASE_URL
            const response = await axios.get(`${API_BASE_URL}/admin/daily-summary?date=${dateString}`, config);
            setDailySummary(response.data);
        } catch (err) {
            console.error(err);
            if (err.response?.status === 401) {
                setError('Session expired. Please log in again.');
                handleLogout();
            } else {
                setError('Failed to fetch daily summary. Check if API is running.');
            }
        } finally {
            setLoading(false);
        }
    };

    // --- MODIFIED: useEffect (fetches status too) ---
    useEffect(() => {
        fetchDailySummary(selectedDate);
        fetchCanteenStatus(); // Fetch status on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedDate, navigate]); // Added navigate to deps, handleLogout uses it

    const handleLogout = () => {
        localStorage.removeItem('admin_token');
        navigate('/login');
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'Paid': return 'bg-yellow-900/40 text-yellow-400 font-bold';
            case 'Ready': return 'bg-orange-900/40 text-orange-400 font-bold';
            case 'Delivered': return 'bg-green-900/40 text-green-400 font-bold';
            default: return 'bg-slate-700/40 text-slate-400';
        }
    };
    

    // --- RETURN: MODIFIED with AdminDashboardPage layout ---
    return (
        <div className="min-h-screen bg-slate-900 font-sans relative flex">
            <SparkleOverlay />
            
            {/* --- MOBILE DRAWER/OVERLAY (from AdminDashboardPage) --- */}
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

            {/* --- DESKTOP SIDEBAR (from AdminDashboardPage) --- */}
            <aside className="hidden md:block w-64 bg-slate-800 border-r border-slate-700 sticky top-0 h-screen overflow-y-auto flex-shrink-0 z-20">
                <div className="p-4 py-6">
                    <h1 className="text-2xl font-extrabold text-orange-400">Admin Portal</h1>
                </div>
                <AdminSidebarNav onClose={() => {}} />
            </aside>

            {/* --- MAIN CONTENT AREA (Wrapper from AdminDashboardPage) --- */}
            <div className="flex-grow relative z-10 min-h-screen">
            
                {/* --- NEW HEADER (from AdminDashboardPage, modified) --- */}
                <header className="bg-gray-900 text-white shadow-lg p-4 flex justify-between items-center sticky top-0 z-30 border-b border-slate-700">
                    <div className="flex items-center space-x-3">
                        {/* Hamburger Button for mobile */}
                        <button className="md:hidden text-white" onClick={() => setIsDrawerOpen(true)}>
                            <LuMenu size={24} />
                        </button>
                        {/* Page Title */}
                        <div className="flex items-center gap-2">
                             <FaChartLine size={20} className="text-orange-400" />
                            <div className="text-xl font-extrabold text-orange-400 hidden md:block">Revenue Analysis</div>
                            <div className="text-xl font-extrabold text-orange-400 md:hidden">Revenue</div>
                        </div>
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
                
                {/* --- Original <main> content from RevenuePage --- */}
                <main className="container mx-auto p-4 md:p-8">
                    <div className="flex flex-col md:flex-row justify-between items-center mb-8">
                        <h2 className="text-4xl font-bold text-slate-100 mb-4 md:mb-0">Daily Orders Summary</h2>
                        <div className="flex items-center space-x-4">
                            <label className="font-semibold text-slate-300 text-lg">Select Date:</label>
                            <DatePicker
                                selected={selectedDate}
                                onChange={(date) => setSelectedDate(date)}
                                dateFormat="MMMM d, yyyy"
                                customInput={<CustomDateInput />}
                            />
                        </div>
                    </div>

                    {loading ? (<p className="text-center text-slate-400 p-10">Loading summary...</p>) : error ? (<p className="text-red-400 text-center p-10">{error}</p>) : dailySummary && (
                        <div className="bg-slate-800 rounded-xl shadow-2xl p-8 max-w-5xl mx-auto border border-slate-700">
                            <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-700 pb-4 gap-4">
                                <h3 className="text-2xl font-extrabold text-slate-100">Report for {new Date(selectedDate).toDateString()}</h3>
                                
                                <div className="text-left md:text-right space-y-1 w-full md:w-auto">
                                    <div className="text-xl font-semibold text-slate-300 flex justify-between md:block">
                                        <span>Total Orders:</span>
                                        <span className="text-2xl font-bold text-orange-400 ml-2">{dailySummary.totalOrders}</span>
                                    </div>
                                    <div className="text-xl font-semibold text-slate-300 flex justify-between md:block">
                                        <span>Total Revenue:</span>
                                        <span className="text-2xl font-bold text-green-400 ml-2">₹{dailySummary.totalRevenue.toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>

                            {dailySummary.billDetails.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-slate-700">
                                        <thead className="bg-slate-700/70">
                                            <tr>
                                                <th className="px-6 py-4 text-left text-sm font-semibold text-orange-400 uppercase tracking-wider">Bill Number</th>
                                                <th className="px-6 py-4 text-left text-sm font-semibold text-orange-400 uppercase tracking-wider">Student Name</th>
                                                <th className="px-6 py-4 text-left text-sm font-semibold text-orange-400 uppercase tracking-wider">Order Time</th>
                                                <th className="px-6 py-4 text-left text-sm font-semibold text-orange-400 uppercase tracking-wider">Total Amount</th>
                                                <th className="px-6 py-4 text-left text-sm font-semibold text-orange-400 uppercase tracking-wider">Payment Method</th>
                                                <th className="px-6 py-4 text-left text-sm font-semibold text-orange-400 uppercase tracking-wider">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-700">
                                            {dailySummary.billDetails.map((bill, index) => (
                                                <tr key={index} className="hover:bg-slate-700/50 transition-colors">
                                                    <td className="px-6 py-4 whitespace-nowrap text-base font-medium text-slate-300">{bill.billNumber}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-base text-slate-200">{bill.studentName}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-base text-slate-400">{new Date(bill.orderDate).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-base font-bold text-orange-400">₹{bill.totalAmount.toFixed(2)}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-base text-slate-400">{bill.paymentMethod}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className={`px-3 py-1 inline-flex text-base leading-5 font-semibold rounded-full ${getStatusBadge(bill.status)}`}>
                                                            {bill.status}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <p className="text-center text-slate-400 text-lg mt-4">No delivered or paid orders found for this date.</p>
                            )}
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

export default RevenuePage;