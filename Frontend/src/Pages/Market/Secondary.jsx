import { useEffect, useState, useMemo } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useNavigate } from "react-router-dom";
import { Building, Gem, Wallet, ArrowRight, SlidersHorizontal, ArrowDownUp, Clock, MapPin } from "lucide-react";
import "../../Styles/Market/Secondary.css";
import Navbar from "../../Components/Market/Navbar";
import OwnexaFooter from "../../Components/Market/footer";

const API = import.meta.env.VITE_API_BASE;

export default function SecondaryMarket() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // --- Filter & Sort States ---
  const [activeFilter, setActiveFilter] = useState("All");
  const [sortBy, setSortBy] = useState("newest");

  useEffect(() => {
    const fetchListings = async () => {
      try {
        const res = await fetch(`${API}/propertylisting?status=ACTIVE`, {
          credentials: "include",
        });

        if (!res.ok) throw new Error("Failed to fetch listings");

        const data = await res.json();
        setListings(data);
      } catch (err) {
        console.error(err.message);
        toast.error("Failed to fetch secondary listings. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchListings();
  }, []);

  // --- Dynamic Filters & Sorting Logic ---
  const filteredAndSortedListings = useMemo(() => {
    let result = [...listings];

    // 1. Filter by Property Type (Assumes item.properties.property_type exists)
    if (activeFilter !== "All") {
      result = result.filter(
        (item) => item.properties?.property_type === activeFilter
      );
    }

    // 2. Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case "price_asc":
          return a.price_per_token_inr - b.price_per_token_inr;
        case "price_desc":
          return b.price_per_token_inr - a.price_per_token_inr;
        case "qty_desc":
          return b.token_quantity - a.token_quantity;
        case "newest":
        default:
          return new Date(b.created_at) - new Date(a.created_at);
      }
    });

    return result;
  }, [listings, activeFilter, sortBy]);

  // Extract unique property types for the sidebar dynamically
  const propertyTypes = useMemo(() => {
    const types = new Set(
      listings.map((item) => item.properties?.property_type).filter(Boolean)
    );
    return ["All", ...Array.from(types)];
  }, [listings]);

  return (
    <>
      
      <ToastContainer position="top-right" autoClose={3000} />
      <section className="sec-page">
        <div className="header-nav"> <Navbar/></div>
        
        {/* LOADER */}
        {loading && (
          <div className="sec-loaderOverlay">
            <div className="sec-loaderCard">
              <div className="sec-iconRow">
                <Building size={20} />
                <ArrowRight size={16} className="sec-arrow" />
                <Wallet size={20} />
              </div>
              <div className="sec-loaderText">Fetching Secondary Market...</div>
            </div>
          </div>
        )}

        <div className="sec-layout">
          
          
          {/* LEFT SIDEBAR: FILTERS & SORT */}
          <aside className="sec-sidebar">
            <div className="sec-sidebar-block">
              <div className="sec-sidebar-header">
                <SlidersHorizontal size={16} />
                <h3>Property Type</h3>
              </div>
              <ul className="sec-filter-list">
                {propertyTypes.map((type) => {
                  // Count items per type
                  const count =
                    type === "All"
                      ? listings.length
                      : listings.filter(
                          (item) => item.properties?.property_type === type
                        ).length;

                  return (
                    <li key={type}>
                      <button
                        className={`sec-filter-btn ${activeFilter === type ? "active" : ""}`}
                        onClick={() => setActiveFilter(type)}
                      >
                        <span className="sec-filter-name">{type}</span>
                        <span className="sec-filter-count">{count}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
            

            <div className="sec-sidebar-block">
              <div className="sec-sidebar-header">
                <ArrowDownUp size={16} />
                <h3>Sort By</h3>
              </div>
              <div className="sec-sort-wrapper">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="sec-sort-select"
                >
                  <option value="newest">Newest Listed</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                  <option value="qty_desc">Quantity: High to Low</option>
                </select>
                  
              </div>
            </div>
          </aside>

          {/* RIGHT MAIN: LISTINGS GRID */}
          <main className="sec-main-content">
            
          

            {!loading && filteredAndSortedListings.length === 0 ? (
              <div className="sec-empty">
                <div className="sec-empty-icon">📂</div>
                <p>No properties match your filters.</p>
                <button className="sec-clear-btn" onClick={() => setActiveFilter("All")}>
                  Clear Filters
                </button>
              </div>
            ) : (
              <div className="sec-grid">
                {filteredAndSortedListings.map((item) => (
                  <article
                    key={item.id}
                    className="sec-card"
                    onClick={() => navigate(`/Property/${item.properties.id}`)}
                  >
                    <div className="sec-card-image">
                      <span className="sec-badge">SECONDARY</span>
                      <img
                        src={
                          item.properties.property_images?.[0] ||
                          "/placeholder-property.jpg"
                        }
                        alt={item.properties.title}
                      />
                    </div>

                    <div className="sec-card-body">
                      <div className="sec-title-row">
                        <h4 className="sec-title">{item.properties.title}</h4>
                      </div>
                      
                      <div className="sec-location">
                        <MapPin size={12} />
                        {item.properties.city || "Location details unavailable"}
                      </div>

                      <div className="sec-stats-box">
                        <div className="sec-stat">
                          <span className="sec-stat-label">Per Token</span>
                          <span className="sec-stat-value">
                            ₹{item.price_per_token_inr.toLocaleString()}
                          </span>
                        </div>
                        <div className="sec-stat divider"></div>
                        <div className="sec-stat">
                          <span className="sec-stat-label">Available Qty</span>
                          <span className="sec-stat-value">{item.token_quantity}</span>
                        </div>
                      </div>

                      <div className="sec-card-footer">
                        <div className="sec-date">
                          <Clock size={12} />
                          {new Date(item.created_at).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                            year: "numeric"
                          })}
                        </div>
                        <button className="sec-view-btn">Trade</button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </main>

        </div>
       
      </section>
       <OwnexaFooter/>
    </>
  );
}