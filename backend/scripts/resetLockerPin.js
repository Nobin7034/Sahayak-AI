import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from '../config/db.js';
import DocumentLocker from '../models/DocumentLocker.js';
import User from '../models/User.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const resetLockerPin = async () => {
  try {
    console.log('🔄 Resetting Locker PIN...\n');
    
    // Connect to database
    await connectDB();
    
    // Find user by email
    const user = await User.findOne({ email: 'nobinrajeev431@gmail.com' });
    
    if (!user) {
      console.log('❌ User not found');
      process.exit(1);
    }
    
    console.log('✅ Found user:', user.name);
    
    // Find locker
    const locker = await DocumentLocker.findOne({ user: user._id });
    
    if (!locker) {
      console.log('❌ No locker found for this user');
      process.exit(1);
    }
    
    console.log('✅ Found locker');
    
    // Reset PIN to 1111
    const newPin = '1111';
    locker.lockerPin = newPin;
    
    // Also reset failed attempts
    locker.failedAttempts.count = 0;
    locker.failedAttempts.lastAttempt = null;
    locker.failedAttempts.lockedUntil = null;
    
    await locker.save();
    
    console.log('\n✅ PIN reset successfully!');
    console.log('   New PIN: 1111');
    console.log('   Failed attempts cleared');
    console.log('\n💡 You can now use PIN "1111" to unlock your locker');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

resetLockerPin();
