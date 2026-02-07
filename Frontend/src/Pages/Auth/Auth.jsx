import React, { useState } from "react";
import "../../Styles/Auth/Auth.css";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

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
    <div className="auth-container">
      <div className="background-image"></div>

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


      <div className="right-side">
        <div className="right-overlay">
          <form className="form-box" onSubmit={handleSubmit}>
            <h3>{isSignUp ? "Make your Step " : "Welcome Back"}</h3>

            {isSignUp && signUpStep === 1 && (
              <input
                type="text"
                name="Username"
                placeholder="Username"
                value={formData.Username}
                onChange={handleChange}
              />
            )}

            {(!isSignUp || signUpStep === 1) && (
              <input
                type="email"
                name="Email"
                placeholder="Email"
                value={formData.Email}
                onChange={handleChange}
              />
            )}

            {(!isSignUp || signUpStep === 1) && (
              <input
                type="password"
                name="Password"
                placeholder="Password"
                value={formData.Password}
                onChange={handleChange}
              />
            )}

            {isSignUp && signUpStep === 1 && (
              <div className="gender-group">
                <label>
                  <input
                    type="radio"
                    name="Gender"
                    value="male"
                    checked={formData.Gender === "male"}
                    onChange={handleChange}
                  />
                  Male
                </label>

                <label>
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

            {isSignUp && signUpStep === 2 && (
              <>
                <input
                  type="number"
                  name="age"
                  placeholder="Age"
                  value={formData.age}
                  onChange={handleChange}
                />

                <input
                  type="number"
                  name="annual_income"
                  placeholder="Annual Income (INR)"
                  value={formData.annual_income}
                  onChange={handleChange}
                />

                <input
                  type="number"
                  name="investment_amount"
                  placeholder="Investment Amount (INR)"
                  value={formData.investment_amount}
                  onChange={handleChange}
                />

                <input
                  type="number"
                  name="investment_duration"
                  placeholder="Investment Duration (Months)"
                  value={formData.investment_duration}
                  onChange={handleChange}
                />
              </>
            )}

            <button
              type="submit"
              className="Login-btn"
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