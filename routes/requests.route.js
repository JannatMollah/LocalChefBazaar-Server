const express = require("express");
const router = express.Router();
const { ObjectId } = require("mongodb");

const verifyJWT = require("../middleware/verifyJWT");
const verifyActiveUser = require("../middleware/verifyActiveUser");
const verifyAdmin = require("../middleware/verifyAdmin");
const { getDB } = require("../config/db");

// SEND ROLE REQUEST
router.post("/", verifyJWT, verifyActiveUser, async (req, res) => {
  const db = getDB();
  const { requestType } = req.body; // chef or admin

  const request = {
    userName: req.dbUser.name,
    userEmail: req.user.email,
    requestType,
    requestStatus: "pending",
    requestTime: new Date(),
  };

  const result = await db.collection("requests").insertOne(request);
  res.send(result);
});

// GET ALL REQUESTS
router.get(
  "/",
  verifyJWT,
  verifyActiveUser,
  verifyAdmin,
  async (req, res) => {
    const db = getDB();
    const requests = await db.collection("requests").find().toArray();
    res.send(requests);
  }
);

// ACCEPT REQUEST
router.patch(
  "/accept/:id",
  verifyJWT,
  verifyActiveUser,
  verifyAdmin,
  async (req, res) => {
    const db = getDB();
    const id = req.params.id;

    const request = await db
      .collection("requests")
      .findOne({ _id: new ObjectId(id) });

    if (!request) {
      return res.status(404).send({ message: "Request not found" });
    }

    if (request.requestType === "chef") {
      const chefId = "chef-" + Math.floor(1000 + Math.random() * 9000);

      await db.collection("users").updateOne(
        { email: request.userEmail },
        { $set: { role: "chef", chefId } }
      );
    }

    if (request.requestType === "admin") {
      await db.collection("users").updateOne(
        { email: request.userEmail },
        { $set: { role: "admin" } }
      );
    }

    const result = await db.collection("requests").updateOne(
      { _id: new ObjectId(id) },
      { $set: { requestStatus: "approved" } }
    );

    res.send(result);
  }
);

// REJECT REQUEST
router.patch(
  "/reject/:id",
  verifyJWT,
  verifyActiveUser,
  verifyAdmin,
  async (req, res) => {
    const db = getDB();
    const id = req.params.id;

    const result = await db.collection("requests").updateOne(
      { _id: new ObjectId(id) },
      { $set: { requestStatus: "rejected" } }
    );

    res.send(result);
  }
);

// GET MY PENDING REQUESTS
router.get("/my-pending", verifyJWT, verifyActiveUser, async (req, res) => {
  const db = getDB();
  
  const requests = await db.collection("requests")
    .find({ 
      userEmail: req.user.email,
      requestStatus: "pending"
    })
    .toArray();
  
  res.send(requests);
});

module.exports = router;