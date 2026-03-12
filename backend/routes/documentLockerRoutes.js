import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { authenticate } from '../middleware/auth.js';
import DocumentLocker from '../models/DocumentLocker.js';
import LockerDocument from '../models/LockerDocument.js';
import ocrService from '../services/ocrService.js';

const router = express.Router();

// Configure multer for document uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads', 'document-locker');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, `${req.user.userId}-${uniqueSuffix}-${sanitizedName}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/bmp',
    'image/tiff',
    'application/pdf'
  ];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only JPEG, JPG, PNG, WEBP, GIF, BMP, TIFF, and PDF files are allowed'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Middleware to verify locker PIN
const verifyLockerPin = async (req, res, next) => {
  try {
    const { pin } = req.body;
    
    if (!pin) {
      return res.status(400).json({
        success: false,
        message: 'Locker PIN is required'
      });
    }

    const locker = await DocumentLocker.findOne({ user: req.user.userId });
    
    if (!locker) {
      return res.status(404).json({
        success: false,
        message: 'Document locker not found'
      });
    }

    // Check if locker is locked due to failed attempts
    if (locker.isLocked()) {
      const lockTimeRemaining = Math.ceil((locker.failedAttempts.lockedUntil - new Date()) / (1000 * 60));
      return res.status(423).json({
        success: false,
        message: `Locker is locked due to multiple failed attempts. Try again in ${lockTimeRemaining} minutes.`
      });
    }

    // Verify PIN
    const isValidPin = await locker.verifyPin(pin);
    
    if (!isValidPin) {
      locker.recordFailedAttempt();
      locker.logAccess('failed_attempt', req, false);
      await locker.save();
      
      return res.status(401).json({
        success: false,
        message: 'Invalid PIN',
        attemptsRemaining: locker.securitySettings.maxFailedAttempts - locker.failedAttempts.count
      });
    }

    // Reset failed attempts on successful verification
    locker.resetFailedAttempts();
    locker.logAccess('unlock', req);
    await locker.save();
    
    req.locker = locker;
    next();
  } catch (error) {
    console.error('PIN verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify PIN'
    });
  }
};

// Create document locker
router.post('/create', authenticate, async (req, res) => {
  try {
    const { pin, confirmPin } = req.body;
    
    if (!pin || !confirmPin) {
      return res.status(400).json({
        success: false,
        message: 'PIN and confirmation PIN are required'
      });
    }
    
    if (pin !== confirmPin) {
      return res.status(400).json({
        success: false,
        message: 'PIN and confirmation PIN do not match'
      });
    }
    
    if (pin.length < 4 || pin.length > 6) {
      return res.status(400).json({
        success: false,
        message: 'PIN must be between 4 and 6 digits'
      });
    }
    
    // Check if locker already exists
    const existingLocker = await DocumentLocker.findOne({ user: req.user.userId });
    if (existingLocker) {
      return res.status(409).json({
        success: false,
        message: 'Document locker already exists'
      });
    }
    
    // Create new locker
    const locker = new DocumentLocker({
      user: req.user.userId,
      lockerPin: pin
    });
    
    locker.logAccess('unlock', req);
    await locker.save();
    
    res.status(201).json({
      success: true,
      message: 'Document locker created successfully',
      data: {
        lockerId: locker._id,
        createdAt: locker.createdAt
      }
    });
  } catch (error) {
    console.error('Locker creation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create document locker'
    });
  }
});

// Check if locker exists
router.get('/exists', authenticate, async (req, res) => {
  try {
    const locker = await DocumentLocker.findOne({ user: req.user.userId });
    
    res.json({
      success: true,
      exists: !!locker,
      isLocked: locker ? locker.isLocked() : false
    });
  } catch (error) {
    console.error('Locker check error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check locker status'
    });
  }
});

// Unlock locker (verify PIN)
router.post('/unlock', authenticate, verifyLockerPin, async (req, res) => {
  try {
    res.json({
      success: true,
      message: 'Locker unlocked successfully',
      data: {
        lockerId: req.locker._id,
        documentCount: req.locker.documents.length,
        lastAccessed: req.locker.lastAccessed
      }
    });
  } catch (error) {
    console.error('Locker unlock error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to unlock locker'
    });
  }
});

// Get locker documents
router.post('/documents', authenticate, verifyLockerPin, async (req, res) => {
  try {
    const documents = await LockerDocument.find({
      locker: req.locker._id,
      isActive: true
    }).select('-filePath -encryptionKey').sort({ createdAt: -1 });
    
    req.locker.logAccess('view_document', req);
    await req.locker.save();
    
    res.json({
      success: true,
      data: documents
    });
  } catch (error) {
    console.error('Get documents error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve documents'
    });
  }
});

