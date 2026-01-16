import mongoose from 'mongoose';

const centerRatingSchema = new mongoose.Schema({
  center: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AkshayaCenter',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  appointment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment'
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  review: {
    type: String,
    maxlength: 500
  },
  categories: {
    serviceQuality: { type: Number, min: 1, max: 5 },
    staffBehavior: { type: Number, min: 1, max: 5 },
    waitTime: { type: Number, min: 1, max: 5 },
    cleanliness: { type: Number, min: 1, max: 5 },
    facilities: { type: Number, min: 1, max: 5 }
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  response: {
    text: String,
    respondedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Staff'
    },
    respondedAt: Date
  },
  helpful: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  reported: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reason: String,
    reportedAt: {
      type: Date,
      default: Date.now
    }
  }],
  status: {
    type: String,
    enum: ['active', 'hidden', 'removed'],
    default: 'active'
  }
}, {
  timestamps: true
});

// Indexes
centerRatingSchema.index({ center: 1, createdAt: -1 });
centerRatingSchema.index({ user: 1 });
centerRatingSchema.index({ center: 1, user: 1 });
centerRatingSchema.index({ rating: 1 });
centerRatingSchema.index({ status: 1 });

// Ensure one rating per user per appointment (only when appointment is provided)
// Using sparse index so null appointments don't conflict
centerRatingSchema.index({ appointment: 1, user: 1 }, { unique: true, sparse: true });

// Allow only one general rating per user per center (when no appointment)
centerRatingSchema.index({ center: 1, user: 1, appointment: 1 }, { 
  unique: true, 
  partialFilterExpression: { appointment: { $type: 'null' } }
});

// Static method to calculate center average rating
centerRatingSchema.statics.calculateCenterRating = async function(centerId) {
  const result = await this.aggregate([
    {
      $match: {
        center: new mongoose.Types.ObjectId(centerId),
        status: 'active'
      }
    },
    {
      $group: {
        _id: null,
        avgRating: { $avg: '$rating' },
        totalRatings: { $sum: 1 },
        avgServiceQuality: { $avg: '$categories.serviceQuality' },
        avgStaffBehavior: { $avg: '$categories.staffBehavior' },
        avgWaitTime: { $avg: '$categories.waitTime' },
        avgCleanliness: { $avg: '$categories.cleanliness' },
        avgFacilities: { $avg: '$categories.facilities' }
      }
    }
  ]);

  return result.length > 0 ? result[0] : {
    avgRating: 0,
    totalRatings: 0,
    avgServiceQuality: 0,
    avgStaffBehavior: 0,
    avgWaitTime: 0,
    avgCleanliness: 0,
    avgFacilities: 0
  };
};

// Static method to get rating distribution
centerRatingSchema.statics.getRatingDistribution = async function(centerId) {
  const distribution = await this.aggregate([
    {
      $match: {
        center: new mongoose.Types.ObjectId(centerId),
        status: 'active'
      }
    },
    {
      $group: {
        _id: '$rating',
        count: { $sum: 1 }
      }
    },
    {
      $sort: { _id: -1 }
    }
  ]);

  // Convert to object with all ratings
  const result = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  distribution.forEach(item => {
    result[item._id] = item.count;
  });

  return result;
};

// Method to mark rating as helpful
centerRatingSchema.methods.markHelpful = function(userId) {
  if (!this.helpful.includes(userId)) {
    this.helpful.push(userId);
  }
  return this.save();
};

// Method to report rating
centerRatingSchema.methods.report = function(userId, reason) {
  this.reported.push({
    user: userId,
    reason,
    reportedAt: new Date()
  });
  return this.save();
};

export default mongoose.model('CenterRating', centerRatingSchema);
