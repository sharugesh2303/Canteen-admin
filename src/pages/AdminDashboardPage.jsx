/* ==================================
 * FILE: src/pages/AdminDashboardPage.jsx
 * ================================== */

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
// Icons for Header and Sidebar
import { LuLogOut, LuMenu, LuX } from 'react-icons/lu'; 
import { VscFeedback } from "react-icons/vsc";
import { MdCampaign, MdFastfood, MdLocalDrink, MdOutlineBreakfastDining, MdOutlineLunchDining, MdOutlineDinnerDining, MdMenuBook } from "react-icons/md"; 
import { FaPlusCircle, FaUtensils, FaClipboardList, FaChartLine, FaSearch, FaClock, FaRedo, FaQuestionCircle, FaArrowLeft } from 'react-icons/fa'; 
import AdminMenuItemCard from '../components/AdminMenuItemCard.jsx'; 

// ================================================
// 🟢 FINAL CODE FIX: Standardized Fallback Port 🟢
// Changed from 10000 to 5000 to match the stuck value in Vercel's build
// ================================================
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'; // <--- CHANGED TO 5000
const API_ROOT_URL = (import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace("/api", "") : 'http://localhost:5000'); // <--- CHANGED TO 5000
// ================================================
// !!! END OF FIX !!!
// ================================================

const POLLING_INTERVAL = 15 * 1000; // 15 seconds

const DEFAULT_SERVICE_HOURS = {
    breakfastStart: '08:00', breakfastEnd: '11:00',
    lunchStart: '12:00', lunchEnd: '15:00',
};

// --- Category Icon Mapping ---
// ADDED 'Essentials' category icon here, reusing MdMenuBook
const categoryIcons = {
    Meals: MdFastfood, Breakfast: MdOutlineBreakfastDining, Lunch: MdOutlineLunchDining, Dinner: MdOutlineDinnerDining,
    Snacks: MdFastfood, Drinks: MdLocalDrink, Beverages: MdLocalDrink, Stationery: MdMenuBook, Essentials: MdMenuBook, Uncategorized: FaQuestionCircle,
};

// --- Helper function for Authorization Header ---
const getAdminAuthHeaders = (token) => ({
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
});

// ================================================
// 🟢 CRITICAL FIX: Image URL Construction (Duplicated for availability) 🟢
// This function constructs the full URL for assets served by the backend.
// ================================================
const getFullImageUrl = (imagePath) => {
    if (!imagePath) return '';
    
    // Check if the path is already a full URL (starts with http or https)
    if (imagePath.startsWith('http')) {
        return imagePath;
    }
    
    // Check if it's a relative path (starts with /uploads/), and prepend host.
    if (imagePath.startsWith('/uploads/')) {
        return `${API_ROOT_URL}${imagePath}`;
    }
    
    // If it's just the filename/ID (e.g., 1765487654.jpg), prepend the full path.
    return `${API_ROOT_URL}/uploads/${imagePath}`;
};
// ================================================
// !!! END OF CRITICAL FIX !!!
// ================================================

// --- SparkleOverlay Component (omitted for brevity) ---
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

// --- RealTimeClock Component ---
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

// --- TimeSelectInput Component (SIMPLIFIED TO STANDARD TEXT INPUTS) ---
const SimpleTimeInput = ({ name, value, onChange }) => {
    const baseClasses = "mt-1 p-2 border border-slate-600 rounded-lg focus:ring-2 focus:ring-orange-500 transition bg-slate-700 text-white w-full";
    return (
        <input
            type="time"
            name={name}
            value={value}
            onChange={onChange}
            className={baseClasses}
            step="300" // 5-minute intervals
        />
    );
};


// --- AdminSidebarNav Component (omitted for brevity) ---
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
            <NavItem to="/menu" icon={FaUtensils} name="Menu Management" isActive={true} />
            <NavItem to="/orders" icon={FaClipboardList} name="Orders" />
            <NavItem to="/revenue" icon={FaChartLine} name="Revenue & Sales" />
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

