const express = require("express");
const router = express.Router();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const { ObjectId } = require("mongodb");

const verifyJWT = require("../middleware/verifyJWT");
const verifyActiveUser = require("../middleware/verifyActiveUser");
const { getDB } = require("../config/db");

// CREATE PAYMENT INTENT (Stripe Payment এর জন্য)
router.post("/create-intent", verifyJWT, verifyActiveUser, async (req, res) => {
  try {
    const { amount, orderId, description } = req.body;
    
    if (!amount || amount < 1) {
      return res.status(400).send({ message: "Invalid amount" });
    }

    // Create Payment Intent in Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: "bdt",
      payment_method_types: ["card"],
      description: description || `Payment for order ${orderId}`,
      metadata: {
        userId: req.user.email,
        orderId: orderId
      }
    });

    // Save payment intent in database
    const db = getDB();
    await db.collection("payment_intents").insertOne({
      paymentIntentId: paymentIntent.id,
      orderId: new ObjectId(orderId),
      amount: amount,
      userEmail: req.user.email,
      status: "created",
      createdAt: new Date()
    });

    res.send({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    });
  } catch (error) {
    console.error("Stripe error:", error);
    res.status(500).send({ 
      message: "Failed to create payment", 
      error: error.message 
    });
  }
});

// HANDLE PAYMENT SUCCESS (Stripe Webhook বা Frontend থেকে Call হবে)
router.post("/success", verifyJWT, verifyActiveUser, async (req, res) => {
  const db = getDB();
  const { orderId, paymentIntentId, transactionId } = req.body;

  try {
    // Update order payment status
    await db.collection("orders").updateOne(
      { _id: new ObjectId(orderId) },
      { 
        $set: { 
          paymentStatus: "paid",
          transactionId: transactionId || paymentIntentId,
          paymentTime: new Date()
        } 
      }
    );

    // Update payment intent status
    await db.collection("payment_intents").updateOne(
      { paymentIntentId },
      { $set: { status: "succeeded", updatedAt: new Date() } }
    );

    // Save payment record
    await db.collection("payments").insertOne({
      orderId: new ObjectId(orderId),
      userEmail: req.user.email,
      amount: req.body.amount,
      paymentMethod: "stripe",
      transactionId: transactionId || paymentIntentId,
      status: "completed",
      paymentTime: new Date()
    });

    res.send({ 
      success: true, 
      message: "Payment successful" 
    });
  } catch (error) {
    console.error("Payment success error:", error);
    res.status(500).send({ 
      success: false, 
      message: "Failed to process payment" 
    });
  }
});

// GET PAYMENT HISTORY
router.get("/history", verifyJWT, verifyActiveUser, async (req, res) => {
  const db = getDB();
  
  const payments = await db
    .collection("payments")
    .find({ userEmail: req.user.email })
    .sort({ paymentTime: -1 })
    .toArray();

  res.send(payments);
});

module.exports = router;