const express = require("express");
const router = express.Router();
const { getDB } = require("../config/db");
const { createUser } = require("../models/User");

const verifyJWT = require("../middleware/verifyJWT");
const verifyActiveUser = require("../middleware/verifyActiveUser");
const verifyAdmin = require("../middleware/verifyAdmin");

//Get all users (Admin only)
router.get("/", verifyJWT, verifyActiveUser, verifyAdmin, async (req, res) => {
  const db = getDB();
  const users = await db.collection("users").find().toArray();
  res.send(users);
});


//Make Fraud (Admin)
router.patch(
  "/fraud/:email",
  verifyJWT,
  verifyActiveUser,
  verifyAdmin,
  async (req, res) => {
    const db = getDB();
    const email = req.params.email;

    const result = await db.collection("users").updateOne(
      { email },
      { $set: { status: "fraud" } }
    );

    res.send(result);
  }
);

//Get role by email (Frontend helper)
router.get(
  "/role/:email",
  verifyJWT,
  verifyActiveUser,
  async (req, res) => {
    const db = getDB();
    const user = await db.collection("users").findOne({ email: req.params.email });
    res.send({ role: user?.role, status: user?.status });
  }
);


// save user
router.post("/", async (req, res) => {
  const user = req.body;
  const db = getDB();

  const existing = await db.collection("users").findOne({ email: user.email });
  if (existing) {
    return res.send({ message: "User already exists" });
  }

  const newUser = createUser(user);
  const result = await db.collection("users").insertOne(newUser);
  res.send(result);
});

// get user by email
router.get("/:email", async (req, res) => {
  const email = req.params.email;
  const db = getDB();
  const user = await db.collection("users").findOne({ email });
  res.send(user);
});

module.exports = router;
