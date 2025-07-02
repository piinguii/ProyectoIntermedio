const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const db_uri = process.env.DB_URI;
    if (!db_uri) throw new Error("Missing DB_URI in environment");
    await mongoose.connect(db_uri);
    console.log("Conectado a la BD");
  } catch (err) {
    console.error("Error connecting to DB", err);
    process.exit(1);
  }
};

module.exports = connectDB;
