import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import connectDB from '../config/db.js';

dotenv.config();

async function resetStaffPasswords() {
  try {
    // Connect to database
    await connectDB();
    console.log('🔗 Connected to MongoDB');
    
    // Find all staff users
    const staffUsers = await User.find({ role: 'staff' });
    console.log(`\n👤 Found ${staffUsers.length} staff users`);
    
    const newPassword = 'staff123'; // Simple password for testing
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    for (const staff of staffUsers) {
      console.log(`\n🔄 Updating password for: ${staff.name}`);
      console.log(`📧 Email: ${staff.email}`);
      
      staff.password = hashedPassword;
      await staff.save();
      
      console.log(`✅ Password updated to: ${newPassword}`);
    }
    
    console.log('\n🎉 All staff passwords have been reset!');
    console.log('\n💡 Staff Login Credentials:');
    
    for (const staff of staffUsers) {
      console.log(`\n📧 Email: ${staff.email}`);
      console.log(`🔑 Password: ${newPassword}`);
      console.log(`👤 Name: ${staff.name}`);
    }
    
  } catch (error) {
    console.error('❌ Error resetting passwords:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
}

// Run the script
resetStaffPasswords();