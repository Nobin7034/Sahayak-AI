import mongoose from 'mongoose';
import dotenv from 'dotenv';
import AkshayaCenter from '../models/AkshayaCenter.js';
import Service from '../models/Service.js';
import connectDB from '../config/db.js';

dotenv.config();

async function addServicesToAllCenters() {
  try {
    // Connect to database
    await connectDB();
    console.log('🔗 Connected to MongoDB');
    
    // Find all active centers
    const centers = await AkshayaCenter.find({ status: 'active' });
    console.log(`📍 Found ${centers.length} active centers`);
    
    // Get all available services
    const services = await Service.find({});
    console.log(`🔧 Found ${services.length} services in database`);
    
    if (services.length === 0) {
      console.log('❌ No services found in database');
      return;
    }
    
    for (const center of centers) {
      if (center.services && center.services.length > 0) {
        console.log(`✅ ${center.name} already has ${center.services.length} services`);
        continue;
      }
      
      // Add random 3-5 services to each center
      const numServices = Math.floor(Math.random() * 3) + 3; // 3-5 services
      const shuffledServices = services.sort(() => 0.5 - Math.random());
      const servicesToAdd = shuffledServices.slice(0, numServices).map(s => s._id);
      
      center.services = servicesToAdd;
      await center.save();
      
      console.log(`✅ Added ${servicesToAdd.length} services to: ${center.name}`);
    }
    
    console.log('\n🎉 All centers now have services available for booking!');
    
  } catch (error) {
    console.error('❌ Error adding services to centers:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
}

// Run the script
addServicesToAllCenters();