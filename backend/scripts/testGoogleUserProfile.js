import axios from 'axios';
import User from '../models/User.js';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const API_BASE_URL = 'http://localhost:5000';

async function testGoogleUserProfile() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/akshaya-centers');
    console.log('✅ Connected to MongoDB');

    // Find a Google user in the database
    const googleUser = await User.findOne({ provider: 'google' });
    
    if (!googleUser) {
      console.log('❌ No Google users found in database');
      console.log('Creating a test Google user...');
      
      // Create a test Google user
      const testUser = await User.create({
        name: 'Test Google User',
        email: 'testgoogle@example.com',
        googleId: 'test-google-id-123',
        provider: 'google',
        avatar: 'https://example.com/avatar.jpg',
        role: 'user',
        isActive: true
      });
      
      console.log('✅ Created test Google user:', testUser.email);
      
      // Test the /auth/me endpoint with this user
      await testAuthMeEndpoint(testUser);
    } else {
      console.log('✅ Found Google user:', googleUser.email);
      await testAuthMeEndpoint(googleUser);
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.disconnect();
  }
}

async function testAuthMeEndpoint(user) {
  try {
    console.log('\n🔍 Testing /auth/me endpoint...');
    
    // Create a mock Firebase ID token (in real scenario, this would come from Firebase)
    // For testing, we'll simulate the authentication middleware behavior
    
    // Test 1: Direct database query (what the endpoint should return)
    console.log('\n1. Direct database query:');
    const dbUser = await User.findById(user._id).select('-password');
    console.log('User from DB:', {
      id: dbUser._id,
      name: dbUser.name,
      email: dbUser.email,
      role: dbUser.role,
      avatar: dbUser.avatar,
      provider: dbUser.provider,
      phone: dbUser.phone,
      lastLogin: dbUser.lastLogin,
      createdAt: dbUser.createdAt
    });

    // Test 2: Check if the user data has all required fields
    console.log('\n2. Checking user data completeness:');
    const requiredFields = ['name', 'email', 'role', 'provider'];
    const missingFields = requiredFields.filter(field => !dbUser[field]);
    
    if (missingFields.length > 0) {
      console.log('❌ Missing required fields:', missingFields);
    } else {
      console.log('✅ All required fields present');
    }

    // Test 3: Check optional fields
    console.log('\n3. Checking optional fields:');
    console.log('Avatar:', dbUser.avatar || 'Not set');
    console.log('Phone:', dbUser.phone || 'Not set');
    console.log('Last Login:', dbUser.lastLogin || 'Never');

    // Test 4: Simulate what the frontend Profile component expects
    console.log('\n4. Frontend Profile component expectations:');
    const profileData = {
      id: dbUser._id,
      name: dbUser.name,
      email: dbUser.email,
      role: dbUser.role,
      avatar: dbUser.avatar,
      provider: dbUser.provider,
      phone: dbUser.phone,
      lastLogin: dbUser.lastLogin,
      createdAt: dbUser.createdAt
    };
    
    console.log('Profile data structure:', profileData);
    
    // Check if all fields that Profile.jsx uses are available
    const profileFields = ['name', 'email', 'role', 'avatar', 'provider', 'phone', 'createdAt', 'lastLogin'];
    const availableFields = profileFields.filter(field => profileData[field] !== undefined);
    const unavailableFields = profileFields.filter(field => profileData[field] === undefined);
    
    console.log('✅ Available fields:', availableFields);
    if (unavailableFields.length > 0) {
      console.log('⚠️ Unavailable fields:', unavailableFields);
    }

    return profileData;

  } catch (error) {
    console.error('❌ Auth endpoint test failed:', error);
    throw error;
  }
}

// Run the test
testGoogleUserProfile();