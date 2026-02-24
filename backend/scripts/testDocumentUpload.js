import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

import DocumentLocker from '../models/DocumentLocker.js';
import LockerDocument from '../models/LockerDocument.js';
import User from '../models/User.js';

async function testDocumentUpload() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find a test user
    const user = await User.findOne({ role: 'user' });
    if (!user) {
      console.log('❌ No user found. Please create a user first.');
      return;
    }
    console.log(`👤 Found user: ${user.email}`);

    // Check if locker exists
    let locker = await DocumentLocker.findOne({ user: user._id });
    
    if (!locker) {
      console.log('📦 Creating test locker...');
      locker = new DocumentLocker({
        user: user._id,
        lockerPin: '1234'
      });
      await locker.save();
      console.log('✅ Locker created with PIN: 1234');
    } else {
      console.log('✅ Locker already exists');
    }

    // Check documents
    const documents = await LockerDocument.find({
      locker: locker._id,
      isActive: true
    });

    console.log(`\n📄 Documents in locker: ${documents.length}`);
    
    if (documents.length > 0) {
      console.log('\nDocument details:');
      documents.forEach((doc, index) => {
        console.log(`\n${index + 1}. ${doc.name}`);
        console.log(`   Type: ${doc.documentType}`);
        console.log(`   Size: ${(doc.fileSize / 1024).toFixed(2)} KB`);
        console.log(`   Verified: ${doc.extractedData?.isVerified || false}`);
        console.log(`   OCR Confidence: ${doc.extractedData?.confidence?.toFixed(1) || 'N/A'}%`);
        
        if (doc.extractedData) {
          console.log('   Extracted Data:');
          if (doc.extractedData.fullName) console.log(`     - Name: ${doc.extractedData.fullName}`);
          if (doc.extractedData.aadhaarNumber) console.log(`     - Aadhaar: ${doc.extractedData.aadhaarNumber}`);
          if (doc.extractedData.panNumber) console.log(`     - PAN: ${doc.extractedData.panNumber}`);
          if (doc.extractedData.passportNumber) console.log(`     - Passport: ${doc.extractedData.passportNumber}`);
        }
      });
    }

    console.log('\n✅ Test completed successfully');

  } catch (error) {
    console.error('❌ Error:', error);
    console.error('Stack:', error.stack);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

testDocumentUpload();
