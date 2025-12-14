const express = require("express");
const cors = require("cors");
require("dotenv").config();

const { connectDB } = require("./config/db");
const userRoutes = require("./routes/users.route");
const authRoutes = require("./routes/auth.route");
const mealsRoutes = require("./routes/meals.route");
const reviewsRoutes = require("./routes/reviews.route");
const favoritesRoutes = require("./routes/favorites.route");
const ordersRoutes = require("./routes/orders.route");
const requestRoutes = require("./routes/requests.route");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/users", userRoutes);
app.use("/auth", authRoutes);
app.use("/meals", mealsRoutes);
app.use("/reviews", reviewsRoutes);
app.use("/favorites", favoritesRoutes);
app.use("/orders", ordersRoutes);
app.use("/requests", requestRoutes);


app.get("/", (req, res) => {
  res.send("LocalChefBazaar Server Running");
});

//Example Protected Route (Test)
const verifyJWT = require("./middleware/verifyJWT");

app.get("/protected", verifyJWT, (req, res) => {
  res.send({
    message: "Protected data access granted",
    user: req.user,
  });
});



const PORT = process.env.PORT || 5000;

connectDB(process.env.MONGODB_URI).then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
});
