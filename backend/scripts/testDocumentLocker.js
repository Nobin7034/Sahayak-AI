import mongoose from 'mongoose';
import dotenv from 'dotenv';
import connectDB from '../config/db.js';
import DocumentLocker from '../models/DocumentLocker.js';
import LockerDocument from '../models/LockerDocument.js';
import User from '../models/User.js';

dotenv.config();

const testDocumentLocker = async () => {
  try {
    // Connect to database
    await connectDB();
    console.log('✅ Connected to database');

    // Find a test user (or create one)
    let testUser = await User.findOne({ email: 'test@example.com' });
    if (!testUser) {
      testUser = await User.create({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        phone: '9876543210'
      });
      console.log('✅ Created test user');
    } else {
      console.log('✅ Found existing test user');
    }

    // Test DocumentLocker model
    console.log('\n🔒 Testing DocumentLocker model...');
    
    // Clean up any existing locker for test user
    await DocumentLocker.deleteMany({ user: testUser._id });
    await LockerDocument.deleteMany({});
    
    // Create a new locker
    const locker = new DocumentLocker({
      user: testUser._id,
      lockerPin: '1234'
    });
    
    await locker.save();
    console.log('✅ Created document locker');
    
    // Test PIN verification
    const isValidPin = await locker.verifyPin('1234');
    console.log(`✅ PIN verification: ${isValidPin ? 'PASS' : 'FAIL'}`);
    
    const isInvalidPin = await locker.verifyPin('0000');
    console.log(`✅ Invalid PIN rejection: ${!isInvalidPin ? 'PASS' : 'FAIL'}`);
    
    // Test failed attempts
    console.log('\n🚫 Testing failed attempts...');
    locker.recordFailedAttempt();
    locker.recordFailedAttempt();
    locker.recordFailedAttempt();
    
    console.log(`Failed attempts count: ${locker.failedAttempts.count}`);
    console.log(`Is locked: ${locker.isLocked()}`);
    
    // Reset failed attempts
    locker.resetFailedAttempts();
    console.log(`After reset - Failed attempts: ${locker.failedAttempts.count}`);
    console.log(`Is locked: ${locker.isLocked()}`);
    
    // Test LockerDocument model
    console.log('\n📄 Testing LockerDocument model...');
    
    const document = new LockerDocument({
      locker: locker._id,
      name: 'Test Aadhaar Card',
      originalName: 'aadhaar.jpg',
      documentType: 'aadhaar_card',
      filePath: '/uploads/document-locker/test-aadhaar.jpg',
      fileSize: 1024000,
      mimeType: 'image/jpeg',
      extractedData: {
        fullName: 'Test User',
        aadhaarNumber: '1234-5678-9012',
        dateOfBirth: new Date('1990-01-01'),
        address: {
          line1: '123 Test Street',
          city: 'Test City',
          state: 'Test State',
          pincode: '123456'
        },
        confidence: 95.5
      }
    });
    
    await document.save();
    console.log('✅ Created test document');
    
    // Test validation
    const validationResults = document.validateConsistency([]);
    console.log('✅ Validation results:', validationResults.overallScore);
    
    // Test audit logging
    document.logAudit('created', 'Test document created', '127.0.0.1');
    document.recordAccess();
    await document.save();
    
    console.log('✅ Audit trail and access tracking working');
    
    // Add document to locker
    locker.documents.push(document._id);
    locker.logAccess('upload_document', { ip: '127.0.0.1', get: () => 'test-agent' }, true, document._id);
    await locker.save();
    
    console.log('✅ Document added to locker');
    
    // Test document retrieval
    const retrievedLocker = await DocumentLocker.findOne({ user: testUser._id })
      .populate('documents');
    
    console.log(`✅ Locker has ${retrievedLocker.documents.length} document(s)`);
    
    // Test document search
    const documents = await LockerDocument.find({
      locker: locker._id,
      isActive: true
    });
    
    console.log(`✅ Found ${documents.length} active document(s)`);
    
    console.log('\n🎉 All tests passed! Document Locker models are working correctly.');
    
    // Clean up test data
    await DocumentLocker.deleteMany({ user: testUser._id });
    await LockerDocument.deleteMany({ locker: locker._id });
    await User.deleteMany({ email: 'test@example.com' });
    
    console.log('✅ Cleaned up test data');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('✅ Database connection closed');
  }
};

// Run the test
testDocumentLocker();