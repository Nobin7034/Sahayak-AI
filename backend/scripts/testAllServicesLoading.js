import axios from 'axios';
import mongoose from 'mongoose';
import Service from '../models/Service.js';
import AkshayaCenter from '../models/AkshayaCenter.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const BASE_URL = 'http://localhost:5000/api/staff';
const STAFF_CREDENTIALS = {
  email: 'akshayacenterkply@gmail.com',
  password: 'Staff@123'
};

async function testAllServicesLoading() {
  try {
    console.log('🔍 Testing if staff can see ALL services admin created...\n');
    
    // Connect to database to check actual services
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    // Get all services from database
    const allServicesInDB = await Service.find({ isActive: true }).select('name category fee');
    console.log(`📊 Total services in database: ${allServicesInDB.length}`);
    
    // Get all centers
    const allCenters = await AkshayaCenter.find({}).select('name services');
    console.log(`🏢 Total centers: ${allCenters.length}`);
    
    // Show which services are assigned to which centers
    console.log('\n📋 Service distribution across centers:');
    allCenters.forEach(center => {
      console.log(`   ${center.name}: ${center.services?.length || 0} services`);
    });
    
    await mongoose.disconnect();
    
    // Now test the API
    console.log('\n🔐 Testing staff API...');
    const loginResponse = await axios.post(`${BASE_URL}/login`, STAFF_CREDENTIALS);
    
    if (!loginResponse.data.success) {
      console.error('❌ Login failed:', loginResponse.data.message);
      return;
    }
    
    console.log('✅ Staff login successful');
    const token = loginResponse.data.data.token;
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    
    // Test available services endpoint
    const availableResponse = await axios.get(`${BASE_URL}/services/available`, { headers });
    
    if (!availableResponse.data.success) {
      console.error('❌ Failed to fetch services:', availableResponse.data.message);
      return;
    }
    
    const staffServices = availableResponse.data.data;
    console.log(`📋 Services returned to staff: ${staffServices.length}`);
    
    // Check if we're getting all services
    if (staffServices.length === allServicesInDB.length) {
      console.log('✅ SUCCESS: Staff can see ALL services that admin created!');
    } else {
      console.log(`⚠️  Staff sees ${staffServices.length} services, but database has ${allServicesInDB.length} services`);
    }
    
    // Show service details with status
    console.log('\n📊 Service status breakdown:');
    const enabled = staffServices.filter(s => s.isEnabled);
    const hidden = staffServices.filter(s => s.isHidden);
    const available = staffServices.filter(s => !s.isHidden);
    
    console.log(`   Total services: ${staffServices.length}`);
    console.log(`   Enabled at center: ${enabled.length}`);
    console.log(`   Hidden by center: ${hidden.length}`);
    console.log(`   Available (not hidden): ${available.length}`);
    
    // Show metadata if available
    if (availableResponse.data.meta) {
      console.log('\n📈 API Metadata:');
      console.log(`   Total: ${availableResponse.data.meta.total}`);
      console.log(`   Enabled: ${availableResponse.data.meta.enabled}`);
      console.log(`   Hidden: ${availableResponse.data.meta.hidden}`);
      console.log(`   Available: ${availableResponse.data.meta.available}`);
    }
    
    // Show sample services
    console.log('\n📋 Sample services:');
    staffServices.slice(0, 3).forEach(service => {
      const status = service.isEnabled ? '✅ Enabled' : 
                    service.isHidden ? '👁️‍🗨️ Hidden' : 
                    '⭕ Available';
      console.log(`   ${service.name} (${service.category}) - ₹${service.fees} - ${status}`);
    });
    
    console.log('\n🎉 Test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data?.message || error.message);
  }
}

testAllServicesLoading();