import axios from 'axios';

const testSettingsAPI = async () => {
  try {
    console.log('Testing Settings API endpoints...\n');

    // Test 1: Get settings (should work without auth for testing)
    console.log('1. Testing GET /api/admin/settings...');
    try {
      const response = await axios.get('http://localhost:5000/api/admin/settings');
      console.log('✅ GET /api/admin/settings - Success');
      console.log(`   Response status: ${response.status}`);
      console.log(`   Settings loaded: ${response.data.success}`);
      if (response.data.data) {
        console.log(`   Site name: ${response.data.data.siteName}`);
        console.log(`   Maintenance mode: ${response.data.data.maintenanceMode}`);
      }
    } catch (error) {
      console.log('❌ GET /api/admin/settings - Failed');
      console.log(`   Status: ${error.response?.status}`);
      console.log(`   Error: ${error.response?.data?.message || error.message}`);
    }

    // Test 2: Get public settings
    console.log('\n2. Testing GET /api/admin/settings/public...');
    try {
      const response = await axios.get('http://localhost:5000/api/admin/settings/public');
      console.log('✅ GET /api/admin/settings/public - Success');
      console.log(`   Response status: ${response.status}`);
      console.log(`   Public settings loaded: ${response.data.success}`);
      if (response.data.data) {
        console.log(`   Site name: ${response.data.data.siteName}`);
        console.log(`   Maintenance mode: ${response.data.data.maintenanceMode}`);
      }
    } catch (error) {
      console.log('❌ GET /api/admin/settings/public - Failed');
      console.log(`   Status: ${error.response?.status}`);
      console.log(`   Error: ${error.response?.data?.message || error.message}`);
    }

    // Test 3: Test server health
    console.log('\n3. Testing server health...');
    try {
      const response = await axios.get('http://localhost:5000/');
      console.log('✅ Server is responding');
      console.log(`   Response status: ${response.status}`);
    } catch (error) {
      console.log('❌ Server not responding');
      console.log(`   Error: ${error.message}`);
    }

  } catch (error) {
    console.error('Test failed:', error.message);
  }
};

testSettingsAPI();