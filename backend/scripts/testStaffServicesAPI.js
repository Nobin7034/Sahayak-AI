import axios from 'axios';
import mongoose from 'mongoose';
import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

async function testStaffServicesAPI() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Find staff user and generate token
    const user = await User.findOne({ email: 'akshayacenterkply@gmail.com' });
    if (!user) {
      console.log('❌ Staff user not found');
      return;
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    console.log('✅ Generated token for:', user.name);
    
    // Test different staff service endpoints
    const baseURL = 'http://localhost:5000';
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    
    console.log('\n🧪 Testing Staff Service Endpoints...\n');
    
    // Test 1: Get available services
    try {
      console.log('1️⃣ Testing GET /api/staff/services/available');
      const response = await axios.get(`${baseURL}/api/staff/services/available`, { headers });
      console.log('✅ Success:', response.status);
      console.log('📊 Available services:', response.data.data?.length || 0);
      if (response.data.meta) {
        console.log('📈 Meta:', response.data.meta);
      }
    } catch (error) {
      console.log('❌ Failed:', error.response?.status, error.response?.data?.message || error.message);
    }
    
    // Test 2: Get center services
    try {
      console.log('\n2️⃣ Testing GET /api/staff/services/center');
      const response = await axios.get(`${baseURL}/api/staff/services/center`, { headers });
      console.log('✅ Success:', response.status);
      console.log('📊 Center services:', response.data.data?.length || 0);
    } catch (error) {
      console.log('❌ Failed:', error.response?.status, error.response?.data?.message || error.message);
    }
    
    // Test 3: Get hidden services
    try {
      console.log('\n3️⃣ Testing GET /api/staff/services/hidden');
      const response = await axios.get(`${baseURL}/api/staff/services/hidden`, { headers });
      console.log('✅ Success:', response.status);
      console.log('📊 Hidden services:', response.data.data?.length || 0);
    } catch (error) {
      console.log('❌ Failed:', error.response?.status, error.response?.data?.message || error.message);
    }
    
    // Test 4: Test staff dashboard
    try {
      console.log('\n4️⃣ Testing GET /api/staff/dashboard');
      const response = await axios.get(`${baseURL}/api/staff/dashboard`, { headers });
      console.log('✅ Success:', response.status);
      console.log('📊 Dashboard data available');
    } catch (error) {
      console.log('❌ Failed:', error.response?.status, error.response?.data?.message || error.message);
    }
    
    console.log('\n✅ API testing completed');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

testStaffServicesAPI();