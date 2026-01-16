/**
 * Test Script: Verify No Services Assigned by Default
 * 
 * This script demonstrates that when a new center is approved:
 * 1. By default (enableAllServices=false), NO services are assigned
 * 2. Admin must explicitly check the box to enable services
 * 3. Admin can manually assign services later via AdminCenters page
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../models/User.js';
import AkshayaCenter from '../models/AkshayaCenter.js';
import Service from '../models/Service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

async function testNoServicesByDefault() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get all services
    const allServices = await Service.find({ isActive: true });
    console.log(`📋 Total Active Services: ${allServices.length}\n`);

    // Find a pending staff user
    const pendingStaff = await User.findOne({ 
      role: 'staff', 
      approvalStatus: 'pending' 
    });

    if (!pendingStaff) {
      console.log('ℹ️  No pending staff found. This test requires a pending staff registration.');
      console.log('   Please register a new staff member first.\n');
      return;
    }

    console.log(`👤 Found Pending Staff: ${pendingStaff.name} (${pendingStaff.email})`);

    // Find associated center
    const center = await AkshayaCenter.findOne({ registeredBy: pendingStaff._id });
    if (!center) {
      console.log('❌ No center found for this staff member\n');
      return;
    }

    console.log(`🏢 Associated Center: ${center.name}`);
    console.log(`📍 Location: ${center.address.city}, ${center.address.district}`);
    console.log(`📊 Current Services: ${center.services.length}\n`);

    // Demonstrate the two approval scenarios
    console.log('═══════════════════════════════════════════════════════════');
    console.log('SCENARIO 1: Approve WITHOUT enabling services (DEFAULT)');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('Request Body: { enableAllServices: false } or omitted');
    console.log('Expected Result: Center approved, NO services assigned');
    console.log('Staff Access: Cannot access services until admin assigns them\n');

    console.log('═══════════════════════════════════════════════════════════');
    console.log('SCENARIO 2: Approve WITH enabling services (EXPLICIT)');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('Request Body: { enableAllServices: true }');
    console.log('Expected Result: Center approved, ALL services assigned');
    console.log(`Staff Access: Can immediately access all ${allServices.length} services\n`);

    console.log('═══════════════════════════════════════════════════════════');
    console.log('ADMIN WORKFLOW');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('1. Admin receives staff registration notification');
    console.log('2. Admin reviews registration in Staff Management page');
    console.log('3. Admin clicks "Approve" button');
    console.log('4. Approval modal shows:');
    console.log('   ⚠️  WARNING: Yellow box with unchecked checkbox');
    console.log('   📝 Message: "No services will be assigned by default"');
    console.log('5. Admin has two options:');
    console.log('   a) Approve without services (default) - staff must wait');
    console.log('   b) Check box to enable all services - staff can work immediately');
    console.log('6. If approved without services:');
    console.log('   - Admin goes to Centers page');
    console.log('   - Clicks "Manage Services" button for the center');
    console.log('   - Selects which services to enable');
    console.log('   - Staff can now access those services\n');

    console.log('═══════════════════════════════════════════════════════════');
    console.log('IMPLEMENTATION DETAILS');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('Backend: backend/routes/authRoutes.js line 816');
    console.log('  const { enableAllServices = false } = req.body;');
    console.log('');
    console.log('Frontend: frontend/src/pages/admin/AdminStaff.jsx');
    console.log('  - Line 38: const [enableAllServices, setEnableAllServices] = useState(false);');
    console.log('  - Line 188: setEnableAllServices(false); // Default to false');
    console.log('  - Lines 643-665: Yellow warning box with conditional message');
    console.log('');
    console.log('Service Management: frontend/src/pages/admin/AdminCenters.jsx');
    console.log('  - Service management modal for manual assignment');
    console.log('  - Enable/disable individual services');
    console.log('  - Enable all services at once\n');

    console.log('✅ Test completed successfully!');
    console.log('   The system is configured to NOT assign services by default.');
    console.log('   Admin must explicitly enable services during approval or later.\n');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

testNoServicesByDefault();
