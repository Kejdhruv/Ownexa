import { useEffect, useState } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { ethers } from "ethers";

import "../../Styles/Profile/Transactions.css";
import "../../Styles/Profile/Holdings.css";
import SortBar from "../../Components/Dashboard/Filter";

import PropertyTokenABI from "../../abi/PropertyToken.json"
import ReactorOrbitLoader from "../../Components/Loaders/ProfileLoader";
import { assertContractAddress } from "../../config/blockchain";
const ETH_INR = 300000;
const API = import.meta.env.VITE_API_BASE;

export default function HoldingsPage() {
  const [loading, setLoading] = useState(true);
  const [holdings, setHoldings] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedHolding, setSelectedHolding] = useState(null);
  const [listQty, setListQty] = useState("");
  const [listPrice, setListPrice] = useState("");
  const [listingLoading, setListingLoading] = useState(false);
  const [showRedeemModal, setShowRedeemModal] = useState(false);
  const [redeemLoading, setRedeemLoading] = useState(false);
  const [selectedRedeemHolding, setSelectedRedeemHolding] = useState(null);
  const [redeemConfirmText, setRedeemConfirmText] = useState("");

  useEffect(() => {
    const fetchHoldings = async () => {
      try {
        const res = await fetch(`${API}/holdings`, {
          credentials: "include",
        });
        if (!res.ok) throw new Error("Failed to fetch holdings");
        const data = await res.json();
        console.log(data);
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

  const getContract = async () => {
    if (!window.ethereum) {
      throw new Error("MetaMask not detected");
    }

    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();

    return new ethers.Contract(
      assertContractAddress(),
      PropertyTokenABI,
      signer
    );
  };

  const openModal = (holding) => {
    setSelectedHolding(holding);
    setListQty("");
    setListPrice("");
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedHolding(null);
  };

  const openRedeemModal = (holding) => {
    setSelectedRedeemHolding(holding);
    setShowRedeemModal(true);
  };

  const closeRedeemModal = () => {
    setShowRedeemModal(false);
    setSelectedRedeemHolding(null);
    setRedeemConfirmText("");
  };

  const handleRedeemTokens = async () => {
    if (!selectedRedeemHolding) return;
    if (redeemConfirmText !== "REDEEM") {
      toast.error("Please type REDEEM to confirm");
      return;
    }

    try {
      setRedeemLoading(true);

      const contract = await getContract();

      // Call redeem on-chain
      const tx = await contract.redeemTokens(
        selectedRedeemHolding.properties.blockchain_id
      );

      await tx.wait();

      // Sync backend
      const res = await fetch(`${API}/holding/freeze`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          holdingId: selectedRedeemHolding.id,
        }),
      });

      if (!res.ok) {
        const t = await res.text().catch(() => "");
        throw new Error(t || "Backend redeem sync failed");
      }

      // Update UI (mark redeemed + move to previous)
      setHoldings((prev) =>
        prev.map((h) =>
          h.id === selectedRedeemHolding.id
            ? { ...h, redeemed: true }
            : h
        )
      );
      toast.success("Tokens redeemed successfully");
      closeRedeemModal();
    } catch (err) {
      console.error("Redeem failed:", err);
      toast.error(err.message || "Redeem failed");
    } finally {
      setRedeemLoading(false);
    }
  };

  const handleListTokens = async () => {
    if (!selectedHolding) return;

    const qty = Number(listQty);
    const priceInInr = Number(listPrice);

    if (!qty || qty <= 0) {
      toast.error("Invalid quantity");
      return;
    }
    if (qty > selectedHolding.token_quantity) {
      toast.error("Quantity exceeds available holdings");
      return;
    }
    if (!priceInInr || priceInInr <= 0) {
      toast.error("Invalid price");
      return;
    }

    try {
      setListingLoading(true);
      const contract = await getContract();
      const ethValue = (priceInInr / ETH_INR).toFixed(18);
      const priceInEth = ethers.parseEther(ethValue);
      const tx = await contract.createListing(
        selectedHolding.properties.blockchain_id,
        qty,
        priceInEth
      );

      const receipt = await tx.wait();
      let listingId
      for (const log of receipt.logs) {
        try {
          const parsed = contract.interface.parseLog(log);
          if (parsed?.name === "ListingCreated") {
            listingId = parsed.args.listingId.toString();
          }
        } catch (err) { console.log(err); }
      }
      if (!listingId) {
        throw new Error("Blockchain ID not found in events");
      }

      const res = await fetch(`${API}/listing`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId: selectedHolding.properties.id,
          holdingId: selectedHolding.id,
          tokenQuantity: qty,
          pricePerTokenInr: priceInInr,
          listingBlockchainId: listingId,
        }),
      });

      if (!res.ok) {
        throw new Error("Backend listing sync failed");
      }
      setHoldings((prev) =>
        prev
          .map((h) =>
            h.id === selectedHolding.id
              ? { ...h, token_quantity: h.token_quantity - qty }
              : h
          )
          .filter((h) => h.token_quantity > 0)
      );

      closeModal();
    } catch (err) {
      console.error("Listing failed:", err);
      toast.error(err.message || "Listing failed");
    } finally {
      setListingLoading(false);
    }
  };

  if (loading) {
    return <ReactorOrbitLoader label="Fetching your Holdings data..." />
  }

  return (
  <>
  <ToastContainer position="top-right" autoClose={3000} />
  <div className="port-page">
    
    {/* PAGE HEADER */}
    <header className="port-header">
      <div className="port-header-left">
        <h1 className="port-title">Portfolio Holdings</h1>
        <p className="port-subtitle">Manage your active and past tokenized real estate assets.</p>
      </div>
      <div className="port-header-right">
        {/* Your SortBar remains fully intact */}
        <SortBar
          options={[
            { key: "token_quantity", label: "Quantity" },
            { key: "updated_at", label: "Date" },
            { key: "avg_price_inr", label: "Avg Price" },
          ]}
          data={holdings}
          onChange={setHoldings}
        />
      </div>
    </header>

    {/* ===============================
        ACTIVE HOLDINGS
    =============================== */}
    <section className="port-section">
      <div className="port-section-header">
        <h2>Active Positions</h2>
        <div className="port-line"></div>
      </div>

      {holdings.filter((h) => h.redeemed == false).length === 0 ? (
        <div className="port-empty">
          <div className="port-empty-icon">📊</div>
          <p>No active token holdings found in your portfolio.</p>
        </div>
      ) : (
        <div className="port-grid">
          {holdings.filter((h) => h.redeemed == false).map((h) => {
            const totalInvestment = h.token_quantity * h.avg_price_inr;
            const image = h.properties?.property_images?.[0] || "/placeholder-property.jpg";

            return (
              <div key={h.id} className="asset-card">
                <div className="asset-visual">
                  <img src={image} alt={h.properties.title} />
                  <div className="asset-overlay"></div>
                  <span className={`asset-status ${h.properties.status.toUpperCase()}`}>
                    <span className="status-dot"></span>
                    {h.properties.status}
                  </span>
                </div>

                <div className="asset-body">
                  <div className="asset-head">
                    <h3 className="asset-title">{h.properties.title}</h3>
                    <span className="asset-location">{h.properties.city}, {h.properties.state}</span>
                  </div>

                  <div className="asset-metrics">
                    <div className="metric-box">
                      <span className="m-label">Asset Token</span>
                      <span className="m-value highlight">{h.properties.token_name}</span>
                    </div>
                    <div className="metric-box">
                      <span className="m-label">Quantity</span>
                      <span className="m-value num">{h.token_quantity}</span>
                    </div>
                    <div className="metric-box">
                      <span className="m-label">Avg Price</span>
                      <span className="m-value num">₹{h.avg_price_inr.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="asset-footer">
                    <div className="asset-total">
                      <span className="t-label">Total Value</span>
                      <span className="t-value num">₹{totalInvestment.toLocaleString()}</span>
                    </div>

                    <div className="asset-actions">
                      {h.holding_status === true && (
                        <button className="btn-trade" onClick={() => openModal(h)}>
                          List Tokens
                        </button>
                      )}
                      {h.holding_status === false && (
                        <button className="btn-redeem" onClick={() => openRedeemModal(h)}>
                          Redeem
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>

    {/* ===============================
        PREVIOUS HOLDINGS (REDEEMED)
    =============================== */}
    {holdings.filter((h) => h.redeemed === true).length > 0 && (
      <section className="port-section mt-12">
        <div className="port-section-header">
          <h2 className="text-muted">Closed Positions</h2>
          <div className="port-line"></div>
        </div>

        <div className="port-grid">
          {holdings.filter((h) => h.redeemed === true).map((h) => {
            const totalInvestment = h.token_quantity * h.avg_price_inr;
            const image = h.properties?.property_images?.[0] || "/placeholder-property.jpg";

            return (
              <div key={h.id} className="asset-card closed-card">
                <div className="asset-visual">
                  <img src={image} alt={h.properties.title} />
                  <div className="asset-overlay"></div>
                  <span className="asset-status REDEEMED">
                    <span className="status-dot"></span>
                    REDEEMED
                  </span>
                </div>

                <div className="asset-body">
                  <div className="asset-head">
                    <h3 className="asset-title">{h.properties.title}</h3>
                    <span className="asset-location">{h.properties.city}, {h.properties.state}</span>
                  </div>

                  <div className="asset-metrics double">
                    <div className="metric-box">
                      <span className="m-label">Asset Token</span>
                      <span className="m-value">{h.properties.token_name}</span>
                    </div>
                    <div className="metric-box">
                      <span className="m-label">Total Investment</span>
                      <span className="m-value num text-muted">₹{totalInvestment.toLocaleString()}</span>
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
        LIST TOKENS MODAL
    =============================== */}
    {showModal && selectedHolding && (
      <div className="ft-modal-backdrop">
        <div className="ft-modal-card">
          <div className="ft-modal-header">
            <h2>Execute Listing</h2>
            <p className="ft-modal-sub">{selectedHolding.properties.token_name} • Secondary Market</p>
          </div>

          <div className="ft-modal-body">
            <div className="ft-input-group">
              <label>
                Quantity to List
                <span className="input-max">Max: {selectedHolding.token_quantity}</span>
              </label>
              <input
                type="number"
                max={selectedHolding.token_quantity}
                value={listQty}
                onChange={(e) => setListQty(e.target.value)}
                placeholder="0"
              />
            </div>

            <div className="ft-input-group">
              <label>Price per Token (INR)</label>
              <div className="input-with-prefix">
                <span className="prefix">₹</span>
                <input
                  type="number"
                  value={listPrice}
                  onChange={(e) => setListPrice(e.target.value)}
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>

          <div className="ft-modal-actions">
            <button className="ft-btn-cancel" onClick={closeModal}>Cancel</button>
            <button
              className="ft-btn-confirm"
              disabled={listingLoading}
              onClick={handleListTokens}
            >
              {listingLoading ? "Processing..." : "Confirm Listing"}
            </button>
          </div>
        </div>
      </div>
    )}

    {/* ===============================
        REDEEM MODAL
    =============================== */}
    {showRedeemModal && selectedRedeemHolding && (
      <div className="ft-modal-backdrop">
        <div className="ft-modal-card danger-modal">
          <div className="ft-modal-header">
            <h2>Confirm Redemption</h2>
            <p className="ft-modal-sub">{selectedRedeemHolding.properties.token_name}</p>
          </div>

          <div className="ft-modal-body text-center">
            <div className="warning-box">
              ⚠️ This action is irreversible and will permanently close your position.
            </div>
            <div className="ft-input-group mt-4">
              <label>Type <b>REDEEM</b> to confirm</label>
              <input
                type="text"
                placeholder="REDEEM"
                value={redeemConfirmText}
                onChange={(e) => setRedeemConfirmText(e.target.value.toUpperCase())}
                className="danger-input"
              />
            </div>
          </div>

          <div className="ft-modal-actions">
            <button className="ft-btn-cancel" onClick={closeRedeemModal}>Cancel</button>
            <button
              className="ft-btn-danger"
              disabled={redeemLoading || redeemConfirmText !== "REDEEM"}
              onClick={handleRedeemTokens}
            >
              {redeemLoading ? "Executing..." : "Confirm Redeem"}
            </button>
          </div>
        </div>
      </div>
    )}
  </div>
</>
  );
}
