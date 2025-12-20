import mongoose from 'mongoose';
import dotenv from 'dotenv';
import AkshayaCenter from '../models/AkshayaCenter.js';
import Service from '../models/Service.js';
import connectDB from '../config/db.js';

dotenv.config();

async function addServicesToCenter() {
  try {
    // Connect to database
    await connectDB();
    console.log('🔗 Connected to MongoDB');
    
    // Find the active center
    const center = await AkshayaCenter.findOne({ status: 'active' });
    if (!center) {
      console.log('❌ No active center found');
      return;
    }
    
    console.log(`📍 Found center: ${center.name}`);
    
    // Get all available services
    const services = await Service.find({});
    console.log(`🔧 Found ${services.length} services in database`);
    
    if (services.length === 0) {
      console.log('⚠️  No services found. Creating some sample services...');
      
      // Create sample services
      const sampleServices = [
        {
          name: 'Aadhaar Card Application',
          category: 'Identity Services',
          description: 'Apply for new Aadhaar card or update existing information',
          fees: 0,
          processingTime: '15-30 days',
          requiredDocuments: ['Proof of Identity', 'Proof of Address'],
          isActive: true
        },
        {
          name: 'PAN Card Application',
          category: 'Tax Services',
          description: 'Apply for new PAN card or corrections',
          fees: 110,
          processingTime: '7-15 days',
          requiredDocuments: ['Proof of Identity', 'Proof of Date of Birth'],
          isActive: true
        },
        {
          name: 'Passport Application',
          category: 'Travel Services',
          description: 'Apply for new passport or renewal',
          fees: 1500,
          processingTime: '30-45 days',
          requiredDocuments: ['Proof of Identity', 'Proof of Address', 'Birth Certificate'],
          isActive: true
        },
        {
          name: 'Ration Card Application',
          category: 'Welfare Services',
          description: 'Apply for new ration card or add family members',
          fees: 0,
          processingTime: '7-14 days',
          requiredDocuments: ['Proof of Identity', 'Proof of Address', 'Income Certificate'],
          isActive: true
        },
        {
          name: 'Birth Certificate',
          category: 'Civil Registration',
          description: 'Apply for birth certificate',
          fees: 50,
          processingTime: '3-7 days',
          requiredDocuments: ['Hospital Records', 'Parents ID Proof'],
          isActive: true
        }
      ];
      
      const createdServices = await Service.insertMany(sampleServices);
      console.log(`✅ Created ${createdServices.length} sample services`);
      
      // Update services array
      services.push(...createdServices);
    }
    
    // Add first 5 services to the center
    const servicesToAdd = services.slice(0, 5).map(s => s._id);
    
    center.services = servicesToAdd;
    await center.save();
    
    console.log(`✅ Added ${servicesToAdd.length} services to center: ${center.name}`);
    console.log('📋 Services added:');
    
    const addedServices = await Service.find({ _id: { $in: servicesToAdd } });
    addedServices.forEach((service, index) => {
      console.log(`${index + 1}. ${service.name} - ₹${service.fees} (${service.processingTime})`);
    });
    
    console.log('\n🎉 Center now has services available for booking!');
    
  } catch (error) {
    console.error('❌ Error adding services to center:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
}

// Run the script
addServicesToCenter();