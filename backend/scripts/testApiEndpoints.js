import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000';

async function testApiEndpoints() {
  try {
    console.log('🔍 Testing API endpoint accessibility...\n');

    // Test the endpoints that Profile.jsx uses
    const endpoints = [
      '/api/auth/me',
      '/auth/me' // This should fail
    ];

    // First, create a test user and get a token
    const testUser = {
      firstName: 'API',
      lastName: 'Test',
      email: 'apitest@example.com',
      password: 'testpassword123',
      accountType: 'user'
    };

    let token = null;

    try {
      const registerResponse = await axios.post(`${API_BASE_URL}/api/auth/register`, testUser);
      token = registerResponse.data.token;
      console.log('✅ Test user created and token obtained');
    } catch (error) {
      if (error.response?.data?.message?.includes('already exists')) {
        // Try to login
        const loginResponse = await axios.post(`${API_BASE_URL}/api/auth/login`, {
          email: testUser.email,
          password: testUser.password
        });
        token = loginResponse.data.token;
        console.log('✅ Logged in with existing test user');
      } else {
        throw error;
      }
    }

    if (!token) {
      throw new Error('Could not obtain authentication token');
    }

    // Test each endpoint
    for (const endpoint of endpoints) {
      console.log(`\nTesting ${endpoint}:`);
      try {
        const response = await axios.get(`${API_BASE_URL}${endpoint}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        console.log(`✅ ${endpoint} - Success:`, {
          status: response.status,
          success: response.data.success,
          hasUser: !!response.data.user,
          userName: response.data.user?.name
        });
      } catch (error) {
        console.log(`❌ ${endpoint} - Failed:`, {
          status: error.response?.status,
          message: error.response?.data?.message || error.message
        });
      }
    }

    // Test profile update endpoint
    console.log('\nTesting /api/auth/me (PUT):');
    try {
      const updateResponse = await axios.put(`${API_BASE_URL}/api/auth/me`, {
        name: 'Updated API Test User',
        phone: '+919876543210'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('✅ Profile update - Success:', {
        status: updateResponse.status,
        success: updateResponse.data.success,
        updatedName: updateResponse.data.user?.name,
        updatedPhone: updateResponse.data.user?.phone
      });
    } catch (error) {
      console.log('❌ Profile update - Failed:', {
        status: error.response?.status,
        message: error.response?.data?.message || error.message
      });
    }

    // Test avatar upload endpoint
    console.log('\nTesting /api/auth/upload-avatar:');
    try {
      // Create a simple test form data
      const FormData = (await import('form-data')).default;
      const formData = new FormData();
      formData.append('avatar', Buffer.from('fake-image-data'), {
        filename: 'test-avatar.jpg',
        contentType: 'image/jpeg'
      });
      
      const uploadResponse = await axios.post(`${API_BASE_URL}/api/auth/upload-avatar`, formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          ...formData.getHeaders()
        }
      });
      
      console.log('✅ Avatar upload - Success:', {
        status: uploadResponse.status,
        success: uploadResponse.data.success,
        avatarUrl: uploadResponse.data.avatarUrl
      });
    } catch (error) {
      console.log('❌ Avatar upload - Failed (expected for fake data):', {
        status: error.response?.status,
        message: error.response?.data?.message || error.message
      });
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testApiEndpoints();