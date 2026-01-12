import axios from 'axios';

const BASE_URL = 'http://localhost:5000';

async function testAllAdminEndpoints() {
  try {
    console.log('🧪 Testing All Admin Endpoint URL Fixes...\n');

    const endpoints = [
      // Dashboard
      { method: 'GET', url: '/api/admin/dashboard-stats', name: 'Dashboard Stats' },
      { method: 'POST', url: '/api/admin/broadcast/appointments', name: 'Broadcast' },
      
      // Users
      { method: 'GET', url: '/api/admin/users', name: 'Get Users' },
      { method: 'PATCH', url: '/api/admin/users/test/status', name: 'Update User Status' },
      
      // Services
      { method: 'GET', url: '/api/admin/services', name: 'Get Services' },
      { method: 'POST', url: '/api/admin/services', name: 'Create Service' },
      { method: 'PUT', url: '/api/admin/services/test', name: 'Update Service' },
      { method: 'DELETE', url: '/api/admin/services/test', name: 'Delete Service' },
      
      // Document Templates
      { method: 'GET', url: '/api/admin/document-templates', name: 'Get Templates' },
      { method: 'POST', url: '/api/admin/document-templates', name: 'Create Template' },
      { method: 'POST', url: '/api/admin/document-templates/upload', name: 'Upload Template' },
      
      // News
      { method: 'GET', url: '/api/admin/news', name: 'Get News' },
      { method: 'POST', url: '/api/admin/news', name: 'Create News' },
      { method: 'PUT', url: '/api/admin/news/test', name: 'Update News' },
      { method: 'DELETE', url: '/api/admin/news/test', name: 'Delete News' },
      
      // Appointments
      { method: 'GET', url: '/api/admin/appointments', name: 'Get Appointments' },
      { method: 'PATCH', url: '/api/admin/appointments/test/status', name: 'Update Appointment Status' },
      
      // Holidays
      { method: 'GET', url: '/api/admin/holidays', name: 'Get Holidays' },
      { method: 'POST', url: '/api/admin/holidays', name: 'Create Holiday' },
      { method: 'DELETE', url: '/api/admin/holidays/test', name: 'Delete Holiday' },
      
      // Payments
      { method: 'POST', url: '/api/admin/payments/refund/test', name: 'Refund Payment' }
    ];

    let accessible = 0;
    let notFound = 0;

    for (const endpoint of endpoints) {
      try {
        const config = { 
          method: endpoint.method,
          url: `${BASE_URL}${endpoint.url}`,
          validateStatus: () => true // Don't throw on any status
        };

        const response = await axios(config);
        
        if (response.status === 404) {
          console.log(`❌ ${endpoint.name}: 404 Not Found`);
          notFound++;
        } else if (response.status === 401) {
          console.log(`✅ ${endpoint.name}: Accessible (401 - Auth Required)`);
          accessible++;
        } else {
          console.log(`✅ ${endpoint.name}: Accessible (${response.status})`);
          accessible++;
        }
      } catch (error) {
        console.log(`⚠️  ${endpoint.name}: Error - ${error.message}`);
      }
    }

    console.log(`\n📊 Summary:`);
    console.log(`✅ Accessible endpoints: ${accessible}`);
    console.log(`❌ Not found (404): ${notFound}`);
    console.log(`📝 Total tested: ${endpoints.length}`);

    if (notFound === 0) {
      console.log('\n🎉 All admin endpoint URLs are correctly fixed!');
    } else {
      console.log('\n⚠️  Some endpoints still return 404 - may need additional fixes');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testAllAdminEndpoints();