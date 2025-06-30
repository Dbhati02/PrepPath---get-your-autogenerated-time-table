const mongoose = require('mongoose');

const db = async () => {
  try {
    await mongoose.connect(process.env.URL);
    console.log('Successfully connected to the database');
  } catch (err) {
    console.error(' MongoDB connection error:', err.message);
  }
};

module.exports = db;
