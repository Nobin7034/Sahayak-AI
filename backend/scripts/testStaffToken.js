import axios from 'axios';

const API_BASE = 'http://localhost:5000/api';

async function testStaffToken() {
  try {
    console.log('🔐 Testing Staff Token Authentication...\n');

    // 1. Login as staff
    console.log('1. Logging in as staff...');
    const loginResponse = await axios.post(`${API_BASE}/staff/login`, {
      email: 'akshayacenterkply@gmail.com',
      password: 'Staff@123'
    });

    console.log('Login response:', JSON.stringify(loginResponse.data, null, 2));

    if (!loginResponse.data.success) {
      throw new Error('Staff login failed');
    }

    const staffToken = loginResponse.data.data.token;
    console.log('✓ Staff login successful');
    console.log('Token:', staffToken.substring(0, 20) + '...');

    // 2. Test token with a simple endpoint
    console.log('\n2. Testing token with dashboard endpoint...');
    const dashboardResponse = await axios.get(`${API_BASE}/staff/dashboard`, {
      headers: { 'Authorization': `Bearer ${staffToken}` }
    });

    console.log('Dashboard response status:', dashboardResponse.status);
    console.log('Dashboard response success:', dashboardResponse.data.success);

    // 3. Test appointments endpoint
    console.log('\n3. Testing appointments endpoint...');
    const appointmentsResponse = await axios.get(`${API_BASE}/staff/appointments`, {
      headers: { 'Authorization': `Bearer ${staffToken}` }
    });

    console.log('Appointments response status:', appointmentsResponse.status);
    console.log('Appointments response success:', appointmentsResponse.data.success);
    console.log('Appointments count:', appointmentsResponse.data.data?.appointments?.length || 0);

    console.log('\n✅ Token authentication working correctly!');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Headers:', error.response.headers);
    }
  }
}

testStaffToken();