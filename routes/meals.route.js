const express = require("express");
const router = express.Router();

const verifyJWT = require("../middleware/verifyJWT");
const verifyActiveUser = require("../middleware/verifyActiveUser");
const verifyChef = require("../middleware/verifyChef");
const { getDB } = require("../config/db");
const { ObjectId } = require("mongodb");

// CREATE MEAL (chef only)
router.post(
  "/",
  verifyJWT,
  verifyActiveUser,
  verifyChef,
  async (req, res) => {
    const db = getDB();
    const meal = req.body;

    const newMeal = {
      ...meal,
      rating: 0,
      createdAt: new Date(),
    };

    const result = await db.collection("meals").insertOne(newMeal);
    res.send(result);
  }
);

// GET ALL MEALS (public)
router.get("/", async (req, res) => {
  const db = getDB();

  const page = parseInt(req.query.page) || 1;
  const limit = 10;
  const skip = (page - 1) * limit;

  const sortOrder = req.query.sort === "asc" ? 1 : -1;

  const meals = await db
    .collection("meals")
    .find()
    .sort({ price: sortOrder })
    .skip(skip)
    .limit(limit)
    .toArray();

  const total = await db.collection("meals").estimatedDocumentCount();

  res.send({
    total,
    currentPage: page,
    totalPages: Math.ceil(total / limit),
    meals,
  });
});

// GET SINGLE MEAL
router.get("/:id", async (req, res) => {
  const db = getDB();
  const id = req.params.id;

  const meal = await db
    .collection("meals")
    .findOne({ _id: new ObjectId(id) });

  res.send(meal);
});

// GET CHEF MEALS
router.get("/chef/:chefId", async (req, res) => {
  const db = getDB();
  const chefId = req.params.chefId;

  try {
    const meals = await db
      .collection("meals")
      .find({ chefId })
      .sort({ createdAt: -1 })
      .toArray();

    res.send(meals);
  } catch (error) {
    console.error("Error fetching chef meals:", error);
    res.status(500).send({ message: "Failed to fetch chef meals" });
  }
});

// UPDATE MEAL
router.patch("/:id", verifyJWT, verifyActiveUser, verifyChef, async (req, res) => {
  const db = getDB();
  const id = req.params.id;
  const updateData = req.body;

  try {
    const meal = await db
      .collection("meals")
      .findOne({ _id: new ObjectId(id) });

    if (!meal) {
      return res.status(404).send({ message: "Meal not found" });
    }

    // Verify chef owns this meal
    if (meal.userEmail !== req.user.email) {
      return res.status(403).send({ message: "Unauthorized" });
    }

    updateData.updatedAt = new Date();

    const result = await db.collection("meals").updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );

    res.send({
      success: true,
      message: "Meal updated successfully",
      result
    });
  } catch (error) {
    console.error("Update meal error:", error);
    res.status(500).send({ 
      success: false, 
      message: "Failed to update meal" 
    });
  }
});

// DELETE MEAL
router.delete("/:id", verifyJWT, verifyActiveUser, verifyChef, async (req, res) => {
  const db = getDB();
  const id = req.params.id;

  try {
    const meal = await db
      .collection("meals")
      .findOne({ _id: new ObjectId(id) });

    if (!meal) {
      return res.status(404).send({ message: "Meal not found" });
    }

    // Verify chef owns this meal
    if (meal.userEmail !== req.user.email) {
      return res.status(403).send({ message: "Unauthorized" });
    }

    const result = await db
      .collection("meals")
      .deleteOne({ _id: new ObjectId(id) });

    res.send({
      success: true,
      message: "Meal deleted successfully",
      result
    });
  } catch (error) {
    console.error("Delete meal error:", error);
    res.status(500).send({ 
      success: false, 
      message: "Failed to delete meal" 
    });
  }
});

module.exports = router;
