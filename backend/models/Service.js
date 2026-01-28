import mongoose from 'mongoose';

const serviceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true
  },
  fee: {
    type: Number,
    required: true,
    min: 0
  },
  // Upfront amount payable to confirm booking (<= fee)
  serviceCharge: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  processingTime: {
    type: String,
    required: true
  },
  // Pre-Check Rules users must review before applying
  preCheckRules: [{ type: String }],
  // Backward compatible: keep simple list
  requiredDocuments: [{ type: String }],
  // New richer structure for documents with requirement levels and alternatives
  documents: [{
    name: { type: String, required: true },
    // requirement can be 'mandatory' or 'optional'
    requirement: { type: String, enum: ['mandatory', 'optional'], default: 'mandatory' },
    notes: { type: String },
    // Either use a reusable template or a direct image URL
    template: { type: mongoose.Schema.Types.ObjectId, ref: 'DocumentTemplate' },
    imageUrl: { type: String },
    // Alternatives for this primary document
    alternatives: [{
      name: { type: String, required: true },
      notes: { type: String },
      template: { type: mongoose.Schema.Types.ObjectId, ref: 'DocumentTemplate' },
      imageUrl: { type: String }
    }]
  }],
  // Minimum required documents configuration
  minimumRequiredDocuments: {
    type: Number,
    default: function() {
      // Default to total documents - 1, but at least 1
      const totalDocs = (this.documents?.length || 0) + (this.requiredDocuments?.length || 0);
      return Math.max(1, totalDocs - 1);
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  visitCount: {
    type: Number,
    default: 0
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
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

// Update the updatedAt field before saving
serviceSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  
  // Auto-set minimum required documents if not explicitly set
  if (this.isNew || this.isModified('documents') || this.isModified('requiredDocuments')) {
    const totalDocs = (this.documents?.length || 0) + (this.requiredDocuments?.length || 0);
    if (this.minimumRequiredDocuments === undefined || this.minimumRequiredDocuments === null) {
      this.minimumRequiredDocuments = Math.max(1, totalDocs - 1);
    }
  }
  
  next();
});

const Service = mongoose.model('Service', serviceSchema);

export default Service;