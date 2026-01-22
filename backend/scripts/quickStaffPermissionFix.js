#!/usr/bin/env node

/**
 * Quick Staff Permission Fix
 * Quickly fixes staff permissions for testing
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

async function quickFix() {
  try {
    // Import models
    const { default: Staff } = await import('../models/Staff.js');
    const { default: User } = await import('../models/User.js');

    // Find all active staff
    const staffRecords = await Staff.find({ isActive: true }).populate('userId', 'name email');
    console.log(`Found ${staffRecords.length} active staff records`);

    for (const staff of staffRecords) {
      console.log(`\nFixing permissions for: ${staff.userId?.name || 'Unknown'}`);
      
      // Ensure manage_services permission exists and is granted
      const manageServicesPermission = staff.permissions.find(p => p.action === 'manage_services');
      
      if (!manageServicesPermission) {
        staff.permissions.push({
          action: 'manage_services',
          granted: true,
          grantedBy: staff.assignedBy,
          grantedAt: new Date()
        });
        console.log('  ➕ Added manage_services permission');
      } else if (!manageServicesPermission.granted) {
        manageServicesPermission.granted = true;
        manageServicesPermission.grantedAt = new Date();
        console.log('  ✅ Enabled manage_services permission');
      } else {
        console.log('  ✅ manage_services permission already correct');
      }

      await staff.save();
    }

    console.log('\n🎉 Quick fix complete!');

  } catch (error) {
    console.error('❌ Quick fix failed:', error);
  }
}

async function main() {
  await connectDB();
  await quickFix();
  await mongoose.disconnect();
  console.log('👋 Disconnected from MongoDB');
}

main().catch(console.error);