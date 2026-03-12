import ocrService from '../services/ocrService.js';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testOCR() {
  console.log('🔍 OCR Accuracy Test\n');
  console.log('This script will test OCR on sample documents');
  console.log('Expected accuracy: 75%+\n');

  // Check if uploads directory exists
  const uploadsDir = path.join(__dirname, '../uploads');
  
  if (!fs.existsSync(uploadsDir)) {
    console.log('❌ No uploads directory found');
    console.log('📝 Please upload a document first through the application');
    return;
  }

  // Find image files in uploads
  const files = fs.readdirSync(uploadsDir)
    .filter(file => /\.(jpg|jpeg|png)$/i.test(file))
    .slice(0, 5); // Test first 5 images

  if (files.length === 0) {
    console.log('❌ No image files found in uploads directory');
    console.log('📝 Please upload some documents first');
    return;
  }

  console.log(`Found ${files.length} image(s) to test\n`);

  for (const file of files) {
    const filePath = path.join(uploadsDir, file);
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Testing: ${file}`);
    console.log('='.repeat(60));

    try {
      const startTime = Date.now();
      
      // Test basic OCR
      const result = await ocrService.extractText(filePath);
      
      const endTime = Date.now();
      const duration = ((endTime - startTime) / 1000).toFixed(2);

      console.log(`\n✅ OCR Completed in ${duration}s`);
      console.log(`📊 Confidence: ${result.confidence.toFixed(2)}%`);
      
      if (result.confidence >= 75) {
        console.log('✅ PASSED: Confidence >= 75%');
      } else if (result.confidence >= 60) {
        console.log('⚠️  WARNING: Confidence between 60-75%');
      } else {
        console.log('❌ FAILED: Confidence < 60%');
      }

      console.log(`\n📝 Extracted Text (first 500 chars):`);
      console.log('-'.repeat(60));
      console.log(result.text.substring(0, 500));
      console.log('-'.repeat(60));

      console.log(`\n📊 Statistics:`);
      console.log(`   Words detected: ${result.words?.length || 0}`);
      console.log(`   Lines detected: ${result.lines?.length || 0}`);
      console.log(`   Paragraphs detected: ${result.paragraphs?.length || 0}`);

      // Test document-specific extraction
      console.log(`\n🔍 Testing document type detection...`);
      
      const documentTypes = [
        'aadhaar_card',
        'pan_card',
        'voter_id',
        'driving_license'
      ];

      for (const docType of documentTypes) {
        try {
          const extracted = await ocrService.processDocument(filePath, docType);
          const fieldCount = Object.keys(extracted).filter(k => 
            k !== 'rawText' && k !== 'confidence' && extracted[k]
          ).length;
          
          if (fieldCount > 2) {
            console.log(`   ✅ ${docType}: ${fieldCount} fields extracted`);
            console.log(`      Fields: ${Object.keys(extracted).filter(k => 
              k !== 'rawText' && k !== 'confidence' && extracted[k]
            ).join(', ')}`);
          }
        } catch (err) {
          // Silent fail for document type mismatch
        }
      }

    } catch (error) {
      console.log(`\n❌ OCR Failed: ${error.message}`);
      console.error(error.stack);
    }
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log('✨ OCR Testing Complete');
  console.log('='.repeat(60));
}

testOCR()
  .then(() => {
    console.log('\n✅ Test completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  });
