import axios from 'axios';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '../.env' });

const API_BASE_URL = 'http://localhost:5000/api';

async function testNotificationSystem() {
  console.log('🧪 Testing Notification System...\n');

  try {
    // First, let's check if we have any admin users
    console.log('📋 Checking for admin users...');
    
    // Test admin login to get token
    const adminLoginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: 'admin@sahayak.com', // Assuming we have an admin user
      password: 'admin123'
    });

    if (adminLoginResponse.data.success) {
      console.log('✅ Admin login successful');
      const adminToken = adminLoginResponse.data.token;
      
      // Get admin notifications
      console.log('📬 Fetching admin notifications...');
      const notificationsResponse = await axios.get(`${API_BASE_URL}/admin/notifications`, {
        headers: {
          'Authorization': `Bearer ${adminToken}`
        }
      });

      if (notificationsResponse.data.success) {
        console.log(`✅ Found ${notificationsResponse.data.data.notifications.length} notifications`);
        console.log(`📊 Unread count: ${notificationsResponse.data.data.unreadCount}`);
        
        // Show recent notifications
        const notifications = notificationsResponse.data.data.notifications.slice(0, 5);
        notifications.forEach((notif, index) => {
          console.log(`${index + 1}. ${notif.title} - ${notif.message} (${notif.type})`);
        });
      }

      // Test getting all centers (admin view)
      console.log('\n🏢 Testing admin centers endpoint...');
      const centersResponse = await axios.get(`${API_BASE_URL}/centers/admin/all`, {
        headers: {
          'Authorization': `Bearer ${adminToken}`
        }
      });

      if (centersResponse.data.success) {
        console.log(`✅ Found ${centersResponse.data.centers.length} centers (including inactive)`);
        centersResponse.data.centers.forEach(center => {
          console.log(`   - ${center.name} (${center.status}) - Staff: ${center.registeredBy?.name || 'N/A'}`);
        });
      }

    } else {
      console.log('❌ Admin login failed - creating test admin...');
      // You might need to create an admin user first
    }

  } catch (error) {
    if (error.response?.status === 401) {
      console.log('❌ Authentication failed - make sure admin user exists');
    } else {
      console.error('❌ Test failed:', error.response?.data?.message || error.message);
    }
  }
}

testNotificationSystem().catch(console.error);