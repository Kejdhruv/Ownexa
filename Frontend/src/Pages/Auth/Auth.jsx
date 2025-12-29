import React, { useState } from "react";
import "../../Styles/Auth/Auth.css";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const API = import.meta.env.VITE_API_BASE;

const AuthPage = () => {
  const navigate = useNavigate();
  const [isSignUp, setIsSignUp] = useState(false);
  const [formData, setFormData] = useState({
    Username: "",
    Email: "",
    Password: "",
  });
  const [loading, setLoading] = useState(false);

  const toggleMode = () => {
    setIsSignUp((prev) => !prev);
    setFormData({
      Username: "",
      Email: "",
      Password: "",
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateForm = () => {
    if (!formData.Email || !formData.Password) {
      toast.error("Email and Password are required");
      return false;
    }

    if (isSignUp && !formData.Username) {
      toast.error("Username is required for signup");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setLoading(true);

      const endpoint = isSignUp ? "/auth/signup" : "/auth/login";

      const payload = isSignUp
        ? {
            Username: formData.Username,
            Email: formData.Email,
            Password: formData.Password,
          }
        : {
            Email: formData.Email,
            Password: formData.Password,
          };

      const res = await fetch(`${API}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Authentication failed");
      }

      toast.success(isSignUp ? "Signup successful!" : "Login successful!");
      setTimeout(() => navigate("/dashboard"), 1200);
    } catch (err) {
      toast.error(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="background-image"></div>

      {/* LEFT SIDE */}
      <div className="left-side">
        <div className="left-overlay">
          <div className="brand-block">
            <h1 className="brand-title">
              <span className="brand-own">Own</span>
              <span className="brand-exa">exa</span>
            </h1>

            <p className="brand-tagline">
              <span>Where ownership meets</span>
              <span>Intelligence</span>
            </p>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE */}
      <div className="right-side">
        <div className="right-overlay">
          <form className="form-box" onSubmit={handleSubmit}>
            <h3>{isSignUp ? "Make your Step " : "Welcome Back"}</h3>

            {isSignUp && (
              <input
                type="text"
                name="Username"
                placeholder="Username"
                value={formData.Username}
                onChange={handleChange}
              />
            )}

            <input
              type="email"
              name="Email"
              placeholder="Email"
              value={formData.Email}
              onChange={handleChange}
            />

            <input
              type="password"
              name="Password"
              placeholder="Password"
              value={formData.Password}
              onChange={handleChange}
            />

            <button
              type="submit"
              className="Login-btn"
              disabled={loading}
            >
              {loading
                ? isSignUp
                  ? "Creating account..."
                  : "Logging in..."
                : isSignUp
                ? "Create Account"
                : "Login"}
            </button>

            <button
              type="button"
              className="toggle-btn"
              onClick={toggleMode}
              disabled={loading}
            >
              {isSignUp
                ? "Already have an account? Login"
                : "Don't have an account? Sign up"}
            </button>
          </form>
        </div>
      </div>

      <ToastContainer
        position="top-right"
        autoClose={2000}
        hideProgressBar
        theme="colored"
      />
    </div>
  );
};

export default AuthPage;