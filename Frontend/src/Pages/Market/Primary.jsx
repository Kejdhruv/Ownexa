
import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import "../../Styles/Market/Primary.css";
import { MapPin, Building, Gem, Wallet, ArrowRight } from "lucide-react";
import Navbar from "../../Components/Market/Navbar";
import OwnexaFooter from "../../Components/Market/footer";
 
const API = import.meta.env.VITE_API_BASE;
 
const SORT_OPTIONS = [
  { value: "default",     label: "Sort: Default" },
  { value: "price_asc",   label: "Price: Low → High" },
  { value: "price_desc",  label: "Price: High → Low" },
  { value: "tokens_asc",  label: "Tokens: Fewest" },
  { value: "tokens_desc", label: "Tokens: Most" },
];
 
const FILTER_TAGS = ["All", "Residential", "Commercial", "Mixed-Use", "Land"];
 
export default function PrimaryMarket() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [activeFilter, setFilter]   = useState("All");
  const [sortBy, setSortBy]         = useState("default");
  const navigate = useNavigate();
 
  useEffect(() => {
    const fetchValidated = async () => {
      try {
        const res = await fetch(`${API}/properties?status=Validated&listed=true`, {
          credentials: "include",
        });
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
 
  /* ── client-side filter + sort ── */
  const displayed = useMemo(() => {
    let list = [...properties];
 
    if (activeFilter !== "All") {
      list = list.filter(
        (p) => p.property_type?.toLowerCase() === activeFilter.toLowerCase()
      );
    }
 
    switch (sortBy) {
      case "price_asc":   list.sort((a, b) => a.price_per_token_inr - b.price_per_token_inr); break;
      case "price_desc":  list.sort((a, b) => b.price_per_token_inr - a.price_per_token_inr); break;
      case "tokens_asc":  list.sort((a, b) => a.token_quantity - b.token_quantity); break;
      case "tokens_desc": list.sort((a, b) => b.token_quantity - a.token_quantity); break;
      default: break;
    }
 
    return list;
  }, [properties, activeFilter, sortBy]);
 


 
  /* ── count per filter tag ── */
  const countFor = (tag) =>
    tag === "All"
      ? properties.length
      : properties.filter(
          (p) => p.property_type?.toLowerCase() === tag.toLowerCase()
        ).length;
 
  return (
    <>

      <div className="primary-page">
        <div className="header-nav"> <Navbar/></div>
     
      <div className="pm-inner">
 
        {/* ── Header ─────────────────────────────────────── */}
       
        {/* ── Body ───────────────────────────────────────── */}
        <div className="pm-body">
 
          {/* Sidebar */}
          <aside className="pm-sidebar">
            <div className="pm-sidebar-block">
              <span className="pm-sidebar-title">Property Type</span>
              <div className="pm-filter-group">
                {FILTER_TAGS.map((tag) => (
                  <button
                    key={tag}
                    className={`pm-filter-btn${activeFilter === tag ? " active" : ""}`}
                    onClick={() => setFilter(tag)}
                  >
                    {tag}
                    <span className="pm-filter-count">{countFor(tag)}</span>
                  </button>
                ))}
              </div>
            </div>
 
            <div className="pm-sidebar-block">
              <span className="pm-sidebar-title">Sort By</span>
              <select
                className="pm-sort-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
 
            {!loading && (
              <div className="pm-result-label">
                {displayed.length} result{displayed.length !== 1 ? "s" : ""}
              </div>
            )}
          </aside>
 
          {/* Main */}
          <main className="pm-main">
 
            {/* Loader */}
            {loading && (
              <div className="pm-loaderOverlay">
                <div className="pm-loaderCard">
                  <div className="pm-iconRow">
                    <Building size={18} />
                    <ArrowRight size={16} className="pm-arrow" />
                    <Gem size={18} />
                    <ArrowRight size={16} className="pm-arrow" />
                    <Wallet size={18} />
                  </div>
                  <div className="pm-loaderText">Fetching market…</div>
                </div>
              </div>
            )}
 
            {/* Empty */}
            {!loading && displayed.length === 0 && (
              <p className="primary-empty">No properties match your filters.</p>
            )}
 
            {/* Grid */}
            <div className={`property-grid${loading ? " pm-blurWhileLoading" : ""}`}>
              {displayed.map((property) => (
                <div
                  key={property.id}
                  className="property-asset-card"
                  onClick={() => navigate(`/Property/${property.id}`)}
                >
                  {/* Image */}
                  <div className="asset-image-frame">
                    <img
                      src={property.property_images?.[0] || "/placeholder-property.jpg"}
                      alt={property.title}
                    />
                    <span className="asset-badge">Tokenized</span>
                    {property.expected_yield && (
                      <span className="asset-yield-badge">
                        {property.expected_yield}% Yield
                      </span>
                    )}
                  </div>
 
                  {/* Body */}
                  <div className="asset-info">
                    <h3 className="asset-title1">{property.title}</h3>
                    <p className="asset-location">
                      <MapPin size={12} />
                      {property.city}, {property.state}
                    </p>
 
                    <div className="asset-metrics">
                      <div>
                        <span className="metric-label">Per Token</span>
                        <span className="metric-value">
                          ₹{Number(property.price_per_token_inr).toLocaleString("en-IN")}
                        </span>
                      </div>
                      <div className="metric-divider" />
                      <div>
                        <span className="metric-label">Tokens</span>
                        <span className="metric-value">
                          {Number(property.token_quantity).toLocaleString("en-IN")}
                        </span>
                      </div>
                    </div>
 
                    <div className="asset-cta-row">
                      <div className="asset-cta">
                        View Property <ArrowRight size={11} />
                      </div>
                      {property.tokens_remaining ? (
                        <span className="asset-tokens-left">
                          {property.tokens_remaining} left
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </main>
        </div>
 
        </div>
         <OwnexaFooter/>
      </div>
   </>
  );
}