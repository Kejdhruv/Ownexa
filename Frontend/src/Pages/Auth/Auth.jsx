import React, { useState } from "react";
import "../../Styles/Auth/Auth.css";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import loginimage from "../../assets/login.png"

const API = import.meta.env.VITE_API_BASE;
const MALE_AVATARS = JSON.parse(import.meta.env.VITE_MALE_AVATARS || "[]");
const FEMALE_AVATARS = JSON.parse(import.meta.env.VITE_FEMALE_AVATARS || "[]");
const AuthPage = () => {
  const navigate = useNavigate();
  const [isSignUp, setIsSignUp] = useState(false);
  const [signUpStep, setSignUpStep] = useState(1);
  const [formData, setFormData] = useState({
    Username: "",
    Email: "",
    Password: "",
    Gender: "",
    age: "",
    investment_amount: "",
    investment_duration: "",
    annual_income: ""
  });
  const [loading, setLoading] = useState(false);

  const toggleMode = () => {
    setIsSignUp((prev) => !prev);
    setSignUpStep(1);
    setFormData({
      Username: "",
      Email: "",
      Password: "",
      Gender: "",
      age: "",
      investment_amount: "",
      investment_duration: "",
      annual_income: ""
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

    if (isSignUp && signUpStep === 1) {
      if (!formData.Username) {
        toast.error("Username is required");
        return false;
      }

      if (!formData.Gender) {
        toast.error("Please select a gender");
        return false;
      }
    }

    if (isSignUp && signUpStep === 2) {
      if (!formData.age ||
        !formData.investment_amount ||
        !formData.investment_duration ||
        !formData.annual_income) {
        toast.error("Please fill all investment details");
        return false;
      }
    }

    return true;
  };

  const getRandomAvatar = (gender) => {
    const pool = gender === "male" ? MALE_AVATARS : FEMALE_AVATARS;
    return pool[Math.floor(Math.random() * pool.length)];
  };
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isSignUp && signUpStep === 1) {
      if (!validateForm()) return;
      setSignUpStep(2);
      return;
    }

    if (!validateForm()) return;

    try {
      setLoading(true);

      const endpoint = isSignUp ? "/auth/signup" : "/auth/login";

      const payload = isSignUp
        ? {
          Username: formData.Username,
          Email: formData.Email,
          Password: formData.Password,
          Avatar: getRandomAvatar(formData.Gender),
          age: Number(formData.age),
          investment_amount: Number(formData.investment_amount),
          investment_duration: Number(formData.investment_duration),
          annual_income: Number(formData.annual_income)
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
      setTimeout(() => navigate("/Dashboard"), 1200);
    } catch (err) {
      toast.error(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
   <>
  <div className="auth-page-wrapper">
    
    {/* LEFT SIDE: FORM */}
    <div className="auth-left-pane">
      <div className="auth-form-container">
        
        {/* Brand/Logo */}
        <div className="auth-brand-header">
          <div className="brand-icon-box">
            <span className="brand-icon-i">i</span>
          </div>
          <h1 className="brand-text-logo">Ownexa.</h1>
        </div>

        {/* Headings */}
        <div className="auth-headings">
          <h2>{isSignUp ? "Make your Step" : "Welcome Back"}</h2>
          <p>{isSignUp ? "Let's get you set up with Ownexa" : "Let's login to grab amazing deal"}</p>
        </div>

        {/* Social Logins (Visual matching the design) */}
        <div className="auth-social-group">
          <button type="button" className="social-btn">
            <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" />
            Continue with Google
          </button>
         <button type="button" className="social-btn">
    <img src="https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg" alt="Apple" />
    Continue with Apple
  </button>
        </div>

        <div className="auth-divider">
          <span>Or</span>
        </div>

        {/* The Form */}
        <form className="auth-main-form" onSubmit={handleSubmit}>
          
          {/* STEP 1: SIGN UP & LOGIN FIELDS */}
          {isSignUp && signUpStep === 1 && (
            <div className="input-group">
              <label>Username</label>
              <input
                type="text"
                name="Username"
                placeholder="Enter username"
                value={formData.Username}
                onChange={handleChange}
              />
            </div>
          )}

          {(!isSignUp || signUpStep === 1) && (
            <div className="input-group">
              <label>Email</label>
              <input
                type="email"
                name="Email"
                placeholder="rownok@gmail.com"
                value={formData.Email}
                onChange={handleChange}
              />
            </div>
          )}

          {(!isSignUp || signUpStep === 1) && (
            <div className="input-group">
              <label>Password</label>
              <div className="password-input-wrapper">
                <input
                  type="password"
                  name="Password"
                  placeholder="••••••••••••"
                  value={formData.Password}
                  onChange={handleChange}
                />
                <span className="eye-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                </span>
              </div>
            </div>
          )}

          {/* GENDER */}
          {isSignUp && signUpStep === 1 && (
            <div className="gender-group-light">
              <label className={formData.Gender === "male" ? "selected" : ""}>
                <input
                  type="radio"
                  name="Gender"
                  value="male"
                  checked={formData.Gender === "male"}
                  onChange={handleChange}
                />
                Male
              </label>

              <label className={formData.Gender === "female" ? "selected" : ""}>
                <input
                  type="radio"
                  name="Gender"
                  value="female"
                  checked={formData.Gender === "female"}
                  onChange={handleChange}
                />
                Female
              </label>
            </div>
          )}

          {/* STEP 2: INVESTOR INFO */}
          {isSignUp && signUpStep === 2 && (
            <>
              <div className="input-group">
                <label>Age</label>
                <input
                  type="number"
                  name="age"
                  placeholder="e.g. 30"
                  value={formData.age}
                  onChange={handleChange}
                />
              </div>

              <div className="input-group">
                <label>Annual Income (INR)</label>
                <input
                  type="number"
                  name="annual_income"
                  placeholder="e.g. 1200000"
                  value={formData.annual_income}
                  onChange={handleChange}
                />
              </div>

              <div className="input-group">
                <label>Investment Amount (INR)</label>
                <input
                  type="number"
                  name="investment_amount"
                  placeholder="e.g. 50000"
                  value={formData.investment_amount}
                  onChange={handleChange}
                />
              </div>

              <div className="input-group">
                <label>Investment Duration (Months)</label>
                <input
                  type="number"
                  name="investment_duration"
                  placeholder="e.g. 12"
                  value={formData.investment_duration}
                  onChange={handleChange}
                />
              </div>
            </>
          )}

          {/* Remember Me & Forgot Password (Visual elements for Login matching the design) */}
          {!isSignUp && (
            <div className="auth-form-extras">
              <label className="remember-me">
                <input type="checkbox" /> Remember me
              </label>
              <a href="#forgot" className="forgot-password">Forgot Password?</a>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            className="auth-submit-btn"
            disabled={loading}
          >
            {loading
              ? "Processing..."
              : isSignUp && signUpStep === 1
                ? "Next"
                : isSignUp && signUpStep === 2
                  ? "Create Account"
                  : "Login"}
          </button>

          {/* Toggle Button */}
          <div className="auth-toggle-wrapper">
            <span className="toggle-text">
              {isSignUp ? "Already have an account?" : "Don't have an account?"}
            </span>
            <button
              type="button"
              className="auth-toggle-btn"
              onClick={toggleMode}
              disabled={loading}
            >
              {isSignUp ? "Login" : "Sign Up"}
            </button>
          </div>

        </form>
      </div>
    </div>

    {/* RIGHT SIDE: IMAGE */}
    <div className="auth-right-pane">
      <div className="auth-image-wrapper">
        <img src={loginimage} alt="Ownexa Cityscape" className="auth-hero-img" />
        <div className="auth-image-overlay-text">
          <h2>Invest in tokenized real estate and own fractions of premium assets powered by blockchain.</h2>
        </div>
      </div>
    </div>

    <ToastContainer
      position="top-right"
      autoClose={2000}
      hideProgressBar
      theme="colored"
    />
  </div>
</>
  );
};

export default AuthPage;