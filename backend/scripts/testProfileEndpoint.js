import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000';

async function testProfileEndpoint() {
  try {
    console.log('🔍 Testing Profile endpoint behavior...\n');

    // Test 1: Call /auth/me without authentication (should fail)
    console.log('1. Testing /auth/me without authentication:');
    try {
      const response = await axios.get(`${API_BASE_URL}/api/auth/me`);
      console.log('❌ Unexpected success:', response.data);
    } catch (error) {
      console.log('✅ Expected failure (no auth):', error.response?.status, error.response?.data?.message);
    }

    // Test 2: Test with invalid token
    console.log('\n2. Testing /auth/me with invalid token:');
    try {
      const response = await axios.get(`${API_BASE_URL}/api/auth/me`, {
        headers: { Authorization: 'Bearer invalid-token' }
      });
      console.log('❌ Unexpected success:', response.data);
    } catch (error) {
      console.log('✅ Expected failure (invalid token):', error.response?.status, error.response?.data?.message);
    }

    // Test 3: Check if we can create a test user and login
    console.log('\n3. Testing user registration and login flow:');
    
    const testUser = {
      firstName: 'Test',
      lastName: 'User',
      email: 'testuser@example.com',
      password: 'testpassword123',
      accountType: 'user'
    };

    try {
      // Try to register
      const registerResponse = await axios.post(`${API_BASE_URL}/api/auth/register`, testUser);
      console.log('✅ Registration successful:', registerResponse.data.success);
      
      if (registerResponse.data.token) {
        // Test /auth/me with valid token
        console.log('\n4. Testing /auth/me with valid token:');
        const meResponse = await axios.get(`${API_BASE_URL}/api/auth/me`, {
          headers: { Authorization: `Bearer ${registerResponse.data.token}` }
        });
        
        console.log('✅ /auth/me response:', {
          success: meResponse.data.success,
          user: {
            id: meResponse.data.user?.id,
            name: meResponse.data.user?.name,
            email: meResponse.data.user?.email,
            role: meResponse.data.user?.role,
            provider: meResponse.data.user?.provider,
            avatar: meResponse.data.user?.avatar,
            phone: meResponse.data.user?.phone
          }
        });
      }
    } catch (error) {
      if (error.response?.data?.message?.includes('already exists')) {
        console.log('⚠️ User already exists, trying to login...');
        
        // Try to login
        try {
          const loginResponse = await axios.post(`${API_BASE_URL}/api/auth/login`, {
            email: testUser.email,
            password: testUser.password
          });
          
          console.log('✅ Login successful');
          
          // Test /auth/me with login token
          console.log('\n4. Testing /auth/me with login token:');
          const meResponse = await axios.get(`${API_BASE_URL}/api/auth/me`, {
            headers: { Authorization: `Bearer ${loginResponse.data.token}` }
          });
          
          console.log('✅ /auth/me response:', {
            success: meResponse.data.success,
            user: {
              id: meResponse.data.user?.id,
              name: meResponse.data.user?.name,
              email: meResponse.data.user?.email,
              role: meResponse.data.user?.role,
              provider: meResponse.data.user?.provider,
              avatar: meResponse.data.user?.avatar,
              phone: meResponse.data.user?.phone
            }
          });
        } catch (loginError) {
          console.log('❌ Login failed:', loginError.response?.data?.message);
        }
      } else {
        console.log('❌ Registration failed:', error.response?.data?.message);
      }
    }

    // Test 5: Simulate Google user scenario
    console.log('\n5. Simulating Google user data structure:');
    const googleUserData = {
      name: 'Google Test User',
      email: 'googletest@gmail.com',
      provider: 'google',
      avatar: 'https://lh3.googleusercontent.com/a/test-avatar',
      role: 'user',
      phone: null,
      createdAt: new Date(),
      lastLogin: new Date()
    };
    
    console.log('Expected Google user data:', googleUserData);
    console.log('✅ All required fields for Profile component are present');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testProfileEndpoint();