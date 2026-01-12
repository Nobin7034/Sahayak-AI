import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Staff from '../models/Staff.js';
import User from '../models/User.js';

dotenv.config();

async function checkAllStaffPermissions() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find all staff records
    const staffRecords = await Staff.find({}).populate('userId', 'name email').populate('center', 'name');

    console.log(`\nFound ${staffRecords.length} staff records:\n`);

    for (const staff of staffRecords) {
      console.log(`👤 Staff: ${staff.userId.name} (${staff.userId.email})`);
      console.log(`🏢 Center: ${staff.center.name}`);
      console.log(`📊 Status: ${staff.isActive ? 'Active' : 'Inactive'}`);
      console.log(`🔑 Permissions:`);
      
      const permissions = staff.permissions || {};
      const requiredPermissions = ['manage_services', 'manage_appointments', 'upload_documents'];
      
      for (const perm of requiredPermissions) {
        const hasPermission = permissions[perm] === true;
        console.log(`   - ${perm}: ${hasPermission ? '✅' : '❌'}`);
      }
      
      // Check if staff needs permission updates
      const needsUpdate = !permissions.manage_services || !permissions.manage_appointments || !permissions.upload_documents;
      
      if (needsUpdate) {
        console.log('🔧 Updating permissions...');
        staff.permissions = {
          ...staff.permissions,
          manage_services: true,
          manage_appointments: true,
          upload_documents: true,
          update_status: true,
          add_comments: true,
          view_analytics: true
        };
        await staff.save();
        console.log('✅ Permissions updated');
      }
      
      console.log('---');
    }

    console.log('\n🎉 All staff permissions checked and updated!');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

checkAllStaffPermissions();