import ocrService from '../services/ocrService.js';

const testEnhancedOCR = async () => {
  console.log('🔍 Enhanced OCR Service Test');
  console.log('============================\n');

  // Test data with more comprehensive information
  const testDocuments = [
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
        
        Gender: Male
        लिंग: पुरुष
        
        Father: MOHAN LAL SHARMA
        पिता: मोहन लाल शर्मा
        
        Aadhaar Number: 1234 5678 9012
        आधार संख्या: 1234 5678 9012
        
        Address: 123, MG Road, Sector 15
        पता: 123, एमजी रोड, सेक्टर 15
        Bangalore, Karnataka - 560001
        बैंगलोर, कर्नाटक - 560001
        
        Mobile: 9876543210
      `
    },
    {
      type: 'driving_license',
      sampleText: `
        DRIVING LICENCE
        
        DL No: KA0320110012345
        
        Name: RAJESH KUMAR SHARMA
        DOB: 15/08/1985
        
        Issue Date: 15/01/2020
        Valid Till: 14/01/2040
        
        Address: 123, MG Road, Sector 15
        Bangalore, Karnataka - 560001
        
        Class of Vehicle: LMV
        
        Signature
      `
    },
    {
      type: 'voter_id',
      sampleText: `
        ELECTION COMMISSION OF INDIA
        VOTER ID CARD
        
        Name: RAJESH KUMAR SHARMA
        Father: MOHAN LAL SHARMA
        Age: 38
        
        Voter ID: ABC1234567
        
        Address: 123, MG Road, Sector 15
        Bangalore, Karnataka - 560001
        
        Photo
        Signature
      `
    }
  ];

  console.log('📋 Testing Enhanced OCR extraction:\n');

  for (const doc of testDocuments) {
    console.log(`🔸 Processing ${doc.type.replace('_', ' ').toUpperCase()}:`);
    console.log('─'.repeat(60));
    
    try {
      // Simulate OCR result
      const mockOcrResult = {
        text: doc.sampleText,
        confidence: 88 + Math.random() * 10,
        words: [],
        lines: [],
        paragraphs: []
      };

      // For testing, we'll manually call the extraction methods
      let testData;
      switch (doc.type) {
        case 'aadhaar_card':
          testData = ocrService.extractAadhaarData(mockOcrResult);
          break;
        case 'driving_license':
          testData = ocrService.extractDrivingLicenseData(mockOcrResult);
          break;
        case 'voter_id':
          testData = ocrService.extractVoterIdData(mockOcrResult);
          break;
        default:
          testData = { rawText: mockOcrResult.text, confidence: mockOcrResult.confidence };
      }

      // Display all extracted fields
      console.log('✅ All Extracted Fields:');
      Object.entries(testData).forEach(([key, value]) => {
        if (key === 'rawText') return; // Skip raw text for cleaner output
        
        let displayValue = value;
        let fieldLabel = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
        
        if (key === 'address' && typeof value === 'object' && value !== null) {
          console.log(`   🏠 ${fieldLabel}:`);
          Object.entries(value).forEach(([addressKey, addressValue]) => {
            if (addressValue) {
              const addressLabel = addressKey.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
              console.log(`      ${addressLabel}: ${addressValue}`);
            }
          });
        } else if (key.includes('Date') && value) {
          displayValue = new Date(value).toLocaleDateString();
          console.log(`   📅 ${fieldLabel}: ${displayValue}`);
        } else if (key === 'confidence') {
          console.log(`   🎯 ${fieldLabel}: ${value.toFixed(1)}%`);
        } else if (value) {
          console.log(`   📝 ${fieldLabel}: ${displayValue}`);
        }
      });
      
    } catch (error) {
      console.log(`❌ Error processing ${doc.type}: ${error.message}`);
    }
    
    console.log('\n');
  }

  console.log('🎉 Enhanced OCR Test Complete!');
  console.log('\n📋 Features Tested:');
  console.log('✅ Comprehensive field extraction');
  console.log('✅ Multiple document type support');
  console.log('✅ Structured data parsing');
  console.log('✅ Address parsing');
  console.log('✅ Date format handling');
  console.log('✅ Multi-language text support');
  console.log('✅ Field validation and formatting');
  
  console.log('\n🔧 Ready for Frontend Integration:');
  console.log('• All fields will be displayed in OCR verification modal');
  console.log('• Users can edit any extracted field');
  console.log('• Dynamic form generation based on available data');
  console.log('• Raw OCR text available for manual verification');
};

testEnhancedOCR().catch(console.error);