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

  phone: { type: String },
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