// Upload document
router.post('/upload', authenticate, upload.single('document'), async (req, res) => {
  try {
    const { pin, documentType, name, tags, performOCR } = req.body;
    
    console.log('=== Document Upload Request ===');
    console.log('Document type:', documentType);
    console.log('Perform OCR:', performOCR);
    console.log('File:', req.file?.originalname);
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No document file uploaded'
      });
    }
    
    // Verify PIN
    const locker = await DocumentLocker.findOne({ user: req.user.userId });
    if (!locker) {
      fs.unlinkSync(req.file.path); // Clean up uploaded file
      return res.status(404).json({
        success: false,
        message: 'Document locker not found'
      });
    }
    
    if (locker.isLocked()) {
      fs.unlinkSync(req.file.path);
      const lockTimeRemaining = Math.ceil((locker.failedAttempts.lockedUntil - new Date()) / (1000 * 60));
      return res.status(423).json({
        success: false,
        message: `Locker is locked. Try again in ${lockTimeRemaining} minutes.`
      });
    }
    
    const isValidPin = await locker.verifyPin(pin);
    if (!isValidPin) {
      fs.unlinkSync(req.file.path);
      locker.recordFailedAttempt();
      await locker.save();
      return res.status(401).json({
        success: false,
        message: 'Invalid PIN'
      });
    }
    
    // Process document with OCR based on user choice
    let extractedData = {
      rawText: '',
      confidence: 0
    };
    
    const shouldPerformOCR = performOCR === 'true' || performOCR === true;
    
    console.log('OCR Decision Logic:');
    console.log('  performOCR param:', performOCR);
    console.log('  performOCR type:', typeof performOCR);
    console.log('  shouldPerformOCR:', shouldPerformOCR);
    console.log('  File mimetype:', req.file.mimetype);
    console.log('  Is image:', req.file.mimetype.startsWith('image/'));
    
    if (shouldPerformOCR && req.file.mimetype.startsWith('image/')) {
      try {
        console.log(`✅ Starting OCR for document type: ${documentType}`);
        const ocrResult = await ocrService.processDocument(req.file.path, documentType);
        extractedData = ocrResult || extractedData;
        console.log('✅ OCR processing completed successfully');
        console.log('   Confidence:', extractedData.confidence?.toFixed(2) + '%');
        console.log('   Extracted fields:', Object.keys(extractedData).filter(k => k !== 'rawText' && k !== 'confidence'));
      } catch (ocrError) {
        console.error('❌ OCR processing failed:', ocrError);
        console.error('OCR Error stack:', ocrError.stack);
        // Continue with default extractedData
        console.log('Continuing without OCR data');
        extractedData.rawText = 'OCR processing failed - please verify data manually';
        extractedData.ocrError = ocrError.message;
      }
    } else {
      if (!shouldPerformOCR) {
        console.log(`ℹ️  User chose to skip OCR`);
        extractedData.rawText = 'OCR skipped by user - raw image attached';
      } else if (!req.file.mimetype.startsWith('image/')) {
        console.log(`ℹ️  Skipping OCR for non-image file: ${req.file.mimetype}`);
        extractedData.rawText = 'PDF document - OCR not performed';
      } else {
        console.log(`⚠️  OCR should have been performed but wasn't - check logic`);
        extractedData.rawText = 'OCR was not performed - please try again';
      }
    }
    
    // Log final OCR result
    if (extractedData.confidence) {
      const confidenceLevel = extractedData.confidence >= 75 ? '✅ High' : 
                             extractedData.confidence >= 60 ? '⚠️  Medium' : 
                             '❌ Low';
      console.log(`OCR Result: ${confidenceLevel} confidence (${extractedData.confidence.toFixed(2)}%)`);
    }
    
    // Auto-fill with existing profile data
    try {
      console.log('Auto-filling data from existing documents...');
      const existingDocuments = await LockerDocument.find({
        locker: locker._id,
        isActive: true
      });
      
      if (existingDocuments.length > 0) {
        // Aggregate common data from existing documents
        const profileData = {};
        
        existingDocuments.forEach(doc => {
          if (doc.extractedData) {
            Object.entries(doc.extractedData).forEach(([key, value]) => {
              if (value && key !== 'rawText' && key !== 'confidence' && key !== 'isVerified' && key !== 'verifiedAt' && key !== 'verifiedBy' && key !== 'ocrError') {
                if (key === 'address' && typeof value === 'object') {
                  if (!profileData.address) profileData.address = {};
                  Object.entries(value).forEach(([addrKey, addrValue]) => {
                    if (addrValue && !profileData.address[addrKey]) {
                      profileData.address[addrKey] = addrValue;
                    }
                  });
                } else if (!profileData[key]) {
                  profileData[key] = value;
                }
              }
            });
          }
        });
        
        // Merge profile data with extracted data (OCR data takes precedence)
        Object.entries(profileData).forEach(([key, value]) => {
          if (!extractedData[key] || extractedData[key] === '') {
            extractedData[key] = value;
          }
        });
        
        console.log('Auto-filled fields:', Object.keys(profileData));
      }
    } catch (autoFillError) {
      console.error('Auto-fill error (non-critical):', autoFillError);
      // Continue without auto-fill
    }
    
    // Ensure extractedData is always an object
    if (!extractedData || typeof extractedData !== 'object') {
      extractedData = {
        rawText: '',
        confidence: 0
      };
    }
    
    // Add empty fields for the document type so users can fill them
    const relevantFields = getRelevantFieldsForDocument(documentType);
    relevantFields.forEach(field => {
      if (field === 'address' && !extractedData.address) {
        extractedData.address = {
          line1: '',
          line2: '',
          city: '',
          state: '',
          pincode: '',
          country: 'India'
        };
      } else if (!extractedData[field]) {
        extractedData[field] = '';
      }
    });
    
    // Create document record
    let document;
    try {
      document = new LockerDocument({
        locker: locker._id,
        name: name || req.file.originalname,
        originalName: req.file.originalname,
        documentType,
        filePath: req.file.path,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        extractedData,
        tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
        encryptionKey: crypto.randomBytes(32).toString('hex')
      });
      
      document.logAudit('created', 'Document uploaded', req.ip);
      await document.save();
      console.log('Document saved successfully:', document._id);
    } catch (docError) {
      console.error('Failed to create document:', docError);
      console.error('Document data:', {
        locker: locker._id,
        name: name || req.file.originalname,
        documentType,
        extractedData
      });
      throw new Error(`Failed to create document: ${docError.message}`);
    }
    
    // Add document to locker
    locker.documents.push(document._id);
    locker.logAccess('upload_document', req, true, document._id);
    await locker.save();
    
    // Validate document consistency if multiple documents exist
    if (locker.documents.length > 1) {
      const allDocuments = await LockerDocument.find({
        locker: locker._id,
        isActive: true
      });
      
      document.validateConsistency(allDocuments);
      await document.save();
    }
    
    res.status(201).json({
      success: true,
      message: 'Document uploaded and processed successfully',
      data: {
        documentId: document._id,
        name: document.name,
        documentType: document.documentType,
        extractedData: document.extractedData,
        validationResults: document.validationResults,
        createdAt: document.createdAt
      }
    });
  } catch (error) {
    console.error('Document upload error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      file: req.file ? req.file.originalname : 'no file',
      documentType: req.body.documentType
    });
    
    // Clean up uploaded file on error
    if (req.file && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
        console.log('Cleaned up uploaded file after error');
      } catch (cleanupError) {
        console.error('Failed to clean up file:', cleanupError);
      }
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to upload document',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Helper function to normalize document names to types
function normalizeDocumentNameToType(documentName) {
  if (!documentName) return null;
  
  const nameToTypeMap = {
    // Exact matches
    'aadhaar card': 'aadhaar_card',
    'aadhar card': 'aadhaar_card',
    'pan card': 'pan_card',
    'voter id': 'voter_id',
    'voter id card': 'voter_id',
    'driving license': 'driving_license',
    'driving licence': 'driving_license',
    'passport': 'passport',
    'ration card': 'ration_card',
    'birth certificate': 'birth_certificate',
    'death certificate': 'death_certificate',
    'income certificate': 'income_certificate',
    'caste certificate': 'caste_certificate',
    'community certificate': 'community_certificate',
    'domicile certificate': 'domicile_certificate',
    'residence certificate': 'residence_certificate',
    'marriage certificate': 'marriage_certificate',
    'sslc certificate': 'sslc_certificate',
    'pension certificate': 'pension_certificate',
    'bank passbook': 'bank_passbook',
    'salary slip': 'salary_slip',
    'property document': 'property_document',
    'educational certificate': 'educational_certificate',
    'medical certificate': 'medical_certificate',
    
    // Common variations
    'photo': 'photo',
    'photograph': 'photo',
    'passport photo': 'photo',
    'passport size photo': 'photo',
    'address proof': 'address_proof',
    'id proof': 'id_proof',
    'age proof': 'age_proof',
    'income proof': 'income_proof'
  };
  
  const normalized = documentName.toLowerCase().trim();
  return nameToTypeMap[normalized] || normalized.replace(/\s+/g, '_');
}

