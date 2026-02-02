import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import User from '../models/User.js';
import Service from '../models/Service.js';
import News from '../models/News.js';
import Appointment from '../models/Appointment.js';
import DocumentTemplate from '../models/DocumentTemplate.js';
import SystemSettings from '../models/SystemSettings.js';
import { adminAuth } from '../middleware/auth.js';
import { clearSettingsCache } from '../middleware/maintenanceMode.js';
import Notification from '../models/Notification.js';
import Holiday from '../models/Holiday.js';
import paymentRoutes from './paymentRoutes.js';

const router = express.Router();

// Ensure uploads directory exists in the same folder the server serves from
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer storage configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, 'news-' + uniqueSuffix + ext);
  }
});

const fileFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/png', 'image/webp'];
  if (allowed.includes(file.mimetype)) cb(null, true);
  else cb(new Error('Only JPEG, PNG, WEBP images are allowed'));
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });

// Public settings endpoint (no auth required)
router.get('/settings/public', async (req, res) => {
  try {
    const settings = await SystemSettings.getSettings();
    
    // Only return public settings that are safe to expose
    const publicSettings = {
      siteName: settings.siteName,
      siteDescription: settings.siteDescription,
      contactEmail: settings.contactEmail,
      contactPhone: settings.contactPhone,
      officeHours: settings.officeHours,
      address: settings.address,
      maintenanceMode: settings.maintenanceMode,
      maintenanceMessage: settings.maintenanceMessage,
      allowUserRegistration: settings.allowUserRegistration,
      allowGoogleSignIn: settings.allowGoogleSignIn,
      welcomeMessage: settings.welcomeMessage,
      footerText: settings.footerText,
      workingHours: settings.workingHours,
      workingDays: settings.workingDays,
      appointmentAdvanceDays: settings.appointmentAdvanceDays,
      enableCenterRatings: settings.enableCenterRatings,
      enableAppointmentRescheduling: settings.enableAppointmentRescheduling,
      enableDocumentUpload: settings.enableDocumentUpload,
      enableChatSupport: settings.enableChatSupport,
      privacyPolicyUrl: settings.privacyPolicyUrl,
      termsOfServiceUrl: settings.termsOfServiceUrl
    };
    
    res.json({
      success: true,
      data: publicSettings
    });
  } catch (error) {
    console.error('Get public settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch public settings',
      error: error.message
    });
  }
});

// Apply admin authentication middleware to all routes below this point
router.use(adminAuth);

// Document Template Management
router.get('/document-templates', async (req, res) => {
  try {
    const templates = await DocumentTemplate.find().sort({ createdAt: -1 });
    res.json({ success: true, data: templates });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch templates', error: error.message });
  }
});

router.post('/document-templates', async (req, res) => {
  try {
    const { title, description, imageUrl } = req.body;
    if (!title || !imageUrl) {
      return res.status(400).json({ success: false, message: 'title and imageUrl are required' });
    }
    const tpl = await DocumentTemplate.create({ title, description, imageUrl, createdBy: req.user.userId });
    res.status(201).json({ success: true, data: tpl });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create template', error: error.message });
  }
});

// Upload an image for document templates
router.post('/document-templates/upload', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No image uploaded' });
    const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;
    const imageUrl = `${baseUrl}/uploads/${req.file.filename}`;
    res.status(201).json({ success: true, imageUrl });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to upload image', error: error.message });
  }
});

router.delete('/document-templates/:id', async (req, res) => {
  try {
    await DocumentTemplate.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Template deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete template', error: error.message });
  }
});

// Dashboard Statistics
router.get('/dashboard-stats', async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ role: 'user' });
    const totalServices = await Service.countDocuments();
    const totalAppointments = await Appointment.countDocuments();
    const pendingAppointments = await Appointment.countDocuments({ status: 'pending' });
    const totalNews = await News.countDocuments();
    const publishedNews = await News.countDocuments({ isPublished: true });

    // Most visited services
    const mostVisitedServices = await Service.find()
      .sort({ visitCount: -1 })
      .limit(5)
      .select('name visitCount category');

    // Recent appointments
    const recentAppointments = await Appointment.find()
      .populate('user', 'name email')
      .populate('service', 'name')
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({
      success: true,
      data: {
        stats: {
          totalUsers,
          totalServices,
          totalAppointments,
          pendingAppointments,
          totalNews,
          publishedNews
        },
        mostVisitedServices,
        recentAppointments
      }
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard statistics',
      error: error.message
    });
  }
});

