import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from '../models/User.js';

// Load environment variables
dotenv.config({ path: '../.env' });

async function createTestStaff() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Create a test staff member
    const hashedPassword = await bcrypt.hash('teststaff123', 10);
    
    const testStaff = new User({
      name: 'Test Staff Center',
      email: 'teststaff@example.com',
      password: hashedPassword,
      phone: '+919876543210',
      role: 'staff',
      provider: 'local',
      isActive: false,
      approvalStatus: 'pending'
    });

    await testStaff.save();
    console.log(`✅ Created test staff member:`);
    console.log(`   Name: ${testStaff.name}`);
    console.log(`   Email: ${testStaff.email}`);
    console.log(`   ID: ${testStaff._id}`);
    console.log(`   Status: ${testStaff.approvalStatus}`);

  } catch (error) {
    if (error.code === 11000) {
      console.log('⚠️  Test staff member already exists');
    } else {
      console.error('❌ Error:', error);
    }
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

createTestStaff();