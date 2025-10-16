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
  next();
});

const Service = mongoose.model('Service', serviceSchema);

export default Service;