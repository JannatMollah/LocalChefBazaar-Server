const express = require("express");
const router = express.Router();
const { getDB } = require("../config/db");
const { createUser } = require("../models/User");

const verifyJWT = require("../middleware/verifyJWT");
const verifyActiveUser = require("../middleware/verifyActiveUser");
const verifyAdmin = require("../middleware/verifyAdmin");

// Get all users (Admin only)
router.get("/", verifyJWT, verifyActiveUser, verifyAdmin, async (req, res) => {
  const db = getDB();
  const users = await db.collection("users").find().toArray();
  res.send(users);
});

// Make Fraud (Admin)
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

// Get role by email (Frontend helper)
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

// UPDATE USER PROFILE (User can update their own profile)
router.patch("/profile", verifyJWT, verifyActiveUser, async (req, res) => {
  const db = getDB();
  const { name, address, photoURL } = req.body;
  const userEmail = req.user.email;

  try {
    // Prepare update data
    const updateData = {};
    if (name) updateData.name = name;
    if (address) updateData.address = address;
    if (photoURL) updateData.photoURL = photoURL;
    updateData.updatedAt = new Date();

    const result = await db.collection("users").updateOne(
      { email: userEmail },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return res.status(404).send({
        success: false,
        message: "User not found"
      });
    }

    // Get updated user data
    const updatedUser = await db.collection("users").findOne({ email: userEmail });

    res.send({
      success: true,
      message: "Profile updated successfully",
      user: updatedUser
    });
  } catch (error) {
    console.error("Profile update error:", error);
    res.status(500).send({
      success: false,
      message: "Failed to update profile"
    });
  }
});

// GET CURRENT USER PROFILE
router.get("/profile/me", verifyJWT, verifyActiveUser, async (req, res) => {
  const db = getDB();
  const userEmail = req.user.email;

  try {
    const user = await db.collection("users").findOne({ email: userEmail });

    if (!user) {
      return res.status(404).send({
        success: false,
        message: "User not found"
      });
    }

    // Remove sensitive data
    const { password, ...userData } = user;

    res.send({
      success: true,
      user: userData
    });
  } catch (error) {
    console.error("Profile fetch error:", error);
    res.status(500).send({
      success: false,
      message: "Failed to fetch profile"
    });
  }
});

// Save user
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

// Get user by email
router.get("/:email", async (req, res) => {
  const email = req.params.email;
  const db = getDB();
  const user = await db.collection("users").findOne({ email });

  if (!user) {
    return res.status(404).send({ message: "User not found" });
  }

  // Remove password for security
  const { password, ...userData } = user;
  res.send(userData);
});


// UPDATE USER BY EMAIL (Direct update)
router.put("/:email", async (req, res) => {
  const db = getDB();
  const email = req.params.email;
  const updateData = req.body;

  try {
    // Remove email from update data if present (can't change email)
    delete updateData.email;
    updateData.updatedAt = new Date();

    const result = await db.collection("users").updateOne(
      { email: email },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      // If user doesn't exist, create a new one
      const newUser = {
        email: email,
        ...updateData,
        name: updateData.name || "User",
        role: "user",
        status: "active",
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await db.collection("users").insertOne(newUser);

      return res.send({
        success: true,
        message: "User created successfully",
        user: newUser
      });
    }

    // Get updated user
    const updatedUser = await db.collection("users").findOne({ email: email });

    res.send({
      success: true,
      message: "User updated successfully",
      user: updatedUser
    });
  } catch (error) {
    console.error("Update user error:", error);
    res.status(500).send({
      success: false,
      message: "Failed to update user",
      error: error.message
    });
  }
});

module.exports = router;