import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

async function checkUserRole() {
  try {
    console.log('🔍 Checking User Roles...\n');

    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const User = (await import('../models/User.js')).default;

    // Find the test user
    const testUser = await User.findOne({ email: 'nobinrajeev431@gmail.com' });
    
    if (!testUser) {
      console.log('❌ User not found');
      return;
    }

    console.log(`📋 User Details:`);
    console.log(`   Name: ${testUser.name}`);
    console.log(`   Email: ${testUser.email}`);
    console.log(`   Role: ${testUser.role}`);
    console.log(`   Is Active: ${testUser.isActive}`);
    console.log(`   User ID: ${testUser._id}`);

    if (testUser.role !== 'user') {
      console.log(`\n⚠️  WARNING: User role is "${testUser.role}" but should be "user"`);
      console.log(`   This will cause 403 Forbidden errors on user endpoints`);
      
      // Fix the role
      testUser.role = 'user';
      await testUser.save();
      console.log(`\n✅ Fixed: User role updated to "user"`);
    } else {
      console.log(`\n✅ User role is correct`);
    }

    await mongoose.disconnect();
    console.log('\n✅ Check completed');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    process.exit(0);
  }
}

checkUserRole();
