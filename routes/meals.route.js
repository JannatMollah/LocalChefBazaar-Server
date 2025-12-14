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

module.exports = router;
