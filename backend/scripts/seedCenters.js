import mongoose from 'mongoose';
import dotenv from 'dotenv';
import AkshayaCenter from '../models/AkshayaCenter.js';
import Service from '../models/Service.js';
import connectDB from '../config/db.js';

dotenv.config();

// Sample Akshaya Centers data for Kerala
const sampleCenters = [
  {
    name: "Akshaya Center Thiruvananthapuram",
    address: {
      street: "TC 25/1234, Statue Junction",
      city: "Thiruvananthapuram",
      district: "Thiruvananthapuram",
      state: "Kerala",
      pincode: "695001"
    },
    location: {
      type: "Point",
      coordinates: [76.9366, 8.5241] // [longitude, latitude]
    },
    contact: {
      phone: "+919876543210",
      email: "akshaya.tvm@kerala.gov.in"
    },
    operatingHours: {
      monday: { open: "09:00", close: "17:00", isOpen: true },
      tuesday: { open: "09:00", close: "17:00", isOpen: true },
      wednesday: { open: "09:00", close: "17:00", isOpen: true },
      thursday: { open: "09:00", close: "17:00", isOpen: true },
      friday: { open: "09:00", close: "17:00", isOpen: true },
      saturday: { open: "09:00", close: "17:00", isOpen: true },
      sunday: { open: "10:00", close: "16:00", isOpen: false }
    },
    status: "active",
    capacity: {
      maxAppointmentsPerDay: 60,
      currentLoad: 15
    },
    metadata: {
      visitCount: 1250,
      rating: 4.2
    }
  },
  {
    name: "Akshaya Center Kochi",
    address: {
      street: "MG Road, Near Metro Station",
      city: "Kochi",
      district: "Ernakulam",
      state: "Kerala",
      pincode: "682016"
    },
    location: {
      type: "Point",
      coordinates: [76.2673, 9.9312]
    },
    contact: {
      phone: "+919876543211",
      email: "akshaya.kochi@kerala.gov.in"
    },
    operatingHours: {
      monday: { open: "09:00", close: "18:00", isOpen: true },
      tuesday: { open: "09:00", close: "18:00", isOpen: true },
      wednesday: { open: "09:00", close: "18:00", isOpen: true },
      thursday: { open: "09:00", close: "18:00", isOpen: true },
      friday: { open: "09:00", close: "18:00", isOpen: true },
      saturday: { open: "09:00", close: "17:00", isOpen: true },
      sunday: { open: "10:00", close: "16:00", isOpen: false }
    },
    status: "active",
    capacity: {
      maxAppointmentsPerDay: 80,
      currentLoad: 25
    },
    metadata: {
      visitCount: 2100,
      rating: 4.5
    }
  },
  {
    name: "Akshaya Center Kozhikode",
    address: {
      street: "SM Street, Palayam",
      city: "Kozhikode",
      district: "Kozhikode",
      state: "Kerala",
      pincode: "673001"
    },
    location: {
      type: "Point",
      coordinates: [75.7804, 11.2588]
    },
    contact: {
      phone: "+919876543212",
      email: "akshaya.calicut@kerala.gov.in"
    },
    operatingHours: {
      monday: { open: "09:00", close: "17:30", isOpen: true },
      tuesday: { open: "09:00", close: "17:30", isOpen: true },
      wednesday: { open: "09:00", close: "17:30", isOpen: true },
      thursday: { open: "09:00", close: "17:30", isOpen: true },
      friday: { open: "09:00", close: "17:30", isOpen: true },
      saturday: { open: "09:00", close: "17:00", isOpen: true },
      sunday: { open: "10:00", close: "16:00", isOpen: false }
    },
    status: "active",
    capacity: {
      maxAppointmentsPerDay: 50,
      currentLoad: 12
    },
    metadata: {
      visitCount: 890,
      rating: 4.1
    }
  },
  {
    name: "Akshaya Center Thrissur",
    address: {
      street: "Round South, Swaraj Round",
      city: "Thrissur",
      district: "Thrissur",
      state: "Kerala",
      pincode: "680001"
    },
    location: {
      type: "Point",
      coordinates: [76.2144, 10.5276]
    },
    contact: {
      phone: "+919876543213",
      email: "akshaya.thrissur@kerala.gov.in"
    },
    operatingHours: {
      monday: { open: "09:00", close: "17:00", isOpen: true },
      tuesday: { open: "09:00", close: "17:00", isOpen: true },
      wednesday: { open: "09:00", close: "17:00", isOpen: true },
      thursday: { open: "09:00", close: "17:00", isOpen: true },
      friday: { open: "09:00", close: "17:00", isOpen: true },
      saturday: { open: "09:00", close: "17:00", isOpen: true },
      sunday: { open: "10:00", close: "16:00", isOpen: false }
    },
    status: "active",
    capacity: {
      maxAppointmentsPerDay: 45,
      currentLoad: 8
    },
    metadata: {
      visitCount: 650,
      rating: 4.0
    }
  },
  {
    name: "Akshaya Center Kollam",
    address: {
      street: "Chinnakada, Main Road",
      city: "Kollam",
      district: "Kollam",
      state: "Kerala",
      pincode: "691001"
    },
    location: {
      type: "Point",
      coordinates: [76.6413, 8.8932]
    },
    contact: {
      phone: "+919876543214",
      email: "akshaya.kollam@kerala.gov.in"
    },
    operatingHours: {
      monday: { open: "09:00", close: "17:00", isOpen: true },
      tuesday: { open: "09:00", close: "17:00", isOpen: true },
      wednesday: { open: "09:00", close: "17:00", isOpen: true },
      thursday: { open: "09:00", close: "17:00", isOpen: true },
      friday: { open: "09:00", close: "17:00", isOpen: true },
      saturday: { open: "09:00", close: "16:00", isOpen: true },
      sunday: { open: "10:00", close: "15:00", isOpen: false }
    },
    status: "active",
    capacity: {
      maxAppointmentsPerDay: 40,
      currentLoad: 10
    },
    metadata: {
      visitCount: 520,
      rating: 3.9
    }
  },
  {
    name: "Akshaya Center Kannur",
    address: {
      street: "Fort Road, Near Collectorate",
      city: "Kannur",
      district: "Kannur",
      state: "Kerala",
      pincode: "670001"
    },
    location: {
      type: "Point",
      coordinates: [75.3704, 11.8745]
    },
    contact: {
      phone: "+919876543215",
      email: "akshaya.kannur@kerala.gov.in"
    },
    operatingHours: {
      monday: { open: "09:00", close: "17:00", isOpen: true },
      tuesday: { open: "09:00", close: "17:00", isOpen: true },
      wednesday: { open: "09:00", close: "17:00", isOpen: true },
      thursday: { open: "09:00", close: "17:00", isOpen: true },
      friday: { open: "09:00", close: "17:00", isOpen: true },
      saturday: { open: "09:00", close: "16:00", isOpen: true },
      sunday: { open: "10:00", close: "15:00", isOpen: false }
    },
    status: "active",
    capacity: {
      maxAppointmentsPerDay: 35,
      currentLoad: 7
    },
    metadata: {
      visitCount: 420,
      rating: 4.3
    }
  },
  {
    name: "Akshaya Center Palakkad",
    address: {
      street: "Head Post Office Road",
      city: "Palakkad",
      district: "Palakkad",
      state: "Kerala",
      pincode: "678001"
    },
    location: {
      type: "Point",
      coordinates: [76.6547, 10.7867]
    },
    contact: {
      phone: "+919876543216",
      email: "akshaya.palakkad@kerala.gov.in"
    },
    operatingHours: {
      monday: { open: "09:00", close: "17:00", isOpen: true },
      tuesday: { open: "09:00", close: "17:00", isOpen: true },
      wednesday: { open: "09:00", close: "17:00", isOpen: true },
      thursday: { open: "09:00", close: "17:00", isOpen: true },
      friday: { open: "09:00", close: "17:00", isOpen: true },
      saturday: { open: "09:00", close: "16:00", isOpen: true },
      sunday: { open: "10:00", close: "15:00", isOpen: false }
    },
    status: "active",
    capacity: {
      maxAppointmentsPerDay: 30,
      currentLoad: 5
    },
    metadata: {
      visitCount: 380,
      rating: 4.0
    }
  },
  {
    name: "Akshaya Center Kottayam",
    address: {
      street: "KK Road, Near KSRTC Bus Stand",
      city: "Kottayam",
      district: "Kottayam",
      state: "Kerala",
      pincode: "686001"
    },
    location: {
      type: "Point",
      coordinates: [76.5222, 9.5916]
    },
    contact: {
      phone: "+919876543217",
      email: "akshaya.kottayam@kerala.gov.in"
    },
    operatingHours: {
      monday: { open: "09:00", close: "17:00", isOpen: true },
      tuesday: { open: "09:00", close: "17:00", isOpen: true },
      wednesday: { open: "09:00", close: "17:00", isOpen: true },
      thursday: { open: "09:00", close: "17:00", isOpen: true },
      friday: { open: "09:00", close: "17:00", isOpen: true },
      saturday: { open: "09:00", close: "16:00", isOpen: true },
      sunday: { open: "10:00", close: "15:00", isOpen: false }
    },
    status: "active",
    capacity: {
      maxAppointmentsPerDay: 40,
      currentLoad: 9
    },
    metadata: {
      visitCount: 610,
      rating: 4.2
    }
  }
];

async function seedCenters() {
  try {
    // Connect to database
    await connectDB();
    
    console.log('Connected to MongoDB');
    
    // Clear existing centers
    await AkshayaCenter.deleteMany({});
    console.log('Cleared existing centers');
    
    // Get some services to assign to centers
    const services = await Service.find().limit(10);
    console.log(`Found ${services.length} services to assign to centers`);
    
    // Add services to each center
    const centersWithServices = sampleCenters.map(center => ({
      ...center,
      services: services.slice(0, Math.floor(Math.random() * services.length) + 3).map(s => s._id)
    }));
    
    // Insert sample centers
    const insertedCenters = await AkshayaCenter.insertMany(centersWithServices);
    
    console.log(`✅ Successfully seeded ${insertedCenters.length} Akshaya centers`);
    
    // Display summary
    console.log('\n📍 Seeded Centers:');
    insertedCenters.forEach((center, index) => {
      console.log(`${index + 1}. ${center.name} - ${center.address.city}, ${center.address.district}`);
    });
    
    console.log('\n🎉 Database seeding completed successfully!');
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
}

// Run the seeding function
seedCenters();