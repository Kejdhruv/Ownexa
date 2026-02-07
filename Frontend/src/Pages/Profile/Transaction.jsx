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
    return  <ReactorOrbitLoader label="Fetching your Transactions" />
  }

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} />
    <div className="txn-page">
      <div className="txn-header">
        <h1 className="txn-title">Transactions</h1>

        <SortBar
          options={[
            { key: "token_quantity", label: "Token" },
            { key: "created_at", label: "Date" },
            { key: "price_per_token_inr", label: "Avg Price" },
          ]}
          data={transactions}
          onChange={setTransactions}
        />
      </div>

      {transactions.length === 0 ? (
        <p className="txn-empty">No transactions found</p>
      ) : (
        <div className="txn-grid">
          {transactions.map((tx) => {
            const total =
              tx.token_quantity * tx.price_per_token_inr;

            return (
              <div key={tx.id} className="txn-card">
                <div className="txn-card-top">
                  <div className="txn-left">
                    <h4 className="txn-token">{tx.token_name}</h4>
                    <span className="txn-date">
                      {new Date(tx.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  <span className={`txn-status ${tx.status}`}>
                    {tx.status}
                  </span>
                </div>

                <div className="txn-mid">
                  {tx.token_quantity} tokens × ₹
                  {tx.price_per_token_inr}
                </div>
                <div className="txn-bottom">
                  <span className="txn-total">
                    ₹{total.toLocaleString()}
                  </span>

                  <a
                    href={`https://sepolia.etherscan.io/tx/${tx.transaction_hash}`}
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
    </>
  );
}