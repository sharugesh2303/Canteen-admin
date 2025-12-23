/* =======================================
 * FILE: src/pages/AdminAdvertisementPage.jsx
 * ======================================= */

import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
// Icons for Header and Sidebar
import { LuLogOut, LuMenu, LuX } from 'react-icons/lu';
import { VscFeedback } from "react-icons/vsc";
import { MdCampaign } from "react-icons/md";
// Icons for Page and Sidebar
import { FaPlusCircle, FaUtensils, FaClipboardList, FaChartLine, FaTrashAlt, FaToggleOn, FaToggleOff, FaUpload } from 'react-icons/fa';

// ================================================
// 🟢 VERCEL DEPLOYMENT FIX: API URLS (Standardized to 5000) 🟢
// ================================================
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const API_ROOT_URL = (import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace("/api", "") : 'http://localhost:5000');
// ================================================
// !!! END OF FIX !!!
// ================================================

const POLLING_INTERVAL = 15 * 1000; // 15 seconds

// --- Helper function for Authorization Header ---
const getAdminAuthHeaders = (token, contentType = 'application/json') => ({
    'Authorization': `Bearer ${token}`,
    'Content-Type': contentType,
});

// ================================================
// 🟢 CRITICAL FIX: getFullImageUrl DEFINITION 🟢
// Added the helper function definition to this file.
// ================================================
const getFullImageUrl = (imagePath) => {
    if (!imagePath) return '';
    
    // Check if the path is already a full URL (from Cloudinary/external source)
    if (imagePath.startsWith('http')) {
        return imagePath;
    }
    
    // If path starts with /uploads/, prepend host. (Used if files are on Render Disk/Local)
    if (imagePath.startsWith('/uploads/')) {
        return `${API_ROOT_URL}${imagePath}`;
    }
    
    // Fallback for bare filename (used if files are on Render Disk/Local)
    return `${API_ROOT_URL}/uploads/${imagePath}`;
};
// ================================================
// !!! END CRITICAL FIX !!!
// ================================================


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
// *** MODIFIED: Set 'Ads Management' to isActive={true} ***
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
            <NavItem to="/feedback" icon={VscFeedback} name="Student Feedback" />
            <NavItem to="/advertisement" icon={MdCampaign} name="Ads Management" isActive={true} />
            
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