// Get documents for a specific service (MUST come before /documents/:id)
router.post('/documents/for-service', authenticate, verifyLockerPin, async (req, res) => {
  try {
    const { serviceId, requiredDocuments } = req.body;
    
    console.log('=== Documents for Service Request ===');
    console.log('User:', req.user?.userId, req.user?.email);
    console.log('Locker ID:', req.locker?._id);
    console.log('Service ID:', serviceId);
    console.log('Required documents received:', JSON.stringify(requiredDocuments, null, 2));
    
    // Validate input
    if (!requiredDocuments || !Array.isArray(requiredDocuments)) {
      console.log('❌ Invalid requiredDocuments format');
      return res.status(400).json({
        success: false,
        message: 'requiredDocuments must be an array'
      });
    }
    
    // Get all documents from locker
    let allDocuments = [];
    try {
      allDocuments = await LockerDocument.find({
        locker: req.locker._id,
        isActive: true
      });
      console.log(`Found ${allDocuments.length} documents in locker`);
      if (allDocuments.length > 0) {
        console.log('Available document types:', allDocuments.map(d => d.documentType).join(', '));
      }
    } catch (dbError) {
      console.error('Database error fetching documents:', dbError);
      allDocuments = [];
    }
    
    // Map required documents to available documents
    const availableDocuments = [];
    const missingDocuments = [];
    
    if (requiredDocuments.length === 0) {
      console.log('No required documents specified');
    } else {
      requiredDocuments.forEach((reqDoc, index) => {
        try {
          console.log(`Processing required doc ${index}:`, JSON.stringify(reqDoc));
          
          // Get document name from the required document
          const docName = reqDoc.documentName || reqDoc.name;
          console.log(`  Document name: ${docName}`);
          
          if (!docName) {
            console.log(`  ⚠️  No document name found, skipping`);
            missingDocuments.push(reqDoc);
            return;
          }
          
          // Normalize the document name to a type
          const normalizedType = normalizeDocumentNameToType(docName);
          console.log(`  Normalized type: ${normalizedType}`);
          
          // Try to find matching document in locker
          // Match by documentType or by name similarity
          const found = allDocuments.find(doc => {
            const typeMatch = doc.documentType === normalizedType;
            const nameMatch = doc.name && doc.name.toLowerCase().includes(docName.toLowerCase());
            const reverseNameMatch = docName.toLowerCase().includes(doc.documentType?.replace(/_/g, ' '));
            
            return typeMatch || nameMatch || reverseNameMatch;
          });
          
          if (found) {
            console.log(`  ✅ Found in locker: ${found.name} (type: ${found.documentType})`);
            availableDocuments.push(found);
          } else {
            console.log(`  ❌ Not found in locker`);
            missingDocuments.push(reqDoc);
          }
        } catch (docError) {
          console.error(`  Error processing document ${index}:`, docError);
          missingDocuments.push(reqDoc);
        }
      });
    }
    
    console.log(`Available: ${availableDocuments.length}, Missing: ${missingDocuments.length}`);
    
    // Aggregate user profile from available documents
    const userProfile = {};
    try {
      availableDocuments.forEach(doc => {
        if (doc.extractedData) {
          if (doc.extractedData.fullName && !userProfile.fullName) {
            userProfile.fullName = doc.extractedData.fullName;
          }
          if (doc.extractedData.dateOfBirth && !userProfile.dateOfBirth) {
            userProfile.dateOfBirth = doc.extractedData.dateOfBirth;
          }
          if (doc.extractedData.gender && !userProfile.gender) {
            userProfile.gender = doc.extractedData.gender;
          }
          if (doc.extractedData.address && !userProfile.address) {
            userProfile.address = doc.extractedData.address;
          }
        }
      });
    } catch (profileError) {
      console.error('Error aggregating profile:', profileError);
    }
    
    // Log access
    try {
      req.locker.logAccess('view_document', req);
      await req.locker.save();
    } catch (logError) {
      console.error('Error logging access:', logError);
      // Continue anyway
    }
    
    console.log('=== Request successful ===');
    
    res.json({
      success: true,
      availableDocuments,
      missingDocuments,
      userProfile
    });
  } catch (error) {
    console.error('❌ Get documents for service error:', error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch documents for service',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get specific document
router.post('/documents/:id', authenticate, verifyLockerPin, async (req, res) => {
  try {
    const document = await LockerDocument.findOne({
      _id: req.params.id,
      locker: req.locker._id,
      isActive: true
    });
    
    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }
    
    document.recordAccess();
    document.logAudit('viewed', 'Document accessed', req.ip);
    await document.save();
    
    req.locker.logAccess('view_document', req, true, document._id);
    await req.locker.save();
    
    res.json({
      success: true,
      data: document
    });
  } catch (error) {
    console.error('Get document error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve document'
    });
  }
});

// Download document file
router.post('/documents/:id/download', authenticate, verifyLockerPin, async (req, res) => {
  try {
    const document = await LockerDocument.findOne({
      _id: req.params.id,
      locker: req.locker._id,
      isActive: true
    });
    
    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }
    
    if (!fs.existsSync(document.filePath)) {
      return res.status(404).json({
        success: false,
        message: 'Document file not found'
      });
    }
    
    document.recordAccess();
    document.logAudit('downloaded', 'Document downloaded', req.ip);
    await document.save();
    
    req.locker.logAccess('view_document', req, true, document._id);
    await req.locker.save();
    
    res.download(document.filePath, document.originalName);
  } catch (error) {
    console.error('Document download error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to download document'
    });
  }
});

