const express = require("express");
const router = express.Router();
const { ObjectId } = require("mongodb");

const verifyJWT = require("../middleware/verifyJWT");
const verifyActiveUser = require("../middleware/verifyActiveUser");
const { getDB } = require("../config/db");

// ADD TO FAVORITE
router.post("/", verifyJWT, verifyActiveUser, async (req, res) => {
  const db = getDB();
  const favorite = req.body;

  const exists = await db.collection("favorites").findOne({
    userEmail: req.user.email,
    mealId: favorite.mealId,
  });

  if (exists) {
    return res.send({ message: "Already in favorites" });
  }

  const newFavorite = {
    userEmail: req.user.email,
    mealId: favorite.mealId,
    mealName: favorite.mealName,
    chefId: favorite.chefId,
    chefName: favorite.chefName,
    price: favorite.price,
    addedTime: new Date(),
  };

  const result = await db.collection("favorites").insertOne(newFavorite);
  res.send(result);
});

// GET MY FAVORITES
router.get("/", verifyJWT, verifyActiveUser, async (req, res) => {
  const db = getDB();

  const favorites = await db
    .collection("favorites")
    .find({ userEmail: req.user.email })
    .sort({ addedTime: -1 })
    .toArray();

  res.send(favorites);
});

// DELETE FAVORITE
router.delete("/:id", verifyJWT, verifyActiveUser, async (req, res) => {
  const db = getDB();
  const id = req.params.id;

  const favorite = await db
    .collection("favorites")
    .findOne({ _id: new ObjectId(id) });

  if (favorite.userEmail !== req.user.email) {
    return res.status(403).send({ message: "Forbidden" });
  }

  const result = await db
    .collection("favorites")
    .deleteOne({ _id: new ObjectId(id) });

  res.send(result);
});

module.exports = router;