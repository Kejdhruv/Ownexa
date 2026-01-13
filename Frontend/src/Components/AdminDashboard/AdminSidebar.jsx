import { NavLink, useNavigate } from "react-router-dom";
import { User,  Building2, FileText, PowerOff, Home } from "lucide-react";

import "../../Styles/Components/Sidebar.css";

const API = import.meta.env.VITE_API_BASE;

export default function AdminSidebar() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await fetch(`${API}/auth/logout`, {
        method: "GET",
        credentials: "include",
      });
    } catch (err) {
      console.error("Logout failed", err);
    } finally {
      navigate("/");
    }
  };

  return (
    <aside className="sidebar">
      <NavLink to="/Dashboard" end>
        {({ isActive }) => (
          <button className={isActive ? "active" : ""} aria-label="Profile">
            <User size={16} />
          </button>
        )}
      </NavLink>

      <NavLink to="/AdminDashboard/Pending">
        {({ isActive }) => (
          <button className={isActive ? "active" : ""} aria-label="Properties">
            <Building2 size={16} />
          </button>
        )}
      </NavLink>

      <NavLink to="/AdminDashboard/Documents">
        {({ isActive }) => (
          <button className={isActive ? "active" : ""} aria-label="Transactions">
            <FileText size={16} />
          </button>
        )}
      </NavLink>

      <NavLink to="/">
        {({ isActive }) => (
          <button className={isActive ? "active" : ""} aria-label="Transactions" style={{ color: "#1673c4ff" }}
           onMouseEnter={(e) => {
          e.currentTarget.style.background = "rgba(28, 119, 223, 0.25)";  
        }}  onMouseLeave={(e) => {
          e.currentTarget.style.background = "transparent";
        }}>
            <Home size={16} />
          </button>
        )}
      </NavLink>

      {/* LOGOUT */}
      <button
        className="logout-btn"
        aria-label="Logout"
        style={{ color: "#f87171" }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "rgba(220, 38, 38, 0.25)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "transparent";
        }}
        onClick={handleLogout}
      >
        <PowerOff size={16} />
      </button>
    </aside>
  );
}