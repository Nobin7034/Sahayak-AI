import Service from '../models/Service.js';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function fixServices() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const services = await Service.find({ isActive: true });
    let updated = 0;
    
    console.log('\n📝 Fixing missing fields in services...\n');
    
    for (const service of services) {
      let needsUpdate = false;
      
      // Fix missing fee (for Aadhaar Enrollment, set to 50)
      if (!service.fee) {
        service.fee = 50;
        console.log(`✅ Added fee: ${service.name} - fee set to ${service.fee}`);
        needsUpdate = true;
      }
      
      // Fix missing serviceCharge (10% of fee)
      if (!service.serviceCharge && service.fee) {
        service.serviceCharge = Math.round(service.fee * 0.1);
        console.log(`✅ Added serviceCharge: ${service.name} - serviceCharge set to ${service.serviceCharge}`);
        needsUpdate = true;
      } else if (service.serviceCharge) {
        console.log(`⏭️  Already complete: ${service.name}`);
      }
      
      if (needsUpdate) {
        await service.save();
        updated++;
      }
    }
    
    console.log(`\n✅ Total updated: ${updated} services`);
    
    // Verify all services now have required fields
    const allServices = await Service.find({ isActive: true }).lean();
    let completeCount = 0;
    
    allServices.forEach(service => {
      const hasAllFields = service.fee && 
                          service.processingTime && 
                          service.visitCount !== undefined && 
                          service.serviceCharge && 
                          service.category;
      if (hasAllFields) completeCount++;
    });
    
    console.log(`\n📊 Final Status: ${completeCount}/${allServices.length} services complete`);
    console.log(`Bayesian Ready: ${completeCount >= 5 ? '✅ YES!' : '❌ NO'}`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

fixServices();