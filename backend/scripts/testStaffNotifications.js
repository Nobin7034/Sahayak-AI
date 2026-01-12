import axios from 'axios';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const API_BASE_URL = 'http://localhost:5000/api';

async function testStaffNotifications() {
  try {
    console.log('🔐 Testing staff notifications access...');
    
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
    console.log('✅ Staff login successful');

    // Test notifications endpoint
    try {
      const notificationsResponse = await axios.get(`${API_BASE_URL}/notifications`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (notificationsResponse.data.success) {
        console.log('✅ Notifications endpoint: OK');
        console.log(`   Notifications: ${notificationsResponse.data.data.items.length}`);
        console.log(`   Unread: ${notificationsResponse.data.data.unreadCount}`);
      } else {
        console.log('❌ Notifications endpoint failed:', notificationsResponse.data.message);
      }
    } catch (error) {
      console.log('❌ Notifications endpoint error:', error.response?.data?.message || error.message);
    }

    // Test services endpoint
    try {
      const servicesResponse = await axios.get(`${API_BASE_URL}/staff/services/available`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (servicesResponse.data.success) {
        console.log('✅ Services endpoint: OK');
        console.log(`   Services: ${servicesResponse.data.data.length}`);
      } else {
        console.log('❌ Services endpoint failed:', servicesResponse.data.message);
      }
    } catch (error) {
      console.log('❌ Services endpoint error:', error.response?.data?.message || error.message);
    }

    console.log('\n🎉 Staff notifications test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

testStaffNotifications();