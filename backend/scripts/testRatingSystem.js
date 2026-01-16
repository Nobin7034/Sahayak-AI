import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env') });

import User from '../models/User.js';
import AkshayaCenter from '../models/AkshayaCenter.js';
import CenterRating from '../models/CenterRating.js';
import Appointment from '../models/Appointment.js';

async function testRatingSystem() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find a test user
    const testUser = await User.findOne({ role: 'user' });
    if (!testUser) {
      console.log('❌ No test user found');
      return;
    }
    console.log(`✅ Found test user: ${testUser.name} (${testUser.email})`);

    // Find a center
    const center = await AkshayaCenter.findOne();
    if (!center) {
      console.log('❌ No center found');
      return;
    }
    console.log(`✅ Found center: ${center.name}\n`);

    // Find completed appointments for this user at this center
    const completedAppointments = await Appointment.find({
      center: center._id,
      user: testUser._id,
      status: 'completed'
    }).limit(3);

    console.log(`✅ Found ${completedAppointments.length} completed appointments\n`);

    // Create test ratings
    console.log('📝 Creating test ratings...');
    
    const ratingTexts = [
      {
        rating: 5,
        review: 'Excellent service! Very professional staff and quick processing.',
        categories: {
          serviceQuality: 5,
          staffBehavior: 5,
          waitTime: 4,
          cleanliness: 5,
          facilities: 4
        }
      },
      {
        rating: 4,
        review: 'Good experience overall. Could improve wait times.',
        categories: {
          serviceQuality: 4,
          staffBehavior: 5,
          waitTime: 3,
          cleanliness: 4,
          facilities: 4
        }
      },
      {
        rating: 5,
        review: 'Best Akshaya center in the area. Highly recommended!',
        categories: {
          serviceQuality: 5,
          staffBehavior: 5,
          waitTime: 5,
          cleanliness: 5,
          facilities: 5
        }
      }
    ];

    // Delete existing test ratings for this user and center
    await CenterRating.deleteMany({ center: center._id, user: testUser._id });
    console.log('🗑️  Cleared existing test ratings');

    // Create new ratings - one per appointment if available, otherwise general ratings
    const ratingsToCreate = Math.min(completedAppointments.length || 3, ratingTexts.length);
    
    for (let i = 0; i < ratingsToCreate; i++) {
      const ratingData = {
        center: center._id,
        user: testUser._id,
        appointment: completedAppointments[i]?._id,
        ...ratingTexts[i],
        isVerified: completedAppointments[i] ? true : false
      };
      
      const rating = await CenterRating.create(ratingData);
      console.log(`✅ Created rating: ${rating.rating} stars - "${rating.review.substring(0, 50)}..."`);
    }

    console.log('\n📊 Calculating center rating statistics...');
    
    // Calculate center rating
    const stats = await CenterRating.calculateCenterRating(center._id);
    console.log('\n📈 Center Rating Statistics:');
    console.log(`   Average Rating: ${stats.avgRating.toFixed(2)}/5`);
    console.log(`   Total Ratings: ${stats.totalRatings}`);
    console.log(`   Service Quality: ${stats.avgServiceQuality.toFixed(2)}/5`);
    console.log(`   Staff Behavior: ${stats.avgStaffBehavior.toFixed(2)}/5`);
    console.log(`   Wait Time: ${stats.avgWaitTime.toFixed(2)}/5`);
    console.log(`   Cleanliness: ${stats.avgCleanliness.toFixed(2)}/5`);
    console.log(`   Facilities: ${stats.avgFacilities.toFixed(2)}/5`);

    // Get rating distribution
    const distribution = await CenterRating.getRatingDistribution(center._id);
    console.log('\n⭐ Rating Distribution:');
    console.log(`   5 stars: ${distribution[5]} ratings`);
    console.log(`   4 stars: ${distribution[4]} ratings`);
    console.log(`   3 stars: ${distribution[3]} ratings`);
    console.log(`   2 stars: ${distribution[2]} ratings`);
    console.log(`   1 star: ${distribution[1]} ratings`);

    // Test dashboard data with ratings
    console.log('\n📊 Testing dashboard data with live ratings...');
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayAppointments = await Appointment.find({
      center: center._id,
      appointmentDate: { $gte: today, $lt: tomorrow }
    });

    const dashboardData = {
      centerName: center.name,
      todayVisitors: todayAppointments.length,
      avgRating: parseFloat(stats.avgRating.toFixed(1)),
      totalRatings: stats.totalRatings,
      activeServices: center.services?.length || 0
    };

    console.log('\n🎯 Dashboard Data:');
    console.log(`   Center: ${dashboardData.centerName}`);
    console.log(`   Today's Visitors: ${dashboardData.todayVisitors}`);
    console.log(`   Average Rating: ${dashboardData.avgRating}/5 (${dashboardData.totalRatings} ratings)`);
    console.log(`   Active Services: ${dashboardData.activeServices}`);

    console.log('\n✅ Rating system test completed successfully!');
    console.log('\n💡 Next steps:');
    console.log('   1. Start the backend server: npm start');
    console.log('   2. Check staff dashboard for live rating data');
    console.log('   3. Users can submit ratings after completing appointments');
    console.log('   4. Staff can respond to ratings from their dashboard');

  } catch (error) {
    console.error('❌ Error testing rating system:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

testRatingSystem();
