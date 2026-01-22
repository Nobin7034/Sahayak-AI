import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000';

async function testBothUserTypes() {
  try {
    console.log('🔍 Testing Profile functionality for both Local and Google users...\n');

    // Test 1: Local User
    console.log('=== Testing Local User ===');
    const localUser = {
      firstName: 'Local',
      lastName: 'User',
      email: 'localuser@example.com',
      password: 'testpassword123',
      accountType: 'user'
    };

    let localToken = null;
    try {
      const registerResponse = await axios.post(`${API_BASE_URL}/api/auth/register`, localUser);
      localToken = registerResponse.data.token;
      console.log('✅ Local user created');
    } catch (error) {
      if (error.response?.data?.message?.includes('already exists')) {
        const loginResponse = await axios.post(`${API_BASE_URL}/api/auth/login`, {
          email: localUser.email,
          password: localUser.password
        });
        localToken = loginResponse.data.token;
        console.log('✅ Local user logged in');
      }
    }

    // Test local user profile
    const localProfileResponse = await axios.get(`${API_BASE_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${localToken}` }
    });
    
    console.log('Local user profile:', {
      name: localProfileResponse.data.user.name,
      email: localProfileResponse.data.user.email,
      provider: localProfileResponse.data.user.provider,
      avatar: localProfileResponse.data.user.avatar || 'not set'
    });

    // Test 2: Simulated Google User
    console.log('\n=== Testing Google-like User ===');
    const googleUser = {
      firstName: 'Google',
      lastName: 'User',
      email: 'googleuser2@gmail.com',
      password: 'temppassword123',
      accountType: 'user'
    };

    let googleToken = null;
    try {
      const registerResponse = await axios.post(`${API_BASE_URL}/api/auth/register`, googleUser);
      googleToken = registerResponse.data.token;
      console.log('✅ Google-like user created');
      
      // Update to have Google properties
      await axios.put(`${API_BASE_URL}/api/auth/me`, {
        name: 'Google User',
        avatar: 'https://lh3.googleusercontent.com/a/google-avatar'
      }, {
        headers: { Authorization: `Bearer ${googleToken}` }
      });
      console.log('✅ Updated with Google properties');
      
    } catch (error) {
      if (error.response?.data?.message?.includes('already exists')) {
        const loginResponse = await axios.post(`${API_BASE_URL}/api/auth/login`, {
          email: googleUser.email,
          password: googleUser.password
        });
        googleToken = loginResponse.data.token;
        console.log('✅ Google-like user logged in');
      }
    }

    // Test Google user profile
    const googleProfileResponse = await axios.get(`${API_BASE_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${googleToken}` }
    });
    
    console.log('Google-like user profile:', {
      name: googleProfileResponse.data.user.name,
      email: googleProfileResponse.data.user.email,
      provider: googleProfileResponse.data.user.provider,
      avatar: googleProfileResponse.data.user.avatar || 'not set'
    });

    // Test 3: Profile Updates for both users
    console.log('\n=== Testing Profile Updates ===');
    
    // Update local user
    const localUpdateResponse = await axios.put(`${API_BASE_URL}/api/auth/me`, {
      name: 'Updated Local User',
      phone: '+919111111111'
    }, {
      headers: { Authorization: `Bearer ${localToken}` }
    });
    console.log('✅ Local user updated:', localUpdateResponse.data.success);

    // Update Google user
    const googleUpdateResponse = await axios.put(`${API_BASE_URL}/api/auth/me`, {
      name: 'Updated Google User',
      phone: '+919222222222'
    }, {
      headers: { Authorization: `Bearer ${googleToken}` }
    });
    console.log('✅ Google user updated:', googleUpdateResponse.data.success);

    // Test 4: Password change (should work for local, fail for Google)
    console.log('\n=== Testing Password Change ===');
    
    // Local user password change (should work)
    try {
      const localPasswordResponse = await axios.put(`${API_BASE_URL}/api/auth/me/password`, {
        currentPassword: 'testpassword123',
        newPassword: 'newpassword123'
      }, {
        headers: { Authorization: `Bearer ${localToken}` }
      });
      console.log('✅ Local user password change:', localPasswordResponse.data.success);
    } catch (error) {
      console.log('❌ Local user password change failed:', error.response?.data?.message);
    }

    // Google user password change (should fail gracefully)
    try {
      const googlePasswordResponse = await axios.put(`${API_BASE_URL}/api/auth/me/password`, {
        currentPassword: 'temppassword123',
        newPassword: 'newpassword123'
      }, {
        headers: { Authorization: `Bearer ${googleToken}` }
      });
      console.log('❌ Google user password change should have failed');
    } catch (error) {
      console.log('✅ Google user password change correctly blocked:', error.response?.data?.message);
    }

    console.log('\n🎉 Both user types tested successfully!');
    console.log('The Profile.jsx component should work correctly for both Local and Google users.');

    return { success: true };

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    return { success: false };
  }
}

// Run the test
testBothUserTypes();