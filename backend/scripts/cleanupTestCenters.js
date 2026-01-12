import mongoose from 'mongoose';
import AkshayaCenter from '../models/AkshayaCenter.js';
import User from '../models/User.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

async function cleanupTestCenters() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    // Find and delete test centers
    const testCenters = await AkshayaCenter.find({ 
      name: { $regex: /^Test Center/ } 
    });
    
    console.log(`🧹 Found ${testCenters.length} test centers to clean up`);
    
    for (const center of testCenters) {
      console.log(`   Deleting: ${center.name}`);
      await AkshayaCenter.findByIdAndDelete(center._id);
    }
    
    // Find and delete test users
    const testUsers = await User.find({ 
      email: { $regex: /test.*@example\.com|dummy.*@example\.com/ } 
    });
    
    console.log(`🧹 Found ${testUsers.length} test users to clean up`);
    
    for (const user of testUsers) {
      console.log(`   Deleting: ${user.email}`);
      await User.findByIdAndDelete(user._id);
    }
    
    console.log('✅ Cleanup completed');
    await mongoose.disconnect();
    
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    await mongoose.disconnect();
  }
}

cleanupTestCenters();