import mongoose from 'mongoose';
import Service from '../models/Service.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from the backend directory
dotenv.config({ path: path.join(__dirname, '..', '.env') });

async function migrateMinimumDocuments() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find all services that don't have minimumRequiredDocuments set
    const services = await Service.find({
      $or: [
        { minimumRequiredDocuments: { $exists: false } },
        { minimumRequiredDocuments: null },
        { minimumRequiredDocuments: undefined }
      ]
    });

    console.log(`\nFound ${services.length} services to migrate:`);

    let migratedCount = 0;
    for (const service of services) {
      const totalDocs = (service.documents?.length || 0) + (service.requiredDocuments?.length || 0);
      const defaultMinimum = Math.max(1, totalDocs - 1);
      
      console.log(`\n--- Migrating: ${service.name} ---`);
      console.log(`Service ID: ${service._id}`);
      console.log(`Total Documents: ${totalDocs}`);
      console.log(`Setting Minimum Required: ${defaultMinimum}`);
      
      if (service.documents && service.documents.length > 0) {
        console.log('Structured Documents:');
        service.documents.forEach((doc, index) => {
          console.log(`  ${index + 1}. ${doc.name} (${doc.requirement || 'mandatory'})`);
        });
      }
      
      if (service.requiredDocuments && service.requiredDocuments.length > 0) {
        console.log('Legacy Documents:');
        service.requiredDocuments.forEach((doc, index) => {
          console.log(`  ${index + 1}. ${doc}`);
        });
      }

      // Update the service
      service.minimumRequiredDocuments = defaultMinimum;
      await service.save();
      migratedCount++;
      
      console.log(`✅ Migrated successfully`);
    }

    console.log(`\n🎉 Migration completed!`);
    console.log(`Total services migrated: ${migratedCount}`);
    
    // Verify migration
    console.log('\n--- Verification ---');
    const allServices = await Service.find({});
    console.log(`Total services in database: ${allServices.length}`);
    
    const servicesWithMinimum = await Service.find({
      minimumRequiredDocuments: { $exists: true, $ne: null }
    });
    console.log(`Services with minimum documents configured: ${servicesWithMinimum.length}`);
    
    if (servicesWithMinimum.length === allServices.length) {
      console.log('✅ All services now have minimum document requirements configured');
    } else {
      console.log('⚠️ Some services still missing minimum document configuration');
    }

  } catch (error) {
    console.error('Migration error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

migrateMinimumDocuments();