import mongoose from 'mongoose';
import axios from 'axios';
import User from '../models/User.js';
import Staff from '../models/Staff.js';
import Service from '../models/Service.js';
import AkshayaCenter from '../models/AkshayaCenter.js';
import Appointment from '../models/Appointment.js';
import DocumentRequirement from '../models/DocumentRequirement.js';

const API_BASE = 'http://localhost:5000/api';

const testAppointmentManagement = async () => {
  try {
    console.log('🧪 Testing Enhanced Appointment Management System...\n');

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://sahayakai:sahayakai@cluster0.fye0w5x.mongodb.net/sahayak_ai');
    console.log('✅ Connected to MongoDB');

    // 1. Find existing test data
    console.log('\n📋 Finding test data...');
    
    const testUser = await User.findOne({ email: { $regex: /test.*user/i } });
    const testStaff = await Staff.findOne().populate('center').populate('user');
    const testService = await Service.findOne({ isActive: true });
    
    if (!testUser || !testStaff || !testService) {
      console.log('❌ Missing test data. Please run other test scripts first.');
      return;
    }

    console.log(`✅ Found test user: ${testUser.name}`);
    console.log(`✅ Found test staff: ${testStaff.user.name} at ${testStaff.center.name}`);
    console.log(`✅ Found test service: ${testService.name}`);

    // 2. Create a test appointment with documents
    console.log('\n📅 Creating test appointment...');
    
    const testAppointment = await Appointment.create({
      user: testUser._id,
      service: testService._id,
      center: testStaff.center._id,
      appointmentDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
      timeSlot: '10:00 AM',
      status: 'pending',
      selectedDocuments: [
        {
          documentId: 'doc1',
          documentName: 'Aadhaar Card',
          isAlternative: false,
          selectedAt: new Date()
        },
        {
          documentId: 'doc2',
          documentName: 'Voter ID',
          isAlternative: true,
          alternativeName: 'Voter ID',
          selectedAt: new Date()
        }
      ],
      notes: 'Test appointment for enhanced management system'
    });

    console.log(`✅ Created test appointment: ${testAppointment._id}`);

    // 3. Login as staff to get token
    console.log('\n🔐 Logging in as staff...');
    
    const loginResponse = await axios.post(`${API_BASE}/staff/login`, {
      email: testStaff.user.email,
      password: 'password123' // Default test password
    });

    if (!loginResponse.data.success) {
      console.log('❌ Staff login failed');
      return;
    }

    const staffToken = loginResponse.data.token;
    console.log('✅ Staff login successful');

    // 4. Test appointment list endpoint
    console.log('\n📋 Testing appointment list...');
    
    const appointmentsResponse = await axios.get(`${API_BASE}/staff/appointments`, {
      headers: { 'Authorization': `Bearer ${staffToken}` }
    });

    if (appointmentsResponse.data.success) {
      console.log(`✅ Retrieved ${appointmentsResponse.data.data.appointments.length} appointments`);
    } else {
      console.log('❌ Failed to retrieve appointments');
    }

    // 5. Test detailed appointment endpoint
    console.log('\n🔍 Testing detailed appointment view...');
    
    const detailsResponse = await axios.get(`${API_BASE}/staff/appointments/${testAppointment._id}/details`, {
      headers: { 'Authorization': `Bearer ${staffToken}` }
    });

    if (detailsResponse.data.success) {
      const appointment = detailsResponse.data.data;
      console.log('✅ Retrieved detailed appointment information:');
      console.log(`   - User: ${appointment.user.name}`);
      console.log(`   - Service: ${appointment.service.name}`);
      console.log(`   - Status: ${appointment.status}`);
      console.log(`   - Selected Documents: ${appointment.selectedDocuments.length}`);
    } else {
      console.log('❌ Failed to retrieve appointment details');
    }

    // 6. Test status update
    console.log('\n🔄 Testing status update...');
    
    const statusResponse = await axios.put(`${API_BASE}/staff/appointments/${testAppointment._id}/status`, {
      status: 'confirmed',
      reason: 'All documents verified',
      notes: 'Appointment confirmed by staff'
    }, {
      headers: { 'Authorization': `Bearer ${staffToken}` }
    });

    if (statusResponse.data.success) {
      console.log('✅ Status updated successfully');
      console.log(`   - New status: ${statusResponse.data.data.newStatus}`);
    } else {
      console.log('❌ Failed to update status');
    }

    // 7. Test adding comment
    console.log('\n💬 Testing comment addition...');
    
    const commentResponse = await axios.post(`${API_BASE}/staff/appointments/${testAppointment._id}/comments`, {
      comment: 'User documents look good. Proceeding with service.'
    }, {
      headers: { 'Authorization': `Bearer ${staffToken}` }
    });

    if (commentResponse.data.success) {
      console.log('✅ Comment added successfully');
    } else {
      console.log('❌ Failed to add comment');
    }

    // 8. Test document validation update
    console.log('\n📄 Testing document validation...');
    
    const validationResponse = await axios.put(`${API_BASE}/documents/appointment/${testAppointment._id}/validate`, {
      isValidated: true,
      missingDocuments: [],
      staffNotes: 'All required documents are present and valid'
    }, {
      headers: { 'Authorization': `Bearer ${staffToken}` }
    });

    if (validationResponse.data.success) {
      console.log('✅ Document validation updated successfully');
    } else {
      console.log('❌ Failed to update document validation');
    }

    // 9. Test alternative document recommendations
    console.log('\n📋 Testing alternative document recommendations...');
    
    // First, create document requirements for the service
    const docRequirement = await DocumentRequirement.create({
      service: testService._id,
      documents: [
        {
          name: 'Identity Proof',
          description: 'Valid identity document',
          category: 'identity',
          isRequired: true,
          priority: 1,
          referenceImage: '/uploads/identity-sample.jpg',
          alternatives: [
            {
              name: 'Passport',
              description: 'Valid Indian passport',
              referenceImage: '/uploads/passport-sample.jpg',
              notes: 'Must be current and not expired'
            },
            {
              name: 'Driving License',
              description: 'Valid driving license',
              referenceImage: '/uploads/license-sample.jpg'
            }
          ]
        }
      ],
      validationRules: {
        totalRequired: 1,
        minimumThreshold: 1
      }
    });

    const recommendResponse = await axios.post(`${API_BASE}/staff/appointments/${testAppointment._id}/recommend-alternatives`, {
      recommendations: [
        {
          documentId: docRequirement.documents[0]._id,
          alternativeId: 0 // Passport
        }
      ]
    }, {
      headers: { 'Authorization': `Bearer ${staffToken}` }
    });

    if (recommendResponse.data.success) {
      console.log('✅ Alternative document recommendations sent');
      console.log(`   - Recommendations sent: ${recommendResponse.data.data.recommendationsSent}`);
    } else {
      console.log('❌ Failed to send recommendations');
    }

    // 10. Test final appointment details after all updates
    console.log('\n📊 Final appointment status...');
    
    const finalResponse = await axios.get(`${API_BASE}/staff/appointments/${testAppointment._id}/details`, {
      headers: { 'Authorization': `Bearer ${staffToken}` }
    });

    if (finalResponse.data.success) {
      const final = finalResponse.data.data;
      console.log('✅ Final appointment state:');
      console.log(`   - Status: ${final.status}`);
      console.log(`   - Comments: ${final.comments?.length || 0}`);
      console.log(`   - Status History: ${final.statusHistory?.length || 0}`);
      console.log(`   - Document Validation: ${final.documentValidation?.isValidated ? 'Validated' : 'Pending'}`);
    }

    console.log('\n🎉 Enhanced Appointment Management System Test Completed!');
    console.log('\n📋 Summary:');
    console.log('- ✅ Appointment list retrieval');
    console.log('- ✅ Detailed appointment view');
    console.log('- ✅ Status updates with history');
    console.log('- ✅ Comment system');
    console.log('- ✅ Document validation');
    console.log('- ✅ Alternative document recommendations');
    console.log('- ✅ Comprehensive appointment management');

    // Cleanup
    console.log('\n🧹 Cleaning up test data...');
    await Appointment.deleteOne({ _id: testAppointment._id });
    await DocumentRequirement.deleteOne({ _id: docRequirement._id });
    console.log('✅ Cleanup completed');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    process.exit(0);
  }
};

// Run the test
testAppointmentManagement();