import { useEffect, useState } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { ethers } from "ethers";
import "../../Styles/Profile/Listing.css";

import PropertyTokenABI from "../../abi/PropertyToken.json";
import ReactorOrbitLoader from "../../Components/Loaders/ProfileLoader";

const API = import.meta.env.VITE_API_BASE;
const CONTRACT_ADDRESS = import.meta.env.VITE_SMART_CONTRACT;

export default function ListingsPage() {
  const [loading, setLoading] = useState(true);
  const [activeListings, setActiveListings] = useState([]);
  const [soldListings, setSoldListings] = useState([]);
  const [cancelLoadingId, setCancelLoadingId] = useState(null);

  useEffect(() => {
    const fetchListings = async () => {
      try {
        const [activeRes, soldRes] = await Promise.all([
          fetch(`${API}/listings?status=ACTIVE&tag=seller`, { credentials: "include" }),
          fetch(`${API}/listings?status=SOLD&tag=seller`, { credentials: "include" }),
        ]);

        if (!activeRes.ok || !soldRes.ok) throw new Error("Failed to fetch listings");

        const activeData = await activeRes.json();
        const soldData = await soldRes.json();

        setActiveListings(Array.isArray(activeData) ? activeData : []);
        setSoldListings(Array.isArray(soldData) ? soldData : []);
      } catch (err) {
        console.error(err);
        setActiveListings([]);
        setSoldListings([]);
      } finally {
        setLoading(false);
      }
    };

    fetchListings();
  }, []);

  const getContractAndAccount = async () => {
    if (!window.ethereum) throw new Error("MetaMask not detected");

    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const account = await signer.getAddress();

    const contract = new ethers.Contract(
      CONTRACT_ADDRESS,
      PropertyTokenABI.abi ?? PropertyTokenABI,
      signer
    );

    return { contract, account };
  };

  const handleCancelListing = async (item) => {
    const listingId = item.id;
    const blockchainId = item.listing_blockchain_id;
    const propertyId = item.properties?.id;
    const tokenQty = item.token_quantity;
    const pricePerTokenInr = item.price_per_token_inr;

    if (blockchainId === undefined || blockchainId === null) {
      toast.error("Missing blockchain listing id in this listing row.");
      return;
    }

    try {
      setCancelLoadingId(listingId);

      // 1) Cancel on-chain
      const { contract, account } = await getContractAndAccount();
      const tx = await contract.cancelListing(blockchainId);
      const receipt = await tx.wait();

      // 2) Sync backend
      const res = await fetch(`${API}/cancellisting`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: listingId,
          propertyId,
          tokenQuantity: tokenQty,
          pricePerTokenInr,
          accountaddress: account,
          transactionHash: receipt?.hash ?? tx?.hash,
        }),
      });

      if (!res.ok) {
        const t = await res.text().catch(() => "");
        throw new Error(t || "Backend listing sync failed");
      }

      // 3) Update UI
      setActiveListings((prev) => prev.filter((l) => l.id !== listingId));
    } catch (err) {
      console.error("Cancel failed:", err);
      toast.error(err.message || "Cancel failed");
    } finally {
      setCancelLoadingId(null);
    }
  };

  if (loading) {
    return <ReactorOrbitLoader label="Fetching your Listings" />;
  }

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="lst-page">
        
        {/* HEADER */}
        <header className="lst-header">
          <div className="lst-header-left">
            <h1 className="lst-title">Market Orders</h1>
            <p className="lst-subtitle">Manage your open asks and view execution history.</p>
          </div>
        </header>

        {/* ===============================
            ACTIVE LISTINGS (OPEN ORDERS)
        =============================== */}
        <section className="lst-section">
          <div className="lst-section-header">
            <h2>Open Orders</h2>
            <div className="lst-line"></div>
          </div>

          {activeListings.length === 0 ? (
            <div className="lst-empty">
              <div className="lst-empty-icon">📈</div>
              <p>No active sell orders on the secondary market.</p>
            </div>
          ) : (
            <div className="lst-grid">
              {activeListings.map((item) => (
                <div key={item.id} className="lst-card">
                  
                  <div className="lst-card-head">
                    <div className="lst-head-info">
                      <h4 className="lst-name">{item.properties?.title}</h4>
                      <p className="lst-location">
                        {item.properties?.city}, {item.properties?.state}
                      </p>
                    </div>
                    <span className="lst-status-badge LIVE">
                      <span className="dot"></span> LIVE
                    </span>
                  </div>

                  <div className="lst-card-body">
                    <div className="lst-token-row">
                      <span className="lst-label">Asset Token</span>
                      <span className="lst-token-name">{item.properties?.token_name}</span>
                    </div>

                    <div className="lst-metrics">
                      <div className="lst-metric-row">
                        <span className="lst-label">Avg Entry Price</span>
                        <span className="lst-value num text-muted">
                          ₹{item.holdings?.avg_price_inr?.toLocaleString() || "0"}
                        </span>
                      </div>

                      <div className="lst-metric-row highlight">
                        <span className="lst-label">Ask Price (INR)</span>
                        <span className="lst-value num text-accent">
                          ₹{item.price_per_token_inr?.toLocaleString() || "0"}
                        </span>
                      </div>

                      <div className="lst-metric-row">
                        <span className="lst-label">Listed Size</span>
                        <span className="lst-value num">
                          {item.token_quantity} <span className="text-muted text-xs">Tokens</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="lst-card-footer">
                    <button
                      className="lst-btn-cancel"
                      onClick={() => handleCancelListing(item)}
                      disabled={cancelLoadingId === item.id}
                    >
                      {cancelLoadingId === item.id ? "Cancelling Order..." : "Cancel Order"}
                    </button>
                  </div>

                </div>
              ))}
            </div>
          )}
        </section>

        {/* ===============================
            SOLD LISTINGS (EXECUTED)
        =============================== */}
        <section className="lst-section mt-12">
          <div className="lst-section-header">
            <h2 className="text-muted">Executed Orders</h2>
            <div className="lst-line"></div>
          </div>

          {soldListings.length === 0 ? (
            <div className="lst-empty border-muted">
              <p>No executed orders found in history.</p>
            </div>
          ) : (
            <div className="lst-grid">
              {soldListings.map((item) => (
                <div key={item.id} className="lst-card sold">
                  
                  <div className="lst-card-head">
                    <div className="lst-head-info">
                      <h4 className="lst-name">{item.properties?.title}</h4>
                      <p className="lst-location">
                        {item.properties?.city}, {item.properties?.state}
                      </p>
                    </div>
                    <span className="lst-status-badge EXECUTED">EXECUTED</span>
                  </div>

                  <div className="lst-card-body">
                    <div className="lst-token-row">
                      <span className="lst-label">Asset Token</span>
                      <span className="lst-token-name">{item.properties?.token_name}</span>
                    </div>

                    <div className="lst-metrics">
                      <div className="lst-metric-row">
                        <span className="lst-label">Avg Entry Price</span>
                        <span className="lst-value num text-muted">
                          ₹{item.holdings?.avg_price_inr?.toLocaleString() || "0"}
                        </span>
                      </div>

                      <div className="lst-metric-row">
                        <span className="lst-label">Filled Price (INR)</span>
                        <span className="lst-value num text-positive">
                          ₹{item.price_per_token_inr?.toLocaleString() || "0"}
                        </span>
                      </div>

                      <div className="lst-metric-row">
                        <span className="lst-label">Filled Size</span>
                        <span className="lst-value num">
                          {item.token_quantity} <span className="text-muted text-xs">Tokens</span>
                        </span>
                      </div>
                    </div>
                  </div>

                </div>
              ))}
            </div>
          )}
        </section>

      </div>
    </>
  );
}