const { MongoClient } = require("mongodb");

let client;
let db;

async function connectDB(uri) {
  client = new MongoClient(uri);
  await client.connect();
  db = client.db("localChefBazaar");
  console.log("✅ MongoDB Connected");
}

function getDB() {
  return db;
}

module.exports = { connectDB, getDB };
