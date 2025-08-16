import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Service from '../models/Service.js';
import User from '../models/User.js';

dotenv.config();

const sampleServices = [
  {
    name: 'Birth Certificate',
    description: 'Official birth certificate issued by the government for legal purposes.',
    category: 'Civil Registration',
    fee: 50,
    processingTime: '7-10 working days',
    requiredDocuments: [
      'Hospital Birth Certificate',
      'Parents Aadhaar Card',
      'Parents Marriage Certificate',
      'Address Proof'
    ],
    isActive: true,
    visitCount: 0
  },
  {
    name: 'Death Certificate',
    description: 'Official death certificate for legal and administrative purposes.',
    category: 'Civil Registration',
    fee: 50,
    processingTime: '5-7 working days',
    requiredDocuments: [
      'Medical Certificate of Death',
      'Aadhaar Card of Deceased',
      'Applicant ID Proof',
      'Address Proof'
    ],
    isActive: true,
    visitCount: 0
  },
  {
    name: 'Marriage Certificate',
    description: 'Official marriage certificate for legal recognition of marriage.',
    category: 'Civil Registration',
    fee: 100,
    processingTime: '10-15 working days',
    requiredDocuments: [
      'Marriage Invitation Card',
      'Both Partners Aadhaar Card',
      'Age Proof Documents',
      'Passport Size Photos',
      'Witness Documents'
    ],
    isActive: true,
    visitCount: 0
  },
  {
    name: 'Income Certificate',
    description: 'Certificate showing annual income for various government schemes.',
    category: 'Revenue',
    fee: 30,
    processingTime: '5-7 working days',
    requiredDocuments: [
      'Aadhaar Card',
      'Salary Certificate/Income Proof',
      'Bank Statements',
      'Address Proof'
    ],
    isActive: true,
    visitCount: 0
  },
  {
    name: 'Caste Certificate',
    description: 'Certificate for caste verification for reservations and benefits.',
    category: 'Revenue',
    fee: 30,
    processingTime: '10-15 working days',
    requiredDocuments: [
      'Aadhaar Card',
      'School/College Certificate',
      'Parents Caste Certificate',
      'Address Proof'
    ],
    isActive: true,
    visitCount: 0
  },
  {
    name: 'Domicile Certificate',
    description: 'Certificate proving residence in Kerala for various purposes.',
    category: 'Revenue',
    fee: 30,
    processingTime: '7-10 working days',
    requiredDocuments: [
      'Aadhaar Card',
      'Voter ID Card',
      'Ration Card',
      'Property Documents',
      'School/College Certificate'
    ],
    isActive: true,
    visitCount: 0
  },
  {
    name: 'Aadhaar Enrollment',
    description: 'New Aadhaar card enrollment for Indian citizens.',
    category: 'Identity Services',
    fee: 0,
    processingTime: '30-45 days',
    requiredDocuments: [
      'Proof of Identity',
      'Proof of Address',
      'Date of Birth Proof'
    ],
    isActive: true,
    visitCount: 0
  },
  {
    name: 'Aadhaar Update',
    description: 'Update demographic or biometric information in Aadhaar.',
    category: 'Identity Services',
    fee: 50,
    processingTime: '15-30 days',
    requiredDocuments: [
      'Existing Aadhaar Card',
      'Supporting Documents for Changes',
      'Address Proof (if updating address)'
    ],
    isActive: true,
    visitCount: 0
  },
  {
    name: 'PAN Card Application',
    description: 'Apply for new Permanent Account Number card.',
    category: 'Tax Services',
    fee: 110,
    processingTime: '15-20 working days',
    requiredDocuments: [
      'Identity Proof',
      'Address Proof',
      'Date of Birth Proof',
      'Passport Size Photo'
    ],
    isActive: true,
    visitCount: 0
  },
  {
    name: 'Passport Application',
    description: 'Apply for new Indian passport for international travel.',
    category: 'Identity Services',
    fee: 1500,
    processingTime: '30-45 days',
    requiredDocuments: [
      'Birth Certificate',
      'Address Proof',
      'Identity Proof',
      'Passport Size Photos',
      'Educational Certificates'
    ],
    isActive: true,
    visitCount: 0
  }
];

const seedServices = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/akshaya-services');
    console.log('MongoDB connected successfully');

    // Get admin user to set as creator
    const admin = await User.findOne({ role: 'admin' });
    if (!admin) {
      console.log('❌ Admin user not found. Please run seedAdmin.js first');
      process.exit(1);
    }

    // Clear existing services
    await Service.deleteMany({});
    console.log('🗑️ Cleared existing services');

    // Add createdBy field to all services
    const servicesWithCreator = sampleServices.map(service => ({
      ...service,
      createdBy: admin._id
    }));

    // Insert sample services
    const insertedServices = await Service.insertMany(servicesWithCreator);
    console.log(`✅ Inserted ${insertedServices.length} sample services`);

    console.log('\n📋 Services added:');
    insertedServices.forEach(service => {
      console.log(`- ${service.name} (${service.category}) - ₹${service.fee}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Error seeding services:', error);
    process.exit(1);
  }
};

seedServices();