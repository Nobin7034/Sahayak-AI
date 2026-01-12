import mongoose from 'mongoose';
import Staff from '../models/Staff.js';
import User from '../models/User.js';
import AkshayaCenter from '../models/AkshayaCenter.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

async function checkStaffPermissions() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Find staff user
    const user = await User.findOne({ email: 'akshayacenterkply@gmail.com' });
    if (!user) {
      console.log('Staff user not found');
      return;
    }
    
    console.log('User found:', user.name, user.role);
    
    // Find staff record
    const staff = await Staff.findOne({ userId: user._id }).populate('center', 'name');
    if (!staff) {
      console.log('Staff record not found');
      return;
    }
    
    console.log('Staff record found:');
    console.log('- Center:', staff.center?.name);
    console.log('- Role:', staff.role);
    console.log('- Active:', staff.isActive);
    console.log('- Permissions:');
    staff.permissions.forEach(p => {
      console.log('  -', p.action, ':', p.granted);
    });
    
    // Check if manage_services permission exists
    const manageServicesPermission = staff.permissions.find(p => p.action === 'manage_services');
    if (!manageServicesPermission) {
      console.log('\n❌ manage_services permission is missing!');
      console.log('Adding manage_services permission...');
      
      staff.permissions.push({
        action: 'manage_services',
        granted: true,
        grantedBy: staff.assignedBy,
        grantedAt: new Date()
      });
      
      await staff.save();
      console.log('✅ manage_services permission added successfully');
    } else if (!manageServicesPermission.granted) {
      console.log('\n❌ manage_services permission is denied!');
      console.log('Enabling manage_services permission...');
      
      manageServicesPermission.granted = true;
      manageServicesPermission.grantedAt = new Date();
      
      await staff.save();
      console.log('✅ manage_services permission enabled successfully');
    } else {
      console.log('\n✅ manage_services permission is already granted');
    }
    
    // Check if upload_documents permission exists
    const uploadDocumentsPermission = staff.permissions.find(p => p.action === 'upload_documents');
    if (!uploadDocumentsPermission) {
      console.log('\n❌ upload_documents permission is missing!');
      console.log('Adding upload_documents permission...');
      
      staff.permissions.push({
        action: 'upload_documents',
        granted: true,
        grantedBy: staff.assignedBy,
        grantedAt: new Date()
      });
      
      await staff.save();
      console.log('✅ upload_documents permission added successfully');
    } else if (!uploadDocumentsPermission.granted) {
      console.log('\n❌ upload_documents permission is denied!');
      console.log('Enabling upload_documents permission...');
      
      uploadDocumentsPermission.granted = true;
      uploadDocumentsPermission.grantedAt = new Date();
      
      await staff.save();
      console.log('✅ upload_documents permission enabled successfully');
    } else {
      console.log('\n✅ upload_documents permission is already granted');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

checkStaffPermissions();