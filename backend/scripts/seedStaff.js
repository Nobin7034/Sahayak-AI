import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Staff from '../models/Staff.js';
import AkshayaCenter from '../models/AkshayaCenter.js';
import connectDB from '../config/db.js';

dotenv.config();

// Sample staff data
const sampleStaff = [
  {
    name: 'Rajesh Kumar',
    email: 'rajesh.staff@akshaya.gov.in',
    password: 'staff123',
    phone: '+919876543220',
    centerName: 'Akshaya Center Thiruvananthapuram'
  },
  {
    name: 'Priya Nair',
    email: 'priya.staff@akshaya.gov.in',
    password: 'staff123',
    phone: '+919876543221',
    centerName: 'Akshaya Center Kochi'
  },
  {
    name: 'Suresh Menon',
    email: 'suresh.staff@akshaya.gov.in',
    password: 'staff123',
    phone: '+919876543222',
    centerName: 'Akshaya Center Kozhikode'
  },
  {
    name: 'Lakshmi Pillai',
    email: 'lakshmi.staff@akshaya.gov.in',
    password: 'staff123',
    phone: '+919876543223',
    centerName: 'Akshaya Center Thrissur'
  }
];

async function seedStaff() {
  try {
    // Connect to database
    await connectDB();
    console.log('Connected to MongoDB');

    // Get all centers
    const centers = await AkshayaCenter.find({ status: 'active' });
    console.log(`Found ${centers.length} active centers`);

    if (centers.length === 0) {
      console.log('No active centers found. Please run seedCenters.js first.');
      return;
    }

    // Clear existing staff users
    const existingStaffUsers = await User.find({ role: 'staff' });
    if (existingStaffUsers.length > 0) {
      await Staff.deleteMany({ userId: { $in: existingStaffUsers.map(u => u._id) } });
      await User.deleteMany({ role: 'staff' });
      console.log('Cleared existing staff users');
    }

    const createdStaff = [];

    for (let i = 0; i < sampleStaff.length && i < centers.length; i++) {
      const staffData = sampleStaff[i];
      const center = centers[i];

      try {
        // Hash password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(staffData.password, saltRounds);

        // Create user account
        const user = new User({
          name: staffData.name,
          email: staffData.email,
          password: hashedPassword,
          phone: staffData.phone,
          role: 'staff',
          provider: 'local',
          isActive: true
        });

        await user.save();

        // Create staff record
        const staff = new Staff({
          userId: user._id,
          center: center._id,
          role: 'staff',
          isActive: true,
          assignedAt: new Date(),
          // Default permissions will be set by pre-save middleware
          workingHours: {
            monday: { start: '09:00', end: '17:00', isWorking: true },
            tuesday: { start: '09:00', end: '17:00', isWorking: true },
            wednesday: { start: '09:00', end: '17:00', isWorking: true },
            thursday: { start: '09:00', end: '17:00', isWorking: true },
            friday: { start: '09:00', end: '17:00', isWorking: true },
            saturday: { start: '09:00', end: '17:00', isWorking: true },
            sunday: { start: '10:00', end: '16:00', isWorking: false }
          }
        });

        await staff.save();

        createdStaff.push({
          name: user.name,
          email: user.email,
          center: center.name,
          city: center.address.city
        });

        console.log(`✅ Created staff: ${user.name} at ${center.name}`);

      } catch (error) {
        console.error(`❌ Error creating staff ${staffData.name}:`, error.message);
      }
    }

    console.log(`\n🎉 Successfully created ${createdStaff.length} staff members`);
    
    // Display summary
    console.log('\n👥 Created Staff Members:');
    createdStaff.forEach((staff, index) => {
      console.log(`${index + 1}. ${staff.name} (${staff.email})`);
      console.log(`   Center: ${staff.center} - ${staff.city}`);
      console.log(`   Password: staff123`);
      console.log('');
    });

    console.log('📝 Staff Login Instructions:');
    console.log('1. Go to /staff/login');
    console.log('2. Use any of the above email addresses');
    console.log('3. Password: staff123');
    console.log('4. Access staff dashboard and features');

  } catch (error) {
    console.error('❌ Error seeding staff:', error);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
}

// Run the seeding function
seedStaff();