// System Settings Management
router.get('/settings', async (req, res) => {
  try {
    const settings = await SystemSettings.getSettings();
    res.json({
      success: true,
      data: settings
    });
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch settings',
      error: error.message
    });
  }
});

router.put('/settings', async (req, res) => {
  try {
    const settings = await SystemSettings.updateSettings(req.body, req.user.userId);
    
    // Clear the maintenance mode cache so changes take effect immediately
    clearSettingsCache();
    
    res.json({
      success: true,
      message: 'Settings updated successfully',
      data: settings
    });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update settings',
      error: error.message
    });
  }
});

// User Management
router.get('/users', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const roleFilter = req.query.role; // Optional filter by role

    // Build query - show all users (user, staff, and admin roles)
    let query = {};
    if (roleFilter && ['user', 'staff', 'admin'].includes(roleFilter)) {
      query.role = roleFilter;
    }

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalUsers = await User.countDocuments(query);

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalUsers / limit),
          totalUsers,
          hasNext: page < Math.ceil(totalUsers / limit),
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users',
      error: error.message
    });
  }
});

router.patch('/users/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    const user = await User.findByIdAndUpdate(
      id,
      { isActive },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
      user
    });
  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user status',
      error: error.message
    });
  }
});

// Change user role (admin only)
router.patch('/users/:id/role', async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    // Validate role
    if (!role || !['user', 'admin'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Must be "user" or "admin"'
      });
    }

    // Prevent admin from demoting themselves
    if (id === req.user.userId && role === 'user') {
      return res.status(400).json({
        success: false,
        message: 'You cannot demote yourself from admin'
      });
    }

    const user = await User.findByIdAndUpdate(
      id,
      { role },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: `User role updated to ${role} successfully`,
      user
    });
  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user role',
      error: error.message
    });
  }
});

// Service Management
router.get('/services', async (req, res) => {
  try {
    const services = await Service.find()
      .populate('createdBy', 'name email')
      .populate('documents.template')
      .populate('documents.alternatives.template')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: services
    });
  } catch (error) {
    console.error('Get services error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch services',
      error: error.message
    });
  }
});

router.post('/services', async (req, res) => {
  try {
    const serviceData = {
      ...req.body,
      createdBy: req.user.userId
    };

    const service = new Service(serviceData);
    await service.save();

    // Auto-assign this new service to all existing active centers
    const { default: AkshayaCenter } = await import('../models/AkshayaCenter.js');
    const centers = await AkshayaCenter.find({ status: 'active' });
    
    let centersUpdated = 0;
    for (const center of centers) {
      // Check if service is not already assigned
      if (!center.services.includes(service._id)) {
        center.services.push(service._id);
        await center.save();
        centersUpdated++;
      }
    }

    const populatedService = await Service.findById(service._id)
      .populate('createdBy', 'name email')
      .populate('documents.template')
      .populate('documents.alternatives.template');

    res.status(201).json({
      success: true,
      message: `Service created successfully and automatically assigned to ${centersUpdated} centers`,
      data: populatedService,
      centersUpdated
    });
  } catch (error) {
    console.error('Create service error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create service',
      error: error.message
    });
  }
});

router.put('/services/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const service = await Service.findByIdAndUpdate(
      id,
      req.body,
      { new: true }
    ).populate('createdBy', 'name email')
     .populate('documents.template')
     .populate('documents.alternatives.template');

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    res.json({
      success: true,
      message: 'Service updated successfully',
      data: service
    });
  } catch (error) {
    console.error('Update service error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update service',
      error: error.message
    });
  }
});

router.delete('/services/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const service = await Service.findByIdAndDelete(id);

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    res.json({
      success: true,
      message: 'Service deleted successfully'
    });
  } catch (error) {
    console.error('Delete service error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete service',
      error: error.message
    });
  }
});

// News Management
router.get('/news', async (req, res) => {
  try {
    const news = await News.find()
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: news
    });
  } catch (error) {
    console.error('Get news error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch news',
      error: error.message
    });
  }
});

