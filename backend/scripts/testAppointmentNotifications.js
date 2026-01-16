import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import Appointment from '../models/Appointment.js';
import Notification from '../models/Notification.js';
import Staff from '../models/Staff.js';
import User from '../models/User.js';
import Service from '../models/Service.js';
import AkshayaCenter from '../models/AkshayaCenter.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env') });

const testAppointmentNotifications = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Connected to MongoDB');

    // Find a test user (regular user, not staff)
    const testUser = await User.findOne({ role: 'user' });
    if (!testUser) {
      console.log('✗ No regular user found. Please create a user first.');
      return;
    }
    console.log(`✓ Found test user: ${testUser.name} (${testUser.email})`);

    // Find an active center
    const center = await AkshayaCenter.findOne({ status: 'active' });
    if (!center) {
      console.log('✗ No active center found');
      return;
    }
    console.log(`✓ Found center: ${center.name}`);

    // Find staff at this center
    const centerStaff = await Staff.findByCenter(center._id, true);
    console.log(`✓ Found ${centerStaff.length} staff members at this center`);
    centerStaff.forEach(staff => {
      console.log(`  - ${staff.userId.name} (${staff.userId.email})`);
    });

    // Find a service offered by this center
    const service = await Service.findOne({ 
      _id: { $in: center.services },
      isActive: true 
    });
    if (!service) {
      console.log('✗ No active service found at this center');
      return;
    }
    console.log(`✓ Found service: ${service.name}`);

    // Create a test appointment
    const appointmentDate = new Date();
    appointmentDate.setDate(appointmentDate.getDate() + 1); // Tomorrow
    appointmentDate.setHours(10, 0, 0, 0); // 10:00 AM

    console.log('\n--- Creating Test Appointment ---');
    const appointment = new Appointment({
      user: testUser._id,
      service: service._id,
      center: center._id,
      appointmentDate: appointmentDate,
      timeSlot: '10:00 AM',
      notes: 'Test appointment for notification system',
      status: 'confirmed'
    });

    await appointment.save();
    console.log(`✓ Created appointment: ${appointment._id}`);

    // Create notifications for staff
    console.log('\n--- Creating Staff Notifications ---');
    const staffNotifications = centerStaff.map(staff => ({
      user: staff.userId._id,
      type: 'appointment',
      title: 'New Appointment Booked',
      message: `New appointment for ${service.name} on ${appointmentDate.toLocaleDateString()} at 10:00 AM by ${testUser.name}`,
      meta: {
        appointmentId: appointment._id,
        serviceId: service._id,
        centerId: center._id,
        appointmentDate: appointmentDate,
        timeSlot: '10:00 AM',
        userName: testUser.name
      }
    }));

    if (staffNotifications.length > 0) {
      const createdNotifications = await Notification.insertMany(staffNotifications);
      console.log(`✓ Created ${createdNotifications.length} notifications`);
      
      // Display created notifications
      for (const notification of createdNotifications) {
        const staffUser = await User.findById(notification.user);
        console.log(`\n  Notification for: ${staffUser.name}`);
        console.log(`  Type: ${notification.type}`);
        console.log(`  Title: ${notification.title}`);
        console.log(`  Message: ${notification.message}`);
        console.log(`  Is Read: ${notification.isRead}`);
      }
    } else {
      console.log('✗ No staff members to notify');
    }

    // Verify notifications were created
    console.log('\n--- Verifying Notifications ---');
    for (const staff of centerStaff) {
      const notifications = await Notification.find({
        user: staff.userId._id,
        type: 'appointment',
        isRead: false
      }).sort({ createdAt: -1 }).limit(5);
      
      console.log(`\n${staff.userId.name} has ${notifications.length} unread appointment notifications:`);
      notifications.forEach((notif, index) => {
        console.log(`  ${index + 1}. ${notif.title} - ${notif.message.substring(0, 50)}...`);
      });
    }

    console.log('\n✓ Test completed successfully!');
    console.log('\nSummary:');
    console.log(`- Appointment created: ${appointment._id}`);
    console.log(`- Notifications sent to ${centerStaff.length} staff members`);
    console.log(`- Center: ${center.name}`);
    console.log(`- Service: ${service.name}`);
    console.log(`- Date: ${appointmentDate.toLocaleDateString()} at 10:00 AM`);

  } catch (error) {
    console.error('✗ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n✓ Database connection closed');
  }
};

testAppointmentNotifications();
