const mongoose = require('mongoose');
const User = require('./models/User');

// Connect to MongoDB
mongoose.connect('mongodb+srv://ydvnikita04:ydvnikita04@cluster0.alobw5p.mongodb.net/farming-website?retryWrites=true&w=majority&appName=Cluster0');

async function checkUsers() {
  try {
    const users = await User.find({}, 'name email role createdAt');
    console.log('📋 All Users in Database:');
    console.log('='.repeat(50));
    
    if (users.length === 0) {
      console.log('No users found in database');
    } else {
      users.forEach((user, index) => {
        console.log(`${index + 1}. ${user.name} - ${user.email} (${user.role})`);
      });
    }
    
    console.log('='.repeat(50));
    console.log(`Total users: ${users.length}`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkUsers();