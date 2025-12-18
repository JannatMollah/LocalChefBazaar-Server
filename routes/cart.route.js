const express = require("express");
const router = express.Router();
const { ObjectId } = require("mongodb");

const verifyJWT = require("../middleware/verifyJWT");
const verifyActiveUser = require("../middleware/verifyActiveUser");
const { getDB } = require("../config/db");

// Get cart items
router.get("/", verifyJWT, verifyActiveUser, async (req, res) => {
  const db = getDB();
  const cartItems = await db
    .collection("cart")
    .find({ userEmail: req.user.email })
    .toArray();
  res.send(cartItems);
});

// Add to cart
router.post("/", verifyJWT, verifyActiveUser, async (req, res) => {
  const db = getDB();
  const item = req.body;

  // Check if already in cart
  const existing = await db.collection("cart").findOne({
    userEmail: req.user.email,
    mealId: item.mealId,
  });

  if (existing) {
    // Update quantity
    await db.collection("cart").updateOne(
      { _id: existing._id },
      { $inc: { quantity: 1 } }
    );
    return res.send({ message: "Quantity updated" });
  }

  const newItem = {
    ...item,
    userEmail: req.user.email,
    addedAt: new Date(),
  };

  const result = await db.collection("cart").insertOne(newItem);
  res.send(result);
});

// Update cart item quantity
router.patch("/:id", verifyJWT, verifyActiveUser, async (req, res) => {
  const db = getDB();
  const id = req.params.id;
  const { quantity } = req.body;

  const item = await db
    .collection("cart")
    .findOne({ _id: new ObjectId(id) });

  if (!item || item.userEmail !== req.user.email) {
    return res.status(404).send({ message: "Item not found" });
  }

  if (quantity < 1) {
    await db.collection("cart").deleteOne({ _id: new ObjectId(id) });
    return res.send({ message: "Item removed" });
  }

  const result = await db.collection("cart").updateOne(
    { _id: new ObjectId(id) },
    { $set: { quantity } }
  );

  res.send(result);
});

// Remove from cart
router.delete("/:id", verifyJWT, verifyActiveUser, async (req, res) => {
  const db = getDB();
  const id = req.params.id;

  const item = await db
    .collection("cart")
    .findOne({ _id: new ObjectId(id) });

  if (!item || item.userEmail !== req.user.email) {
    return res.status(404).send({ message: "Item not found" });
  }

  const result = await db
    .collection("cart")
    .deleteOne({ _id: new ObjectId(id) });

  res.send(result);
});

// Clear cart
router.delete("/clear", verifyJWT, verifyActiveUser, async (req, res) => {
  const db = getDB();
  const result = await db
    .collection("cart")
    .deleteMany({ userEmail: req.user.email });
  res.send(result);
});

module.exports = router;