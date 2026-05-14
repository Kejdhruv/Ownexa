import { NavLink, useNavigate } from "react-router-dom";
import "../../Styles/Components/Navbar.css";
import { User } from "lucide-react";
import useAuth from "../../hooks/useAuth";

const Navbar = () => {
  const navigate = useNavigate();
  const { isAuthenticated, loading } = useAuth();

  return (
    <nav className="market-navbar">
      <div className="market-navbar-inner">

        {/* LEFT */}
        <div className="nav-logo" onClick={() => navigate("/")}>
          OWNEXA
        </div>

        {/* CENTER */}
        {isAuthenticated && (
          <div className="nav-links">
            <NavLink
              to="/PrimaryMarket"
              className={({ isActive }) =>
                `nav-item ${isActive ? "active" : ""}`
              }
            >
              Primary
            </NavLink>

            <NavLink
              to="/SecondaryMarket"
              className={({ isActive }) =>
                `nav-item ${isActive ? "active" : ""}`
              }
            >
              Secondary
            </NavLink>

            <NavLink
              to="/Explore"
              className={({ isActive }) =>
                `nav-item ${isActive ? "active" : ""}`
              }
            >
              Explore
            </NavLink>
          </div>
        )}

        {/* RIGHT */}
        <div className="nav-right">
          {!loading && (
            <>
              {isAuthenticated ? (
                <button
                  className="wallet-btn"
                  onClick={() => navigate("/Dashboard")}
                  aria-label="Go to dashboard"
                >
                  <User size={16} />
                </button>
              ) : (
                <button
                  className="login-btn"
                  onClick={() => navigate("/Auth")}
                  aria-label="Login or Sign up"
                >
                  Login / Signup
                </button>
              )}
            </>
          )}
        </div>

      </div>
    </nav>
  );
};

export default Navbar;