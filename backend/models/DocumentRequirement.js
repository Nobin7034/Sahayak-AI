import mongoose from 'mongoose';

const documentRequirementSchema = new mongoose.Schema({
  service: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service',
    required: true
  },
  documents: [{
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
      enum: ['identity', 'address', 'income', 'educational', 'medical', 'other'],
      required: true
    },
    isRequired: {
      type: Boolean,
      default: true
    },
    priority: {
      type: Number,
      default: 1 // 1 = high priority, 2 = medium, 3 = low
    },
    referenceImage: {
      type: String, // URL to reference/sample image
      required: false // Made optional for now
    },
    alternatives: [{
      name: String,
      description: String,
      referenceImage: String,
      notes: String
    }],
    notes: String,
    validityPeriod: String, // e.g., "6 months", "1 year", "permanent"
    acceptableFormats: [String] // e.g., ["original", "self-attested copy", "notarized copy"]
  }],
  // Refined validation rules
  validationRules: {
    totalRequired: {
      type: Number,
      required: true,
      min: 1
    },
    minimumThreshold: {
      type: Number,
      required: true,
      min: 1
    },
    // Category-specific requirements
    categoryRequirements: [{
      category: String,
      minimumRequired: Number,
      description: String
    }],
    // Priority-based requirements
    priorityRequirements: [{
      priority: Number,
      minimumRequired: Number,
      description: String
    }]
  },
  instructions: {
    type: String,
    default: 'Please review the document requirements and select which documents you currently have.'
  },
  staffInstructions: {
    type: String,
    default: 'Review user document selection and verify availability during appointment.'
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
documentRequirementSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Index for efficient service lookups
documentRequirementSchema.index({ service: 1 });

const DocumentRequirement = mongoose.model('DocumentRequirement', documentRequirementSchema);

export default DocumentRequirement;