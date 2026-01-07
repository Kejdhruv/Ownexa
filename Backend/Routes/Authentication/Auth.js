import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";

import CreateUser from "../../Database/Users/CreateUser.js";
import LoginUser from "../../Database/Users/LoginUser.js";
import supabase from "../../Database/SupabaseClient.js";
import FindUser from "../../Database/Users/FindUser.js";


dotenv.config();
const router = express.Router();
router.use(cookieParser());


router.post("/auth/signup", async (req, res) => {
  try {
    const { Email, Password, Username , Avatar} = req.body;
    if (!Email || !Password || !Username || !Avatar) {
      return res.status(400).json({ message: "All fields are required" });
    }
    const newUser = {
      Email,
      Password,
      Username,
      Avatar, 
      Role: "User"
    };
    const user = await CreateUser(newUser); 
    return res.status(201).json({
      message: "User created successfully",
      user
    });
  } catch (err) {
    console.error("Signup error:", err.message);
    return res.status(400).json({
      error: err.message
    });
  }
});


router.post("/auth/login", async (req, res) => {
  try {
    const { Email, Password } = req.body;

    if (!Email || !Password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const { user, session } = await LoginUser({ Email, Password });

    res.cookie("Ownexa_Token", session.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 1000, // 1 hour
      path: "/"
    });

    return res.status(200).json({
      message: "Login successful",
      user: {
        id: user.id,
        email: user.email
      }
    });

  } catch (err) {
    console.error("Login error:", err.message);
    return res.status(401).json({
      error: "Invalid email or password"
    });
  }
});

router.get("/auth/logout", async (req, res) => {
  try {
    const token = req.cookies?.sb_token;
    if (token) {
      await supabase.auth.signOut({
        accessToken: token
      });
    }
    res.clearCookie("Ownexa_Token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/"
    });

    return res.status(200).json({
      message: "Logout successful"
    });

  } catch (err) {
    console.error("Logout error:", err.message);
    return res.status(500).json({
      error: "Logout failed"
    });
  }
});


router.get("/auth/me", async (req, res) => {
  try {
    const token = req.cookies?.Ownexa_Token;
    if (!token) {
      return res.status(401).json({
        loggedIn: false,
        message: "Not authenticated"
      });
    }
    const decoded = jwt.decode(token);

    if (!decoded?.sub) {
      return res.status(401).json({
        loggedIn: false,
        message: "Invalid token"
      });
    }

    const user = await FindUser(decoded.sub);
    console.log(user);
    return res.status(200).json({
      loggedIn: true,
      user
    });

  } catch (err) {
    console.error("Error Faced : ", err.message);
    return res.status(500).json({
      loggedIn: false,
      error: "Something went wrong"
    });
  }
});


export default router;