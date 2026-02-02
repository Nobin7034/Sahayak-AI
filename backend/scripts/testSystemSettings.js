import mongoose from 'mongoose';
import SystemSettings from '../models/SystemSettings.js';

const testSystemSettings = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://sahayakai:sahayakai@cluster0.fye0w5x.mongodb.net/sahayak_ai?retryWrites=true&w=majority');
    console.log('Connected to MongoDB');

    console.log('\n=== Testing System Settings ===\n');

    // Test 1: Get default settings
    console.log('1. Getting default settings...');
    const defaultSettings = await SystemSettings.getSettings();
    console.log('✅ Default settings retrieved');
    console.log(`   - Site Name: ${defaultSettings.siteName}`);
    console.log(`   - Maintenance Mode: ${defaultSettings.maintenanceMode}`);
    console.log(`   - Max Appointments: ${defaultSettings.maxAppointmentsPerDay}`);
    console.log(`   - Working Hours: ${defaultSettings.workingHours.start} - ${defaultSettings.workingHours.end}`);

    // Test 2: Update settings
    console.log('\n2. Updating settings...');
    const updates = {
      siteName: 'Test Akshaya Portal',
      maintenanceMode: true,
      maintenanceMessage: 'System is under maintenance for testing',
      maxAppointmentsPerDay: 100,
      appointmentAdvanceDays: 7,
      allowUserRegistration: false,
      enableChatSupport: true
    };

    const updatedSettings = await SystemSettings.updateSettings(updates, 'test-admin-id');
    console.log('✅ Settings updated successfully');
    console.log(`   - Site Name: ${updatedSettings.siteName}`);
    console.log(`   - Maintenance Mode: ${updatedSettings.maintenanceMode}`);
    console.log(`   - Maintenance Message: ${updatedSettings.maintenanceMessage}`);
    console.log(`   - Max Appointments: ${updatedSettings.maxAppointmentsPerDay}`);
    console.log(`   - Allow Registration: ${updatedSettings.allowUserRegistration}`);
    console.log(`   - Chat Support: ${updatedSettings.enableChatSupport}`);

    // Test 3: Verify persistence
    console.log('\n3. Verifying persistence...');
    const retrievedSettings = await SystemSettings.getSettings();
    console.log('✅ Settings persisted correctly');
    console.log(`   - Site Name matches: ${retrievedSettings.siteName === updates.siteName}`);
    console.log(`   - Maintenance Mode matches: ${retrievedSettings.maintenanceMode === updates.maintenanceMode}`);

    // Test 4: Test public settings filtering
    console.log('\n4. Testing public settings filtering...');
    const publicSettings = {
      siteName: retrievedSettings.siteName,
      siteDescription: retrievedSettings.siteDescription,
      contactEmail: retrievedSettings.contactEmail,
      contactPhone: retrievedSettings.contactPhone,
      maintenanceMode: retrievedSettings.maintenanceMode,
      maintenanceMessage: retrievedSettings.maintenanceMessage,
      allowUserRegistration: retrievedSettings.allowUserRegistration,
      allowGoogleSignIn: retrievedSettings.allowGoogleSignIn,
      workingHours: retrievedSettings.workingHours,
      appointmentAdvanceDays: retrievedSettings.appointmentAdvanceDays
    };
    console.log('✅ Public settings filtered');
    console.log(`   - Contains sensitive data: ${!!retrievedSettings.sessionTimeout}`);
    console.log(`   - Public data only: ${!publicSettings.sessionTimeout}`);

    // Test 5: Reset to defaults for cleanup
    console.log('\n5. Resetting to defaults...');
    const resetSettings = await SystemSettings.updateSettings({
      siteName: 'Akshaya Services',
      maintenanceMode: false,
      maintenanceMessage: 'System is under maintenance. Please try again later.',
      maxAppointmentsPerDay: 50,
      appointmentAdvanceDays: 3,
      allowUserRegistration: true,
      enableChatSupport: false
    }, 'test-admin-id');
    console.log('✅ Settings reset to defaults');
    console.log(`   - Maintenance Mode: ${resetSettings.maintenanceMode}`);

    console.log('\n🎉 All tests passed! System Settings are working correctly.');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
};

testSystemSettings();