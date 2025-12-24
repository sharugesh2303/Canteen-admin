/* ==================================
 * FILE: src/pages/AdminLoginPage.jsx
 * ================================== */

import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

// --- CONFIGURATION (SYNCED TO 5000) ---
// 🟢 FIXED: Fallback port changed from 10000 to 5000 to match the backend
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const LOGIN_ENDPOINT = `${API_BASE_URL}/admin/login`;

const AdminLoginPage = () => {
    const [email, setEmail] = useState('admin@canteen.com');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    // 🟢 FIX: Memoize the background style to prevent flickering on state changes
    const backgroundStyle = useMemo(() => {
        const staticImageUrl = `/jjcet_gate.jpg`;
        return { 
            backgroundImage: `url(${staticImageUrl})` 
        };
    }, []);

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await axios.post(LOGIN_ENDPOINT, {
                email,
                password,
            });

            // Store the token for authentication in other pages
            localStorage.setItem('admin_token', response.data.token);
            
            // Redirect to the management page
            navigate('/menu');
        } catch (err) {
            // Enhanced error reporting to catch network mismatches
            console.error("Login Error:", err.response?.data || err.message);
            setError(err.response?.data?.message || 'Login failed. Server might be down or API URL is incorrect.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div 
            className="min-h-screen flex items-center justify-center bg-cover bg-center" 
            style={backgroundStyle}
        >
            {/* Background overlay for better readability */}
            <div className="min-h-screen flex items-center justify-center bg-black bg-opacity-50 w-full">
                <div className="w-full max-w-sm p-8 space-y-6 bg-gray-800 text-white rounded-lg shadow-xl bg-opacity-80 border border-gray-700">
                    <div className="text-center">
                        <h1 className="text-3xl font-bold">JJ Canteen</h1>
                        <h2 className="text-xl font-semibold text-cyan-400">Admin Portal</h2>
                    </div>
                    <form className="space-y-6" onSubmit={handleLogin}>
                        <div>
                            <label htmlFor="email" className="text-sm font-medium text-gray-300">Email</label>
                            <input
                                id="email" 
                                type="email" 
                                required
                                autoComplete="email"
                                className="w-full px-3 py-2 mt-1 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 text-white"
                                value={email} 
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                        <div>
                            <label htmlFor="password" className="text-sm font-medium text-gray-300">Password</label>
                            <input
                                id="password" 
                                type="password" 
                                required
                                autoComplete="current-password"
                                className="w-full px-3 py-2 mt-1 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 text-white"
                                value={password} 
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                        
                        {error && (
                            <div className="text-sm text-center text-red-400 bg-red-900/20 py-2 rounded border border-red-500/30">
                                {error}
                            </div>
                        )}
                        
                        <div>
                            <button
                                type="submit" 
                                disabled={loading}
                                className="w-full px-4 py-2 font-bold bg-cyan-600 rounded-md hover:bg-cyan-700 transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed shadow-lg active:scale-95"
                            >
                                {loading ? 'Signing In...' : 'Sign In'}
                            </button>
                        </div>
                    </form>
                    <p className="text-white text-center text-sm mt-8 opacity-60">
                        Powered by <span className="font-bold">Nexora</span>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default AdminLoginPage;