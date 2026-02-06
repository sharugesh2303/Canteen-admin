import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { LuLogOut, LuMenu, LuX, LuStore, LuCoffee } from 'react-icons/lu'; 
import { VscFeedback } from "react-icons/vsc";
import { 
    MdCampaign, 
    MdFastfood, 
    MdLocalDrink, 
    MdOutlineBreakfastDining, 
    MdOutlineLunchDining, 
    MdOutlineDinnerDining, 
    MdMenuBook,
    MdLocalOffer
} from "react-icons/md"; 
import { 
    FaPlusCircle, 
    FaUtensils, 
    FaClipboardList, 
    FaChartLine, 
    FaSearch, 
    FaClock, 
    FaRedo, 
    FaQuestionCircle, 
    FaArrowLeft 
} from 'react-icons/fa'; 
import AdminMenuItemCard from '../components/AdminMenuItemCard.jsx'; 

/* ================= API CONFIG ================= */
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:10000/api';
const API_ROOT_URL = (import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace("/api", "") : 'http://localhost:10000');
const POLLING_INTERVAL = 15 * 1000; 

const DEFAULT_SERVICE_HOURS = {
    breakfast: { start: '08:00', end: '11:00' },
    lunch: { start: '12:00', end: '15:00' },
};

const categoryIcons = {
    Meals: MdFastfood, Breakfast: MdOutlineBreakfastDining, Lunch: MdOutlineLunchDining, Dinner: MdOutlineDinnerDining,
    Snacks: MdFastfood, Drinks: MdLocalDrink, Beverages: MdLocalDrink, Stationery: MdMenuBook, Essentials: MdMenuBook, Uncategorized: FaQuestionCircle,
};

const getAdminAuthHeaders = (token) => ({
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
});

const getFullImageUrl = (imagePath) => {
    if (!imagePath) return '';
    if (imagePath.startsWith('http')) return imagePath;
    if (imagePath.startsWith('/uploads/')) return `${API_ROOT_URL}${imagePath}`;
    return `${API_ROOT_URL}/uploads/${imagePath}`;
};

