const mongoose = require("mongoose");
const db = mongoose.connection;
require("dotenv").config();
mongoose.set("strictQuery", true);

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {});
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
    process.exit(1);
  }
};

connectDB();

db.on("error", (error) => {
  console.error("MongoDB connection error:", error);
  process.exit(1);
});

module.exports = mongoose.connection;
