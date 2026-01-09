import mongoose from 'mongoose';
import Service from '../models/Service.js';
import AkshayaCenter from '../models/AkshayaCenter.js';
import dotenv from 'dotenv';

dotenv.config();

async function testServiceCreation() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    console.log('\n=== Testing Service Creation Auto-Assignment ===\n');

    // 1. Check current state
    console.log('1. Checking current state...');
    const centersBefore = await AkshayaCenter.find({ status: 'active' }).populate('services', 'name');
    console.log(`Found ${centersBefore.length} active centers`);
    
    centersBefore.forEach((center, index) => {
      console.log(`  Center ${index + 1}: ${center.name} - ${center.services.length} services`);
    });

    // 2. Create a new service (simulating the admin route behavior)
    console.log('\n2. Creating a new test service...');
    const testService = new Service({
      name: 'API Test Service',
      category: 'Test Category',
      description: 'This service tests the auto-assignment via API',
      fee: 75,
      processingTime: '2-3 days',
      requiredDocuments: ['Test Document 1', 'Test Document 2'],
      createdBy: new mongoose.Types.ObjectId() // Dummy user ID
    });

    await testService.save();
    console.log(`✅ Created service: ${testService.name} (ID: ${testService._id})`);

    // 3. Auto-assign to all centers (this is what the admin route should do)
    console.log('\n3. Auto-assigning service to all active centers...');
    const assignResult = await AkshayaCenter.assignServiceToAllCenters(testService._id);
    console.log(`✅ Service assigned to ${assignResult.centersUpdated} centers`);

    // 4. Verify the assignment
    console.log('\n4. Verifying assignment...');
    const centersAfter = await AkshayaCenter.find({ status: 'active' }).populate('services', 'name');
    
    centersAfter.forEach((center, index) => {
      console.log(`\n--- Center ${index + 1}: ${center.name} ---`);
      console.log(`Total services: ${center.services.length}`);
      
      const hasTestService = center.services.some(s => s._id.toString() === testService._id.toString());
      console.log(`Has new test service: ${hasTestService ? '✅ YES' : '❌ NO'}`);
    });

    // 5. Test the sync endpoint functionality
    console.log('\n5. Testing sync endpoint functionality...');
    const syncResult = await AkshayaCenter.autoAssignServicesToAllCenters();
    console.log(`✅ Sync completed: ${syncResult.servicesCount} services synced to ${syncResult.centersUpdated} centers`);

    // 6. Clean up
    console.log('\n6. Cleaning up...');
    await Service.findByIdAndDelete(testService._id);
    await AkshayaCenter.updateMany(
      {},
      { $pull: { services: testService._id } }
    );
    console.log('✅ Test service cleaned up');

    console.log('\n🎉 Service creation auto-assignment test completed successfully!');

  } catch (error) {
    console.error('❌ Error during test:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

testServiceCreation();