import { useEffect, useState } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "../../Styles/Profile/ProfilePage.css"
import { useNavigate } from "react-router";
import DashboardPageLoader from "../../Components/Loaders/DashboardLoader";
const API = import.meta.env.VITE_API_BASE;

function formatTimeAgo(date) {
    const diff = Date.now() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
}

export default function ProfilePage() {
     const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [timeSinceJoined, setTimeSinceJoined] = useState("");
    const [user, setUser] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [holdings, setHoldings] = useState([]);
    const [listedProperties, setListedProperties] = useState([]);
    const [recent, setRecent] = useState([]);
    const [totalInvestment, setTotalInvestment] = useState(0);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const userRes = await fetch(`${API}/auth/me`, {
                    credentials: "include",
                });

                if (!userRes.ok) throw new Error("Auth failed");

                const userData = await userRes.json();
                setUser(userData.user);
                const [propertyRes, transactionRes, holdingRes] =
                    await Promise.all([
                        fetch(`${API}/userproperties`, { credentials: "include" }),
                        fetch(`${API}/transaction?status=SUCCESS`, { credentials: "include" }),
                        fetch(`${API}/holdings`, { credentials: "include" }),
                    ]);

                const propertyData = await propertyRes.json();
                const transactionData = await transactionRes.json();
                const holdingData = await holdingRes.json();

                const p = Array.isArray(propertyData) ? propertyData : [];
                const t = Array.isArray(transactionData) ? transactionData : [];
                const h = Array.isArray(holdingData) ? holdingData : [];

                setListedProperties(p);
                setTransactions(t);
                setHoldings(h);
                const total = h.reduce((sum, tx) => {
                    const qty = Number(tx.token_quantity) || 0;
                    const price = Number(tx.avg_price_inr) || 0;
                    return sum + qty * price;
                }, 0);

                setTotalInvestment(total);
                const allActivity = t
                    .map((i) => ({
                        ...i,
                        timestamp:
                            i.created_at ||
                            i.createdAt ||
                            new Date().toISOString(),
                    }))
                    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

                setRecent(allActivity.slice(0, 5));
            } catch (err) {
                console.error("Fetch error:", err);

                toast.error("Failed to fetch profile data. Please try again.");

                setUser(null);
                setHoldings([]);
                setTransactions([]);
                setListedProperties([]);
                setRecent([]);
                setTotalInvestment(0);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);
    useEffect(() => {
        if (!user?.created_at) return;

        const joinedTime = new Date(user.created_at).getTime();

        const updateTimer = () => {
            const diff = Date.now() - joinedTime;

            const days = Math.floor(diff / 86400000);
            const hours = Math.floor((diff / 3600000) % 24);
            const minutes = Math.floor((diff / 60000) % 60);
            const seconds = Math.floor((diff / 1000) % 60);

            setTimeSinceJoined(
                `${days}d ${hours.toString().padStart(2, "0")}h ` +
                `${minutes.toString().padStart(2, "0")}m ` +
                `${seconds.toString().padStart(2, "0")}s`
            );
        };

        updateTimer();
        const interval = setInterval(updateTimer, 1000);

        return () => clearInterval(interval);
    }, [user?.created_at]);

    if (loading) return <DashboardPageLoader title="Fetching Your Details ....... " />;

    if (!user) return <div className="loading-screen">Unauthorized</div>;

    return (
        <>
            <ToastContainer position="top-right" autoClose={3000} />

        <div className="content-grid">
            <section className="card hero-card">
                <div className="hero-left">
                    <h1>{user?.username}</h1>
                    <p>{user?.email}</p>
                </div>

                <div className="hero-avatar">
                    <img src={user.avatar} alt="avatar" />
                </div>

                <div className="metrics-strip">
                    <Metric label="Transactions" value={transactions.length} />
                    <Metric label="Holdings" value={holdings.length} />
                    <Metric label="Properties" value={listedProperties.length} />
                </div>


                 {user?.role === "Admin" && (
    <div className="admin-entry">
      <button
        className="admin-panel-btn"
        onClick={() => navigate("/AdminDashboard")}
      >
        View Admin 
      </button>
    </div>
  )}


                {timeSinceJoined && (
                    <div className="join-timer-corner">
                        Member for {timeSinceJoined}
                    </div>
                )}
            </section>

            <section className="card-holding">
                <div className="card-header holding-header">
                    <h3>Total Investment</h3>

                    {/* Risk Level Indicator */}
                    <div className={`risk-badge ${getRiskClass(user?.risk_label)}`}>
                        {getRiskLabel(user?.risk_label)} Risk
                    </div>
                </div>

                <div className="investment-amount">
                    ₹ {totalInvestment.toLocaleString()}
                </div>

                {holdings.length === 0 ? (
                    <p className="empty-text">No investments yet</p>
                ) : (
                    <ul className="preview-list">
                        {holdings.slice(0, 2).map((h, i) => (
                            <li key={i}>
                                <span className="item-meta">{h.properties.token_name}</span>
                                <span className="item-meta">x{h.token_quantity}</span>
                                <span className="item-meta">{h.avg_price_inr}</span>
                            </li>
                        ))}
                    </ul>
                )}

                <span
                  className="view-hint clickable"
                  onClick={() => navigate("/dashboard/holdings")}
                >
                  View all holdings
                </span>
            </section>
            <section className="card-property">
                <div className="card-header">
                    <h3>Listed Properties</h3>
                    <span className="card-subtle">
                        {listedProperties.length} active
                    </span>
                </div>

                {listedProperties.length === 0 ? (
                    <p className="empty-text">No properties listed yet</p>
                ) : (
                    <ul className="property-preview-list">
                        {listedProperties.slice(0, 1).map((p) => (
                            <li key={p.id}>
                                <div className="property-left">
                                    <span className="property-title">{p.title}</span>
                                    <span className="property-location">
                                        {p.city}, {p.state}
                                    </span>
                                </div>

                                <span className="property-status listed">
                                    LISTED
                                </span>
                            </li>
                        ))}
                    </ul>
                )}

                <span
                  className="view-hint clickable"
                  onClick={() => navigate("/dashboard/properties")}
                >
                  View all properties
                </span>
            </section>

            <section className="card full-width-card card-transactions">
                <div className="card-header">
                    <h3>Recent Transactions</h3>
                    <span className="card-subtle">Recent actions</span>
                </div>

                {recent.length === 0 ? (
                    <p className="empty-text">No recent transactions</p>
                ) : (
                    <div className="tx-list">
                        {recent.slice(0, 3).map((tx) => {
                            const total =
                                Number(tx.token_quantity) * Number(tx.price_per_token_inr);

                            return (
                                <div key={tx.transaction_hash} className="tx-row">
                                    <div className="tx-left">
                                        <div className="tx-title">
                                            {tx.token_quantity} × {tx.token_name}
                                        </div>
                                        <div className="tx-price">
                                            ₹{tx.price_per_token_inr} per token ·{" "}
                                            <span className="tx-sub">{formatTimeAgo(tx.created_at)}</span>
                                        </div>
                                    </div>

                                    <div className="tx-right">
                                        <div className="tx-amount">
                                            ₹{total.toLocaleString("en-IN")}
                                        </div>

                                        <span className={`tx-status ${tx.status}`}>
                                            {tx.status}
                                        </span>

                                        <a
                                            href={`https://sepolia.etherscan.io/tx/${tx.transaction_hash}`}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="tx-link"
                                            title="View on Etherscan"
                                        >
                                            View on Etherscan
                                        </a>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                <span
                  className="view-hint clickable"
                  onClick={() => navigate("/dashboard/transactions")}
                >
                  View all transactions
                </span>
            </section>
        </div>
        </>
    );
}

function getRiskLabel(level) {
    if (level === 0) return "Low";
    if (level === 1) return "Medium";
    if (level === 2) return "High";
    return "Unknown";
}

function getRiskClass(level) {
    if (level === 0) return "risk-low";
    if (level === 1) return "risk-medium";
    if (level === 2) return "risk-high";
    return "risk-unknown";
}

// 🔹 METRIC COMPONENT
function Metric({ label, value }) {
    return (
        <div className="metric">
            <h3>{value}</h3>
            <span>{label}</span>
        </div>
    );
}