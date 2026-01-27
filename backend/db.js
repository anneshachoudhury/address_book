// backend/db.js
const { MongoClient } = require("mongodb");
require("dotenv").config();

console.log("=== ENVIRONMENT VARIABLES DEBUG ===");
console.log("MONGODB_URI exists:", !!process.env.MONGODB_URI);
console.log("====================================");

const uri = process.env.MONGODB_URI; // ← CHANGE THIS LINE

if (!uri) {
  console.error("ERROR: MONGODB_URI not found in environment variables");
  process.exit(1);
}

const client = new MongoClient(uri, {
  family: 4,
  retryWrites: true,
  w: "majority"
});

let db;

async function connectDB() {
  try {
    await client.connect();
    db = client.db("address-book");
    console.log("✅ Connected to MongoDB database:", db.databaseName);
    return db;
  } catch (err) {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  }
}

function getDB() {
  if (!db) throw new Error("Database not connected. Call connectDB first.");
  return db;
}

module.exports = { connectDB, getDB };
