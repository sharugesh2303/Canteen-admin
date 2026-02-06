import React, { useState, useEffect, forwardRef, useMemo, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { asBlob } from 'html-docx-js-typescript';
import { saveAs } from 'file-saver';

// Icons
import { LuLogOut, LuMenu, LuX, LuStore, LuCoffee } from "react-icons/lu";
import {
    FaCalendarAlt,
    FaBoxOpen,
    FaChartLine,
    FaUtensils,
    FaClipboardList,
    FaPlusCircle,
    FaSearch,
    FaFileCsv,
    FaFileWord,
} from "react-icons/fa";
import { VscFeedback } from "react-icons/vsc";
import { MdCampaign, MdLocalOffer } from "react-icons/md";

/* ================= API CONFIG ================= */
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:10000/api";

const getAuthHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem("admin_token")}`,
    "Content-Type": "application/json",
});

/* ================= CSV HELPERS ================= */
const downloadCSV = (filename, rows) => {
    if (!rows || !rows.length) return;
    const csv = Object.keys(rows[0]).join(",") + "\n" +
        rows.map((r) => Object.values(r).map((v) => `"${v}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
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
            <div className="sparkle-container">{sparks.map((style, i) => <div key={i} className="spark" style={style}></div>)}</div>
        </>
    );
};

const CustomDateInput = forwardRef(({ value, onClick }, ref) => (
    <button
        ref={ref}
        onClick={onClick}
        className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-lg border border-slate-700 hover:bg-slate-700 transition shadow-md"
    >
        <FaCalendarAlt className="text-orange-400" />
        <span className="font-bold">{value}</span>
    </button>
));

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
            <NavItem to="/orders" icon={FaClipboardList} name="Orders" />
            <NavItem to="/revenue" icon={FaChartLine} name="Revenue & Sales" active={true} />
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