// View document file (for display in browser)
router.post('/documents/:id/view', authenticate, verifyLockerPin, async (req, res) => {
  try {
    const document = await LockerDocument.findOne({
      _id: req.params.id,
      locker: req.locker._id,
      isActive: true
    });
    
    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }
    
    if (!fs.existsSync(document.filePath)) {
      return res.status(404).json({
        success: false,
        message: 'Document file not found'
      });
    }
    
    document.recordAccess();
    document.logAudit('viewed', 'Document file viewed', req.ip);
    await document.save();
    
    req.locker.logAccess('view_document', req, true, document._id);
    await req.locker.save();
    
    // Set appropriate content type
    const ext = path.extname(document.filePath).toLowerCase();
    const contentTypes = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.webp': 'image/webp',
      '.gif': 'image/gif',
      '.pdf': 'application/pdf'
    };
    
    const contentType = contentTypes[ext] || 'application/octet-stream';
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', 'inline');
    
    // Stream the file
    const fileStream = fs.createReadStream(document.filePath);
    fileStream.pipe(res);
  } catch (error) {
    console.error('Document view error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to view document'
    });
  }
});

// Replace document file
router.put('/documents/:id/replace', authenticate, verifyLockerPin, upload.single('document'), async (req, res) => {
  try {
    const { performOCR } = req.body;
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No document file uploaded'
      });
    }

    const document = await LockerDocument.findOne({
      _id: req.params.id,
      locker: req.locker._id,
      isActive: true
    });
    
    if (!document) {
      // Clean up uploaded file
      fs.unlinkSync(req.file.path);
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    // Delete old file
    if (fs.existsSync(document.filePath)) {
      fs.unlinkSync(document.filePath);
    }

    // Update document with new file
    document.filePath = req.file.path;
    document.originalName = req.file.originalname;
    document.fileSize = req.file.size;
    document.mimeType = req.file.mimetype;
    
    // Process OCR if requested
    const shouldPerformOCR = performOCR === 'true' || performOCR === true;
    
    if (shouldPerformOCR && req.file.mimetype.startsWith('image/')) {
      try {
        console.log(`✅ Starting OCR for replaced document: ${document.documentType}`);
        const ocrResult = await ocrService.processDocument(req.file.path, document.documentType);
        
        // Reset verification status since it's a new file
        document.extractedData = {
          ...ocrResult,
          isVerified: false,
          verifiedAt: null,
          verifiedBy: null
        };
        
        console.log('✅ OCR processing completed');
        console.log('   Confidence:', ocrResult.confidence?.toFixed(2) + '%');
      } catch (ocrError) {
        console.error('❌ OCR processing failed:', ocrError);
        document.extractedData = {
          rawText: 'OCR processing failed - please verify data manually',
          ocrError: ocrError.message,
          confidence: 0,
          isVerified: false
        };
      }
    } else if (!shouldPerformOCR) {
      // Keep existing extracted data but mark as unverified
      if (document.extractedData) {
        document.extractedData.isVerified = false;
        document.extractedData.verifiedAt = null;
        document.extractedData.verifiedBy = null;
      }
    }

    document.logAudit('replaced', 'Document file replaced', req.ip);
    await document.save();

    req.locker.logAccess('replace_document', req, true, document._id);
    await req.locker.save();

    res.json({
      success: true,
      message: 'Document replaced successfully',
      data: document
    });
  } catch (error) {
    console.error('Document replace error:', error);
    // Clean up uploaded file on error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({
      success: false,
      message: 'Failed to replace document'
    });
  }
});

