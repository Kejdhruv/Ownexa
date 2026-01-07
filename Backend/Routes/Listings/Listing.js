import express from "express";
import { getAuthUser } from "../../Middleware/Middleware.js";
import PostListing from "../../Database/Listings/Post/PostListings.js";
import UpdateHolding from "../../Database/Investments/Post/UpdateHoldings.js";
const router = express.Router();


/* CREATE LISTING */

router.post("/listing", async (req, res) => {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const ListingData = req.body;
    const listing = await PostListing(ListingData, user);
    const holding = await UpdateHolding(ListingData, user); 

    return res.status(201).json({
      message: "Listing successful",
      ListingData,
    });

  } catch (err) {
    console.error("Listing Failed:", err);
    return res.status(400).json({
      error: err.message || "Listing failed",
    });
  }
});
