/* ==================================
 * FILE: src/components/AdminMenuItemCard.jsx
 * ================================== */

import React from 'react';
import { FaEdit, FaTrashAlt } from 'react-icons/fa'; 

// ================================================
// 🟢 FINAL CODE FIX: Standardized Fallback Port 🟢
// Changed from 10000 to 5000 to match the stuck value in Vercel's build
// ================================================
const API_ROOT_URL = (import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace("/api", "") : 'http://localhost:5000');
// ================================================
// !!! END OF FIX !!!
// ================================================


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


const AdminMenuItemCard = ({ item, onEdit, onDelete }) => {
    // 💡 FIX APPLIED: Use the helper to get the correct, loadable image URL
    const imageUrl = getFullImageUrl(item.imageUrl); 

    // Determine the color for the stock count based on its value
    const stockColor = item.stock <= 10 ? 'text-red-500' : 'text-green-600';

    return (
        <div className="bg-slate-800 rounded-xl shadow-lg overflow-hidden flex flex-col transition-all duration-300 hover:shadow-orange-500/50 hover:shadow-xl hover:-translate-y-1 border border-slate-700 active:scale-[0.98]">
            
            {/* Image Section */}
            <div className="h-48 overflow-hidden bg-slate-700 flex items-center justify-center">
                <img 
                    src={imageUrl || 'https://placehold.co/400x400/1e293b/475569?text=Image+Missing'} 
                    alt={item.name} 
                    className="w-full h-full object-cover"
                />
            </div>
            
            {/* Content Section */}
            <div className="p-4 flex flex-col flex-grow">
                <h3 className="text-xl font-semibold capitalize text-slate-100">{item.name}</h3>
                <p className="text-slate-400">Price: <span className="font-bold text-orange-400">₹{parseFloat(item.price).toFixed(2)}</span></p>
                <p className={`font-bold mt-1 ${stockColor}`}>Stock: {item.stock}</p>
                
                <div className="mt-auto pt-4 flex justify-between items-center border-t border-slate-700">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        item.stock > 0 ? 'bg-green-700 text-green-300' : 'bg-red-700 text-red-300'
                    }`}>
                        {item.stock > 0 ? 'Available' : 'Unavailable'}
                    </span>
                    
                    <div className="space-x-3">
                        <button 
                            onClick={() => onEdit(item)} 
                            title="Edit Item"
                            className="p-2 rounded-full bg-blue-600 text-white hover:bg-blue-700 transition-colors active:scale-95"
                        >
                            <FaEdit size={14} /> 
                        </button>
                        <button 
                            onClick={() => onDelete(item._id)} 
                            title="Delete Item"
                            className="p-2 rounded-full bg-red-600 text-white hover:bg-red-700 transition-colors active:scale-95"
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