// Delete document
router.delete('/documents/:id', authenticate, verifyLockerPin, async (req, res) => {
  try {
    console.log('Attempting to delete document:', req.params.id);
    
    const document = await LockerDocument.findOne({
      _id: req.params.id,
      locker: req.locker._id,
      isActive: true
    });
    
    if (!document) {
      console.log('Document not found:', req.params.id);
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }
    
    console.log('Found document to delete:', {
      id: document._id,
      name: document.name,
      type: document.documentType
    });
    
    // Soft delete
    document.isActive = false;
    
    try {
      document.logAudit('deleted', 'Document deleted', req.ip);
    } catch (auditError) {
      console.error('Audit log error (non-critical):', auditError);
      // Continue with deletion even if audit fails
    }
    
    await document.save();
    console.log('Document marked as inactive');
    
    // Remove from locker documents array
    const originalLength = req.locker.documents.length;
    req.locker.documents = req.locker.documents.filter(
      docId => docId.toString() !== document._id.toString()
    );
    console.log(`Removed from locker array: ${originalLength} -> ${req.locker.documents.length}`);
    
    try {
      req.locker.logAccess('delete_document', req, true, document._id);
    } catch (accessLogError) {
      console.error('Access log error (non-critical):', accessLogError);
      // Continue with deletion even if access log fails
    }
    
    await req.locker.save();
    console.log('Locker updated successfully');
    
    res.json({
      success: true,
      message: 'Document deleted successfully'
    });
  } catch (error) {
    console.error('Document delete error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      documentId: req.params.id
    });
    
    res.status(500).json({
      success: false,
      message: 'Failed to delete document',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Update document
router.put('/documents/:id', authenticate, verifyLockerPin, async (req, res) => {
  try {
    const { name, tags, notes } = req.body;
    
    const document = await LockerDocument.findOne({
      _id: req.params.id,
      locker: req.locker._id,
      isActive: true
    });
    
    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }
    
    // Update fields
    if (name) document.name = name;
    if (tags) document.tags = tags.split(',').map(tag => tag.trim());
    if (notes !== undefined) document.notes = notes;
    
    document.logAudit('updated', 'Document metadata updated', req.ip);
    await document.save();
    
    res.json({
      success: true,
      message: 'Document updated successfully',
      data: document
    });
  } catch (error) {
    console.error('Document update error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update document'
    });
  }
});

// Get locker statistics
router.post('/stats', authenticate, verifyLockerPin, async (req, res) => {
  try {
    const documents = await LockerDocument.find({
      locker: req.locker._id,
      isActive: true
    });
    
    const stats = {
      totalDocuments: documents.length,
      documentTypes: {},
      totalSize: 0,
      recentActivity: req.locker.accessLog.slice(-10).reverse(),
      validationSummary: {
        fullyValidated: 0,
        partiallyValidated: 0,
        needsAttention: 0
      }
    };
    
    documents.forEach(doc => {
      // Count by type
      stats.documentTypes[doc.documentType] = (stats.documentTypes[doc.documentType] || 0) + 1;
      
      // Total size
      stats.totalSize += doc.fileSize;
      
      // Validation summary
      if (doc.validationResults && doc.validationResults.overallScore) {
        if (doc.validationResults.overallScore >= 90) {
          stats.validationSummary.fullyValidated++;
        } else if (doc.validationResults.overallScore >= 70) {
          stats.validationSummary.partiallyValidated++;
        } else {
          stats.validationSummary.needsAttention++;
        }
      }
    });
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve statistics'
    });
  }
});

