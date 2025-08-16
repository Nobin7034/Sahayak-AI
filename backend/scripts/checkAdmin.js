import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';

dotenv.config();

const checkAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/akshaya-services');
    console.log('MongoDB connected successfully');

    // Find admin user
    const admin = await User.findOne({ email: 'admin@akshaya.gov.in' });
    
    if (admin) {
      console.log('✅ Admin user found:');
      console.log('- ID:', admin._id);
      console.log('- Name:', admin.name);
      console.log('- Email:', admin.email);
      console.log('- Role:', admin.role);
      console.log('- IsActive:', admin.isActive);
      console.log('- Created:', admin.createdAt);
    } else {
      console.log('❌ Admin user not found');
    }

    // Check all users
    const allUsers = await User.find({});
    console.log('\n📊 All users in database:');
    allUsers.forEach(user => {
      console.log(`- ${user.email} (${user.role}) - Active: ${user.isActive}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

checkAdmin();