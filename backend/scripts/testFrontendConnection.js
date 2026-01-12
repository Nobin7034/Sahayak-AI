import axios from 'axios';

async function testFrontendConnection() {
  try {
    console.log('🌐 Testing frontend to backend connection...');
    
    // Test staff login endpoint (this should work)
    const loginData = {
      email: 'akshayacenterkply@gmail.com',
      password: 'Staff@123'
    };
    
    const loginResponse = await axios.post('http://localhost:5000/api/staff/login', loginData);
    console.log('✅ Staff login endpoint:', loginResponse.data.success ? 'OK' : 'Failed');
    
    if (loginResponse.data.success) {
      const token = loginResponse.data.data.token;
      
      // Test services endpoint
      const servicesResponse = await axios.get('http://localhost:5000/api/staff/services/available', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('✅ Services endpoint:', servicesResponse.data.success ? 
        `OK (${servicesResponse.data.data.length} services)` : 'Failed');
    }
    
  } catch (error) {
    console.error('❌ Connection test failed:', error.response?.data?.message || error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 Backend server might not be running on port 5000');
    }
  }
}

testFrontendConnection();