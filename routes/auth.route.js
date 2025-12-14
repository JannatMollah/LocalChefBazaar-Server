const express = require("express");
const jwt = require("jsonwebtoken");
const router = express.Router();

router.post("/jwt", (req, res) => {
  const user = req.body;

  const token = jwt.sign(user, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });

  res.send({ token });
});

module.exports = router;