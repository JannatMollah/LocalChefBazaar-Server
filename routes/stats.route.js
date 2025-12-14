const express = require("express");
const router = express.Router();

const verifyJWT = require("../middleware/verifyJWT");
const verifyActiveUser = require("../middleware/verifyActiveUser");
const verifyAdmin = require("../middleware/verifyAdmin");
const { getDB } = require("../config/db");

// PLATFORM STATS
router.get(
  "/",
  verifyJWT,
  verifyActiveUser,
  verifyAdmin,
  async (req, res) => {
    const db = getDB();

    const totalUsers = await db.collection("users").estimatedDocumentCount();
    const ordersPending = await db
      .collection("orders")
      .countDocuments({ orderStatus: "pending" });
    const ordersDelivered = await db
      .collection("orders")
      .countDocuments({ orderStatus: "delivered" });

    const payments = await db.collection("payments").find().toArray();
    const totalPayment = payments.reduce(
      (sum, p) => sum + p.amount,
      0
    );

    res.send({
      totalUsers,
      ordersPending,
      ordersDelivered,
      totalPayment,
    });
  }
);

module.exports = router;
