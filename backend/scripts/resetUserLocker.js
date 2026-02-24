import mongoose from 'mongoose';
import dotenv from 'dotenv';
import connectDB from '../config/db.js';
import DocumentLocker from '../models/DocumentLocker.js';
import LockerDocument from '../models/LockerDocument.js';
import User from '../models/User.js';

dotenv.config();

const resetUserLocker = async () => {
  try {
    await connectDB();
    console.log('✅ Connected to database');

    // Find the user
    const userEmail = 'nobinrajeev431@gmail.com';
    const user = await User.findOne({ email: userEmail });
    
    if (!user) {
      console.log(`❌ User ${userEmail} not found`);
      return;
    }
    
    console.log(`✅ Found user: ${user.name} (${user.email})`);

    // Find and delete existing locker
    const existingLocker = await DocumentLocker.findOne({ user: user._id });
    if (existingLocker) {
      console.log('🗑️  Deleting existing locker...');
      
      // Delete associated documents
      const deletedDocs = await LockerDocument.deleteMany({ locker: existingLocker._id });
      console.log(`   Deleted ${deletedDocs.deletedCount} documents`);
      
      // Delete locker
      await DocumentLocker.deleteOne({ _id: existingLocker._id });
      console.log('   Deleted locker');
    }

    // Clean up any orphaned documents
    const orphanedDocs = await LockerDocument.deleteMany({ locker: { $exists: false } });
    console.log(`🧹 Cleaned up ${orphanedDocs.deletedCount} orphaned documents`);

    console.log('\n✅ User locker reset complete!');
    console.log('The user can now create a new locker from the frontend.');

  } catch (error) {
    console.error('❌ Reset failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('✅ Database connection closed');
  }
};

resetUserLocker();