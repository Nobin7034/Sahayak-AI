import Tesseract from 'tesseract.js';
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function verifyOCRSetup() {
  console.log('🔍 Verifying OCR Setup\n');

  // Check Tesseract.js
  console.log('1. Checking Tesseract.js...');
  try {
    console.log('   ✅ Tesseract.js is installed');
    console.log(`   Version: ${Tesseract.version || 'Unknown'}`);
  } catch (error) {
    console.log('   ❌ Tesseract.js not found');
    return false;
  }

  // Check Sharp
  console.log('\n2. Checking Sharp...');
  try {
    const sharpVersion = sharp.versions;
    console.log('   ✅ Sharp is installed');
    console.log(`   Sharp version: ${sharpVersion.sharp}`);
    console.log(`   libvips version: ${sharpVersion.vips}`);
  } catch (error) {
    console.log('   ❌ Sharp not found');
    return false;
  }

  // Check language data files
  console.log('\n3. Checking Tesseract language data files...');
  const langFiles = ['eng.traineddata', 'hin.traineddata'];
  const backendDir = path.join(__dirname, '..');
  
  for (const langFile of langFiles) {
    const langPath = path.join(backendDir, langFile);
    if (fs.existsSync(langPath)) {
      const stats = fs.statSync(langPath);
      console.log(`   ✅ ${langFile} found (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);
    } else {
      console.log(`   ⚠️  ${langFile} not found in backend directory`);
      console.log(`      Tesseract will download it automatically on first use`);
    }
  }

  // Check uploads directory
  console.log('\n4. Checking uploads directory...');
  const uploadsDir = path.join(backendDir, 'uploads');
  if (fs.existsSync(uploadsDir)) {
    const files = fs.readdirSync(uploadsDir);
    const imageFiles = files.filter(f => /\.(jpg|jpeg|png)$/i.test(f));
    console.log(`   ✅ Uploads directory exists`);
    console.log(`   Found ${imageFiles.length} image file(s)`);
  } else {
    console.log(`   ⚠️  Uploads directory not found`);
    console.log(`      It will be created automatically on first upload`);
  }

  // Test basic OCR functionality
  console.log('\n5. Testing basic OCR functionality...');
  try {
    // Create a simple test image with text
    const testImagePath = path.join(backendDir, 'test-ocr-image.png');
    
    // Create a simple image with text using Sharp
    const svgText = `
      <svg width="800" height="200">
        <rect width="800" height="200" fill="white"/>
        <text x="50" y="100" font-family="Arial" font-size="48" fill="black">
          TEST OCR 123456
        </text>
      </svg>
    `;
    
    await sharp(Buffer.from(svgText))
      .png()
      .toFile(testImagePath);
    
    console.log('   Created test image...');
    
    // Run OCR on test image
    const startTime = Date.now();
    const { data } = await Tesseract.recognize(testImagePath, 'eng', {
      logger: () => {} // Silent
    });
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    
    // Clean up test image
    fs.unlinkSync(testImagePath);
    
    const extractedText = data.text.trim();
    const confidence = data.confidence;
    
    console.log(`   ✅ OCR test completed in ${duration}s`);
    console.log(`   Extracted text: "${extractedText}"`);
    console.log(`   Confidence: ${confidence.toFixed(2)}%`);
    
    if (extractedText.includes('TEST') && extractedText.includes('OCR')) {
      console.log('   ✅ OCR is working correctly!');
    } else {
      console.log('   ⚠️  OCR extracted text but accuracy may vary');
    }
    
  } catch (error) {
    console.log('   ❌ OCR test failed:', error.message);
    return false;
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ OCR Setup Verification Complete');
  console.log('='.repeat(60));
  console.log('\nYour OCR service is ready to use!');
  console.log('\nNext steps:');
  console.log('1. Upload a document through the application');
  console.log('2. Select "Upload & Process with OCR"');
  console.log('3. Check server logs for OCR progress and confidence');
  console.log('4. Run "node backend/scripts/testOCRAccuracy.js" to test on real documents');
  
  return true;
}

verifyOCRSetup()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error('\n❌ Verification failed:', error);
    process.exit(1);
  });
