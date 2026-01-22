import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

/* ================= CONFIG ================= */
// Backend runs on 10000
const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:10000/api";

const LOGIN_ENDPOINT = `${API_BASE_URL}/admin/login`;

const AdminLoginPage = () => {
  const [email, setEmail] = useState("admin@canteen.com");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const backgroundStyle = useMemo(() => {
    return { backgroundImage: "url(/jjcet_gate.jpg)" };
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await axios.post(LOGIN_ENDPOINT, {
        email,
        password,
      });

      localStorage.setItem("admin_token", res.data.token);
      navigate("/menu");
    } catch (err) {
      console.error("Login error:", err.response?.data || err.message);
      setError(
        err.response?.data?.message ||
          "Login failed. Check server or credentials."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-cover bg-center"
      style={backgroundStyle}
    >
      <div className="min-h-screen flex items-center justify-center bg-black bg-opacity-50 w-full">
        <div className="w-full max-w-sm p-8 bg-gray-800 text-white rounded-lg shadow-xl border border-gray-700">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold">JJ Canteen</h1>
            <h2 className="text-xl text-cyan-400">Admin Portal</h2>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="text-sm text-gray-300">Email</label>
              <input
                type="email"
                required
                className="w-full px-3 py-2 mt-1 bg-gray-700 border border-gray-600 rounded-md"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm text-gray-300">Password</label>
              <input
                type="password"
                required
                className="w-full px-3 py-2 mt-1 bg-gray-700 border border-gray-600 rounded-md"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {error && (
              <div className="text-sm text-red-400 bg-red-900/30 p-2 rounded">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 bg-cyan-600 rounded-md hover:bg-cyan-700 disabled:bg-gray-500"
            >
              {loading ? "Signing In..." : "Sign In"}
            </button>
          </form>

          <p className="text-center text-sm mt-6 opacity-60">
            Powered by <b>Nexora</b>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminLoginPage;
