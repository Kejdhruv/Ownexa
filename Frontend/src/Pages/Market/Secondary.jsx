import { useEffect, useState } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useNavigate } from "react-router-dom";
import "../../Styles/Market/Secondary.css";

import { Building, Gem, Wallet, ArrowRight } from "lucide-react";

const API = import.meta.env.VITE_API_BASE;

export default function SecondaryMarket() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchListings = async () => {
      try {
        const res = await fetch(`${API}/propertylisting?status=ACTIVE`, {
          credentials: "include",
        });

        if (!res.ok) throw new Error("Failed to fetch listings");

        const data = await res.json();
        const sorted = data.sort(
          (a, b) => new Date(b.validated_at) - new Date(a.validated_at)
        );

        setListings(sorted);
      } catch (err) {
        console.error(err.message);
        toast.error("Failed to fetch secondary listings. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchListings();
  }, []);

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} />
      <section className="sm-page">
        {/* SAME LOADER */}
        {loading && (
          <div className="pm-loaderOverlay">
            <div className="pm-loaderCard">
              <div className="pm-iconRow">
                <Building size={18} />
                <ArrowRight size={18} className="pm-arrow" />
                <Gem size={18} />
                <ArrowRight size={18} className="pm-arrow" />
                <Wallet size={18} />
              </div>
              <div className="pm-loaderText">Fetching market…</div>
            </div>
          </div>
        )}

        {!loading && listings.length === 0 ? (
          <div className="sm-empty">No active secondary listings</div>
        ) : (
          <div className={`sm-grid ${loading ? "pm-blurWhileLoading" : ""}`}>
            {listings.map((item) => (
              <article
                key={item.id}
                className="sm-card"
                onClick={() => navigate(`/Property/${item.properties.id}`)}
              >
                <div className="sm-thumb">
                  <img
                    src={item.properties.property_images?.[0] || "/placeholder-property.jpg"}
                    alt={item.properties.title}
                  />
                </div>

                <div className="sm-info">
                  <div className="sm-header">
                    <h4 className="sm-title">{item.properties.title}</h4>
                    <span className="sm-badge sm-active">ACTIVE</span>
                  </div>

                  <div className="sm-meta">
                    <div className="sm-row">
                      <span>Token</span>
                      <strong>{item.properties.token_name}</strong>
                    </div>

                    <div className="sm-row highlight">
                      <span>Price</span>
                      <strong>₹{item.price_per_token_inr}</strong>
                    </div>

                    <div className="sm-row">
                      <span>Qty</span>
                      <strong>{item.token_quantity}</strong>
                    </div>
                  </div>

                  <div className="sm-footer">
                    <span className="sm-date">
                      {new Date(item.created_at).toLocaleDateString()}
                    </span>
                    <span className="sm-cta">View →</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </>
  );
}