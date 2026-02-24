import mongoose from 'mongoose';

const lockerDocumentSchema = new mongoose.Schema({
  locker: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DocumentLocker',
    required: true
  },
  
  // Document metadata
  name: {
    type: String,
    required: true
  },
  
  originalName: {
    type: String,
    required: true
  },
  
  documentType: {
    type: String,
    enum: [
      'aadhaar_card',
      'pan_card',
      'voter_id',
      'ration_card',
      'birth_certificate',
      'death_certificate',
      'income_certificate',
      'caste_certificate',
      'community_certificate',
      'domicile_certificate',
      'residence_certificate',
      'marriage_certificate',
      'driving_license',
      'sslc_certificate',
      'pension_certificate',
      // Legacy document types (for existing documents)
      'passport',
      'bank_passbook',
      'salary_slip',
      'property_document',
      'educational_certificate',
      'medical_certificate',
      'other'
    ],
    required: true
  },
  
  // File information
  filePath: {
    type: String,
    required: true
  },
  
  fileSize: {
    type: Number,
    required: true
  },
  
  mimeType: {
    type: String,
    required: true
  },
  
  // OCR extracted data
  extractedData: {
    // Common fields
    fullName: String,
    dateOfBirth: Date,
    gender: String,
    address: {
      line1: String,
      line2: String,
      city: String,
      state: String,
      pincode: String,
      country: String
    },
    
    // Document-specific fields
    aadhaarNumber: String,
    panNumber: String,
    voterIdNumber: String,
    rationCardNumber: String,
    licenseNumber: String,
    certificateNumber: String,
    registrationNumber: String,
    
    // Family information
    fatherName: String,
    motherName: String,
    spouseName: String,
    childName: String,
    husbandName: String,
    wifeName: String,
    headOfFamily: String,
    familyMembers: String,
    deceasedName: String,
    pensionerName: String,
    studentName: String,
    
    // Financial information
    annualIncome: Number,
    amount: Number,
    incomeSource: String,
    
    // Location information
    placeOfBirth: String,
    placeOfDeath: String,
    placeOfMarriage: String,
    permanentAddress: String,
    localBody: String,
    
    // Document specific data
    cardType: String, // For ration card
    fpsNumber: String,
    caste: String,
    religion: String,
    community: String,
    causeOfDeath: String,
    vehicleClass: String,
    pensionType: String,
    pensionId: String,
    bankAccountDetails: String,
    schoolName: String,
    registerNumber: String,
    marksGrade: String,
    
    // Time periods
    age: Number,
    yearsOfResidence: Number,
    periodOfResidence: String,
    yearOfPassing: Number,
    
    // Dates
    dateOfDeath: Date,
    dateOfMarriage: Date,
    issueDate: Date,
    validity: Date,
    
    // Authority information
    issuingAuthority: String,
    
    // Additional extracted text
    rawText: String,
    confidence: Number, // OCR confidence score (0-100)
    
    // Verification status
    isVerified: {
      type: Boolean,
      default: false
    },
    
    verifiedAt: Date,
    verifiedBy: mongoose.Schema.Types.ObjectId,
    verificationNotes: String
  },
  
  // Data validation results
  validationResults: {
    nameConsistency: {
      score: Number, // 0-100
      issues: [String]
    },
    
    dobConsistency: {
      score: Number,
      issues: [String]
    },
    
    addressConsistency: {
      score: Number,
      issues: [String]
    },
    
    documentValidity: {
      isValid: Boolean,
      expiryStatus: {
        type: String,
        enum: ['valid', 'expiring_soon', 'expired', 'unknown']
      },
      issues: [String]
    },
    
    overallScore: Number, // 0-100
    lastValidated: Date
  },
  
  // Security and access
  encryptionKey: String, // For file encryption
  accessCount: {
    type: Number,
    default: 0
  },
  
  lastAccessed: Date,
  
  // Tags and categories
  tags: [String],
  
  notes: String,
  
  // Sharing settings
  sharingSettings: {
    isShareable: {
      type: Boolean,
      default: false
    },
    
    sharedWith: [{
      email: String,
      permissions: {
        type: String,
        enum: ['view', 'download'],
        default: 'view'
      },
      sharedAt: {
        type: Date,
        default: Date.now
      },
      expiresAt: Date
    }],
    
    shareToken: String,
    shareTokenExpiry: Date
  },
  
  // Audit trail
  auditTrail: [{
    action: {
      type: String,
      enum: ['created', 'viewed', 'updated', 'shared', 'downloaded', 'deleted'],
      required: true
    },
    
    timestamp: {
      type: Date,
      default: Date.now
    },
    
    details: String,
    ipAddress: String
  }],
  
  isActive: {
    type: Boolean,
    default: true
  },
  
  createdAt: {
    type: Date,
    default: Date.now
  },
  
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update timestamp on save
lockerDocumentSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Method to log audit trail
lockerDocumentSchema.methods.logAudit = function(action, details = '', ipAddress = '') {
  this.auditTrail.push({
    action,
    details,
    ipAddress
  });
  
  // Keep only last 50 audit entries
  if (this.auditTrail.length > 50) {
    this.auditTrail = this.auditTrail.slice(-50);
  }
};

// Method to increment access count
lockerDocumentSchema.methods.recordAccess = function() {
  this.accessCount += 1;
  this.lastAccessed = new Date();
};

// Method to validate document data consistency
lockerDocumentSchema.methods.validateConsistency = function(allDocuments = []) {
  const results = {
    nameConsistency: { score: 100, issues: [] },
    dobConsistency: { score: 100, issues: [] },
    addressConsistency: { score: 100, issues: [] },
    documentValidity: { isValid: true, expiryStatus: 'valid', issues: [] },
    overallScore: 100,
    lastValidated: new Date()
  };
  
  // Check document expiry
  if (this.extractedData.expiryDate) {
    const now = new Date();
    const expiryDate = new Date(this.extractedData.expiryDate);
    const daysUntilExpiry = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiry < 0) {
      results.documentValidity.expiryStatus = 'expired';
      results.documentValidity.isValid = false;
      results.documentValidity.issues.push('Document has expired');
    } else if (daysUntilExpiry <= 30) {
      results.documentValidity.expiryStatus = 'expiring_soon';
      results.documentValidity.issues.push(`Document expires in ${daysUntilExpiry} days`);
    }
  }
  
  // Cross-document validation if other documents provided
  if (allDocuments.length > 1) {
    const names = allDocuments
      .filter(doc => doc.extractedData.fullName)
      .map(doc => doc.extractedData.fullName.toLowerCase().trim());
    
    if (names.length > 1) {
      const uniqueNames = [...new Set(names)];
      if (uniqueNames.length > 1) {
        results.nameConsistency.score = 60;
        results.nameConsistency.issues.push('Name variations found across documents');
      }
    }
    
    // Similar validation for DOB and address...
  }
  
  // Calculate overall score
  const scores = [
    results.nameConsistency.score,
    results.dobConsistency.score,
    results.addressConsistency.score,
    results.documentValidity.isValid ? 100 : 50
  ];
  
  results.overallScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  
  this.validationResults = results;
  return results;
};

const LockerDocument = mongoose.model('LockerDocument', lockerDocumentSchema);
export default LockerDocument;