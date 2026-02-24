import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

import LockerDocument from '../models/LockerDocument.js';

async function fixLegacyDocuments() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find all documents
    const allDocuments = await LockerDocument.find({});
    console.log(`📄 Found ${allDocuments.length} total documents`);

    // Check for legacy document types
    const legacyTypes = ['passport', 'bank_passbook', 'salary_slip', 'property_document', 'educational_certificate', 'medical_certificate', 'other'];
    const legacyDocuments = allDocuments.filter(doc => legacyTypes.includes(doc.documentType));
    
    console.log(`🔍 Found ${legacyDocuments.length} legacy documents:`);
    
    legacyDocuments.forEach(doc => {
      console.log(`  - ${doc.name} (${doc.documentType}) - ${doc.isActive ? 'Active' : 'Inactive'}`);
    });

    // Check for any validation issues
    console.log('\n🔧 Checking for validation issues...');
    
    for (const doc of allDocuments) {
      try {
        await doc.validate();
      } catch (validationError) {
        console.log(`❌ Validation error for ${doc.name}:`, validationError.message);
      }
    }

    console.log('\n✅ Legacy document check completed');
    console.log('\nℹ️  Legacy documents are now supported and can be deleted normally.');

  } catch (error) {
    console.error('❌ Error:', error);
    console.error('Stack:', error.stack);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

fixLegacyDocuments();