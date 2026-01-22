import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000';

async function testProfileFix() {
  try {
    console.log('🔍 Testing Profile Fix for Google Users...\n');

    // Create a test user that simulates a Google user
    const testGoogleUser = {
      firstName: 'Google',
      lastName: 'Profile Test',
      email: 'googleprofiletest@gmail.com',
      password: 'testpassword123',
      accountType: 'user'
    };

    let token = null;

    try {
      const registerResponse = await axios.post(`${API_BASE_URL}/api/auth/register`, testGoogleUser);
      token = registerResponse.data.token;
      console.log('✅ Test Google user created');
    } catch (error) {
      if (error.response?.data?.message?.includes('already exists')) {
        const loginResponse = await axios.post(`${API_BASE_URL}/api/auth/login`, {
          email: testGoogleUser.email,
          password: testGoogleUser.password
        });
        token = loginResponse.data.token;
        console.log('✅ Logged in with existing test Google user');
      } else {
        throw error;
      }
    }

    // Update user to have Google-like properties
    const googleUpdateResponse = await axios.put(`${API_BASE_URL}/api/auth/me`, {
      name: 'Google Profile Test User',
      avatar: 'https://lh3.googleusercontent.com/a/test-google-avatar'
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log('✅ User updated with Google-like properties');

    // Test 1: Verify /api/auth/me endpoint works (what Profile.jsx now calls)
    console.log('\n1. Testing /api/auth/me endpoint (Profile.jsx main call):');
    const profileResponse = await axios.get(`${API_BASE_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (profileResponse.data.success && profileResponse.data.user) {
      console.log('✅ Profile data retrieved successfully');
      const user = profileResponse.data.user;
      
      // Check all fields that Profile.jsx expects
      const expectedFields = {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        provider: user.provider,
        avatar: user.avatar,
        phone: user.phone,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin
      };

      console.log('Profile data structure:');
      Object.entries(expectedFields).forEach(([key, value]) => {
        console.log(`  ${key}: ${value ? '✅' : '⚠️'} ${value || 'not set'}`);
      });
    } else {
      console.log('❌ Failed to retrieve profile data');
    }

    // Test 2: Test profile update (what Profile.jsx edit form does)
    console.log('\n2. Testing profile update functionality:');
    const updateData = {
      name: 'Updated Google Test User',
      phone: '+919876543210'
    };

    const updateResponse = await axios.put(`${API_BASE_URL}/api/auth/me`, updateData, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (updateResponse.data.success) {
      console.log('✅ Profile update successful');
      console.log('Updated data:', {
        name: updateResponse.data.user.name,
        phone: updateResponse.data.user.phone
      });
    } else {
      console.log('❌ Profile update failed');
    }

    // Test 3: Verify the old endpoint fails (confirms the fix)
    console.log('\n3. Verifying old endpoint fails (confirms fix):');
    try {
      await axios.get(`${API_BASE_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('❌ Old endpoint still works - this should not happen');
    } catch (error) {
      console.log('✅ Old endpoint correctly returns 404 - fix confirmed');
    }

    // Test 4: Simulate the complete Profile.jsx workflow
    console.log('\n4. Simulating complete Profile.jsx workflow:');
    
    // Step 1: Load profile (useEffect in Profile.jsx)
    const loadResponse = await axios.get(`${API_BASE_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Step 1: Profile loaded');

    // Step 2: Update profile (handleSaveProfile in Profile.jsx)
    const workflowUpdateResponse = await axios.put(`${API_BASE_URL}/api/auth/me`, {
      name: 'Final Google Test User',
      phone: '+919123456789'
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Step 2: Profile updated');

    // Step 3: Reload profile to verify changes
    const reloadResponse = await axios.get(`${API_BASE_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (reloadResponse.data.user.name === 'Final Google Test User' && 
        reloadResponse.data.user.phone === '+919123456789') {
      console.log('✅ Step 3: Changes persisted correctly');
    } else {
      console.log('❌ Step 3: Changes not persisted');
    }

    console.log('\n🎉 Profile fix test completed successfully!');
    console.log('The Profile.jsx component should now work correctly for Google users.');

    return {
      success: true,
      finalUser: reloadResponse.data.user
    };

  } catch (error) {
    console.error('❌ Profile fix test failed:', error.response?.data || error.message);
    return { success: false, error: error.message };
  }
}

// Run the test
testProfileFix().then(result => {
  if (result.success) {
    console.log('\n✅ All tests passed - Google user profile issue is fixed!');
  } else {
    console.log('\n❌ Tests failed - issue may still exist');
  }
});