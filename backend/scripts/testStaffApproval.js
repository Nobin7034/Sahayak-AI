import axios from 'axios';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '../.env' });

const API_BASE_URL = 'http://localhost:5000/api';

async function testStaffApproval() {
  console.log('🧪 Testing Staff Approval Endpoint...\n');

  const pendingStaffId = '694632b041b27e4d156e47b3'; // From the previous check
  const adminId = '68ffbe8e58aa656ec3f0c841'; // Real admin ID

  try {
    console.log(`📋 Testing approval for staff ID: ${pendingStaffId}`);
    console.log(`👑 Using admin ID: ${adminId}`);
    
    const response = await axios.post(`${API_BASE_URL}/auth/admin/approve-staff/${pendingStaffId}`, {
      adminId: adminId,
      notes: 'Test approval from script'
    });

    if (response.data.success) {
      console.log('✅ Staff approval successful!');
      console.log('Response:', response.data);
    } else {
      console.log('❌ Staff approval failed:', response.data.message);
    }

  } catch (error) {
    console.error('❌ Staff approval error:');
    console.error('Status:', error.response?.status);
    console.error('Message:', error.response?.data?.message);
    console.error('Full error:', error.response?.data);
  }
}

testStaffApproval().catch(console.error);