// Change locker PIN
router.put('/change-pin', authenticate, async (req, res) => {
  try {
    const { currentPin, newPin, confirmNewPin } = req.body;
    
    if (!currentPin || !newPin || !confirmNewPin) {
      return res.status(400).json({
        success: false,
        message: 'Current PIN, new PIN, and confirmation are required'
      });
    }
    
    if (newPin !== confirmNewPin) {
      return res.status(400).json({
        success: false,
        message: 'New PIN and confirmation do not match'
      });
    }
    
    if (newPin.length < 4 || newPin.length > 6) {
      return res.status(400).json({
        success: false,
        message: 'PIN must be between 4 and 6 digits'
      });
    }
    
    const locker = await DocumentLocker.findOne({ user: req.user.userId });
    if (!locker) {
      return res.status(404).json({
        success: false,
        message: 'Document locker not found'
      });
    }
    
    // Verify current PIN
    const isValidPin = await locker.verifyPin(currentPin);
    if (!isValidPin) {
      return res.status(401).json({
        success: false,
        message: 'Current PIN is incorrect'
      });
    }
    
    // Update PIN
    locker.lockerPin = newPin;
    locker.logAccess('unlock', req); // Log PIN change as access
    await locker.save();
    
    res.json({
      success: true,
      message: 'PIN changed successfully'
    });
  } catch (error) {
    console.error('PIN change error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to change PIN'
    });
  }
});

// Verify OCR data for a document
router.post('/documents/:id/verify-ocr', authenticate, verifyLockerPin, async (req, res) => {
  try {
    const document = await LockerDocument.findOne({
      _id: req.params.id,
      locker: req.locker._id,
      isActive: true
    });
    
    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }
    
    document.logAudit('viewed', 'OCR verification accessed', req.ip);
    await document.save();
    
    res.json({
      success: true,
      data: document
    });
  } catch (error) {
    console.error('OCR verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to load OCR verification data'
    });
  }
});

