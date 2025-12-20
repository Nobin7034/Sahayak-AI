import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },

  // Local and Google auth fields
  password: {
    type: String,
    // Password required only for local users (no googleId)
    required: function () {
      return !this.googleId;
    }
  },
  googleId: { type: String, index: true },
  provider: { type: String, enum: ['local', 'google'], default: 'local' },
  avatar: { type: String },

  phone: { 
    type: String,
    validate: {
      validator: function(phone) {
        // Allow empty phone numbers
        if (!phone || phone.trim() === '') return true;
        
        // Remove all non-digit characters
        const cleanPhone = phone.replace(/\D/g, '');
        
        // Check if it's a valid Indian mobile number
        // Indian mobile numbers: 10 digits starting with 6, 7, 8, or 9
        // Or with country code: +91 followed by 10 digits
        const indianMobileRegex = /^[6-9]\d{9}$/;
        const indianMobileWithCountryCode = /^(\+91|91)?[6-9]\d{9}$/;
        
        if (cleanPhone.length === 10 && indianMobileRegex.test(cleanPhone)) {
          return true;
        } else if (cleanPhone.length === 12 && cleanPhone.startsWith('91') && indianMobileWithCountryCode.test(cleanPhone)) {
          return true;
        } else if (cleanPhone.length === 13 && cleanPhone.startsWith('91') && indianMobileWithCountryCode.test('+' + cleanPhone)) {
          return true;
        } else if (phone.startsWith('+91') && phone.length === 14 && indianMobileWithCountryCode.test(phone)) {
          return true;
        }
        
        return false;
      },
      message: 'Please enter a valid Indian mobile number (10 digits starting with 6, 7, 8, or 9)'
    }
  },
  role: { type: String, enum: ['user', 'staff', 'admin'], default: 'user' },
  lastLogin: { type: Date },
  isActive: { type: Boolean, default: true },
  
  // Staff approval fields
  approvalStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: function() {
      return this.role === 'staff' ? 'pending' : 'approved';
    }
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  reviewedAt: {
    type: Date,
    default: null
  },
  reviewNotes: {
    type: String,
    default: ''
  },
  
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

export default User;