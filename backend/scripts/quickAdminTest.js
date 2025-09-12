import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from '../models/User.js';

dotenv.config();

const testAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/akshaya-services');
    console.log('✅ MongoDB connected');

    // Check if admin exists
    const admin = await User.findOne({ email: 'admin@akshaya.gov.in' });
    
    if (!admin) {
      console.log('❌ Admin user not found');
      
      // Create admin user
      const hashedPassword = await bcrypt.hash('admin123', 10);
      const newAdmin = new User({
        name: 'System Administrator',
        email: 'admin@akshaya.gov.in',
        password: hashedPassword,
        phone: '9876543210',
        role: 'admin',
        isActive: true
      });

      await newAdmin.save();
      console.log('✅ Admin user created');
    } else {
      console.log('✅ Admin user exists');
      console.log('Admin details:', {
        name: admin.name,
        email: admin.email,
        role: admin.role,
        isActive: admin.isActive
      });
      
      // Test password
      const isPasswordValid = await bcrypt.compare('admin123', admin.password);
      console.log('✅ Password valid:', isPasswordValid);
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

testAdmin();