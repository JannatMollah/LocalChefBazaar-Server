const express = require("express");
const router = express.Router();
const { ObjectId } = require("mongodb");

const verifyJWT = require("../middleware/verifyJWT");
const verifyActiveUser = require("../middleware/verifyActiveUser");
const { getDB } = require("../config/db");

// PLACE ORDER
router.post("/", verifyJWT, verifyActiveUser, async (req, res) => {
  const db = getDB();
  const order = req.body;

  const newOrder = {
    foodId: new ObjectId(order.foodId),
    mealName: order.mealName,
    price: order.price,
    quantity: order.quantity,
    chefId: order.chefId,
    userEmail: req.user.email,
    userAddress: order.userAddress,
    orderStatus: "pending",
    paymentStatus: "Pending",
    orderTime: new Date(),
  };

  const result = await db.collection("orders").insertOne(newOrder);
  res.send(result);
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

// UPDATE ORDER STATUS
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

module.exports = router;