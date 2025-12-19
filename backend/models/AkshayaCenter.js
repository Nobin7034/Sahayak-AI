import mongoose from 'mongoose';

const akshayaCenterSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  address: {
    street: {
      type: String,
      required: true
    },
    city: {
      type: String,
      required: true
    },
    district: {
      type: String,
      required: true
    },
    state: {
      type: String,
      default: 'Kerala'
    },
    pincode: {
      type: String,
      required: true,
      match: /^\d{6}$/
    }
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      required: true
    },
    coordinates: {
      type: [Number],
      required: true,
      validate: {
        validator: function(coordinates) {
          return coordinates.length === 2 &&
                 coordinates[0] >= -180 && coordinates[0] <= 180 && // longitude
                 coordinates[1] >= -90 && coordinates[1] <= 90;     // latitude
        },
        message: 'Invalid coordinates format'
      }
    }
  },
  contact: {
    phone: {
      type: String,
      required: true,
      match: /^\+91\d{10}$/
    },
    email: {
      type: String,
      required: true,
      match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    }
  },
  operatingHours: {
    monday: {
      open: { type: String, default: '09:00' },
      close: { type: String, default: '17:00' },
      isOpen: { type: Boolean, default: true }
    },
    tuesday: {
      open: { type: String, default: '09:00' },
      close: { type: String, default: '17:00' },
      isOpen: { type: Boolean, default: true }
    },
    wednesday: {
      open: { type: String, default: '09:00' },
      close: { type: String, default: '17:00' },
      isOpen: { type: Boolean, default: true }
    },
    thursday: {
      open: { type: String, default: '09:00' },
      close: { type: String, default: '17:00' },
      isOpen: { type: Boolean, default: true }
    },
    friday: {
      open: { type: String, default: '09:00' },
      close: { type: String, default: '17:00' },
      isOpen: { type: Boolean, default: true }
    },
    saturday: {
      open: { type: String, default: '09:00' },
      close: { type: String, default: '17:00' },
      isOpen: { type: Boolean, default: true }
    },
    sunday: {
      open: { type: String, default: '10:00' },
      close: { type: String, default: '16:00' },
      isOpen: { type: Boolean, default: false }
    }
  },
  services: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service'
  }],
  status: {
    type: String,
    enum: ['active', 'inactive', 'maintenance'],
    default: 'inactive' // Default to inactive until staff is approved
  },
  
  // Staff reference - the staff member who registered this center
  registeredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  capacity: {
    maxAppointmentsPerDay: {
      type: Number,
      default: 50
    },
    currentLoad: {
      type: Number,
      default: 0
    }
  },
  serviceSettings: {
    type: Map,
    of: {
      availabilityNotes: { type: String, default: '' },
      customFees: { type: Number },
      estimatedDuration: { type: Number },
      updatedAt: { type: Date, default: Date.now },
      updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
    },
    default: {}
  },
  metadata: {
    visitCount: {
      type: Number,
      default: 0
    },
    rating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0
    },
    lastUpdated: {
      type: Date,
      default: Date.now
    }
  }
}, {
  timestamps: true
});

// Create 2dsphere index for geospatial queries
akshayaCenterSchema.index({ location: '2dsphere' });

// Index for text search
akshayaCenterSchema.index({ 
  name: 'text', 
  'address.city': 'text', 
  'address.district': 'text' 
});

// Virtual for checking if center is currently open
akshayaCenterSchema.virtual('isCurrentlyOpen').get(function() {
  const now = new Date();
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const currentDay = days[now.getDay()];
  const currentTime = now.getHours() * 100 + now.getMinutes();

  const daySchedule = this.operatingHours[currentDay];
  if (!daySchedule || !daySchedule.isOpen) {
    return false;
  }

  const openTime = this.timeStringToNumber(daySchedule.open);
  const closeTime = this.timeStringToNumber(daySchedule.close);

  return currentTime >= openTime && currentTime <= closeTime;
});

// Method to convert time string to number for comparison
akshayaCenterSchema.methods.timeStringToNumber = function(timeString) {
  const [hours, minutes] = timeString.split(':').map(Number);
  return hours * 100 + minutes;
};

// Static method to find nearby centers
akshayaCenterSchema.statics.findNearby = function(longitude, latitude, maxDistance = 50000) {
  return this.find({
    location: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [longitude, latitude]
        },
        $maxDistance: maxDistance // in meters
      }
    },
    status: 'active'
  });
};

// Method to calculate distance from a point
akshayaCenterSchema.methods.distanceFrom = function(longitude, latitude) {
  const R = 6371; // Earth's radius in kilometers
  const dLat = this.toRadians(latitude - this.location.coordinates[1]);
  const dLon = this.toRadians(longitude - this.location.coordinates[0]);
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(this.toRadians(this.location.coordinates[1])) * Math.cos(this.toRadians(latitude)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

akshayaCenterSchema.methods.toRadians = function(degrees) {
  return degrees * (Math.PI/180);
};

// Pre-save middleware to update lastUpdated
akshayaCenterSchema.pre('save', function(next) {
  this.metadata.lastUpdated = new Date();
  next();
});

export default mongoose.model('AkshayaCenter', akshayaCenterSchema);