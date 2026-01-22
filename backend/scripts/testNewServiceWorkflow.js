#!/usr/bin/env node

/**
 * Test New Service Management Workflow
 * Tests the updated workflow where:
 * 1. Admin approval doesn't assign services
 * 2. Staff see all services as disabled by default
 * 3. Staff manually enable services
 * 4. Admin global control overrides everything
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import axios from 'axios';

// Load environment variables
dotenv.config();

const API_BASE = 'http://localhost:5000/api';

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
}

async function testNewServiceWorkflow() {
  console.log('\n🧪 Testing New Service Management Workflow...\n');

  try {
    // 1. Get admin token
    console.log('1. Getting admin authentication...');
    const adminLogin = await axios.post(`${API_BASE}/auth/login`, {
      email: 'admin@akshayacenters.com',
      password: 'admin123'
    });

    if (!adminLogin.data.success) {
      throw new Error('Admin login failed');
    }

    const adminToken = adminLogin.data.token;
    console.log('✅ Admin authenticated');

    // 2. Ensure we have test services
    console.log('\n2. Checking available services...');
    const servicesResponse = await axios.get(`${API_BASE}/admin/services`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });

    let services = servicesResponse.data.data.filter(s => s.isActive);
    console.log(`✅ Found ${services.length} active services`);

    if (services.length === 0) {
      console.log('⚠️  Creating test services...');
      
      const testServices = [
        {
          name: 'Aadhaar Card Application',
          description: 'Apply for new Aadhaar card',
          category: 'Identity',
          fee: 50,
          serviceCharge: 10,
          processingTime: '7-10 days',
          isActive: true
        },
        {
          name: 'PAN Card Application',
          description: 'Apply for new PAN card',
          category: 'Identity',
          fee: 107,
          serviceCharge: 20,
          processingTime: '15-20 days',
          isActive: true
        }
      ];

      for (const serviceData of testServices) {
        const createResponse = await axios.post(`${API_BASE}/admin/services`, serviceData, {
          headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        
        if (createResponse.data.success) {
          console.log(`✅ Created service: ${serviceData.name}`);
          services.push(createResponse.data.data);
        }
      }
    }

    // 3. Get pending staff registrations
    console.log('\n3. Checking staff registrations...');
    const staffResponse = await axios.get(`${API_BASE}/auth/staff-registrations`);

    if (!staffResponse.data.success) {
      throw new Error('Failed to fetch staff registrations');
    }

    const pendingStaff = staffResponse.data.registrations.filter(s => s.approvalStatus === 'pending');
    console.log(`✅ Found ${pendingStaff.length} pending staff registrations`);

    if (pendingStaff.length === 0) {
      console.log('⚠️  No pending staff found. Testing with existing approved staff...');
      
      // Find an approved staff member
      const approvedStaff = staffResponse.data.registrations.filter(s => s.approvalStatus === 'approved');
      if (approvedStaff.length === 0) {
        console.log('❌ No staff found to test with');
        return;
      }

      // Test with first approved staff
      const testStaff = approvedStaff[0];
      console.log(`📋 Testing with approved staff: ${testStaff.centerName}`);
      
      // Login as staff and test service access
      await testStaffServiceAccess(testStaff, services);
      return;
    }

    // 4. Test new approval workflow (no service assignment)
    const testStaff = pendingStaff[0];
    console.log(`\n4. Testing new approval workflow for: ${testStaff.centerName}`);

    const approvalResponse = await axios.post(
      `${API_BASE}/auth/admin/approve-staff/${testStaff._id}`,
      {
        adminId: adminLogin.data.user.id,
        notes: 'Approved via new workflow test - no automatic service assignment'
        // Note: No selectedServices parameter
      }
    );

    if (approvalResponse.data.success) {
      console.log('✅ Staff approved successfully with new workflow!');
      console.log(`   Message: ${approvalResponse.data.message}`);
      console.log(`   Services assigned: ${approvalResponse.data.data.servicesAssigned}`);
      console.log(`   Manual management: ${approvalResponse.data.data.manualServiceManagement}`);
    } else {
      throw new Error(`Approval failed: ${approvalResponse.data.message}`);
    }

    // 5. Test staff service access with new workflow
    await testStaffServiceAccess(testStaff, services);

    // 6. Test admin global control
    await testAdminGlobalControl(adminToken, services, testStaff);

    console.log('\n🎉 New Service Workflow Test Complete!');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data?.message || error.message);
  }
}

async function testStaffServiceAccess(testStaff, services) {
  console.log('\n5. Testing staff service access with new workflow...');
  
  try {
    // Login as staff
    const staffLogin = await axios.post(`${API_BASE}/auth/login`, {
      email: testStaff.email,
      password: 'staff123' // Default password
    });

    if (!staffLogin.data.success) {
      console.log('⚠️  Staff login failed - may need to set password manually');
      return;
    }

    const staffToken = staffLogin.data.token;
    console.log('✅ Staff login successful');

    // Get available services
    const staffServicesResponse = await axios.get(`${API_BASE}/staff/services/available`, {
      headers: { 'Authorization': `Bearer ${staffToken}` }
    });

    if (staffServicesResponse.data.success) {
      const allServices = staffServicesResponse.data.data;
      const enabledServices = allServices.filter(s => s.isEnabled);
      const availableServices = allServices.filter(s => !s.isHidden && s.centerStatus?.isGloballyActive);
      
      console.log(`✅ Staff can see ${allServices.length} total services`);
      console.log(`   - ${enabledServices.length} enabled (should be 0 initially)`);
      console.log(`   - ${availableServices.length} available to enable`);
      console.log(`   - ${staffServicesResponse.data.meta.globallyActive} globally active`);

      if (enabledServices.length === 0) {
        console.log('✅ Correct: No services enabled by default');
      } else {
        console.log('❌ Unexpected: Some services are enabled by default');
      }

      // Test enabling a service
      if (availableServices.length > 0) {
        const serviceToEnable = availableServices[0];
        console.log(`\n📋 Testing manual service enablement: ${serviceToEnable.name}`);

        const enableResponse = await axios.put(
          `${API_BASE}/staff/services/${serviceToEnable._id}/toggle`,
          { enabled: true },
          { headers: { 'Authorization': `Bearer ${staffToken}` } }
        );

        if (enableResponse.data.success) {
          console.log('✅ Service enabled successfully by staff');
          console.log(`   Message: ${enableResponse.data.message}`);
        } else {
          console.log('❌ Failed to enable service:', enableResponse.data.message);
        }

        // Verify the service is now enabled
        const verifyResponse = await axios.get(`${API_BASE}/staff/services/available`, {
          headers: { 'Authorization': `Bearer ${staffToken}` }
        });

        if (verifyResponse.data.success) {
          const nowEnabled = verifyResponse.data.data.filter(s => s.isEnabled);
          console.log(`✅ Verification: ${nowEnabled.length} service(s) now enabled`);
        }
      }

    } else {
      console.log('❌ Staff service access failed:', staffServicesResponse.data.message);
    }

  } catch (error) {
    console.log('❌ Staff service access test failed:', error.response?.data?.message || error.message);
  }
}

async function testAdminGlobalControl(adminToken, services, testStaff) {
  console.log('\n6. Testing admin global control...');

  try {
    if (services.length === 0) {
      console.log('⚠️  No services to test admin control with');
      return;
    }

    const testService = services[0];
    console.log(`📋 Testing admin global disable for: ${testService.name}`);

    // Disable service globally
    const disableResponse = await axios.put(
      `${API_BASE}/admin/services/${testService._id}`,
      { ...testService, isActive: false },
      { headers: { 'Authorization': `Bearer ${adminToken}` } }
    );

    if (disableResponse.data.success) {
      console.log('✅ Service disabled globally by admin');

      // Test staff access after admin disable
      const staffLogin = await axios.post(`${API_BASE}/auth/login`, {
        email: testStaff.email,
        password: 'staff123'
      });

      if (staffLogin.data.success) {
        const staffToken = staffLogin.data.token;

        // Try to enable the disabled service
        const enableAttempt = await axios.put(
          `${API_BASE}/staff/services/${testService._id}/toggle`,
          { enabled: true },
          { headers: { 'Authorization': `Bearer ${staffToken}` } }
        );

        if (!enableAttempt.data.success && enableAttempt.data.message.includes('disabled by admin')) {
          console.log('✅ Correct: Staff cannot enable admin-disabled service');
          console.log(`   Message: ${enableAttempt.data.message}`);
        } else {
          console.log('❌ Unexpected: Staff was able to enable admin-disabled service');
        }

        // Check service visibility
        const servicesCheck = await axios.get(`${API_BASE}/staff/services/available`, {
          headers: { 'Authorization': `Bearer ${staffToken}` }
        });

        if (servicesCheck.data.success) {
          const disabledService = servicesCheck.data.data.find(s => s._id === testService._id);
          if (disabledService && !disabledService.centerStatus?.isGloballyActive) {
            console.log('✅ Correct: Service shows as admin-disabled in staff interface');
          } else {
            console.log('❌ Unexpected: Service not properly marked as admin-disabled');
          }
        }
      }

      // Re-enable service for cleanup
      await axios.put(
        `${API_BASE}/admin/services/${testService._id}`,
        { ...testService, isActive: true },
        { headers: { 'Authorization': `Bearer ${adminToken}` } }
      );
      console.log('🔄 Service re-enabled for cleanup');

    } else {
      console.log('❌ Failed to disable service globally:', disableResponse.data.message);
    }

  } catch (error) {
    console.log('❌ Admin global control test failed:', error.response?.data?.message || error.message);
  }
}

async function main() {
  await connectDB();
  await testNewServiceWorkflow();
  await mongoose.disconnect();
  console.log('\n👋 Disconnected from MongoDB');
}

main().catch(console.error);