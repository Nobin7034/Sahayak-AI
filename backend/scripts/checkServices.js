import mongoose from 'mongoose';
import Service from '../models/Service.js';
import AkshayaCenter from '../models/AkshayaCenter.js';
import dotenv from 'dotenv';

dotenv.config();

async function checkServices() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const services = await Service.find({});
    
    console.log(`\nFound ${services.length} services in database:`);
    
    services.forEach((service, index) => {
      console.log(`\n--- Service ${index + 1} ---`);
      console.log(`Name: ${service.name}`);
      console.log(`Category: ${service.category}`);
      console.log(`Fee: ₹${service.fees || service.fee || 0}`);
      console.log(`ID: ${service._id}`);
    });

    // Now let's assign all services to all centers
    const centers = await AkshayaCenter.find({});
    console.log(`\nAssigning ${services.length} services to ${centers.length} centers...`);

    for (const center of centers) {
      center.services = services.map(s => s._id);
      await center.save();
      console.log(`✅ Assigned services to ${center.name}`);
    }

    console.log('\n🎉 All services have been assigned to all centers!');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

checkServices();