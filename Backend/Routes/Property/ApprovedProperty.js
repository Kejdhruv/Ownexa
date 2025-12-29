import express from "express";
import AddProperty from "../../Database/Property/Post/AddProperty.js";
import getAuthUser from "../../Middleware/Middleware.js";

const router = express.Router();

router.post("/property/add", async (req, res) => {
  try {
    const user = await getAuthUser(req);
    const propertyData = req.body;
    await AddProperty(propertyData, user);
    return res.status(201).json({
      message: "Property added successfully"
    });
  } catch (err) {
    console.error("Error Adding Property:", err.message);
    return res.status(400).json({
      error: err.message
    });
  }
});

export default router;

