import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

/* ================= ICONS ================= */
import { LuLogOut, LuMenu, LuX, LuStore, LuCoffee } from 'react-icons/lu'; 
import { VscFeedback } from "react-icons/vsc";
import { MdCampaign, MdLocalOffer, MdFastfood, MdEdit } from "react-icons/md"; 
import { 
    FaPlusCircle, FaUtensils, FaClipboardList, 
    FaChartLine, FaSearch, FaClock, FaTrash, 
    FaTag, FaCalendarAlt, FaCheck, FaTimes, FaListUl
} from 'react-icons/fa';

/* ================= API CONFIG ================= */
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:10000/api';
const API_ROOT_URL = (import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace("/api", "") : 'http://localhost:10000');

/* ================= HELPERS ================= */
const getAdminAuthHeaders = (token) => ({
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
});

const getFullImageUrl = (imagePath) => {
    if (!imagePath) return 'https://placehold.co/100x100/1e293b/475569?text=No+Img';
    if (imagePath.startsWith('http')) return imagePath;
    if (imagePath.startsWith('/uploads/')) return `${API_ROOT_URL}${imagePath}`;
    return `${API_ROOT_URL}/uploads/${imagePath}`;
};

const isOfferExpired = (endDate, endTime) => {
    if (!endDate) return false;
    const now = new Date();
    const expiryString = `${endDate.slice(0, 10)}T${endTime || '23:59:59'}`;
    const expiryDate = new Date(expiryString);
    return now > expiryDate;
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
        <div className="sparkle-container">
            <style>{`
                @keyframes sparkle-animation { 0% { transform: scale(0) translate(0, 0); opacity: 0; } 50% { opacity: 1; } 100% { transform: scale(1) translate(var(--x), var(--y)); opacity: 0; } }
                .sparkle-container { position: fixed; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 0; overflow: hidden; }
                .spark { position: absolute; top: 50%; left: 50%; width: var(--size); height: var(--size); background-color: #fbbF24; border-radius: 50%; animation: sparkle-animation var(--duration) var(--delay) infinite linear; box-shadow: 0 0 4px #fbbF24, 0 0 8px #fbbF24; }
            `}</style>
            {sparks}
        </div>
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
                <span className="font-semibold text-white">{name}</span>
            </button>
        </Link>
    );

    return (
        <div className="space-y-2 p-4 pt-0">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-3 border-b border-slate-700 pb-2">Actions</h3>
            <NavItem to="/menu" icon={FaUtensils} name="Menu Management" />
            <NavItem to="/orders" icon={FaClipboardList} name="Orders" />
            <NavItem to="/revenue" icon={FaChartLine} name="Revenue & Sales" />
            <NavItem to="/admin/offers" icon={MdLocalOffer} name="Offers & Discounts" isActive={true} />
            <NavItem to="/feedback" icon={VscFeedback} name="Student Feedback" />
            <NavItem to="/advertisement" icon={MdCampaign} name="Ads Management" />
            <div className="pt-4 border-t border-slate-700 mt-4">
                <button onClick={() => { navigate(`/admin/menu/add?location=${serviceMode}`); onClose(); }} 
                        className="w-full flex items-center p-3 rounded-lg transition-colors duration-200 space-x-3 text-left bg-green-600 text-white hover:bg-green-700 shadow-md">
                    <FaPlusCircle size={20} className="flex-shrink-0" />
                    <span className="font-bold">Add New Item</span>
                </button>
            </div>
        </div>
    );
};

