#!/usr/bin/env node

/**
 * Test User-Center Synchronization
 * Tests that user status changes are reflected in center data
 */

import axios from 'axios';

const API_BASE = 'http://localhost:5000/api';

async function testUserCenterSync() {
  console.log('🧪 Testing User-Center Synchronization...\n');

  try {
    // 1. Login as admin
    console.log('1. Logging in as admin...');
    const adminLogin = await axios.post(`${API_BASE}/auth/login`, {
      email: 'admin@akshayacenters.com',
      password: 'admin123'
    });

    if (!adminLogin.data.success) {
      throw new Error('Admin login failed');
    }

    const adminToken = adminLogin.data.token;
    console.log('✅ Admin authenticated');

    // 2. Get all users
    console.log('\n2. Fetching users...');
    const usersResponse = await axios.get(`${API_BASE}/admin/users?role=staff`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });

    if (!usersResponse.data.success) {
      throw new Error('Failed to fetch users');
    }

    const staffUsers = usersResponse.data.data.users.filter(u => u.role === 'staff');
    console.log(`✅ Found ${staffUsers.length} staff users`);

    if (staffUsers.length === 0) {
      console.log('⚠️  No staff users found to test with');
      return;
    }

    // 3. Get all centers
    console.log('\n3. Fetching centers...');
    const centersResponse = await axios.get(`${API_BASE}/centers/admin/all`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });

    if (!centersResponse.data.success) {
      throw new Error('Failed to fetch centers');
    }

    const centers = centersResponse.data.centers;
    console.log(`✅ Found ${centers.length} centers`);

    // 4. Find a staff user with an associated center
    console.log('\n4. Finding staff user with associated center...');
    let testUser = null;
    let testCenter = null;

    for (const user of staffUsers) {
      const associatedCenter = centers.find(c => c.registeredBy && c.registeredBy._id === user._id);
      if (associatedCenter) {
        testUser = user;
        testCenter = associatedCenter;
        break;
      }
    }

    if (!testUser || !testCenter) {
      console.log('⚠️  No staff user with associated center found');
      return;
    }

    console.log(`✅ Test user: ${testUser.name} (${testUser.email})`);
    console.log(`✅ Associated center: ${testCenter.name}`);
    console.log(`   User status: ${testUser.isActive ? 'Active' : 'Inactive'}`);
    console.log(`   Center user status: ${testCenter.registeredBy.isActive ? 'Active' : 'Inactive'}`);

    // 5. Test synchronization by toggling user status
    console.log('\n5. Testing user status toggle...');
    const originalStatus = testUser.isActive;
    const newStatus = !originalStatus;

    console.log(`   Changing user status from ${originalStatus} to ${newStatus}...`);

    const toggleResponse = await axios.patch(
      `${API_BASE}/admin/users/${testUser._id}/status`,
      { isActive: newStatus },
      { headers: { 'Authorization': `Bearer ${adminToken}` } }
    );

    if (!toggleResponse.data.success) {
      throw new Error('Failed to toggle user status');
    }

    console.log('✅ User status updated successfully');

    // 6. Verify the change is reflected in centers data
    console.log('\n6. Verifying synchronization...');
    const updatedCentersResponse = await axios.get(`${API_BASE}/centers/admin/all`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });

    if (!updatedCentersResponse.data.success) {
      throw new Error('Failed to fetch updated centers');
    }

    const updatedCenter = updatedCentersResponse.data.centers.find(c => c._id === testCenter._id);
    
    if (!updatedCenter) {
      throw new Error('Updated center not found');
    }

    console.log(`   Updated center user status: ${updatedCenter.registeredBy.isActive ? 'Active' : 'Inactive'}`);

    if (updatedCenter.registeredBy.isActive === newStatus) {
      console.log('✅ Synchronization successful! User status change reflected in center data');
    } else {
      console.log('❌ Synchronization failed! User status change NOT reflected in center data');
    }

    // 7. Restore original status
    console.log('\n7. Restoring original user status...');
    const restoreResponse = await axios.patch(
      `${API_BASE}/admin/users/${testUser._id}/status`,
      { isActive: originalStatus },
      { headers: { 'Authorization': `Bearer ${adminToken}` } }
    );

    if (restoreResponse.data.success) {
      console.log('✅ Original user status restored');
    } else {
      console.log('⚠️  Failed to restore original status');
    }

    console.log('\n🎉 User-Center synchronization test complete!');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data?.message || error.message);
  }
}

testUserCenterSync();