import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';

// Load environment variables
dotenv.config({ path: '../.env' });

async function checkAdminUsers() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find all admin users
    const adminUsers = await User.find({ role: 'admin' }).select('-password');
    console.log(`\n👑 Found ${adminUsers.length} admin users:`);

    if (adminUsers.length > 0) {
      adminUsers.forEach(admin => {
        console.log(`   - ${admin.name} (${admin.email})`);
        console.log(`     ID: ${admin._id}`);
        console.log(`     Active: ${admin.isActive}`);
        console.log('     ---');
      });
    } else {
      console.log('   No admin users found. Creating a test admin...');
      
      // Create a test admin user
      const testAdmin = new User({
        name: 'Test Admin',
        email: 'admin@sahayak.com',
        password: '$2a$10$dummy.hash.for.testing', // Dummy hash
        role: 'admin',
        isActive: true,
        provider: 'local'
      });

      await testAdmin.save();
      console.log(`   ✅ Created test admin: ${testAdmin.name} (${testAdmin._id})`);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

checkAdminUsers();