import express from "express";
import cookieParser from "cookie-parser";
import CreateUser from "../../Database/Users/CreateUser.js";
import LoginUser from "../../Database/Users/LoginUser.js";
import supabase from "../../Database/SupabaseClient.js";
import { FindUser } from "../../Database/Users/FindUser.js";
import { getAuthUser } from "../../Middleware/Middleware.js";

const router = express.Router();
router.use(cookieParser());

/* User SignUp - Does NOT set cookies or log in */
router.post("/auth/signup", async (req, res) => {
  try {
    const {
      Email,
      Password,
      Username,
      Avatar,
      age,
      investment_amount,
      investment_duration,
      annual_income
    } = req.body;

    if (!Email || !Password || !Username || !Avatar) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // ------------------------
    // 1. Create User
    // ------------------------
    console.log(annual_income);
    const user = await CreateUser({
      Email,
      Password,
      Username,
      Avatar,
      Role: "User",
      Age: age,
      income: annual_income,
      InvestmentAmount: investment_amount,
      Duration: investment_duration
    });

    // ------------------------
    // 2. Call ML API
    // ------------------------

    try {
      await fetch("http://127.0.0.1:8000/recommend", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: String(user.id),

          age: Number(user.age || 0),

          income: Number(user.annual_income || 0),

          investment_amount: Number(user.investment_amount || 0),

          investment_duration: Number(user.investment_duration || 0),
        }),
      });
    } catch (mlErr) {
      console.error("ML API Error:", mlErr.message);
      // Don't block signup if ML fails
    }

    // ------------------------
    // 3. Response
    // ------------------------

    return res.status(201).json({
      message: "User created successfully. Please log in.",
      user,
    });

  } catch (err) {
    console.error("Signup error:", err.message);

    return res.status(400).json({
      error: err.message,
    });
  }
});

/* User Login - Sets Supabase access token cookie */
router.post("/auth/login", async (req, res) => {
  try {
    const { Email, Password } = req.body;
    if (!Email || !Password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const { session } = await LoginUser({ Email, Password });

    // Set access token cookie (Supabase manages the session)
    res.cookie("sb-access-token", session.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/"
    });

    return res.status(200).json({
      message: "Login successful"
    });
  } catch (err) {
    console.error("Login error:", err.message);
    return res.status(401).json({
      error: "Invalid email or password"
    });
  }
});

/* User Logout - Stateless, only clears cookie */
router.get("/auth/logout", async (req, res) => {
  // Clear access token cookie
  res.clearCookie("sb-access-token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/"
  });

  return res.status(200).json({
    message: "Logout successful"
  });
});

/* /auth/me - SINGLE SOURCE OF TRUTH for authentication state */
/* Reads access token from cookie, verifies with Supabase, returns user data */
router.get("/auth/me", async (req, res) => {
  try {
    const authUser = await getAuthUser(req);
    const user = await FindUser(authUser.id);
    return res.status(200).json({
      loggedIn: true,
      user
    });
  } catch (err) {
    console.error("Auth check error:", err.message);
    if (err.message === "Unauthorized" || err.message === "Invalid token") {
      return res.status(401).json({
        loggedIn: false,
        error: "Unauthorized"
      });
    }

    return res.status(500).json({
      loggedIn: false,
      error: "Something went wrong"
    });
  }
});

export default router;