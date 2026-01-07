import { useEffect, useState } from "react";
import { ethers } from "ethers";

import "../../Styles/Profile/Transactions.css";
import "../../Styles/Profile/Holdings.css";
import SortBar from "../../Components/Dashboard/Filter";

import PropertyTokenABI from "../../abi/PropertyToken.json"
const ETH_INR = 300000;
const API = import.meta.env.VITE_API_BASE;
const CONTRACT_ADDRESS = import.meta.env.VITE_SMART_CONTRACT;

export default function HoldingsPage() {
  const [loading, setLoading] = useState(true);
  const [holdings, setHoldings] = useState([]);

  // modal state
  const [showModal, setShowModal] = useState(false);
  const [selectedHolding, setSelectedHolding] = useState(null);
  const [listQty, setListQty] = useState("");
  const [listPrice, setListPrice] = useState("");
  const [listingLoading, setListingLoading] = useState(false);

  /* =========================
     FETCH HOLDINGS
  ========================= */
  useEffect(() => {
    const fetchHoldings = async () => {
      try {
        const res = await fetch(`${API}/holdings`, {
          credentials: "include",
        });
        if (!res.ok) throw new Error("Failed to fetch holdings");
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

  /* =========================
     CONTRACT HELPER
  ========================= */
  const getContract = async () => {
    if (!window.ethereum) {
      throw new Error("MetaMask not detected");
    }

    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();

    return new ethers.Contract(
      CONTRACT_ADDRESS,
      PropertyTokenABI,
      signer
    );
  };

  /* =========================
     MODAL HANDLERS
  ========================= */
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

  /* =========================
     LIST TOKENS (CHAIN → BACKEND)
  ========================= */
  const handleListTokens = async () => {
    if (!selectedHolding) return;

    const qty = Number(listQty);
    const priceInInr = Number(listPrice);

    if (!qty || qty <= 0) return alert("Invalid quantity");
    if (qty > selectedHolding.token_quantity)
      return alert("Quantity exceeds available holdings");
    if (!priceInInr || priceInInr <= 0)
      return alert("Invalid price");

    try {
      setListingLoading(true);

      // 1️⃣ CONTRACT
      const contract = await getContract();

      // ⚠️ Replace with YOUR real INR → ETH conversion
     const ethValue = (priceInInr / ETH_INR).toFixed(18);
const priceInEth = ethers.parseEther(ethValue); 
      // 2️⃣ BLOCKCHAIN TX
      const tx = await contract.createListing(
        selectedHolding.properties.blockchain_id,
        qty,
        priceInEth
      );

      const receipt = await tx.wait();

        // 3️⃣ PARSE EVENT
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

      // 4️⃣ BACKEND SYNC
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

      // 5️⃣ UPDATE UI
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
      alert(err.message || "Listing failed");
    } finally {
      setListingLoading(false);
    }
  };

  /* =========================
     RENDER
  ========================= */
  if (loading) {
    return <div className="txn-loading">Loading Holdings…</div>;
  }

  return (
    <div className="txn-page">
      <div className="txn-header">
        <h1 className="txn-title">Holdings</h1>

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

      {holdings.length === 0 ? (
        <p className="txn-empty">No Current Holdings</p>
      ) : (
        <div className="txn-grid">
          {holdings.map((h) => {
            const totalInvestment =
              h.token_quantity * h.avg_price_inr;

            const image =
              h.properties?.property_images?.[0] ||
              "/placeholder-property.jpg";

            return (
              <div key={h.id} className="holding-card">
                <div className="holding-image">
                  <img src={image} alt={h.properties.title} />
                  <span
                    className={`holding-status ${h.properties.status}`}
                  >
                    {h.properties.status}
                  </span>
                </div>

                <div className="holding-body">
                  <div className="holding-header">
                    <h3 className="holding-title">
                      {h.properties.title}
                    </h3>
                    <span className="holding-location">
                      {h.properties.city}, {h.properties.state}
                    </span>
                  </div>

                  <div className="holding-meta">
                    <div>
                      <span className="meta-label">Token</span>
                      <span className="meta-value">
                        {h.properties.token_name}
                      </span>
                    </div>
                    <div>
                      <span className="meta-label">Quantity</span>
                      <span className="meta-value">
                        {h.token_quantity}
                      </span>
                    </div>
                    <div>
                      <span className="meta-label">Avg Price</span>
                      <span className="meta-value">
                        ₹{h.avg_price_inr}
                      </span>
                    </div>
                  </div>

                  <div className="holding-footer">
                    <span className="holding-total">
                      ₹{totalInvestment.toLocaleString()}
                    </span>

                    <button
                      className="list-btn"
                      onClick={() => openModal(h)}
                    >
                      List Tokens
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* =========================
         LIST MODAL
      ========================= */}
      {showModal && selectedHolding && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <h2>List Tokens</h2>

            <p className="modal-sub">
              {selectedHolding.properties.token_name}
            </p>

            <label>
              Quantity
              <input
                type="number"
                max={selectedHolding.token_quantity}
                value={listQty}
                onChange={(e) => setListQty(e.target.value)}
              />
            </label>

            <label>
              Price per Token (INR)
              <input
                type="number"
                value={listPrice}
                onChange={(e) => setListPrice(e.target.value)}
              />
            </label>

            <div className="modal-actions">
              <button onClick={closeModal}>Cancel</button>
              <button
                disabled={listingLoading}
                onClick={handleListTokens}
              >
                {listingLoading ? "Listing..." : "Confirm Listing"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}