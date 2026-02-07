import express from "express";
import { FindProperty, FindOneProperty, FindingProperties, FindValidatedStaleProperties } from "../../Database/Property/Get/FindingProperty.js";
import { FindRole, getAuthUser } from "../../Middleware/Middleware.js";

const router = express.Router();

/* Get all Status Based Properties */
router.get("/properties", async (req, res) => {
  try {
    const { status, listed } = req.query;
    if (!status || listed === undefined) {
      return res.status(400).json({
        error: "status and listed query params are required"
      });
    }
    const properties = await FindProperty(
      status,
      listed === "true"
    );
    return res.status(200).json(properties);

  } catch (err) {
    console.error("Error fetching properties:", err.message);
    return res.status(400).json({ error: err.message });
  }
});

/* Get Each Property Status Based */
router.get("/properties/:id", async (req, res) => {
  try {
    const { id: propertyId } = req.params;
    const { status, listed } = req.query;
    if (!status || listed === undefined) {
      return res.status(400).json({
        error: "status and listed query params are required"
      });
    }
    const property = await FindOneProperty(
      propertyId,
      status,
      listed === "true"
    );
    return res.status(200).json(property);

  } catch (err) {
    console.error("Error fetching property:", err.message);
    return res.status(400).json({ error: err.message });
  }
});

/* Get Each User Properties */
router.get("/userproperties", async (req, res) => {
  try {
    const user = await getAuthUser(req);
    const property = await FindingProperties(user.id);
    return res.status(200).json(property);
  } catch (err) {
    console.error("Error fetching properties:", err.message);
    return res.status(400).json({ error: err.message });
  }
});


router.get("/warnedproperties", async (req, res) => {
  try {
    const user = await getAuthUser(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });
    const role = await FindRole(user.id);
    if (role !== "Admin") {
      return res.status(403).json({ error: "Forbidden" });
    }
    const properties = await FindValidatedStaleProperties(2);
    return res.status(200).json(properties);
  } catch (err) {
    console.error("Error fetching properties:", err);
    return res.status(400).json({ error: err.message || "Failed to fetch properties" });
  }
});



export default router;