/* ================= SHARED UI COMPONENTS ================= */
const SparkleOverlay = () => {
    const random = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
    const sparks = Array.from({ length: 40 }).map((_, i) => {
        const style = {
            '--x': `${random(-150, 150)}vw`, 
            '--y': `${random(-150, 150)}vh`,
            '--duration': `${random(8, 20)}s`, 
            '--delay': `${random(1, 10)}s`,
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

const SimpleTimeInput = ({ name, value, onChange }) => (
    <input type="time" name={name} value={value} onChange={onChange} step="300"
           className="mt-1 p-2 border border-slate-600 rounded-lg focus:ring-2 focus:ring-orange-500 transition bg-slate-700 text-white w-full" />
);

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
            <NavItem to="/menu" icon={FaUtensils} name="Menu Management" isActive={true} />
            <NavItem to="/orders" icon={FaClipboardList} name="Orders" />
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

const AdminSubCategoryCard = ({ subCategory, onClick }) => (
    <button onClick={onClick} className="bg-slate-800 rounded-xl shadow-lg overflow-hidden flex flex-col items-center group transition-all duration-300 hover:shadow-orange-500/50 hover:shadow-xl hover:-translate-y-1 border border-slate-700 hover:ring-2 hover:ring-orange-400/50 active:scale-[0.98] cursor-pointer p-4 w-40 h-48 justify-center">
        <img src={getFullImageUrl(subCategory.imageUrl) || 'https://placehold.co/100x100/1e293b/475569?text=Img'} 
             alt={subCategory.name} className="w-24 h-24 object-cover rounded-full mb-3 group-hover:scale-105 transition-transform duration-300 border-2 border-slate-600" />
        <h4 className="text-md font-semibold text-slate-100 capitalize text-center group-hover:text-orange-300">{subCategory.name}</h4>
    </button>
);

const AdminDashboardPage = () => {
    const navigate = useNavigate();

    const [serviceMode, setServiceMode] = useState(localStorage.getItem('admin_service_mode') || 'canteen');
    const [menuItems, setMenuItems] = useState([]);
    const [offers, setOffers] = useState([]); 
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isHoursFormVisible, setIsHoursFormVisible] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [isStatusOpen, setIsStatusOpen] = useState(true);
    const [serviceHours, setServiceHours] = useState(DEFAULT_SERVICE_HOURS);
    const [selectedMeal, setSelectedMeal] = useState('breakfast');
    const [activeAdminCategory, setActiveAdminCategory] = useState(null);
    const [selectedAdminSubCategoryId, setSelectedAdminSubCategoryId] = useState(null);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);

    const handleLogout = useCallback(() => { localStorage.removeItem('admin_token'); navigate('/login'); }, [navigate]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('admin_token');
            if (!token) return navigate('/login');
            
            const [menuRes, offersRes] = await Promise.all([
                axios.get(`${API_BASE_URL}/admin/menu?mode=${serviceMode}`, { headers: getAdminAuthHeaders(token) }),
                axios.get(`${API_BASE_URL}/admin/offers?mode=${serviceMode}`, { headers: getAdminAuthHeaders(token) })
            ]);

            setMenuItems(menuRes.data || []);
            setOffers(offersRes.data || []);
            setError(null);
        } catch (err) {
            setError(err.response?.status === 401 ? 'Session expired.' : 'Failed to fetch items.');
        } finally { setLoading(false); }
    };

    const fetchServiceHours = async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/service-hours/public?location=${serviceMode}`);
            if (res.data) setServiceHours(res.data);
        } catch (err) { 
            console.warn(`Using defaults for ${serviceMode}.`);
            setServiceHours(DEFAULT_SERVICE_HOURS);
        }
    };

    const handleSaveHours = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('admin_token');
        if (!token) return handleLogout();
        
        const payload = {
            location: serviceMode,
            [`${selectedMeal}Start`]: serviceHours[selectedMeal].start,
            [`${selectedMeal}End`]: serviceHours[selectedMeal].end
        };

        try {
            const res = await axios.patch(`${API_BASE_URL}/admin/service-hours`, payload, { headers: getAdminAuthHeaders(token) });
            setServiceHours(res.data);
            alert(`${serviceMode.toUpperCase()} hours updated!`);
            setIsHoursFormVisible(false);
        } catch (err) { alert('Failed to save hours.'); }
    };

    const fetchCurrentStatus = async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/status/public?location=${serviceMode}`);
            setIsStatusOpen(res.data.isOpen);
        } catch (err) { console.error("Could not fetch status."); }
    };

    const handleToggleStatus = async () => {
        const token = localStorage.getItem('admin_token');
        if (!token) return handleLogout();
        try {
            const response = await axios.patch(`${API_BASE_URL}/admin/status-toggle`, { location: serviceMode }, { headers: getAdminAuthHeaders(token) });
            setIsStatusOpen(response.data.isOpen);
        } catch (error) { alert('Status update failed.'); }
    };

    const handleModeChange = (newMode) => {
        setServiceMode(newMode);
        localStorage.setItem('admin_service_mode', newMode);
        setActiveAdminCategory(null);
        setSelectedAdminSubCategoryId(null);
        setIsHoursFormVisible(false); 
    };

    const handleDeleteItem = async (itemId) => {
        if (!window.confirm('Delete this item?')) return;
        const token = localStorage.getItem('admin_token');
        try {
            await axios.delete(`${API_BASE_URL}/admin/menu/${itemId}`, { headers: getAdminAuthHeaders(token) });
            fetchData();
        } catch (err) { alert('Delete failed.'); }
    };

    useEffect(() => {
        fetchCurrentStatus();
        fetchData();
        fetchServiceHours();
        const interval = setInterval(fetchCurrentStatus, POLLING_INTERVAL);
        return () => clearInterval(interval);
    }, [serviceMode]);

    const getOfferForItem = useCallback((item) => {
        const activeOffer = offers.find(offer => {
            return offer.applicableItems.some(offeredItem => {
                const offeredId = typeof offeredItem === 'object' ? offeredItem._id : offeredItem;
                return offeredId === item._id;
            });
        });

        if (activeOffer) {
            const discount = (item.price * activeOffer.discountPercentage) / 100;
            return {
                isOffer: true,
                originalPrice: item.price,
                offerPrice: Math.round(item.price - discount),
                percentage: activeOffer.discountPercentage,
                offerName: activeOffer.name
            };
        }
        return { isOffer: false };
    }, [offers]);

    const groupedAndFilteredItems = useMemo(() => {
        const modeSpecificItems = menuItems.filter(item => {
            if (serviceMode === 'canteen') {
                return !item.location || item.location === 'canteen';
            }
            return item.location === 'cafeteria';
        });
        
        const itemsToProcess = searchTerm.trim() 
            ? modeSpecificItems.filter(item => item.name.toLowerCase().includes(searchTerm.toLowerCase())) 
            : modeSpecificItems;

        if (searchTerm.trim()) return { searchResults: itemsToProcess };
        
        const groups = {};
        const subCategoryDetailsMap = new Map();
        const categoryOrder = ['Meals', 'Breakfast', 'Lunch', 'Dinner', 'Snacks', 'Drinks', 'Beverages', 'Stationery', 'Essentials', 'Uncategorized'];
        
        itemsToProcess.forEach(item => {
            const category = item.category || 'Uncategorized';
            if (!groups[category]) groups[category] = (category === 'Snacks') ? {} : [];
            if (category === 'Snacks') {
                const subCat = item.subCategory;
                const id = subCat?._id || 'other';
                if (!subCategoryDetailsMap.has(id)) subCategoryDetailsMap.set(id, { _id: id, name: subCat?.name || 'Other Snacks', imageUrl: getFullImageUrl(subCat?.imageUrl) });
                if (!groups.Snacks[id]) groups.Snacks[id] = [];
                groups.Snacks[id].push(item);
            } else groups[category].push(item);
        });
        const sorted = {};
        categoryOrder.forEach(n => { if (groups[n]) sorted[n] = groups[n]; });
        return { ...sorted, subCategoryDetails: subCategoryDetailsMap };
    }, [menuItems, searchTerm, serviceMode]);

    useEffect(() => {
        const cats = Object.keys(groupedAndFilteredItems).filter(k => k !== 'subCategoryDetails');
        if (!loading && cats.length > 0 && !cats.includes(activeAdminCategory)) setActiveAdminCategory(cats[0]);
    }, [loading, groupedAndFilteredItems, activeAdminCategory]);

    return (
        <div className="min-h-screen bg-slate-900 font-sans relative flex text-white">
            <SparkleOverlay />
            
            <div className={`fixed inset-0 z-40 md:hidden transition-all ${isDrawerOpen ? 'bg-black/50 block' : 'hidden'}`} onClick={() => setIsDrawerOpen(false)}>
                <div className="w-64 h-full bg-slate-800 p-4" onClick={e => e.stopPropagation()}>
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-bold text-orange-400">Admin Menu</h3>
                        <button onClick={() => setIsDrawerOpen(false)}><LuX size={24} /></button>
                    </div>
                    <AdminSidebarNav onClose={() => setIsDrawerOpen(false)} serviceMode={serviceMode} />
                </div>
            </div>

            <aside className="hidden md:block w-64 bg-slate-800 border-r border-slate-700 sticky top-0 h-screen overflow-y-auto z-20">
                <div className="p-6">
                    <h1 className="text-2xl font-extrabold text-orange-400">Admin Portal</h1>
                    <div className={`mt-2 px-3 py-1 rounded-full text-[10px] font-black tracking-widest text-center uppercase border ${serviceMode === 'canteen' ? 'border-orange-500 text-orange-400 bg-orange-500/10' : 'border-blue-500 text-blue-400 bg-blue-500/10'}`}>
                        {serviceMode} Mode Active
                    </div>
                </div>
                <AdminSidebarNav onClose={() => {}} serviceMode={serviceMode} />
            </aside>

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

                        <div className="flex items-center space-x-2">
                            <span className="text-sm font-semibold text-slate-300 hidden sm:inline">Status:</span>
                            <button onClick={handleToggleStatus} className={`px-3 py-1 rounded-full font-bold transition-all ${isStatusOpen ? 'bg-green-600' : 'bg-red-600'}`}>{isStatusOpen ? 'ON' : 'OFF'}</button>
                        </div>
                        
                        <button onClick={handleLogout} className="bg-red-600 font-semibold py-2 px-4 rounded-lg flex items-center space-x-2 hover:bg-red-700 transition-colors"><LuLogOut size={18} /><span className="hidden sm:inline">Log Out</span></button>
                    </div>
                </header>

                <RealTimeClock />

                <main className="container mx-auto p-4 md:p-8">
                    <div className={`w-full h-48 md:h-64 mb-8 rounded-2xl flex flex-col items-center justify-center border transition-all duration-500 shadow-2xl backdrop-blur-sm ${serviceMode === 'canteen' ? 'bg-orange-900/10 border-orange-500/30' : 'bg-blue-900/10 border-blue-500/30'}`}>
                        <p className={`text-4xl md:text-5xl font-black uppercase tracking-tighter text-center px-4 ${serviceMode === 'canteen' ? 'text-orange-500' : 'text-blue-400'}`}>{serviceMode} Management</p>
                        <p className="text-slate-400 font-bold mt-2 tracking-widest uppercase text-xs">Administrative Overview & Control</p>
                    </div>

                    <div className="flex justify-between items-center bg-slate-700/50 p-4 rounded-xl mb-6 cursor-pointer hover:bg-slate-700 transition-colors" onClick={() => setIsHoursFormVisible(!isHoursFormVisible)}>
                        <h3 className="text-xl font-bold text-slate-100 flex items-center gap-2"><FaClock /> Manage {serviceMode} Hours</h3>
                        <span className="text-orange-400 font-bold uppercase text-xs">{isHoursFormVisible ? 'Hide Panel' : 'Expand Panel'}</span>
                    </div>

                    {isHoursFormVisible && (
                        <div className={`bg-slate-800 rounded-xl p-6 mb-10 border-t-4 shadow-2xl transition-all ${serviceMode === 'canteen' ? 'border-orange-500' : 'border-blue-500'}`}>
                            <form onSubmit={handleSaveHours}>
                                <div className="flex space-x-4 mb-4">
                                    <button type="button" onClick={() => setSelectedMeal('breakfast')} className={`py-2 px-4 rounded-lg font-bold transition-all ${selectedMeal === 'breakfast' ? (serviceMode === 'canteen' ? 'bg-orange-500' : 'bg-blue-600') + ' text-white' : 'bg-slate-700 text-slate-300'}`}>Breakfast</button>
                                    <button type="button" onClick={() => setSelectedMeal('lunch')} className={`py-2 px-4 rounded-lg font-bold transition-all ${selectedMeal === 'lunch' ? (serviceMode === 'canteen' ? 'bg-orange-500' : 'bg-blue-600') + ' text-white' : 'bg-slate-700 text-slate-300'}`}>Lunch</button>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <label className="text-slate-300 font-semibold text-sm">Start Time <SimpleTimeInput name="start" value={serviceHours[selectedMeal]?.start || ""} onChange={e => setServiceHours({...serviceHours, [selectedMeal]: { ...serviceHours[selectedMeal], start: e.target.value }})} /></label>
                                    <label className="text-slate-300 font-semibold text-sm">End Time <SimpleTimeInput name="end" value={serviceHours[selectedMeal]?.end || ""} onChange={e => setServiceHours({...serviceHours, [selectedMeal]: { ...serviceHours[selectedMeal], end: e.target.value }})} /></label>
                                </div>
                                <div className="mt-6 flex justify-between items-center">
                                    <button type="button" onClick={() => setServiceHours(DEFAULT_SERVICE_HOURS)} className="text-slate-400 text-xs font-bold flex items-center gap-2 hover:text-white transition-colors"><FaRedo size={10}/> RESTORE DEFAULTS</button>
                                    <button type="submit" className={`text-white py-2 px-8 rounded-lg font-bold transition-all shadow-lg ${serviceMode === 'canteen' ? 'bg-orange-600 hover:bg-orange-500' : 'bg-blue-600 hover:bg-blue-500'}`}>Update {serviceMode} Hours</button>
                                </div>
                            </form>
                        </div>
                    )}

                    <h2 className="text-3xl font-extrabold text-slate-100 mb-6 flex items-center justify-between">
                        <span>{searchTerm ? `Search Results for "${searchTerm}"` : 'Product Categories'}</span>
                        <div className="relative hidden lg:block">
                            <input type="search" placeholder="Search products..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="p-2 pl-8 rounded-lg bg-slate-700 border border-slate-600 text-white w-64 focus:ring-2 focus:ring-orange-500 outline-none text-sm" />
                            <FaSearch size={12} className="absolute left-2.5 top-3.5 text-slate-400" />
                        </div>
                    </h2>

                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-4">
                            <div className={`w-12 h-12 border-4 border-t-transparent rounded-full animate-spin ${serviceMode === 'canteen' ? 'border-orange-500' : 'border-blue-500'}`}></div>
                            <p className="font-bold italic text-sm tracking-widest">Loading {serviceMode} data...</p>
                        </div>
                    ) : error ? (
                        <div className="bg-red-900/20 border border-red-500 p-8 rounded-xl text-center">
                            <p className="text-red-400 font-bold mb-4">{error}</p>
                            <button onClick={fetchData} className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-500 transition-all font-bold">Retry Connection</button>
                        </div>
                    ) : (
                        <div className="space-y-12">
                            {groupedAndFilteredItems.searchResults ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                    {groupedAndFilteredItems.searchResults.map(i => {
                                        const outOfStock = i.stock === 0 || i.isAvailable === false;
                                        return (
                                            <div key={i._id} className="relative group">
                                                {outOfStock && (
                                                    <div className="absolute top-0 left-0 w-full h-[65%] bg-slate-900/80 z-20 flex items-center justify-center rounded-t-2xl pointer-events-none backdrop-blur-[2px] border-b border-red-500/30">
                                                        <div className="bg-red-600 text-white px-6 py-2 rounded-full font-black text-sm uppercase tracking-widest shadow-2xl ring-2 ring-red-400 animate-pulse">Out of Stock</div>
                                                    </div>
                                                )}
                                                <div className={outOfStock ? "grayscale-[0.5] opacity-90" : ""}>
                                                    <AdminMenuItemCard item={i} discountInfo={getOfferForItem(i)} onEdit={() => navigate(`/admin/menu/edit/${i._id}`)} onDelete={handleDeleteItem} />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <>
                                    <div className="flex flex-wrap gap-4 mb-8">
                                        {Object.keys(groupedAndFilteredItems).filter(k => k !== 'subCategoryDetails').map(c => (
                                            <button key={c} onClick={() => setActiveAdminCategory(c)} className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold border transition-all ${c === activeAdminCategory ? (serviceMode === 'canteen' ? 'bg-orange-600 border-orange-500 shadow-orange-900/20' : 'bg-blue-600 border-blue-500 shadow-blue-900/20') + ' text-white scale-105 shadow-lg' : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-200'}`}>
                                                {React.createElement(categoryIcons[c] || FaQuestionCircle, { size: 20 })} <span>{c}</span>
                                            </button>
                                        ))}
                                    </div>

                                    {activeAdminCategory && (
                                        <section className="mt-8 border-t border-slate-700/50 pt-8 animate-in fade-in duration-500">
                                            <div className="flex justify-between items-center mb-8">
                                                <h3 className={`text-3xl font-black flex items-center gap-3 tracking-tighter ${serviceMode === 'canteen' ? 'text-orange-400' : 'text-blue-400'}`}>
                                                    {React.createElement(categoryIcons[activeAdminCategory] || FaQuestionCircle, { size: 32 })} {activeAdminCategory}
                                                </h3>
                                                {activeAdminCategory === 'Snacks' && selectedAdminSubCategoryId && (
                                                    <button onClick={() => setSelectedAdminSubCategoryId(null)} className="bg-slate-800 text-slate-300 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-slate-700 transition-all font-bold text-xs"><FaArrowLeft /> BACK TO TYPES</button>
                                                )}
                                            </div>

                                            {activeAdminCategory === 'Snacks' && !selectedAdminSubCategoryId ? (
                                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
                                                    {[...groupedAndFilteredItems.subCategoryDetails.values()].map(s => <AdminSubCategoryCard key={s._id} subCategory={s} onClick={() => setSelectedAdminSubCategoryId(s._id)} />)}
                                                </div>
                                            ) : (
                                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                                    {(activeAdminCategory === 'Snacks' ? groupedAndFilteredItems.Snacks[selectedAdminSubCategoryId] : groupedAndFilteredItems[activeAdminCategory])?.map(i => {
                                                        const outOfStock = i.stock === 0 || i.isAvailable === false;
                                                        return (
                                                            <div key={i._id} className="relative group">
                                                                {outOfStock && (
                                                                    <div className="absolute top-0 left-0 w-full h-[65%] bg-slate-900/85 z-20 flex items-center justify-center rounded-t-2xl pointer-events-none backdrop-blur-[3px] border-b border-red-500/30">
                                                                        <div className="bg-red-600 text-white px-5 py-2 rounded-full font-black text-xs uppercase tracking-widest shadow-2xl ring-2 ring-red-400 animate-pulse">Out of Stock</div>
                                                                    </div>
                                                                )}
                                                                <div className={outOfStock ? "grayscale-[0.5] opacity-90 transition-all" : ""}>
                                                                    <AdminMenuItemCard item={i} discountInfo={getOfferForItem(i)} onEdit={() => navigate(`/admin/menu/edit/${i._id}`)} onDelete={handleDeleteItem} />
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </section>
                                    )}
                                </>
                            )}
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

export default AdminDashboardPage;