// --- Admin SubCategory Card Component ---
const AdminSubCategoryCard = ({ subCategory, onClick }) => {
    return (
        <button
            onClick={onClick}
            className="bg-slate-800 rounded-xl shadow-lg overflow-hidden flex flex-col items-center group transition-all duration-300 hover:shadow-orange-500/50 hover:shadow-xl hover:-translate-y-1 border border-slate-700 hover:ring-2 hover:ring-orange-400/50 active:scale-[0.98] cursor-pointer p-4 w-40 h-48 justify-center" 
        >
            <img
                // 🟢 Use the helper to fix the image URL
                src={getFullImageUrl(subCategory.imageUrl) || 'https://placehold.co/100x100/1e293b/475569?text=Img'} 
                alt={subCategory.name}
                className="w-24 h-24 object-cover rounded-full mb-3 group-hover:scale-105 transition-transform duration-300 border-2 border-slate-600"
            />
            <h4 className="text-md font-semibold text-slate-100 capitalize text-center group-hover:text-orange-300">
                {subCategory.name}
            </h4>
        </button>
    );
};

// --- AdminDashboardPage Component ---
const AdminDashboardPage = () => {
    const navigate = useNavigate();
    const [menuItems, setMenuItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isHoursFormVisible, setIsHoursFormVisible] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [isCanteenOpen, setIsCanteenOpen] = useState(true);
    const [serviceHours, setServiceHours] = useState(() => JSON.parse(localStorage.getItem('canteenServiceHours')) || DEFAULT_SERVICE_HOURS);
    const [selectedMeal, setSelectedMeal] = useState('breakfast');
    const [activeAdminCategory, setActiveAdminCategory] = useState(null);
    const [selectedAdminSubCategoryId, setSelectedAdminSubCategoryId] = useState(null);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false); 

    // --- Service Hours Functions ---
    const fetchServiceHours = async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/service-hours/public`);
            setServiceHours(res.data);
            localStorage.setItem('canteenServiceHours', JSON.stringify(res.data));
        } catch (err) { console.warn("Failed to fetch service hours, using local/default."); }
    };
    const handleHoursInputChange = (e) => {
        setServiceHours(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };
    const handleSaveHours = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('admin_token');
        if (!token) { alert('Authentication error. Please log in again.'); navigate('/login'); return; }
        try {
            const dataToSend = { ...serviceHours };
            const res = await axios.patch(`${API_BASE_URL}/admin/service-hours`, dataToSend, { headers: getAdminAuthHeaders(token) }); 
            setServiceHours(res.data);
            localStorage.setItem('canteenServiceHours', JSON.stringify(res.data));
            alert('Service hours saved successfully!');
            setIsHoursFormVisible(false);
        } catch (err) { alert('Failed to save service hours.'); console.error("Save Hours Err:", err.response?.data || err.message); }
    };
    const handleResetHours = async () => {
        if (window.confirm('Reset ALL hours to default?')) {
            const token = localStorage.getItem('admin_token');
            if (!token) { alert('Authentication error. Please log in again.'); navigate('/login'); return; }
            try {
                const res = await axios.patch(`${API_BASE_URL}/admin/service-hours`, DEFAULT_SERVICE_HOURS, { headers: getAdminAuthHeaders(token) }); 
                setServiceHours(res.data);
                localStorage.setItem('canteenServiceHours', JSON.stringify(res.data));
                alert('Hours reset to default globally.');
                setIsHoursFormVisible(false);
            } catch (err) { alert('Failed to reset hours.'); console.error("Reset Hours Err:", err.response?.data || err.message); }
        }
    };

    // --- Canteen Status Functions ---
    const fetchCanteenStatus = async () => {
        try {
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

    // --- Fetch Menu Items ---
    const fetchAdminMenuItems = async () => {
        setLoading(true); setError(null);
        try {
            const token = localStorage.getItem('admin_token');
            if (!token) { navigate('/login'); return; }
            const res = await axios.get(`${API_BASE_URL}/admin/menu`, { headers: getAdminAuthHeaders(token) });
            setMenuItems(res.data || []);
        } catch (err) { 
            console.error("Fetch Admin Menu Error:", err.response?.data || err.message); 
            if (err.response?.status === 401) {
                 setError('Session expired. Please log in again.');
                 handleLogout();
            } else {
                 setError('Failed to fetch menu items.'); 
            }
            setMenuItems([]); 
        }
        finally { setLoading(false); }
     };

    useEffect(() => {
        fetchCanteenStatus();
        fetchAdminMenuItems();
        fetchServiceHours();
        const interval = setInterval(fetchCanteenStatus, POLLING_INTERVAL);
        return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); 

    // --- Data Grouping Logic ---
    const groupedAndFilteredItems = useMemo(() => {
        const itemsToProcess = searchTerm.trim()
            ? menuItems.filter(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()))
            : menuItems;

        if (searchTerm.trim()) return { searchResults: itemsToProcess };

        const groups = {};
        const subCategoryDetailsMap = new Map();
        // UPDATED: Added 'Essentials' to the category order
        const categoryOrder = ['Meals', 'Breakfast', 'Lunch', 'Dinner', 'Snacks', 'Drinks', 'Beverages', 'Stationery', 'Essentials', 'Uncategorized'];

        itemsToProcess.forEach(item => {
            const category = item.category || 'Uncategorized';
            if (!groups[category]) groups[category] = (category === 'Snacks') ? {} : [];

            if (category === 'Snacks') {
                const subCategory = item.subCategory;
                const subCategoryId = subCategory?._id || 'other';
                const subCategoryName = subCategory?.name || 'Other Snacks';

                if (subCategory && !subCategoryDetailsMap.has(subCategoryId)) {
                    // 🟢 Use the helper to fix the image URL
                    const correctedImageUrl = getFullImageUrl(subCategory.imageUrl); 
                    subCategoryDetailsMap.set(subCategoryId, { _id: subCategoryId, name: subCategoryName, imageUrl: correctedImageUrl });
                } else if (!subCategory && !subCategoryDetailsMap.has('other')){
                    subCategoryDetailsMap.set('other', { _id: 'other', name: 'Other Snacks', imageUrl: null });
                }

                if (!groups.Snacks[subCategoryId]) groups.Snacks[subCategoryId] = [];
                groups.Snacks[subCategoryId].push(item);
            } else {
                groups[category].push(item);
            }
        });

        const sortedGroups = {};
        categoryOrder.forEach(catName => { if (groups[catName]) sortedGroups[catName] = groups[catName]; });
        Object.keys(groups).forEach(catName => { if (!sortedGroups[catName]) sortedGroups[catName] = groups[catName]; });

        if (sortedGroups.Snacks) {
            const sortedSnackSubCats = {};
            Object.keys(sortedGroups.Snacks)
                .sort((a, b) => (subCategoryDetailsMap.get(a)?.name || '').localeCompare(subCategoryDetailsMap.get(b)?.name || ''))
                .forEach(subCatId => {
                    sortedSnackSubCats[subCatId] = sortedGroups.Snacks[subCatId].sort((itemA, itemB) => itemA.name.localeCompare(itemB.name));
                });
            sortedGroups.Snacks = sortedSnackSubCats;
        }
           Object.keys(sortedGroups).forEach(catName => {
               if (catName !== 'Snacks' && Array.isArray(sortedGroups[catName])) {
                   sortedGroups[catName].sort((a, b) => a.name.localeCompare(b.name));
               }
       });

        return { ...sortedGroups, subCategoryDetails: subCategoryDetailsMap };
    }, [menuItems, searchTerm]);

    // --- State Management for Grouping ---
    useEffect(() => {
        const availableCategories = Object.keys(groupedAndFilteredItems).filter(key => key !== 'searchResults' && key !== 'subCategoryDetails');
        if (!loading && !activeAdminCategory && availableCategories.length > 0 && !groupedAndFilteredItems.searchResults) {
            setActiveAdminCategory(availableCategories[0]);
        }
        if (searchTerm.trim()) {
            setActiveAdminCategory(null);
            setSelectedAdminSubCategoryId(null);
        } else if (!activeAdminCategory && availableCategories.length > 0 && !groupedAndFilteredItems.searchResults) {
            setActiveAdminCategory(availableCategories[0]);
        }
    }, [loading, groupedAndFilteredItems, activeAdminCategory, searchTerm]);

    useEffect(() => { setSelectedAdminSubCategoryId(null); }, [activeAdminCategory]);

    // --- Delete Item ---
    const handleDeleteItem = async (itemId) => {
        if (window.confirm('Delete this item?')) {
            const token = localStorage.getItem('admin_token');
            if (!token) { alert('Authentication error. Please log in again.'); navigate('/login'); return; }
            try {
                // Use API_BASE_URL
                await axios.delete(`${API_BASE_URL}/menu/${itemId}`, { headers: getAdminAuthHeaders(token) });
                fetchAdminMenuItems(); 
            } catch (err) { setError('Failed to delete item.'); console.error("Delete Err:", err.response?.data || err.message); }
        }
    };

    // --- Logout ---
    const handleLogout = () => { localStorage.removeItem('admin_token'); navigate('/login'); };

    // --- Service Hours Display ---
    const mealDisplayNames = { breakfast: "Breakfast Slot", lunch: "Lunch Slot" };
    const startKey = `${selectedMeal}Start`;
    const endKey = `${selectedMeal}End`;

    // --- Subcategory Click Handlers ---
    const handleAdminSubCategoryClick = (subCatId) => setSelectedAdminSubCategoryId(subCatId);
    const handleBackToAdminSubCategories = () => setSelectedAdminSubCategoryId(null);

    // --- Render ---
    return (
        <div className="min-h-screen bg-slate-900 font-sans relative flex">
            <SparkleOverlay />
            
            {/* --- MOBILE DRAWER/OVERLAY --- */}
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

            {/* --- DESKTOP SIDEBAR (Permanent on MD+) --- */}
            <aside className="hidden md:block w-64 bg-slate-800 border-r border-slate-700 sticky top-0 h-screen overflow-y-auto flex-shrink-0 z-20">
                <div className="p-4 py-6">
                    <h1 className="text-2xl font-extrabold text-orange-400">Admin Portal</h1>
                </div>
                <AdminSidebarNav onClose={() => {}} />
            </aside>

            {/* --- MAIN CONTENT AREA --- */}
            <div className="flex-grow relative z-10 min-h-screen">
                
                {/* --- HEADER --- */}
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
                        {/* Search */}
                        <div className="relative hidden sm:block">
                            <input type="search" placeholder="Search items..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="p-2 pl-8 rounded-lg bg-slate-700 border border-slate-600 text-white placeholder-slate-400 w-48 focus:ring-1 focus:ring-orange-500 transition-colors" />
                            <FaSearch size={14} className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-slate-400" />
                        </div>
                        {/* Logout */}
                        <button onClick={handleLogout} className="bg-red-600 font-semibold py-2 px-4 rounded-lg transition duration-300 hover:bg-red-700 flex items-center space-x-2 shadow-md active:scale-95">
                            <LuLogOut size={18} /><span>Log Out</span>
                        </button>
                    </div>
                </header>
                <RealTimeClock />

                <main className="container mx-auto p-4 md:p-8">
                    {/* Ad Placeholder */}
                    <div className="w-full max-w-5xl mx-auto h-48 md:h-64 overflow-hidden relative mb-8 rounded-lg shadow-xl bg-slate-800/50 flex items-center justify-center border border-slate-700">
                        <p className="text-2xl font-bold text-orange-400">ADMIN MENU VIEW</p>
                    </div>

                    {/* Service Hours Form */}
                    <div className="flex justify-between items-center bg-slate-700/50 p-4 rounded-xl mb-6 cursor-pointer hover:bg-slate-700 transition-colors" onClick={() => setIsHoursFormVisible(p => !p)}>
                        <h3 className="text-xl font-bold text-slate-100 flex items-center gap-2"><FaClock /> Manage Service Hours</h3>
                        <span className="text-orange-400">{isHoursFormVisible ? 'Hide' : 'Show'}</span>
                    </div>
                    {isHoursFormVisible && (
                        <div className="bg-slate-800 rounded-xl shadow-2xl p-6 mb-10 border-t-4 border-blue-500">
                            <form onSubmit={handleSaveHours}>
                                <h3 className="text-xl font-bold mb-6 text-slate-100">Set Daily Service Slots (24h format HH:MM)</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="flex space-x-4 mb-4 col-span-full">
                                        <button type="button" onClick={() => setSelectedMeal('breakfast')} className={`py-2 px-4 rounded-lg font-semibold transition-all active:scale-95 ${selectedMeal === 'breakfast' ? 'bg-orange-500 text-white shadow-md' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}>Breakfast Hours</button>
                                        <button type="button" onClick={() => setSelectedMeal('lunch')} className={`py-2 px-4 rounded-lg font-semibold transition-all active:scale-95 ${selectedMeal === 'lunch' ? 'bg-orange-500 text-white shadow-md' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}>Lunch Hours</button>
                                    </div>
                                    <h4 className="text-lg font-bold mb-4 text-slate-100 border-b border-slate-700 pb-2 col-span-full">Editing: {mealDisplayNames[selectedMeal]}</h4>
                                    
                                    {/* 🐛 USING SIMPLE TIME INPUTS TO AVOID REF ERROR 🐛 */}
                                    <label className="block text-slate-300">Start Time <SimpleTimeInput name={startKey} value={serviceHours[startKey]} onChange={handleHoursInputChange} /></label>
                                    <label className="block text-slate-300">End Time <SimpleTimeInput name={endKey} value={serviceHours[endKey]} onChange={handleHoursInputChange} /></label>
                                    
                                </div>
                                <div className="mt-6 flex justify-between">
                                    <button type="button" onClick={handleResetHours} className="bg-gray-500 text-white font-semibold py-3 px-6 rounded-lg hover:bg-gray-600 transition-all shadow-md active:scale-95 flex items-center space-x-2"><FaRedo size={16} /> <span>Reset to Default</span></button>
                                    <button type="submit" className="bg-blue-600 text-white font-semibold py-3 px-8 rounded-lg hover:bg-blue-700 transition-all shadow-md active:scale-95 shadow-blue-500/30">Save {selectedMeal.toUpperCase()} Hours</button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* Menu Title and Content Display */}
                    <h2 className="text-3xl font-extrabold text-slate-100 mb-6">
                         {searchTerm ? `Search Results for "${searchTerm}"` : 'Menu Management'}
                    </h2>

                    {loading ? ( /* ... loading spinner ... */ 
                        <div className="text-center p-10 font-semibold text-slate-400 flex justify-center items-center space-x-2">
                            <svg className="animate-spin h-5 w-5 text-orange-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"> <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                            <span>Loading menu...</span>
                        </div>
                    ) : error ? (
                        <p className="text-red-400 text-center mt-10">{error}</p>
                    ) : (
                        <div>
                            {groupedAndFilteredItems.searchResults ? (
                                // --- Search Results ---
                                groupedAndFilteredItems.searchResults.length > 0 ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                        {/* This renders the item cards */}
                                        {groupedAndFilteredItems.searchResults.map((item) => <AdminMenuItemCard key={item._id} item={item} onEdit={() => navigate(`/admin/menu/edit/${item._id}`)} onDelete={handleDeleteItem} />)}
                                    </div>
                                ) : ( <p className="text-slate-400 text-center mt-10 text-lg">No items found matching "{searchTerm}".</p> )
                            ) : (
                                // --- Grouped View (with Category Selector) ---
                                Object.keys(groupedAndFilteredItems).filter(k => k !== 'subCategoryDetails').length > 0 ? (
                                    <>
                                        {/* --- Category Selector Buttons --- */}
                                        <div className="mb-8">
                                            <h3 className="text-xl font-semibold text-slate-300 mb-4">Select Category:</h3>
                                            <div className="flex flex-wrap gap-4">
                                                {Object.keys(groupedAndFilteredItems).filter(k => k !== 'subCategoryDetails').map(categoryName => {
                                                    const CategoryIcon = categoryIcons[categoryName] || FaQuestionCircle;
                                                    const isActive = categoryName === activeAdminCategory;
                                                    return (
                                                        <button key={categoryName} onClick={() => setActiveAdminCategory(categoryName)} className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all border ${ isActive ? 'bg-orange-600 border-orange-500 text-white shadow-md scale-105' : 'bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600 hover:border-slate-500' }`}>
                                                            <CategoryIcon size={20} /> <span>{categoryName}</span>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        {/* --- Render Active Category Content --- */}
                                        {activeAdminCategory && groupedAndFilteredItems[activeAdminCategory] ? (() => {
                                            const categoryName = activeAdminCategory;
                                            const itemsOrSubcategories = groupedAndFilteredItems[categoryName];
                                            const CategoryIcon = categoryIcons[categoryName] || FaQuestionCircle;
                                            const subCategoryDetailsMap = groupedAndFilteredItems.subCategoryDetails || new Map();

                                            return (
                                                <section key={categoryName} className="mt-8 border-t border-slate-700 pt-8">
                                                    <div className="flex justify-between items-center mb-6">
                                                        <h3 className="text-2xl font-bold text-orange-400 flex items-center gap-3">
                                                            <CategoryIcon size={28} className="text-orange-400/80"/>
                                                            <span>{categoryName} {categoryName === 'Snacks' ? (selectedAdminSubCategoryId ? `- ${subCategoryDetailsMap.get(selectedAdminSubCategoryId)?.name || 'Items'}` : '- Subcategories') : 'Items'}</span>
                                                        </h3>
                                                        {categoryName === 'Snacks' && selectedAdminSubCategoryId && (
                                                            <button onClick={handleBackToAdminSubCategories} className="flex items-center gap-2 text-sm text-orange-400 hover:text-orange-300 transition-colors bg-slate-700/50 px-3 py-1 rounded-md">
                                                                <FaArrowLeft /> Back to Snack Types
                                                            </button>
                                                        )}
                                                    </div>

                                                    {categoryName === 'Snacks' ? (
                                                        // --- Snacks View: Subcategories or Items ---
                                                        !selectedAdminSubCategoryId ? (
                                                            // Show Subcategory Grid
                                                            Object.keys(itemsOrSubcategories).length > 0 ? (
                                                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6 pl-4">
                                                                    {Object.keys(itemsOrSubcategories).map(subCatId => {
                                                                        const subCatDetail = subCategoryDetailsMap.get(subCatId);
                                                                        return subCatDetail ? (
                                                                            <AdminSubCategoryCard
                                                                                key={subCatId}
                                                                                subCategory={subCatDetail} 
                                                                                onClick={() => handleAdminSubCategoryClick(subCatId)}
                                                                            />
                                                                        ) : null;
                                                                    })}
                                                                </div>
                                                            ) : ( <p className="text-slate-500 ml-6">No snack subcategories found.</p> )
                                                        ) : (
                                                            // Show Items Grid for selected subcategory
                                                            itemsOrSubcategories[selectedAdminSubCategoryId] && itemsOrSubcategories[selectedAdminSubCategoryId].length > 0 ? (
                                                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 pl-4">
                                                                    {/* This renders the item cards */}
                                                                    {itemsOrSubcategories[selectedAdminSubCategoryId].map((item) => <AdminMenuItemCard key={item._id} item={item} onEdit={() => navigate(`/admin/menu/edit/${item._id}`)} onDelete={handleDeleteItem} />)}
                                                                </div>
                                                            ) : ( <p className="text-slate-500 ml-6">No items found in this subcategory.</p> )
                                                        )
                                                    ) : (
                                                        // --- Other Categories View: Items Grid ---
                                                         Array.isArray(itemsOrSubcategories) && itemsOrSubcategories.length > 0 ? (
                                                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 pl-4">
                                                                {/* This renders the item cards */}
                                                                {itemsOrSubcategories.map((item) => <AdminMenuItemCard key={item._id} item={item} onEdit={() => navigate(`/admin/menu/edit/${item._id}`)} onDelete={handleDeleteItem} />)}
                                                            </div>
                                                        ) : ( <p className="text-slate-500 ml-6">No items in this category.</p> )
                                                    )}
                                                </section>
                                            );
                                        })() : (
                                            !searchTerm && <p className="text-slate-400 mt-6 text-center">Select a category above to view items.</p>
                                        )}
                                    </>
                                ) : ( <p className="text-slate-400 text-center mt-10 text-lg">No menu items available.</p> )
                            )}
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

export default AdminDashboardPage;
