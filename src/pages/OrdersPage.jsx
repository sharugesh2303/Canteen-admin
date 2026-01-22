/* =======================================
 * FILE: src/pages/OrdersPage.jsx
 * Admin / Chef View – Read Only Orders
 * ======================================= */

import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";

/* ================= ICONS ================= */
import { LuLogOut } from "react-icons/lu";
import { FaClipboardList, FaSearch } from "react-icons/fa";
import { FaPlusCircle, FaUtensils, FaChartLine } from "react-icons/fa";
import { VscFeedback } from "react-icons/vsc";
import { MdCampaign } from "react-icons/md";

/* ================= API CONFIG ================= */
const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:10000/api";

/* ================= HELPERS ================= */
const getAdminAuthHeaders = (token) => ({
  Authorization: `Bearer ${token}`,
  "Content-Type": "application/json",
});

/* ================= SIDEBAR ================= */
const AdminSidebarNav = () => {
  const NavItem = ({ to, icon: Icon, name, isActive }) => (
    <Link to={to}>
      <button
        className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
          isActive
            ? "bg-orange-500 text-white"
            : "text-slate-300 hover:bg-slate-700"
        }`}
      >
        <Icon size={20} />
        {name}
      </button>
    </Link>
  );

  return (
    <div className="space-y-2 p-4">
      <NavItem to="/menu" icon={FaUtensils} name="Menu Management" />
      <NavItem to="/orders" icon={FaClipboardList} name="Orders" isActive />
      <NavItem to="/revenue" icon={FaChartLine} name="Revenue & Sales" />
      <NavItem to="/feedback" icon={VscFeedback} name="Student Feedback" />
      <NavItem to="/advertisement" icon={MdCampaign} name="Ads Management" />

      <Link to="/admin/menu/add">
        <button className="mt-4 w-full bg-green-600 p-3 rounded-lg flex items-center gap-3 text-white hover:bg-green-700">
          <FaPlusCircle /> Add New Menu Item
        </button>
      </Link>
    </div>
  );
};

/* ================= MAIN COMPONENT ================= */
const OrdersPage = () => {
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  /* ================= AUTH ================= */
  const handleLogout = () => {
    localStorage.removeItem("admin_token");
    navigate("/login");
  };

  /* ================= FETCH ORDERS ================= */
  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem("admin_token");
      if (!token) return handleLogout();

      const res = await axios.get(`${API_BASE_URL}/orders/admin/all`, {
        headers: getAdminAuthHeaders(token),
      });

      setOrders(res.data || []);
      setError(null);
    } catch (err) {
      console.error("ORDERS FETCH ERROR:", err);
      setError("Failed to fetch orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 15000);
    return () => clearInterval(interval);
  }, []);

  /* ================= SEARCH ================= */
  const filteredOrders = orders.filter((o) =>
    (o.billNumber || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  /* ================= RENDER ================= */
  return (
    <div className="min-h-screen bg-slate-900 text-white flex">
      {/* SIDEBAR */}
      <aside className="hidden md:block w-64 bg-slate-800 border-r border-slate-700">
        <div className="p-6 text-2xl font-bold text-orange-400 border-b border-slate-700">
          Admin Portal
        </div>
        <AdminSidebarNav />
      </aside>

      {/* MAIN */}
      <main className="flex-1 overflow-y-auto">
        <header className="flex justify-between items-center p-4 border-b border-slate-700">
          <h1 className="text-xl font-bold text-orange-400 flex items-center gap-2">
            <FaClipboardList /> Orders
          </h1>

          <button
            onClick={handleLogout}
            className="bg-red-600/20 hover:bg-red-600 text-red-500 hover:text-white px-4 py-2 rounded flex items-center gap-2 text-sm font-bold"
          >
            <LuLogOut /> Logout
          </button>
        </header>

        <div className="p-6">
          {/* SEARCH */}
          <div className="mb-6 max-w-sm relative">
            <FaSearch className="absolute left-3 top-3 text-slate-400" />
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search Bill #"
              className="w-full pl-10 p-2 bg-slate-800 border border-slate-700 rounded focus:ring-2 focus:ring-orange-500 outline-none"
            />
          </div>

          {loading ? (
            <div className="text-center py-20 text-slate-400">
              Loading orders...
            </div>
          ) : error ? (
            <div className="text-center py-20 text-red-400">{error}</div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-20 text-slate-500 italic">
              No orders found
            </div>
          ) : (
            <div className="overflow-x-auto bg-slate-800 rounded-xl border border-slate-700">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-slate-700/50 text-slate-300 text-xs uppercase">
                    <th className="p-4 text-left">Bill #</th>
                    <th className="p-4 text-left">Items</th>
                    <th className="p-4 text-center">Total</th>
                    <th className="p-4 text-center">Action</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-700">
                  {filteredOrders.map((o) => {
                    const isDelivered =
                      o.orderStatus === "DELIVERED";

                    return (
                      <tr
                        key={o._id}
                        className="hover:bg-slate-700/30 h-20"
                      >
                        {/* BILL */}
                        <td className="p-4 align-middle font-mono text-orange-300">
                          {o.billNumber}
                        </td>

                        {/* ITEMS */}
                        <td className="p-4 align-middle">
                          <div className="flex flex-col gap-1 text-xs text-slate-300">
                            {o.items.map((i, idx) => (
                              <span key={idx}>
                                {i.quantity} × {i.name}
                              </span>
                            ))}
                          </div>
                        </td>

                        {/* TOTAL */}
                        <td className="p-4 align-middle text-center font-bold text-white">
                          ₹{o.totalAmount}
                        </td>

                        {/* ACTION */}
                        <td className="p-4 align-middle">
                          <div className="flex justify-center">
                            <span
                              className={`px-4 py-1 text-xs font-bold rounded-full ${
                                isDelivered
                                  ? "bg-green-500/20 text-green-400"
                                  : "bg-orange-500/20 text-orange-400"
                              }`}
                            >
                              {isDelivered ? "DELIVERED" : "PENDING"}
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default OrdersPage;
