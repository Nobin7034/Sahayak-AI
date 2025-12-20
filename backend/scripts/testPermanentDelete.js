import axios from 'axios';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '../.env' });

const API_BASE_URL = 'http://localhost:5000/api';

async function testPermanentDelete() {
  console.log('🧪 Testing Permanent Delete Functionality...\n');

  try {
    // Test getting all centers (admin view)
    console.log('🏢 Testing admin centers endpoint...');
    const centersResponse = await axios.get(`${API_BASE_URL}/centers/admin/all`);

    if (centersResponse.data.success) {
      console.log(`✅ Found ${centersResponse.data.centers.length} total centers`);
      
      const activeCenters = centersResponse.data.centers.filter(c => c.status === 'active');
      const inactiveCenters = centersResponse.data.centers.filter(c => c.status === 'inactive');
      
      console.log(`   - Active: ${activeCenters.length}`);
      console.log(`   - Inactive: ${inactiveCenters.length}`);
      
      centersResponse.data.centers.forEach(center => {
        console.log(`   - ${center.name} (${center.status}) - Staff: ${center.registeredBy?.name || 'N/A'}`);
      });

      // Test permanent delete endpoint (without actually deleting)
      if (inactiveCenters.length > 0) {
        console.log('\n🗑️  Testing permanent delete endpoint validation...');
        
        // Try to delete an active center (should fail)
        if (activeCenters.length > 0) {
          try {
            await axios.delete(`${API_BASE_URL}/centers/${activeCenters[0]._id}/permanent`);
            console.log('❌ ERROR: Should not be able to delete active center!');
          } catch (error) {
            if (error.response?.status === 400) {
              console.log('✅ Correctly prevented deletion of active center');
            } else {
              console.log('❓ Unexpected error:', error.response?.data?.message);
            }
          }
        }

        console.log(`\n📋 Found ${inactiveCenters.length} inactive centers that can be permanently deleted:`);
        inactiveCenters.forEach(center => {
          console.log(`   - ${center.name} (ID: ${center._id})`);
        });
      } else {
        console.log('\n📋 No inactive centers found for permanent deletion testing');
      }

    } else {
      console.log('❌ Failed to get centers');
    }

    // Test public endpoint (should only show active)
    console.log('\n🌐 Testing public centers endpoint...');
    const publicCentersResponse = await axios.get(`${API_BASE_URL}/centers`);
    
    if (publicCentersResponse.data.success) {
      console.log(`✅ Public endpoint shows ${publicCentersResponse.data.centers.length} active centers only`);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data?.message || error.message);
  }
}

testPermanentDelete().catch(console.error);