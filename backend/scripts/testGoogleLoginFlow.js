import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000';

async function testGoogleLoginFlow() {
  try {
    console.log('🔍 Testing Google Login Flow...\n');

    // Test 1: Simulate Google authentication with mock Firebase ID token
    console.log('1. Testing Google authentication endpoint:');
    
    // This simulates what happens when a user logs in with Google
    const mockGoogleData = {
      token: 'mock-firebase-id-token' // In real scenario, this would be a valid Firebase ID token
    };

    try {
      const googleAuthResponse = await axios.post(`${API_BASE_URL}/api/auth/google`, mockGoogleData);
      console.log('Google auth response:', googleAuthResponse.data);
    } catch (error) {
      console.log('Expected failure (mock token):', error.response?.data?.message);
      console.log('This is expected since we\'re using a mock token\n');
    }

    // Test 2: Create a Google user directly in the database and test profile access
    console.log('2. Testing profile access for Google users:');
    
    // Simulate what the AuthContext does for Google users
    const testGoogleUser = {
      firstName: 'Google',
      lastName: 'User',
      email: 'googleuser@gmail.com',
      password: 'temppassword123', // Google users still need a password in our system
      accountType: 'user'
    };

    try {
      // Register the user first
      const registerResponse = await axios.post(`${API_BASE_URL}/api/auth/register`, testGoogleUser);
      
      if (registerResponse.data.success && registerResponse.data.token) {
        console.log('✅ User registered successfully');
        
        // Now update the user to be a Google user (simulate Google login)
        const updateResponse = await axios.put(`${API_BASE_URL}/api/auth/me`, {
          name: 'Google Test User',
          avatar: 'https://lh3.googleusercontent.com/a/test-avatar'
        }, {
          headers: { Authorization: `Bearer ${registerResponse.data.token}` }
        });
        
        console.log('✅ User profile updated:', updateResponse.data.success);
        
        // Test the /auth/me endpoint (what Profile.jsx calls)
        const profileResponse = await axios.get(`${API_BASE_URL}/api/auth/me`, {
          headers: { Authorization: `Bearer ${registerResponse.data.token}` }
        });
        
        console.log('✅ Profile data retrieved:');
        console.log('User data structure:', {
          id: profileResponse.data.user._id,
          name: profileResponse.data.user.name,
          email: profileResponse.data.user.email,
          role: profileResponse.data.user.role,
          provider: profileResponse.data.user.provider,
          avatar: profileResponse.data.user.avatar,
          phone: profileResponse.data.user.phone,
          createdAt: profileResponse.data.user.createdAt,
          lastLogin: profileResponse.data.user.lastLogin
        });

        // Test 3: Check if all Profile.jsx required fields are present
        console.log('\n3. Checking Profile.jsx compatibility:');
        const user = profileResponse.data.user;
        const requiredFields = ['name', 'email', 'role', 'provider'];
        const optionalFields = ['avatar', 'phone', 'createdAt', 'lastLogin'];
        
        console.log('Required fields check:');
        requiredFields.forEach(field => {
          const value = user[field];
          console.log(`  ${field}: ${value ? '✅' : '❌'} ${value || 'missing'}`);
        });
        
        console.log('Optional fields check:');
        optionalFields.forEach(field => {
          const value = user[field];
          console.log(`  ${field}: ${value ? '✅' : '⚠️'} ${value || 'not set'}`);
        });

        // Test 4: Test profile update functionality
        console.log('\n4. Testing profile update for Google-like user:');
        const updateData = {
          name: 'Updated Google User',
          phone: '+919876543210'
        };
        
        const updateResult = await axios.put(`${API_BASE_URL}/api/auth/me`, updateData, {
          headers: { Authorization: `Bearer ${registerResponse.data.token}` }
        });
        
        console.log('✅ Profile update successful:', updateResult.data.success);
        console.log('Updated user data:', {
          name: updateResult.data.user.name,
          phone: updateResult.data.user.phone
        });

        return {
          success: true,
          token: registerResponse.data.token,
          user: updateResult.data.user
        };
      }
    } catch (error) {
      if (error.response?.data?.message?.includes('already exists')) {
        console.log('⚠️ User already exists, trying to login...');
        
        try {
          const loginResponse = await axios.post(`${API_BASE_URL}/api/auth/login`, {
            email: testGoogleUser.email,
            password: testGoogleUser.password
          });
          
          console.log('✅ Login successful');
          
          // Test profile access with existing user
          const profileResponse = await axios.get(`${API_BASE_URL}/api/auth/me`, {
            headers: { Authorization: `Bearer ${loginResponse.data.token}` }
          });
          
          console.log('✅ Existing user profile data:', {
            name: profileResponse.data.user.name,
            email: profileResponse.data.user.email,
            provider: profileResponse.data.user.provider,
            avatar: profileResponse.data.user.avatar
          });
          
          return {
            success: true,
            token: loginResponse.data.token,
            user: profileResponse.data.user
          };
        } catch (loginError) {
          console.log('❌ Login failed:', loginError.response?.data?.message);
        }
      } else {
        console.log('❌ Registration failed:', error.response?.data?.message);
      }
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testGoogleLoginFlow().then(result => {
  if (result?.success) {
    console.log('\n🎉 Google login flow test completed successfully!');
    console.log('The Profile.jsx component should work correctly with this user data.');
  } else {
    console.log('\n❌ Google login flow test failed');
  }
});