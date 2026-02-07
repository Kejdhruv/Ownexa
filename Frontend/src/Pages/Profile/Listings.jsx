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
      // IMPORTANT: most Hardhat/Foundry ABIs are in .abi
      PropertyTokenABI.abi ?? PropertyTokenABI,
      signer
    );

    return { contract, account };
  };

  const handleCancelListing = async (item) => {
    // item is your listing row from supabase
    const listingId = item.id;
    const blockchainId = item.listing_blockchain_id
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

      // 2) Sync backend (DB cancel + holdings restore happens there in your route)
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

      // 3) Update UI: remove from active list immediately
      setActiveListings((prev) => prev.filter((l) => l.id !== listingId));
    } catch (err) {
      console.error("Cancel failed:", err);
      toast.error(err.message || "Cancel failed");
    } finally {
      setCancelLoadingId(null);
    }
  };

  if (loading) {
    return <ReactorOrbitLoader label="Fetching your Listings" />
  }

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} />
    <div className="listings-page">
      <section className="listings-section">
        <h2 className="listings-title">Active Listings</h2>

        {activeListings.length === 0 ? (
          <p className="listings-empty">No active listings</p>
        ) : (
          <div className="listings-grid">
            {activeListings.map((item) => (
              <div key={item.id} className="listing-card">
                <h4 className="listing-name">{item.properties?.title}</h4>

                <p className="listing-location">
                  {item.properties?.city}, {item.properties?.state}
                </p>

                <p className="listing-token">Token: {item.properties?.token_name}</p>

                <div className="listing-meta">
                  <div>
                    <span>Bought For</span>
                    <strong>₹{item.holdings?.avg_price_inr}</strong>
                  </div>

                  <div>
                    <span>Listed For</span>
                    <strong>₹{item.price_per_token_inr}</strong>
                  </div>

                  <div>
                    <span>Listed Quantity</span>
                    <strong>{item.token_quantity}</strong>
                  </div>
                </div>

                <button
                  className="listing-cancel"
                  onClick={() => handleCancelListing(item)}
                  disabled={cancelLoadingId === item.id}
                >
                  {cancelLoadingId === item.id ? "Cancelling..." : "Cancel"}
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="listings-section">
        <h2 className="listings-title">Sold Listings</h2>

        {soldListings.length === 0 ? (
          <p className="listings-empty">No sold listings</p>
        ) : (
          <div className="listings-grid">
            {soldListings.map((item) => (
              <div key={item.id} className="listing-card sold">
                <h4 className="listing-name">{item.properties?.title}</h4>

                <p className="listing-location">
                  {item.properties?.city}, {item.properties?.state}
                </p>

                <p className="listing-token">Token: {item.properties?.token_name}</p>

                <div className="listing-meta">
                  <div>
                    <span>Bought For</span>
                    <strong>₹{item.holdings?.avg_price_inr}</strong>
                  </div>

                  <div>
                    <span>Sold For</span>
                    <strong>₹{item.price_per_token_inr}</strong>
                  </div>

                  <div>
                    <span>Quantity</span>
                    <strong>{item.token_quantity}</strong>
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