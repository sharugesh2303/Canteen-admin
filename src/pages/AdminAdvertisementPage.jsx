/* =======================================
 * FILE: src/pages/AdminAdvertisementPage.jsx
 * ======================================= */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { LuLogOut, LuMenu, LuX, LuStore, LuCoffee } from 'react-icons/lu';
import { VscFeedback } from "react-icons/vsc";
import { MdCampaign, MdLocalOffer } from "react-icons/md";
import { 
    FaPlusCircle, 
    FaUtensils, 
    FaClipboardList, 
    FaChartLine, 
    FaTrashAlt, 
    FaToggleOn, 
    FaToggleOff, 
    FaUpload 
} from 'react-icons/fa';

/* ================= API CONFIG ================= */
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:10000/api';
const API_ROOT_URL = (import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace("/api", "") : 'http://localhost:10000');
const POLLING_INTERVAL = 15 * 1000;

const getAdminAuthHeaders = (token) => ({
    'Authorization': `Bearer ${token}`,
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
            <div className="sparkle-container">
                {sparks.map((style, i) => <div key={i} className="spark" style={style}></div>)}
            </div>
        </>
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
            <NavItem to="/feedback" icon={VscFeedback} name="Student Feedback" />
            <NavItem to="/advertisement" icon={MdCampaign} name="Ads Management" isActive={true} />
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
const AdminAdvertisementPage = () => {
    const navigate = useNavigate();
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [serviceMode, setServiceMode] = useState(localStorage.getItem('admin_service_mode') || 'canteen');
    const [ads, setAds] = useState([]);
    const [imageFile, setImageFile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isStatusOpen, setIsStatusOpen] = useState(true);

    const handleLogout = useCallback(() => {
        localStorage.removeItem('admin_token');
        navigate('/login');
    }, [navigate]);

    const fetchAds = useCallback(async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('admin_token');
            if (!token) return navigate('/login');
            
            const response = await axios.get(`${API_BASE_URL}/admin/advertisements?location=${serviceMode}`, {
                headers: getAdminAuthHeaders(token),
            });
            setAds(response.data);
        } catch (err) {
            console.error('Failed to load ads.');
        } finally {
            setLoading(false);
        }
    }, [serviceMode, navigate]);

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

    useEffect(() => {
        fetchCurrentStatus();
        fetchAds();
        const interval = setInterval(fetchCurrentStatus, POLLING_INTERVAL);
        return () => clearInterval(interval);
    }, [serviceMode, fetchAds]);

    const handleModeChange = (newMode) => {
        setServiceMode(newMode);
        localStorage.setItem('admin_service_mode', newMode);
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!imageFile) return alert('Please select an image.');
        
        const token = localStorage.getItem('admin_token');
        const formData = new FormData();
        formData.append('image', imageFile);
        formData.append('location', serviceMode);

        try {
            await axios.post(`${API_BASE_URL}/admin/advertisements`, formData, {
                headers: { 
                    'Content-Type': 'multipart/form-data',
                    'Authorization': `Bearer ${token}`
                },
            });
            alert(`Ad uploaded successfully to ${serviceMode}!`);
            setImageFile(null);
            e.target.reset();
            fetchAds();
        } catch (err) {
            alert('Upload failed.');
        }
    };

    const handleDelete = async (adId) => {
        if (!window.confirm('Delete this advertisement?')) return;
        try {
            const token = localStorage.getItem('admin_token');
            await axios.delete(`${API_BASE_URL}/admin/advertisements/${adId}`, {
                headers: getAdminAuthHeaders(token),
            });
            fetchAds();
        } catch (err) { alert('Delete failed.'); }
    };

    const handleToggleAd = async (adId) => {
        try {
            const token = localStorage.getItem('admin_token');
            await axios.patch(`${API_BASE_URL}/admin/advertisements/${adId}/toggle`, {}, {
                headers: getAdminAuthHeaders(token),
            });
            fetchAds();
        } catch (err) { alert('Update failed.'); }
    };

    return (
        <div className="min-h-screen bg-slate-900 font-sans relative flex text-white">
            <SparkleOverlay />

            {/* MOBILE DRAWER */}
            <div className={`fixed inset-0 z-40 md:hidden transition-all ${isDrawerOpen ? 'bg-black/50 block' : 'hidden'}`} onClick={() => setIsDrawerOpen(false)}>
                <div className="w-64 h-full bg-slate-800 p-4" onClick={e => e.stopPropagation()}>
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

                        <div className="flex items-center space-x-2">
                            <button onClick={handleToggleStatus} className={`px-3 py-1 rounded-full font-bold transition-all ${isStatusOpen ? 'bg-green-600' : 'bg-red-600'}`}>{isStatusOpen ? 'ON' : 'OFF'}</button>
                        </div>
                        
                        <button onClick={handleLogout} className="bg-red-600 font-semibold py-2 px-4 rounded-lg flex items-center space-x-2 hover:bg-red-700 transition-colors"><LuLogOut size={18} /><span className="hidden sm:inline">Log Out</span></button>
                    </div>
                </header>

                <main className="container mx-auto p-4 md:p-8">
                    {/* HERO SECTION */}
                    <div className={`w-full h-48 md:h-64 mb-8 rounded-2xl flex flex-col items-center justify-center border transition-all duration-500 shadow-2xl backdrop-blur-sm ${serviceMode === 'canteen' ? 'bg-orange-900/10 border-orange-500/30' : 'bg-blue-900/10 border-blue-500/30'}`}>
                        <MdCampaign size={48} className={serviceMode === 'canteen' ? 'text-orange-500 mb-2' : 'text-blue-400 mb-2'} />
                        <p className={`text-4xl md:text-5xl font-black uppercase tracking-tighter text-center px-4 ${serviceMode === 'canteen' ? 'text-orange-500' : 'text-blue-400'}`}>{serviceMode} Ads</p>
                        <p className="text-slate-400 font-bold mt-2 tracking-widest uppercase text-xs">Visual Promotion Management</p>
                    </div>

                    {/* UPLOAD FORM */}
                    <div className="bg-slate-800 p-6 rounded-xl shadow-2xl mb-10 border border-slate-700 max-w-4xl mx-auto">
                        <h3 className="text-xl font-bold text-slate-100 mb-4 flex items-center gap-2"><FaUpload className="text-blue-500"/> Upload to {serviceMode}</h3>
                        <form onSubmit={handleUpload} className="flex flex-col md:flex-row items-center gap-4">
                            <input 
                                type="file" 
                                onChange={(e) => setImageFile(e.target.files[0])} 
                                className="flex-grow block w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 transition" 
                                accept="image/*" 
                                required 
                            />
                            <button type="submit" className="w-full md:w-auto bg-green-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-green-700 transition flex items-center justify-center space-x-2 shadow-lg active:scale-95">
                                <span>Upload Now</span>
                            </button>
                        </form>
                    </div>

                    {/* ADS GRID */}
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-4">
                            <div className={`w-12 h-12 border-4 border-t-transparent rounded-full animate-spin ${serviceMode === 'canteen' ? 'border-orange-500' : 'border-blue-500'}`}></div>
                            <p className="font-bold italic text-sm tracking-widest uppercase">Fetching {serviceMode} Ads...</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {ads.length === 0 ? (
                                <div className="col-span-full py-20 text-center bg-slate-800/50 rounded-2xl border border-dashed border-slate-700">
                                    <MdCampaign size={64} className="mx-auto mb-4 opacity-10" />
                                    <p className="text-slate-400 font-bold italic text-lg">No advertisements active in {serviceMode}.</p>
                                </div>
                            ) : (
                                ads.map(ad => (
                                    <div key={ad._id} className="bg-slate-800 rounded-2xl shadow-xl border border-slate-700 overflow-hidden group hover:ring-2 hover:ring-orange-500/50 transition-all duration-300">
                                        <div className="relative overflow-hidden aspect-video">
                                            <img 
                                                src={getFullImageUrl(ad.imageUrl)} 
                                                alt="Ad Preview" 
                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                                            />
                                            {!ad.isActive && (
                                                <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-[2px]">
                                                    <span className="bg-red-600 text-white px-4 py-1 rounded-full font-black text-xs uppercase tracking-widest">Hidden</span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="p-4 flex justify-between items-center bg-slate-800/50">
                                            <button onClick={() => handleToggleAd(ad._id)} 
                                                className={`px-4 py-2 rounded-xl font-black text-white text-xs transition-all flex items-center gap-2 active:scale-95 shadow-md ${ad.isActive ? 'bg-green-600 hover:bg-green-700' : 'bg-yellow-600 hover:bg-yellow-700 text-slate-900'}`}>
                                                {ad.isActive ? <FaToggleOn size={18} /> : <FaToggleOff size={18} />}
                                                <span>{ad.isActive ? 'VISIBLE' : 'HIDDEN'}</span>
                                            </button>
                                            <button onClick={() => handleDelete(ad._id)} 
                                                className="p-3 rounded-xl text-white bg-red-600 hover:bg-red-700 transition active:scale-95 shadow-md">
                                                <FaTrashAlt size={16} />
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