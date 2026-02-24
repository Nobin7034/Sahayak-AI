import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const documentLockerSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true // One locker per user
  },
  
  // Locker-specific security
  lockerPin: {
    type: String,
    required: true,
    minlength: 4,
    maxlength: 100 // Allow for hashed PIN storage
  },
  
  // Security settings
  securitySettings: {
    maxFailedAttempts: {
      type: Number,
      default: 3
    },
    lockoutDuration: {
      type: Number,
      default: 15 // minutes
    },
    sessionTimeout: {
      type: Number,
      default: 30 // minutes
    }
  },
  
  // Access tracking
  accessLog: [{
    timestamp: {
      type: Date,
      default: Date.now
    },
    action: {
      type: String,
      enum: ['unlock', 'lock', 'view_document', 'upload_document', 'delete_document', 'failed_attempt'],
      required: true
    },
    ipAddress: String,
    userAgent: String,
    success: {
      type: Boolean,
      default: true
    },
    documentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Document'
    }
  }],
  
  // Failed attempts tracking
  failedAttempts: {
    count: {
      type: Number,
      default: 0
    },
    lastAttempt: Date,
    lockedUntil: Date
  },
  
  // Documents stored in the locker
  documents: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LockerDocument'
  }],
  
  // Locker status
  isActive: {
    type: Boolean,
    default: true
  },
  
  createdAt: {
    type: Date,
    default: Date.now
  },
  
  lastAccessed: {
    type: Date,
    default: Date.now
  }
});

// Hash PIN before saving
documentLockerSchema.pre('save', async function(next) {
  if (!this.isModified('lockerPin')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.lockerPin = await bcrypt.hash(this.lockerPin, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to verify PIN
documentLockerSchema.methods.verifyPin = async function(pin) {
  return await bcrypt.compare(pin, this.lockerPin);
};

// Method to check if locker is locked
documentLockerSchema.methods.isLocked = function() {
  return this.failedAttempts.lockedUntil && this.failedAttempts.lockedUntil > new Date();
};

// Method to record failed attempt
documentLockerSchema.methods.recordFailedAttempt = function() {
  this.failedAttempts.count += 1;
  this.failedAttempts.lastAttempt = new Date();
  
  if (this.failedAttempts.count >= this.securitySettings.maxFailedAttempts) {
    this.failedAttempts.lockedUntil = new Date(Date.now() + this.securitySettings.lockoutDuration * 60 * 1000);
  }
};

// Method to reset failed attempts
documentLockerSchema.methods.resetFailedAttempts = function() {
  this.failedAttempts.count = 0;
  this.failedAttempts.lastAttempt = null;
  this.failedAttempts.lockedUntil = null;
};

// Method to log access
documentLockerSchema.methods.logAccess = function(action, req, success = true, documentId = null) {
  this.accessLog.push({
    action,
    ipAddress: req.ip || req.connection.remoteAddress,
    userAgent: req.get('User-Agent'),
    success,
    documentId
  });
  
  // Keep only last 100 access logs
  if (this.accessLog.length > 100) {
    this.accessLog = this.accessLog.slice(-100);
  }
  
  if (success) {
    this.lastAccessed = new Date();
  }
};

const DocumentLocker = mongoose.model('DocumentLocker', documentLockerSchema);
export default DocumentLocker;