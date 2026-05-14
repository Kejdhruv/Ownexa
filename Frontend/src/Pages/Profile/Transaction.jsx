import { useEffect, useState } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "../../Styles/Profile/Transactions.css";
import SortBar from "../../Components/Dashboard/Filter";
import ReactorOrbitLoader from "../../Components/Loaders/ProfileLoader";
const API = import.meta.env.VITE_API_BASE;

export default function TransactionsPage() {
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const res = await fetch(`${API}/transaction?status=SUCCESS`, {
          credentials: "include",
        });
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        setTransactions(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error(err);
        toast.error("Failed to fetch transactions. Please try again.");
        setTransactions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, []);

  if (loading) {
    return <ReactorOrbitLoader label="Fetching your Transactions" />;
  }

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="transaction-page">
        
        {/* HEADER */}
        <header className="transaction-header">
          <div className="transaction-header-left">
            <h1 className="transaction-title">Transaction Ledger</h1>
            <p className="transaction-subtitle">Review your on-chain settlement history and asset acquisitions.</p>
          </div>

          <div className="transaction-header-right">
            <SortBar
              options={[
                { key: "token_quantity", label: "Quantity" },
                { key: "created_at", label: "Date" },
                { key: "price_per_token_inr", label: "Execution Price" },
              ]}
              data={transactions}
              onChange={setTransactions}
            />
          </div>
        </header>

        {/* CONTENT */}
        <section className="transaction-section">
          {transactions.length === 0 ? (
            <div className="transaction-empty">
              <div className="transaction-empty-icon">🧾</div>
              <p>No settled transactions found in your history.</p>
            </div>
          ) : (
            <div className="transaction-grid">
              {transactions.map((tx) => {
                const total = tx.token_quantity * tx.price_per_token_inr;

                return (
                  <div key={tx.id} className="transaction-card">
                    
                    {/* Card Header */}
                    <div className="transaction-card-head">
                      <div className="transaction-asset-info">
                        <span className="transaction-label">Asset Token</span>
                        <h4 className="transaction-token-name">{tx.token_name}</h4>
                      </div>
                      <span className={`transaction-status-badge ${tx.status.toUpperCase()}`}>
                        <span className="transaction-dot"></span>
                        {tx.status}
                      </span>
                    </div>

                    {/* Card Body / Metrics */}
                    <div className="transaction-card-body">
                      <div className="transaction-metric-row">
                        <span className="transaction-label">Execution Date</span>
                        <span className="transaction-value">
                          {new Date(tx.created_at).toLocaleDateString(undefined, {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </span>
                      </div>
                      
                      <div className="transaction-metric-grid">
                        <div className="transaction-metric-box">
                          <span className="transaction-label">Size</span>
                          <span className="transaction-value transaction-num">{tx.token_quantity}</span>
                        </div>
                        <div className="transaction-metric-box transaction-text-right">
                          <span className="transaction-label">Avg Price</span>
                          <span className="transaction-value transaction-num">₹{tx.price_per_token_inr.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    {/* Card Footer */}
                    <div className="transaction-card-footer">
                      <div className="transaction-total-box">
                        <span className="transaction-label">Settled Value</span>
                        <span className="transaction-total-val transaction-num transaction-text-accent">
                          ₹{total.toLocaleString()}
                        </span>
                      </div>

                      <a
                        href={`https://sepolia.etherscan.io/tx/${tx.transaction_hash}`}
                        target="_blank"
                        rel="noreferrer"
                        className="transaction-link-btn"
                        title="View on Block Explorer"
                      >
                        TxHash ↗
                      </a>
                    </div>
                    
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </>
  );
}