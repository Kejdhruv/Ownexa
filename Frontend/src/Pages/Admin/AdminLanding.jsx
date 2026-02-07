import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { User, ShieldCheck } from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import "../../Styles/Admin/AdminViewPage.css";

const API = import.meta.env.VITE_API_BASE;

export default function AdminLanding() {
  const [loading, setLoading] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);
  const [verifyCount, setVerifyCount] = useState(0);

  const [days, setDays] = useState(90);
  const [analytics, setAnalytics] = useState([]);
  const [chartLoading, setChartLoading] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const [pendingRes, verifyRes] = await Promise.all([
          fetch(`${API}/properties?status=pending&listed=false`, {
            credentials: "include",
          }),
          fetch(`${API}/warnedproperties`, {
            credentials: "include",
          }),
        ]);

        if (pendingRes.ok) {
          const data = await pendingRes.json();
          setPendingCount(Array.isArray(data) ? data.length : 0);
        }

        if (verifyRes.ok) {
          const data = await verifyRes.json();
          setVerifyCount(Array.isArray(data) ? data.length : 0);
        }
      } catch (err) {
        console.error("Admin count fetch failed", err);
      }
    };

    fetchCounts();
  }, []);

  const analyticsCache = useRef({});

  useEffect(() => {
    const fetchAnalytics = async () => {
      setChartLoading(true);

      // Serve from cache if available
      if (analyticsCache.current[days]) {
        setAnalytics(analyticsCache.current[days]);
        setChartLoading(false);
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`${API}/admin/stats?days=${days}`, {
          credentials: "include",
        });
        if (res.ok) {
          const data = await res.json();
          const arr = Array.isArray(data) ? data : [];
          analyticsCache.current[days] = arr;
          setAnalytics(arr);
        } else {
          analyticsCache.current[days] = [];
          setAnalytics([]);
        }
      } catch (err) {
        console.error("Failed to fetch admin stats", err);
        analyticsCache.current[days] = [];
        setAnalytics([]);
      } finally {
        setChartLoading(false);
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [days]);

  if (loading) return <div className="admin-loading">Loading dashboard…</div>;

  const totalTx = analytics.reduce((s, d) => s + (d.tx_count || 0), 0);
  const totalVolume = analytics.reduce((s, d) => s + (d.volume_inr || 0), 0);

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="admin-dashboard">
      <header className="admin-header">
        <div className="header-content">
          <h2>Dashboard</h2>
          <p className="current-date">{today}</p>
        </div>
        <div className="header-actions">
          {/* Placeholder for future actions */}
        </div>
      </header>

      <div className="admin-card-grid">
        <AdminStatCard
          title="Pending Requests"
          subtitle="Waiting for approval"
          value={pendingCount}
          icon={<User size={24} />}
          onClick={() => navigate("/AdminDashboard/Pending")}
          trend="+5% vs last week"
        />
        <AdminStatCard
          title="Verifications"
          subtitle="Documents to review"
          value={verifyCount}
          icon={<ShieldCheck size={24} />}
          onClick={() => navigate("/AdminDashboard/Documents")}
          trend="Action needed"
        />
      </div>

      <section className="admin-analytics-card">
        <div className="analytics-header">
          <div>
            <h3>Platform Overview</h3>
            <p className="analytics-sub">
              {totalTx} transactions · ₹{totalVolume.toLocaleString("en-IN")}
            </p>
          </div>

          <div className="range-switch">
            {[7, 14, 30, 90].map((d) => (
              <button
                key={d}
                className={days === d ? "active" : ""}
                onClick={() => days !== d && setDays(d)}
              >
                {d}D
              </button>
            ))}
          </div>
        </div>

        {chartLoading ? (
          <div className="chart-loading">Loading analytics…</div>
        ) : analytics.length === 0 ? (
          <div className="chart-empty">No activity in this period</div>
        ) : (
          <ResponsiveContainer width="100%" height={350}>
            <AreaChart
              data={analytics}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorTx" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                stroke="#1f2937"
                strokeDasharray="3 3"
                vertical={false}
              />
              <XAxis
                dataKey="day"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#9ca3af", fontSize: 12 }}
                tickFormatter={(d) =>
                  new Date(d).toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                  })
                }
                dy={10}
              />
              <YAxis
                yAxisId="left"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#9ca3af", fontSize: 12 }}
                allowDecimals={false}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#9ca3af", fontSize: 12 }}
                tickFormatter={(v) =>
                  v >= 100000 ? `₹${(v / 100000).toFixed(1)}L` : `₹${v}`
                }
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(17, 24, 39, 0.9)",
                  borderColor: "#374151",
                  borderRadius: "8px",
                  color: "#f3f4f6",
                }}
                itemStyle={{ color: "#e5e7eb" }}
                formatter={(value, name, props) =>
                  (props?.dataKey === "volume_inr" || String(name).toLowerCase().includes("volume"))
                    ? [`₹${Number(value).toLocaleString("en-IN")}`, "Volume (₹)"]
                    : [value, "Transactions"]
                }
                labelFormatter={(label) => new Date(label).toDateString()}
              />
              <Legend verticalAlign="top" height={36} iconType="circle" />
              <Area
                yAxisId="right"
                type="monotone"
                dataKey="volume_inr"
                name="Volume (₹)"
                stroke="#22c55e"
                fillOpacity={1}
                fill="url(#colorVolume)"
                strokeWidth={2}
              />
              <Area
                yAxisId="left"
                type="monotone"
                dataKey="tx_count"
                name="Transactions"
                stroke="#3b82f6"
                fillOpacity={1}
                fill="url(#colorTx)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </section>
    </div>
  );
}

function AdminStatCard({ title, subtitle, value, icon, onClick, trend }) {
  return (
    <div className="admin-stat-card" onClick={onClick}>
      <div className="stat-card-top">
        <div className="stat-card-icon">{icon}</div>
        {trend && <div className="stat-card-trend">{trend}</div>}
      </div>
      <div className="stat-card-content">
        <div className="stat-card-value">{value}</div>
        <div className="stat-card-info">
          <h3 className="stat-card-title">{title}</h3>
          <p className="stat-card-subtitle">{subtitle}</p>
        </div>
      </div>
    </div>
  );
}
