import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

async function testStaffLogin() {
  try {
    console.log('🧪 Testing Staff Login...\n');
    
    // Test staff login with the registered email
    const staffCredentials = [
      {
        email: 'akshayacenterkply@gmail.com',
        password: 'staff123', // Updated to known password
        name: 'Akshaya Service Center Koovappally'
      },
      {
        email: 'akshayacenter2@gmail.com', 
        password: 'staff123', // Updated to known password
        name: 'Akshaya Center 26th Mile'
      }
    ];
    
    for (const creds of staffCredentials) {
      console.log(`📧 Testing login for: ${creds.name}`);
      console.log(`📧 Email: ${creds.email}`);
      
      try {
        const response = await axios.post(`${API_BASE_URL}/auth/login`, {
          email: creds.email,
          password: creds.password,
          role: 'staff'
        });
        
        if (response.data.success) {
          console.log('✅ Staff login successful!');
          console.log(`👤 User: ${response.data.user.name}`);
          console.log(`🔑 Role: ${response.data.user.role}`);
          console.log(`📧 Email: ${response.data.user.email}`);
          console.log(`🎫 Token: ${response.data.token.substring(0, 20)}...`);
        } else {
          console.log('❌ Login failed:', response.data.message);
        }
      } catch (error) {
        console.log('❌ Login error:', error.response?.data?.message || error.message);
        
        if (error.response?.status === 401) {
          console.log('💡 This might be due to:');
          console.log('   - Wrong password (use the password from registration)');
          console.log('   - Staff not approved yet');
          console.log('   - Account not active');
        }
      }
      
      console.log('─'.repeat(50));
    }
    
    console.log('\n💡 If login fails, try these passwords:');
    console.log('   - The password you used during staff registration');
    console.log('   - Common passwords: password, 123456, admin123, staff123');
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
}

// Run the test
testStaffLogin();