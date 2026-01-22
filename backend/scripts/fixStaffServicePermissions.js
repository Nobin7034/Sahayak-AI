#!/usr/bin/env node

/**
 * Fix Staff Service Permissions
 * Ensures all staff have the manage_services permission
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
}

async function fixStaffPermissions() {
  console.log('\n🔧 Fixing Staff Service Permissions...\n');

  try {
    // Import models
    const { default: Staff } = await import('../models/Staff.js');
    const { default: User } = await import('../models/User.js');

    // Find all staff records
    const allStaff = await Staff.find({}).populate('userId', 'name email role');
    console.log(`📋 Found ${allStaff.length} staff records`);

    let fixedCount = 0;
    let alreadyCorrectCount = 0;

    for (const staff of allStaff) {
      console.log(`\n👤 Checking staff: ${staff.userId?.name || 'Unknown'} (${staff.userId?.email || 'No email'})`);
      
      // Check if staff has manage_services permission
      const hasManageServices = staff.permissions.some(p => p.action === 'manage_services' && p.granted);
      
      if (hasManageServices) {
        console.log('   ✅ Already has manage_services permission');
        alreadyCorrectCount++;
        continue;
      }

      // Add manage_services permission
      console.log('   🔧 Adding manage_services permission...');
      
      // Check if permission exists but is not granted
      const existingPermission = staff.permissions.find(p => p.action === 'manage_services');
      
      if (existingPermission) {
        // Update existing permission
        existingPermission.granted = true;
        existingPermission.grantedAt = new Date();
        console.log('   📝 Updated existing permission to granted');
      } else {
        // Add new permission
        staff.permissions.push({
          action: 'manage_services',
          granted: true,
          grantedBy: staff.assignedBy,
          grantedAt: new Date()
        });
        console.log('   ➕ Added new manage_services permission');
      }

      // Ensure all default permissions are present
      const defaultPermissions = [
        'manage_appointments',
        'update_status',
        'add_comments',
        'upload_documents',
        'manage_services',
        'view_analytics'
      ];

      for (const permission of defaultPermissions) {
        const hasPermission = staff.permissions.some(p => p.action === permission);
        if (!hasPermission) {
          staff.permissions.push({
            action: permission,
            granted: true,
            grantedBy: staff.assignedBy,
            grantedAt: new Date()
          });
          console.log(`   ➕ Added missing permission: ${permission}`);
        }
      }

      // Save the staff record
      await staff.save();
      console.log('   💾 Saved staff record');
      fixedCount++;
    }

    console.log('\n📊 Summary:');
    console.log(`   ✅ Already correct: ${alreadyCorrectCount}`);
    console.log(`   🔧 Fixed: ${fixedCount}`);
    console.log(`   📋 Total processed: ${allStaff.length}`);

    // Test a staff member's permissions
    if (allStaff.length > 0) {
      console.log('\n🧪 Testing permissions...');
      const testStaff = allStaff[0];
      await testStaff.populate('userId');
      
      console.log(`👤 Testing with: ${testStaff.userId?.name || 'Unknown'}`);
      console.log('   Permissions:');
      
      testStaff.permissions.forEach(p => {
        console.log(`     - ${p.action}: ${p.granted ? '✅ Granted' : '❌ Denied'}`);
      });

      // Test hasPermission method
      const hasManageServices = testStaff.hasPermission('manage_services');
      console.log(`\n   hasPermission('manage_services'): ${hasManageServices ? '✅ True' : '❌ False'}`);
    }

    console.log('\n🎉 Staff permissions fix complete!');

  } catch (error) {
    console.error('❌ Fix failed:', error);
  }
}

async function main() {
  await connectDB();
  await fixStaffPermissions();
  await mongoose.disconnect();
  console.log('\n👋 Disconnected from MongoDB');
}

main().catch(console.error);