const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

async function verifyUserCleanup() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('✅ Connected to staging database');
    console.log('🔍 Verifying user cleanup...\n');
    
    const userCount = await User.countDocuments();
    const users = await User.find({}, 'name email role createdAt').limit(5);
    
    console.log(`📊 Total users in staging database: ${userCount}`);
    
    if (userCount === 0) {
      console.log('✅ CONFIRMED: Staging database is clean - no users found');
    } else {
      console.log('⚠️ WARNING: Users still exist in staging database:');
      users.forEach((user, index) => {
        console.log(`${index + 1}. ${user.name} (${user.email}) - ${user.role} - Created: ${user.createdAt}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
}

verifyUserCleanup();