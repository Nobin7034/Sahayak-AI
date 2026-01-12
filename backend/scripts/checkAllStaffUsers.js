import mongoose from 'mongoose';
import User from '../models/User.js';
import Staff from '../models/Staff.js';
import AkshayaCenter from '../models/AkshayaCenter.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

async function checkAllStaffUsers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000, // 5 second timeout
    });
    console.log('Connected to MongoDB');
    
    // Find all users with staff role
    const staffUsers = await User.find({ role: 'staff' }).select('name email isActive');
    console.log(`\n📋 Found ${staffUsers.length} staff users:`);
    
    for (const user of staffUsers) {
      console.log(`\n👤 User: ${user.name} (${user.email})`);
      console.log(`   Active: ${user.isActive}`);
      
      // Find staff record
      const staffRecord = await Staff.findOne({ userId: user._id }).populate('center', 'name status');
      
      if (staffRecord) {
        console.log(`   📍 Center: ${staffRecord.center?.name || 'Unknown'}`);
        console.log(`   📍 Center Status: ${staffRecord.center?.status || 'Unknown'}`);
        console.log(`   📍 Staff Active: ${staffRecord.isActive}`);
        
        // Check permissions
        const manageServicesPermission = staffRecord.permissions.find(p => p.action === 'manage_services');
        console.log(`   🔑 manage_services: ${manageServicesPermission?.granted || 'NOT FOUND'}`);
        
        // Check center services
        if (staffRecord.center) {
          const center = await AkshayaCenter.findById(staffRecord.center._id);
          if (center) {
            console.log(`   📊 Center Services: ${center.services?.length || 0}`);
            console.log(`   🙈 Hidden Services: ${center.hiddenServices?.length || 0}`);
          }
        }
      } else {
        console.log(`   ❌ No staff record found`);
      }
    }
    
    // Check all centers
    console.log(`\n\n🏢 All Centers:`);
    const allCenters = await AkshayaCenter.find({}).select('name status services hiddenServices');
    
    for (const center of allCenters) {
      console.log(`\n🏢 ${center.name}`);
      console.log(`   Status: ${center.status}`);
      console.log(`   Services: ${center.services?.length || 0}`);
      console.log(`   Hidden: ${center.hiddenServices?.length || 0}`);
      
      // Find staff for this center
      const centerStaff = await Staff.find({ center: center._id }).populate('userId', 'email name');
      console.log(`   Staff: ${centerStaff.map(s => s.userId?.email || 'Unknown').join(', ')}`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

checkAllStaffUsers();