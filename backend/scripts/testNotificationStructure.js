import axios from 'axios';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const API_BASE_URL = 'http://localhost:5000/api';

async function testNotificationStructure() {
  try {
    console.log('🔍 Testing notification API response structure...');
    
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

    // Get notifications response
    const response = await axios.get(`${API_BASE_URL}/notifications`, { headers });
    
    console.log('📋 Notifications Response Structure:');
    console.log('Success:', response.data.success);
    console.log('Response keys:', Object.keys(response.data));
    console.log('Full response:', JSON.stringify(response.data, null, 2));
    
    // Test what the frontend expects
    console.log('\n🔧 Frontend Processing:');
    const notificationsData = response.data?.items || [];
    console.log('Processed notifications:', notificationsData);
    console.log('Is array:', Array.isArray(notificationsData));
    console.log('Length:', notificationsData.length);

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

testNotificationStructure();