// --- AdminAdvertisementPage Component ---
const AdminAdvertisementPage = () => {
    const navigate = useNavigate();
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [isCanteenOpen, setIsCanteenOpen] = useState(true);

    // --- State specific to Advertisement Page ---
    const [ads, setAds] = useState([]);
    const [imageFile, setImageFile] = useState(null);
    const [loading, setLoading] = useState(true);

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

    // --- Advertisement Page Functions ---
    const fetchAds = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('admin_token');
            if (!token) { navigate('/login'); return; }
            
            // Use API_BASE_URL and correct headers
            const response = await axios.get(`${API_BASE_URL}/admin/advertisements`, {
                headers: getAdminAuthHeaders(token), // <-- CORRECTED
            });
            setAds(response.data);
        } catch (err) {
            console.error('Failed to load advertisements.', err.response?.data || err.message);
            if (err.response?.status === 401) {
                alert('Session expired. Please log in again.');
                handleLogout();
            }
        } finally {
            setLoading(false);
        }
    };

    // Main useEffect
    useEffect(() => {
        const token = localStorage.getItem('admin_token');
        if (!token) {
            navigate('/login');
            return;
        }
        fetchCanteenStatus();
        fetchAds();
        const interval = setInterval(fetchCanteenStatus, POLLING_INTERVAL);
        return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [navigate]); 

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!imageFile) {
            alert('Please select an image file.');
            return;
        }
        const formData = new FormData();
        formData.append('image', imageFile);
        try {
            const token = localStorage.getItem('admin_token');
            // Use API_BASE_URL and correct headers
            await axios.post(`${API_BASE_URL}/admin/advertisements`, formData, {
                headers: { 
                    'Content-Type': 'multipart/form-data', 
                    'Authorization': `Bearer ${token}` // <-- CORRECTED
                },
            });
            alert('Advertisement uploaded successfully!');
            e.target.reset(); // Clear the file input
            setImageFile(null);
            fetchAds(); // Refresh the list
        } catch (err) {
            alert('Failed to upload advertisement.');
            console.error("Upload Ad Error:", err.response?.data || err.message);
        }
    };

    const handleDelete = async (adId) => {
        if (window.confirm('Are you sure you want to delete this ad?')) {
            try {
                const token = localStorage.getItem('admin_token');
                // Use API_BASE_URL and correct headers
                await axios.delete(`${API_BASE_URL}/admin/advertisements/${adId}`, {
                    headers: getAdminAuthHeaders(token), // <-- CORRECTED
                });
                fetchAds(); // Refresh
            } catch (err) {
                alert('Failed to delete ad.');
                console.error("Delete Ad Error:", err.response?.data || err.message);
            }
        }
    };

    const handleToggle = async (adId) => {
        try {
            const token = localStorage.getItem('admin_token');
            // Use API_BASE_URL and correct headers
            await axios.patch(`${API_BASE_URL}/admin/advertisements/${adId}/toggle`, {}, {
                headers: getAdminAuthHeaders(token), // <-- CORRECTED
            });
            fetchAds(); // Refresh
        } catch (err)
 {
            alert('Failed to update ad status.');
            console.error("Toggle Ad Error:", err.response?.data || err.message);
        }
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

                {/* --- MAIN CONTENT (Advertisement Page Content) --- */}
                <main className="container mx-auto p-4 md:p-8">
                
                    {/* Upload Form Container */}
                    <div className="bg-slate-800 p-6 rounded-xl shadow-2xl mb-8 border border-slate-700 max-w-4xl mx-auto">
                        <h3 className="text-2xl font-extrabold text-slate-100 mb-4">Upload New Advertisement</h3>
                        <form onSubmit={handleUpload} className="flex flex-col md:flex-row items-center gap-4">
                            <input 
                                type="file" 
                                onChange={(e) => setImageFile(e.target.files[0])} 
                                className="flex-grow block w-full text-sm text-slate-400 
                                    file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold 
                                    file:bg-blue-600 file:text-white hover:file:bg-blue-700 transition" 
                                accept="image/*" 
                                required 
                            />
                            <button 
                                type="submit" 
                                className="w-full md:w-auto bg-green-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-green-700 transition flex items-center justify-center space-x-2 shadow-md active:scale-95"
                            >
                                <FaUpload size={14} /><span>Upload Ad</span>
                            </button>
                        </form>
                    </div>

                    <h2 className="text-4xl font-bold text-slate-100 mb-6">Manage Advertisements</h2>
                    
                    {loading ? (
                        <div className="text-center p-10 font-semibold text-slate-400 flex justify-center items-center space-x-2">
                            <svg className="animate-spin h-5 w-5 text-orange-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"> <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                            <span>Loading advertisements...</span>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {ads.length === 0 ? (
                                <p className="text-slate-400 md:col-span-2 lg:col-span-3 text-center">No advertisements found.</p>
                            ) : (
                                ads.map(ad => (
                                    <div key={ad._id} className="bg-slate-800 rounded-xl shadow-lg border border-slate-700 overflow-hidden group">
                                        <img 
                                            // Use the helper to fix the image URL
                                            src={getFullImageUrl(ad.imageUrl)} 
                                            alt="Ad Preview" 
                                            className="w-full h-40 object-cover rounded-t-xl transition-transform duration-300 group-hover:scale-[1.03]" 
                                        />
                                        <div className="p-4 flex justify-between items-center border-t border-slate-700">
                                            <button onClick={() => handleToggle(ad._id)} 
                                                className={`px-3 py-1.5 rounded-lg font-semibold text-white text-sm transition-all flex items-center space-x-1 active:scale-95 ${ad.isActive ? 'bg-green-600 hover:bg-green-700' : 'bg-yellow-600 hover:bg-yellow-700'}`}>
                                                {ad.isActive ? <FaToggleOn size={18} /> : <FaToggleOff size={18} />}
                                                <span>{ad.isActive ? 'Active' : 'Inactive'}</span>
                                            </button>
                                            <button onClick={() => handleDelete(ad._id)} 
                                                className="px-3 py-1.5 rounded-lg font-semibold text-white text-sm bg-red-600 hover:bg-red-700 transition active:scale-95 flex items-center space-x-1 shadow-md shadow-red-500/30">
                                                <FaTrashAlt size={14} />
                                                <span>Delete</span>
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

export default AdminAdvertisementPage;