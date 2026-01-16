import express from "express";
import  {Analytics, AdminAnalytics } from "../../Database/Analytics/Analytics.js";
import { FindRole, getAuthUser } from "../../Middleware/Middleware.js";

const router = express.Router();  

router.get("/public/stats", async (req, res) => {
  try {
      const stats = await Analytics(); 
    return res.status(200).json({
      users: stats.total_users,
      properties: stats.total_validated_properties,
      transactions: stats.total_transactions,
      volume: stats.total_transaction_volume
    });

  } catch (err) {
    return res.status(500).json({
      error: "Unable to fetch stats"
    });
  }
});

router.get("/admin/stats", async (req, res) => {
  try {
    const user = await getAuthUser(req);
    const role = await FindRole(user.id);
    if (role != "Admin") {
       return res.status(403).json({
        error: "Forbidden"
      });
    }
    const stats = await AdminAnalytics(); 
    return res.status(200).json(stats);

  } catch (err) {
    return res.status(500).json({
      error: "Unable to fetch stats"
    });
  }
});


export default router; 