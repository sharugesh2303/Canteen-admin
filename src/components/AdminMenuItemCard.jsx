/* ==================================
 * FILE: src/components/AdminMenuItemCard.jsx
 * ================================== */

import React from 'react';
import { FaEdit, FaTrashAlt, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import { MdLocalOffer } from "react-icons/md";

// ================================================
// 🟢 FINAL CODE FIX: Standardized Fallback Port 🟢
// ================================================
const API_ROOT_URL = (import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace("/api", "") : 'http://localhost:5000');

// **FINAL HELPER FUNCTION TO USE ENV VARIABLE**
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

const AdminMenuItemCard = ({ item, onEdit, onDelete, discountInfo }) => {
    // Extract discount details passed from AdminDashboardPage
    const { isOffer, originalPrice, offerPrice, percentage } = discountInfo || { isOffer: false };

    // Use the helper to get the correct, loadable image URL
    const imageUrl = getFullImageUrl(item.imageUrl); 

    // Determine the color for the stock count based on its value
    const stockColor = item.stock <= 10 ? 'text-red-500' : 'text-green-600';

    return (
        <div className="bg-slate-800 rounded-xl shadow-lg overflow-hidden flex flex-col relative group transition-all duration-300 hover:shadow-orange-500/50 hover:shadow-xl hover:-translate-y-1 border border-slate-700 active:scale-[0.98]">
            
            {/* ✅ OFFER PERCENTAGE BADGE (Top Right Corner) */}
            {isOffer && (
                <div className="absolute top-2 right-2 z-10 bg-red-600 text-white text-[10px] font-black px-2 py-1 rounded-md flex items-center gap-1 shadow-lg animate-pulse">
                    <MdLocalOffer size={12} />
                    {percentage}% OFF
                </div>
            )}

            {/* Image Section */}
            <div className="h-48 overflow-hidden bg-slate-700 flex items-center justify-center relative">
                <img 
                    src={imageUrl || 'https://placehold.co/400x400/1e293b/475569?text=Image+Missing'} 
                    alt={item.name} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
            </div>
            
            {/* Content Section */}
            <div className="p-4 flex flex-col flex-grow">
                <h3 className="text-xl font-semibold capitalize text-slate-100 truncate">{item.name}</h3>
                
                <div className="mt-1">
                    <p className="text-slate-400 text-sm">Price:</p>
                    <div className="flex items-center gap-2">
                        {/* ✅ STRIKETHROUGH OLD PRICE & NEW PRICE LOGIC */}
                        {isOffer ? (
                            <>
                                <span className="text-xl font-black text-green-400">₹{parseFloat(offerPrice).toFixed(2)}</span>
                                <span className="text-sm text-slate-500 line-through font-bold">₹{parseFloat(originalPrice).toFixed(2)}</span>
                            </>
                        ) : (
                            <span className="text-xl font-bold text-orange-400">₹{parseFloat(item.price).toFixed(2)}</span>
                        )}
                    </div>
                </div>

                <p className={`font-bold mt-1 text-sm ${stockColor}`}>Stock: {item.stock}</p>
                
                <div className="mt-auto pt-4 flex justify-between items-center border-t border-slate-700">
                    <span className={`px-2 py-1 text-[10px] font-bold rounded-full flex items-center gap-1 uppercase tracking-wider ${
                        item.stock > 0 ? 'bg-green-900/30 text-green-400 border border-green-800' : 'bg-red-900/30 text-red-400 border border-red-800'
                    }`}>
                        {item.stock > 0 ? <FaCheckCircle size={10} /> : <FaTimesCircle size={10} />}
                        {item.stock > 0 ? 'Available' : 'Out of Stock'}
                    </span>
                    
                    <div className="flex space-x-2">
                        <button 
                            onClick={() => onEdit(item)} 
                            title="Edit Item"
                            className="p-2 rounded-lg bg-slate-700 text-blue-400 hover:bg-blue-600 hover:text-white transition-all active:scale-95 border border-slate-600"
                        >
                            <FaEdit size={14} /> 
                        </button>
                        <button 
                            onClick={() => onDelete(item._id)} 
                            title="Delete Item"
                            className="p-2 rounded-lg bg-slate-700 text-red-400 hover:bg-red-600 hover:text-white transition-all active:scale-95 border border-slate-600"
                        >
                            <FaTrashAlt size={14} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminMenuItemCard;