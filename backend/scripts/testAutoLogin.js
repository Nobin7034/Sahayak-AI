import axios from 'axios';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '../.env' });

const API_BASE_URL = 'http://localhost:5000/api';

async function testAutoLogin() {
  console.log('🧪 Testing Auto-Detection Login...\n');

  const testCredentials = [
    {
      email: 'akshayacenterkply@gmail.com',
      password: 'staff123',
      expectedRole: 'staff'
    },
    {
      email: 'akshayacenter2@gmail.com', 
      password: 'staff123',
      expectedRole: 'staff'
    }
  ];

  for (const cred of testCredentials) {
    console.log(`📧 Testing auto-login for: ${cred.email}`);
    console.log(`🔑 Expected role: ${cred.expectedRole}`);
    
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/login`, {
        email: cred.email,
        password: cred.password
        // No role parameter - should auto-detect
      });

      if (response.data.success) {
        console.log('✅ Auto-login successful!');
        console.log(`👤 User: ${response.data.user.name}`);
        console.log(`🔑 Detected Role: ${response.data.user.role}`);
        console.log(`📧 Email: ${response.data.user.email}`);
        console.log(`🎫 Token: ${response.data.token.substring(0, 20)}...`);
        
        if (response.data.user.role === cred.expectedRole) {
          console.log('✅ Role detection correct!');
        } else {
          console.log(`❌ Role detection failed! Expected: ${cred.expectedRole}, Got: ${response.data.user.role}`);
        }
      } else {
        console.log('❌ Auto-login failed:', response.data.message);
      }
    } catch (error) {
      console.log('❌ Auto-login error:', error.response?.data?.message || error.message);
    }
    
    console.log('──────────────────────────────────────────────────');
  }
}

testAutoLogin().catch(console.error);