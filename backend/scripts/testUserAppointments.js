import axios from 'axios';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const API_URL = 'http://localhost:5000/api';

async function testUserAppointments() {
  try {
    console.log('🧪 Testing User Appointments Flow...\n');

    // Connect to MongoDB to check data directly
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const Appointment = (await import('../models/Appointment.js')).default;
    const User = (await import('../models/User.js')).default;
    const Service = (await import('../models/Service.js')).default;
    const AkshayaCenter = (await import('../models/AkshayaCenter.js')).default;

    // Find a regular user (not staff/admin)
    const testUser = await User.findOne({ role: 'user' });
    
    if (!testUser) {
      console.log('❌ No regular user found in database');
      return;
    }

    console.log(`📋 Testing with user: ${testUser.name} (${testUser.email})`);
    console.log(`   User ID: ${testUser._id}\n`);

    // Check appointments in database
    const dbAppointments = await Appointment.find({ user: testUser._id })
      .populate('service', 'name category fee processingTime serviceCharge')
      .populate('center', 'name address contact location')
      .sort({ createdAt: -1 });

    console.log(`📊 Appointments in Database: ${dbAppointments.length}`);
    
    if (dbAppointments.length > 0) {
      console.log('\n📝 Appointment Details:');
      dbAppointments.forEach((apt, index) => {
        console.log(`\n${index + 1}. Appointment ID: ${apt._id}`);
        console.log(`   Service: ${apt.service?.name || 'N/A'}`);
        console.log(`   Center: ${apt.center?.name || 'N/A'}`);
        console.log(`   Date: ${apt.appointmentDate}`);
        console.log(`   Time: ${apt.timeSlot}`);
        console.log(`   Status: ${apt.status}`);
        console.log(`   Payment Status: ${apt.payment?.status || 'unpaid'}`);
        console.log(`   Created: ${apt.createdAt}`);
      });
    } else {
      console.log('   No appointments found for this user');
    }

    // Now test the API endpoint
    console.log('\n\n🌐 Testing API Endpoint...');
    
    // We need to simulate authentication
    // In a real scenario, you'd need a valid JWT token
    console.log('⚠️  Note: API test requires valid authentication token');
    console.log('   To test the API, use the frontend or get a token from login\n');

    await mongoose.disconnect();
    console.log('✅ Test completed');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error);
  } finally {
    process.exit(0);
  }
}

testUserAppointments();
