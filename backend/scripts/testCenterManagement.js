import axios from 'axios';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '../.env' });

const API_BASE_URL = 'http://localhost:5000/api';

async function testCenterManagement() {
  console.log('🧪 Testing Center Management System...\n');

  try {
    // Test public centers endpoint (should only show active)
    console.log('🌐 Testing public centers endpoint...');
    const publicCentersResponse = await axios.get(`${API_BASE_URL}/centers`);
    
    if (publicCentersResponse.data.success) {
      console.log(`✅ Public endpoint: Found ${publicCentersResponse.data.centers.length} active centers`);
      publicCentersResponse.data.centers.forEach(center => {
        console.log(`   - ${center.name} (${center.status})`);
      });
    }

    // Test staff login to get a staff token
    console.log('\n👤 Testing staff login...');
    const staffLoginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: 'akshayacenterkply@gmail.com',
      password: 'staff123'
    });

    if (staffLoginResponse.data.success) {
      console.log('✅ Staff login successful');
      console.log(`   Staff: ${staffLoginResponse.data.user.name}`);
      console.log(`   Role: ${staffLoginResponse.data.user.role}`);
      console.log(`   Active: ${staffLoginResponse.data.user.isActive}`);
    }

    // Test admin login for admin endpoints
    console.log('\n🔐 Testing admin access...');
    
    // Try to get admin centers (this might fail if no admin user exists)
    try {
      const adminCentersResponse = await axios.get(`${API_BASE_URL}/centers/admin/all`, {
        headers: {
          'Authorization': `Bearer ${staffLoginResponse.data.token}` // This should fail
        }
      });
      console.log('⚠️  Staff was able to access admin endpoint (security issue!)');
    } catch (adminError) {
      if (adminError.response?.status === 403 || adminError.response?.status === 401) {
        console.log('✅ Staff correctly denied access to admin endpoint');
      } else {
        console.log('❓ Unexpected error accessing admin endpoint:', adminError.response?.data?.message);
      }
    }

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data?.message || error.message);
  }
}

testCenterManagement().catch(console.error);