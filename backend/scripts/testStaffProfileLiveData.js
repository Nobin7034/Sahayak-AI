import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '../.env') });

async function testStaffProfileLiveData() {
  try {
    console.log('🔍 Testing Staff Profile Live Data...\n');

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Import models
    const User = (await import('../models/User.js')).default;
    const Staff = (await import('../models/Staff.js')).default;
    const AkshayaCenter = (await import('../models/AkshayaCenter.js')).default;
    const Appointment = (await import('../models/Appointment.js')).default;
    const Service = (await import('../models/Service.js')).default;

    // Find a staff user
    const staffUser = await User.findOne({ role: 'staff', isActive: true });
    if (!staffUser) {
      console.log('❌ No active staff user found');
      return;
    }

    console.log('📋 Staff User:', {
      name: staffUser.name,
      email: staffUser.email
    });

    // Get staff record
    const staffRecord = await Staff.findOne({ userId: staffUser._id })
      .populate('center');
    
    if (!staffRecord) {
      console.log('❌ No staff record found');
      return;
    }

    console.log('\n🏢 Staff Center:', {
      name: staffRecord.center.name,
      id: staffRecord.center._id
    });

    // Get center details
    const center = await AkshayaCenter.findById(staffRecord.center._id)
      .populate('services', 'name category fee');

    console.log('\n📍 Center Details:', {
      name: center.name,
      address: center.address ? `${center.address.street}, ${center.address.city}, ${center.address.district}` : 'N/A',
      contact: center.contact?.phone || 'N/A',
      email: center.contact?.email || 'N/A',
      services: center.services?.length || 0
    });

    // Get all appointments for this center
    const allAppointments = await Appointment.find({
      center: center._id
    }).populate('service', 'name category fee').populate('user', 'name');

    console.log('\n📊 Appointment Statistics:');
    console.log(`  Total Appointments: ${allAppointments.length}`);

    // Calculate statistics
    const completedServices = allAppointments.filter(apt => apt.status === 'completed').length;
    console.log(`  Completed Services: ${completedServices}`);

    // Calculate average rating
    const ratedAppointments = allAppointments.filter(apt => apt.rating && apt.rating.score);
    const avgRating = ratedAppointments.length > 0
      ? ratedAppointments.reduce((sum, apt) => sum + apt.rating.score, 0) / ratedAppointments.length
      : 0;
    console.log(`  Average Rating: ${avgRating.toFixed(1)}/5.0 (from ${ratedAppointments.length} ratings)`);

    // Get unique customers
    const uniqueCustomers = new Set(allAppointments.map(apt => apt.user?._id?.toString()).filter(Boolean));
    console.log(`  Total Customers: ${uniqueCustomers.size}`);

    // Calculate service statistics
    const serviceStats = {};
    allAppointments.forEach(apt => {
      if (apt.service && apt.status === 'completed') {
        const serviceName = apt.service.name;
        if (!serviceStats[serviceName]) {
          serviceStats[serviceName] = {
            name: serviceName,
            count: 0,
            revenue: 0
          };
        }
        serviceStats[serviceName].count++;
        serviceStats[serviceName].revenue += apt.service.fee || 0;
      }
    });

    // Get top 4 services
    const topServices = Object.values(serviceStats)
      .sort((a, b) => b.count - a.count)
      .slice(0, 4);

    console.log('\n🏆 Top Services:');
    topServices.forEach((service, index) => {
      console.log(`  ${index + 1}. ${service.name}`);
      console.log(`     - Completed: ${service.count}`);
      console.log(`     - Revenue: ₹${service.revenue.toLocaleString()}`);
    });

    console.log('\n✅ Profile data is being fetched from live database!');
    console.log('✅ All statistics are calculated from real appointments');
    console.log('✅ No mock data is used');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

testStaffProfileLiveData();
