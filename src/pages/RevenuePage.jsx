import React, { useState, useEffect, forwardRef, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

// Icons
import { LuLogOut, LuMenu, LuX } from "react-icons/lu";
import {
  FaCalendarAlt,
  FaBoxOpen,
  FaChartLine,
  FaUtensils,
  FaClipboardList,
  FaPlusCircle,
  FaSearch,
  FaFileCsv,
} from "react-icons/fa";
import { VscFeedback } from "react-icons/vsc";
import { MdCampaign } from "react-icons/md";

/* ================= API CONFIG ================= */
const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:10000/api";

/* ================= AUTH HEADER ================= */
const getAuthHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("admin_token")}`,
  "Content-Type": "application/json",
});

/* ================= CSV HELPERS ================= */
const downloadCSV = (filename, rows) => {
  if (!rows || !rows.length) return;

  const csv =
    Object.keys(rows[0]).join(",") +
    "\n" +
    rows
      .map(r =>
        Object.values(r).map(v => `"${v}"`).join(",")
      )
      .join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

/* ================= DATE INPUT ================= */
const CustomDateInput = forwardRef(({ value, onClick }, ref) => (
  <button
    ref={ref}
    onClick={onClick}
    className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-lg border border-slate-700 hover:bg-slate-700"
  >
    <FaCalendarAlt className="text-orange-400" />
    {value}
  </button>
));

/* ================= SIDEBAR ================= */
const AdminSidebarNav = ({ onClose }) => {
  const navigate = useNavigate();

  const NavItem = ({ to, icon: Icon, name, active }) => (
    <Link to={to} onClick={onClose}>
      <button
        className={`w-full flex items-center gap-3 p-3 rounded-lg font-semibold transition
        ${
          active
            ? "bg-orange-500 text-white"
            : "text-slate-300 hover:bg-slate-700 hover:text-orange-400"
        }`}
      >
        <Icon size={20} />
        {name}
      </button>
    </Link>
  );

  return (
    <div className="space-y-2 p-4">
      <NavItem to="/menu" icon={FaUtensils} name="Menu" />
      <NavItem to="/orders" icon={FaClipboardList} name="Orders" />
      <NavItem to="/revenue" icon={FaChartLine} name="Revenue" active />
      <NavItem to="/feedback" icon={VscFeedback} name="Feedback" />
      <NavItem to="/advertisement" icon={MdCampaign} name="Ads" />

      <button
        onClick={() => navigate("/admin/menu/add")}
        className="mt-6 w-full flex items-center gap-3 p-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
      >
        <FaPlusCircle /> Add Menu Item
      </button>
    </div>
  );
};

/* ================= MAIN PAGE ================= */
const RevenuePage = () => {
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const fetchRevenue = async (date) => {
    try {
      setError("");
      const dateStr = date.toISOString().split("T")[0];

      const res = await axios.get(
        `${API_BASE_URL}/admin/daily-revenue?date=${dateStr}`,
        { headers: getAuthHeaders() }
      );

      setData(res.data);
    } catch (err) {
      console.error("Revenue fetch error:", err);
      setError("Failed to fetch revenue data");
      setData(null);
    }
  };

  useEffect(() => {
    fetchRevenue(selectedDate);
  }, [selectedDate]);

  const handleLogout = () => {
    localStorage.removeItem("admin_token");
    navigate("/login");
  };

  /* ============ FILTER PRODUCTS BY SEARCH ============ */
  const filteredProducts = useMemo(() => {
    if (!data?.products) return [];
    if (!searchTerm.trim()) return data.products;

    return data.products.filter(p =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [data, searchTerm]);

  /* ============ CSV EXPORTS ============ */
  const exportProductCSV = () => {
    if (!data) return;

    downloadCSV(
      `product_sales_${selectedDate.toISOString().split("T")[0]}.csv`,
      filteredProducts.map(p => ({
        Date: selectedDate.toISOString().split("T")[0],
        Product: p.name,
        Quantity: p.quantity,
        Revenue: p.revenue.toFixed(2),
      }))
    );
  };

  const exportSummaryCSV = () => {
    if (!data) return;

    downloadCSV(
      `daily_revenue_${selectedDate.toISOString().split("T")[0]}.csv`,
      [
        {
          Date: selectedDate.toISOString().split("T")[0],
          Total_Orders: data.totalOrders,
          Total_Revenue: data.totalRevenue.toFixed(2),
        },
      ]
    );
  };

  return (
    <div className="min-h-screen bg-slate-900 flex text-white">

      {/* SIDEBAR */}
      <aside className="hidden md:block w-64 bg-slate-800 border-r border-slate-700">
        <div className="p-6">
          <h1 className="text-2xl font-extrabold text-orange-400">Admin</h1>
        </div>
        <AdminSidebarNav />
      </aside>

      {/* MAIN */}
      <div className="flex-1">

        {/* HEADER */}
        <header className="bg-gray-900 border-b border-slate-700 p-4 flex justify-between items-center sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <FaChartLine className="text-orange-400" />
            <h2 className="text-xl font-bold text-orange-400">
              Revenue Analysis
            </h2>
          </div>

          <button
            onClick={handleLogout}
            className="bg-red-600 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-red-700"
          >
            <LuLogOut /> Logout
          </button>
        </header>

        {/* CONTENT */}
        <main className="p-6 max-w-6xl mx-auto space-y-6">

          {/* TITLE + DATE */}
          <div className="flex flex-col md:flex-row md:justify-between gap-4">
            <h1 className="text-3xl font-bold text-orange-400">
              Daily Revenue
            </h1>
            <DatePicker
              selected={selectedDate}
              onChange={setSelectedDate}
              customInput={<CustomDateInput />}
            />
          </div>

          {/* EXPORT BUTTONS */}
          {data && (
            <div className="flex gap-3">
              <button
                onClick={exportSummaryCSV}
                className="bg-green-600 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700"
              >
                <FaFileCsv /> Export Revenue CSV
              </button>

              <button
                onClick={exportProductCSV}
                className="bg-blue-600 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
              >
                <FaFileCsv /> Export Product CSV
              </button>
            </div>
          )}

          {/* SEARCH */}
          <div className="relative max-w-md">
            <FaSearch className="absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search product..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg bg-slate-800 border border-slate-700"
            />
          </div>

          {/* ERROR */}
          {error && (
            <div className="bg-red-900/40 border border-red-700 text-red-300 p-4 rounded-lg">
              {error}
            </div>
          )}

          {/* SUMMARY */}
          {data && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
                <p className="text-slate-400">Total Orders</p>
                <p className="text-4xl font-bold text-orange-400">
                  {data.totalOrders}
                </p>
              </div>

              <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
                <p className="text-slate-400">Total Revenue</p>
                <p className="text-4xl font-bold text-green-400">
                  ₹{data.totalRevenue.toFixed(2)}
                </p>
              </div>
            </div>
          )}

          {/* PRODUCT TABLE */}
          {data && (
            <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
              <h2 className="text-xl font-semibold mb-4">
                Product Sales
              </h2>

              {filteredProducts.length === 0 ? (
                <div className="flex flex-col items-center py-10 text-slate-400">
                  <FaBoxOpen className="text-4xl mb-3" />
                  No matching product found
                </div>
              ) : (
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-700 text-slate-400">
                      <th className="py-3">Product</th>
                      <th>Quantity</th>
                      <th>Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.map((p, i) => (
                      <tr
                        key={i}
                        className="border-b border-slate-700 hover:bg-slate-700/40"
                      >
                        <td className="py-3">{p.name}</td>
                        <td>{p.quantity}</td>
                        <td className="text-green-400 font-semibold">
                          ₹{p.revenue.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default RevenuePage;
