import Appointment from '../models/Appointment.js';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function countAppointments() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const total = await Appointment.countDocuments();
    const completed = await Appointment.countDocuments({ status: 'completed' });
    const pending = await Appointment.countDocuments({ status: 'pending' });
    const cancelled = await Appointment.countDocuments({ status: 'cancelled' });
    
    console.log('\n📊 APPOINTMENT COUNT:');
    console.log(`Total: ${total}`);
    console.log(`Completed: ${completed} ✅`);
    console.log(`Pending: ${pending} ⏳`);
    console.log(`Cancelled: ${cancelled} ❌`);
    console.log(`\nKNN Requirement: ${completed >= 10 ? 'YES - Ready to train!' : 'NO - Need ' + (10 - completed) + ' more'}`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

countAppointments();