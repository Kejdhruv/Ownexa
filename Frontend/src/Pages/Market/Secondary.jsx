import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../Styles/Market/Primary.css"

const API = import.meta.env.VITE_API_BASE;

export default function PrimaryMarket() {
  const [properties, setProperties] = useState([]);
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
        setProperties(sorted);
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

      {properties.length === 0 ? (
        <p className="empty-text">No Listings Available at the moment </p>
      ) : (
        <div className="admin-card-grid">
          {properties.map((property) => (
         <div
  key={property.id}
  className="admin-property-card"
  onClick={() => navigate(`/Property/${property.id}`)}
>
  <div className="card-horizontal">

    {/* LEFT IMAGE */}
    <div className="card-image-left">
      <img
        src={property.property_images?.[0] || "/placeholder-property.jpg"}
        alt={property.title}
      />
    </div>

    {/* RIGHT CONTENT (your existing design) */}
    <div className="card-content-right">

      {/* HEADER */}
      <div className="card-header">
        <h3 className="property-title">{property.title}</h3>
        <span className="status-badge validated">Validated</span>
      </div>

      {/* BODY */}
      <div className="card-body">
        <p>
          <span>Token Name :</span> {property.token_name}
        </p>
        <p>
          <span>Token Price :</span> ₹{property.price_per_token_inr}
        </p>
      </div>

      {/* FOOTER */}
      <div className="card-footer">
        <span className="submitted-date">
          Validated:{" "}
          {new Date(property.validated_at).toLocaleDateString()}
        </span>
        <span className="review-arrow">→</span>
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