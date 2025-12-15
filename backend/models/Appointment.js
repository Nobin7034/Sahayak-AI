import mongoose from 'mongoose';

const appointmentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  service: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service',
    required: true
  },
  center: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AkshayaCenter',
    required: true
  },
  appointmentDate: {
    type: Date,
    required: true
  },
  timeSlot: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'completed', 'cancelled'],
    default: 'pending'
  },
  // Payment tracking for service charge collection
  payment: {
    status: { type: String, enum: ['unpaid', 'paid', 'refunded', 'failed'], default: 'unpaid' },
    amount: { type: Number, default: 0 },
    currency: { type: String, default: 'INR' },
    orderId: { type: String },
    paymentId: { type: String },
    signature: { type: String },
    refundId: { type: String },
    refundStatus: { type: String, enum: ['none', 'requested', 'processed', 'failed'], default: 'none' },
    gateway: { type: String, default: 'razorpay' },
    history: [{
      at: { type: Date, default: Date.now },
      action: { type: String },
      meta: { type: Object }
    }]
  },
  notes: {
    type: String
  },
  documents: [{
    name: String,
    url: String
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Create indexes for efficient staff queries
appointmentSchema.index({ center: 1, appointmentDate: 1 });
appointmentSchema.index({ center: 1, status: 1 });
appointmentSchema.index({ center: 1, appointmentDate: 1, status: 1 });
appointmentSchema.index({ user: 1, appointmentDate: -1 });

// Update the updatedAt field before saving
appointmentSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const Appointment = mongoose.model('Appointment', appointmentSchema);

export default Appointment;