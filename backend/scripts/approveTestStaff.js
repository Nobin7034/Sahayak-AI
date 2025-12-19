import mongoose from 'mongoose';
import dotenv from 'dotenv';
import AkshayaCenter from '../models/AkshayaCenter.js';
import User from '../models/User.js';
import Staff from '../models/Staff.js';
import connectDB from '../config/db.js';

dotenv.config();

async function approveTestStaff() {
  try {
    // Connect to database
    await connectDB();
    console.log('🔗 Connected to MongoDB');
    
    // Find pending staff
    const pendingStaff = await User.find({ role: 'staff', approvalStatus: 'pending' });
    
    if (pendingStaff.length === 0) {
      console.log('ℹ️  No pending staff registrations found.');
      return;
    }
    
    console.log(`\n👤 Found ${pendingStaff.length} pending staff registration(s):`);
    
    for (const staffUser of pendingStaff) {
      console.log(`\n🔄 Approving: ${staffUser.name} (${staffUser.email})`);
      
      // Find associated center
      const center = await AkshayaCenter.findOne({ registeredBy: staffUser._id });
      if (!center) {
        console.log(`❌ No center found for staff ${staffUser.name}`);
        continue;
      }
      
      // Find staff record
      const staffRecord = await Staff.findOne({ userId: staffUser._id });
      if (!staffRecord) {
        console.log(`❌ No staff record found for ${staffUser.name}`);
        continue;
      }
      
      // Approve the staff user
      staffUser.approvalStatus = 'approved';
      staffUser.isActive = true;
      staffUser.reviewedAt = new Date();
      staffUser.reviewNotes = 'Auto-approved for testing';
      await staffUser.save();
      
      // Activate the center
      center.status = 'active';
      await center.save();
      
      // Activate the staff record
      staffRecord.isActive = true;
      await staffRecord.save();
      
      console.log(`✅ Approved staff: ${staffUser.name}`);
      console.log(`✅ Activated center: ${center.name}`);
      console.log(`📍 Center location: ${center.address.city}, ${center.address.district}`);
      console.log(`🌐 Coordinates: [${center.location.coordinates[0]}, ${center.location.coordinates[1]}]`);
    }
    
    // Verify the results
    const activeCenters = await AkshayaCenter.find({ status: 'active' });
    console.log(`\n🎉 Success! Now ${activeCenters.length} center(s) are active and visible on the map.`);
    
  } catch (error) {
    console.error('❌ Error approving staff:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
}

// Run the approval
approveTestStaff();