// Update OCR data after verification
router.put('/documents/:id/ocr-data', authenticate, verifyLockerPin, async (req, res) => {
  try {
    const { extractedData } = req.body;
    
    console.log('Updating OCR data for document:', req.params.id);
    console.log('Extracted data received:', JSON.stringify(extractedData, null, 2));
    
    const document = await LockerDocument.findOne({
      _id: req.params.id,
      locker: req.locker._id,
      isActive: true
    });
    
    if (!document) {
      console.log('Document not found:', req.params.id);
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }
    
    console.log('Current document data:', document.extractedData);
    
    // Update extracted data - merge carefully
    const updatedExtractedData = {
      ...document.extractedData?.toObject?.() || document.extractedData || {},
      ...extractedData
    };
    
    // Ensure required fields
    updatedExtractedData.isVerified = true;
    updatedExtractedData.verifiedAt = new Date();
    updatedExtractedData.verifiedBy = req.user.userId;
    
    document.extractedData = updatedExtractedData;
    
    console.log('Updated extracted data:', document.extractedData);
    
    // Re-run validation with updated data
    try {
      const allDocuments = await LockerDocument.find({
        locker: req.locker._id,
        isActive: true
      });
      
      document.validateConsistency(allDocuments);
    } catch (validationError) {
      console.error('Validation error (non-critical):', validationError);
      // Continue even if validation fails
    }
    
    document.logAudit('updated', 'OCR data verified and updated', req.ip);
    await document.save();
    
    console.log('Document saved successfully');
    
    res.json({
      success: true,
      message: 'OCR data updated successfully',
      data: document
    });
  } catch (error) {
    console.error('OCR data update error:', error);
    console.error('Error stack:', error.stack);
    console.error('Error details:', {
      message: error.message,
      name: error.name,
      documentId: req.params.id
    });
    
    res.status(500).json({
      success: false,
      message: 'Failed to update OCR data',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Update field across all documents
router.put('/sync-field', authenticate, verifyLockerPin, async (req, res) => {
  try {
    const { fieldName, fieldValue, sourceDocumentId } = req.body;
    
    console.log(`Syncing field ${fieldName} with value:`, fieldValue);
    
    if (!fieldName) {
      return res.status(400).json({
        success: false,
        message: 'Field name is required'
      });
    }
    
    // Get all documents for this user
    const documents = await LockerDocument.find({
      locker: req.locker._id,
      isActive: true
    });
    
    let updatedCount = 0;
    const updatedDocuments = [];
    
    // Update the field in all documents that have this field in their relevant fields
    for (const document of documents) {
      // Skip the source document to avoid updating it again
      if (sourceDocumentId && document._id.toString() === sourceDocumentId) {
        continue;
      }
      
      const relevantFields = getRelevantFieldsForDocument(document.documentType);
      
      if (relevantFields.includes(fieldName)) {
        if (!document.extractedData) {
          document.extractedData = {};
        }
        
        // Handle address fields specially
        if (fieldName === 'address' && typeof fieldValue === 'object') {
          if (!document.extractedData.address) {
            document.extractedData.address = {};
          }
          document.extractedData.address = {
            ...document.extractedData.address,
            ...fieldValue
          };
        } else if (fieldName.startsWith('address.')) {
          // Handle individual address fields like address.city, address.state
          const addressField = fieldName.split('.')[1];
          if (!document.extractedData.address) {
            document.extractedData.address = {};
          }
          document.extractedData.address[addressField] = fieldValue;
        } else {
          document.extractedData[fieldName] = fieldValue;
        }
        
        // Mark as verified and updated
        document.extractedData.isVerified = true;
        document.extractedData.verifiedAt = new Date();
        document.extractedData.verifiedBy = req.user.userId;
        
        document.logAudit('updated', `Field ${fieldName} synced from another document`, req.ip);
        await document.save();
        updatedCount++;
        updatedDocuments.push({
          id: document._id,
          name: document.name,
          documentType: document.documentType
        });
      }
    }
    
    console.log(`Updated ${updatedCount} documents with field ${fieldName}`);
    
    res.json({
      success: true,
      message: `Synchronized ${fieldName} across ${updatedCount} documents`,
      updatedCount,
      updatedDocuments
    });
  } catch (error) {
    console.error('Field sync error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to sync field across documents'
    });
  }
});

// Helper function to get relevant fields for a document type
function getRelevantFieldsForDocument(documentType) {
  const fieldMappings = {
    aadhaar_card: ['aadhaarNumber', 'fullName', 'dateOfBirth', 'gender', 'address'],
    pan_card: ['panNumber', 'fullName', 'fatherName', 'dateOfBirth'],
    voter_id: ['voterIdNumber', 'fullName', 'fatherName', 'motherName', 'spouseName', 'dateOfBirth', 'gender', 'address'],
    ration_card: ['rationCardNumber', 'cardType', 'headOfFamily', 'familyMembers', 'address', 'fpsNumber'],
    birth_certificate: ['childName', 'dateOfBirth', 'placeOfBirth', 'gender', 'fatherName', 'motherName', 'registrationNumber'],
    death_certificate: ['deceasedName', 'dateOfDeath', 'placeOfDeath', 'age', 'gender', 'causeOfDeath', 'registrationNumber'],
    income_certificate: ['fullName', 'address', 'annualIncome', 'incomeSource', 'certificateNumber', 'issueDate', 'validity'],
    caste_certificate: ['fullName', 'fatherName', 'caste', 'religion', 'address', 'certificateNumber', 'issuingAuthority'],
    community_certificate: ['fullName', 'community', 'religion', 'address', 'certificateNumber', 'issueDate'],
    domicile_certificate: ['fullName', 'fatherName', 'motherName', 'permanentAddress', 'yearsOfResidence', 'certificateNumber', 'issueDate'],
    residence_certificate: ['fullName', 'address', 'localBody', 'periodOfResidence', 'certificateNumber', 'issueDate'],
    marriage_certificate: ['husbandName', 'wifeName', 'dateOfMarriage', 'placeOfMarriage', 'registrationNumber', 'issuingAuthority'],
    driving_license: ['licenseNumber', 'fullName', 'dateOfBirth', 'address', 'vehicleClass', 'issueDate', 'validity'],
    sslc_certificate: ['studentName', 'registerNumber', 'dateOfBirth', 'schoolName', 'yearOfPassing', 'marksGrade'],
    pension_certificate: ['pensionerName', 'pensionType', 'pensionId', 'aadhaarNumber', 'bankAccountDetails', 'amount'],
    // Legacy document types
    passport: ['passportNumber', 'fullName', 'dateOfBirth', 'address', 'issueDate', 'validity', 'issuingAuthority'],
    bank_passbook: ['accountNumber', 'fullName', 'bankName', 'ifscCode', 'address'],
    salary_slip: ['fullName', 'employeeId', 'employerName', 'monthYear', 'grossSalary'],
    property_document: ['fullName', 'propertyNumber', 'surveyNumber', 'area', 'address'],
    educational_certificate: ['fullName', 'certificateNumber', 'institutionName', 'issueDate', 'grade'],
    medical_certificate: ['fullName', 'certificateNumber', 'doctorName', 'hospitalName', 'issueDate'],
    other: ['fullName', 'dateOfBirth', 'address']
  };
  
  return fieldMappings[documentType] || ['fullName', 'dateOfBirth', 'address'];
}

// Get user profile data for auto-fill
router.post('/profile-data', authenticate, verifyLockerPin, async (req, res) => {
  try {
    console.log('Getting profile data for user:', req.user.userId);
    
    const documents = await LockerDocument.find({
      locker: req.locker._id,
      isActive: true
    });
    
    if (documents.length === 0) {
      return res.json({
        success: true,
        data: {}
      });
    }
    
    // Aggregate common data from all documents
    const profileData = {};
    const fieldCounts = {};
    
    documents.forEach(doc => {
      if (doc.extractedData) {
        Object.entries(doc.extractedData).forEach(([key, value]) => {
          if (value && key !== 'rawText' && key !== 'confidence' && key !== 'isVerified' && key !== 'verifiedAt' && key !== 'verifiedBy') {
            if (key === 'address' && typeof value === 'object') {
              // Handle address object
              if (!profileData.address) profileData.address = {};
              if (!fieldCounts.address) fieldCounts.address = {};
              
              Object.entries(value).forEach(([addrKey, addrValue]) => {
                if (addrValue) {
                  if (!profileData.address[addrKey]) {
                    profileData.address[addrKey] = addrValue;
                    fieldCounts.address[addrKey] = 1;
                  } else if (profileData.address[addrKey] === addrValue) {
                    fieldCounts.address[addrKey]++;
                  }
                }
              });
            } else {
              // Handle regular fields
              if (!profileData[key]) {
                profileData[key] = value;
                fieldCounts[key] = 1;
              } else if (profileData[key] === value) {
                fieldCounts[key]++;
              }
            }
          }
        });
      }
    });
    
    // Only keep data that appears in multiple documents or is from verified documents
    const filteredProfileData = {};
    
    Object.entries(profileData).forEach(([key, value]) => {
      if (key === 'address' && typeof value === 'object') {
        const filteredAddress = {};
        Object.entries(value).forEach(([addrKey, addrValue]) => {
          if (fieldCounts.address[addrKey] >= 1) { // Keep address data even if from single document
            filteredAddress[addrKey] = addrValue;
          }
        });
        if (Object.keys(filteredAddress).length > 0) {
          filteredProfileData.address = filteredAddress;
        }
      } else if (fieldCounts[key] >= 1) { // Keep data that appears at least once
        filteredProfileData[key] = value;
      }
    });
    
    console.log('Profile data aggregated:', Object.keys(filteredProfileData));
    
    res.json({
      success: true,
      data: filteredProfileData
    });
  } catch (error) {
    console.error('Profile data error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get profile data'
    });
  }
});

// Cross-validate all documents in locker
router.post('/cross-validate', authenticate, verifyLockerPin, async (req, res) => {
  try {
    const documents = await LockerDocument.find({
      locker: req.locker._id,
      isActive: true
    });
    
    if (documents.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'At least 2 documents are required for cross-validation'
      });
    }
    
    // Perform cross-validation
    const validationResults = performCrossValidation(documents);
    
    // Update validation results for each document
    for (const document of documents) {
      document.validateConsistency(documents);
      document.logAudit('updated', 'Cross-validation performed', req.ip);
      await document.save();
    }
    
    // Log cross-validation access
    req.locker.logAccess('view_document', req, true);
    await req.locker.save();
    
    res.json({
      success: true,
      data: validationResults
    });
  } catch (error) {
    console.error('Cross-validation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to perform cross-validation'
    });
  }
});

