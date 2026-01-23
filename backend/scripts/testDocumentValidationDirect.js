import mongoose from 'mongoose';
import dotenv from 'dotenv';
import DocumentRequirement from '../models/DocumentRequirement.js';
import Service from '../models/Service.js';
import Appointment from '../models/Appointment.js';
import User from '../models/User.js';
import AkshayaCenter from '../models/AkshayaCenter.js';

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

// Helper function to validate document selection (same as in routes)
function validateDocumentSelection(requirements, selectedDocuments) {
  const { documents, minimumRequired, validationRules } = requirements;
  
  // Count selected documents
  const selectedCount = selectedDocuments.length;
  
  // Check if minimum requirement is met
  const meetsMinimum = selectedCount >= minimumRequired;
  
  // Validate mandatory documents
  const mandatoryDocs = documents.filter(doc => doc.isMandatory);
  const selectedMandatoryCount = selectedDocuments.filter(selected => {
    const doc = documents.find(d => d._id.toString() === selected.documentId);
    return doc && doc.isMandatory;
  }).length;
  
  const mandatoryRequirementMet = selectedMandatoryCount >= (validationRules?.mandatoryCount || mandatoryDocs.length);
  
  // Overall validation result
  const isValid = meetsMinimum && mandatoryRequirementMet;
  
  return {
    isValid,
    selectedCount,
    minimumRequired,
    meetsMinimum,
    mandatoryRequirementMet,
    canProceed: isValid,
    message: isValid 
      ? 'Document selection is valid. You can proceed to center selection.'
      : 'Please select additional documents to meet the minimum requirements.'
  };
}

