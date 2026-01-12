import axios from 'axios';

const BASE_URL = 'http://localhost:5000/api/staff';

// Staff login credentials
const STAFF_CREDENTIALS = {
  email: 'akshayacenterkply@gmail.com',
  password: 'Staff@123'
};

async function testStaffServices() {
  try {
    console.log('🔐 Logging in as staff...');
    
    // Login as staff
    const loginResponse = await axios.post(`${BASE_URL}/login`, STAFF_CREDENTIALS);
    
    if (!loginResponse.data.success) {
      console.error('❌ Login failed:', loginResponse.data.message);
      return;
    }
    
    console.log('✅ Login successful');
    const token = loginResponse.data.data.token;
    
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    
    console.log('\n📋 Testing service endpoints...');
    
    // Test available services
    console.log('\n1. Testing available services...');
    try {
      const availableResponse = await axios.get(`${BASE_URL}/services/available`, { headers });
      console.log('✅ Available services:', availableResponse.data.success ? 
        `${availableResponse.data.data.length} services found` : 
        'Failed to fetch');
      
      if (availableResponse.data.success && availableResponse.data.data.length > 0) {
        console.log('   Sample service:', availableResponse.data.data[0].name);
      }
    } catch (error) {
      console.error('❌ Available services error:', error.response?.data?.message || error.message);
    }
    
    // Test center services
    console.log('\n2. Testing center services...');
    try {
      const centerResponse = await axios.get(`${BASE_URL}/services/center`, { headers });
      console.log('✅ Center services:', centerResponse.data.success ? 
        `${centerResponse.data.data.length} services found` : 
        'Failed to fetch');
        
      if (centerResponse.data.success && centerResponse.data.data.length > 0) {
        console.log('   Sample service:', centerResponse.data.data[0].name);
      }
    } catch (error) {
      console.error('❌ Center services error:', error.response?.data?.message || error.message);
    }
    
    // Test hidden services
    console.log('\n3. Testing hidden services...');
    try {
      const hiddenResponse = await axios.get(`${BASE_URL}/services/hidden`, { headers });
      console.log('✅ Hidden services:', hiddenResponse.data.success ? 
        `${hiddenResponse.data.data.length} services found` : 
        'Failed to fetch');
    } catch (error) {
      console.error('❌ Hidden services error:', error.response?.data?.message || error.message);
    }
    
    console.log('\n🎉 Staff services test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data?.message || error.message);
  }
}

testStaffServices();