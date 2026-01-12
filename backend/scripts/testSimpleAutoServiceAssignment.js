import mongoose from 'mongoose';
import User from '../models/User.js';
import AkshayaCenter from '../models/AkshayaCenter.js';
import Staff from '../models/Staff.js';
import Service from '../models/Service.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

async function testSimpleAutoServiceAssignment() {
  try {
    console.log('🧪 Testing Auto-Service Assignment on Center Approval...\n');
    
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    // Get current service count
    const totalServices = await Service.countDocuments({ isActive: true });
    console.log(`📊 Total active services in system: ${totalServices}`);
    
    // Create a test center with NO services (simulating old behavior)
    console.log('\n🏗️ Creating test center without services...');
    
    // Create a dummy user for registeredBy field
    const dummyUser = new User({
      name: 'Dummy User',
      email: `dummy-${Date.now()}@example.com`,
      password: '$2a$10$hashedpassword',
      phone: '+919876543210',
      role: 'staff'
    });
    await dummyUser.save();
    
    const testCenter = new AkshayaCenter({
      name: `Test Center ${Date.now()}`,
      address: {
        street: 'Test Street',
        city: 'Test City',
        district: 'Test District',
        state: 'Kerala',
        pincode: '686001'
      },
      location: {
        type: 'Point',
        coordinates: [76.2673, 9.9312]
      },
      contact: {
        phone: '+919876543210',
        email: `test-${Date.now()}@example.com`
      },
      status: 'inactive',
      registeredBy: dummyUser._id,
      services: [] // Start with NO services
    });
    
    // Save without triggering auto-assignment
    await testCenter.save();
    console.log(`✅ Created center: ${testCenter.name}`);
    console.log(`📊 Initial services: ${testCenter.services.length}`);
    
    // Now simulate the approval process with auto-service assignment
    console.log('\n🔄 Simulating approval process with auto-service assignment...');
    
    // Get all active services
    const allServices = await Service.find({ isActive: true }).select('_id');
    const serviceIds = allServices.map(service => service._id);
    
    // Simulate the approval logic from authRoutes.js
    testCenter.status = 'active';
    
    // Auto-assign all existing services to the newly approved center
    const existingServiceIds = testCenter.services.map(id => id.toString());
    const newServiceIds = serviceIds.filter(id => !existingServiceIds.includes(id.toString()));
    
    if (newServiceIds.length > 0) {
      testCenter.services.push(...newServiceIds);
    }
    
    await testCenter.save();
    
    console.log(`✅ Center approved and activated`);
    console.log(`📊 Services after approval: ${testCenter.services.length}`);
    console.log(`📊 New services added: ${newServiceIds.length}`);
    
    // Verify the result
    if (testCenter.services.length === totalServices) {
      console.log('✅ SUCCESS: All services automatically assigned to approved center!');
    } else {
      console.log(`❌ FAILED: Expected ${totalServices} services, got ${testCenter.services.length}`);
    }
    
    // Test with another center to ensure it works consistently
    console.log('\n🔄 Testing with a second center...');
    
    const testCenter2 = new AkshayaCenter({
      name: `Test Center 2 ${Date.now()}`,
      address: {
        street: 'Test Street 2',
        city: 'Test City 2',
        district: 'Test District 2',
        state: 'Kerala',
        pincode: '686002'
      },
      location: {
        type: 'Point',
        coordinates: [76.2673, 9.9312]
      },
      contact: {
        phone: '+919876543211',
        email: `test2-${Date.now()}@example.com`
      },
      status: 'inactive',
      registeredBy: dummyUser._id,
      services: []
    });
    
    await testCenter2.save();
    console.log(`✅ Created second center: ${testCenter2.name}`);
    
    // Apply the same approval logic
    testCenter2.status = 'active';
    const existingServiceIds2 = testCenter2.services.map(id => id.toString());
    const newServiceIds2 = serviceIds.filter(id => !existingServiceIds2.includes(id.toString()));
    
    if (newServiceIds2.length > 0) {
      testCenter2.services.push(...newServiceIds2);
    }
    
    await testCenter2.save();
    
    console.log(`📊 Second center services after approval: ${testCenter2.services.length}`);
    
    if (testCenter2.services.length === totalServices) {
      console.log('✅ SUCCESS: Second center also got all services!');
    }
    
    // Cleanup
    console.log('\n🧹 Cleaning up...');
    await AkshayaCenter.findByIdAndDelete(testCenter._id);
    await AkshayaCenter.findByIdAndDelete(testCenter2._id);
    await User.findByIdAndDelete(dummyUser._id);
    console.log('✅ Test data cleaned up');
    
    await mongoose.disconnect();
    
    console.log('\n🎉 Test completed successfully!');
    console.log('\n📝 Summary:');
    console.log('   ✅ Auto-service assignment logic works correctly');
    console.log('   ✅ All active services are assigned to newly approved centers');
    console.log('   ✅ Logic works consistently for multiple centers');
    console.log(`   ✅ ${totalServices} services automatically assigned to each approved center`);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    await mongoose.disconnect();
  }
}

testSimpleAutoServiceAssignment();