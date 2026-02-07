import { useEffect, useState } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useParams, useNavigate } from "react-router-dom";
import { ethers } from "ethers";

import PropertyTokenABI from "../../abi/PropertyToken.json";
import "../../Styles/Admin/AdminPropertyPage.css"

const API = import.meta.env.VITE_API_BASE;
const CONTRACT_ADDRESS = import.meta.env.VITE_SMART_CONTRACT;

export default function AdminPropertyPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [minting, setMinting] = useState(false);
  const [error, setError] = useState("");
  const [tokenName, setTokenName] = useState("");
  const [tokenQuantity, setTokenQuantity] = useState("");
  const [pricePerTokenINR, setPricePerTokenINR] = useState("");
  const [adminreview, setadminreview] = useState("");

  useEffect(() => {
    const fetchProperty = async () => {
      try {
        const res = await fetch(`${API}/properties/${id}?status=pending&listed=false`, {
          credentials: "include"
        });

        if (!res.ok) throw new Error("Failed to fetch property");

        const data = await res.json();
        setProperty(data);
        setTokenName(data.token_name || "");
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProperty();
  }, [id]);


  const ETH_INR = 300000;
  const handleRejectProperty = async () => {
    try {
      if (!adminreview.trim()) {
        throw new Error("Admin review is required for rejection");
      }

      const rejectres = await fetch(`${API}/property/validate`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId: property.id,
          tokenName,
          adminreview,
          status: "Rejected",
          listing: false,
          tokenization: false,
          tokenQuantity: 0,
          pricePerTokenINR: 0,
          launchedPriceINR:
            Number(pricePerTokenINR || 0) * Number(tokenQuantity || 0)
        })
      });

      if (!rejectres.ok) {
        const err = await rejectres.json();
        throw new Error(err.error || "Rejection failed");
      }

      navigate("/");

    } catch (err) {
      toast.error(err.message);
      setError(err.message);
    }
  };
  const handleValidateAndMint = async () => {
    try {
      setMinting(true);
      setError("");

      if (!window.ethereum) {
        throw new Error("MetaMask not found");
      }

      if (!tokenName || !tokenQuantity || !pricePerTokenINR) {
        throw new Error("Fill all admin fields");
      }
      const pricePerTokenETH =
        (Number(pricePerTokenINR) / ETH_INR).toFixed(18);
      const pricePerTokenWei = ethers.parseEther(pricePerTokenETH)
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      const contract = new ethers.Contract(
        CONTRACT_ADDRESS,
        PropertyTokenABI,
        signer
      );
      const tx = await contract.listProperty(
        property.owner_accountaddress,
        BigInt(tokenQuantity),
        pricePerTokenWei,
        tokenName,
      );

      const receipt = await tx.wait();
      let blockchainId = null;
      for (const log of receipt.logs) {
        try {
          const parsed = contract.interface.parseLog(log);
          if (parsed?.name === "PropertyListed") {
            blockchainId = parsed.args.propertyId.toString();
          }
        } catch (err) { console.log(err); }
      }

      if (!blockchainId) {
        throw new Error("Blockchain ID not found in events");
      }
      const res = await fetch(`${API}/property/validate`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId: property.id,
          blockchainId,
          transactionHash: receipt.hash,
          tokenName,
          adminreview,
          status: "Validated",
          tokenization: true,
          listing: true,
          tokenQuantity: Number(tokenQuantity),
          pricePerTokenINR: Number(pricePerTokenINR),
          launchedPriceINR:
            Number(pricePerTokenINR) * Number(tokenQuantity)
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Validation failed");
      }
      toast.success("Property validated & minted successfully");
      navigate("/AdminViewPage");

    } catch (err) {
      toast.error(err.message);
      setError(err.message);
    } finally {
      setMinting(false);
    }
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">{error}</div>;
  if (!property) return null;

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="property-page">
        <div className="property-container">
          <div className="property-header">
            <h2>{property.title}</h2>
            <span className="status-badge pending">
              {property.status.toUpperCase()}
            </span>
          </div>
          <div className="property-layout">
            <div className="property-left">
              <InfoCard title="Property Details">
                <p>{property.bhk} BHK • {property.property_type}</p>
                <p>{property.built_up_area_sqft} sqft</p>
              </InfoCard>

              <InfoCard title="Address">
                <p>{property.address_line}</p>
                <p>{property.city}, {property.state} - {property.pincode}</p>
              </InfoCard>

              <InfoCard title="Owner Info">
                <p>{property.owner_name}</p>
                <p className="muted">
                  {property.owner_accountaddress.slice(0, 6)}...
                  {property.owner_accountaddress.slice(-4)}
                </p>
              </InfoCard>

              <InfoCard title="Registry">
                <p>{property.registry_name}</p>
                <p>{property.registry_number}</p>
                <p>{property.registration_date}</p>
              </InfoCard>

              <InfoCard title="Token (User Expectation)">
                <p>{property.token_name}</p>
                <p>Expected: ₹{property.price_per_token_inr}</p>
              </InfoCard>
            </div>

            <div className="property-right">

              <InfoCard title="Property Images">
                <div className="image-grid">
                  {property.property_images.map((img, i) => (
                    <img key={i} src={img} alt="property" />
                  ))}
                </div>
              </InfoCard>

              <InfoCard title="Legal Documents">
                {property.legal_documents.map((doc, i) => (
                  <a key={i} href={doc} target="_blank" rel="noreferrer">
                    📄 {doc.split("/").pop()}
                  </a>
                ))}
              </InfoCard>

              {property.status === "pending" && (
                <InfoCard title="Admin – Validate & Mint">

                  <div className="admin-form-row">

                    <div className="token-fields-vertical">
                      <input
                        placeholder="Token Name"
                        value={tokenName}
                        onChange={(e) => setTokenName(e.target.value)}
                      />

                      <input
                        placeholder="Token Quantity"
                        type="number"
                        value={tokenQuantity}
                        onChange={(e) => setTokenQuantity(e.target.value)}
                      />

                      <input
                        placeholder="Price Per Token (INR)"
                        type="number"
                        value={pricePerTokenINR}
                        onChange={(e) => setPricePerTokenINR(e.target.value)}
                      />
                    </div>

                    <div className="admin-review-field">
                      <textarea
                        placeholder="Admin review (verification / rejection notes)"
                        value={adminreview}
                        onChange={(e) => setadminreview(e.target.value)}
                        rows={6}
                      />
                    </div>

                  </div>

                  <div className="action-row">
                    <button
                      className="mint-btn"
                      disabled={minting}
                      onClick={handleValidateAndMint}
                    >
                      {minting ? "Minting on Blockchain..." : "Validate & Mint"}
                    </button>

                    <button
                      className="reject-btn"
                      disabled={minting}
                      onClick={handleRejectProperty}
                    >
                      Reject
                    </button>
                  </div>

                </InfoCard>
              )}

            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function InfoCard({ title, children }) {
  return (
    <div className="preview-card">
      <div className="preview-label">{title}</div>
      {children}
    </div>
  );
}