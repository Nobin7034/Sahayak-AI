import Service from '../models/Service.js';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function checkServices() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const services = await Service.find({ isActive: true }).lean();
    
    console.log(`\n📋 TOTAL SERVICES: ${services.length}\n`);
    
    let completeCount = 0;
    
    services.forEach((service, index) => {
      const hasAllFields = service.fee && 
                          service.processingTime && 
                          service.visitCount !== undefined && 
                          service.serviceCharge && 
                          service.category;
      
      const status = hasAllFields ? '✅' : '❌';
      
      console.log(`${status} Service ${index + 1}: ${service.name}`);
      console.log(`   - fee: ${service.fee || 'MISSING'}`);
      console.log(`   - processingTime: ${service.processingTime || 'MISSING'}`);
      console.log(`   - visitCount: ${service.visitCount !== undefined ? service.visitCount : 'MISSING'}`);
      console.log(`   - serviceCharge: ${service.serviceCharge || 'MISSING'}`);
      console.log(`   - category: ${service.category || 'MISSING'}`);
      console.log('');
      
      if (hasAllFields) completeCount++;
    });
    
    console.log(`\n✅ Complete Services: ${completeCount}/${services.length}`);
    console.log(`Bayesian Requirement: ${completeCount >= 5 ? '✅ YES - Ready to train!' : '❌ NO - Need ' + (5 - completeCount) + ' more complete services'}`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkServices();