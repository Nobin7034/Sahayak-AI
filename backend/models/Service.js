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
  processingTime: {
    type: String,
    required: true
  },
  // Backward compatible: keep simple list
  requiredDocuments: [{ type: String }],
  // New richer structure for documents with optional reusable template reference
  documents: [{
    name: { type: String, required: true },
    template: { type: mongoose.Schema.Types.ObjectId, ref: 'DocumentTemplate' },
    imageUrl: { type: String }, // stored when not using a template
    notes: { type: String }
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