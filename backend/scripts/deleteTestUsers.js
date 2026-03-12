import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

// Import models
import User from '../models/User.js';

const testUserEmails = [
  'googleprofiletest@gmail.com',
  'apitest@example.com',
  'googleuser@gmail.com',
  'paymenttest@example.com',
  'googleworkflow@gmail.com',
  'localworkflow@example.com',
  'localtestuser@example.com',
  'googletestuser@gmail.com',
  'googleavatartest@gmail.com'
];

async function deleteTestUsers() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    console.log('🔍 Finding test users...\n');
    
    // Find all test users
    const testUsers = await User.find({ 
      email: { $in: testUserEmails } 
    });

    if (testUsers.length === 0) {
      console.log('ℹ️  No test users found to delete.');
      return;
    }

    console.log(`Found ${testUsers.length} test user(s):\n`);
    testUsers.forEach(user => {
      console.log(`  📧 ${user.email}`);
      console.log(`     ID: ${user._id}`);
      console.log(`     Name: ${user.name}`);
      console.log(`     Role: ${user.role}`);
      console.log(`     Phone: ${user.phone || 'N/A'}`);
      console.log(`     Provider: ${user.provider}`);
      console.log(`     Created: ${user.createdAt.toLocaleDateString()}`);
      console.log('');
    });

    console.log('🗑️  Deleting test users...\n');

    // Delete the users
    const result = await User.deleteMany({ 
      email: { $in: testUserEmails } 
    });

    console.log(`✅ Successfully deleted ${result.deletedCount} test user(s)\n`);

    // Verify deletion
    const remainingUsers = await User.find({ 
      email: { $in: testUserEmails } 
    });

    if (remainingUsers.length === 0) {
      console.log('✅ Verification: All test users have been removed from the database');
    } else {
      console.log(`⚠️  Warning: ${remainingUsers.length} test user(s) still remain`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
}

// Run the script
deleteTestUsers()
  .then(() => {
    console.log('\n✨ Test user deletion completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
