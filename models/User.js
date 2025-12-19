const createUser = (user) => ({
  name: user.name,
  email: user.email,
  photoURL: user.image,
  address: user.address,
  role: "user",
  status: "active",
  createdAt: new Date(),
});

module.exports = { createUser };