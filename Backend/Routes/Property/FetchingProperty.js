import express from "express";
import { FindProperty, FindOneProperty } from "../../Database/Property/Get/FindProperty.js";

const router = express.Router();

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

export default router;
