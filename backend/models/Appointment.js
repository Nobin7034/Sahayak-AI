import mongoose from 'mongoose';

const appointmentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  service: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service',
    required: true
  },
  center: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AkshayaCenter',
    required: true
  },
  appointmentDate: {
    type: Date,
    required: true
  },
  timeSlot: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'rejected'],
    default: 'pending'
  },
  // Status change audit trail
  statusHistory: [{
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'rejected']
    },
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    changedAt: {
      type: Date,
      default: Date.now
    },
    reason: String,
    staffName: String,
    centerName: String
  }],
  // Processing information
  completedAt: Date,
  actualDuration: Number, // in minutes
  processingNotes: String,
  // Staff notes and comments
  staffNotes: [{
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    content: String,
    isVisible: {
      type: Boolean,
      default: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  // Comments from staff and users
  comments: [{
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    authorType: {
      type: String,
      enum: ['user', 'staff', 'admin'],
      default: 'user'
    },
    content: String,
    isVisible: {
      type: Boolean,
      default: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  // Documents selected by user during booking
  selectedDocuments: [{
    documentId: String, // Reference to document in DocumentRequirement
    documentName: String,
    isAlternative: {
      type: Boolean,
      default: false
    },
    alternativeName: String, // If alternative document was selected
    selectedAt: {
      type: Date,
      default: Date.now
    }
  }],
  // Document validation status
  documentValidation: {
    isValidated: {
      type: Boolean,
      default: false
    },
    validatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    validatedAt: Date,
    missingDocuments: [String],
    staffNotes: String
  },
  // Result documents uploaded by staff
  resultDocuments: [{
    name: String,
    originalName: String,
    type: String,
    size: Number,
    url: String,
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    },
    isPublic: {
      type: Boolean,
      default: true
    }
  }],
  // Rating and feedback
  rating: {
    score: {
      type: Number,
      min: 1,
      max: 5
    },
    feedback: String,
    ratedAt: Date
  },
  // Payment tracking for service charge collection
  payment: {
    status: { type: String, enum: ['unpaid', 'paid', 'refunded', 'failed'], default: 'unpaid' },
    amount: { type: Number, default: 0 },
    currency: { type: String, default: 'INR' },
    orderId: { type: String },
    paymentId: { type: String },
    signature: { type: String },
    refundId: { type: String },
    refundStatus: { type: String, enum: ['none', 'requested', 'processed', 'failed'], default: 'none' },
    gateway: { type: String, default: 'razorpay' },
    history: [{
      at: { type: Date, default: Date.now },
      action: { type: String },
      meta: { type: Object }
    }]
  },
  notes: {
    type: String
  },
  documents: [{
    name: String,
    url: String
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Create indexes for efficient staff queries
appointmentSchema.index({ center: 1, appointmentDate: 1 });
appointmentSchema.index({ center: 1, status: 1 });
appointmentSchema.index({ center: 1, appointmentDate: 1, status: 1 });
appointmentSchema.index({ user: 1, appointmentDate: -1 });

// Middleware to ensure center is always populated for staff queries
appointmentSchema.statics.findByCenter = function(centerId, options = {}) {
  return this.find({ center: centerId, ...options });
};

appointmentSchema.statics.findByCenterAndStatus = function(centerId, status, options = {}) {
  return this.find({ center: centerId, status, ...options });
};

appointmentSchema.statics.findByCenterAndDateRange = function(centerId, startDate, endDate, options = {}) {
  return this.find({ 
    center: centerId, 
    appointmentDate: { $gte: startDate, $lt: endDate },
    ...options 
  });
};

// Update the updatedAt field before saving
appointmentSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const Appointment = mongoose.model('Appointment', appointmentSchema);

export default Appointment;