const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    mongoose.set('bufferCommands', false);
    const connStr = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/socrates';
    const conn = await mongoose.connect(connStr);
    console.log(`[MongoDB] Connected successfully: ${conn.connection.host}`);
  } catch (error) {
    console.warn(`[MongoDB Warning] Database connection failed: ${error.message}`);
    console.warn(`[MongoDB Warning] Server will continue with seeded in-memory fallback data.`);
  }
};

module.exports = connectDB;
