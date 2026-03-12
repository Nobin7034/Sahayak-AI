import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const API_URL = 'http://localhost:5000/api';

// Test configuration
const TEST_CONFIG = {
  email: 'test@example.com', // Change to your test user email
  password: 'password123',   // Change to your test user password
  lockerPin: '1234',         // Change to your locker PIN
  testImagePath: path.join(__dirname, '../test-documents/sample_aadhaar.jpg') // Create this file
};

async function testOCRUpload() {
  console.log('=== OCR Upload Test ===\n');

  try {
    // Step 1: Login
    console.log('1. Logging in...');
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      email: TEST_CONFIG.email,
      password: TEST_CONFIG.password
    });

    const token = loginResponse.data.token;
    console.log('✅ Login successful');
    console.log(`   Token: ${token.substring(0, 20)}...`);

    // Step 2: Check if locker exists
    console.log('\n2. Checking document locker...');
    const lockerCheckResponse = await axios.get(`${API_URL}/document-locker/exists`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log(`   Locker exists: ${lockerCheckResponse.data.exists}`);

    // Step 3: Create locker if it doesn't exist
    if (!lockerCheckResponse.data.exists) {
      console.log('\n3. Creating document locker...');
      await axios.post(`${API_URL}/document-locker/create`, {
        pin: TEST_CONFIG.lockerPin,
        confirmPin: TEST_CONFIG.lockerPin
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('✅ Locker created');
    } else {
      console.log('\n3. Locker already exists, skipping creation');
    }

    // Step 4: Check if test image exists
    console.log('\n4. Checking test image...');
    if (!fs.existsSync(TEST_CONFIG.testImagePath)) {
      console.log('❌ Test image not found at:', TEST_CONFIG.testImagePath);
      console.log('   Please create a test-documents folder and add a sample_aadhaar.jpg file');
      console.log('   Or update TEST_CONFIG.testImagePath to point to an existing image');
      return;
    }
    console.log('✅ Test image found');

    // Step 5: Upload document with OCR
    console.log('\n5. Uploading document with OCR...');
    const formData = new FormData();
    formData.append('document', fs.createReadStream(TEST_CONFIG.testImagePath));
    formData.append('pin', TEST_CONFIG.lockerPin);
    formData.append('documentType', 'aadhaar_card');
    formData.append('name', 'Test Aadhaar Card');
    formData.append('performOCR', 'true');

    const uploadResponse = await axios.post(
      `${API_URL}/document-locker/upload`,
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          Authorization: `Bearer ${token}`
        }
      }
    );

    console.log('✅ Upload successful');
    console.log('\n📄 Document Details:');
    console.log(`   ID: ${uploadResponse.data.data.documentId}`);
    console.log(`   Name: ${uploadResponse.data.data.name}`);
    console.log(`   Type: ${uploadResponse.data.data.documentType}`);

    console.log('\n📊 Extracted Data:');
    const extractedData = uploadResponse.data.data.extractedData;
    if (extractedData) {
      console.log(`   Raw Text Length: ${extractedData.rawText?.length || 0} characters`);
      console.log(`   Confidence: ${extractedData.confidence?.toFixed(2) || 'N/A'}%`);
      
      if (extractedData.aadhaarNumber) {
        console.log(`   Aadhaar Number: ${extractedData.aadhaarNumber}`);
      }
      if (extractedData.fullName) {
        console.log(`   Full Name: ${extractedData.fullName}`);
      }
      if (extractedData.dateOfBirth) {
        console.log(`   Date of Birth: ${extractedData.dateOfBirth}`);
      }
      if (extractedData.gender) {
        console.log(`   Gender: ${extractedData.gender}`);
      }
      if (extractedData.address) {
        console.log(`   Address: ${JSON.stringify(extractedData.address, null, 2)}`);
      }
      if (extractedData.ocrError) {
        console.log(`   ⚠️  OCR Error: ${extractedData.ocrError}`);
      }
    } else {
      console.log('   No extracted data available');
    }

    // Step 6: Test upload without OCR
    console.log('\n6. Uploading document without OCR...');
    const formData2 = new FormData();
    formData2.append('document', fs.createReadStream(TEST_CONFIG.testImagePath));
    formData2.append('pin', TEST_CONFIG.lockerPin);
    formData2.append('documentType', 'pan_card');
    formData2.append('name', 'Test PAN Card (No OCR)');
    formData2.append('performOCR', 'false');

    const uploadResponse2 = await axios.post(
      `${API_URL}/document-locker/upload`,
      formData2,
      {
        headers: {
          ...formData2.getHeaders(),
          Authorization: `Bearer ${token}`
        }
      }
    );

    console.log('✅ Upload without OCR successful');
    console.log(`   ID: ${uploadResponse2.data.data.documentId}`);
    console.log(`   Raw Text: ${uploadResponse2.data.data.extractedData?.rawText || 'N/A'}`);

    // Step 7: Get all documents
    console.log('\n7. Fetching all documents...');
    const documentsResponse = await axios.post(
      `${API_URL}/document-locker/documents`,
      { pin: TEST_CONFIG.lockerPin },
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );

    console.log(`✅ Found ${documentsResponse.data.data.length} documents in locker`);
    documentsResponse.data.data.forEach((doc, index) => {
      console.log(`   ${index + 1}. ${doc.name} (${doc.documentType})`);
    });

    console.log('\n=== Test Completed Successfully ===');
    console.log('\n✅ All tests passed!');
    console.log('\nNext Steps:');
    console.log('1. Test the upload flow in the UI');
    console.log('2. Verify data extraction accuracy');
    console.log('3. Test editing extracted data');
    console.log('4. Test appointment booking with structured data');

  } catch (error) {
    console.error('\n❌ Test Failed:');
    console.error('Error:', error.message);
    
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      console.error('No response received from server');
      console.error('Is the backend running on http://localhost:5000?');
    } else {
      console.error('Error details:', error);
    }
    
    process.exit(1);
  }
}

// Run the test
testOCRUpload();
