import express from "express";
import AddProperty from "../../Database/Property/Post/AddProperty.js";
import { FindRole, getAuthUser, upload } from "../../Middleware/Middleware.js";
import ValidateProperty from "../../Database/Property/Post/ValidateProperty.js";
import { FreezePropertyAdmin, WarnProperty } from "../../Database/Property/Post/ReviewProperty.js";
import FreezeProperty from "../../Database/Property/Post/FreezeProperty.js";

const router = express.Router();

/* Add Property */
router.post("/property/add", upload.fields([
  { name: "propertyImages", maxCount: 10 },
  { name: "legalDocuments", maxCount: 10 }
]), async (req, res) => {
  try {
    const user = await getAuthUser(req);
    const propertyData = req.body;
    const files = req.files;
    await AddProperty(propertyData, user, files);
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

/* Validate Property */
router.put("/property/validate", async (req, res) => {
  try {
    const user = await getAuthUser(req);
    const role = await FindRole(user.id);
    if (role != "Admin") {
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



router.put("/property/warn", async (req, res) => {
  try {
    const user = await getAuthUser(req);
    const role = await FindRole(user.id);
    if (role != "Admin") {
      return res.status(403).json({
        error: "Forbidden"
      });
    }
    const propertyData = req.body;
    const property = await WarnProperty(propertyData);
    return res.status(200).json({
      message: "Warning Sent Successfully",
      property
    });

  } catch (err) {
    console.error("Error validating property:", err.message);

    return res.status(400).json({
      error: err.message
    });
  }
});


router.put("/property/freeze", async (req, res) => {
  try {
    const user = await getAuthUser(req);
    const role = await FindRole(user.id);
    if (role != "Admin") {
      return res.status(403).json({
        error: "Forbidden"
      });
    }
    const propertyData = req.body;
    const property = await FreezePropertyAdmin(propertyData);
    return res.status(200).json({
      message: "Warning Sent Successfully",
      property
    });

  } catch (err) {
    console.error("Error validating property:", err.message);

    return res.status(400).json({
      error: err.message
    });
  }
});


router.put("/property/sold", async (req, res) => {
  try {
    const user = await getAuthUser(req);
    const { propertyId } = req.body;
    const property = await FreezeProperty(propertyId);
    return res.status(200).json({
      message: "Warning Sent Successfully",
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