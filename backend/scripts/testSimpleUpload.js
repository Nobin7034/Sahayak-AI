import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

import DocumentLocker from '../models/DocumentLocker.js';
import LockerDocument from '../models/LockerDocument.js';
import User from '../models/User.js';

async function testSimpleUpload() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find a test user
    const user = await User.findOne({ role: 'user' });
    if (!user) {
      console.log('❌ No user found');
      return;
    }
    console.log(`👤 User: ${user.email}`);

    // Find or create locker
    let locker = await DocumentLocker.findOne({ user: user._id });
    if (!locker) {
      locker = new DocumentLocker({
        user: user._id,
        lockerPin: '1234'
      });
      await locker.save();
      console.log('✅ Locker created');
    }

    // Test creating a document with minimal data
    console.log('\n📄 Testing document creation...');
    
    const testDoc = new LockerDocument({
      locker: locker._id,
      name: 'Test Document',
      originalName: 'test.jpg',
      documentType: 'passport',
      filePath: '/test/path/test.jpg',
      fileSize: 1024,
      mimeType: 'image/jpeg',
      extractedData: {
        rawText: 'Test text',
        confidence: 0
      },
      tags: [],
      encryptionKey: 'test-key-123'
    });

    await testDoc.save();
    console.log('✅ Document created successfully:', testDoc._id);

    // Test with more extractedData
    console.log('\n📄 Testing with full extracted data...');
    
    const fullDoc = new LockerDocument({
      locker: locker._id,
      name: 'Full Test Document',
      originalName: 'full-test.jpg',
      documentType: 'passport',
      filePath: '/test/path/full-test.jpg',
      fileSize: 2048,
      mimeType: 'image/jpeg',
      extractedData: {
        fullName: 'John Doe',
        dateOfBirth: new Date('1990-01-01'),
        passportNumber: 'A1234567',
        issueDate: new Date('2020-01-01'),
        expiryDate: new Date('2030-01-01'),
        issuingAuthority: 'Test Authority',
        address: {
          line1: '123 Test St',
          city: 'Test City',
          state: 'Test State',
          pincode: '123456',
          country: 'India'
        },
        rawText: 'Full test text',
        confidence: 85.5
      },
      tags: ['test'],
      encryptionKey: 'test-key-456'
    });

    await fullDoc.save();
    console.log('✅ Full document created successfully:', fullDoc._id);

    // Clean up test documents
    await LockerDocument.deleteMany({ _id: { $in: [testDoc._id, fullDoc._id] } });
    console.log('\n🧹 Cleaned up test documents');

    console.log('\n✅ All tests passed!');

  } catch (error) {
    console.error('❌ Error:', error);
    console.error('Stack:', error.stack);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

testSimpleUpload();
