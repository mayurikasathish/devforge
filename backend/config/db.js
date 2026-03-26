const mongoose = require('mongoose');
const config = require('config');

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGO_URI || config.get('mongoURI');
    const conn = await mongoose.connect(mongoURI);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (err) {
    console.error(`❌ MongoDB Error: ${err.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