router.post('/news', upload.single('image'), async (req, res) => {
  try {
    const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;
    const imageUrl = req.file ? `${baseUrl}/uploads/${req.file.filename}` : undefined;

    const newsData = {
      ...req.body,
      imageUrl,
      createdBy: req.user.userId
    };

    const news = new News(newsData);
    await news.save();

    const populatedNews = await News.findById(news._id)
      .populate('createdBy', 'name email');

    res.status(201).json({
      success: true,
      message: 'News created successfully',
      data: populatedNews
    });
  } catch (error) {
    console.error('Create news error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create news',
      error: error.message
    });
  }
});

router.put('/news/:id', upload.single('image'), async (req, res) => {
  try {
    const { id } = req.params;

    const update = { ...req.body };
    if (req.file) {
      const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;
      update.imageUrl = `${baseUrl}/uploads/${req.file.filename}`;
    }

    const news = await News.findByIdAndUpdate(
      id,
      update,
      { new: true }
    ).populate('createdBy', 'name email');

    if (!news) {
      return res.status(404).json({
        success: false,
        message: 'News not found'
      });
    }

    res.json({
      success: true,
      message: 'News updated successfully',
      data: news
    });
  } catch (error) {
    console.error('Update news error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update news',
      error: error.message
    });
  }
});

router.delete('/news/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const news = await News.findByIdAndDelete(id);

    if (!news) {
      return res.status(404).json({
        success: false,
        message: 'News not found'
      });
    }

    res.json({
      success: true,
      message: 'News deleted successfully'
    });
  } catch (error) {
    console.error('Delete news error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete news',
      error: error.message
    });
  }
});

// Appointment Management (Read-Only for Monitoring)
router.get('/appointments', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const status = req.query.status;
    const centerId = req.query.center;

    let query = {};
    if (status) {
      query.status = status;
    }
    if (centerId) {
      query.center = centerId;
    }

    const appointments = await Appointment.find(query)
      .populate('user', 'name email phone')
      .populate('service', 'name category fee')
      .populate('center', 'name address.city address.district')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalAppointments = await Appointment.countDocuments(query);

    // Group appointments by center for better monitoring
    const appointmentsByCenter = {};
    appointments.forEach(appointment => {
      const centerName = appointment.center?.name || 'Unknown Center';
      if (!appointmentsByCenter[centerName]) {
        appointmentsByCenter[centerName] = [];
      }
      appointmentsByCenter[centerName].push(appointment);
    });

    res.json({
      success: true,
      data: {
        appointments,
        appointmentsByCenter,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalAppointments / limit),
          totalAppointments,
          hasNext: page < Math.ceil(totalAppointments / limit),
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    console.error('Get appointments error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch appointments',
      error: error.message
    });
  }
});

// Get appointment statistics by center (Read-Only)
router.get('/appointments/stats', async (req, res) => {
  try {
    const { period = 'month' } = req.query;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let startDate, endDate;
    
    switch (period) {
      case 'today':
        startDate = new Date(today);
        endDate = new Date(today);
        endDate.setDate(endDate.getDate() + 1);
        break;
      case 'week':
        startDate = new Date(today);
        startDate.setDate(startDate.getDate() - 7);
        endDate = new Date(today);
        endDate.setDate(endDate.getDate() + 1);
        break;
      case 'month':
        startDate = new Date(today);
        startDate.setMonth(startDate.getMonth() - 1);
        endDate = new Date(today);
        endDate.setDate(endDate.getDate() + 1);
        break;
      default:
        startDate = new Date(today);
        startDate.setMonth(startDate.getMonth() - 1);
        endDate = new Date(today);
        endDate.setDate(endDate.getDate() + 1);
    }

    // Get appointments with center and service info
    const appointments = await Appointment.find({
      appointmentDate: { $gte: startDate, $lt: endDate }
    })
    .populate('center', 'name address.city address.district')
    .populate('service', 'name category');

    // Calculate statistics by center
    const centerStats = {};
    const serviceStats = {};
    const statusStats = {
      pending: 0,
      confirmed: 0,
      in_progress: 0,
      completed: 0,
      cancelled: 0
    };

    appointments.forEach(appointment => {
      const centerName = appointment.center?.name || 'Unknown Center';
      const serviceName = appointment.service?.name || 'Unknown Service';
      const status = appointment.status;

      // Center statistics
      if (!centerStats[centerName]) {
        centerStats[centerName] = {
          total: 0,
          pending: 0,
          confirmed: 0,
          in_progress: 0,
          completed: 0,
          cancelled: 0,
          location: appointment.center?.address?.city || 'Unknown'
        };
      }
      centerStats[centerName].total++;
      centerStats[centerName][status]++;

      // Service statistics
      if (!serviceStats[serviceName]) {
        serviceStats[serviceName] = 0;
      }
      serviceStats[serviceName]++;

      // Overall status statistics
      statusStats[status]++;
    });

    res.json({
      success: true,
      data: {
        period,
        dateRange: { startDate, endDate },
        totalAppointments: appointments.length,
        centerStats,
        serviceStats,
        statusStats
      }
    });

  } catch (error) {
    console.error('Get appointment stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch appointment statistics',
      error: error.message
    });
  }
});

