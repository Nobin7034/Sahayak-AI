#!/usr/bin/env node

/**
 * Test Service Selection Flow
 * Tests the new service selection popup functionality
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

async function testServiceSelectionFlow() {
  console.log('\n🧪 Testing Service Selection Flow...\n');

  try {
    // 1. Get admin token (assuming admin exists)
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

    // 2. Get available services
    console.log('\n2. Fetching available services...');
    const servicesResponse = await axios.get(`${API_BASE}/admin/services`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });

    if (!servicesResponse.data.success) {
      throw new Error('Failed to fetch services');
    }

    const services = servicesResponse.data.data.filter(s => s.isActive);
    console.log(`✅ Found ${services.length} active services:`);
    services.forEach(service => {
      console.log(`   - ${service.name} (${service.category}) - ₹${service.fee}`);
    });

    if (services.length === 0) {
      console.log('⚠️  No active services found. Creating test services...');
      
      // Create test services
      const testServices = [
        {
          name: 'Aadhaar Card Application',
          description: 'Apply for new Aadhaar card',
          category: 'Identity',
          fee: 50,
          processingTime: '7-10 days',
          isActive: true
        },
        {
          name: 'PAN Card Application',
          description: 'Apply for new PAN card',
          category: 'Identity',
          fee: 107,
          processingTime: '15-20 days',
          isActive: true
        },
        {
          name: 'Passport Application',
          description: 'Apply for new passport',
          category: 'Travel',
          fee: 1500,
          processingTime: '30-45 days',
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
    console.log('\n3. Fetching pending staff registrations...');
    const staffResponse = await axios.get(`${API_BASE}/auth/staff-registrations`);

    if (!staffResponse.data.success) {
      throw new Error('Failed to fetch staff registrations');
    }

    const pendingStaff = staffResponse.data.registrations.filter(s => s.approvalStatus === 'pending');
    console.log(`✅ Found ${pendingStaff.length} pending staff registrations`);

    if (pendingStaff.length === 0) {
      console.log('⚠️  No pending staff found. The service selection flow can be tested when staff register.');
      return;
    }

    // 4. Test service selection approval
    const testStaff = pendingStaff[0];
    console.log(`\n4. Testing service selection approval for: ${testStaff.centerName}`);

    // Select first 2 services for testing
    const selectedServices = services.slice(0, 2).map(s => s._id);
    console.log(`   Selected services: ${services.slice(0, 2).map(s => s.name).join(', ')}`);

    const approvalResponse = await axios.post(
      `${API_BASE}/auth/admin/approve-staff/${testStaff._id}`,
      {
        adminId: adminLogin.data.user.id,
        notes: 'Approved with selected services via automated test',
        selectedServices: selectedServices
      }
    );

    if (approvalResponse.data.success) {
      console.log('✅ Staff approved successfully!');
      console.log(`   Message: ${approvalResponse.data.message}`);
      console.log(`   Services assigned: ${approvalResponse.data.data.servicesAssigned}`);
    } else {
      throw new Error(`Approval failed: ${approvalResponse.data.message}`);
    }

    // 5. Verify staff can access services
    console.log('\n5. Testing staff service access...');
    
    // Login as the approved staff
    const staffLogin = await axios.post(`${API_BASE}/auth/login`, {
      email: testStaff.email,
      password: 'staff123' // Default password for test staff
    });

    if (staffLogin.data.success) {
      const staffToken = staffLogin.data.token;
      console.log('✅ Staff login successful');

      // Try to access services
      const staffServicesResponse = await axios.get(`${API_BASE}/staff/services/available`, {
        headers: { 'Authorization': `Bearer ${staffToken}` }
      });

      if (staffServicesResponse.data.success) {
        const enabledServices = staffServicesResponse.data.data.filter(s => s.isEnabled);
        console.log(`✅ Staff can access ${enabledServices.length} services:`);
        enabledServices.forEach(service => {
          console.log(`   - ${service.name} (enabled: ${service.isEnabled})`);
        });
      } else {
        console.log('❌ Staff service access failed:', staffServicesResponse.data.message);
      }
    } else {
      console.log('⚠️  Staff login failed - may need to set password manually');
    }

    console.log('\n🎉 Service Selection Flow Test Complete!');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data?.message || error.message);
  }
}

async function main() {
  await connectDB();
  await testServiceSelectionFlow();
  await mongoose.disconnect();
  console.log('\n👋 Disconnected from MongoDB');
}

main().catch(console.error);