/* ================= MAIN PAGE COMPONENT ================= */
const AdminOffersPage = () => {
    const navigate = useNavigate();
    const token = localStorage.getItem("admin_token");
    
    // 🟢 Read persistent serviceMode
    const [serviceMode, setServiceMode] = useState(localStorage.getItem('admin_service_mode') || 'canteen');
    
    const headers = useMemo(() => getAdminAuthHeaders(token), [token]);

    const [offers, setOffers] = useState([]);
    const [menuItems, setMenuItems] = useState([]);
    const [itemSearch, setItemSearch] = useState("");
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState(null); 

    const [form, setForm] = useState({
        name: "",
        discountPercentage: "",
        startDate: "",
        endDate: "",
        startTime: "",
        endTime: "",
        applicableCategories: [],
        applicableItems: [],
    });

    const handleLogout = useCallback(() => { 
        localStorage.removeItem('admin_token'); 
        navigate('/login'); 
    }, [navigate]);

    // 🟢 Save and switch modes
    const handleModeChange = (newMode) => {
        setServiceMode(newMode);
        localStorage.setItem('admin_service_mode', newMode);
        resetForm();
    };

    const fetchOffers = async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/admin/offers?mode=${serviceMode}`, { headers });
            setOffers(res.data);
        } catch (err) { console.error("Error fetching offers", err); }
    };

    const fetchMenuItems = async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/admin/menu?mode=${serviceMode}`, { headers });
            setMenuItems(res.data || []);
        } catch (err) { console.error("Error fetching menu", err); }
        finally { setLoading(false); }
    };

    useEffect(() => {
        if (!token) return handleLogout();
        fetchOffers();
        fetchMenuItems();
    }, [token, handleLogout, serviceMode]);

    /* ================= DERIVED LOGIC ================= */
    const availableCategories = useMemo(() => {
        const set = new Set();
        menuItems.forEach((item) => { if (item.category) set.add(item.category); });
        return Array.from(set).sort();
    }, [menuItems]);

    const groupedFilteredItems = useMemo(() => {
        const filtered = menuItems.filter((item) => {
            const matchesCategoryFilter =
                form.applicableCategories.length === 0 ||
                form.applicableCategories.includes(item.category);
            const matchesSearch = item.name.toLowerCase().includes(itemSearch.toLowerCase());
            return matchesCategoryFilter && matchesSearch;
        });

        return filtered.reduce((acc, item) => {
            const cat = item.category || 'Uncategorized';
            if (!acc[cat]) acc[cat] = [];
            acc[cat].push(item);
            return acc;
        }, {});
    }, [menuItems, form.applicableCategories, itemSearch]);

    /* ================= HANDLERS ================= */
    const toggleCategoryFilter = (category) => {
        setForm((prev) => ({
            ...prev,
            applicableCategories: prev.applicableCategories.includes(category)
                ? prev.applicableCategories.filter((c) => c !== category)
                : [...prev.applicableCategories, category],
        }));
    };

    const toggleItem = (id) => {
        setForm((prev) => ({
            ...prev,
            applicableItems: prev.applicableItems.includes(id)
                ? prev.applicableItems.filter((i) => i !== id)
                : [...prev.applicableItems, id],
        }));
    };

    const toggleSelectAllInCategory = (categoryItems) => {
        const categoryIds = categoryItems.map(i => i._id);
        const allSelected = categoryIds.every(id => form.applicableItems.includes(id));

        setForm(prev => {
            let updatedItems;
            if (allSelected) {
                updatedItems = prev.applicableItems.filter(id => !categoryIds.includes(id));
            } else {
                const toAdd = categoryIds.filter(id => !prev.applicableItems.includes(id));
                updatedItems = [...prev.applicableItems, ...toAdd];
            }
            return { ...prev, applicableItems: updatedItems };
        });
    };

    const isItemSelected = (id) => form.applicableItems.includes(id);

    const getDiscountedPrice = (price) => {
        if (!form.discountPercentage) return price;
        const discount = (price * form.discountPercentage) / 100;
        return Math.round(price - discount);
    };

    const openOfferForEdit = (offer) => {
        setEditingId(offer._id);
        setForm({
            name: offer.name,
            discountPercentage: offer.discountPercentage,
            startDate: offer.startDate ? offer.startDate.slice(0, 10) : "",
            endDate: offer.endDate ? offer.endDate.slice(0, 10) : "",
            startTime: offer.startTime || "",
            endTime: offer.endTime || "",
            applicableCategories: offer.applicableCategories || [],
            applicableItems: offer.applicableItems.map(item => typeof item === 'object' ? item._id : item) || [],
        });
        window.scrollTo({ top: 0, behavior: 'smooth' }); 
    };

    const resetForm = () => {
        setEditingId(null);
        setForm({
            name: "", discountPercentage: "", startDate: "", endDate: "",
            startTime: "", endTime: "", applicableCategories: [], applicableItems: [],
        });
        setItemSearch("");
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            // ✅ PERSISTENCE FIX: Ensure location is sent so it saves in the right shop
            const offerPayload = {
                ...form,
                location: serviceMode 
            };

            if (editingId) {
                await axios.put(`${API_BASE_URL}/admin/offers/${editingId}`, offerPayload, { headers });
                alert("Offer Updated Successfully!");
            } else {
                await axios.post(`${API_BASE_URL}/admin/offers`, offerPayload, { headers });
                alert("Offer Created Successfully!");
            }
            fetchOffers();
            resetForm();
        } catch (err) { 
            console.error("Save error:", err.response?.data);
            alert("Failed to save offer."); 
        }
    };

    const deleteOffer = async (id) => {
        if (!window.confirm("Delete this offer?")) return;
        try {
            await axios.delete(`${API_BASE_URL}/admin/offers/${id}`, { headers });
            fetchOffers();
            if(editingId === id) resetForm();
        } catch (err) { alert("Delete failed."); }
    };

    return (
        <div className="min-h-screen bg-slate-900 font-sans relative flex text-white">
            <SparkleOverlay />

            {/* Mobile Drawer */}
            <div className={`fixed inset-0 z-40 md:hidden transition-all ${isDrawerOpen ? 'bg-black/50 block' : 'hidden'}`} onClick={() => setIsDrawerOpen(false)}>
                <div className="w-64 h-full bg-slate-800 p-4" onClick={e => e.stopPropagation()}>
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-bold text-orange-400">Admin Menu</h3>
                        <button onClick={() => setIsDrawerOpen(false)}><LuX size={24} className="text-white"/></button>
                    </div>
                    <AdminSidebarNav onClose={() => setIsDrawerOpen(false)} serviceMode={serviceMode} />
                </div>
            </div>

            {/* Desktop Sidebar */}
            <aside className="hidden md:block w-64 bg-slate-800 border-r border-slate-700 sticky top-0 h-screen overflow-y-auto z-20">
                <div className="p-6">
                    <h1 className="text-2xl font-extrabold text-orange-400">Admin Portal</h1>
                    <div className={`mt-2 px-3 py-1 rounded-full text-[10px] font-black tracking-widest text-center uppercase border ${serviceMode === 'canteen' ? 'border-orange-500 text-orange-400 bg-orange-500/10' : 'border-blue-500 text-blue-400 bg-blue-500/10'}`}>
                        {serviceMode} Mode
                    </div>
                </div>
                <AdminSidebarNav onClose={() => { }} serviceMode={serviceMode} />
            </aside>

            <div className="flex-grow relative z-10">
                <header className="bg-gray-900 text-white p-4 flex justify-between items-center sticky top-0 z-30 border-b border-slate-700 shadow-lg">
                    <div className="flex items-center space-x-3">
                        <button className="md:hidden" onClick={() => setIsDrawerOpen(true)}><LuMenu size={24} /></button>
                        <div className="text-xl font-extrabold text-orange-400 italic uppercase">JJ SMART DASHBOARD</div>
                    </div>

                    <div className="flex items-center space-x-4">
                        <div className="flex items-center bg-slate-800 rounded-full p-1 border border-slate-700 shadow-inner">
                            <button 
                                onClick={() => handleModeChange('canteen')}
                                className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-black transition-all duration-300 ${serviceMode === 'canteen' ? 'bg-orange-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}
                            >
                                <LuStore size={14} /> CANTEEN
                            </button>
                            <button 
                                onClick={() => handleModeChange('cafeteria')}
                                className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-black transition-all duration-300 ${serviceMode === 'cafeteria' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}
                            >
                                <LuCoffee size={14} /> CAFETERIA
                            </button>
                        </div>
                        
                        <button onClick={handleLogout} className="bg-red-600 font-semibold py-2 px-4 rounded-lg flex items-center space-x-2 hover:bg-red-700 transition-all">
                            <LuLogOut size={18} /><span>Log Out</span>
                        </button>
                    </div>
                </header>

                <RealTimeClock />

                <main className="container mx-auto p-4 md:p-8">
                    <div className={`w-full h-32 md:h-48 mb-8 rounded-2xl flex flex-col items-center justify-center border shadow-2xl backdrop-blur-sm transition-all duration-500 ${serviceMode === 'canteen' ? 'bg-orange-900/10 border-orange-500/30' : 'bg-blue-900/10 border-blue-500/30'}`}>
                        <MdLocalOffer className={`${serviceMode === 'canteen' ? 'text-orange-400' : 'text-blue-400'} text-6xl mb-2 drop-shadow-[0_0_10px_rgba(251,191,36,0.4)]`} />
                        <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Offers: {serviceMode}</h2>
                    </div>

                    <div className="grid lg:grid-cols-3 gap-8">
                        {/* LEFT COLUMN: FORM */}
                        <div className="lg:col-span-1">
                            <div className={`bg-slate-800 border-slate-700 border rounded-2xl p-6 shadow-2xl sticky top-24 border-t-4 ${serviceMode === 'canteen' ? 'border-t-orange-500' : 'border-t-blue-500'}`}>
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className={`text-xl font-bold flex items-center gap-2 ${serviceMode === 'canteen' ? 'text-orange-400' : 'text-blue-400'}`}>
                                        {editingId ? <><MdEdit /> Edit Campaign</> : <><FaPlusCircle /> New Campaign</>}
                                    </h3>
                                    {editingId && (
                                        <button onClick={resetForm} className="text-slate-400 hover:text-white flex items-center gap-1 text-sm">
                                            <FaTimes /> Cancel
                                        </button>
                                    )}
                                </div>
                                <form onSubmit={handleSubmit} className="space-y-5">
                                    <div>
                                        <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1">Offer Name</label>
                                        <input placeholder="e.g. Weekend Special" className="w-full p-3 rounded-lg bg-slate-900 border border-slate-700 text-white outline-none focus:ring-2 focus:ring-orange-500 transition-all" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1">Discount (%)</label>
                                        <input type="number" placeholder="10" className="w-full p-3 rounded-lg bg-slate-900 border border-slate-700 text-white outline-none focus:ring-2 focus:ring-orange-500 transition-all" value={form.discountPercentage} onChange={(e) => setForm({ ...form, discountPercentage: e.target.value })} required />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-xs font-bold text-slate-300 uppercase block mb-1">Start Date</label>
                                            <input type="date" className="w-full p-3 bg-slate-900 rounded-lg border border-slate-700 text-sm text-white" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} required />
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-slate-300 uppercase block mb-1">End Date</label>
                                            <input type="date" className="w-full p-3 bg-slate-900 rounded-lg border border-slate-700 text-sm text-white" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} required />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-xs font-bold text-slate-300 uppercase block mb-1">Start Time</label>
                                            <input type="time" className="w-full p-3 bg-slate-900 rounded-lg border border-slate-700 text-sm text-white" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} required />
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-slate-300 uppercase block mb-1">End Time</label>
                                            <input type="time" className="w-full p-3 bg-slate-900 rounded-lg border border-slate-700 text-sm text-white" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} required />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-300 uppercase mb-3 block">Category Selection Filter</label>
                                        <div className="flex flex-wrap gap-2">
                                            {availableCategories.map((cat) => (
                                                <button key={cat} type="button" onClick={() => toggleCategoryFilter(cat)} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${form.applicableCategories.includes(cat) ? (serviceMode === 'canteen' ? 'bg-orange-600 border-orange-500' : 'bg-blue-600 border-blue-500') + ' text-white' : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'}`}>{cat}</button>
                                            ))}
                                        </div>
                                    </div>
                                    <button className={`w-full text-white font-black py-4 rounded-xl shadow-xl transition-all transform active:scale-95 flex items-center justify-center gap-2 ${serviceMode === 'canteen' ? 'bg-orange-600 hover:bg-orange-500' : 'bg-blue-600 hover:bg-blue-500'}`}>
                                        {editingId ? <><MdEdit /> UPDATE CAMPAIGN</> : <><FaPlusCircle /> LAUNCH CAMPAIGN</>}
                                    </button>
                                </form>
                            </div>
                        </div>

                        {/* RIGHT COLUMN: SELECTION */}
                        <div className="lg:col-span-2 space-y-8">
                            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-xl">
                                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                                    <FaUtensils className={serviceMode === 'canteen' ? 'text-orange-400' : 'text-blue-400'}/> Pick {serviceMode} Products
                                </h3>
                                <div className="relative mb-6">
                                    <FaSearch className="absolute left-4 top-4 text-slate-500" />
                                    <input placeholder="Search products..." className="w-full p-4 pl-12 rounded-xl bg-slate-900 border border-slate-700 text-white outline-none focus:ring-2 focus:ring-orange-500 transition-all" value={itemSearch} onChange={(e) => setItemSearch(e.target.value)} />
                                </div>
                                <div className="max-h-[600px] overflow-y-auto pr-2 custom-scrollbar space-y-8">
                                    {Object.keys(groupedFilteredItems).sort().map(categoryName => {
                                        const categoryProducts = groupedFilteredItems[categoryName];
                                        const allSelected = categoryProducts.every(p => form.applicableItems.includes(p._id));
                                        return (
                                            <div key={categoryName} className="space-y-4">
                                                <div className={`flex justify-between items-center bg-slate-700/30 p-3 rounded-xl border-l-4 ${serviceMode === 'canteen' ? 'border-orange-500' : 'border-blue-500'}`}>
                                                    <h4 className={`text-lg font-black uppercase flex items-center gap-2 ${serviceMode === 'canteen' ? 'text-orange-400' : 'text-blue-400'}`}>
                                                        <FaListUl size={16}/> {categoryName}
                                                    </h4>
                                                    <button type="button" onClick={() => toggleSelectAllInCategory(categoryProducts)} className={`px-4 py-2 rounded-lg text-xs font-bold border transition-all ${allSelected ? (serviceMode === 'canteen' ? 'bg-orange-500' : 'bg-blue-600') + ' text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}>Select All</button>
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                    {categoryProducts.map((item) => (
                                                        <div key={item._id} onClick={() => toggleItem(item._id)} className={`p-4 rounded-xl border-2 cursor-pointer flex justify-between items-center transition-all ${isItemSelected(item._id) ? (serviceMode === 'canteen' ? 'border-orange-500 bg-orange-500/10' : 'border-blue-500 bg-blue-500/10') : 'border-slate-700 bg-slate-900 hover:border-slate-500'}`}>
                                                            <div className="flex items-center gap-4">
                                                                <div className={`w-5 h-5 rounded flex items-center justify-center transition-all border-2 ${isItemSelected(item._id) ? (serviceMode === 'canteen' ? 'bg-orange-500 border-orange-500' : 'bg-blue-600 border-blue-500') : 'border-slate-600'}`}>
                                                                    {isItemSelected(item._id) && <FaCheck className="text-white text-[10px]" />}
                                                                </div>
                                                                <img src={getFullImageUrl(item.imageUrl)} alt={item.name} className="w-10 h-10 object-cover rounded-lg border border-slate-600" />
                                                                <span className="text-sm font-bold text-white">{item.name}</span>
                                                            </div>
                                                            <div className="text-right">
                                                                <p className="text-[10px] line-through text-slate-500 font-bold">₹{item.price}</p>
                                                                <p className="text-sm text-green-400 font-black">₹{getDiscountedPrice(item.price)}</p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* ACTIVE OFFERS */}
                            <div>
                                <h3 className="text-2xl font-black text-white mb-6 flex items-center gap-3">
                                    <FaTag className={serviceMode === 'canteen' ? 'text-orange-500' : 'text-blue-500'} /> Active {serviceMode} Campaigns
                                </h3>
                                <div className="grid sm:grid-cols-2 gap-5">
                                    {offers.map((offer) => {
                                        const expired = isOfferExpired(offer.endDate, offer.endTime);
                                        return (
                                            <div key={offer._id} onClick={() => openOfferForEdit(offer)} className={`bg-slate-800 border-t-4 rounded-2xl p-6 shadow-2xl relative cursor-pointer transition-all hover:-translate-y-1 ${editingId === offer._id ? 'border-blue-500' : expired ? 'border-red-600 grayscale' : (serviceMode === 'canteen' ? 'border-orange-500' : 'border-blue-500')}`}>
                                                {expired && <div className="absolute top-4 -right-12 bg-red-600 text-white text-[10px] font-black px-12 py-1 rotate-45 shadow-lg">Expired</div>}
                                                <div className="absolute top-0 right-0 p-4 opacity-0 hover:opacity-100"><button onClick={(e) => { e.stopPropagation(); deleteOffer(offer._id); }} className="text-slate-400 hover:text-red-500 p-2 bg-slate-900 rounded-full transition-all"><FaTrash size={14}/></button></div>
                                                <div className="flex flex-col h-full">
                                                    <h4 className={`text-xl font-black leading-tight mb-2 ${expired ? 'text-slate-400' : 'text-white'}`}>{offer.name}</h4>
                                                    <span className={`inline-block text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-lg mb-4 self-start ${expired ? 'bg-slate-600' : (serviceMode === 'canteen' ? 'bg-orange-500' : 'bg-blue-600')}`}>{offer.discountPercentage}% OFF</span>
                                                    <div className="mt-auto space-y-2 pt-4 border-t border-slate-700 text-xs text-slate-300 font-bold">
                                                        <div className="flex items-center gap-3"><FaCalendarAlt className={serviceMode === 'canteen' ? 'text-orange-500' : 'text-blue-500'} /> {offer.startDate?.slice(0, 10)} — {offer.endDate?.slice(0, 10)}</div>
                                                        <div className="flex items-center gap-3"><FaClock className={serviceMode === 'canteen' ? 'text-orange-500' : 'text-blue-500'} /> {offer.startTime} to {offer.endTime}</div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    {offers.length === 0 && <div className="col-span-2 text-center py-16 border-4 border-dashed border-slate-800 rounded-3xl text-slate-600 font-bold italic">No active discount campaigns for {serviceMode}.</div>}
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 5px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: #1e293b; border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #475569; border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #fbbf24; }
            `}</style>
        </div>
    );
};

export default AdminOffersPage;