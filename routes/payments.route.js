const express = require("express");
const router = express.Router();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const verifyJWT = require("../middleware/verifyJWT");
const verifyActiveUser = require("../middleware/verifyActiveUser");
const { getDB } = require("../config/db");
const { ObjectId } = require("mongodb");

// CREATE PAYMENT INTENT
router.post("/create-intent", verifyJWT, verifyActiveUser, async (req, res) => {
  const { price } = req.body;

  const amount = price * 100; // cents

  const paymentIntent = await stripe.paymentIntents.create({
    amount,
    currency: "usd",
    payment_method_types: ["card"],
  });

  res.send({
    clientSecret: paymentIntent.client_secret,
  });
});

// SAVE PAYMENT
router.post("/success", verifyJWT, verifyActiveUser, async (req, res) => {
  const db = getDB();
  const payment = req.body;

  const paymentData = {
    userEmail: req.user.email,
    orderId: new ObjectId(payment.orderId),
    amount: payment.amount,
    transactionId: payment.transactionId,
    paymentTime: new Date(),
  };

  await db.collection("payments").insertOne(paymentData);

  await db.collection("orders").updateOne(
    { _id: new ObjectId(payment.orderId) },
    { $set: { paymentStatus: "paid" } }
  );

  res.send({ message: "Payment successful" });
});

module.exports = router;