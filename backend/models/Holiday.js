import mongoose from 'mongoose';

const holidaySchema = new mongoose.Schema({
  date: { type: Date, required: true, unique: true },
  reason: { type: String, default: 'Holiday' },
  createdAt: { type: Date, default: Date.now },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

// Ensure date is stored without time component for uniqueness
holidaySchema.pre('save', function(next) {
  const d = new Date(this.date);
  d.setHours(0, 0, 0, 0);
  this.date = d;
  next();
});

const Holiday = mongoose.model('Holiday', holidaySchema);

export default Holiday;