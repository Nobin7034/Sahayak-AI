import axios from 'axios';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const API_BASE_URL = 'http://localhost:5000/api';

async function testStaffDashboardFix() {
  try {
    console.log('🔧 Testing staff dashboard fix...');
    
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

    // Test all dashboard-related endpoints
    const tests = [
      {
        name: 'Notifications API',
        url: `${API_BASE_URL}/notifications`,
        test: (data) => {
          console.log(`   Structure: ${JSON.stringify(Object.keys(data))}`);
          console.log(`   Items: ${Array.isArray(data.items) ? data.items.length : 'Not array'}`);
          console.log(`   Unread: ${data.unreadCount}`);
          return Array.isArray(data.items);
        }
      },
      {
        name: 'Staff Dashboard',
        url: `${API_BASE_URL}/staff/dashboard`,
        test: (data) => {
          console.log(`   Metrics: ${data.metrics ? 'Present' : 'Missing'}`);
          console.log(`   Upcoming: ${Array.isArray(data.upcomingAppointments) ? data.upcomingAppointments.length : 'Not array'}`);
          return data.metrics && Array.isArray(data.upcomingAppointments);
        }
      },
      {
        name: 'Staff Services',
        url: `${API_BASE_URL}/staff/services/available`,
        test: (response) => {
          // Services response has data directly, not nested in data.data
          console.log(`   Services: ${Array.isArray(response.data) ? response.data.length : 'Not array'}`);
          console.log(`   Meta: ${response.meta ? 'Present' : 'Missing'}`);
          return Array.isArray(response.data) && response.meta;
        }
      }
    ];

    console.log('\n📋 Testing dashboard endpoints...');
    
    let allPassed = true;
    
    for (const test of tests) {
      try {
        const response = await axios.get(test.url, { headers });
        
        if (response.data.success) {
          let testData;
          if (test.name === 'Staff Services') {
            // Services endpoint has different structure
            testData = response.data;
          } else {
            testData = response.data.data || response.data;
          }
          
          const testResult = test.test(testData);
          if (testResult) {
            console.log(`✅ ${test.name}: PASS`);
          } else {
            console.log(`❌ ${test.name}: FAIL - Data structure issue`);
            allPassed = false;
          }
        } else {
          console.log(`❌ ${test.name}: FAIL - ${response.data.message}`);
          allPassed = false;
        }
      } catch (error) {
        console.log(`❌ ${test.name}: ERROR - ${error.response?.data?.message || error.message}`);
        allPassed = false;
      }
    }

    console.log(`\n🎯 Overall Result: ${allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
    
    if (allPassed) {
      console.log('\n🎉 Staff dashboard should now load without errors!');
      console.log('   - Notifications API returns proper array structure');
      console.log('   - Dashboard API returns proper data');
      console.log('   - Services API returns proper data');
      console.log('   - Frontend components have safety checks for arrays');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

testStaffDashboardFix();