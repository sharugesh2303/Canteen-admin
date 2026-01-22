/* =======================================
 * FILE: src/pages/AdminFeedbackPage.jsx
 * ======================================= */

import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

// Icons
import { LuMailCheck, LuX, LuTrash2 } from 'react-icons/lu';
import { VscFeedback } from "react-icons/vsc";
import { MdCampaign } from "react-icons/md";
import { FaPlusCircle, FaUtensils, FaClipboardList, FaChartLine } from 'react-icons/fa';

/* ================= API CONFIG ================= */
const API_BASE_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:10000/api';

const POLLING_INTERVAL = 15 * 1000;

/* ================= Sidebar ================= */
const AdminSidebarNav = () => {
  const navigate = useNavigate();

  const NavItem = ({ to, icon: Icon, name, active }) => (
    <Link to={to}>
      <button
        className={`w-full flex items-center p-3 rounded-lg space-x-3 transition ${
          active
            ? 'bg-orange-500 text-white'
            : 'text-slate-300 hover:bg-slate-700 hover:text-orange-400'
        }`}
      >
        <Icon size={20} />
        <span className="font-semibold">{name}</span>
      </button>
    </Link>
  );

  return (
    <div className="p-4 space-y-2">
      <NavItem to="/menu" icon={FaUtensils} name="Menu Management" />
      <NavItem to="/orders" icon={FaClipboardList} name="Orders" />
      <NavItem to="/revenue" icon={FaChartLine} name="Revenue" />
      <NavItem to="/feedback" icon={VscFeedback} name="Student Feedback" active />
      <NavItem to="/advertisement" icon={MdCampaign} name="Ads Management" />

      <button
        onClick={() => navigate('/admin/menu/add')}
        className="w-full mt-6 flex items-center p-3 rounded-lg bg-green-600 text-white hover:bg-green-700"
      >
        <FaPlusCircle size={18} />
        <span className="ml-3 font-bold">Add Menu Item</span>
      </button>
    </div>
  );
};

/* ================= Page ================= */
const AdminFeedbackPage = () => {
  const navigate = useNavigate();

  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFeedback, setSelectedFeedback] = useState(null);

  const token = localStorage.getItem('admin_token');

  const authHeaders = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  /* ================= Fetch Feedback ================= */
  const fetchFeedbacks = async () => {
    try {
      setLoading(true);
      const res = await axios.get(
        `${API_BASE_URL}/admin/feedback`,
        { headers: authHeaders }
      );
      setFeedbacks(res.data);
    } catch (err) {
      console.error(err);
      if (err.response?.status === 401) {
        localStorage.removeItem('admin_token');
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  /* ================= Mark as Read ================= */
  const markAsRead = async (id) => {
    try {
      await axios.patch(
        `${API_BASE_URL}/admin/feedback/${id}/read`,
        {},
        { headers: authHeaders }
      );

      setFeedbacks(prev =>
        prev.map(fb =>
          fb._id === id ? { ...fb, isRead: true } : fb
        )
      );
    } catch (err) {
      console.error("Mark read failed", err);
    }
  };

  /* ================= DELETE SINGLE ================= */
  const deleteFeedback = async (id) => {
    if (!window.confirm("Delete this feedback permanently?")) return;

    await axios.delete(
      `${API_BASE_URL}/admin/feedback/${id}`,
      { headers: authHeaders }
    );

    setFeedbacks(prev => prev.filter(fb => fb._id !== id));
    setSelectedFeedback(null);
  };

  /* ================= DELETE ALL ================= */
  const deleteAllFeedback = async () => {
    if (!window.confirm("⚠️ Delete ALL feedback permanently?")) return;

    await axios.delete(
      `${API_BASE_URL}/admin/feedback/delete-all`,
      { headers: authHeaders }
    );

    setFeedbacks([]);
    setSelectedFeedback(null);
  };

  useEffect(() => {
    if (!token) navigate('/login');
    fetchFeedbacks();
    const interval = setInterval(fetchFeedbacks, POLLING_INTERVAL);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-slate-900 flex">
      <aside className="hidden md:block w-64 bg-slate-800 border-r border-slate-700">
        <AdminSidebarNav />
      </aside>

      <main className="flex-1 p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-white">Feedback Inbox</h2>

          {feedbacks.length > 0 && (
            <button
              onClick={deleteAllFeedback}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
            >
              <LuTrash2 />
              Delete All
            </button>
          )}
        </div>

        {loading ? (
          <p className="text-slate-400">Loading feedback…</p>
        ) : feedbacks.length === 0 ? (
          <p className="text-slate-400">No feedback available</p>
        ) : (
          <div className="space-y-4">
            {feedbacks.map(fb => (
              <div
                key={fb._id}
                onClick={() => {
                  setSelectedFeedback(fb);
                  if (!fb.isRead) markAsRead(fb._id);
                }}
                className={`bg-slate-700 p-5 rounded-lg cursor-pointer transition border-l-4 ${
                  fb.isRead ? 'border-slate-500' : 'border-orange-500'
                }`}
              >
                <p className="text-white text-lg truncate">
                  “{fb.feedbackText}”
                </p>
                <div className="flex justify-between mt-3 text-sm text-slate-300">
                  <span className="font-bold text-orange-400">
                    {fb.studentName}
                  </span>
                  <span>{fb.isRead ? 'Read' : 'Unread'}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ================= MODAL ================= */}
        {selectedFeedback && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
            <div className="bg-slate-800 w-full max-w-lg rounded-xl p-6 relative border border-slate-700">

              <button
                onClick={() => setSelectedFeedback(null)}
                className="absolute top-3 right-3 text-slate-400 hover:text-white"
              >
                <LuX size={22} />
              </button>

              <h3 className="text-2xl font-bold text-orange-400 mb-4">
                Student Feedback
              </h3>

              <div className="space-y-2 text-slate-200">
                <p><b>Name:</b> {selectedFeedback.studentName}</p>
                <p><b>Branch:</b> {selectedFeedback.branch}</p>
                <p><b>Department:</b> {selectedFeedback.department}</p>
                <p><b>Year:</b> {selectedFeedback.year}</p>

                <div className="mt-4 p-4 bg-slate-700 rounded-lg">
                  <p className="font-semibold mb-1">Feedback</p>
                  <p>{selectedFeedback.feedbackText}</p>
                </div>

                <button
                  onClick={() => deleteFeedback(selectedFeedback._id)}
                  className="mt-4 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                >
                  <LuTrash2 />
                  Delete Feedback
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminFeedbackPage;
