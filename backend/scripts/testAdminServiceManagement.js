import axios from 'axios';
import mongoose from 'mongoose';
import User from '../models/User.js';
import AkshayaCenter from '../models/AkshayaCenter.js';
import Service from '../models/Service.js';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

async function testAdminServiceManagement() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Find admin user and generate token
    const adminUser = await User.findOne({ role: 'admin' });
    if (!adminUser) {
      console.log('❌ Admin user not found');
      return;
    }
    
    // Generate JWT token for admin
    const adminToken = jwt.sign(
      { userId: adminUser._id, role: adminUser.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    console.log('✅ Generated admin token for:', adminUser.name);
    
    // Find a test center
    const testCenter = await AkshayaCenter.findOne({ name: /Koovappally/i });
    if (!testCenter) {
      console.log('❌ Test center not found');
      return;
    }
    
    console.log('✅ Found test center:', testCenter.name, testCenter._id);
    
    // Test admin service management endpoints
    const baseURL = 'http://localhost:5000';
    const adminHeaders = {
      'Authorization': `Bearer ${adminToken}`,
      'Content-Type': 'application/json'
    };
    
    console.log('\n🧪 Testing Admin Service Management Endpoints...\n');
    
    // Test 1: Get all services
    try {
      console.log('1️⃣ Testing GET /api/admin/services');
      const response = await axios.get(`${baseURL}/api/admin/services`, { headers: adminHeaders });
      console.log('✅ Success:', response.status);
      console.log('📊 Total services:', response.data.data?.length || 0);
    } catch (error) {
      console.log('❌ Failed:', error.response?.status, error.response?.data?.message || error.message);
    }
    
    // Test 2: Get center services
    try {
      console.log(`\n2️⃣ Testing GET /api/admin/centers/${testCenter._id}/services`);
      const response = await axios.get(`${baseURL}/api/admin/centers/${testCenter._id}/services`, { headers: adminHeaders });
      console.log('✅ Success:', response.status);
      console.log('📊 Center services:', response.data.services?.length || 0);
    } catch (error) {
      console.log('❌ Failed:', error.response?.status, error.response?.data?.message || error.message);
    }
    
    // Test 3: Enable all services for center
    try {
      console.log(`\n3️⃣ Testing POST /api/admin/centers/${testCenter._id}/services/enable-all`);
      const response = await axios.post(`${baseURL}/api/admin/centers/${testCenter._id}/services/enable-all`, {}, { headers: adminHeaders });
      console.log('✅ Success:', response.status);
      console.log('📊 Response:', response.data.message);
      console.log('📈 Added services:', response.data.addedServices);
    } catch (error) {
      console.log('❌ Failed:', error.response?.status, error.response?.data?.message || error.message);
    }
    
    // Test 4: Verify services were added
    try {
      console.log(`\n4️⃣ Verifying services were added to center`);
      const updatedCenter = await AkshayaCenter.findById(testCenter._id).populate('services');
      console.log('✅ Center now has', updatedCenter.services.length, 'services');
      
      // List first 5 services
      if (updatedCenter.services.length > 0) {
        console.log('📋 Sample services:');
        updatedCenter.services.slice(0, 5).forEach(service => {
          console.log(`  - ${service.name} (${service.category})`);
        });
      }
    } catch (error) {
      console.log('❌ Failed to verify:', error.message);
    }
    
    // Test 5: Test staff access after admin changes
    const staffUser = await User.findOne({ email: 'akshayacenterkply@gmail.com' });
    if (staffUser) {
      const staffToken = jwt.sign(
        { userId: staffUser._id, role: staffUser.role },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );
      
      const staffHeaders = {
        'Authorization': `Bearer ${staffToken}`,
        'Content-Type': 'application/json'
      };
      
      try {
        console.log('\n5️⃣ Testing staff access after admin changes');
        const response = await axios.get(`${baseURL}/api/staff/services/available`, { headers: staffHeaders });
        console.log('✅ Staff can access services:', response.status);
        console.log('📊 Available to staff:', response.data.data?.length || 0);
        console.log('📈 Meta:', response.data.meta);
      } catch (error) {
        console.log('❌ Staff access failed:', error.response?.status, error.response?.data?.message || error.message);
      }
    }
    
    console.log('\n✅ Admin service management testing completed');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

testAdminServiceManagement();