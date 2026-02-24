import ocrService from '../services/ocrService.js';
import path from 'path';
import fs from 'fs';

const demoOCR = async () => {
  console.log('🔍 Document OCR Service Demo');
  console.log('============================\n');

  // Demo data for different document types
  const demoDocuments = [
    {
      type: 'aadhaar_card',
      sampleText: `
        Government of India
        आधार
        AADHAAR
        
        Name: RAJESH KUMAR SHARMA
        नाम: राजेश कुमार शर्मा
        
        DOB: 15/08/1985
        जन्म तिथि: 15/08/1985
        
        Aadhaar Number: 1234 5678 9012
        आधार संख्या: 1234 5678 9012
        
        Address: 123, MG Road, Sector 15
        पता: 123, एमजी रोड, सेक्टर 15
        Bangalore, Karnataka - 560001
        बैंगलोर, कर्नाटक - 560001
      `
    },
    {
      type: 'pan_card',
      sampleText: `
        INCOME TAX DEPARTMENT
        GOVT. OF INDIA
        
        Permanent Account Number Card
        
        Name: RAJESH KUMAR SHARMA
        Father's Name: MOHAN LAL SHARMA
        Date of Birth: 15/08/1985
        
        PAN: ABCDE1234F
        
        Signature
      `
    },
    {
      type: 'income_certificate',
      sampleText: `
        GOVERNMENT OF KARNATAKA
        INCOME CERTIFICATE
        
        Certificate No: IC/2024/001234
        
        This is to certify that Mr. RAJESH KUMAR SHARMA
        Son of MOHAN LAL SHARMA
        Resident of 123, MG Road, Sector 15, Bangalore
        
        Annual Income: Rs. 5,00,000/-
        (Rupees Five Lakh Only)
        
        Issued on: 15/01/2024
        Valid till: 14/01/2025
        
        District Collector
        Bangalore Urban District
      `
    }
  ];

  console.log('📋 Testing OCR extraction for different document types:\n');

  for (const doc of demoDocuments) {
    console.log(`🔸 Processing ${doc.type.replace('_', ' ').toUpperCase()}:`);
    console.log('─'.repeat(50));
    
    try {
      // Simulate OCR result
      const mockOcrResult = {
        text: doc.sampleText,
        confidence: 85 + Math.random() * 10, // Random confidence between 85-95%
        words: [],
        lines: [],
        paragraphs: []
      };

      // Process the document
      let extractedData;
      switch (doc.type) {
        case 'aadhaar_card':
          extractedData = ocrService.extractAadhaarData(mockOcrResult);
          break;
        case 'pan_card':
          extractedData = ocrService.extractPANData(mockOcrResult);
          break;
        case 'income_certificate':
          extractedData = ocrService.extractIncomeCertificateData(mockOcrResult);
          break;
        default:
          extractedData = { rawText: mockOcrResult.text, confidence: mockOcrResult.confidence };
      }

      // Display extracted information
      console.log('✅ Extracted Information:');
      
      if (extractedData.fullName) {
        console.log(`   📝 Name: ${extractedData.fullName}`);
      }
      
      if (extractedData.aadhaarNumber) {
        console.log(`   🆔 Aadhaar: ${extractedData.aadhaarNumber}`);
      }
      
      if (extractedData.panNumber) {
        console.log(`   💳 PAN: ${extractedData.panNumber}`);
      }
      
      if (extractedData.dateOfBirth) {
        console.log(`   🎂 DOB: ${extractedData.dateOfBirth.toLocaleDateString()}`);
      }
      
      if (extractedData.address) {
        console.log(`   🏠 Address: ${JSON.stringify(extractedData.address, null, 6)}`);
      }
      
      if (extractedData.annualIncome) {
        console.log(`   💰 Income: Rs. ${extractedData.annualIncome}`);
      }
      
      if (extractedData.certificateNumber) {
        console.log(`   📄 Certificate No: ${extractedData.certificateNumber}`);
      }
      
      if (extractedData.issueDate) {
        console.log(`   📅 Issue Date: ${extractedData.issueDate.toLocaleDateString()}`);
      }
      
      if (extractedData.expiryDate) {
        console.log(`   ⏰ Expiry Date: ${extractedData.expiryDate.toLocaleDateString()}`);
      }
      
      console.log(`   🎯 Confidence: ${extractedData.confidence.toFixed(1)}%`);
      
    } catch (error) {
      console.log(`❌ Error processing ${doc.type}: ${error.message}`);
    }
    
    console.log('\n');
  }

  // Demo utility functions
  console.log('🛠️  Testing Utility Functions:');
  console.log('─'.repeat(50));

  // Test date parsing
  const testDates = ['15/08/1985', '15-08-1985', '15.08.1985', '1985/08/15'];
  console.log('📅 Date Parsing Tests:');
  testDates.forEach(dateStr => {
    const parsed = ocrService.parseDate(dateStr);
    console.log(`   "${dateStr}" → ${parsed ? parsed.toLocaleDateString() : 'Failed'}`);
  });

  // Test address parsing
  console.log('\n🏠 Address Parsing Test:');
  const testAddress = '123, MG Road, Sector 15\nBangalore, Karnataka - 560001\nIndia';
  const parsedAddress = ocrService.parseAddress(testAddress);
  console.log('   Input:', testAddress.replace(/\n/g, ' | '));
  console.log('   Parsed:', JSON.stringify(parsedAddress, null, 6));

  // Test state extraction
  console.log('\n🗺️  State Extraction Test:');
  const testTexts = [
    'Bangalore, Karnataka',
    'Mumbai, Maharashtra', 
    'Chennai, Tamil Nadu',
    'Kochi, Kerala'
  ];
  testTexts.forEach(text => {
    const state = ocrService.extractState(text);
    console.log(`   "${text}" → State: ${state || 'Not found'}`);
  });

  console.log('\n🎉 OCR Service Demo Complete!');
  console.log('\nKey Features Demonstrated:');
  console.log('• Document-specific data extraction');
  console.log('• Multi-language text processing');
  console.log('• Structured data parsing');
  console.log('• Address and location extraction');
  console.log('• Date format normalization');
  console.log('• Confidence scoring');
  
  console.log('\n📝 Next Steps:');
  console.log('• Upload actual document images to test real OCR');
  console.log('• Configure Tesseract.js for production use');
  console.log('• Implement image preprocessing pipeline');
  console.log('• Add validation rules for extracted data');
};

// Run the demo
demoOCR().catch(console.error);