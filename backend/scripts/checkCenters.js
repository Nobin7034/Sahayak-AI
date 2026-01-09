import mongoose from 'mongoose';
import AkshayaCenter from '../models/AkshayaCenter.js';
import Service from '../models/Service.js';
import dotenv from 'dotenv';

dotenv.config();

async function checkCenters() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const centers = await AkshayaCenter.find({}).populate('services', 'name category');
    
    console.log(`\nFound ${centers.length} centers in database:`);
    
    centers.forEach((center, index) => {
      console.log(`\n--- Center ${index + 1} ---`);
      console.log(`Name: ${center.name}`);
      console.log(`Status: ${center.status}`);
      console.log(`Location:`, center.location);
      console.log(`Address: ${center.address.city}, ${center.address.district}`);
      console.log(`Services: ${center.services.length} services`);
      center.services.forEach(service => {
        console.log(`  - ${service.name} (${service.category})`);
      });
      
      if (center.location && center.location.coordinates) {
        const [lng, lat] = center.location.coordinates;
        console.log(`Coordinates: Lat ${lat}, Lng ${lng}`);
      } else {
        console.log('⚠️  NO COORDINATES FOUND');
      }
    });

    // Check for active centers specifically
    const activeCenters = await AkshayaCenter.find({ status: 'active' });
    console.log(`\n📊 Summary:`);
    console.log(`Total centers: ${centers.length}`);
    console.log(`Active centers: ${activeCenters.length}`);
    console.log(`Inactive centers: ${centers.length - activeCenters.length}`);

    // Check for centers with coordinates
    const centersWithCoords = centers.filter(c => c.location && c.location.coordinates && c.location.coordinates.length === 2);
    console.log(`Centers with coordinates: ${centersWithCoords.length}`);
    console.log(`Centers without coordinates: ${centers.length - centersWithCoords.length}`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

checkCenters();