import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from '../models/User.js';

dotenv.config();

const testAdminLogin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/akshaya-services');
    console.log('MongoDB connected successfully');

    // Find admin user
    const admin = await User.findOne({ 
      email: 'admin@akshaya.gov.in', 
      role: 'admin', 
      isActive: true 
    });
    
    if (!admin) {
      console.log('❌ Admin user not found with the specified criteria');
      console.log('Checking all users with this email...');
      
      const allWithEmail = await User.find({ email: 'admin@akshaya.gov.in' });
      console.log('Users with this email:', allWithEmail);
      return;
    }

    console.log('✅ Admin user found:', {
      id: admin._id,
      name: admin.name,
      email: admin.email,
      role: admin.role,
      isActive: admin.isActive
    });

    // Test password
    const isPasswordValid = await bcrypt.compare('admin123', admin.password);
    console.log('✅ Password valid:', isPasswordValid);

    if (isPasswordValid) {
      console.log('🎉 Admin login should work!');
    } else {
      console.log('❌ Password is incorrect');
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

testAdminLogin();