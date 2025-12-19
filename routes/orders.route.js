const express = require("express");
const router = express.Router();
const { ObjectId } = require("mongodb");

const verifyJWT = require("../middleware/verifyJWT");
const verifyActiveUser = require("../middleware/verifyActiveUser");
const verifyAdmin = require("../middleware/verifyAdmin");
const { getDB } = require("../config/db");

// PLACE ORDER (Cart থেকে বা Direct)
router.post("/", verifyJWT, verifyActiveUser, async (req, res) => {
  const db = getDB();
  const orderData = req.body;

  try {
    // SINGLE ORDER (Direct Order Page থেকে)
    if (orderData.foodId) {
      const newOrder = {
        foodId: new ObjectId(orderData.foodId),
        mealName: orderData.mealName,
        price: orderData.price,
        quantity: orderData.quantity || 1,
        chefId: orderData.chefId,
        userEmail: req.user.email,
        userAddress: orderData.userAddress,
        orderStatus: "pending",
        paymentStatus: "pending", // ✅ FIXED: Always "pending" initially
        paymentMethod: orderData.paymentMethod || "cash", // ✅ Added payment method
        orderTime: new Date(),
      };

      const result = await db.collection("orders").insertOne(newOrder);
      return res.send({
        success: true,
        orderId: result.insertedId,
        message: "Order placed successfully"
      });
    }

    // BULK ORDER (Cart/Checkout থেকে)
    if (orderData.items && Array.isArray(orderData.items)) {
      const orders = orderData.items.map(item => ({
        foodId: new ObjectId(item.mealId),
        mealName: item.mealName,
        price: item.price,
        quantity: item.quantity || 1,
        chefId: item.chefId,
        userEmail: req.user.email,
        userAddress: orderData.address || orderData.userAddress,
        orderStatus: "pending",
        paymentStatus: "pending", // ✅ FIXED
        paymentMethod: orderData.paymentMethod || "cash",
        orderTime: new Date(),
      }));

      const result = await db.collection("orders").insertMany(orders);
      
      // Clear cart after successful order
      if (orderData.clearCart !== false) {
        await db.collection("cart").deleteMany({ userEmail: req.user.email });
      }

      return res.send({
        success: true,
        orderIds: result.insertedIds,
        message: `${orders.length} orders placed successfully`
      });
    }

    res.status(400).send({ message: "Invalid order data" });
  } catch (error) {
    console.error("Order placement error:", error);
    res.status(500).send({ message: "Failed to place order", error: error.message });
  }
});

// GET MY ORDERS
router.get("/my", verifyJWT, verifyActiveUser, async (req, res) => {
  const db = getDB();

  const orders = await db
    .collection("orders")
    .find({ userEmail: req.user.email })
    .sort({ orderTime: -1 })
    .toArray();

  res.send(orders);
});

// GET ORDER BY ID (Payment এর জন্য)
router.get("/:id", verifyJWT, verifyActiveUser, async (req, res) => {
  const db = getDB();
  const id = req.params.id;

  try {
    const order = await db
      .collection("orders")
      .findOne({ _id: new ObjectId(id) });

    if (!order) {
      return res.status(404).send({ message: "Order not found" });
    }

    // Check if user owns this order
    if (order.userEmail !== req.user.email) {
      return res.status(403).send({ message: "Access denied" });
    }

    res.send(order);
  } catch (error) {
    res.status(400).send({ message: "Invalid order ID" });
  }
});

// UPDATE PAYMENT STATUS (Stripe Payment Success এ Call হবে)
router.patch("/:id/payment", verifyJWT, verifyActiveUser, async (req, res) => {
  const db = getDB();
  const id = req.params.id;
  const { paymentStatus, transactionId } = req.body;

  const validStatuses = ["pending", "paid", "failed"];
  if (!validStatuses.includes(paymentStatus)) {
    return res.status(400).send({ message: "Invalid payment status" });
  }

  try {
    const result = await db.collection("orders").updateOne(
      { _id: new ObjectId(id) },
      { 
        $set: { 
          paymentStatus,
          transactionId,
          paymentTime: paymentStatus === "paid" ? new Date() : null
        } 
      }
    );

    res.send(result);
  } catch (error) {
    res.status(500).send({ message: "Failed to update payment" });
  }
});

// GET CHEF ORDERS
router.get(
  "/chef/:chefId",
  verifyJWT,
  verifyActiveUser,
  async (req, res) => {
    const db = getDB();
    const chefId = req.params.chefId;

    const orders = await db
      .collection("orders")
      .find({ chefId })
      .sort({ orderTime: -1 })
      .toArray();

    res.send(orders);
  }
);

// UPDATE ORDER STATUS (Chef এর জন্য)
router.patch(
  "/status/:id",
  verifyJWT,
  verifyActiveUser,
  async (req, res) => {
    const db = getDB();
    const id = req.params.id;
    const { status } = req.body;

    const validStatus = ["cancelled", "accepted", "delivered"];
    if (!validStatus.includes(status)) {
      return res.status(400).send({ message: "Invalid status" });
    }

    const result = await db.collection("orders").updateOne(
      { _id: new ObjectId(id) },
      { $set: { orderStatus: status } }
    );

    res.send(result);
  }
);

router.get(
  "/",
  verifyJWT,
  verifyActiveUser,
  verifyAdmin,
  async (req, res) => {
    const db = getDB();
    const requests = await db.collection("orders").find().toArray();
    res.send(requests);
  }
);

module.exports = router;