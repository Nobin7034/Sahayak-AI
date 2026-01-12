import mongoose from 'mongoose';
import Staff from '../models/Staff.js';
import User from '../models/User.js';
import AkshayaCenter from '../models/AkshayaCenter.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

async function fixSecondStaffPermissions() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log('Connected to MongoDB');
    
    // Find the second staff user
    const user = await User.findOne({ email: 'akshayamundakayam@gmail.com' });
    if (!user) {
      console.log('❌ Second staff user not found');
      return;
    }
    
    console.log('✅ Found user:', user.name, user.email);
    
    // Find staff record
    const staff = await Staff.findOne({ userId: user._id }).populate('center', 'name');
    if (!staff) {
      console.log('❌ Staff record not found');
      return;
    }
    
    console.log('✅ Found staff record for center:', staff.center?.name);
    
    // Check current permissions
    console.log('\n📋 Current permissions:');
    staff.permissions.forEach(p => {
      console.log(`  - ${p.action}: ${p.granted}`);
    });
    
    // Add missing permissions
    const requiredPermissions = [
      'manage_services',
      'upload_documents'
    ];
    
    let permissionsAdded = 0;
    
    for (const permission of requiredPermissions) {
      const existingPermission = staff.permissions.find(p => p.action === permission);
      
      if (!existingPermission) {
        console.log(`\n➕ Adding missing permission: ${permission}`);
        staff.permissions.push({
          action: permission,
          granted: true,
          grantedBy: staff.assignedBy,
          grantedAt: new Date()
        });
        permissionsAdded++;
      } else if (!existingPermission.granted) {
        console.log(`\n✅ Enabling denied permission: ${permission}`);
        existingPermission.granted = true;
        existingPermission.grantedAt = new Date();
        permissionsAdded++;
      } else {
        console.log(`\n✅ Permission already granted: ${permission}`);
      }
    }
    
    if (permissionsAdded > 0) {
      await staff.save();
      console.log(`\n🎉 Successfully updated ${permissionsAdded} permissions for ${user.email}`);
    } else {
      console.log('\n✅ All required permissions already granted');
    }
    
    // Show final permissions
    console.log('\n📋 Final permissions:');
    staff.permissions.forEach(p => {
      console.log(`  - ${p.action}: ${p.granted}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

fixSecondStaffPermissions();