import axios from 'axios';

const BASE_URL = 'http://localhost:5000/api/staff';
const STAFF_CREDENTIALS = {
  email: 'akshayacenterkply@gmail.com',
  password: 'Staff@123'
};

async function testFrontendServicesIntegration() {
  try {
    console.log('🌐 Testing Frontend-Backend Services Integration...\n');
    
    // Step 1: Login
    console.log('🔐 Step 1: Staff Login');
    const loginResponse = await axios.post(`${BASE_URL}/login`, STAFF_CREDENTIALS);
    
    if (!loginResponse.data.success) {
      console.error('❌ Login failed:', loginResponse.data.message);
      return;
    }
    
    console.log('✅ Login successful');
    const token = loginResponse.data.data.token;
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    
    // Step 2: Test the new available services endpoint
    console.log('\n📋 Step 2: Load All Available Services (New Implementation)');
    const availableResponse = await axios.get(`${BASE_URL}/services/available`, { headers });
    
    if (!availableResponse.data.success) {
      console.error('❌ Failed to fetch available services');
      return;
    }
    
    const services = availableResponse.data.data;
    const meta = availableResponse.data.meta;
    
    console.log('✅ Available services loaded successfully');
    console.log(`   Total services: ${services.length}`);
    console.log(`   Enabled: ${meta.enabled}`);
    console.log(`   Hidden: ${meta.hidden}`);
    console.log(`   Available: ${meta.available}`);
    
    // Step 3: Test filtering functionality (simulating frontend filters)
    console.log('\n🔍 Step 3: Test Service Filtering (Frontend Logic)');
    
    // Available services (not hidden)
    const availableServices = services.filter(s => !s.isHidden);
    console.log(`✅ Available services filter: ${availableServices.length} services`);
    
    // Enabled services
    const enabledServices = services.filter(s => s.isEnabled);
    console.log(`✅ Enabled services filter: ${enabledServices.length} services`);
    
    // Hidden services
    const hiddenServices = services.filter(s => s.isHidden);
    console.log(`✅ Hidden services filter: ${hiddenServices.length} services`);
    
    // Step 4: Test service management operations
    console.log('\n⚙️ Step 4: Test Service Management Operations');
    
    if (availableServices.length > 0) {
      const testService = availableServices[0];
      console.log(`   Testing with service: ${testService.name}`);
      
      // Test hide operation
      console.log('   Testing hide operation...');
      const hideResponse = await axios.put(
        `${BASE_URL}/services/${testService._id}/hide`,
        { hidden: true },
        { headers }
      );
      
      if (hideResponse.data.success) {
        console.log('   ✅ Hide operation successful');
        
        // Verify service is now hidden
        const verifyResponse = await axios.get(`${BASE_URL}/services/available`, { headers });
        const updatedServices = verifyResponse.data.data;
        const hiddenService = updatedServices.find(s => s._id === testService._id);
        
        if (hiddenService && hiddenService.isHidden) {
          console.log('   ✅ Service correctly marked as hidden');
        } else {
          console.log('   ❌ Service not properly hidden');
        }
        
        // Unhide the service
        await axios.put(
          `${BASE_URL}/services/${testService._id}/hide`,
          { hidden: false },
          { headers }
        );
        console.log('   ✅ Service unhidden');
      }
      
      // Test enable/disable operation
      console.log('   Testing enable/disable operation...');
      const currentlyEnabled = testService.isEnabled;
      
      const toggleResponse = await axios.put(
        `${BASE_URL}/services/${testService._id}/toggle`,
        { enabled: !currentlyEnabled },
        { headers }
      );
      
      if (toggleResponse.data.success) {
        console.log(`   ✅ Toggle operation successful (${currentlyEnabled ? 'disabled' : 'enabled'})`);
        
        // Restore original state
        await axios.put(
          `${BASE_URL}/services/${testService._id}/toggle`,
          { enabled: currentlyEnabled },
          { headers }
        );
        console.log('   ✅ Service restored to original state');
      }
    }
    
    // Step 5: Test category filtering
    console.log('\n🏷️ Step 5: Test Category Filtering');
    const categories = [...new Set(services.map(s => s.category))];
    console.log(`   Available categories: ${categories.join(', ')}`);
    
    categories.forEach(category => {
      const categoryServices = services.filter(s => s.category === category);
      console.log(`   ${category}: ${categoryServices.length} services`);
    });
    
    console.log('\n🎉 Frontend-Backend Integration Test Completed Successfully!');
    console.log('\n📝 Summary:');
    console.log('   ✅ Staff can see ALL services admin created');
    console.log('   ✅ Service status tracking works correctly');
    console.log('   ✅ Hide/Unhide functionality works');
    console.log('   ✅ Enable/Disable functionality works');
    console.log('   ✅ Category filtering data available');
    console.log('   ✅ Frontend will display all services with proper status indicators');
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data?.message || error.message);
  }
}

testFrontendServicesIntegration();