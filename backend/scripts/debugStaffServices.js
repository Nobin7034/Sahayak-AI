import axios from 'axios';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const API_BASE_URL = 'http://localhost:5000/api';

async function debugStaffServices() {
  try {
    console.log('🔍 Debugging staff services response...');
    
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb+srv://nobinrajeev:nobinrajeev@cluster1.fye0w5x.mongodb.net/sahayak_ai?retryWrites=true&w=majority';
    await mongoose.connect(mongoUri);

    // Login as staff
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: 'akshayacenterkply@gmail.com',
      password: 'Staff@123'
    });

    const token = loginResponse.data.token;
    const headers = { 'Authorization': `Bearer ${token}` };

    // Get services response
    const response = await axios.get(`${API_BASE_URL}/staff/services/available`, { headers });
    
    console.log('📋 Services Response Structure:');
    console.log('Success:', response.data.success);
    console.log('Keys:', Object.keys(response.data));
    
    if (response.data.data) {
      console.log('Data length:', response.data.data.length);
      console.log('Sample service:', JSON.stringify(response.data.data[0], null, 2));
    }
    
    if (response.data.meta) {
      console.log('Meta:', JSON.stringify(response.data.meta, null, 2));
    }

  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

debugStaffServices();