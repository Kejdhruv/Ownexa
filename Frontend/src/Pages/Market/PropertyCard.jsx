import { useEffect, useState } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useParams } from "react-router-dom";
import { ethers } from "ethers";

import PropertyTokenABI from "../../abi/PropertyToken.json";
import "../../Styles/Market/PropertyCard.css";
import TxLoader from "../../Components/Loaders/TxLoader";
import MarketLoader from "../../Components/Loaders/MarketLoader";
import Navbar from "../../Components/Market/Navbar";
const API = import.meta.env.VITE_API_BASE;
const CONTRACT_ADDRESS = import.meta.env.VITE_SMART_CONTRACT;

const ETH_INR = 300000; // keep configurable

import {
  MapPin,
  Home,
  Building2,
  Ruler,
  Coins,
  IndianRupee,
  Layers,
  FileText
} from "lucide-react";
import OwnexaFooter from "../../Components/Market/footer";

export default function PropertyCard() {
  const { id } = useParams();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [primaryBuying, setPrimaryBuying] = useState(false);
  const [secondaryBuying, setSecondaryBuying] = useState(false);
  const [quantity, setQuantity] = useState("");
  const [listings, setListings] = useState(null);

  const [txOpen, setTxOpen] = useState(false);
  const [txTitle, setTxTitle] = useState("");
  const [txSub, setTxSub] = useState("");
  const [txHash, setTxHash] = useState("");
  const [txDir, setTxDir] = useState("ESTATE_TO_ETH");

  useEffect(() => {
    const fetchApi = async () => {
      try {
        const [propertyRes, listingRes] = await Promise.all([
          fetch(`${API}/properties/${id}?status=Validated&listed=true`, {
            credentials: "include",
          }),
          fetch(`${API}/propertylisting/${id}`, {
            credentials: "include",
          }),
        ]);

        const propertyData = await propertyRes.json();
        const listingData = await listingRes.json();

        setListings(listingData);
        setProperty(propertyData);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchApi();
  }, [id]);
  const handlePrimaryBuy = async () => {
    try {
      if (!window.ethereum) {
        throw new Error("MetaMask not found");
      }

      if (!quantity || Number(quantity) <= 0) {
        throw new Error("Enter a valid quantity");
      }

      setPrimaryBuying(true);
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const buyerAddress = await signer.getAddress();
      const pricePerTokenWei = ethers.parseEther(
        (Number(property.price_per_token_inr) / ETH_INR).toFixed(18)
      );
      const basePriceWei = pricePerTokenWei * BigInt(quantity);
      const commissionWei = (basePriceWei * 2n) / 100n;
      const totalPriceWei = basePriceWei + commissionWei;
      const value = totalPriceWei;
      const contract = new ethers.Contract(
        CONTRACT_ADDRESS,
        PropertyTokenABI,
        signer
      );

      const tx = await contract.buyTokens(
        property.blockchain_id,
        BigInt(quantity),
        { value }
      );

      setTxDir("ESTATE_TO_ETH");
      setTxTitle("Transaction in Progress");
      setTxSub("Waiting for on-chain confirmation…");
      setTxHash(tx.hash);
      setTxOpen(true);

      const receipt = await tx.wait();
      setTxSub("Confirmation Syncing with server…");
      const res = await fetch(`${API}/transaction?type=primary`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId: property.id,
          blockchainId: property.blockchain_id,
          tokenName: property.token_name,
          tokenQuantity: Number(quantity),
          pricePerTokenInr: property.price_per_token_inr,
          accountaddress: buyerAddress,
          transactionhash: receipt.hash,
          status: "SUCCESS",
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Transaction sync failed");
      }

      setTxSub("Tokens Bought Successfully");
      setTimeout(() => setTxOpen(false), 400);

      setQuantity("");

    } catch (err) {
      setTxOpen(false);
      setTxHash("Transaction Failed");
      console.error(err);
      toast.error(err.message || "Primary buy failed");
    } finally {
      setPrimaryBuying(false);
    }
  };

  const handleSecondaryBuy = async (listing) => {
    try {
      if (!window.ethereum) {
        throw new Error("MetaMask not found");
      }

      setSecondaryBuying(true);

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const buyerAddress = await signer.getAddress();

      // price per token → ETH
      const pricePerTokenWei = ethers.parseEther(
        (Number(listing.price_per_token_inr) / ETH_INR).toFixed(18)
      );

      // total = price * listing quantity
      const basePriceWei =
        pricePerTokenWei * BigInt(listing.token_quantity);

      // 2% commission
      const commissionWei = (basePriceWei * 2n) / 100n;
      const totalPriceWei = basePriceWei + commissionWei;

      const contract = new ethers.Contract(
        CONTRACT_ADDRESS,
        PropertyTokenABI,
        signer
      );

      const tx = await contract.buyListing(
        listing.listing_blockchain_id,
        { value: totalPriceWei }
      );

      setTxDir("ESTATE_TO_ETH");
      setTxTitle("Transaction in Progress");
      setTxSub("Waiting for on-chain confirmation…");
      setTxHash(tx.hash);
      setTxOpen(true);

      const receipt = await tx.wait();
      setTxSub("Confirmation Syncing with server…");

      const res = await fetch(`${API}/transaction?type=secondary`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId: property.id,
          blockchainId: property.blockchain_id,
          tokenName: property.token_name,
          tokenQuantity: listing.token_quantity,
          pricePerTokenInr: listing.price_per_token_inr,
          listingId: listing.id,
          accountaddress: buyerAddress,
          transactionhash: receipt.hash,
          status: "SUCCESS",
        }),
      });



      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Transaction sync failed");
      }

      setTxSub("Tokens Bought Successfully");
      setTimeout(() => setTxOpen(false), 400);

    } catch (err) {
      setTxOpen(false);
      setTxHash("Transaction Failed");
      console.error(err);
      toast.error(err.message || "Secondary buy failed");
    } finally {
      setSecondaryBuying(false);
    }
  };

  if (loading) return <MarketLoader label="Fetching The Token ....... " />
  if (!property) return null;

  return (
    <>
      
  <ToastContainer position="top-right" autoClose={3000} />
  <div className="ft-page">
    <TxLoader
      open={txOpen}
      direction={txDir}
      title={txTitle}
      subtitle={txSub}
      txHash={txHash}
      onClose={() => {}}
        />
        
<div className="header-nav"> <Navbar/></div>
        <div className="ft-container">
    
      {/* PAGE HEADER */}
      <header className="ft-header">
        <div className="ft-header-titles">
          <h1 className="ft-title">{property.title}</h1>
          <div className="ft-location">
            <MapPin size={16} />
            <span>
              {property.address_line}, {property.city}, {property.state} – {property.pincode}
            </span>
          </div>
        </div>
        <div className="ft-header-badges">
          <span className="ft-badge"><Building2 size={14} /> {property.property_type}</span>
          <span className="ft-badge"><FileText size={14} /> Reg: {property.registry_number}</span>
        </div>
      </header>

      <div className="ft-layout">
        {/* LEFT COLUMN: ASSET OVERVIEW */}
        <div className="ft-asset-panel">
          {/* IMAGE GALLERY */}
          <div className="ft-gallery">
            {property.property_images?.slice(0, 1).map((img, idx) => (
              <img key={idx} src={img} alt={`Asset view ${idx + 1}`} className={`ft-img-${idx}`} />
            ))}
          </div>

          {/* ASSET SPECIFICATIONS */}
          <div className="ft-card">
            <h2 className="ft-card-title">Asset Specifications</h2>
            <div className="ft-specs-grid">
              <div className="ft-spec-box">
                <label>Configuration</label>
                <div className="ft-spec-val"><Home size={16} /> {property.bhk} BHK</div>
              </div>
              <div className="ft-spec-box">
                <label>Built-up Area</label>
                <div className="ft-spec-val"><Ruler size={16} /> {property.built_up_area_sqft} sqft</div>
              </div>
              <div className="ft-spec-box">
                <label>Token Asset</label>
                <div className="ft-spec-val"><Coins size={16} /> {property.token_name}</div>
              </div>
              <div className="ft-spec-box">
                <label>Issue Price</label>
                <div className="ft-spec-val"><IndianRupee size={16} /> {property.price_per_token_inr}</div>
              </div>
              <div className="ft-spec-box highlight-box">
                <label>Available Liquidity</label>
                <div className="ft-spec-val"><Layers size={16} /> {property.token_quantity} Tokens</div>
              </div>
              <div className="ft-spec-box">
                <label>Registry Name</label>
                <div className="ft-spec-val">{property.registry_name}</div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: TRADING DESK */}
        <div className="ft-trading-panel">
          
          {/* PRIMARY MARKET (ISSUE) */}
          <div className="ft-card primary-trade-card">
            <div className="ft-card-header">
              <h2 className="ft-card-title">Primary Market</h2>
              <span className="ft-status-dot live">Live</span>
            </div>
            
            <div className="ft-trade-form">
              <div className="ft-input-group1">
                <label>Investment Quantity (Tokens)</label>
                <div className="ft-input-wrapper">
                  <input
                    type="number"
                    placeholder="0"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    disabled={primaryBuying}
                    min="1"
                  />
                  <span className="ft-input-suffix">{property.token_name}</span>
                </div>
              </div>

              <div className="ft-trade-summary">
                <span>Estimated Value</span>
                <span className="ft-total-val">
                  ₹{quantity ? (Number(quantity) * property.price_per_token_inr).toLocaleString() : "0"}
                </span>
              </div>

              <button
                className="ft-btn-primary"
                onClick={handlePrimaryBuy}
                disabled={primaryBuying || !quantity || Number(quantity) <= 0}
              >
                {primaryBuying ? "Processing Order..." : "Place Primary Order"}
              </button>
            </div>
          </div>

          {/* SECONDARY MARKET (ORDER BOOK) */}
          <div className="ft-card secondary-trade-card">
             <div className="ft-card-header">
              <h2 className="ft-card-title">Order Book</h2>
              <span className="ft-subtitle">Secondary Market</span>
            </div>

            {listings && listings.length > 0 ? (
              <div className="ft-order-book">
                <div className="ft-order-header">
                  <span>Price (INR)</span>
                  <span>Size (Tokens)</span>
                  <span className="ft-align-right">Action</span>
                </div>
                
                <div className="ft-order-list">
                  {listings.map((listing) => (
                    <div className="ft-order-row" key={listing.id}>
                      <div className="ft-order-price">
                        ₹{listing.price_per_token_inr.toLocaleString()}
                      </div>
                      <div className="ft-order-size">
                        {listing.token_quantity}
                        <span className="ft-order-date">{new Date(listing.created_at).toLocaleDateString()}</span>
                      </div>
                      <div className="ft-order-action">
                        <button
                          className="ft-btn-secondary"
                          disabled={secondaryBuying}
                          onClick={() => handleSecondaryBuy(listing)}
                        >
                          {secondaryBuying ? "Executing" : "Buy"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="ft-empty-state">
                <div className="ft-empty-icon">📊</div>
                <p>No active sell orders</p>
                <span>Secondary market liquidity is currently zero.</span>
              </div>
            )}
          </div>

        </div>
      </div>
        </div>
      </div>

</>
  );
}
