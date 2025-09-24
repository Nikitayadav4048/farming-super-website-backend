const mongoose = require('mongoose');
require('dotenv').config();

async function fixDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/farming-website');
    
    // Drop apiKey index
    await mongoose.connection.db.collection('users').dropIndex('apiKey_1');
    console.log('apiKey index dropped');
    
    // Remove apiKey field from all users
    await mongoose.connection.db.collection('users').updateMany({}, { $unset: { apiKey: "" } });
    console.log('apiKey field removed from all users');
    
    console.log('Database fixed successfully!');
    process.exit(0);
  } catch (error) {
    console.log('Error:', error.message);
    process.exit(1);
  }
}

fixDatabase();