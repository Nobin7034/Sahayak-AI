import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000';

async function testGoogleProfileIssues() {
  try {
    console.log('🔍 Testing Google Profile Picture and Edit Issues...\n');

    // Create a test Google user
    const testGoogleUser = {
      firstName: 'Google',
      lastName: 'Avatar Test',
      email: 'googleavatartest@gmail.com',
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

    // Test 1: Simulate Google user with avatar from Google
    console.log('\n1. Testing Google avatar URL handling:');
    const googleAvatarUrl = 'https://lh3.googleusercontent.com/a/ACg8ocKxVxvJGKwQvzCTwM9HNKv4FgHxY6t8RzLmN9pQ=s96-c';
    
    // Update user to have Google provider and avatar
    const updateResponse = await axios.put(`${API_BASE_URL}/api/auth/me`, {
      name: 'Google Avatar Test User',
      avatar: googleAvatarUrl
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (updateResponse.data.success) {
      console.log('✅ User updated with Google avatar URL');
      console.log('Avatar URL:', updateResponse.data.user.avatar);
    } else {
      console.log('❌ Failed to update user with Google avatar');
    }

    // Test 2: Verify profile data retrieval
    console.log('\n2. Testing profile data retrieval:');
    const profileResponse = await axios.get(`${API_BASE_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (profileResponse.data.success) {
      const user = profileResponse.data.user;
      console.log('✅ Profile data retrieved:');
      console.log('  Name:', user.name);
      console.log('  Email:', user.email);
      console.log('  Provider:', user.provider);
      console.log('  Avatar URL:', user.avatar);
      console.log('  Phone:', user.phone || 'not set');
      
      // Check if avatar URL is accessible
      if (user.avatar) {
        try {
          const avatarResponse = await axios.head(user.avatar);
          console.log('✅ Avatar URL is accessible:', avatarResponse.status);
        } catch (avatarError) {
          console.log('❌ Avatar URL not accessible:', avatarError.message);
          console.log('  This might be due to CORS or the URL being invalid');
        }
      }
    }

    // Test 3: Test phone number update
    console.log('\n3. Testing phone number update:');
    const phoneUpdateResponse = await axios.put(`${API_BASE_URL}/api/auth/me`, {
      name: 'Google Avatar Test User',
      phone: '+919876543210'
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (phoneUpdateResponse.data.success) {
      console.log('✅ Phone number updated successfully');
      console.log('Updated phone:', phoneUpdateResponse.data.user.phone);
    } else {
      console.log('❌ Phone number update failed');
    }

    // Test 4: Test profile form data structure
    console.log('\n4. Testing profile form data structure:');
    const finalProfileResponse = await axios.get(`${API_BASE_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (finalProfileResponse.data.success) {
      const user = finalProfileResponse.data.user;
      
      // Simulate what Profile.jsx does in useEffect
      const formData = {
        name: user.name || '',
        phone: user.phone || '',
        avatar: user.avatar || ''
      };
      
      console.log('✅ Form data structure (what Profile.jsx should receive):');
      console.log('  Form name:', formData.name);
      console.log('  Form phone:', formData.phone);
      console.log('  Form avatar:', formData.avatar);
      
      // Check for potential issues
      const issues = [];
      
      if (!user.name) issues.push('Missing name');
      if (!user.email) issues.push('Missing email');
      if (!user.avatar) issues.push('Missing avatar URL');
      if (user.avatar && !user.avatar.startsWith('http')) issues.push('Invalid avatar URL format');
      
      if (issues.length > 0) {
        console.log('⚠️ Potential issues found:', issues);
      } else {
        console.log('✅ No obvious data issues found');
      }
    }

    // Test 5: Test avatar upload for Google users (should be restricted)
    console.log('\n5. Testing avatar upload restrictions for Google users:');
    
    // First, let's check what the current provider is
    const currentUser = finalProfileResponse.data.user;
    console.log('Current provider:', currentUser.provider);
    
    if (currentUser.provider === 'google') {
      console.log('✅ User is marked as Google provider - avatar upload should be restricted in UI');
    } else {
      console.log('⚠️ User is not marked as Google provider - this might be the issue');
      
      // Let's try to update the provider to google to simulate a real Google user
      console.log('Attempting to simulate Google provider...');
      
      // Note: In a real scenario, this would be set during Google authentication
      // For testing, we can't directly update the provider via the API
      console.log('ℹ️ In real Google login, the provider would be set to "google" automatically');
    }

    return {
      success: true,
      user: finalProfileResponse.data.user,
      issues: []
    };

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    return { success: false, error: error.message };
  }
}

// Run the test
testGoogleProfileIssues().then(result => {
  if (result.success) {
    console.log('\n🎉 Google profile issues test completed!');
    console.log('Check the output above for any identified issues.');
  } else {
    console.log('\n❌ Test failed:', result.error);
  }
});