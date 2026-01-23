import mongoose from 'mongoose';
import dotenv from 'dotenv';
import DocumentRequirement from '../models/DocumentRequirement.js';
import Service from '../models/Service.js';

dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected for seeding');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

const sampleDocumentRequirements = [
  {
    serviceName: 'Aadhaar Enrollment',
    documents: [
      {
        name: 'Proof of Identity',
        description: 'Valid government-issued photo identification document',
        category: 'identity',
        isRequired: true,
        priority: 1,
        referenceImage: '/images/documents/identity-proof-sample.jpg',
        alternatives: [
          { 
            name: 'Passport', 
            description: 'Valid Indian passport with photo',
            referenceImage: '/images/documents/passport-sample.jpg',
            notes: 'Must be current and not expired'
          },
          { 
            name: 'Voter ID', 
            description: 'Election Commission voter ID card',
            referenceImage: '/images/documents/voter-id-sample.jpg'
          },
          { 
            name: 'Driving License', 
            description: 'Valid driving license with photo',
            referenceImage: '/images/documents/driving-license-sample.jpg'
          }
        ],
        notes: 'Document should be clear and not expired',
        validityPeriod: 'permanent',
        acceptableFormats: ['original', 'self-attested copy']
      },
      {
        name: 'Proof of Address',
        description: 'Document showing current residential address',
        category: 'address',
        isRequired: true,
        priority: 1,
        referenceImage: '/images/documents/address-proof-sample.jpg',
        alternatives: [
          { 
            name: 'Electricity Bill', 
            description: 'Latest electricity bill (within 3 months)',
            referenceImage: '/images/documents/electricity-bill-sample.jpg'
          },
          { 
            name: 'Bank Statement', 
            description: 'Bank statement with address (within 3 months)',
            referenceImage: '/images/documents/bank-statement-sample.jpg'
          },
          { 
            name: 'Rent Agreement', 
            description: 'Registered rent agreement',
            referenceImage: '/images/documents/rent-agreement-sample.jpg'
          }
        ],
        notes: 'Address proof should be recent and clearly show your current address',
        validityPeriod: '3 months',
        acceptableFormats: ['original', 'self-attested copy']
      },
      {
        name: 'Date of Birth Proof',
        description: 'Official document showing date of birth',
        category: 'identity',
        isRequired: true,
        priority: 2,
        referenceImage: '/images/documents/dob-proof-sample.jpg',
        alternatives: [
          { 
            name: 'Birth Certificate', 
            description: 'Official birth certificate from municipal authority',
            referenceImage: '/images/documents/birth-certificate-sample.jpg'
          },
          { 
            name: 'School Certificate', 
            description: '10th class certificate with DOB',
            referenceImage: '/images/documents/school-certificate-sample.jpg'
          },
          { 
            name: 'Passport', 
            description: 'Valid passport showing DOB',
            referenceImage: '/images/documents/passport-dob-sample.jpg'
          }
        ],
        notes: 'Date of birth should match across all documents',
        validityPeriod: 'permanent',
        acceptableFormats: ['original', 'self-attested copy', 'notarized copy']
      }
    ],
    validationRules: {
      totalRequired: 3,
      minimumThreshold: 2, // User can proceed with 2 out of 3 documents
      categoryRequirements: [
        { category: 'identity', minimumRequired: 1, description: 'At least one identity document required' },
        { category: 'address', minimumRequired: 1, description: 'At least one address document required' }
      ],
      priorityRequirements: [
        { priority: 1, minimumRequired: 2, description: 'At least 2 high priority documents required' }
      ]
    },
    instructions: 'Please select which documents you currently have. You need at least 2 documents to proceed, including 1 identity and 1 address proof.',
    staffInstructions: 'Verify that user has brought the selected documents. For missing documents, suggest alternatives from the list.'
  },
  {
    serviceName: 'PAN Card Application',
    documents: [
      {
        name: 'Identity Proof',
        description: 'Government-issued photo identity proof',
        category: 'identity',
        isRequired: true,
        priority: 1,
        referenceImage: '/images/documents/pan-identity-sample.jpg',
        alternatives: [
          { 
            name: 'Aadhaar Card', 
            description: 'Valid Aadhaar card',
            referenceImage: '/images/documents/aadhaar-sample.jpg'
          },
          { 
            name: 'Passport', 
            description: 'Valid Indian passport',
            referenceImage: '/images/documents/passport-sample.jpg'
          },
          { 
            name: 'Voter ID', 
            description: 'Election Commission voter ID',
            referenceImage: '/images/documents/voter-id-sample.jpg'
          }
        ],
        validityPeriod: 'permanent',
        acceptableFormats: ['original', 'self-attested copy']
      },
      {
        name: 'Address Proof',
        description: 'Current address verification document',
        category: 'address',
        isRequired: true,
        priority: 1,
        referenceImage: '/images/documents/pan-address-sample.jpg',
        alternatives: [
          { 
            name: 'Aadhaar Card', 
            description: 'Aadhaar card with current address',
            referenceImage: '/images/documents/aadhaar-address-sample.jpg'
          },
          { 
            name: 'Utility Bill', 
            description: 'Electricity/water/gas bill (within 2 months)',
            referenceImage: '/images/documents/utility-bill-sample.jpg'
          },
          { 
            name: 'Bank Statement', 
            description: 'Bank statement (within 3 months)',
            referenceImage: '/images/documents/bank-statement-sample.jpg'
          }
        ],
        validityPeriod: '3 months',
        acceptableFormats: ['original', 'self-attested copy']
      },
      {
        name: 'Date of Birth Proof',
        description: 'Official date of birth verification',
        category: 'identity',
        isRequired: true,
        priority: 2,
        referenceImage: '/images/documents/pan-dob-sample.jpg',
        alternatives: [
          { 
            name: 'Aadhaar Card', 
            description: 'Aadhaar card showing DOB',
            referenceImage: '/images/documents/aadhaar-dob-sample.jpg'
          },
          { 
            name: 'Birth Certificate', 
            description: 'Official birth certificate',
            referenceImage: '/images/documents/birth-certificate-sample.jpg'
          },
          { 
            name: 'School Certificate', 
            description: '10th standard certificate',
            referenceImage: '/images/documents/school-certificate-sample.jpg'
          }
        ],
        validityPeriod: 'permanent',
        acceptableFormats: ['original', 'self-attested copy', 'notarized copy']
      },
      {
        name: 'Photograph',
        description: 'Recent passport-size photograph',
        category: 'other',
        isRequired: false,
        priority: 3,
        referenceImage: '/images/documents/passport-photo-sample.jpg',
        notes: 'Colored photograph with white background preferred',
        validityPeriod: '6 months',
        acceptableFormats: ['original']
      }
    ],
    validationRules: {
      totalRequired: 4,
      minimumThreshold: 3, // User can proceed with 3 out of 4 documents
      categoryRequirements: [
        { category: 'identity', minimumRequired: 2, description: 'At least 2 identity documents required' },
        { category: 'address', minimumRequired: 1, description: 'At least 1 address document required' }
      ],
      priorityRequirements: [
        { priority: 1, minimumRequired: 2, description: 'Both high priority documents required' }
      ]
    },
    instructions: 'You need at least 3 documents to proceed. Identity and address proofs are mandatory.',
    staffInstructions: 'Ensure all mandatory documents are present. Photograph can be taken at center if not provided.'
  },
  {
    serviceName: 'Passport Application',
    documents: [
      {
        name: 'Birth Certificate',
        description: 'Official birth certificate from municipal authority',
        category: 'identity',
        isMandatory: true,
        alternatives: [
          { name: 'School Certificate', description: '10th standard certificate with DOB' },
          { name: 'Aadhaar Card', description: 'Aadhaar card (if born after 1989)' }
        ],
        validityPeriod: 'permanent'
      },
      {
        name: 'Address Proof',
        description: 'Current residential address proof',
        category: 'address',
        isMandatory: true,
        alternatives: [
          { name: 'Aadhaar Card', description: 'Aadhaar card with current address' },
          { name: 'Electricity Bill', description: 'Latest electricity bill' },
          { name: 'Water Bill', description: 'Latest water bill' },
          { name: 'Telephone Bill', description: 'Latest landline telephone bill' }
        ],
        validityPeriod: '3 months'
      },
      {
        name: 'Identity Proof',
        description: 'Government-issued photo identity proof',
        category: 'identity',
        isMandatory: true,
        alternatives: [
          { name: 'Aadhaar Card', description: 'Valid Aadhaar card' },
          { name: 'Voter ID', description: 'Election Commission voter ID' },
          { name: 'Driving License', description: 'Valid driving license' }
        ],
        validityPeriod: 'permanent'
      },
      {
        name: 'Educational Certificate',
        description: 'Educational qualification proof',
        category: 'educational',
        isMandatory: false,
        alternatives: [
          { name: '10th Certificate', description: 'Secondary school certificate' },
          { name: '12th Certificate', description: 'Higher secondary certificate' },
          { name: 'Degree Certificate', description: 'Graduation certificate' }
        ],
        validityPeriod: 'permanent'
      },
      {
        name: 'Employment Proof',
        description: 'Current employment verification',
        category: 'other',
        isMandatory: false,
        alternatives: [
          { name: 'Salary Certificate', description: 'Current employer salary certificate' },
          { name: 'Employment Letter', description: 'Official employment letter' },
          { name: 'Business License', description: 'For self-employed individuals' }
        ],
        validityPeriod: '6 months'
      }
    ],
    minimumRequired: 3,
    validationRules: {
      mandatoryCount: 3,
      categoryRequirements: [
        { category: 'identity', minimumRequired: 2 },
        { category: 'address', minimumRequired: 1 }
      ]
    },
    instructions: 'All documents must be original or self-attested copies. For minors, parent/guardian documents are also required.'
  }
];

const seedDocumentRequirements = async () => {
  try {
    await connectDB();
    
    console.log('Clearing existing document requirements...');
    await DocumentRequirement.deleteMany({});
    
    console.log('Seeding document requirements...');
    
    for (const reqData of sampleDocumentRequirements) {
      // Find the service by name
      const service = await Service.findOne({ name: reqData.serviceName });
      
      if (!service) {
        console.log(`Service "${reqData.serviceName}" not found, skipping...`);
        continue;
      }
      
      const documentRequirement = new DocumentRequirement({
        service: service._id,
        documents: reqData.documents,
        validationRules: reqData.validationRules,
        instructions: reqData.instructions,
        staffInstructions: reqData.staffInstructions
      });
      
      await documentRequirement.save();
      console.log(`✓ Created document requirements for "${reqData.serviceName}"`);
    }
    
    console.log('\n✅ Document requirements seeding completed successfully!');
    
    // Display summary
    const totalRequirements = await DocumentRequirement.countDocuments();
    console.log(`📊 Total document requirements created: ${totalRequirements}`);
    
  } catch (error) {
    console.error('❌ Error seeding document requirements:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
};

// Run the seeding
seedDocumentRequirements();