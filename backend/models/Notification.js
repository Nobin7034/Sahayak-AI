import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['appointment', 'refund', 'status', 'info', 'broadcast', 'system', 'announcement', 'document_recommendation'], default: 'info' },
  title: { type: String, required: true },
  message: { type: String, required: true },
  meta: { type: Object },
  isRead: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification;






