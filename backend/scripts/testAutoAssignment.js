import mongoose from 'mongoose';
import AkshayaCenter from '../models/AkshayaCenter.js';
import Service from '../models/Service.js';
import dotenv from 'dotenv';

dotenv.config();

async function testAutoAssignment() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    console.log('\n=== Testing Auto-Assignment Feature ===\n');

    // 1. Test the sync function
    console.log('1. Testing manual sync of all services to all centers...');
    const syncResult = await AkshayaCenter.autoAssignServicesToAllCenters();
    console.log(`✅ Synced ${syncResult.servicesCount} services to ${syncResult.centersUpdated} centers`);

    // 2. Create a test service to see if it gets auto-assigned
    console.log('\n2. Creating a test service to verify auto-assignment...');
    const testService = new Service({
      name: 'Test Auto-Assignment Service',
      category: 'Test Category',
      description: 'This is a test service to verify auto-assignment functionality',
      fee: 25,
      processingTime: '1-2 days',
      requiredDocuments: ['Test Document'],
      createdBy: new mongoose.Types.ObjectId() // Dummy user ID
    });

    await testService.save();
    console.log(`✅ Created test service: ${testService.name} (ID: ${testService._id})`);

    // 3. Manually assign this service to all centers (simulating the admin route behavior)
    const assignResult = await AkshayaCenter.assignServiceToAllCenters(testService._id);
    console.log(`✅ Auto-assigned test service to ${assignResult.centersUpdated} centers`);

    // 4. Verify the assignment worked
    console.log('\n3. Verifying service assignment...');
    const centers = await AkshayaCenter.find({ status: 'active' }).populate('services', 'name');
    
    centers.forEach((center, index) => {
      console.log(`\n--- Center ${index + 1}: ${center.name} ---`);
      console.log(`Total services: ${center.services.length}`);
      
      const hasTestService = center.services.some(s => s._id.toString() === testService._id.toString());
      console.log(`Has test service: ${hasTestService ? '✅ YES' : '❌ NO'}`);
      
      // Show first few services
      console.log('Services:');
      center.services.slice(0, 5).forEach(service => {
        console.log(`  - ${service.name}`);
      });
      if (center.services.length > 5) {
        console.log(`  ... and ${center.services.length - 5} more`);
      }
    });

    // 5. Clean up - remove the test service
    console.log('\n4. Cleaning up test service...');
    await Service.findByIdAndDelete(testService._id);
    
    // Remove from all centers
    await AkshayaCenter.updateMany(
      {},
      { $pull: { services: testService._id } }
    );
    console.log('✅ Test service cleaned up');

    console.log('\n🎉 Auto-assignment test completed successfully!');

  } catch (error) {
    console.error('❌ Error during test:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

testAutoAssignment();