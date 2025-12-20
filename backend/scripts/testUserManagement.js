import axios from 'axios';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '../.env' });

const API_BASE_URL = 'http://localhost:5000/api';

async function testUserManagement() {
  console.log('🧪 Testing User Management System...\n');

  try {
    // Test getting users by role
    console.log('👥 Testing users endpoint with role filter...');
    
    // Get regular users
    const usersResponse = await axios.get(`${API_BASE_URL}/admin/users?role=user`);
    if (usersResponse.data.success) {
      console.log(`✅ Found ${usersResponse.data.data.users.length} regular users`);
      usersResponse.data.data.users.forEach(user => {
        console.log(`   - ${user.name} (${user.email}) - Role: ${user.role} - Active: ${user.isActive}`);
      });
    }

    // Get staff members
    console.log('\n👨‍💼 Testing staff endpoint...');
    const staffResponse = await axios.get(`${API_BASE_URL}/admin/users?role=staff`);
    if (staffResponse.data.success) {
      console.log(`✅ Found ${staffResponse.data.data.users.length} staff members`);
      staffResponse.data.data.users.forEach(staff => {
        console.log(`   - ${staff.name} (${staff.email}) - Role: ${staff.role} - Active: ${staff.isActive} - Approval: ${staff.approvalStatus || 'N/A'}`);
      });
    }

    // Get all users (no filter)
    console.log('\n🌐 Testing all users endpoint...');
    const allUsersResponse = await axios.get(`${API_BASE_URL}/admin/users`);
    if (allUsersResponse.data.success) {
      const allUsers = allUsersResponse.data.data.users;
      console.log(`✅ Found ${allUsers.length} total users`);
      
      const usersByRole = allUsers.reduce((acc, user) => {
        acc[user.role] = (acc[user.role] || 0) + 1;
        return acc;
      }, {});
      
      console.log('   Role breakdown:');
      Object.entries(usersByRole).forEach(([role, count]) => {
        console.log(`     - ${role}: ${count}`);
      });
      
      const activeCount = allUsers.filter(u => u.isActive).length;
      const inactiveCount = allUsers.filter(u => !u.isActive).length;
      console.log(`   Status breakdown: Active: ${activeCount}, Inactive: ${inactiveCount}`);
    }

    // Test staff approval status
    console.log('\n📋 Staff approval status breakdown...');
    if (staffResponse.data.success) {
      const staff = staffResponse.data.data.users;
      const approvalStats = staff.reduce((acc, s) => {
        const status = s.approvalStatus || 'unknown';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {});
      
      Object.entries(approvalStats).forEach(([status, count]) => {
        console.log(`   - ${status}: ${count}`);
      });
    }

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data?.message || error.message);
  }
}

testUserManagement().catch(console.error);