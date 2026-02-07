import { useEffect, useState } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { ethers } from "ethers";

import PropertyTokenABI from "../../abi/PropertyToken.json";
import "../../Styles/Profile/Transactions.css";
import "../../Styles/Profile/Holdings.css";
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
      <div className="txn-page">

        <div className="txn-header">
          <h1 className="txn-title">Properties</h1>

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

        {/* ACTIVE / LISTED PROPERTIES */}
        {Properties.filter((p) => p.is_listed === true).length === 0 ? (
          <p className="txn-empty">No Current Holdings</p>
        ) : (
          <div className="txn-grid">
            {Properties.filter((p) => p.is_listed === true).map((h) => {

              const totalInvestment =
                h.initial_token_quantity * h.price_per_token_inr;

              const image =
                h.property_images?.[0] || "/placeholder-property.jpg";

              return (
                <div key={h.id} className="holding-card">

                  {/* IMAGE */}
                  <div className="holding-image">
                    <img src={image} alt={h.title} />

                    <span className={`holding-status ${h.status.toUpperCase()}`}>
                      {h.status}
                    </span>
                  </div>

                  {/* BODY */}
                  <div className="holding-body">

                    <div className="holding-header">
                      <h3 className="holding-title">{h.title}</h3>

                      <span className="holding-location">
                        {h.city}, {h.state}
                      </span>
                    </div>

                    {/* META */}
                    <div className="holding-meta">

                      <div>
                        <span className="meta-label">Token</span>
                        <span className="meta-value">
                          {h.token_name}
                        </span>
                      </div>

                      <div>
                        <span className="meta-label">Quantity Sold</span>
                        <span className="meta-value">
                          {h.initial_token_quantity - h.token_quantity}
                        </span>
                      </div>

                      <div>
                        <span className="meta-label">Amount Raised</span>
                        <span className="meta-value">
                          ₹{(
                            h.price_per_token_inr *
                            (h.initial_token_quantity - h.token_quantity)
                          ).toLocaleString()}
                        </span>
                      </div>

                    </div>

                    {/* FOOTER */}
                    <div className="holding-footer">

                      <span className="holding-total">

                        <span className="meta-label">
                          Investment
                        </span>

                        <span className="meta-value">
                          ₹{totalInvestment.toLocaleString()}
                        </span>

                      </span>

                      {/* SELL BUTTON */}
                      {h.status.toUpperCase() === "VALIDATED" &&
                        h.is_listed === true && (

                          <button
                            className="list-btn"
                            onClick={() => {
                              setSelectedProperty(h);
                              setShowModal(true);
                            }}
                          >
                            Sell Property
                          </button>

                        )}

                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ===============================
          PREVIOUS PROPERTIES (UNLISTED)
      =============================== */}
        {Properties.filter((p) => p.is_listed === false).length > 0 && (
          <>
            <h2 className="txn-subtitle">Your Previous Properties</h2>

            <div className="txn-grid previous-properties">

              {Properties.filter((p) => p.is_listed === false).map((h) => {

                const totalInvestment =
                  h.initial_token_quantity * h.price_per_token_inr;

                const image =
                  h.property_images?.[0] || "/placeholder-property.jpg";

                return (
                  <div key={h.id} className="holding-card previous-card">

                    <div className="holding-image">
                      <img src={image} alt={h.title} />

                      <span className="holding-status SOLD">
                        SOLD
                      </span>
                    </div>

                    <div className="holding-body">

                      <div className="holding-header">
                        <h3 className="holding-title">{h.title}</h3>

                        <span className="holding-location">
                          {h.city}, {h.state}
                        </span>
                      </div>

                      <div className="holding-meta">

                        <div>
                          <span className="meta-label">Token</span>
                          <span className="meta-value">
                            {h.token_name}
                          </span>
                        </div>

                        <div>
                          <span className="meta-label">Total Investment</span>
                          <span className="meta-value">
                            ₹{totalInvestment.toLocaleString()}
                          </span>
                        </div>

                      </div>

                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* ===============================
          SELL MODAL
      =============================== */}
        {showModal && selectedProperty && (

          <div className="sell-modal-overlay">

            <div className="sell-modal">

              <h2>Sell Property</h2>

              <p className="modal-title">
                {selectedProperty.title}
              </p>

              <p className="modal-min">
                Minimum Price: ₹
                {(
                  selectedProperty.price_per_token_inr *
                  selectedProperty.initial_token_quantity
                ).toLocaleString()}
              </p>

              <p
                style={{
                  marginBottom: "8px",
                  fontSize: "14px",
                  color: "#4b5563",
                  textAlign: "center",
                }}
              >
                This action is irreversible. Type <b>SELL</b> to confirm.
              </p>

              <input
                type="text"
                placeholder="Type SELL to confirm"
                value={sellConfirmText}
                onChange={(e) =>
                  setSellConfirmText(e.target.value.toUpperCase())
                }
                className="sell-confirm-input"
              />

              <input
                type="number"
                placeholder="Enter settlement price (INR)"
                value={sellPrice}
                onChange={(e) => setSellPrice(e.target.value)}
              />

              <div className="modal-actions">

                <button
                  className="cancel-btn"
                  onClick={() => {
                    setShowModal(false);
                    setSellPrice("");
                    setSellConfirmText("");
                  }}
                >
                  Cancel
                </button>

                <button
                  className="confirm-btn"
                  disabled={txLoading || sellConfirmText !== "SELL"}
                  onClick={() => handleSellProperty(selectedProperty)}
                >
                  {txLoading ? "Processing..." : "Confirm & Sell"}
                </button>

              </div>

            </div>
          </div>
        )}

      </div>
    </>
  );
}