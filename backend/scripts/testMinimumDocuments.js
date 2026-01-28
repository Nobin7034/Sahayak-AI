import mongoose from 'mongoose';
import Service from '../models/Service.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from the backend directory
dotenv.config({ path: path.join(__dirname, '..', '.env') });

async function testMinimumDocuments() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find a service to test with
    const service = await Service.findOne({ isActive: true });
    if (!service) {
      console.log('No active services found');
      return;
    }

    console.log(`\n--- Testing Service: ${service.name} ---`);
    console.log(`Service ID: ${service._id}`);
    
    // Display current document configuration
    const totalDocs = (service.documents?.length || 0) + (service.requiredDocuments?.length || 0);
    console.log(`Total Documents: ${totalDocs}`);
    console.log(`Current Minimum Required: ${service.minimumRequiredDocuments || 'Not set (will auto-calculate)'}`);
    
    if (service.documents && service.documents.length > 0) {
      console.log('\nStructured Documents:');
      service.documents.forEach((doc, index) => {
        console.log(`  ${index + 1}. ${doc.name} (${doc.requirement || 'mandatory'})`);
      });
    }
    
    if (service.requiredDocuments && service.requiredDocuments.length > 0) {
      console.log('\nLegacy Documents:');
      service.requiredDocuments.forEach((doc, index) => {
        console.log(`  ${index + 1}. ${doc}`);
      });
    }

    // Test updating minimum required documents
    const newMinimum = Math.max(1, totalDocs - 1);
    console.log(`\nSetting minimum required documents to: ${newMinimum}`);
    
    service.minimumRequiredDocuments = newMinimum;
    await service.save();
    
    console.log('✅ Service updated successfully');
    
    // Verify the update
    const updatedService = await Service.findById(service._id);
    console.log(`Verified minimum required documents: ${updatedService.minimumRequiredDocuments}`);
    
    // Test the new API endpoint
    console.log('\n--- Testing Document Requirements API ---');
    const documentRequirements = {
      serviceId: updatedService._id,
      serviceName: updatedService.name,
      totalDocuments: (updatedService.documents?.length || 0) + (updatedService.requiredDocuments?.length || 0),
      minimumRequired: updatedService.minimumRequiredDocuments,
      documents: updatedService.documents || [],
      legacyDocuments: updatedService.requiredDocuments || [],
      instructions: `Please select at least ${updatedService.minimumRequiredDocuments} documents from the ${(updatedService.documents?.length || 0) + (updatedService.requiredDocuments?.length || 0)} available options to proceed with your application.`,
      validationRules: {
        totalRequired: (updatedService.documents?.length || 0) + (updatedService.requiredDocuments?.length || 0),
        minimumThreshold: updatedService.minimumRequiredDocuments
      }
    };
    
    console.log('API Response Structure:');
    console.log(JSON.stringify(documentRequirements, null, 2));

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

testMinimumDocuments();