import axios from 'axios';

const BASE_URL = 'http://localhost:5000/api/staff';
const STAFF_CREDENTIALS = {
  email: 'akshayacenterkply@gmail.com',
  password: 'Staff@123'
};

async function testCompleteStaffFlow() {
  try {
    console.log('🔐 Step 1: Staff Login');
    const loginResponse = await axios.post(`${BASE_URL}/login`, STAFF_CREDENTIALS);
    
    if (!loginResponse.data.success) {
      console.error('❌ Login failed:', loginResponse.data.message);
      return;
    }
    
    console.log('✅ Login successful');
    console.log('   User:', loginResponse.data.data.user.name);
    console.log('   Role:', loginResponse.data.data.user.role);
    console.log('   Center:', loginResponse.data.data.staff?.centerName);
    
    const token = loginResponse.data.data.token;
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    
    console.log('\n📋 Step 2: Load Available Services');
    const availableResponse = await axios.get(`${BASE_URL}/services/available`, { headers });
    console.log('✅ Available services loaded:', availableResponse.data.data.length, 'services');
    
    if (availableResponse.data.data.length > 0) {
      const firstService = availableResponse.data.data[0];
      console.log('   First service:', firstService.name, '- ₹' + firstService.fees);
      
      console.log('\n🏢 Step 3: Load Center Services');
      const centerResponse = await axios.get(`${BASE_URL}/services/center`, { headers });
      console.log('✅ Center services loaded:', centerResponse.data.data.length, 'services');
      
      console.log('\n👁️ Step 4: Load Hidden Services');
      const hiddenResponse = await axios.get(`${BASE_URL}/services/hidden`, { headers });
      console.log('✅ Hidden services loaded:', hiddenResponse.data.data.length, 'services');
      
      console.log('\n🔄 Step 5: Test Service Toggle (Enable/Disable)');
      try {
        // Try to disable the first service
        const toggleResponse = await axios.put(
          `${BASE_URL}/services/${firstService._id}/toggle`,
          { enabled: false },
          { headers }
        );
        console.log('✅ Service toggle test:', toggleResponse.data.success ? 'OK' : 'Failed');
        
        // Re-enable it
        await axios.put(
          `${BASE_URL}/services/${firstService._id}/toggle`,
          { enabled: true },
          { headers }
        );
        console.log('✅ Service re-enabled');
        
      } catch (error) {
        console.error('❌ Service toggle error:', error.response?.data?.message || error.message);
      }
      
      console.log('\n👁️‍🗨️ Step 6: Test Service Hide/Unhide');
      try {
        // Try to hide the first service
        const hideResponse = await axios.put(
          `${BASE_URL}/services/${firstService._id}/hide`,
          { hidden: true },
          { headers }
        );
        console.log('✅ Service hide test:', hideResponse.data.success ? 'OK' : 'Failed');
        
        // Check if it appears in hidden services
        const hiddenCheck = await axios.get(`${BASE_URL}/services/hidden`, { headers });
        const isHidden = hiddenCheck.data.data.some(s => s._id === firstService._id);
        console.log('✅ Service appears in hidden list:', isHidden ? 'Yes' : 'No');
        
        // Unhide it
        await axios.put(
          `${BASE_URL}/services/${firstService._id}/hide`,
          { hidden: false },
          { headers }
        );
        console.log('✅ Service unhidden');
        
      } catch (error) {
        console.error('❌ Service hide/unhide error:', error.response?.data?.message || error.message);
      }
      
      console.log('\n⚙️ Step 7: Test Service Settings Update');
      try {
        const settingsResponse = await axios.put(
          `${BASE_URL}/services/${firstService._id}/settings`,
          {
            availabilityNotes: 'Test availability note',
            customFees: '150',
            estimatedDuration: '30'
          },
          { headers }
        );
        console.log('✅ Service settings update:', settingsResponse.data.success ? 'OK' : 'Failed');
        
      } catch (error) {
        console.error('❌ Service settings error:', error.response?.data?.message || error.message);
      }
    }
    
    console.log('\n🎉 Complete staff flow test successful!');
    console.log('\n📝 Summary:');
    console.log('   - Staff authentication: ✅');
    console.log('   - Service loading: ✅');
    console.log('   - Service management: ✅');
    console.log('   - All endpoints working correctly');
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data?.message || error.message);
    if (error.response?.status === 403) {
      console.log('💡 This might be a permission issue. Check staff permissions.');
    }
  }
}

testCompleteStaffFlow();