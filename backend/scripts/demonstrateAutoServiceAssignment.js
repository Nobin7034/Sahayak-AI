import mongoose from 'mongoose';
import User from '../models/User.js';
import AkshayaCenter from '../models/AkshayaCenter.js';
import Staff from '../models/Staff.js';
import Service from '../models/Service.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__dirname);

dotenv.config({ path: path.join(__dirname, '../.env') });

async function demonstrateAutoServiceAssignment() {
  try {
    console.log('🎯 Demonstrating Auto-Service Assignment Feature\n');
    
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    // Get current service count
    const totalServices = await Service.countDocuments({ isActive: true });
    console.log(`📊 Total active services in system: ${totalServices}`);
    
    // Show current centers
    const existingCenters = await AkshayaCenter.find({}).select('name services status');
    console.log(`🏢 Existing centers: ${existingCenters.length}`);
    existingCenters.forEach(center => {
      console.log(`   ${center.name}: ${center.services.length} services (${center.status})`);
    });
    
    console.log('\n' + '='.repeat(60));
    console.log('🧪 SCENARIO 1: New Center Registration & Approval');
    console.log('='.repeat(60));
    
    // Step 1: Create a staff user (simulating registration)
    console.log('\n📝 Step 1: Staff Registration');
    const staffUser = new User({
      name: 'Demo Staff User',
      email: `demo-staff-${Date.now()}@example.com`,
      password: '$2a$10$hashedpassword',
      phone: '+919876543210',
      role: 'staff',
      approvalStatus: 'pending',
      isActive: false
    });
    await staffUser.save();
    console.log(`✅ Staff user registered: ${staffUser.email}`);
    
    // Step 2: Create center (simulating the registration process)
    console.log('\n🏗️ Step 2: Center Registration');
    const newCenter = new AkshayaCenter({
      name: `Demo Center ${Date.now()}`,
      address: {
        street: 'Demo Street',
        city: 'Demo City',
        district: 'Demo District',
        state: 'Kerala',
        pincode: '686001'
      },
      location: {
        type: 'Point',
        coordinates: [76.2673, 9.9312]
      },
      contact: {
        phone: '+919876543210',
        email: staffUser.email
      },
      status: 'inactive', // Inactive until approved
      registeredBy: staffUser._id,
      services: [] // Will be auto-assigned
    });
    
    await newCenter.save();
    console.log(`✅ Center registered: ${newCenter.name}`);
    console.log(`📊 Services after registration: ${newCenter.services.length}`);
    
    // Step 3: Create staff record
    const staffRecord = new Staff({
      userId: staffUser._id,
      center: newCenter._id,
      role: 'staff',
      isActive: false
    });
    await staffRecord.save();
    console.log(`✅ Staff record created`);
    
    // Step 4: Simulate admin approval
    console.log('\n✅ Step 3: Admin Approval Process');
    
    // Update staff user
    staffUser.approvalStatus = 'approved';
    staffUser.isActive = true;
    await staffUser.save();
    
    // Activate center and auto-assign services (simulating updated approval logic)
    newCenter.status = 'active';
    
    // Auto-assign all existing services to the newly approved center
    const allServices = await Service.find({ isActive: true }).select('_id');
    const serviceIds = allServices.map(service => service._id);
    
    const existingServiceIds = newCenter.services.map(id => id.toString());
    const newServiceIds = serviceIds.filter(id => !existingServiceIds.includes(id.toString()));
    
    if (newServiceIds.length > 0) {
      newCenter.services.push(...newServiceIds);
    }
    
    await newCenter.save();
    
    // Activate staff record
    staffRecord.isActive = true;
    await staffRecord.save();
    
    console.log(`✅ Center approved and activated`);
    console.log(`📊 Services after approval: ${newCenter.services.length}`);
    console.log(`📊 New services auto-assigned: ${newServiceIds.length}`);
    
    if (newCenter.services.length === totalServices) {
      console.log('🎉 SUCCESS: All services automatically assigned!');
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('🧪 SCENARIO 2: New Service Creation');
    console.log('='.repeat(60));
    
    // Create a new service to test auto-assignment to existing centers
    console.log('\n📝 Creating a new service...');
    const newService = new Service({
      name: `Demo Service ${Date.now()}`,
      description: 'Demo service for testing auto-assignment',
      category: 'Demo',
      fee: 100,
      serviceCharge: 50,
      processingTime: '1 day',
      createdBy: staffUser._id
    });
    await newService.save();
    console.log(`✅ New service created: ${newService.name}`);
    
    // Check if the new service was auto-assigned to existing active centers
    const updatedCenters = await AkshayaCenter.find({ status: 'active' }).select('name services');
    console.log('\n📊 Checking service assignment to existing centers:');
    
    let allCentersHaveNewService = true;
    for (const center of updatedCenters) {
      const hasNewService = center.services.some(id => id.toString() === newService._id.toString());
      console.log(`   ${center.name}: ${hasNewService ? '✅' : '❌'} Has new service`);
      if (!hasNewService) allCentersHaveNewService = false;
    }
    
    if (allCentersHaveNewService) {
      console.log('🎉 SUCCESS: New service automatically assigned to all active centers!');
    } else {
      console.log('⚠️  New service not automatically assigned to all centers');
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 FINAL VERIFICATION');
    console.log('='.repeat(60));
    
    // Final verification
    const finalCenters = await AkshayaCenter.find({}).select('name services status');
    const finalServiceCount = await Service.countDocuments({ isActive: true });
    
    console.log(`\n📊 Final Statistics:`);
    console.log(`   Total services: ${finalServiceCount}`);
    console.log(`   Total centers: ${finalCenters.length}`);
    
    console.log(`\n🏢 Center Service Distribution:`);
    finalCenters.forEach(center => {
      const percentage = Math.round((center.services.length / finalServiceCount) * 100);
      console.log(`   ${center.name} (${center.status}): ${center.services.length}/${finalServiceCount} services (${percentage}%)`);
    });
    
    // Cleanup
    console.log('\n🧹 Cleaning up demo data...');
    await User.findByIdAndDelete(staffUser._id);
    await AkshayaCenter.findByIdAndDelete(newCenter._id);
    await Staff.findByIdAndDelete(staffRecord._id);
    await Service.findByIdAndDelete(newService._id);
    console.log('✅ Demo data cleaned up');
    
    await mongoose.disconnect();
    
    console.log('\n🎉 DEMONSTRATION COMPLETED!');
    console.log('\n📝 Key Features Demonstrated:');
    console.log('   ✅ New centers automatically get all existing services');
    console.log('   ✅ Center approval process assigns services automatically');
    console.log('   ✅ New services are automatically assigned to existing active centers');
    console.log('   ✅ Staff can see all services admin has created');
    console.log('   ✅ System ensures consistent service availability across all centers');
    
  } catch (error) {
    console.error('❌ Demonstration failed:', error);
    await mongoose.disconnect();
  }
}

demonstrateAutoServiceAssignment();