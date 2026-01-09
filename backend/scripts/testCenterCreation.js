import mongoose from 'mongoose';
import AkshayaCenter from '../models/AkshayaCenter.js';
import Service from '../models/Service.js';
import User from '../models/User.js';
import dotenv from 'dotenv';

dotenv.config();

async function testCenterCreation() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    console.log('\n=== Testing Center Creation Auto-Assignment ===\n');

    // 1. Check current services count
    console.log('1. Checking current services...');
    const allServices = await Service.find({});
    console.log(`Found ${allServices.length} services in the system`);

    // 2. Create a dummy user for the center registration
    console.log('\n2. Creating dummy staff user...');
    const timestamp = Date.now();
    const dummyUser = new User({
      name: 'Test Staff User',
      email: `teststaff${timestamp}@example.com`,
      password: 'hashedpassword',
      role: 'staff',
      isActive: true
    });
    await dummyUser.save();
    console.log(`✅ Created dummy user: ${dummyUser.name} (ID: ${dummyUser._id})`);

    // 3. Create a new center (simulating the center creation route)
    console.log('\n3. Creating a new test center...');
    const testCenter = new AkshayaCenter({
      name: 'Test Auto-Assignment Center',
      address: {
        street: '123 Test Street',
        city: 'Test City',
        district: 'Test District',
        state: 'Kerala',
        pincode: '123456'
      },
      location: {
        type: 'Point',
        coordinates: [76.5, 9.5] // Test coordinates
      },
      contact: {
        phone: '+911234567890',
        email: 'testcenter@example.com'
      },
      registeredBy: dummyUser._id,
      status: 'active' // Set to active for testing
    });

    await testCenter.save();
    console.log(`✅ Created center: ${testCenter.name} (ID: ${testCenter._id})`);

    // 4. Check if services were auto-assigned
    console.log('\n4. Verifying auto-assignment...');
    const centerWithServices = await AkshayaCenter.findById(testCenter._id).populate('services', 'name');
    
    console.log(`Center has ${centerWithServices.services.length} services assigned`);
    console.log(`Expected: ${allServices.length} services`);
    
    if (centerWithServices.services.length === allServices.length) {
      console.log('✅ Auto-assignment successful - all services assigned to new center');
    } else {
      console.log('❌ Auto-assignment incomplete');
    }

    // Show first few services
    console.log('\nAssigned services:');
    centerWithServices.services.slice(0, 5).forEach(service => {
      console.log(`  - ${service.name}`);
    });
    if (centerWithServices.services.length > 5) {
      console.log(`  ... and ${centerWithServices.services.length - 5} more`);
    }

    // 5. Test creating another center to verify consistency
    console.log('\n5. Creating second test center...');
    const testCenter2 = new AkshayaCenter({
      name: 'Second Test Center',
      address: {
        street: '456 Another Street',
        city: 'Another City',
        district: 'Another District',
        state: 'Kerala',
        pincode: '654321'
      },
      location: {
        type: 'Point',
        coordinates: [76.6, 9.6]
      },
      contact: {
        phone: '+919876543210',
        email: 'testcenter2@example.com'
      },
      registeredBy: dummyUser._id,
      status: 'active'
    });

    await testCenter2.save();
    const center2WithServices = await AkshayaCenter.findById(testCenter2._id).populate('services', 'name');
    
    console.log(`✅ Second center created with ${center2WithServices.services.length} services`);

    // 6. Clean up
    console.log('\n6. Cleaning up test data...');
    await AkshayaCenter.findByIdAndDelete(testCenter._id);
    await AkshayaCenter.findByIdAndDelete(testCenter2._id);
    await User.findByIdAndDelete(dummyUser._id);
    console.log('✅ Test data cleaned up');

    console.log('\n🎉 Center creation auto-assignment test completed successfully!');

  } catch (error) {
    console.error('❌ Error during test:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

testCenterCreation();