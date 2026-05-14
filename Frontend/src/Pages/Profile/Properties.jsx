import { useEffect, useState } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { ethers } from "ethers";

import PropertyTokenABI from "../../abi/PropertyToken.json";
import "../../Styles/Profile/Properties.css";

import SortBar from "../../Components/Dashboard/Filter";
import ReactorOrbitLoader from "../../Components/Loaders/ProfileLoader";

const API = import.meta.env.VITE_API_BASE;
const CONTRACT_ADDRESS = import.meta.env.VITE_SMART_CONTRACT;

export default function PropertiesPage() {
  const [loading, setLoading] = useState(true);
  const [Properties, setProperties] = useState([]);

  // Modal + Sell States
  const [showModal, setShowModal] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [sellPrice, setSellPrice] = useState("");
  const [txLoading, setTxLoading] = useState(false);
  const [sellConfirmText, setSellConfirmText] = useState("");


  const getContractAndAccount = async () => {
    if (!window.ethereum) throw new Error("MetaMask not detected");

    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const account = await signer.getAddress();

    const contract = new ethers.Contract(
      CONTRACT_ADDRESS,
      // IMPORTANT: most Hardhat/Foundry ABIs are in .abi
      PropertyTokenABI.abi ?? PropertyTokenABI,
      signer
    );

    return { contract, account };
  };


  // ===============================
  // SELL PROPERTY HANDLER
  // ===============================
  const handleSellProperty = async (item) => {
    if (sellConfirmText !== "SELL") {
      toast.error("Please type SELL to confirm");
      return;
    }
    // item is your property row from supabase

    const propertyId = item.id;
    const blockchainId = item.blockchain_id;
    const isListed = item.is_listed;
    const pricePerTokenInr = item.price_per_token_inr;
    const totalTokens = item.initial_token_quantity;

    if (!isListed) {
      toast.error("This property is not listed");
      return;
    }

    if (blockchainId === undefined || blockchainId === null) {
      toast.error("Missing blockchain property id.");
      return;
    }

    if (!sellPrice || Number(sellPrice) <= 0) {
      toast.error("Enter valid price");
      return;
    }

    // Minimum Price
    const minPrice = pricePerTokenInr * totalTokens;

    if (Number(sellPrice) < minPrice) {
      toast.error(`Minimum price is ₹${minPrice.toLocaleString()}`);
      return;
    }

    try {
      setTxLoading(propertyId);

      // Fixed ETH Rate
      const rate = 300000;

      const ethAmount = (sellPrice / rate).toFixed(6);

      // 1) Sell on-chain
      const { contract } = await getContractAndAccount();

      const tx = await contract.settleProperty(blockchainId, {
        value: ethers.parseEther(ethAmount),
      });

      await tx.wait();

      // 2) Sync backend
      const res = await fetch(`${API}/property/sold`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId,
        }),
      });

      if (!res.ok) {
        const t = await res.text().catch(() => "");
        throw new Error(t || "Backend property sync failed");
      }

      // 3) Update UI
      setProperties((prev) =>
        prev.map((p) =>
          p.id === propertyId
            ? { ...p, is_listed: false, status: "SOLD" }
            : p
        )
      );

      toast.success("Property sold successfully");

      setShowModal(false);
      setSellPrice("");
      setSellConfirmText("");

    } catch (err) {
      console.error("Sell failed:", err);
      toast.error(err.message || "Sell failed");
    } finally {
      setTxLoading(null);
    }
  };
  // ===============================
  // FETCH USER PROPERTIES
  // ===============================
  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const res = await fetch(`${API}/userproperties`, {
          credentials: "include",
        });

        if (!res.ok) throw new Error("Failed to fetch Properties");

        const data = await res.json();

        setProperties(Array.isArray(data) ? data : []);

      } catch (err) {
        console.error(err);
        setProperties([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProperties();
  }, []);

  // ===============================
  // LOADER
  // ===============================
  if (loading) {
    return <ReactorOrbitLoader label="Fetching your Properties" />;
  }

  // ===============================
  // UI
  // ===============================
  return (
   <>
  <ToastContainer position="top-right" autoClose={3000} />
  <div className="pp-page">

    {/* HEADER */}
    <header className="pp-header">
      <div className="pp-header-left">
        <h1 className="pp-title">Tokenized Assets</h1>
        <p className="pp-subtitle">Manage your minted properties and track funding status.</p>
      </div>

      <div className="pp-header-right">
        <SortBar
          options={[
            { key: "token_quantity", label: "Quantity" },
            { key: "created_at", label: "Date" },
            { key: "price_per_token_inr", label: "Price Per Token" },
          ]}
          data={Properties}
          onChange={setProperties}
        />
      </div>
    </header>

    {/* ===============================
        ACTIVE / LISTED PROPERTIES
    =============================== */}
    <section className="pp-section">
      <div className="pp-section-header">
        <h2>Active Markets</h2>
        <div className="pp-line"></div>
      </div>

      {Properties.filter((p) => p.is_listed === true).length === 0 ? (
        <div className="pp-empty">
          <div className="pp-empty-icon">🏢</div>
          <p>No active properties currently listed on the market.</p>
        </div>
      ) : (
        <div className="pp-grid">
          {Properties.filter((p) => p.is_listed === true).map((h) => {
            const totalInvestment = h.initial_token_quantity * h.price_per_token_inr;
            const image = h.property_images?.[0] || "/placeholder-property.jpg";
            const tokensSold = h.initial_token_quantity - h.token_quantity;
            const amountRaised = h.price_per_token_inr * tokensSold;

            return (
              <div key={h.id} className="pp-card">
                
                {/* Visual / Image */}
                <div className="pp-visual">
                  <img src={image} alt={h.title} />
                  <div className="pp-overlay"></div>
                  <span className={`pp-status-badge ${h.status.toUpperCase()}`}>
                    <span className="dot"></span>
                    {h.status}
                  </span>
                </div>

                {/* Card Body */}
                <div className="pp-body">
                  <div className="pp-head-info">
                    <h3 className="pp-name">{h.title}</h3>
                    <span className="pp-location">
                      {h.city}, {h.state}
                    </span>
                  </div>

                  <div className="pp-metrics">
                    <div className="pp-metric-row border-bottom">
                      <span className="pp-label">Asset Token</span>
                      <span className="pp-token-tag">{h.token_name}</span>
                    </div>

                    <div className="pp-metric-grid">
                      <div className="pp-metric-box">
                        <span className="pp-label">Tokens Sold</span>
                        <span className="pp-value num">{tokensSold}</span>
                      </div>
                      <div className="pp-metric-box">
                        <span className="pp-label">Capital Raised</span>
                        <span className="pp-value num text-positive">
                          ₹{amountRaised.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Footer */}
                <div className="pp-footer">
                  <div className="pp-valuation">
                    <span className="pp-label">Target Valuation</span>
                    <span className="pp-value num highlight">
                      ₹{totalInvestment.toLocaleString()}
                    </span>
                  </div>

                  {h.status.toUpperCase() === "VALIDATED" && h.is_listed === true && (
                    <button
                      className="pp-btn-liquidate"
                      onClick={() => {
                        setSelectedProperty(h);
                        setShowModal(true);
                      }}
                    >
                      Liquidate Asset
                    </button>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      )}
    </section>

    {/* ===============================
        PREVIOUS PROPERTIES (UNLISTED)
    =============================== */}
    {Properties.filter((p) => p.is_listed === false).length > 0 && (
      <section className="pp-section mt-12">
        <div className="pp-section-header">
          <h2 className="text-muted">Settled Assets</h2>
          <div className="pp-line"></div>
        </div>

        <div className="pp-grid">
          {Properties.filter((p) => p.is_listed === false).map((h) => {
            const totalInvestment = h.initial_token_quantity * h.price_per_token_inr;
            const image = h.property_images?.[0] || "/placeholder-property.jpg";

            return (
              <div key={h.id} className="pp-card settled">
                
                <div className="pp-visual">
                  <img src={image} alt={h.title} />
                  <div className="pp-overlay"></div>
                  <span className="pp-status-badge SOLD">SOLD</span>
                </div>

                <div className="pp-body">
                  <div className="pp-head-info">
                    <h3 className="pp-name">{h.title}</h3>
                    <span className="pp-location">
                      {h.city}, {h.state}
                    </span>
                  </div>

                  <div className="pp-metrics">
                    <div className="pp-metric-row">
                      <span className="pp-label">Asset Token</span>
                      <span className="pp-token-tag muted">{h.token_name}</span>
                    </div>
                    <div className="pp-metric-row mt-2">
                      <span className="pp-label">Final Valuation</span>
                      <span className="pp-value num text-muted">
                        ₹{totalInvestment.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      </section>
    )}

    {/* ===============================
        SELL / LIQUIDATE MODAL
    =============================== */}
    {showModal && selectedProperty && (
      <div className="pp-modal-backdrop">
        <div className="pp-modal-card danger-zone">
          
          <div className="pp-modal-header">
            <h2>Execute Asset Sale</h2>
            <p className="pp-modal-sub">{selectedProperty.title}</p>
          </div>

          <div className="pp-modal-body">
            
            <div className="pp-valuation-box">
              <span className="pp-label">Minimum Required Settlement</span>
              <span className="pp-value num text-accent">
                ₹{(selectedProperty.price_per_token_inr * selectedProperty.initial_token_quantity).toLocaleString()}
              </span>
            </div>

            <div className="pp-warning-banner">
              ⚠️ Warning: Liquidating this asset is irreversible. The underlying property will be marked as sold and proceeds distributed.
            </div>

            <div className="pp-input-group mt-4">
              <label>Settlement Price (INR)</label>
              <div className="pp-input-prefix">
                <span className="prefix">₹</span>
                <input
                  type="number"
                  placeholder="0.00"
                  value={sellPrice}
                  onChange={(e) => setSellPrice(e.target.value)}
                />
              </div>
            </div>

            <div className="pp-input-group mt-4">
              <label>Type <span className="text-danger">SELL</span> to confirm execution</label>
              <input
                type="text"
                placeholder="SELL"
                value={sellConfirmText}
                onChange={(e) => setSellConfirmText(e.target.value.toUpperCase())}
                className="danger-input"
              />
            </div>

          </div>

          <div className="pp-modal-actions">
            <button
              className="pp-btn-cancel"
              onClick={() => {
                setShowModal(false);
                setSellPrice("");
                setSellConfirmText("");
              }}
            >
              Abort
            </button>
            <button
              className="pp-btn-danger"
              disabled={txLoading || sellConfirmText !== "SELL"}
              onClick={() => handleSellProperty(selectedProperty)}
            >
              {txLoading ? "Executing..." : "Confirm & Sell"}
            </button>
          </div>

        </div>
      </div>
    )}

  </div>
</>
  );
}