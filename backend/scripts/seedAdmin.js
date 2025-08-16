import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Service from '../models/Service.js';
import News from '../models/News.js';

dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/akshaya-services');
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

const seedAdmin = async () => {
  try {
    await connectDB();

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'admin@akshaya.gov.in' });
    if (existingAdmin) {
      console.log('Admin user already exists');
      return;
    }

    // Create admin user
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const admin = new User({
      name: 'System Administrator',
      email: 'admin@akshaya.gov.in',
      password: hashedPassword,
      phone: '9876543210',
      role: 'admin'
    });

    await admin.save();
    console.log('Admin user created successfully');
    console.log('Email: admin@akshaya.gov.in');
    console.log('Password: admin123');

    // Create sample services
    const sampleServices = [
      {
        name: 'Birth Certificate',
        description: 'Apply for official birth certificate from the civil registration department',
        category: 'Civil Registration',
        fee: 50,
        processingTime: '7-10 days',
        requiredDocuments: ['Hospital Birth Certificate', 'Parents Aadhaar Card', 'Marriage Certificate'],
        createdBy: admin._id
      },
      {
        name: 'Death Certificate',
        description: 'Apply for official death certificate from the civil registration department',
        category: 'Civil Registration',
        fee: 50,
        processingTime: '5-7 days',
        requiredDocuments: ['Hospital Death Certificate', 'Aadhaar Card of Deceased', 'Family Member ID'],
        createdBy: admin._id
      },
      {
        name: 'Income Certificate',
        description: 'Apply for income certificate for various government schemes and applications',
        category: 'Revenue',
        fee: 30,
        processingTime: '10-15 days',
        requiredDocuments: ['Aadhaar Card', 'Salary Certificate', 'Bank Statements', 'Ration Card'],
        createdBy: admin._id
      },
      {
        name: 'Caste Certificate',
        description: 'Apply for caste certificate for educational and employment purposes',
        category: 'Revenue',
        fee: 30,
        processingTime: '15-20 days',
        requiredDocuments: ['Aadhaar Card', 'School Certificate', 'Family Caste Certificate', 'Residence Proof'],
        createdBy: admin._id
      },
      {
        name: 'Driving License',
        description: 'Apply for new driving license or renewal of existing license',
        category: 'Transport',
        fee: 200,
        processingTime: '30 days',
        requiredDocuments: ['Aadhaar Card', 'Address Proof', 'Age Proof', 'Medical Certificate', 'Passport Photos'],
        createdBy: admin._id
      }
    ];

    for (const serviceData of sampleServices) {
      const existingService = await Service.findOne({ name: serviceData.name });
      if (!existingService) {
        const service = new Service(serviceData);
        await service.save();
        console.log(`Created service: ${serviceData.name}`);
      }
    }

    // Create sample news
    const sampleNews = [
      {
        title: 'New Digital Certificate Service Launched',
        summary: 'Kerala Government launches new digital certificate service for faster processing',
        content: 'The Kerala Government has launched a new digital certificate service that will significantly reduce the processing time for various certificates. Citizens can now apply online and track their application status in real-time. The service covers birth certificates, death certificates, income certificates, and caste certificates.',
        category: 'announcement',
        isPublished: true,
        createdBy: admin._id
      },
      {
        title: 'Online Payment Gateway Integration',
        summary: 'New secure payment gateway integrated for online fee payments',
        content: 'We have integrated a new secure payment gateway that supports multiple payment methods including UPI, net banking, credit cards, and debit cards. This will make it easier for citizens to pay fees online without visiting the office.',
        category: 'update',
        isPublished: true,
        createdBy: admin._id
      },
      {
        title: 'System Maintenance Schedule',
        summary: 'Scheduled maintenance on Sunday, 2nd February 2025',
        content: 'Our systems will undergo scheduled maintenance on Sunday, 2nd February 2025, from 2:00 AM to 6:00 AM. During this time, online services may be temporarily unavailable. We apologize for any inconvenience caused.',
        category: 'alert',
        isPublished: true,
        createdBy: admin._id
      }
    ];

    for (const newsData of sampleNews) {
      const existingNews = await News.findOne({ title: newsData.title });
      if (!existingNews) {
        const news = new News(newsData);
        await news.save();
        console.log(`Created news: ${newsData.title}`);
      }
    }

    console.log('Database seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
};

seedAdmin();