import { useEffect, useState } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "../../Styles/Admin/Review.css";
import SortBar from "../../Components/Dashboard/Filter";
const API = import.meta.env.VITE_API_BASE;

export default function Review() {
  const [loading, setLoading] = useState(true);
  const [properties, setProperties] = useState([]);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [notes, setNotes] = useState({}); // propertyId -> textarea text

  useEffect(() => {
    const fetchWarned = async () => {
      try {
        const res = await fetch(`${API}/warnedproperties`, {
          credentials: "include",
        });
        if (!res.ok) throw new Error("Failed to fetch properties");
        const data = await res.json();
        setProperties(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error(err);
        setProperties([]);
      } finally {
        setLoading(false);
      }
    };

    fetchWarned();
  }, []);

  const handleNoteChange = (propertyId, value) => {
    setNotes((prev) => ({ ...prev, [propertyId]: value }));
  };

  const handleWarn = async (propertyId) => {
    const adminreview = (notes[propertyId] || "").trim();
    if (!adminreview) {
      toast.error("Write a message first.");
      return;
    }

    try {
      setActionLoadingId(propertyId);

      const res = await fetch(`${API}/property/warn`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ propertyId, adminreview }),
      });

      if (!res.ok) {
        const t = await res.text().catch(() => "");
        throw new Error(t || "Warn failed");
      }

      const updated = await res.json();
      setProperties((prev) => prev.map((p) => (p.id === propertyId ? updated : p)));
      setNotes((prev) => ({ ...prev, [propertyId]: "" }));
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Warn failed");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleFreeze = async (propertyId) => {
    const adminreview = (notes[propertyId] || "").trim();
    if (!adminreview) {
      toast.error("Write a reason first.");
      return;
    }

    try {
      setActionLoadingId(propertyId);

      const res = await fetch(`${API}/property/freeze`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ propertyId, adminreview }),
      });

      if (!res.ok) {
        const t = await res.text().catch(() => "");
        throw new Error(t || "Freeze failed");
      }

      await res.json();

      setProperties((prev) => prev.filter((p) => p.id !== propertyId));
      setNotes((prev) => {
        const copy = { ...prev };
        delete copy[propertyId];
        return copy;
      });
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Freeze failed");
    } finally {
      setActionLoadingId(null);
    }
  };

  const daysAgo = (iso) => {
    if (!iso) return null;
    const ms = Date.now() - new Date(iso).getTime();
    return Math.floor(ms / (1000 * 60 * 60 * 24));
  };

  if (loading) {
    return <div className="admin-loading">Loading…</div>;
  }

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} />
    <div className="admin-freeze-page">
      <div className="admin-freeze-header">
        <h2 className="admin-freeze-title">Verify Properties</h2>

        <SortBar
          options={[
            { key: "last_doc_uploaded_at", label: "Date" },
          ]}
          data={properties}
          onChange={setProperties}
        />
      </div>

      {properties.length === 0 ? (
        <p className="admin-empty-text">No properties need action</p>
      ) : (
        <div className="admin-freeze-grid">
          {properties.map((p) => {
            const d = daysAgo(p.last_doc_uploaded_at);

            return (
              <div key={p.id} className="admin-freeze-card">
                {/* TOP INFO */}
                <div className="admin-freeze-card-top">
                  <div className="admin-freeze-card-titleRow">
                    <h3 className="admin-property-name">{p.title}</h3>
                  </div>

                  <div className="admin-freeze-card-sub">
                    <span className="admin-muted">Owner:</span> {p.owner_name || "—"}
                    <span className="admin-dot">•</span>
                    {p.city}, {p.state}
                    {p.token_name ? (
                      <>
                        <span className="admin-dot">•</span>
                        <span className="admin-token-pill">{p.token_name}</span>
                      </>
                    ) : null}
                  </div>

                  <div className="admin-freeze-card-meta">
                    <div className="admin-meta-block">
                      <span className="admin-meta-label">Last doc uploaded</span>
                      <span className="admin-meta-value">
                        {p.last_doc_uploaded_at
                          ? new Date(p.last_doc_uploaded_at).toLocaleString()
                          : "No record"}
                      </span>
                    </div>

                    <div className="admin-meta-block">
                      <span className="admin-meta-label">Days since upload</span>
                      <span className="admin-meta-value">{d === null ? "—" : `${d} days`}</span>
                    </div>
                  </div>
                </div>

                {/* DIVIDER */}
                <div className="admin-freeze-divider" />

                {/* ADMIN ACTIONS */}
                <div className="admin-freeze-card-bottom">
                  <textarea
                    className="admin-note"
                    placeholder="Write warning / admin note…"
                    value={notes[p.id] || ""}
                    onChange={(e) => handleNoteChange(p.id, e.target.value)}
                    disabled={actionLoadingId === p.id}
                  />

                  <div className="admin-freeze-btnRow">
                    <button
                      className="admin-btn admin-warn"
                      onClick={() => handleWarn(p.id)}
                      disabled={actionLoadingId === p.id}
                    >
                      {actionLoadingId === p.id ? "..." : "Warn"}
                    </button>

                    <button
                      className="admin-btn admin-freeze"
                      onClick={() => handleFreeze(p.id)}
                      disabled={actionLoadingId === p.id}
                    >
                      {actionLoadingId === p.id ? "..." : "Freeze"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
    </>
  );
}