import mongoose from 'mongoose';

const systemSettingsSchema = new mongoose.Schema({
  // General Settings
  siteName: {
    type: String,
    default: 'Akshaya Services'
  },
  siteDescription: {
    type: String,
    default: 'Kerala Government Services Portal'
  },
  contactEmail: {
    type: String,
    default: 'admin@akshaya.gov.in'
  },
  contactPhone: {
    type: String,
    default: '+91-471-1234567'
  },
  officeHours: {
    type: String,
    default: '9:00 AM - 5:00 PM'
  },
  address: {
    type: String,
    default: 'Akshaya Service Center, Thiruvananthapuram, Kerala'
  },
  
  // Appointment Settings
  maxAppointmentsPerDay: {
    type: Number,
    default: 50,
    min: 1,
    max: 1000
  },
  appointmentAdvanceDays: {
    type: Number,
    default: 3,
    min: 1,
    max: 90
  },
  appointmentSlotDuration: {
    type: Number,
    default: 30, // minutes
    min: 15,
    max: 120
  },
  workingHours: {
    start: {
      type: String,
      default: '09:00'
    },
    end: {
      type: String,
      default: '17:00'
    }
  },
  workingDays: {
    type: [String],
    default: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
  },
  
  // System Settings
  maintenanceMode: {
    type: Boolean,
    default: false
  },
  maintenanceMessage: {
    type: String,
    default: 'System is under maintenance. Please try again later.'
  },
  allowUserRegistration: {
    type: Boolean,
    default: true
  },
  requireEmailVerification: {
    type: Boolean,
    default: false
  },
  allowGoogleSignIn: {
    type: Boolean,
    default: true
  },
  
  // Feature Flags
  enableCenterRatings: {
    type: Boolean,
    default: true
  },
  enableAppointmentRescheduling: {
    type: Boolean,
    default: true
  },
  enableDocumentUpload: {
    type: Boolean,
    default: true
  },
  enableChatSupport: {
    type: Boolean,
    default: false
  },
  
  // Content Settings
  welcomeMessage: {
    type: String,
    default: 'Welcome to Akshaya Services Portal'
  },
  footerText: {
    type: String,
    default: '© 2024 Government of Kerala. All rights reserved.'
  },
  privacyPolicyUrl: {
    type: String,
    default: '/privacy-policy'
  },
  termsOfServiceUrl: {
    type: String,
    default: '/terms-of-service'
  },
  
  // Meta
  lastUpdatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Ensure only one settings document exists
systemSettingsSchema.statics.getSettings = async function() {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({});
  }
  return settings;
};

systemSettingsSchema.statics.updateSettings = async function(updates, userId) {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create(updates);
  } else {
    Object.assign(settings, updates);
    settings.lastUpdatedBy = userId;
    settings.updatedAt = new Date();
    await settings.save();
  }
  return settings;
};

// Pre-save middleware to update timestamps
systemSettingsSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

const SystemSettings = mongoose.model('SystemSettings', systemSettingsSchema);

export default SystemSettings;