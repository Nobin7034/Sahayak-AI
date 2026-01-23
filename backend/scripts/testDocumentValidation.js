import mongoose from 'mongoose';
import dotenv from 'dotenv';
import axios from 'axios';
import DocumentRequirement from '../models/DocumentRequirement.js';
import Service from '../models/Service.js';
import Appointment from '../models/Appointment.js';
import User from '../models/User.js';

dotenv.config();

const API_BASE = 'http://localhost:5000/api';

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected for testing');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

const testDocumentValidationWorkflow = async () => {
  try {
    await connectDB();
    
    console.log('🧪 Testing Document Validation Workflow\n');
    
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
    try {
      const response = await axios.get(`${API_BASE}/documents/service/${service._id}`);
      const requirements = response.data.data;
      
      console.log(`✓ Document requirements loaded:`);
      console.log(`  - Total documents: ${requirements.totalDocuments}`);
      console.log(`  - Minimum required: ${requirements.minimumRequired}`);
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
          documentId: requirements.documents[0]._id,
          documentName: requirements.documents[0].name,
          isAlternative: false
        },
        {
          documentId: requirements.documents[1]._id,
          documentName: requirements.documents[1].name,
          isAlternative: true,
          alternativeName: requirements.documents[1].alternatives[0].name
        },
        {
          documentId: requirements.documents[2]._id,
          documentName: requirements.documents[2].name,
          isAlternative: false
        }
      ];
      
      const validationResponse = await axios.post(`${API_BASE}/documents/validate`, {
        serviceId: service._id,
        selectedDocuments: validSelection
      });
      
      const validation = validationResponse.data.data;
      console.log(`✓ Validation result:`);
      console.log(`  - Is valid: ${validation.isValid}`);
      console.log(`  - Can proceed: ${validation.canProceed}`);
      console.log(`  - Selected count: ${validation.selectedCount}/${validation.minimumRequired}`);
      console.log(`  - Mandatory requirement met: ${validation.mandatoryRequirementMet}`);
      
      // 4. Test document selection validation - Invalid case
      console.log('\n4. Testing invalid document selection (insufficient documents)...');
      const invalidSelection = [
        {
          documentId: requirements.documents[0]._id,
          documentName: requirements.documents[0].name,
          isAlternative: false
        }
      ];
      
      const invalidValidationResponse = await axios.post(`${API_BASE}/documents/validate`, {
        serviceId: service._id,
        selectedDocuments: invalidSelection
      });
      
      const invalidValidation = invalidValidationResponse.data.data;
      console.log(`✓ Invalid validation result:`);
      console.log(`  - Is valid: ${invalidValidation.isValid}`);
      console.log(`  - Can proceed: ${invalidValidation.canProceed}`);
      console.log(`  - Selected count: ${invalidValidation.selectedCount}/${invalidValidation.minimumRequired}`);
      console.log(`  - Message: ${invalidValidation.message}`);
      
      // 5. Test appointment creation with document selection
      console.log('\n5. Testing appointment creation with selected documents...');
      
      // Find a test user
      const user = await User.findOne({ role: 'user' });
      if (!user) {
        console.log('❌ No test user found. Skipping appointment creation test.');
        return;
      }
      
      // Create a mock appointment with selected documents
      const appointmentData = {
        user: user._id,
        service: service._id,
        center: new mongoose.Types.ObjectId(), // Mock center ID
        appointmentDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
        timeSlot: '10:00 AM',
        selectedDocuments: validSelection,
        status: 'confirmed'
      };
      
      const appointment = new Appointment(appointmentData);
      await appointment.save();
      
      console.log(`✓ Test appointment created with ID: ${appointment._id}`);
      console.log(`  - Selected documents: ${appointment.selectedDocuments.length}`);
      
      // 6. Test document validation update by staff
      console.log('\n6. Testing staff document validation update...');
      
      const validationUpdate = {
        isValidated: true,
        missingDocuments: [],
        staffNotes: 'All documents verified and are in order.'
      };
      
      appointment.documentValidation = {
        ...validationUpdate,
        validatedBy: user._id, // Mock staff user
        validatedAt: new Date()
      };
      
      await appointment.save();
      
      console.log(`✓ Document validation updated:`);
      console.log(`  - Is validated: ${appointment.documentValidation.isValidated}`);
      console.log(`  - Staff notes: ${appointment.documentValidation.staffNotes}`);
      
      // 7. Test missing document notification
      console.log('\n7. Testing missing document scenario...');
      
      const missingDocValidation = {
        isValidated: false,
        missingDocuments: ['Proof of Address'],
        staffNotes: 'Address proof document is not clear. Please provide a clearer copy.'
      };
      
      appointment.documentValidation = {
        ...missingDocValidation,
        validatedBy: user._id,
        validatedAt: new Date()
      };
      
      await appointment.save();
      
      console.log(`✓ Missing document validation updated:`);
      console.log(`  - Is validated: ${appointment.documentValidation.isValidated}`);
      console.log(`  - Missing documents: ${appointment.documentValidation.missingDocuments.join(', ')}`);
      console.log(`  - Staff notes: ${appointment.documentValidation.staffNotes}`);
      
      // Clean up test appointment
      await Appointment.findByIdAndDelete(appointment._id);
      console.log(`✓ Test appointment cleaned up`);
      
      console.log('\n✅ Document validation workflow test completed successfully!');
      
    } catch (error) {
      if (error.response) {
        console.log(`❌ API Error: ${error.response.status} - ${error.response.data.message}`);
      } else {
        console.log(`❌ Error: ${error.message}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  }
};

// Run the test
testDocumentValidationWorkflow();