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

async function fixAllStaffPermissions() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Find all staff users
    const staffUsers = await User.find({ role: 'staff' });
    console.log(`Found ${staffUsers.length} staff users`);
    
    for (const user of staffUsers) {
      const staff = await Staff.findOne({ userId: user._id }).populate('center', 'name');
      
      if (!staff) {
        console.log(`⚠️  No staff record for user: ${user.name}`);
        continue;
      }
      
      console.log(`\n👤 Checking: ${user.name} (${staff.center?.name || 'No center'})`);
      
      // Check and fix manage_services permission
      const manageServicesPermission = staff.permissions.find(p => p.action === 'manage_services');
      
      if (!manageServicesPermission) {
        console.log('  ❌ manage_services permission missing - ADDING');
        staff.permissions.push({
          action: 'manage_services',
          granted: true,
          grantedBy: staff.assignedBy,
          grantedAt: new Date()
        });
        await staff.save();
        console.log('  ✅ Added manage_services permission');
      } else if (!manageServicesPermission.granted) {
        console.log('  ❌ manage_services permission denied - ENABLING');
        manageServicesPermission.granted = true;
        manageServicesPermission.grantedAt = new Date();
        await staff.save();
        console.log('  ✅ Enabled manage_services permission');
      } else {
        console.log('  ✅ manage_services permission already granted');
      }
      
      // Check upload_documents permission
      const uploadDocsPermission = staff.permissions.find(p => p.action === 'upload_documents');
      
      if (!uploadDocsPermission) {
        console.log('  ❌ upload_documents permission missing - ADDING');
        staff.permissions.push({
          action: 'upload_documents',
          granted: true,
          grantedBy: staff.assignedBy,
          grantedAt: new Date()
        });
        await staff.save();
        console.log('  ✅ Added upload_documents permission');
      } else if (!uploadDocsPermission.granted) {
        console.log('  ❌ upload_documents permission denied - ENABLING');
        uploadDocsPermission.granted = true;
        uploadDocsPermission.grantedAt = new Date();
        await staff.save();
        console.log('  ✅ Enabled upload_documents permission');
      } else {
        console.log('  ✅ upload_documents permission already granted');
      }
    }
    
    console.log('\n✅ All staff permissions fixed!');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

fixAllStaffPermissions();
