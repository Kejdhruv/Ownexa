import { useEffect, useState } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useNavigate } from "react-router-dom";
import "../../Styles/Admin/AdminViewPage.css";
import SortBar from "../../Components/Dashboard/Filter";
const API = import.meta.env.VITE_API_BASE;

export default function AdminViewPage() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPending = async () => {
      try {
        const res = await fetch(
          `${API}/properties?status=pending&listed=false`,
          { credentials: "include" }
        );
        if (!res.ok) throw new Error("Failed to fetch properties");
        const data = await res.json();
        const sorted = data.sort(
          (a, b) => new Date(a.created_at) - new Date(b.created_at)
        );
        setProperties(sorted);
      } catch (err) {
        console.error(err.message);
        toast.error("Failed to fetch pending properties. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchPending();
  }, []);

  if (loading) {
    return <div className="admin-loading">Loading pending requests...</div>;
  }

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="admin-pending-page">
        <div className="admin-freeze-header"> <h2>Pending Property Requests</h2>
          <SortBar
            options={[
              { key: "created_at", label: "Date" },
            ]}
            data={properties}
            onChange={setProperties}
          />
        </div>

        {properties.length === 0 ? (
          <p className="empty-text">No pending requests</p>
        ) : (
          <div className="admin-card-grid">
            {properties.map((property) => (
              <div
                key={property.id}
                className="admin-property-card"
                onClick={() => navigate(`/AdminDashboard/Pending/Property/${property.id}`)}
              >
                <div className="card-header">
                  <h3 className="property-title">{property.title}</h3>
                  <span className="status-badge pending">PENDING</span>
                </div>

                <div className="card-body">
                  <p>
                    <span>Owner:</span> {property.owner_name}
                  </p>
                  <p>
                    <span>Location:</span> {property.city}, {property.state}
                  </p>
                </div>
                <div className="card-footer">
                  <span className="submitted-date">
                    Submitted:{" "}
                    {new Date(property.created_at).toLocaleDateString()}
                  </span>
                  <span className="review-arrow">→</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}