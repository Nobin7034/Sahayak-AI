import mongoose from 'mongoose';
import Staff from '../models/Staff.js';
import User from '../models/User.js';
import AkshayaCenter from '../models/AkshayaCenter.js';
import Service from '../models/Service.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

async function testStaffServicesAccess() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Find staff user
    const user = await User.findOne({ email: 'akshayacenterkply@gmail.com' });
    if (!user) {
      console.log('❌ Staff user not found');
      return;
    }
    
    console.log('✅ User found:', user.name, user.role);
    
    // Find staff record
    const staff = await Staff.findOne({ userId: user._id }).populate('center');
    if (!staff) {
      console.log('❌ Staff record not found');
      return;
    }
    
    console.log('✅ Staff record found:');
    console.log('- Center:', staff.center?.name);
    console.log('- Center ID:', staff.center?._id);
    console.log('- Role:', staff.role);
    console.log('- Active:', staff.isActive);
    
    // Check permissions
    console.log('\n📋 Permissions:');
    const manageServicesPermission = staff.permissions.find(p => p.action === 'manage_services');
    console.log('- manage_services:', manageServicesPermission?.granted || 'NOT FOUND');
    
    // Check center services
    const center = await AkshayaCenter.findById(staff.center._id).populate('services');
    console.log('\n🏢 Center Services:');
    console.log('- Total services assigned:', center.services?.length || 0);
    
    if (center.services && center.services.length > 0) {
      console.log('- Services:');
      center.services.forEach(service => {
        console.log(`  - ${service.name} (${service.category})`);
      });
    } else {
      console.log('- No services assigned to this center');
      
      // Get all available services
      const allServices = await Service.find({ isActive: true });
      console.log(`\n📊 Available services in system: ${allServices.length}`);
      
      if (allServices.length > 0) {
        console.log('\n🔧 Assigning all services to center...');
        center.services = allServices.map(s => s._id);
        await center.save();
        console.log('✅ All services assigned to center successfully');
        
        // Verify assignment
        const updatedCenter = await AkshayaCenter.findById(staff.center._id).populate('services');
        console.log(`✅ Center now has ${updatedCenter.services.length} services assigned`);
      }
    }
    
    // Test API endpoint simulation
    console.log('\n🧪 Testing service access simulation...');
    
    // Simulate the staff auth middleware checks
    const hasPermission = staff.permissions.find(p => p.action === 'manage_services' && p.granted);
    const hasCenter = staff.center && staff.isActive;
    
    console.log('- Has manage_services permission:', !!hasPermission);
    console.log('- Has active center:', !!hasCenter);
    console.log('- Center has services:', center.services?.length > 0);
    
    if (hasPermission && hasCenter) {
      console.log('✅ Staff should be able to access service endpoints');
    } else {
      console.log('❌ Staff access would be denied');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

testStaffServicesAccess();