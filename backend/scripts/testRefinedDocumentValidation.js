import mongoose from 'mongoose';
import dotenv from 'dotenv';
import DocumentRequirement from '../models/DocumentRequirement.js';
import Service from '../models/Service.js';

dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected for testing');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

const testRefinedValidation = async () => {
  try {
    await connectDB();
    
    console.log('🧪 Testing Refined Document Validation Workflow\n');
    
    // 1. Test service with refined requirements
    console.log('1. Testing Aadhaar Enrollment with refined validation...');
    const service = await Service.findOne({ name: 'Aadhaar Enrollment' });
    if (!service) {
      console.log('❌ Service not found');
      return;
    }
    
    const requirements = await DocumentRequirement.findOne({ service: service._id });
    if (!requirements) {
      console.log('❌ Document requirements not found');
      return;
    }
    
    console.log(`✓ Service: ${service.name}`);
    console.log(`✓ Total documents: ${requirements.validationRules.totalRequired}`);
    console.log(`✓ Minimum threshold: ${requirements.validationRules.minimumThreshold}`);
    
    // 2. Test valid selection (2 out of 3 - should pass)
    console.log('\n2. Testing valid selection (2 out of 3 documents)...');
    const validSelection = [
      {
        documentId: requirements.documents[0]._id.toString(),
        documentName: requirements.documents[0].name,
        priority: requirements.documents[0].priority,
        category: requirements.documents[0].category
      },
      {
        documentId: requirements.documents[1]._id.toString(),
        documentName: requirements.documents[1].name,
        priority: requirements.documents[1].priority,
        category: requirements.documents[1].category
      }
    ];
    
    console.log(`✓ Selected documents: ${validSelection.map(d => d.documentName).join(', ')}`);
    console.log(`✓ Should pass minimum threshold: ${validSelection.length >= requirements.validationRules.minimumThreshold}`);
    
    // 3. Test insufficient selection (1 out of 3 - should fail)
    console.log('\n3. Testing insufficient selection (1 out of 3 documents)...');
    const insufficientSelection = [
      {
        documentId: requirements.documents[0]._id.toString(),
        documentName: requirements.documents[0].name,
        priority: requirements.documents[0].priority,
        category: requirements.documents[0].category
      }
    ];
    
    console.log(`✓ Selected documents: ${insufficientSelection.map(d => d.documentName).join(', ')}`);
    console.log(`✓ Should fail minimum threshold: ${insufficientSelection.length < requirements.validationRules.minimumThreshold}`);
    
    console.log('\n✅ Refined document validation workflow test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  }
};

testRefinedValidation();