// Helper function for cross-validation
function performCrossValidation(documents) {
  const results = {
    overallScore: 100,
    consistentFields: 0,
    inconsistentFields: 0,
    validationDetails: {
      nameConsistency: { score: 100, issues: [] },
      dobConsistency: { score: 100, issues: [] },
      addressConsistency: { score: 100, issues: [] }
    },
    recommendations: []
  };
  
  // Extract all names
  const names = documents
    .filter(doc => doc.extractedData?.fullName)
    .map(doc => ({
      name: doc.extractedData.fullName.toLowerCase().trim(),
      docType: doc.documentType,
      docId: doc._id
    }));
  
  // Check name consistency
  if (names.length > 1) {
    const uniqueNames = [...new Set(names.map(n => n.name))];
    if (uniqueNames.length > 1) {
      results.validationDetails.nameConsistency.score = 60;
      results.validationDetails.nameConsistency.issues.push(
        `Name variations found: ${uniqueNames.join(', ')}`
      );
      results.inconsistentFields++;
      results.recommendations.push('Verify name spelling consistency across documents');
    } else {
      results.consistentFields++;
    }
  }
  
  // Extract all dates of birth
  const dobs = documents
    .filter(doc => doc.extractedData?.dateOfBirth)
    .map(doc => ({
      dob: new Date(doc.extractedData.dateOfBirth).toDateString(),
      docType: doc.documentType,
      docId: doc._id
    }));
  
  // Check DOB consistency
  if (dobs.length > 1) {
    const uniqueDobs = [...new Set(dobs.map(d => d.dob))];
    if (uniqueDobs.length > 1) {
      results.validationDetails.dobConsistency.score = 50;
      results.validationDetails.dobConsistency.issues.push(
        `Date of birth variations found: ${uniqueDobs.join(', ')}`
      );
      results.inconsistentFields++;
      results.recommendations.push('Verify date of birth consistency across documents');
    } else {
      results.consistentFields++;
    }
  }
  
  // Extract all addresses
  const addresses = documents
    .filter(doc => doc.extractedData?.address?.pincode)
    .map(doc => ({
      pincode: doc.extractedData.address.pincode,
      state: doc.extractedData.address.state,
      docType: doc.documentType,
      docId: doc._id
    }));
  
  // Check address consistency
  if (addresses.length > 1) {
    const uniquePincodes = [...new Set(addresses.map(a => a.pincode))];
    const uniqueStates = [...new Set(addresses.filter(a => a.state).map(a => a.state))];
    
    if (uniquePincodes.length > 1) {
      results.validationDetails.addressConsistency.score = 70;
      results.validationDetails.addressConsistency.issues.push(
        `Multiple PIN codes found: ${uniquePincodes.join(', ')}`
      );
      results.inconsistentFields++;
    }
    
    if (uniqueStates.length > 1) {
      results.validationDetails.addressConsistency.score = Math.min(
        results.validationDetails.addressConsistency.score, 60
      );
      results.validationDetails.addressConsistency.issues.push(
        `Multiple states found: ${uniqueStates.join(', ')}`
      );
      results.inconsistentFields++;
    }
    
    if (results.validationDetails.addressConsistency.issues.length === 0) {
      results.consistentFields++;
    } else {
      results.recommendations.push('Verify address consistency across documents');
    }
  }
  
  // Calculate overall score
  const scores = [
    results.validationDetails.nameConsistency.score,
    results.validationDetails.dobConsistency.score,
    results.validationDetails.addressConsistency.score
  ];
  
  results.overallScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  
  // Add general recommendations
  if (results.overallScore < 80) {
    results.recommendations.push('Consider re-uploading documents with better image quality');
    results.recommendations.push('Manually verify and correct OCR data for accuracy');
  }
  
  if (results.consistentFields > results.inconsistentFields) {
    results.recommendations.push('Most data is consistent - good document quality');
  }
  
  return results;
}

export default router;