const express = require("express");
const router = express.Router();
const { ObjectId } = require("mongodb");

const verifyJWT = require("../middleware/verifyJWT");
const verifyActiveUser = require("../middleware/verifyActiveUser");
const { getDB } = require("../config/db");

// ADD REVIEW
router.post("/", verifyJWT, verifyActiveUser, async (req, res) => {
  const db = getDB();
  const review = req.body;

  const newReview = {
    foodId: new ObjectId(review.foodId),
    reviewerName: review.reviewerName,
    reviewerImage: review.reviewerImage,
    rating: review.rating,
    comment: review.comment,
    userEmail: req.user.email,
    date: new Date(),
  };

  const result = await db.collection("reviews").insertOne(newReview);
  res.send(result);
});

// GET REVIEWS BY FOOD ID
router.get("/food/:foodId", async (req, res) => {
  const db = getDB();
  const foodId = req.params.foodId;

  const reviews = await db
    .collection("reviews")
    .find({ foodId: new ObjectId(foodId) })
    .sort({ date: -1 })
    .toArray();

  res.send(reviews);
});

// GET MY REVIEWS
router.get("/my", verifyJWT, verifyActiveUser, async (req, res) => {
  const db = getDB();

  const reviews = await db
    .collection("reviews")
    .find({ userEmail: req.user.email })
    .sort({ date: -1 })
    .toArray();

  res.send(reviews);
});

// UPDATE REVIEW
router.patch("/:id", verifyJWT, verifyActiveUser, async (req, res) => {
  const db = getDB();
  const id = req.params.id;
  const { rating, comment } = req.body;

  const review = await db
    .collection("reviews")
    .findOne({ _id: new ObjectId(id) });

  if (review.userEmail !== req.user.email) {
    return res.status(403).send({ message: "Forbidden" });
  }

  const result = await db.collection("reviews").updateOne(
    { _id: new ObjectId(id) },
    { $set: { rating, comment, date: new Date() } }
  );

  res.send(result);
});

// DELETE REVIEW
router.delete("/:id", verifyJWT, verifyActiveUser, async (req, res) => {
  const db = getDB();
  const id = req.params.id;

  const review = await db
    .collection("reviews")
    .findOne({ _id: new ObjectId(id) });

  if (review.userEmail !== req.user.email) {
    return res.status(403).send({ message: "Forbidden" });
  }

  const result = await db
    .collection("reviews")
    .deleteOne({ _id: new ObjectId(id) });

  res.send(result);
});

module.exports = router;