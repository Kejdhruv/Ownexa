import express from "express";
import { getAuthUser } from "../../Middleware/Middleware.js";
import PostListing from "../../Database/Listings/Post/PostListings.js";
import UpdateHolding from "../../Database/Investments/Post/UpdateHoldings.js";
import { FindingBuyerListing, FindingSellerListing, FindPropertyListing } from "../../Database/Listings/Get/FetchLisiting.js";
const router = express.Router();


/* CREATE LISTING */
router.post("/listing", async (req, res) => {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }
      const ListingData = req.body;
      await UpdateHolding(ListingData, user); 
      await PostListing(ListingData, user);
    

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


router.get("/listing", async (req, res) => {
  try {
    const { tag } = req.query;
    const user = await getAuthUser(req);
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    if (!tag || !["buyer", "seller"].includes(tag)) {
      return res.status(400).json({ error: "Invalid tag" });
    }
    let listings;
    if (tag === "buyer") {
      listings = await FindingBuyerListing(user.id, "SOLD");
    }
    if (tag === "seller") {
      listings = await FindingSellerListing(user.id, "ACTIVE");
    }
    return res.status(200).json(listings);

  } catch (err) {
    console.error("Error Fetching Listings:", err.message);
    return res.status(400).json({
      error: err.message,
    });
  }
}); 


router.get("/propertylisting/:id", async (req, res) => {
    try {
        const { id: propertyId } = req.params;
        const propertylisting = await FindPropertyListing(
            "ACTIVE",
            propertyId,
        );
        return res.status(200).json(propertylisting);
    }
    catch (err) {
        console.error("Error Fetching Property Listing :", err.message);
    return res.status(400).json({ error: err.message });
    }

})

export default router;


