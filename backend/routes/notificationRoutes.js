import express from 'express';
import { authenticate } from '../middleware/auth.js';
import Notification from '../models/Notification.js';

const router = express.Router();

// Use general authenticate middleware instead of userAuth to allow both users and staff
router.use(authenticate);

// List notifications for current user
router.get('/', async (req, res) => {
  try {
    const items = await Notification.find({ user: req.user.userId })
      .sort({ createdAt: -1 })
      .limit(50);
    const unreadCount = await Notification.countDocuments({ user: req.user.userId, isRead: false });
    res.json({ success: true, data: { items, unreadCount } });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Failed to fetch notifications' });
  }
});

// Mark all as read
router.post('/mark-read', async (req, res) => {
  try {
    await Notification.updateMany({ user: req.user.userId, isRead: false }, { $set: { isRead: true } });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Failed to mark as read' });
  }
});

export default router;






