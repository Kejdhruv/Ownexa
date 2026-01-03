import express from "express";
import { getAuthUser } from "../../Middleware/Middleware.js";
import PrimaryTransaction from "../../Database/Transactions/Post/PrimaryTransaction.js";
import FindTransactions from "../../Database/Transactions/Get/FindTransactions.js";

const router = express.Router();

/* ================================
   CREATE PRIMARY TRANSACTION
================================ */
router.post("/transaction", async (req, res) => {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const transactionData = req.body;
    const transaction = await PrimaryTransaction(
      transactionData,
      user
    );
    return res.status(201).json({
      message: "Transaction successful",
      transaction
    });
  } catch (err) {
    console.error("Transaction Failed:", err.message);
    return res.status(400).json({
      error: err.message
    });
  }
});

/* ================================
   FETCH USER TRANSACTIONS
================================ */
router.get("/transaction", async (req, res) => {
  try {
    const { status } = req.query;
    if (status === undefined) {
      return res.status(400).json({
        error: "Status query param is required"
      });
    }
    if (!["SUCCESS", "FAILED"].includes(status)) {
      return res.status(400).json({
        error: "Invalid status value"
      });
    }
    const user = await getAuthUser(req);
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const transactions = await FindTransactions(
      status,
      user
    );
    return res.status(200).json(transactions);
  } catch (err) {
    console.error("Error Fetching User Transaction:", err.message);
    return res.status(400).json({
      error: err.message
    });
  }
});

export default router;



