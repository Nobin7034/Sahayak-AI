import mongoose from 'mongoose';
import dotenv from 'dotenv';
import AkshayaCenter from '../models/AkshayaCenter.js';
import User from '../models/User.js';
import Staff from '../models/Staff.js';
import connectDB from '../config/db.js';

dotenv.config();

async function verifyMapCenters() {
  try {
    // Connect to database
    await connectDB();
    console.log('🔗 Connected to MongoDB');
    
    // Check all centers
    const allCenters = await AkshayaCenter.find({});
    console.log(`\n📍 Total Centers in Database: ${allCenters.length}`);
    
    // Check active centers (what users see on map)
    const activeCenters = await AkshayaCenter.find({ status: 'active' });
    console.log(`✅ Active Centers (visible on map): ${activeCenters.length}`);
    
    // Check inactive centers
    const inactiveCenters = await AkshayaCenter.find({ status: 'inactive' });
    console.log(`⏳ Inactive Centers (pending approval): ${inactiveCenters.length}`);
    
    // Check staff registrations
    const pendingStaff = await User.find({ role: 'staff', approvalStatus: 'pending' });
    console.log(`👤 Pending Staff Registrations: ${pendingStaff.length}`);
    
    const approvedStaff = await User.find({ role: 'staff', approvalStatus: 'approved' });
    console.log(`✅ Approved Staff: ${approvedStaff.length}`);
    
    console.log('\n📋 Active Centers Details:');
    activeCenters.forEach((center, index) => {
      console.log(`${index + 1}. ${center.name}`);
      console.log(`   📍 Location: ${center.address.city}, ${center.address.district}`);
      console.log(`   🌐 Coordinates: [${center.location.coordinates[0]}, ${center.location.coordinates[1]}]`);
      console.log(`   📞 Contact: ${center.contact.phone}`);
      console.log(`   📧 Email: ${center.contact.email}`);
      if (center.registeredBy) {
        console.log(`   👤 Registered by Staff ID: ${center.registeredBy}`);
      }
      console.log('');
    });
    
    if (inactiveCenters.length > 0) {
      console.log('\n⏳ Inactive Centers (Pending Approval):');
      for (const center of inactiveCenters) {
        const staffUser = await User.findById(center.registeredBy);
        console.log(`• ${center.name} - ${center.address.city}`);
        console.log(`  Registered by: ${staffUser?.name || 'Unknown'} (${staffUser?.email || 'No email'})`);
        console.log(`  Status: ${staffUser?.approvalStatus || 'Unknown'}`);
        console.log('');
      }
    }
    
    // Test API endpoint simulation
    console.log('\n🧪 API Endpoint Test:');
    console.log('GET /api/centers would return:', activeCenters.length, 'centers');
    console.log('These centers would be visible on the map to all users.');
    
    if (activeCenters.length === 0) {
      console.log('\n⚠️  WARNING: No active centers found!');
      console.log('Users will see an empty map.');
      console.log('To fix this:');
      console.log('1. Run: node backend/scripts/seedCenters.js (to add sample centers)');
      console.log('2. Or approve pending staff registrations in admin panel');
    }
    
  } catch (error) {
    console.error('❌ Error verifying centers:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
}

// Run the verification
verifyMapCenters();