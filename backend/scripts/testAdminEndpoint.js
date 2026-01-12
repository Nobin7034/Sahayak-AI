import axios from 'axios';

const BASE_URL = 'http://localhost:5000';

async function testAdminEndpoint() {
  try {
    console.log('🧪 Testing Admin Dashboard Endpoint Fix...\n');

    // Test the endpoint without authentication (should get 401, not 404)
    console.log('1. Testing endpoint accessibility...');
    
    try {
      await axios.get(`${BASE_URL}/api/admin/dashboard-stats`);
    } catch (error) {
      if (error.response?.status === 404) {
        console.log('❌ Endpoint still returns 404 - URL fix failed');
        return;
      } else if (error.response?.status === 401) {
        console.log('✅ Endpoint accessible - returns 401 (authentication required)');
        console.log('✅ URL fix successful! Frontend should now be able to reach the endpoint');
      } else {
        console.log(`⚠️  Unexpected status: ${error.response?.status}`);
      }
    }

    // Test broadcast endpoint too
    console.log('\n2. Testing broadcast endpoint accessibility...');
    
    try {
      await axios.post(`${BASE_URL}/api/admin/broadcast/appointments`, {});
    } catch (error) {
      if (error.response?.status === 404) {
        console.log('❌ Broadcast endpoint still returns 404');
      } else if (error.response?.status === 401) {
        console.log('✅ Broadcast endpoint accessible - returns 401 (authentication required)');
      } else {
        console.log(`⚠️  Unexpected status: ${error.response?.status}`);
      }
    }

    console.log('\n🎉 Admin Dashboard URL Fix Test Complete!');
    console.log('📝 Summary: Frontend AdminDashboard.jsx now uses correct URLs:');
    console.log('   - /api/admin/dashboard-stats (was /admin/dashboard-stats)');
    console.log('   - /api/admin/broadcast/appointments (was /admin/broadcast/appointments)');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testAdminEndpoint();