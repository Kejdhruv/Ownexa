import React, { useState } from 'react';
import "../../Styles/Auth/Auth.css"
import { useNavigate } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const API = import.meta.env.VITE_API_BASE; 

const AuthPage = () => {
  const navigate = useNavigate();
  const [isSignUp, setIsSignUp] = useState(false);
  const [formData, setFormData] = useState({
    Username: '',
    Email: '',
    Password: '',
  });

  const toggleMode = () => {
    setIsSignUp((prev) => !prev);
    setFormData({ firstName: '', lastName: '', email: '', password: '' });
  };

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const validateForm = () => {
    if (!formData.Email || !formData.Password) {
      toast.error('Email and Password are required!');
      return false;
    }
    if (isSignUp && (!formData.Username)) {
      toast.error('Please fill all sign up fields!');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
        const res = await fetch(
            isSignUp ? `${API}/auth/login`: `${API}/auth/signup` , 
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: isSignUp
            ? JSON.stringify(formData)
            : JSON.stringify({ email: formData.Email, password: formData.Password }),
          credentials: 'include' , 
        }
      );

      const data = await res.json();

      if (res.ok) {
        toast.success(isSignUp ? 'Sign up successful!' : 'Login successful!');
        setTimeout(() => navigate(`/Dashboard`), 1500);
      } else {
        toast.error(data.message || (isSignUp ? 'Sign up failed' : 'Invalid credentials'));
      }

    } catch (err) {
      toast.error('Something went wrong' , err );
    }
  };

  return (
    <div className="auth-container">
      <div className="background-image"></div>

      <div className="left-side">
        <div className="left-overlay">
          <h1>Ownexa</h1>
          <p>"Make your Investment work , While you rest"</p>
        </div>
      </div>

      <div className="right-side">
        <div className="right-overlay">
          <form className="form-box" onSubmit={handleSubmit}>
            <h2>{isSignUp ? 'Sign Up' : 'Login'}</h2>

            {isSignUp && (
              <>
                <input
                  type="text"
                  name="Username"
                  placeholder="Username"
                  value={formData.Username}
                  onChange={handleChange}
                />
              </>
            )}

            <input
              type="email"
              name="email"
              placeholder="Email"
              value={formData.Email}
              onChange={handleChange}
            />

            <input
              type="password"
              name="password"
              placeholder="Password"
              value={formData.Password}
              onChange={handleChange}
            />

            <button type="submit" className="Login-btn">
              {isSignUp ? 'Create Account' : 'Login'}
            </button>

            <button type="button" className="toggle-btn" onClick={toggleMode}>
              {isSignUp ? 'Already have an account? Login' : "Don't have an account? Sign up"}
            </button>
          </form>
        </div>
      </div>

      <ToastContainer position="top-right" autoClose={2000} hideProgressBar theme="colored" />
    </div>
  );
};

export default AuthPage;