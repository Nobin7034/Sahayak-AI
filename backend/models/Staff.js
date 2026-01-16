import mongoose from 'mongoose';

const staffSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  center: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AkshayaCenter',
    required: true
  },
  role: {
    type: String,
    enum: ['staff', 'supervisor'],
    default: 'staff'
  },
  permissions: [{
    action: {
      type: String,
      required: true,
      enum: [
        'manage_appointments',
        'update_status',
        'add_comments',
        'upload_documents',
        'manage_services',
        'view_analytics',
        'manage_schedule',
        'view_ratings',
        'manage_ratings',
        'view_reports'
      ]
    },
    granted: {
      type: Boolean,
      default: true
    },
    grantedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    grantedAt: {
      type: Date,
      default: Date.now
    }
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  assignedAt: {
    type: Date,
    default: Date.now
  },
  assignedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  lastLogin: {
    type: Date
  },
  workingHours: {
    monday: {
      start: { type: String, default: '09:00' },
      end: { type: String, default: '17:00' },
      isWorking: { type: Boolean, default: true }
    },
    tuesday: {
      start: { type: String, default: '09:00' },
      end: { type: String, default: '17:00' },
      isWorking: { type: Boolean, default: true }
    },
    wednesday: {
      start: { type: String, default: '09:00' },
      end: { type: String, default: '17:00' },
      isWorking: { type: Boolean, default: true }
    },
    thursday: {
      start: { type: String, default: '09:00' },
      end: { type: String, default: '17:00' },
      isWorking: { type: Boolean, default: true }
    },
    friday: {
      start: { type: String, default: '09:00' },
      end: { type: String, default: '17:00' },
      isWorking: { type: Boolean, default: true }
    },
    saturday: {
      start: { type: String, default: '09:00' },
      end: { type: String, default: '17:00' },
      isWorking: { type: Boolean, default: true }
    },
    sunday: {
      start: { type: String, default: '10:00' },
      end: { type: String, default: '16:00' },
      isWorking: { type: Boolean, default: false }
    }
  },
  preferences: {
    notifications: {
      newAppointments: { type: Boolean, default: true },
      statusUpdates: { type: Boolean, default: true },
      reminders: { type: Boolean, default: true },
      systemAlerts: { type: Boolean, default: true }
    },
    dashboard: {
      defaultView: { 
        type: String, 
        enum: ['today', 'week', 'month'], 
        default: 'today' 
      },
      appointmentsPerPage: { 
        type: Number, 
        default: 20,
        min: 10,
        max: 100
      }
    }
  },
  statistics: {
    totalAppointmentsHandled: { type: Number, default: 0 },
    averageProcessingTime: { type: Number, default: 0 }, // in minutes
    completionRate: { type: Number, default: 0 }, // percentage
    userSatisfactionScore: { type: Number, default: 0 } // 1-5 scale
  }
}, {
  timestamps: true
});

// Index for efficient queries
staffSchema.index({ userId: 1 });
staffSchema.index({ center: 1 });
staffSchema.index({ isActive: 1 });
staffSchema.index({ center: 1, isActive: 1 });

// Virtual for checking if staff is currently working
staffSchema.virtual('isCurrentlyWorking').get(function() {
  const now = new Date();
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const currentDay = days[now.getDay()];
  const currentTime = now.getHours() * 100 + now.getMinutes();

  const daySchedule = this.workingHours[currentDay];
  if (!daySchedule || !daySchedule.isWorking) {
    return false;
  }

  const startTime = this.timeStringToNumber(daySchedule.start);
  const endTime = this.timeStringToNumber(daySchedule.end);

  return currentTime >= startTime && currentTime <= endTime;
});

// Method to convert time string to number for comparison
staffSchema.methods.timeStringToNumber = function(timeString) {
  const [hours, minutes] = timeString.split(':').map(Number);
  return hours * 100 + minutes;
};

// Method to check if staff has specific permission
staffSchema.methods.hasPermission = function(action) {
  if (!this.isActive) return false;
  
  const permission = this.permissions.find(p => p.action === action);
  return permission ? permission.granted : false;
};

// Method to update last login
staffSchema.methods.updateLastLogin = function() {
  this.lastLogin = new Date();
  return this.save();
};

// Static method to find staff by center
staffSchema.statics.findByCenter = function(centerId, activeOnly = true) {
  const query = { center: centerId };
  if (activeOnly) {
    query.isActive = true;
  }
  return this.find(query).populate('userId', 'name email phone');
};

// Static method to find staff by user ID
staffSchema.statics.findByUserId = function(userId) {
  return this.findOne({ userId, isActive: true })
    .populate('center', 'name address contact')
    .populate('userId', 'name email phone');
};

// Pre-save middleware to set default permissions for new staff
staffSchema.pre('save', function(next) {
  if (this.isNew && this.permissions.length === 0) {
    // Set default permissions for new staff
    const defaultPermissions = [
      'manage_appointments',
      'update_status',
      'add_comments',
      'upload_documents',
      'manage_services',
      'view_analytics'
    ];
    
    this.permissions = defaultPermissions.map(action => ({
      action,
      granted: true,
      grantedBy: this.assignedBy,
      grantedAt: new Date()
    }));
  }
  next();
});

// Pre-save middleware to update statistics
staffSchema.pre('save', function(next) {
  if (this.isModified('statistics')) {
    // Ensure statistics are within valid ranges
    this.statistics.completionRate = Math.max(0, Math.min(100, this.statistics.completionRate));
    this.statistics.userSatisfactionScore = Math.max(0, Math.min(5, this.statistics.userSatisfactionScore));
  }
  next();
});

export default mongoose.model('Staff', staffSchema);