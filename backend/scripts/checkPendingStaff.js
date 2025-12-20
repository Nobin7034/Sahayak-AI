import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';

// Load environment variables
dotenv.config({ path: '../.env' });

async function checkPendingStaff() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find all staff users
    const allStaff = await User.find({ role: 'staff' }).select('-password');
    console.log(`\n📊 Found ${allStaff.length} total staff members:`);

    allStaff.forEach(staff => {
      console.log(`   - ${staff.name} (${staff.email})`);
      console.log(`     Status: ${staff.isActive ? 'Active' : 'Inactive'}`);
      console.log(`     Approval: ${staff.approvalStatus || 'Not set'}`);
      console.log(`     ID: ${staff._id}`);
      console.log('     ---');
    });

    // Find pending staff
    const pendingStaff = allStaff.filter(s => s.approvalStatus === 'pending');
    console.log(`\n⏳ Pending staff members: ${pendingStaff.length}`);

    if (pendingStaff.length > 0) {
      console.log('\n📋 Pending staff details:');
      pendingStaff.forEach(staff => {
        console.log(`   - ${staff.name} (${staff.email}) - ID: ${staff._id}`);
      });
    } else {
      console.log('\n💡 No pending staff found. You can create a test staff registration.');
    }

    // Find approved staff
    const approvedStaff = allStaff.filter(s => s.approvalStatus === 'approved');
    console.log(`\n✅ Approved staff members: ${approvedStaff.length}`);

    // Find rejected staff
    const rejectedStaff = allStaff.filter(s => s.approvalStatus === 'rejected');
    console.log(`\n❌ Rejected staff members: ${rejectedStaff.length}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

checkPendingStaff();