/* ================= MAIN REVENUE PAGE ================= */
const RevenuePage = () => {
    const navigate = useNavigate();
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [serviceMode, setServiceMode] = useState(localStorage.getItem('admin_service_mode') || 'canteen');
    
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [searchTerm, setSearchTerm] = useState("");

    const handleLogout = useCallback(() => {
        localStorage.removeItem("admin_token");
        navigate("/login");
    }, [navigate]);

    const fetchRevenue = async (date, loc) => {
        setLoading(true);
        try {
            setError("");
            const dateStr = date.toISOString().split("T")[0];
            const res = await axios.get(
                `${API_BASE_URL}/admin/daily-revenue?date=${dateStr}&location=${loc}`,
                { headers: getAuthHeaders() }
            );
            setData(res.data);
        } catch (err) {
            setError(`Failed to fetch ${loc} revenue data`);
            setData(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRevenue(selectedDate, serviceMode);
    }, [selectedDate, serviceMode]);

    const handleModeChange = (newMode) => {
        setServiceMode(newMode);
        localStorage.setItem('admin_service_mode', newMode);
    };

    const filteredProducts = useMemo(() => {
        if (!data?.productSales) return [];
        if (!searchTerm.trim()) return data.productSales;
        return data.productSales.filter((p) =>
            p.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [data, searchTerm]);

    /* ================= WORD EXPORT LOGIC ================= */
    const exportToWord = async (type) => {
        if (!data) return;
        const dateStr = selectedDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
        const locationTitle = serviceMode.toUpperCase();

        // Helper to get image as base64 for Word compatibility
        const getLogoBase64 = async () => {
            try {
                const response = await fetch('/assets/institution-logo.png');
                const blob = await response.blob();
                return new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result);
                    reader.readAsDataURL(blob);
                });
            } catch (e) {
                console.error("Logo fetch failed", e);
                return ""; 
            }
        };

        const logoBase64 = await getLogoBase64();

        let contentHtml = `
            <html>
                <head><meta charset="utf-8"></head>
                <body style="font-family: Arial, sans-serif; padding: 20px;">
                    <div style="text-align: center; margin-bottom: 20px;">
                        ${logoBase64 ? `<img src="${logoBase64}" width="600" />` : `<h1 style="color: #f97316;">JJ SMART DASHBOARD</h1>`}
                    </div>
                    <div style="text-align: center; border-top: 2px solid #475569; padding-top: 10px;">
                        <h2 style="color: #475569; margin: 0; text-transform: uppercase;">${locationTitle} REVENUE REPORT</h2>
                        <p style="color: #64748b; font-weight: bold;">Date: ${dateStr}</p>
                    </div>
        `;

        if (type === 'summary') {
            contentHtml += `
                <div style="margin-top: 30px;">
                    <h3 style="color: #f97316;">Executive Performance Summary</h3>
                    <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
                        <tr style="background-color: #f8fafc;">
                            <td style="padding: 12px; border: 1px solid #cbd5e1; font-weight: bold;">Metric Name</td>
                            <td style="padding: 12px; border: 1px solid #cbd5e1; font-weight: bold;">Calculated Value</td>
                        </tr>
                        <tr>
                            <td style="padding: 12px; border: 1px solid #cbd5e1;">Total Daily Orders</td>
                            <td style="padding: 12px; border: 1px solid #cbd5e1;">${data.totalOrders}</td>
                        </tr>
                        <tr>
                            <td style="padding: 12px; border: 1px solid #cbd5e1;">Total Daily Revenue</td>
                            <td style="padding: 12px; border: 1px solid #cbd5e1; color: #16a34a; font-weight: bold;">₹${data.totalRevenue.toLocaleString("en-IN")}</td>
                        </tr>
                    </table>
                </div>
            `;
        } else {
            contentHtml += `
                <div style="margin-top: 30px;">
                    <h3 style="color: #f97316;">Product Sales Details</h3>
                    <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
                        <thead>
                            <tr style="background-color: #f8fafc;">
                                <th style="padding: 10px; border: 1px solid #cbd5e1; text-align: left;">Product Description</th>
                                <th style="padding: 10px; border: 1px solid #cbd5e1; text-align: center;">Qty Sold</th>
                                <th style="padding: 10px; border: 1px solid #cbd5e1; text-align: right;">Total Sales (₹)</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${filteredProducts.map(p => `
                                <tr>
                                    <td style="padding: 8px; border: 1px solid #cbd5e1;">${p.name}</td>
                                    <td style="padding: 8px; border: 1px solid #cbd5e1; text-align: center;">${p.quantity}</td>
                                    <td style="padding: 8px; border: 1px solid #cbd5e1; text-align: right;">${p.revenue.toFixed(2)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `;
        }

        contentHtml += `
                    <div style="margin-top: 50px; text-align: center; font-size: 10px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 10px;">
                        <p>This is an electronically generated report from the JJ Smart Canteen Admin Portal.</p>
                        <p>Generated on: ${new Date().toLocaleString('en-IN')}</p>
                    </div>
                </body>
            </html>
        `;

        const blob = await asBlob(contentHtml);
        saveAs(blob, `${locationTitle}_${type}_${selectedDate.toISOString().split("T")[0]}.docx`);
    };

    const exportProductCSV = () => {
        if (!data) return;
        downloadCSV(`${serviceMode.toUpperCase()}_revenue_${selectedDate.toISOString().split("T")[0]}.csv`,
            filteredProducts.map((p) => ({
                Date: selectedDate.toISOString().split("T")[0],
                Location: serviceMode.toUpperCase(),
                Product: p.name,
                Quantity: p.quantity,
                Revenue: p.revenue.toFixed(2),
            }))
        );
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

                <main className="container mx-auto p-4 md:p-8 space-y-8">
                    <div className={`w-full h-48 md:h-64 rounded-2xl flex flex-col items-center justify-center border transition-all duration-500 shadow-2xl backdrop-blur-sm ${serviceMode === 'canteen' ? 'bg-orange-900/10 border-orange-500/30' : 'bg-blue-900/10 border-blue-500/30'}`}>
                        <FaChartLine size={48} className={serviceMode === 'canteen' ? 'text-orange-500 mb-4' : 'text-blue-400 mb-4'} />
                        <p className={`text-4xl md:text-5xl font-black uppercase tracking-tighter text-center px-4 ${serviceMode === 'canteen' ? 'text-orange-500' : 'text-blue-400'}`}>{serviceMode} Revenue</p>
                        <p className="text-slate-400 font-bold mt-2 tracking-widest uppercase text-xs">Sales Performance Analysis</p>
                    </div>

                    {/* TOP CONTROLS */}
                    <div className="flex flex-col lg:flex-row justify-between items-center gap-6 bg-slate-800/50 p-6 rounded-2xl border border-slate-700/50 shadow-xl">
                        <div className="flex flex-wrap items-center gap-4">
                            <DatePicker selected={selectedDate} onChange={setSelectedDate} customInput={<CustomDateInput />} />
                            {data && (
                                <div className="flex flex-wrap gap-2">
                                    <button onClick={() => exportToWord('summary')} className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-indigo-700 transition flex items-center gap-2 text-sm shadow-md"><FaFileWord /> Summary (Doc)</button>
                                    <button onClick={() => exportToWord('products')} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-700 transition flex items-center gap-2 text-sm shadow-md"><FaFileWord /> Products (Doc)</button>
                                    <button onClick={exportProductCSV} className="bg-slate-700 text-white px-4 py-2 rounded-lg font-bold hover:bg-slate-600 transition flex items-center gap-2 text-sm shadow-md"><FaFileCsv /> CSV</button>
                                </div>
                            )}
                        </div>
                        
                        <div className="relative w-full max-w-md">
                            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input type="text" placeholder="Search product reports..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} 
                                   className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500 transition shadow-inner" />
                        </div>
                    </div>

                    {/* STATS CARDS */}
                    {data && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="bg-slate-800 p-8 rounded-3xl border border-slate-700 shadow-2xl relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform"><FaClipboardList size={80} /></div>
                                <p className="text-slate-400 font-bold uppercase text-xs tracking-[0.2em] mb-2">Total Daily Orders</p>
                                <p className="text-6xl font-black text-orange-500 tracking-tighter">{data.totalOrders}</p>
                            </div>

                            <div className="bg-slate-800 p-8 rounded-3xl border border-slate-700 shadow-2xl relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform"><FaChartLine size={80} /></div>
                                <p className="text-slate-400 font-bold uppercase text-xs tracking-[0.2em] mb-2">Total Daily Revenue</p>
                                <p className="text-6xl font-black text-green-400 tracking-tighter">
                                    ₹{data.totalRevenue.toLocaleString("en-IN", { minimumFractionDigits: 0 })}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* PRODUCT TABLE */}
                    <div className="bg-slate-800 rounded-3xl border border-slate-700 overflow-hidden shadow-2xl">
                        <div className={`p-6 border-b border-slate-700 flex items-center gap-3 ${serviceMode === 'canteen' ? 'bg-orange-500/5' : 'bg-blue-500/5'}`}>
                            <FaBoxOpen className={serviceMode === 'canteen' ? 'text-orange-400' : 'text-blue-400'} size={24} />
                            <h2 className="text-xl font-black tracking-tight uppercase">Sales Breakdown</h2>
                        </div>

                        <div className="overflow-x-auto">
                            {loading ? (
                                <div className="flex flex-col items-center py-20 gap-4">
                                    <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                                    <p className="text-slate-500 font-bold animate-pulse">Analyzing sales data...</p>
                                </div>
                            ) : filteredProducts.length === 0 ? (
                                <div className="flex flex-col items-center py-24 text-slate-500 gap-4">
                                    <FaBoxOpen size={64} className="opacity-10" />
                                    <p className="text-lg font-bold italic">No records found for this selection.</p>
                                </div>
                            ) : (
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="bg-slate-900/50 text-slate-400 uppercase text-[10px] font-black tracking-[0.2em]">
                                            <th className="px-8 py-5">Product Name</th>
                                            <th className="px-8 py-5">Quantity Sold</th>
                                            <th className="px-8 py-5 text-right">Revenue Earned</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-700/50">
                                        {filteredProducts.map((p, i) => (
                                            <tr key={i} className="hover:bg-slate-700/30 transition-colors group">
                                                <td className="px-8 py-5 font-bold text-slate-100 group-hover:text-orange-400 transition-colors">{p.name}</td>
                                                <td className="px-8 py-5"><span className="bg-slate-900 px-3 py-1 rounded-full text-xs font-bold text-slate-300">{p.quantity} units</span></td>
                                                <td className="px-8 py-5 text-right text-green-400 font-black text-lg">
                                                    ₹{p.revenue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default RevenuePage;