import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../Styles/Market/Primary.css";
import {
  MapPin
} from "lucide-react";
const API = import.meta.env.VITE_API_BASE;

export default function PrimaryMarket() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchValidated = async () => {
      try {
        const res = await fetch(
          `${API}/properties?status=Validated&listed=true`,
          { credentials: "include" }
        );
        if (!res.ok) throw new Error("Failed to fetch properties");
        const data = await res.json();
        setProperties(data);
      } catch (err) {
        console.error(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchValidated();
  }, []);

  if (loading) {
    return <div className="primary-loading">Loading Primary Market…</div>;
  }

  return (
    <div className="primary-page">
      {properties.length === 0 ? (
        <p className="primary-empty">No validated properties available</p>
      ) : (
        <div className="property-grid">
          {properties.map((property) => (
            <div
              key={property.id}
              className="property-asset-card"
              onClick={() => navigate(`/Property/${property.id}`)}
            >
              {/* IMAGE WINDOW */}
              <div className="asset-image-frame">
                <img
                  src={property.property_images?.[0] || "/placeholder-property.jpg"}
                  alt={property.title}
                />
              </div>

              {/* INFO */}
              <div className="asset-info">
                <h3 className="asset-title">{property.title}</h3>
                <p className="asset-location">
                  <span><MapPin size={16} /> </span>
                  {property.city}, {property.state}
                </p>

                <div className="asset-metrics">
                  <div>
                    <span className="metric-value">
                      ₹{property.price_per_token_inr}
                    </span>
                    <span className="metric-label">per token</span>
                  </div>

                  <div>
                    <span className="metric-value">
                      {property.token_quantity}
                    </span>
                    <span className="metric-label">tokens</span>
                  </div>
                </div>

                <div className="asset-cta">
                  View Property →
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}