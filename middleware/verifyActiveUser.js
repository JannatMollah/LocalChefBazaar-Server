const { getDB } = require("../config/db");

const verifyActiveUser = async (req, res, next) => {
  const db = getDB();
  const email = req.user?.email;

  const user = await db.collection("users").findOne({ email });

  if (!user) {
    return res.status(401).send({ message: "User not found" });
  }

  if (user.status === "fraud") {
    return res.status(403).send({ message: "Fraud user access denied" });
  }

  req.dbUser = user;
  next();
};

module.exports = verifyActiveUser;
