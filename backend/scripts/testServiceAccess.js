#!/usr/bin/env node

/**
 * Test Service Access
 * Tests if staff can access services without permission issues
 */

import axios from 'axios';

const API_BASE = 'http://localhost:5000/api';

async function testServiceAccess() {
  console.log('🧪 Testing Staff Service Access...\n');

  try {
    // Test with a sample staff login (you'll need to use actual credentials)
    console.log('1. Testing service access without authentication...');
    
    try {
      const response = await axios.get(`${API_BASE}/staff/services/available`);
      console.log('❌ Unexpected: Got response without authentication');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Correct: Authentication required');
      } else {
        console.log('❓ Unexpected error:', error.response?.status, error.response?.data?.message);
      }
    }

    console.log('\n2. Testing with admin token...');
    
    // Try admin login
    const adminLogin = await axios.post(`${API_BASE}/auth/login`, {
      email: 'admin@akshayacenters.com',
      password: 'admin123'
    });

    if (adminLogin.data.success) {
      console.log('✅ Admin login successful');
      
      // Test admin access to services
      const adminServicesResponse = await axios.get(`${API_BASE}/staff/services/available`, {
        headers: { 'Authorization': `Bearer ${adminLogin.data.token}` }
      });

      if (adminServicesResponse.data.success) {
        console.log(`✅ Admin can access services: ${adminServicesResponse.data.data.length} services found`);
      } else {
        console.log('❌ Admin service access failed:', adminServicesResponse.data.message);
      }
    } else {
      console.log('❌ Admin login failed');
    }

    console.log('\n3. Checking available staff accounts...');
    
    // Get staff registrations to find a test account
    const staffResponse = await axios.get(`${API_BASE}/auth/staff-registrations`);
    
    if (staffResponse.data.success) {
      const approvedStaff = staffResponse.data.registrations.filter(s => s.approvalStatus === 'approved');
      console.log(`📋 Found ${approvedStaff.length} approved staff accounts`);
      
      if (approvedStaff.length > 0) {
        const testStaff = approvedStaff[0];
        console.log(`👤 Test staff: ${testStaff.centerName} (${testStaff.email})`);
        
        // Try to login as staff (this might fail if password not set)
        try {
          const staffLogin = await axios.post(`${API_BASE}/auth/login`, {
            email: testStaff.email,
            password: 'staff123' // Default password
          });

          if (staffLogin.data.success) {
            console.log('✅ Staff login successful');
            
            // Test staff access to services
            const staffServicesResponse = await axios.get(`${API_BASE}/staff/services/available`, {
              headers: { 'Authorization': `Bearer ${staffLogin.data.token}` }
            });

            if (staffServicesResponse.data.success) {
              console.log(`✅ Staff can access services: ${staffServicesResponse.data.data.length} services found`);
              console.log(`   Meta: ${JSON.stringify(staffServicesResponse.data.meta)}`);
            } else {
              console.log('❌ Staff service access failed:', staffServicesResponse.data.message);
            }
          } else {
            console.log('❌ Staff login failed:', staffLogin.data.message);
          }
        } catch (loginError) {
          console.log('⚠️  Staff login failed (password might not be set):', loginError.response?.data?.message || loginError.message);
        }
      } else {
        console.log('⚠️  No approved staff found to test with');
      }
    }

    console.log('\n🎉 Service access test complete!');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data?.message || error.message);
  }
}

testServiceAccess();