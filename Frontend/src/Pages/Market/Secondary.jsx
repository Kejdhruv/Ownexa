import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../Styles/Market/Secondary.css"

const API = import.meta.env.VITE_API_BASE;

export default function SecondaryMarket() {
  const [listing, setlisting] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchListing = async () => {
      try {
        const res = await fetch(
          `${API}/propertylisting?status=ACTIVE`,
          { credentials: "include" }
        );
        if (!res.ok) throw new Error("Failed to fetch listed");
        const data = await res.json();
        // latest first
        const sorted = data.sort(
          (a, b) => new Date(b.validated_at) - new Date(a.validated_at)  
        );
        setlisting(sorted);
      } catch (err) {
        console.error(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchListing();
  }, []);

  if (loading) {
    return <div className="admin-loading">Loading Secondary Market</div>;
  }

  return (
    <div className="admin-pending-page">
      <h2>Listing Market</h2>

      {listing.length === 0 ? (
        <p className="empty-text">No Listings Available at the moment </p>
      ) : (
        <div className="admin-card-grid">
         {listing.map((item) => (
  <div
    key={item.id}
    className="market-card"
    onClick={() => navigate(`/Property/${item.properties.id}`)}
  >
    <div className="market-card-row">

      {/* LEFT: IMAGE STACK */}
      <div className="market-card-images">
        <img
          src={
            item.properties.property_images?.[0] ||
            "/placeholder-property.jpg"
          }
          alt={item.properties.title}
        />
        {item.properties.property_images?.[1] && (
          <img
            src={item.properties.property_images[1]}
            alt={item.properties.title}
          />
        )}
      </div>

      {/* RIGHT: CONTENT */}
      <div className="market-card-content">

        {/* HEADER */}
        <div className="market-card-header">
          <h3 className="market-card-title">
            {item.properties.title}
          </h3>

          <span className="market-status-badge active">
            ACTIVE
          </span>
        </div>

        {/* BODY */}
        <div className="market-card-body">
          <p>
            <span>Token Name:</span>{" "}
            {item.properties.token_name}
          </p>

          <p>
            <span>Token Price:</span>{" "}
            ₹{item.price_per_token_inr}
          </p>

          <p>
            <span>Quantity:</span>{" "}
            {item.token_quantity}
          </p>
        </div>

        {/* FOOTER */}
        <div className="market-card-footer">
          <span className="market-card-date">
            Listed on{" "}
            {new Date(item.created_at).toLocaleDateString()}
          </span>

          <span className="market-card-arrow">→</span>
        </div>

      </div>
    </div>
  </div>
))}
        </div>
      )}
    </div>
  );
}