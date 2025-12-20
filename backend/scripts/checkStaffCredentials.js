import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import connectDB from '../config/db.js';

dotenv.config();

async function checkStaffCredentials() {
  try {
    // Connect to database
    await connectDB();
    console.log('🔗 Connected to MongoDB');
    
    // Find all staff users
    const staffUsers = await User.find({ role: 'staff' });
    console.log(`\n👤 Found ${staffUsers.length} staff users:`);
    
    for (const staff of staffUsers) {
      console.log(`\n📧 Email: ${staff.email}`);
      console.log(`👤 Name: ${staff.name}`);
      console.log(`🔑 Role: ${staff.role}`);
      console.log(`✅ Active: ${staff.isActive}`);
      console.log(`📋 Approval Status: ${staff.approvalStatus}`);
      console.log(`🔐 Has Password: ${staff.password ? 'Yes' : 'No'}`);
      console.log(`📱 Phone: ${staff.phone || 'Not set'}`);
      console.log(`🏢 Provider: ${staff.provider}`);
      
      if (staff.password) {
        console.log(`🔐 Password Hash: ${staff.password.substring(0, 20)}...`);
        
        // Test password verification with a common password
        const testPasswords = ['password', '123456', 'admin123', 'staff123'];
        for (const testPwd of testPasswords) {
          try {
            const isValid = await bcrypt.compare(testPwd, staff.password);
            if (isValid) {
              console.log(`✅ Test password "${testPwd}" matches!`);
            }
          } catch (error) {
            console.log(`❌ Error testing password "${testPwd}": ${error.message}`);
          }
        }
      }
      
      console.log('─'.repeat(50));
    }
    
    console.log('\n💡 To login as staff, use:');
    console.log('Email: [staff email from above]');
    console.log('Password: [the password used during registration]');
    
  } catch (error) {
    console.error('❌ Error checking staff credentials:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
}

// Run the script
checkStaffCredentials();