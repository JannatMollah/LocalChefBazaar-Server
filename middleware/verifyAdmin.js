const verifyAdmin = async (req, res, next) => {
  if (req.dbUser?.role !== "admin") {
    return res.status(403).send({ message: "Admin only access" });
  }
  next();
};

module.exports = verifyAdmin;
