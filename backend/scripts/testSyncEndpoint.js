import axios from 'axios';

async function testSyncEndpoint() {
  try {
    console.log('Testing /api/centers/sync-services endpoint...\n');

    // Test the sync endpoint (this is a public endpoint for testing)
    const response = await axios.post('http://localhost:5000/api/centers/sync-services', {}, {
      timeout: 10000
    });

    if (response.data.success) {
      console.log('✅ Sync endpoint test successful!');
      console.log(`Message: ${response.data.message}`);
      console.log(`Services synced: ${response.data.data.servicesCount}`);
      console.log(`Centers updated: ${response.data.data.centersUpdated}`);
    } else {
      console.log('❌ Sync endpoint returned failure');
      console.log('Response:', response.data);
    }

  } catch (error) {
    if (error.response) {
      console.log('❌ API Error:', error.response.status, error.response.data);
    } else {
      console.log('❌ Network Error:', error.message);
    }
  }
}

testSyncEndpoint();