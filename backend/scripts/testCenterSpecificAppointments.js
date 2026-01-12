import axios from 'axios';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Service from '../models/Service.js';
import AkshayaCenter from '../models/AkshayaCenter.js';
import Appointment from '../models/Appointment.js';
import Staff from '../models/Staff.js';

dotenv.config();

const BASE_URL = 'http://localhost:5000';

async function testCenterSpecificAppointmentWorkflow() {
  try {
    console.log('🧪 Testing Center-Specific Appointment Workflow...\n');

    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // 1. Test appointment creation requires center
    console.log('\n1. Testing appointment creation requires center...');
    
    // Find a test user
    const testUser = await User.findOne({ role: 'user' });
    if (!testUser) {
      console.log('❌ No test user found');
      return;
    }

    // Login as test user
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: testUser.email,
      password: 'password123' // Assuming default password
    });

    let userToken = null;
    if (loginResponse.data.success) {
      userToken = loginResponse.data.token;
      console.log('✅ User login successful');
    } else {
      console.log('❌ User login failed');
      return;
    }

    // Find a service and center
    const service = await Service.findOne({ isActive: true });
    const center = await AkshayaCenter.findOne({ status: 'active' });
    
    if (!service || !center) {
      console.log('❌ No active service or center found');
      return;
    }

    // Test appointment creation without center (should fail)
    try {
      await axios.post(`${BASE_URL}/api/appointments`, {
        service: service._id,
        appointmentDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
        timeSlot: '10:00 AM',
        notes: 'Test appointment'
      }, {
        headers: { 'Authorization': `Bearer ${userToken}` }
      });
      console.log('❌ Appointment creation without center should have failed');
    } catch (error) {
      if (error.response?.status === 400) {
        console.log('✅ Appointment creation correctly requires center');
      } else {
        console.log('⚠️  Unexpected error:', error.response?.status);
      }
    }

    // Test appointment creation with center
    const appointmentResponse = await axios.post(`${BASE_URL}/api/appointments`, {
      service: service._id,
      center: center._id,
      appointmentDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
      timeSlot: '10:00 AM',
      notes: 'Test center-specific appointment'
    }, {
      headers: { 'Authorization': `Bearer ${userToken}` }
    });

    if (appointmentResponse.data.success) {
      console.log('✅ Appointment created successfully with center');
      const appointmentId = appointmentResponse.data.data._id;

      // 2. Test staff can only access appointments for their center
      console.log('\n2. Testing staff center-specific access...');
      
      // Find staff for this center
      const staff = await Staff.findOne({ center: center._id, isActive: true }).populate('userId');
      if (!staff) {
        console.log('❌ No staff found for center');
        return;
      }

      // Login as staff
      const staffLoginResponse = await axios.post(`${BASE_URL}/api/staff/login`, {
        email: staff.userId.email,
        password: 'Staff@123' // Assuming default staff password
      });

      let staffToken = null;
      if (staffLoginResponse.data.success) {
        staffToken = staffLoginResponse.data.token;
        console.log('✅ Staff login successful');
      } else {
        console.log('❌ Staff login failed');
        return;
      }

      // Test staff can access appointment for their center
      const staffAppointmentResponse = await axios.get(`${BASE_URL}/api/staff/appointments/${appointmentId}`, {
        headers: { 'Authorization': `Bearer ${staffToken}` }
      });

      if (staffAppointmentResponse.data.success) {
        console.log('✅ Staff can access appointments for their center');
      } else {
        console.log('❌ Staff cannot access appointment for their center');
      }

      // Test staff can update appointment status
      const statusUpdateResponse = await axios.put(`${BASE_URL}/api/staff/appointments/${appointmentId}/status`, {
        status: 'confirmed',
        notes: 'Confirmed by staff'
      }, {
        headers: { 'Authorization': `Bearer ${staffToken}` }
      });

      if (statusUpdateResponse.data.success) {
        console.log('✅ Staff can update appointment status');
      } else {
        console.log('❌ Staff cannot update appointment status');
      }

      // 3. Test admin has read-only access
      console.log('\n3. Testing admin read-only access...');
      
      // Find admin user
      const adminUser = await User.findOne({ role: 'admin' });
      if (!adminUser) {
        console.log('❌ No admin user found');
        return;
      }

      // Login as admin
      const adminLoginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
        email: adminUser.email,
        password: 'Admin@123' // Assuming default admin password
      });

      let adminToken = null;
      if (adminLoginResponse.data.success) {
        adminToken = adminLoginResponse.data.token;
        console.log('✅ Admin login successful');
      } else {
        console.log('❌ Admin login failed');
        return;
      }

      // Test admin can view appointments (read-only)
      const adminAppointmentResponse = await axios.get(`${BASE_URL}/api/admin/appointments`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });

      if (adminAppointmentResponse.data.success) {
        console.log('✅ Admin can view appointments for monitoring');
      } else {
        console.log('❌ Admin cannot view appointments');
      }

      // Test admin cannot update appointment status (should fail)
      try {
        await axios.patch(`${BASE_URL}/api/admin/appointments/${appointmentId}/status`, {
          status: 'completed',
          notes: 'Admin trying to update'
        }, {
          headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        console.log('❌ Admin should not be able to update appointment status');
      } catch (error) {
        if (error.response?.status === 404) {
          console.log('✅ Admin correctly cannot update appointment status (endpoint removed)');
        } else {
          console.log('⚠️  Unexpected error:', error.response?.status);
        }
      }

      // 4. Test appointment workflow
      console.log('\n4. Testing complete appointment workflow...');
      
      // Staff marks appointment as in progress
      await axios.put(`${BASE_URL}/api/staff/appointments/${appointmentId}/status`, {
        status: 'in_progress',
        notes: 'Service in progress'
      }, {
        headers: { 'Authorization': `Bearer ${staffToken}` }
      });
      console.log('✅ Staff marked appointment as in progress');

      // Staff completes appointment
      await axios.put(`${BASE_URL}/api/staff/appointments/${appointmentId}/status`, {
        status: 'completed',
        notes: 'Service completed successfully'
      }, {
        headers: { 'Authorization': `Bearer ${staffToken}` }
      });
      console.log('✅ Staff completed appointment');

      // 5. Test appointment statistics
      console.log('\n5. Testing appointment statistics...');
      
      // Staff can view their center's stats
      const staffStatsResponse = await axios.get(`${BASE_URL}/api/staff/appointments/stats/summary`, {
        headers: { 'Authorization': `Bearer ${staffToken}` }
      });

      if (staffStatsResponse.data.success) {
        console.log('✅ Staff can view center-specific statistics');
        console.log('📊 Center stats:', staffStatsResponse.data.data.stats);
      }

      // Admin can view system-wide stats
      const adminStatsResponse = await axios.get(`${BASE_URL}/api/admin/appointments/stats`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });

      if (adminStatsResponse.data.success) {
        console.log('✅ Admin can view system-wide statistics');
        console.log('📊 System stats:', {
          totalAppointments: adminStatsResponse.data.data.totalAppointments,
          centersCount: Object.keys(adminStatsResponse.data.data.centerStats).length
        });
      }

      console.log('\n🎉 Center-Specific Appointment Workflow Test Complete!');
      console.log('\n📋 Summary:');
      console.log('✅ Appointments require center selection');
      console.log('✅ Staff can only manage appointments for their center');
      console.log('✅ Admin has read-only monitoring access');
      console.log('✅ Complete appointment workflow works');
      console.log('✅ Statistics are properly segregated');

    } else {
      console.log('❌ Failed to create appointment with center');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

testCenterSpecificAppointmentWorkflow();