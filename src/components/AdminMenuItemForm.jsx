/* ==================================
 * FILE: src/components/AdminMenuItemForm.jsx
 * ================================== */

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaSave, FaTimes, FaUpload } from 'react-icons/fa';

// ================================================
// !!! VERCEL DEPLOYMENT FIX: API URLS !!!
// ================================================
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:10000/api';
// ================================================
// !!! END OF FIX !!!
// ================================================

// --- Helper function for Authorization Header (FIXED) ---
const getAdminAuthHeaders = (token, contentType = 'application/json') => ({
    'Authorization': `Bearer ${token}`, // Use Bearer token
    'Content-Type': contentType,
});

// --- SubCategory Modal Component ---
const AddSubCategoryModal = ({ onSave, onCancel, isSubmitting }) => {
    const [name, setName] = useState('');
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState(null);

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            setFile(selectedFile);
            setPreview(URL.createObjectURL(selectedFile));
        }
    };

    const handleSubmit = () => {
        if (!name || !file) {
            alert('Please provide a subcategory name and an image.');
            return;
        }
        onSave(name, file);
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-40 flex justify-center items-center p-4">
            <div className="bg-slate-800 rounded-xl shadow-2xl p-6 w-full max-w-md border-t-4 border-orange-500">
                <h3 className="text-xl font-bold mb-6 text-slate-100">Add New Subcategory</h3>
                
                <div className="space-y-4">
                    <label className="block text-slate-300">
                        Subcategory Name
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g., Chips, Drinks, Bakery"
                            className="w-full mt-1 p-2 border border-slate-600 rounded-lg focus:ring-2 focus:ring-orange-500 transition bg-slate-700 text-white"
                        />
                    </label>

                    <label className="block text-slate-300">
                        Subcategory Image
                        <div className="mt-1 p-4 border-2 border-dashed border-slate-600 rounded-lg text-center cursor-pointer hover:border-orange-500">
                            <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleFileChange}
                                id="file-upload"
                            />
                            {!preview ? (
                                <label htmlFor="file-upload" className="cursor-pointer">
                                    <FaUpload className="mx-auto text-slate-400" size={30} />
                                    <p className="text-sm text-slate-400 mt-2">Click to upload image</p>
                                </label>
                            ) : (
                                <img src={preview} alt="Preview" className="w-32 h-32 object-cover mx-auto rounded-lg" />
                            )}
                        </div>
                    </label>

                    <div className="flex justify-end space-x-4 pt-4">
                        <button
                            type="button"
                            onClick={onCancel}
                            disabled={isSubmitting}
                            className="bg-gray-600 text-white font-semibold py-2 px-5 rounded-lg hover:bg-gray-700 transition-all active:scale-95 disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            className="bg-green-600 text-white font-semibold py-2 px-5 rounded-lg hover:bg-green-700 transition-all active:scale-95 shadow-md shadow-green-500/30 disabled:opacity-50"
                        >
                            {isSubmitting ? 'Saving...' : 'Save'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- Main Form Component ---
const AdminMenuItemForm = ({ initialData, uniqueSubCategories, onSave, onCancel, onSubCategoryAdded }) => {
    const [formData, setFormData] = useState({
        name: '',
        price: '',
        category: 'Snacks',
        stock: 'Available',
        subCategory: ''
    });
    
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubCategoryModalVisible, setIsSubCategoryModalVisible] = useState(false);
    const [isSubmittingSubCat, setIsSubmittingSubCat] = useState(false);
    
    const [newSubCategoryText, setNewSubCategoryText] = useState(''); // For the old text-only field

    useEffect(() => {
        if (initialData) {
            setFormData({
                id: initialData.id,
                name: initialData.name,
                price: initialData.price.toString(),
                category: initialData.category,
                stock: initialData.stock,
                subCategory: initialData.subCategory || ''
            });
        }
    }, [initialData]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        
        if (name === 'category' && value !== 'Snacks') {
            setFormData(prev => ({ ...prev, subCategory: '', newSubCategory: '' }));
            setNewSubCategoryText('');
        }
        
        if (name === 'subCategory' && value !== 'NEW_SUBCATEGORY') {
            setNewSubCategoryText('');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        
        const itemData = {
            ...formData,
            price: parseFloat(formData.price),
            subCategory: formData.subCategory === 'NEW_SUBCATEGORY' 
                ? newSubCategoryText 
                : formData.subCategory
        };

        if (!itemData.id) {
            delete itemData.id;
        }

        try {
            const token = localStorage.getItem('admin_token');
            const headers = getAdminAuthHeaders(token); // Use correct helper

            if (itemData.id) {
                // Use API_BASE_URL
                await axios.put(`${API_BASE_URL}/menu/${itemData.id}`, itemData, { headers });
            } else {
                // Use API_BASE_URL
                await axios.post(`${API_BASE_URL}/menu`, itemData, { headers });
            }
            onSave();
            
        } catch (error) {
            console.error('Failed to save item:', error);
            alert('Failed to save item. Please check console for details.');
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const handleSaveNewSubCategory = async (name, file) => {
        setIsSubmittingSubCat(true);
        
        const subCatFormData = new FormData();
        subCatFormData.append('name', name);
        subCatFormData.append('image', file);
        
        try {
            const token = localStorage.getItem('admin_token');
            
            // Use API_BASE_URL and correct headers
            const response = await axios.post(`${API_BASE_URL}/admin/subcategories`, subCatFormData, {
                headers: getAdminAuthHeaders(token, 'multipart/form-data') // Use correct helper
            });

            onSubCategoryAdded(); 
            setFormData(prev => ({ ...prev, subCategory: response.data.name }));
            setIsSubCategoryModalVisible(false);
            
        } catch (error) {
            console.error("Failed to create subcategory:", error);
            alert('Failed to create subcategory. Check if backend API route "POST /api/admin/subcategories" exists.');
        } finally {
            setIsSubmittingSubCat(false);
        }
    };

    return (
        <>
            {isSubCategoryModalVisible && (
                <AddSubCategoryModal
                    isSubmitting={isSubmittingSubCat}
                    onSave={handleSaveNewSubCategory}
                    onCancel={() => setIsSubCategoryModalVisible(false)}
                />
            )}

            <form onSubmit={handleSubmit} className="bg-slate-800 rounded-xl shadow-2xl p-6 md:p-8 mb-10 border-t-4 border-orange-500">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <label className="block text-slate-300">Item Name
                        <input type="text" name="name" value={formData.name} onChange={handleChange} required className="w-full mt-1 p-2 border border-slate-600 rounded-lg focus:ring-2 focus:ring-orange-500 transition bg-slate-700 text-white" />
                    </label>

                    <label className="block text-slate-300">Price (₹)
                        <input type="number" name="price" value={formData.price} onChange={handleChange} required min="0" step="0.01" className="w-full mt-1 p-2 border border-slate-600 rounded-lg focus:ring-2 focus:ring-orange-500 transition bg-slate-700 text-white" />
                    </label>

                    <label className="block text-slate-300">Category
                        <select name="category" value={formData.category} onChange={handleChange} className="w-full mt-1 p-2 border border-slate-600 rounded-lg focus:ring-2 focus:ring-orange-500 transition bg-slate-700 text-white">
                            <option value="Snacks">Snacks</option>
                            <option value="Meals">Meals</option>
                            <option value="Drinks">Drinks</option>
                        </select>
                    </label>

                    <label className="block text-slate-300">Stock Status
                        <select name="stock" value={formData.stock} onChange={handleChange} className="w-full mt-1 p-2 border border-slate-600 rounded-lg focus:ring-2 focus:ring-orange-500 transition bg-slate-700 text-white">
                            <option value="Available">Available</option>
                            <option value="Unavailable">Unavailable</option>
                        </select>
                    </label>

                    {formData.category === 'Snacks' && (
                        <div className="md:col-span-2">
                            <label className="block text-slate-300 mb-1">
                                Choose a Subcategory
                            </label>
                            <div className="flex items-center space-x-2">
                                <select 
                                    name="subCategory" 
                                    value={formData.subCategory} 
                                    onChange={handleChange} 
                                    className="w-full p-2 border border-slate-600 rounded-lg focus:ring-2 focus:ring-orange-500 transition bg-slate-700 text-white"
                                >
                                    <option value="">-- Select a Subcategory --</option>
                                    {/* This map is now safe because uniqueSubCategories is always an array */}
                                    {uniqueSubCategories.map(sub => (
                                        <option key={sub} value={sub}>{sub}</option>
                                    ))}
                                    <option value="NEW_SUBCATEGORY">-- Add a new one (text only) --</option> 
                                </select>
                                
                                <button 
                                    type="button"
                                    onClick={() => setIsSubCategoryModalVisible(true)}
                                    className="flex-shrink-0 bg-orange-500 text-white font-semibold py-2 px-4 rounded-lg hover:bg-orange-600 transition-all active:scale-95"
                                    title="Add new subcategory with image"
                                >
                                    Add+
                                </button>
                            </div>

                            {formData.subCategory === 'NEW_SUBCATEGORY' && (
                                <input
                                    type="text"
                                    placeholder="Enter new subcategory name (text only)..."
                                    value={newSubCategoryText}
                                    onChange={(e) => setNewSubCategoryText(e.target.value)}
                                    required
                                    className="w-full mt-2 p-2 border border-slate-600 rounded-lg focus:ring-2 focus:ring-orange-500 transition bg-slate-700 text-white"
                                />
                            )}
                        </div>
                    )}
                </div>

                <div className="mt-8 flex justify-end space-x-4">
                    <button type="button" onClick={onCancel} disabled={isSubmitting} className="bg-gray-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-gray-700 transition-all active:scale-95 disabled:opacity-50">
                        <FaTimes className="inline-block mr-2" />
                        Cancel
                    </button>
                    <button type="submit" disabled={isSubmitting} className="bg-blue-600 text-white font-semibold py-3 px-8 rounded-lg hover:bg-blue-700 transition-all active:scale-95 shadow-md shadow-blue-500/30 disabled:opacity-50">
                        <FaSave className="inline-block mr-2" />
                        {isSubmitting ? 'Saving...' : (initialData ? 'Update Item' : 'Save Item')}
                    </button>
                </div>
            </form>
        </>
    );
};

export default AdminMenuItemForm;