import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../models/User.js';
import Staff from '../models/Staff.js';
import AkshayaCenter from '../models/AkshayaCenter.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

async function checkCurrentStaffIssue() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find all active staff users
    const staffUsers = await User.find({ 
      role: 'staff', 
      isActive: true,
      approvalStatus: 'approved'
    });

    console.log(`📊 Found ${staffUsers.length} active approved staff users\n`);

    for (const staffUser of staffUsers) {
      console.log('═══════════════════════════════════════════════════════════');
      console.log(`👤 Staff: ${staffUser.name} (${staffUser.email})`);
      console.log(`   User ID: ${staffUser._id}`);
      
      // Find staff record
      const staffRecord = await Staff.findOne({ userId: staffUser._id }).populate('center');
      
      if (!staffRecord) {
        console.log('   ❌ No staff record found!');
        continue;
      }

      console.log(`   Staff Record ID: ${staffRecord._id}`);
      console.log(`   Center: ${staffRecord.center?.name || 'No center'}`);
      console.log(`   Active: ${staffRecord.isActive}`);
      
      // Check permissions
      console.log('\n   📋 Permissions:');
      staffRecord.permissions.forEach(perm => {
        console.log(`      - ${perm.action}: ${perm.granted ? '✅' : '❌'}`);
      });

      // Check if manage_services permission exists
      const hasManageServices = staffRecord.permissions.some(
        p => p.action === 'manage_services' && p.granted
      );
      
      if (!hasManageServices) {
        console.log('\n   ⚠️  ISSUE FOUND: Missing "manage_services" permission!');
        console.log('   This is why staff cannot access services.');
      }

      // Check center services
      if (staffRecord.center) {
        const center = await AkshayaCenter.findById(staffRecord.center._id);
        console.log(`\n   🏢 Center Services: ${center.services.length} services assigned`);
        
        if (center.services.length === 0) {
          console.log('   ⚠️  WARNING: Center has NO services assigned!');
          console.log('   Admin needs to assign services via AdminCenters page.');
        }
      }
      
      console.log('');
    }

    console.log('═══════════════════════════════════════════════════════════');
    console.log('\n💡 SOLUTION:');
    console.log('1. Run: node scripts/fixAllStaffPermissions.js');
    console.log('   This will add "manage_services" permission to all staff');
    console.log('');
    console.log('2. Admin assigns services via AdminCenters page:');
    console.log('   - Go to Centers page');
    console.log('   - Click "Manage Services" button');
    console.log('   - Enable services for the center');
    console.log('');
    console.log('3. Staff can then access services\n');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

checkCurrentStaffIssue();
