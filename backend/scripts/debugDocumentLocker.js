import mongoose from 'mongoose';
import dotenv from 'dotenv';
import connectDB from '../config/db.js';
import DocumentLocker from '../models/DocumentLocker.js';
import LockerDocument from '../models/LockerDocument.js';
import User from '../models/User.js';

dotenv.config();

const debugDocumentLocker = async () => {
  try {
    await connectDB();
    console.log('✅ Connected to database');

    // Check if there are any existing users
    const users = await User.find({}).limit(5);
    console.log(`Found ${users.length} users in database`);
    
    if (users.length > 0) {
      console.log('Sample users:');
      users.forEach(user => {
        console.log(`  - ${user.name} (${user.email}) - Role: ${user.role}`);
      });
    }

    // Check for existing lockers
    const lockers = await DocumentLocker.find({}).populate('user');
    console.log(`\nFound ${lockers.length} document lockers`);
    
    if (lockers.length > 0) {
      console.log('Existing lockers:');
      lockers.forEach(locker => {
        console.log(`  - User: ${locker.user?.name || 'Unknown'} (${locker.user?.email || 'Unknown'})`);
        console.log(`    Documents: ${locker.documents.length}`);
        console.log(`    Created: ${locker.createdAt}`);
        console.log(`    Last Accessed: ${locker.lastAccessed}`);
      });
    }

    // Check for existing documents
    const documents = await LockerDocument.find({}).populate('locker');
    console.log(`\nFound ${documents.length} documents`);
    
    if (documents.length > 0) {
      console.log('Sample documents:');
      documents.slice(0, 3).forEach(doc => {
        console.log(`  - ${doc.name} (${doc.documentType})`);
        console.log(`    Size: ${(doc.fileSize / 1024).toFixed(1)} KB`);
        console.log(`    OCR Confidence: ${doc.extractedData?.confidence || 'N/A'}%`);
        console.log(`    Verified: ${doc.extractedData?.isVerified || false}`);
      });
    }

    // Test PIN verification for existing lockers
    if (lockers.length > 0) {
      console.log('\n🔍 Testing PIN verification...');
      const testLocker = lockers[0];
      
      // Test with common PINs
      const testPins = ['1234', '0000', '1111', '2222'];
      
      for (const pin of testPins) {
        try {
          const isValid = await testLocker.verifyPin(pin);
          if (isValid) {
            console.log(`✅ PIN ${pin} is valid for locker`);
            break;
          } else {
            console.log(`❌ PIN ${pin} is invalid`);
          }
        } catch (error) {
          console.log(`❌ Error testing PIN ${pin}:`, error.message);
        }
      }
    }

    console.log('\n📊 Database Summary:');
    console.log(`Users: ${users.length}`);
    console.log(`Lockers: ${lockers.length}`);
    console.log(`Documents: ${documents.length}`);

  } catch (error) {
    console.error('❌ Debug failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('✅ Database connection closed');
  }
};

debugDocumentLocker();