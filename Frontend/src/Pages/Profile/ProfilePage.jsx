import { useEffect, useState } from "react";
import "../../Styles/Profile/ProfilePage.css"
import avatar1 from "../../assets/avatar1.png";
import avatar2 from "../../assets/avatar2.png";
import avatar3 from "../../assets/avatar3.png";
import avatar4 from "../../assets/avatar4.png";
import avatar5 from "../../assets/avatar5.png";
import avatar6 from "../../assets/avatar6.png";
import avatar7 from "../../assets/avatar7.png";

const API = import.meta.env.VITE_API_BASE;

const avatars = [
  avatar1,
  avatar2,
  avatar3,
  avatar4,
  avatar5,
  avatar6,
  avatar7,
];
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
  const [loading, setLoading] = useState(true);
const [timeSinceJoined, setTimeSinceJoined] = useState("");
  const [user, setUser] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [holdings, setHoldings] = useState([]);
  const [listedProperties, setListedProperties] = useState([]);
const [recent, setRecent] = useState([]);
 const [totalInvestment, setTotalInvestment] = useState(0);

 const [avatar] = useState(
  avatars[Math.floor(Math.random() * avatars.length)]
    ); 
    


  useEffect(() => {
  const fetchData = async () => {
    try {
      // 1️⃣ AUTH
      const userRes = await fetch(`${API}/auth/me`, {
        credentials: "include",
      });

      if (!userRes.ok) throw new Error("Auth failed");

      const userData = await userRes.json();
      setUser(userData.user);

      // 2️⃣ DEPENDENT DATA
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

      // 🔥 3️⃣ TOTAL INVESTMENT CALCULATION (ADD THIS)
      const total = h.reduce((sum, tx) => {
        const qty = Number(tx.token_quantity) || 0;
        const price = Number(tx.avg_price_inr) || 0;
        return sum + qty * price;
      }, 0);

      setTotalInvestment(total);

      // 4️⃣ RECENT ACTIVITY
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
      setUser(null);
      setHoldings([]);
      setTransactions([]);
      setListedProperties([]);
      setRecent([]);
      setTotalInvestment(0); // ✅ reset safely
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

  if (loading) return <div className="loading-screen">Loading profile…</div>;

  if (!user) return <div className="loading-screen">Unauthorized</div>;

  return (
   
        <div className="content-grid">
          {/* CARD 1 — HERO */}
         <section className="card hero-card">
  <div className="hero-left">
  <h1>{user?.username}</h1>
  <p>{user?.email}</p>
</div>

  <div className="hero-avatar">
    <img src={avatar} alt="avatar" />
  </div>

  <div className="metrics-strip">
    <Metric label="Transactions" value={transactions.length} />
    <Metric label="Holdings" value={holdings.length} />
    <Metric label="Properties" value={listedProperties.length} />
              </div>
              
              {timeSinceJoined && (
  <div className="join-timer-corner">
    Member for {timeSinceJoined}
  </div>
)}
</section>

          {/* CARD 2 */}
          <section className="card-holding">
            <div className="card-header">
    <h3>Total Investment</h3>
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

  <span className="view-hint">View all holdings</span>
          </section>

          {/* CARD 3 */}
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

  <span className="view-hint">View all properties</span>
          </section>

          {/* CARD 4 */}
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
            {/* LEFT */}
            <div className="tx-left">
              <div className="tx-title">
                {tx.token_quantity} × {tx.token_name}
              </div>
              <div className="tx-price">
                ₹{tx.price_per_token_inr} per token ·{" "}
                <span className="tx-sub">{formatTimeAgo(tx.created_at)}</span>
              </div>
            </div>

            {/* RIGHT */}
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

  <span className="view-hint">View all transactions</span>
</section>
        </div>
  );
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