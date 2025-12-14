const verifyChef = async (req, res, next) => {
  if (req.dbUser?.role !== "chef") {
    return res.status(403).send({ message: "Chef only access" });
  }
  next();
};

module.exports = verifyChef;
