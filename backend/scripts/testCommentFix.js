import axios from 'axios';

const API_BASE = 'http://localhost:5000/api';

async function testCommentFix() {
  try {
    console.log('🧪 Testing Comment Fix...\n');

    // 1. Login as staff
    console.log('1. Logging in as staff...');
    const loginResponse = await axios.post(`${API_BASE}/staff/login`, {
      email: 'akshayacenterkply@gmail.com',
      password: 'Staff@123'
    });

    if (!loginResponse.data.success) {
      throw new Error('Staff login failed');
    }

    const staffToken = loginResponse.data.data.token;
    console.log('✓ Staff login successful');

    // 2. Test comment endpoint with mock ID
    console.log('\n2. Testing comment endpoint...');
    const mockAppointmentId = '507f1f77bcf86cd799439011';
    
    try {
      const commentResponse = await axios.post(
        `${API_BASE}/staff/appointments/${mockAppointmentId}/comments`,
        {
          comment: 'This is a test comment to verify the endpoint is working correctly.'
        },
        {
          headers: { 'Authorization': `Bearer ${staffToken}` }
        }
      );

      console.log('✓ Comment endpoint response:', commentResponse.data);
    } catch (error) {
      console.log('Comment endpoint error details:');
      console.log('- Status:', error.response?.status);
      console.log('- Message:', error.response?.data?.message);
      console.log('- Full error:', error.response?.data);
      
      if (error.response?.status === 404) {
        console.log('✓ Comment endpoint is working (404 expected for non-existent appointment)');
      } else if (error.response?.status === 400) {
        console.log('❌ Bad Request - this is the issue we need to fix');
      }
    }

    // 3. Test with empty comment
    console.log('\n3. Testing with empty comment...');
    try {
      await axios.post(
        `${API_BASE}/staff/appointments/${mockAppointmentId}/comments`,
        {
          comment: ''
        },
        {
          headers: { 'Authorization': `Bearer ${staffToken}` }
        }
      );
    } catch (error) {
      if (error.response?.status === 400 && error.response?.data?.message === 'Comment content is required') {
        console.log('✓ Empty comment validation working correctly');
      } else {
        console.log('⚠️ Unexpected error for empty comment:', error.response?.data);
      }
    }

    // 4. Test with missing comment field
    console.log('\n4. Testing with missing comment field...');
    try {
      await axios.post(
        `${API_BASE}/staff/appointments/${mockAppointmentId}/comments`,
        {},
        {
          headers: { 'Authorization': `Bearer ${staffToken}` }
        }
      );
    } catch (error) {
      if (error.response?.status === 400 && error.response?.data?.message === 'Comment content is required') {
        console.log('✓ Missing comment field validation working correctly');
      } else {
        console.log('⚠️ Unexpected error for missing comment:', error.response?.data);
      }
    }

    console.log('\n✅ Comment endpoint testing complete!');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testCommentFix();