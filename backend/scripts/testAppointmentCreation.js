import mongoose from 'mongoose';
import Service from '../models/Service.js';
import AkshayaCenter from '../models/AkshayaCenter.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

async function testAppointmentCreation() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Get a service and center to test with
    const service = await Service.findOne({ isActive: true });
    const center = await AkshayaCenter.findOne({ status: 'active' });

    if (!service) {
      console.log('❌ No active services found');
      return;
    }

    if (!center) {
      console.log('❌ No active centers found');
      return;
    }

    console.log(`\n--- Testing Appointment Creation ---`);
    console.log(`Service: ${service.name} (${service._id})`);
    console.log(`Center: ${center.name} (${center._id})`);
    console.log(`Center Status: ${center.status}`);
    console.log(`Center Services: ${center.services.length} services`);
    
    // Check if center offers the service
    const hasService = center.services.includes(service._id);
    console.log(`Center offers this service: ${hasService}`);
    
    if (!hasService) {
      console.log('❌ Center does not offer this service');
      console.log('Available services in center:', center.services);
      
      // Find a service that the center offers
      const availableService = await Service.findOne({ 
        _id: { $in: center.services },
        isActive: true 
      });
      
      if (availableService) {
        console.log(`\n✅ Found compatible service: ${availableService.name} (${availableService._id})`);
        console.log(`Service fee: ₹${availableService.fee}`);
        console.log(`Minimum documents required: ${availableService.minimumRequiredDocuments || 'Auto-calculated'}`);
      } else {
        console.log('❌ No compatible services found');
      }
    } else {
      console.log('✅ Service is available at this center');
      console.log(`Service fee: ₹${service.fee}`);
      console.log(`Minimum documents required: ${service.minimumRequiredDocuments || 'Auto-calculated'}`);
    }

    // Test appointment data structure
    const appointmentData = {
      service: service._id,
      center: center._id,
      appointmentDate: '2026-01-30',
      timeSlot: '10:00 AM',
      notes: 'Test appointment',
      selectedDocuments: [],
      paymentId: null
    };

    console.log('\n--- Appointment Data Structure ---');
    console.log(JSON.stringify(appointmentData, null, 2));

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

testAppointmentCreation();