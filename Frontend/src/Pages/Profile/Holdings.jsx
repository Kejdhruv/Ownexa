import { useEffect, useState } from "react";
import "../../Styles/Profile/Transactions.css";
import SortBar from "../../Components/Dashboard/Filter";
const API = import.meta.env.VITE_API_BASE;

export default function HoldingsPage() {
  const [loading, setLoading] = useState(true);
  const [Holdings, setHoldings] = useState([]);

  useEffect(() => {
    const fetchHoldings = async () => {
      try {
        const res = await fetch(`${API}/holdings`, {
          credentials: "include",
        });
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        setHoldings(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error(err);
        setHoldings([]);
      } finally {
        setLoading(false);
      }
    };

    fetchHoldings();
  }, []);

  if (loading) {
    return <div className="txn-loading">Loading Holdings…</div>;
  }

  return (
    <div className="txn-page">
     <div className="txn-header">
  <h1 className="txn-title">Holdings</h1>

  <SortBar
    options={[
      { key: "token_quantity", label: "Token" },
      { key: "created_at", label: "Date" },
      { key: "price_per_token_inr", label: "Avg Price" },
    ]}
    data={Holdings}
    onChange={setHoldings}
  />
</div>

      {Holdings.length === 0 ? (
        <p className="txn-empty">No Current Holdings</p>
      ) : (
        <div className="txn-grid">
          {Holdings.map((tx) => {
            const total =
              tx.token_quantity * tx.price_per_token_inr;

            return (
              <div key={tx.id} className="txn-card">
                {/* TOP */}
                <div className="txn-card-top">
                  <div className="txn-left">
                    <h4 className="txn-token">{tx.properties.token_name}</h4>
                    <span className="txn-date">
                      {new Date(tx.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  <span className={`txn-status ${tx.properties.status}`}>
                    {tx.properties.status}
                  </span>
                </div>

                {/* MID */}
                <div className="txn-mid">
                  {tx.token_quantity} tokens × ₹
                  {tx.avg_price_inr}
                </div>

                {/* BOTTOM */}
                <div className="txn-bottom">
                  <span className="txn-total">
                    ₹{total.toLocaleString()}
                  </span>

                  <a
                    href={`https://sepolia.etherscan.io/tx/${tx.wallet_address}`}
                    target="_blank"
                    rel="noreferrer"
                    className="txn-link"
                  >
                    View on Etherscan →
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}