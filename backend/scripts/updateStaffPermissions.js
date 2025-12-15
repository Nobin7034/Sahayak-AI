import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Staff from '../models/Staff.js';
import connectDB from '../config/db.js';

dotenv.config();

async function updateStaffPermissions() {
  try {
    await connectDB();
    console.log('Connected to MongoDB');

    const staff = await Staff.find({});
    console.log(`Found ${staff.length} staff members`);

    for (let s of staff) {
      if (!s.permissions.find(p => p.action === 'manage_services')) {
        s.permissions.push({ 
          action: 'manage_services', 
          granted: true,
          grantedAt: new Date()
        });
        await s.save();
        console.log(`Updated permissions for ${s.userId}`);
      }
    }

    console.log('✅ Updated staff permissions');
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

updateStaffPermissions();