// Payments admin actions (refund)
router.use('/payments', paymentRoutes);

// Admin broadcast notification to appointment holders or all users
router.post('/broadcast/appointments', async (req, res) => {
  try {
    const { date, title, message, sendToAll } = req.body;
    if (!title || !message) {
      return res.status(400).json({ success: false, message: 'title and message are required' });
    }

    let recipientIds = [];

    if (sendToAll) {
      const users = await User.find({ role: 'user', isActive: true }).select('_id');
      recipientIds = users.map(userDoc => String(userDoc._id));
    } else {
      if (!date) {
        return res.status(400).json({ success: false, message: 'date is required unless sendToAll is true' });
      }

      const dayStart = new Date(date);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);

      // Find all appointments on the date
      const appointments = await Appointment.find({
        appointmentDate: { $gte: dayStart, $lt: dayEnd },
        status: { $in: ['pending', 'confirmed'] }
      }).select('user service');

      if (appointments.length === 0) {
        return res.json({ success: true, message: 'No appointments found for the specified date', data: { count: 0 } });
      }

      // Build unique user list
      recipientIds = [...new Set(appointments.map(a => String(a.user)))];
    }

    if (recipientIds.length === 0) {
      return res.json({ success: true, message: 'No recipients found for this broadcast', data: { recipients: 0 } });
    }

    // Create notifications in bulk
    const docs = recipientIds.map(uid => ({
      user: uid,
      type: 'broadcast',
      title,
      message,
      meta: sendToAll ? { scope: 'all-users' } : { scope: 'date', date }
    }));
    await Notification.insertMany(docs);

    return res.json({ success: true, message: 'Broadcast sent', data: { recipients: recipientIds.length } });
  } catch (error) {
    console.error('Broadcast error:', error);
    return res.status(500).json({ success: false, message: 'Failed to send broadcast', error: error.message });
  }
});

// Get admin notifications (staff registrations, etc.)
router.get('/notifications', async (req, res) => {
  try {
    const notifications = await Notification.find({ 
      user: req.user.userId,
      type: { $in: ['staff_registration', 'broadcast', 'system'] }
    })
    .sort({ createdAt: -1 })
    .limit(50);

    const unreadCount = await Notification.countDocuments({ 
      user: req.user.userId, 
      isRead: false,
      type: { $in: ['staff_registration', 'broadcast', 'system'] }
    });

    res.json({
      success: true,
      data: {
        notifications,
        unreadCount
      }
    });
  } catch (error) {
    console.error('Get admin notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications',
      error: error.message
    });
  }
});

// Mark admin notifications as read
router.post('/notifications/mark-read', async (req, res) => {
  try {
    await Notification.updateMany(
      { 
        user: req.user.userId, 
        isRead: false,
        type: { $in: ['staff_registration', 'broadcast', 'system'] }
      }, 
      { $set: { isRead: true } }
    );

    res.json({
      success: true,
      message: 'Notifications marked as read'
    });
  } catch (error) {
    console.error('Mark notifications read error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark notifications as read',
      error: error.message
    });
  }
});

