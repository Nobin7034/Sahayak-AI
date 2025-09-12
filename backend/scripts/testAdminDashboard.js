import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

const testAdminDashboard = async () => {
  try {
    console.log('🔍 Testing admin dashboard access...');
    
    // Step 1: Login as admin
    console.log('1. Logging in as admin...');
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: 'admin@akshaya.gov.in',
      password: 'admin123',
      role: 'admin'
    });
    
    if (!loginResponse.data.success) {
      console.error('❌ Admin login failed:', loginResponse.data.message);
      return;
    }
    
    console.log('✅ Admin login successful');
    console.log('User:', loginResponse.data.user);
    
    const token = loginResponse.data.token;
    console.log('Token:', token ? 'Present' : 'Missing');
    
    // Step 2: Test dashboard stats endpoint
    console.log('\n2. Testing dashboard stats endpoint...');
    const dashboardResponse = await axios.get(`${API_BASE_URL}/admin/dashboard-stats`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (dashboardResponse.data.success) {
      console.log('✅ Dashboard stats retrieved successfully');
      console.log('Stats:', dashboardResponse.data.data.stats);
    } else {
      console.error('❌ Dashboard stats failed:', dashboardResponse.data.message);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
};

testAdminDashboard();