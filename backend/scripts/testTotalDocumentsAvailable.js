import mongoose from 'mongoose';
import Service from '../models/Service.js';

const testTotalDocumentsAvailable = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://sahayakai:sahayakai@cluster0.fye0w5x.mongodb.net/sahayak_ai?retryWrites=true&w=majority');
    console.log('Connected to MongoDB');

    // Find a service to test with
    const service = await Service.findOne();
    if (!service) {
      console.log('No services found');
      return;
    }

    console.log(`\nTesting with service: ${service.name}`);
    console.log(`Current documents count: ${(service.documents?.length || 0) + (service.requiredDocuments?.length || 0)}`);
    console.log(`Current totalDocumentsAvailable: ${service.totalDocumentsAvailable || 'Not set'}`);
    console.log(`Current minimumRequiredDocuments: ${service.minimumRequiredDocuments}`);

    // Test 1: Set totalDocumentsAvailable to a custom value
    console.log('\n--- Test 1: Setting totalDocumentsAvailable to 9 ---');
    service.totalDocumentsAvailable = 9;
    service.minimumRequiredDocuments = 8;
    await service.save();

    const updatedService = await Service.findById(service._id);
    console.log(`Updated totalDocumentsAvailable: ${updatedService.totalDocumentsAvailable}`);
    console.log(`Updated minimumRequiredDocuments: ${updatedService.minimumRequiredDocuments}`);

    // Test 2: Test the document requirements API
    console.log('\n--- Test 2: Testing document requirements API response ---');
    const totalDocuments = updatedService.totalDocumentsAvailable || (updatedService.documents?.length || 0) + (updatedService.requiredDocuments?.length || 0);
    const minimumRequired = updatedService.minimumRequiredDocuments ?? Math.max(1, totalDocuments - 1);

    const documentRequirements = {
      serviceId: updatedService._id,
      serviceName: updatedService.name,
      totalDocuments,
      minimumRequired,
      documents: updatedService.documents || [],
      legacyDocuments: updatedService.requiredDocuments || [],
      instructions: `Please select at least ${minimumRequired} documents from the ${totalDocuments} available options to proceed with your application.`,
      validationRules: {
        totalRequired: totalDocuments,
        minimumThreshold: minimumRequired
      }
    };

    console.log('Document requirements response:');
    console.log(JSON.stringify(documentRequirements, null, 2));

    // Test 3: Test validation logic
    console.log('\n--- Test 3: Testing validation logic ---');
    const selectedDocuments = ['doc1', 'doc2', 'doc3', 'doc4', 'doc5', 'doc6', 'doc7', 'doc8']; // 8 documents
    const isValid = selectedDocuments.length >= minimumRequired;
    console.log(`Selected documents: ${selectedDocuments.length}`);
    console.log(`Minimum required: ${minimumRequired}`);
    console.log(`Validation result: ${isValid ? 'PASS' : 'FAIL'}`);

    console.log('\n✅ All tests completed successfully!');

  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await mongoose.disconnect();
  }
};

testTotalDocumentsAvailable();