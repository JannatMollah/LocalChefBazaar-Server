const express = require("express");
const router = express.Router();
const { getDB } = require("../config/db");
const { createUser } = require("../models/User");

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
