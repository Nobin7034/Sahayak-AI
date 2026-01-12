import axios from 'axios';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const API_BASE_URL = 'http://localhost:5000/api';

async function testCompleteStaffAccess() {
  try {
    console.log('🔐 Testing complete staff access...');
    
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb+srv://nobinrajeev:nobinrajeev@cluster1.fye0w5x.mongodb.net/sahayak_ai?retryWrites=true&w=majority';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Login as staff
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: 'akshayacenterkply@gmail.com',
      password: 'Staff@123'
    });

    if (!loginResponse.data.success) {
      throw new Error('Staff login failed');
    }

    const token = loginResponse.data.token;
    const user = loginResponse.data.user;
    console.log('✅ Staff login successful');
    console.log(`   User: ${user.name} (${user.role})`);

    const headers = { 'Authorization': `Bearer ${token}` };

    // Test all endpoints that were failing
    const tests = [
      {
        name: 'Notifications',
        url: `${API_BASE_URL}/notifications`,
        expectedFields: ['items', 'unreadCount']
      },
      {
        name: 'Staff Services',
        url: `${API_BASE_URL}/staff/services/available`,
        expectedFields: ['data', 'meta']
      },
      {
        name: 'Staff Dashboard',
        url: `${API_BASE_URL}/staff/dashboard`,
        expectedFields: ['metrics', 'upcomingAppointments']
      },
      {
        name: 'Staff Profile',
        url: `${API_BASE_URL}/staff/profile`,
        expectedFields: ['user', 'staff']
      }
    ];

    console.log('\n📋 Testing endpoints...');
    
    for (const test of tests) {
      try {
        const response = await axios.get(test.url, { headers });
        
        if (response.data.success) {
          console.log(`✅ ${test.name}: OK`);
          
          // Check expected fields
          const data = response.data.data || response.data;
          const missingFields = test.expectedFields.filter(field => !(field in data));
          
          if (missingFields.length === 0) {
            console.log(`   All expected fields present`);
          } else {
            console.log(`   ⚠️  Missing fields: ${missingFields.join(', ')}`);
          }
          
          // Show some data details
          if (test.name === 'Staff Services' && data.data) {
            console.log(`   Services: ${data.data.length}`);
            console.log(`   Enabled: ${data.meta.enabled}`);
            console.log(`   Hidden: ${data.meta.hidden}`);
          } else if (test.name === 'Notifications' && data.items) {
            console.log(`   Notifications: ${data.items.length}`);
            console.log(`   Unread: ${data.unreadCount}`);
          }
        } else {
          console.log(`❌ ${test.name}: Failed - ${response.data.message}`);
        }
      } catch (error) {
        console.log(`❌ ${test.name}: Error - ${error.response?.data?.message || error.message}`);
      }
    }

    console.log('\n🎉 Complete staff access test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

testCompleteStaffAccess();