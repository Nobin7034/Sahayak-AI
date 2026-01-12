import axios from 'axios';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from '../models/User.js';

dotenv.config();

const BASE_URL = 'http://localhost:5000';

async function testAdminDashboard() {
  try {
    console.log('🧪 Testing Admin Dashboard Fix...\n');

    // Connect to database to check admin users
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find admin users
    const adminUsers = await User.find({ role: 'admin' }).select('email name');
    console.log('👤 Admin users found:', adminUsers.map(u => ({ email: u.email, name: u.name })));

    if (adminUsers.length === 0) {
      console.log('❌ No admin users found');
      return;
    }

    // Use the first admin user for testing
    const adminEmail = adminUsers[0].email;
    console.log(`🔑 Testing with admin: ${adminEmail}`);

    // Test admin login with common passwords
    const passwords = ['Admin@123', 'admin123', 'password', 'admin'];
    let token = null;

    for (const password of passwords) {
      try {
        console.log(`1. Testing admin login with password: ${password}...`);
        const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
          email: adminEmail,
          password: password
        });

        if (loginResponse.data.success) {
          token = loginResponse.data.token;
          console.log('✅ Admin login successful');
          break;
        }
      } catch (error) {
        console.log(`❌ Login failed with ${password}`);
      }
    }

    if (!token) {
      console.log('❌ Could not login with any common passwords');
      return;
    }

    // Test dashboard stats endpoint
    console.log('\n2. Testing dashboard stats endpoint...');
    const config = {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };

    const dashboardResponse = await axios.get(`${BASE_URL}/api/admin/dashboard-stats`, config);
    
    if (dashboardResponse.data.success) {
      console.log('✅ Dashboard stats endpoint working');
      console.log('📊 Stats:', {
        totalUsers: dashboardResponse.data.data.stats.totalUsers,
        totalServices: dashboardResponse.data.data.stats.totalServices,
        totalAppointments: dashboardResponse.data.data.stats.totalAppointments,
        pendingAppointments: dashboardResponse.data.data.stats.pendingAppointments
      });
      console.log('📈 Most visited services:', dashboardResponse.data.data.mostVisitedServices.length);
      console.log('📅 Recent appointments:', dashboardResponse.data.data.recentAppointments.length);
    } else {
      console.error('❌ Dashboard stats failed:', dashboardResponse.data.message);
    }

    // Test broadcast endpoint
    console.log('\n3. Testing broadcast endpoint...');
    const broadcastResponse = await axios.post(`${BASE_URL}/api/admin/broadcast/appointments`, {
      title: 'Test Broadcast',
      message: 'This is a test broadcast message',
      sendToAll: true
    }, config);

    if (broadcastResponse.data.success) {
      console.log('✅ Broadcast endpoint working');
      console.log('📢 Recipients:', broadcastResponse.data.data.recipients);
    } else {
      console.error('❌ Broadcast failed:', broadcastResponse.data.message);
    }

    console.log('\n🎉 Admin Dashboard Fix Test Complete!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  } finally {
    await mongoose.disconnect();
  }
}

testAdminDashboard();