// Admin Service Management for Centers
router.get('/centers/:id/services', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Import AkshayaCenter model dynamically
    const { default: AkshayaCenter } = await import('../models/AkshayaCenter.js');
    
    const center = await AkshayaCenter.findById(id)
      .populate('services', 'name description category fee processingTime requiredDocuments');
    
    if (!center) {
      return res.status(404).json({
        success: false,
        message: 'Center not found'
      });
    }

    res.json({
      success: true,
      services: center.services || []
    });
  } catch (error) {
    console.error('Get center services error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch center services',
      error: error.message
    });
  }
});

router.post('/centers/:id/services/enable-all', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Import models dynamically
    const { default: AkshayaCenter } = await import('../models/AkshayaCenter.js');
    
    const center = await AkshayaCenter.findById(id);
    if (!center) {
      return res.status(404).json({
        success: false,
        message: 'Center not found'
      });
    }

    // Get all active services
    const allServices = await Service.find({ isActive: true }).select('_id');
    const allServiceIds = allServices.map(s => s._id);

    // Add all services to center (avoiding duplicates)
    const existingServiceIds = center.services.map(s => s.toString());
    const newServiceIds = allServiceIds.filter(sId => !existingServiceIds.includes(sId.toString()));
    
    center.services.push(...newServiceIds);
    await center.save();

    res.json({
      success: true,
      message: `All services enabled for center. Added ${newServiceIds.length} new services.`,
      addedServices: newServiceIds.length
    });
  } catch (error) {
    console.error('Enable all services for center error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to enable all services for center',
      error: error.message
    });
  }
});

router.post('/centers/:id/services/:serviceId', async (req, res) => {
  try {
    const { id, serviceId } = req.params;
    
    // Import models dynamically
    const { default: AkshayaCenter } = await import('../models/AkshayaCenter.js');
    
    const center = await AkshayaCenter.findById(id);
    if (!center) {
      return res.status(404).json({
        success: false,
        message: 'Center not found'
      });
    }

    // Verify service exists
    const service = await Service.findById(serviceId);
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    // Add service to center if not already present
    if (!center.services.includes(serviceId)) {
      center.services.push(serviceId);
      await center.save();
    }

    res.json({
      success: true,
      message: 'Service enabled for center successfully'
    });
  } catch (error) {
    console.error('Enable service for center error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to enable service for center',
      error: error.message
    });
  }
});

router.delete('/centers/:id/services/:serviceId', async (req, res) => {
  try {
    const { id, serviceId } = req.params;
    
    // Import AkshayaCenter model dynamically
    const { default: AkshayaCenter } = await import('../models/AkshayaCenter.js');
    
    const center = await AkshayaCenter.findById(id);
    if (!center) {
      return res.status(404).json({
        success: false,
        message: 'Center not found'
      });
    }

    // Remove service from center
    center.services = center.services.filter(sId => sId.toString() !== serviceId);
    await center.save();

    res.json({
      success: true,
      message: 'Service disabled for center successfully'
    });
  } catch (error) {
    console.error('Disable service for center error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to disable service for center',
      error: error.message
    });
  }
});

// Holidays management
router.get('/holidays', async (req, res) => {
  try {
    const { month, year } = req.query;
    let query = {};
    if (month && year) {
      const start = new Date(parseInt(year), parseInt(month) - 1, 1);
      const end = new Date(parseInt(year), parseInt(month), 1);
      query.date = { $gte: start, $lt: end };
    }
    const holidays = await Holiday.find(query).sort({ date: 1 });
    return res.json({ success: true, data: holidays });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch holidays', error: error.message });
  }
});

router.post('/holidays', async (req, res) => {
  try {
    const { date, reason } = req.body;
    if (!date) return res.status(400).json({ success: false, message: 'date is required' });
    const doc = await Holiday.create({ date, reason, createdBy: req.user.userId });
    return res.status(201).json({ success: true, data: doc });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Holiday already exists for this date' });
    }
    return res.status(500).json({ success: false, message: 'Failed to create holiday', error: error.message });
  }
});

router.delete('/holidays/:id', async (req, res) => {
  try {
    await Holiday.findByIdAndDelete(req.params.id);
    return res.json({ success: true, message: 'Holiday removed' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to delete holiday', error: error.message });
  }
});

export default router;