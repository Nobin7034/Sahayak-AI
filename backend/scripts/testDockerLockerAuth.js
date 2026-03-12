import axios from 'axios';

const testAuth = async () => {
  try {
    console.log('🧪 Testing Document Locker Authentication\n');
    
    // You'll need to paste your Firebase token here from the browser console
    // To get it, add this to your browser console: await firebase.auth().currentUser.getIdToken(true)
    const token = 'PASTE_YOUR_TOKEN_HERE';
    
    if (token === 'PASTE_YOUR_TOKEN_HERE') {
      console.log('❌ Please update the token in the script');
      console.log('   Run this in browser console: await firebase.auth().currentUser.getIdToken(true)');
      console.log('   Then paste the token in this script');
      return;
    }
    
    console.log('Testing with token:', token.substring(0, 20) + '...');
    
    const response = await axios.post(
      'http://localhost:5000/api/document-locker/documents/for-service',
      {
        pin: '1234',
        serviceId: '68a04f77efc12390a8673366',
        requiredDocuments: []
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('✅ Success!');
    console.log('Response:', response.data);
    
  } catch (error) {
    console.error('❌ Error:', error.response?.status, error.response?.statusText);
    console.error('Message:', error.response?.data?.message);
    console.error('Full error:', error.response?.data);
  }
};

testAuth();
