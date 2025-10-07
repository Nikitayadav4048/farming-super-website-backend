const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

async function debugUsers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    const users = await User.find({}).select('name email password isGoogleAuth role');
    console.log('Total users:', users.length);
    
    users.forEach((user, index) => {
      console.log(`\n--- User ${index + 1} ---`);
      console.log('Name:', user.name);
      console.log('Email:', user.email);
      console.log('Password exists:', !!user.password);
      console.log('Password length:', user.password ? user.password.length : 0);
      console.log('Is Google Auth:', user.isGoogleAuth);
      console.log('Role:', user.role);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

debugUsers();