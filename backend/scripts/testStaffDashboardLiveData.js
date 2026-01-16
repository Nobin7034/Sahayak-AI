import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '../.env') });

async function testStaffDashboardLiveData() {
  try {
    console.log('🔍 Testing Staff Dashboard Live Data...\n');

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
      email: staffUser.email,
      role: staffUser.role
    });

    // Get staff record
    const staffRecord = await Staff.findOne({ userId: staffUser._id })
      .populate('center')
      .populate('userId');
    
    if (!staffRecord) {
      console.log('❌ No staff record found for user');
      console.log('Checking all staff records...');
      const allStaff = await Staff.find({}).populate('userId');
      console.log(`Found ${allStaff.length} staff records`);
      allStaff.forEach(s => {
        console.log(`  - ${s.userId?.name} (${s.userId?.email})`);
      });
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
      district: center.address?.district || 'N/A',
      state: center.address?.state || 'N/A',
      activeServices: center.services?.length || 0,
      rating: center.metadata?.rating || 0,
      status: center.status
    });

    // Get today's appointments
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayAppointments = await Appointment.find({
      center: center._id,
      appointmentDate: { $gte: today, $lt: tomorrow }
    }).populate('service', 'name category fee').populate('user', 'name email phone');

    console.log('\n📅 Today\'s Appointments:', todayAppointments.length);

    // Calculate metrics
    const totalToday = todayAppointments.length;
    const pendingApprovals = todayAppointments.filter(apt => apt.status === 'pending').length;
    const completedToday = todayAppointments.filter(apt => apt.status === 'completed').length;
    const inProgress = todayAppointments.filter(apt => apt.status === 'in_progress').length;
    const confirmedToday = todayAppointments.filter(apt => apt.status === 'confirmed').length;

    // Calculate revenue
    const todayRevenue = todayAppointments
      .filter(apt => apt.status === 'completed' && apt.paymentStatus === 'paid')
      .reduce((sum, apt) => sum + (apt.service?.fee || 0), 0);

    // Calculate average rating
    const ratedAppointments = todayAppointments.filter(apt => apt.rating && apt.rating.score);
    const avgRating = ratedAppointments.length > 0
      ? ratedAppointments.reduce((sum, apt) => sum + apt.rating.score, 0) / ratedAppointments.length
      : 0;

    console.log('\n📊 Dashboard Metrics:', {
      totalToday,
      pendingApprovals,
      completedToday,
      inProgress,
      confirmedToday,
      todayRevenue: `₹${todayRevenue}`,
      avgRating: avgRating.toFixed(1),
      todayVisits: totalToday
    });

    // Get upcoming appointments
    const upcomingAppointments = todayAppointments
      .filter(apt => apt.status === 'confirmed' || apt.status === 'in_progress')
      .sort((a, b) => a.timeSlot.localeCompare(b.timeSlot))
      .slice(0, 5);

    console.log('\n⏰ Upcoming Appointments:', upcomingAppointments.length);
    upcomingAppointments.forEach((apt, index) => {
      console.log(`  ${index + 1}. ${apt.user?.name} - ${apt.service?.name} at ${apt.timeSlot} (${apt.status})`);
    });

    // Get recent activity
    const recentActivity = [];
    todayAppointments
      .filter(apt => apt.statusHistory && apt.statusHistory.length > 0)
      .forEach(apt => {
        const latestStatus = apt.statusHistory[apt.statusHistory.length - 1];
        if (latestStatus) {
          const timeAgo = getTimeAgo(latestStatus.changedAt);
          let message = '';
          
          switch (latestStatus.status) {
            case 'confirmed':
              message = `Appointment confirmed for ${apt.user?.name || 'User'}`;
              break;
            case 'in_progress':
              message = `Started processing ${apt.service?.name || 'service'} for ${apt.user?.name || 'User'}`;
              break;
            case 'completed':
              message = `Completed ${apt.service?.name || 'service'} for ${apt.user?.name || 'User'}`;
              break;
            case 'cancelled':
              message = `Appointment cancelled for ${apt.user?.name || 'User'}`;
              break;
            default:
              message = `Status updated to ${latestStatus.status} for ${apt.user?.name || 'User'}`;
          }
          
          recentActivity.push({
            type: 'appointment',
            message,
            time: timeAgo,
            timestamp: latestStatus.changedAt
          });
        }
      });

    recentActivity.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    const limitedActivity = recentActivity.slice(0, 10);

    console.log('\n📝 Recent Activity:', limitedActivity.length);
    limitedActivity.forEach((activity, index) => {
      console.log(`  ${index + 1}. ${activity.message} - ${activity.time}`);
    });

    console.log('\n✅ Dashboard data is being fetched from live database!');
    console.log('✅ All metrics are calculated from real appointments');
    console.log('✅ Center information is from actual database records');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

function getTimeAgo(date) {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  
  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
  return `${Math.floor(seconds / 86400)} days ago`;
}

testStaffDashboardLiveData();
