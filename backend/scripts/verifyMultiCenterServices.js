import mongoose from 'mongoose';
import Service from '../models/Service.js';
import AkshayaCenter from '../models/AkshayaCenter.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

async function verifyMultiCenterServices() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');
    
    // Get all services
    const allServices = await Service.find({ isActive: true }).select('name category');
    console.log(`📊 Total services in system: ${allServices.length}`);
    
    // Get all centers with their services
    const centers = await AkshayaCenter.find({})
      .populate('services', 'name category')
      .select('name services');
    
    console.log(`🏢 Total centers: ${centers.length}\n`);
    
    console.log('📋 Service distribution across centers:');
    centers.forEach(center => {
      console.log(`\n🏢 ${center.name}:`);
      console.log(`   Services assigned: ${center.services?.length || 0}`);
      
      if (center.services && center.services.length > 0) {
        const categories = [...new Set(center.services.map(s => s.category))];
        console.log(`   Categories: ${categories.join(', ')}`);
        
        // Show first few services
        center.services.slice(0, 3).forEach(service => {
          console.log(`   - ${service.name} (${service.category})`);
        });
        
        if (center.services.length > 3) {
          console.log(`   ... and ${center.services.length - 3} more`);
        }
      }
    });
    
    // Check if all centers have the same services (which means services are global)
    const centerServiceCounts = centers.map(c => c.services?.length || 0);
    const allSame = centerServiceCounts.every(count => count === centerServiceCounts[0]);
    
    console.log('\n🔍 Analysis:');
    if (allSame && centerServiceCounts[0] === allServices.length) {
      console.log('✅ All centers have ALL services assigned');
      console.log('✅ Services are globally available across all centers');
      console.log('✅ Staff from any center can see all services admin created');
    } else {
      console.log('⚠️  Services are not uniformly distributed across centers');
      console.log('   This means some centers might have different service offerings');
    }
    
    console.log('\n📈 Summary:');
    console.log(`   Total services: ${allServices.length}`);
    console.log(`   Total centers: ${centers.length}`);
    console.log(`   Services per center: ${centerServiceCounts.join(', ')}`);
    
    await mongoose.disconnect();
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

verifyMultiCenterServices();