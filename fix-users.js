const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

async function fixUsers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Fix users with invalid roles
    const invalidRoleUsers = await User.find({ role: { $nin: ['farmer', 'pilot', 'retail', 'admin'] } });
    console.log(`Found ${invalidRoleUsers.length} users with invalid roles`);
    
    for (let user of invalidRoleUsers) {
      user.role = 'farmer';
      await user.save();
      console.log(`Fixed role for user: ${user.email}`);
    }
    
    // Remove users with no email or password
    const invalidUsers = await User.find({
      $or: [
        { email: { $exists: false } },
        { email: null },
        { email: undefined },
        { password: { $exists: false } },
        { password: null },
        { password: '' }
      ]
    });
    
    console.log(`Found ${invalidUsers.length} users with missing email/password`);
    
    for (let user of invalidUsers) {
      if (!user.isGoogleAuth) {
        console.log(`Removing invalid user: ${user.name} - ${user.email}`);
        await User.findByIdAndDelete(user._id);
      }
    }
    
    console.log('Database cleanup completed');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

fixUsers();