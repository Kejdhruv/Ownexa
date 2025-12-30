import express from "express";
import ValidateProperty from "../../Database/Property/Post/ValidateProperty.js";
import getAuthUser from "../../Middleware/getAuthUser.js";

const router = express.Router();
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