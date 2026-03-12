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

const unlockUserLocker = async () => {
  try {
    console.log('🔓 Unlocking User Locker...\n');
    
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
    console.log('   Failed attempts:', locker.failedAttempts.count);
    console.log('   Locked until:', locker.failedAttempts.lockedUntil);
    
    // Reset failed attempts
    locker.failedAttempts.count = 0;
    locker.failedAttempts.lastAttempt = null;
    locker.failedAttempts.lockedUntil = null;
    
    await locker.save();
    
    console.log('\n✅ Locker unlocked successfully!');
    console.log('   You can now try entering your PIN again');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

unlockUserLocker();
