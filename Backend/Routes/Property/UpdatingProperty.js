import express from "express";
import AddProperty from "../../Database/Property/Post/AddProperty.js";
import getAuthUser from "../../Middleware/Middleware.js";
import ValidateProperty from "../../Database/Property/Post/ValidateProperty.js";

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

router.put("/property/validate", async (req, res) => {
  try {
    const user = await getAuthUser(req);
    if (user.role !== "admin") {
      return res.status(403).json({
        error: "Forbidden"
      });
    }
    const propertyData = req.body;
    const property = await ValidateProperty(propertyData, user);

    return res.status(200).json({
      message: "Property validated successfully",
      property
    });

  } catch (err) {
    console.error("Error validating property:", err.message);

    return res.status(400).json({
      error: err.message
    });
  }
});


export default router;