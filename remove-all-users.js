const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

async function removeAllUsers() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('✅ Connected to MongoDB');
    
    // Count users before deletion
    const userCount = await User.countDocuments();
    console.log(`📊 Found ${userCount} users in database`);
    
    if (userCount === 0) {
      console.log('ℹ️ No users to remove');
      return;
    }
    
    // Remove all users
    const result = await User.deleteMany({});
    console.log(`🗑️ Removed ${result.deletedCount} users from staging database`);
    
    // Verify deletion
    const remainingUsers = await User.countDocuments();
    console.log(`📊 Remaining users: ${remainingUsers}`);
    
    if (remainingUsers === 0) {
      console.log('✅ All users successfully removed from staging database');
    } else {
      console.log('⚠️ Some users may still remain');
    }
    
  } catch (error) {
    console.error('❌ Error removing users:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

// Run the script
removeAllUsers();