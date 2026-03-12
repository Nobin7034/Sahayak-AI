import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from '../config/db.js';
import DocumentLocker from '../models/DocumentLocker.js';
import User from '../models/User.js';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const checkLockerPin = async () => {
  try {
    console.log('🔍 Checking Locker PIN...\n');
    
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
    console.log('   Locker ID:', locker._id);
    console.log('   Created:', locker.createdAt);
    console.log('   Hashed PIN:', locker.lockerPin.substring(0, 20) + '...');
    
    // Test common PINs
    const testPins = ['1234', '0000', '1111', '2222', '4321'];
    
    console.log('\n🧪 Testing common PINs...');
    for (const pin of testPins) {
      const isValid = await locker.verifyPin(pin);
      if (isValid) {
        console.log(`✅ PIN "${pin}" is CORRECT!`);
        process.exit(0);
      } else {
        console.log(`❌ PIN "${pin}" is incorrect`);
      }
    }
    
    console.log('\n⚠️  None of the common PINs matched');
    console.log('   You may need to reset your PIN');
    
    // Offer to reset PIN
    console.log('\n💡 To reset your PIN to "1234", run:');
    console.log('   node backend/scripts/resetLockerPin.js');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

checkLockerPin();
