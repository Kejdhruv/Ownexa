import { useEffect, useState } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useParams } from "react-router-dom";
import { ethers } from "ethers";

import PropertyTokenABI from "../../abi/PropertyToken.json";
import "../../Styles/Market/PropertyCard.css";
import TxLoader from "../../Components/Loaders/TxLoader";
import MarketLoader from "../../Components/Loaders/MarketLoader";
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
    <div className="property-buy-page">
      <TxLoader
  open={txOpen}
  direction={txDir}
  title={txTitle}
  subtitle={txSub}
  txHash={txHash}
  onClose={() => {}} // keep disabled while processing
/>
      <div className="property-buy-container">

        {/* LEFT COLUMN */}
        <div className="property-left">

          {/* PROPERTY DETAIL CARD */}
          <div className="property-main glass-card">
            <div className="property-image-grid">
              {property.property_images?.map((img, idx) => (
                <img key={idx} src={img} alt="property" />
              ))}
            </div>

            <div className="property-details">
              <p className="property-title">{property.title}</p>

              <div className="detail-row full">
                <MapPin size={16} />
                <span>
                  {property.address_line}, {property.city}, {property.state} – {property.pincode}
                </span>
              </div>

              <div className="details-grid">
                <div className="detail-item">
                  <Home size={16} />
                  <span>{property.bhk} BHK</span>
                </div>

                <div className="detail-item">
                  <Building2 size={16} />
                  <span>{property.property_type}</span>
                </div>

                <div className="detail-item">
                  <Ruler size={16} />
                  <span>{property.built_up_area_sqft} sqft</span>
                </div>

                <div className="detail-item">
                  <Coins size={16} />
                  <span>{property.token_name}</span>
                </div>

                <div className="detail-item">
                  <IndianRupee size={16} />
                  <span>{property.price_per_token_inr}</span>
                </div>

                <div className="detail-item">
                  <Layers size={16} />
                  <span>{property.token_quantity} tokens left</span>
                </div>
              </div>

              <div className="detail-row full">
                <FileText size={16} />
                <span>
                  {property.registry_name} • {property.registry_number}
                </span>
              </div>
            </div>
          </div>

          {/* PRIMARY BUY CARD */}
          <div className="market-card glass-card primary-market">
            <h3>Primary Market</h3>

            <div className="primary-buy-row">
              <input
                type="number"
                placeholder="Qty"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                disabled={primaryBuying}
                min="1"
              />

              <button
                className="buy-btn compact"
                onClick={handlePrimaryBuy}
                disabled={primaryBuying || !quantity || Number(quantity) <= 0}
              >
                {primaryBuying
                  ? "Fetching Your Tokens"
                  : ` ₹${quantity
                    ? (Number(quantity) * property.price_per_token_inr).toLocaleString()
                    : 0}`}
              </button>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN */}
        <div className="property-right">

          <div className="market-card glass-card secondary-market">
            <h3>Secondary Market</h3>

            {listings && listings.length > 0 ? (
              <div className="secondary-list">
                {listings.map((listing) => (
                  <div className="secondary-row" key={listing.id}>

                    <div className="sec-price">
                      ₹{listing.price_per_token_inr}
                      <span>/token</span>
                    </div>

                    <div className="sec-qty">
                      {listing.token_quantity} tokens
                    </div>

                    <div className="sec-date">
                      {new Date(listing.created_at).toLocaleDateString()}
                    </div>

                    <button
                      className="sec-buy-btn"
                      disabled={secondaryBuying}
                      onClick={() => handleSecondaryBuy(listing)}
                    >
                      {secondaryBuying ? "Negotiating" : "Buy"}
                    </button>

                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-secondary">No Secondary Listings Yet</div>
            )}
          </div>

        </div>
      </div>
    </div>
    </>
  );
}