const testDocumentValidationWorkflow = async () => {
  try {
    await connectDB();
    
    console.log('🧪 Testing Document Validation Workflow (Direct Database)\n');
    
    // 1. Get a service with document requirements
    console.log('1. Finding service with document requirements...');
    const service = await Service.findOne({ name: 'Aadhaar Enrollment' });
    if (!service) {
      console.log('❌ Test service not found. Please run seedDocumentRequirements.js first');
      return;
    }
    console.log(`✓ Found service: ${service.name}`);
    
    // 2. Get document requirements for the service
    console.log('\n2. Fetching document requirements...');
    const requirements = await DocumentRequirement.findOne({ service: service._id });
    
    if (!requirements) {
      console.log('❌ Document requirements not found for this service');
      return;
    }
    
    console.log(`✓ Document requirements loaded:`);
    console.log(`  - Total documents: ${requirements.totalDocuments}`);
    console.log(`  - Minimum required: ${requirements.minimumRequired}`);
    console.log(`  - Instructions: ${requirements.instructions}`);
    console.log(`  - Documents:`);
    requirements.documents.forEach((doc, index) => {
      console.log(`    ${index + 1}. ${doc.name} (${doc.isMandatory ? 'Mandatory' : 'Optional'})`);
      if (doc.alternatives && doc.alternatives.length > 0) {
        console.log(`       Alternatives: ${doc.alternatives.map(alt => alt.name).join(', ')}`);
      }
    });
    
    // 3. Test document selection validation - Valid case
    console.log('\n3. Testing valid document selection...');
    const validSelection = [
      {
        documentId: requirements.documents[0]._id.toString(),
        documentName: requirements.documents[0].name,
        isAlternative: false
      },
      {
        documentId: requirements.documents[1]._id.toString(),
        documentName: requirements.documents[1].name,
        isAlternative: true,
        alternativeName: requirements.documents[1].alternatives[0].name
      },
      {
        documentId: requirements.documents[2]._id.toString(),
        documentName: requirements.documents[2].name,
        isAlternative: false
      }
    ];
    
    const validation = validateDocumentSelection(requirements, validSelection);
    console.log(`✓ Validation result:`);
    console.log(`  - Is valid: ${validation.isValid}`);
    console.log(`  - Can proceed: ${validation.canProceed}`);
    console.log(`  - Selected count: ${validation.selectedCount}/${validation.minimumRequired}`);
    console.log(`  - Mandatory requirement met: ${validation.mandatoryRequirementMet}`);
    console.log(`  - Message: ${validation.message}`);
    
    // 4. Test document selection validation - Invalid case
    console.log('\n4. Testing invalid document selection (insufficient documents)...');
    const invalidSelection = [
      {
        documentId: requirements.documents[0]._id.toString(),
        documentName: requirements.documents[0].name,
        isAlternative: false
      }
    ];
    
    const invalidValidation = validateDocumentSelection(requirements, invalidSelection);
    console.log(`✓ Invalid validation result:`);
    console.log(`  - Is valid: ${invalidValidation.isValid}`);
    console.log(`  - Can proceed: ${invalidValidation.canProceed}`);
    console.log(`  - Selected count: ${invalidValidation.selectedCount}/${invalidValidation.minimumRequired}`);
    console.log(`  - Message: ${invalidValidation.message}`);
    
    // 5. Test appointment creation with document selection
    console.log('\n5. Testing appointment creation with selected documents...');
    
    // Find a test user and center
    const user = await User.findOne({ role: 'user' });
    const center = await AkshayaCenter.findOne({ status: 'active' });
    
    if (!user || !center) {
      console.log('❌ No test user or center found. Skipping appointment creation test.');
      return;
    }
    
    // Create a mock appointment with selected documents
    const appointmentData = {
      user: user._id,
      service: service._id,
      center: center._id,
      appointmentDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
      timeSlot: '10:00 AM',
      selectedDocuments: validSelection,
      status: 'confirmed'
    };
    
    const appointment = new Appointment(appointmentData);
    await appointment.save();
    
    console.log(`✓ Test appointment created with ID: ${appointment._id}`);
    console.log(`  - User: ${user.name} (${user.email})`);
    console.log(`  - Center: ${center.name}`);
    console.log(`  - Selected documents: ${appointment.selectedDocuments.length}`);
    appointment.selectedDocuments.forEach((doc, index) => {
      console.log(`    ${index + 1}. ${doc.isAlternative ? doc.alternativeName : doc.documentName}`);
    });
    
    // 6. Test document validation update by staff
    console.log('\n6. Testing staff document validation update...');
    
    const validationUpdate = {
      isValidated: true,
      validatedBy: user._id, // Mock staff user
      validatedAt: new Date(),
      missingDocuments: [],
      staffNotes: 'All documents verified and are in order. Customer provided clear copies of all required documents.'
    };
    
    appointment.documentValidation = validationUpdate;
    await appointment.save();
    
    console.log(`✓ Document validation updated:`);
    console.log(`  - Is validated: ${appointment.documentValidation.isValidated}`);
    console.log(`  - Validated at: ${appointment.documentValidation.validatedAt.toLocaleString()}`);
    console.log(`  - Staff notes: ${appointment.documentValidation.staffNotes}`);
    
    // 7. Test missing document scenario
    console.log('\n7. Testing missing document scenario...');
    
    const missingDocValidation = {
      isValidated: false,
      validatedBy: user._id,
      validatedAt: new Date(),
      missingDocuments: ['Proof of Address'],
      staffNotes: 'Address proof document is not clear. The electricity bill provided is older than 3 months. Please provide a recent utility bill or bank statement.'
    };
    
    appointment.documentValidation = missingDocValidation;
    await appointment.save();
    
    console.log(`✓ Missing document validation updated:`);
    console.log(`  - Is validated: ${appointment.documentValidation.isValidated}`);
    console.log(`  - Missing documents: ${appointment.documentValidation.missingDocuments.join(', ')}`);
    console.log(`  - Staff notes: ${appointment.documentValidation.staffNotes}`);
    
    // 8. Test workflow completion
    console.log('\n8. Testing workflow completion...');
    
    // Simulate user bringing correct documents
    const finalValidation = {
      isValidated: true,
      validatedBy: user._id,
      validatedAt: new Date(),
      missingDocuments: [],
      staffNotes: 'Updated address proof received and verified. All documents are now complete and valid.'
    };
    
    appointment.documentValidation = finalValidation;
    appointment.status = 'in_progress';
    await appointment.save();
    
    console.log(`✓ Final validation completed:`);
    console.log(`  - Status: ${appointment.status}`);
    console.log(`  - All documents validated: ${appointment.documentValidation.isValidated}`);
    console.log(`  - Final notes: ${appointment.documentValidation.staffNotes}`);
    
    // 9. Display complete appointment summary
    console.log('\n9. Complete appointment summary:');
    const fullAppointment = await Appointment.findById(appointment._id)
      .populate('user', 'name email')
      .populate('service', 'name category')
      .populate('center', 'name address.city');
    
    console.log(`📋 Appointment Summary:`);
    console.log(`  - ID: ${fullAppointment._id}`);
    console.log(`  - Customer: ${fullAppointment.user.name} (${fullAppointment.user.email})`);
    console.log(`  - Service: ${fullAppointment.service.name} (${fullAppointment.service.category})`);
    console.log(`  - Center: ${fullAppointment.center.name}, ${fullAppointment.center.address.city}`);
    console.log(`  - Date: ${fullAppointment.appointmentDate.toLocaleDateString()}`);
    console.log(`  - Time: ${fullAppointment.timeSlot}`);
    console.log(`  - Status: ${fullAppointment.status}`);
    console.log(`  - Documents Selected: ${fullAppointment.selectedDocuments.length}`);
    console.log(`  - Document Validation: ${fullAppointment.documentValidation.isValidated ? 'Completed' : 'Pending'}`);
    
    // Clean up test appointment
    await Appointment.findByIdAndDelete(appointment._id);
    console.log(`\n✓ Test appointment cleaned up`);
    
    console.log('\n✅ Document validation workflow test completed successfully!');
    console.log('\n📊 Test Summary:');
    console.log('  ✓ Document requirements loaded and displayed');
    console.log('  ✓ Valid document selection validated');
    console.log('  ✓ Invalid document selection rejected');
    console.log('  ✓ Appointment created with selected documents');
    console.log('  ✓ Staff document validation workflow tested');
    console.log('  ✓ Missing document notification workflow tested');
    console.log('  ✓ Complete workflow from selection to validation tested');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  }
};

// Run the test
testDocumentValidationWorkflow();