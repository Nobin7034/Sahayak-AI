import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Staff from '../models/Staff.js';
import AkshayaCenter from '../models/AkshayaCenter.js';
import { staffAuth, requirePermission, centerAccess } from '../middleware/staffAuth.js';

const router = express.Router();

// Staff login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // Find user
    const user = await User.findOne({ email, isActive: true });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if user has staff role
    if (user.role !== 'staff' && user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Staff privileges required.'
      });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Get staff record for staff users
    let staffRecord = null;
    if (user.role === 'staff') {
      staffRecord = await Staff.findByUserId(user._id);
      
      if (!staffRecord || !staffRecord.isActive) {
        return res.status(403).json({
          success: false,
          message: 'Staff assignment not found or inactive. Please contact administrator.'
        });
      }

      // Update last login
      await staffRecord.updateLastLogin();
    }

    // Update user last login
    user.lastLogin = new Date();
    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Prepare response data
    const responseData = {
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    };

    if (staffRecord) {
      responseData.staff = {
        id: staffRecord._id,
        centerId: staffRecord.center._id,
        centerName: staffRecord.center.name,
        role: staffRecord.role,
        permissions: staffRecord.permissions,
        workingHours: staffRecord.workingHours,
        preferences: staffRecord.preferences
      };
    }

    res.json({
      success: true,
      message: 'Login successful',
      data: responseData
    });

  } catch (error) {
    console.error('Staff login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: error.message
    });
  }
});

// Get staff profile
router.get('/profile', staffAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    
    let staffRecord = null;
    if (req.user.role === 'staff') {
      staffRecord = await Staff.findByUserId(req.user.userId);
    }

    const responseData = {
      user,
      staff: staffRecord
    };

    res.json({
      success: true,
      data: responseData
    });

  } catch (error) {
    console.error('Get staff profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch profile',
      error: error.message
    });
  }
});

// Update staff profile
router.put('/profile', staffAuth, async (req, res) => {
  try {
    const { name, phone, preferences, workingHours } = req.body;

    // Update user information
    const user = await User.findById(req.user.userId);
    if (name) user.name = name;
    if (phone) user.phone = phone;
    await user.save();

    // Update staff-specific information
    if (req.user.role === 'staff') {
      const staffRecord = await Staff.findByUserId(req.user.userId);
      
      if (preferences) {
        staffRecord.preferences = { ...staffRecord.preferences, ...preferences };
      }
      
      if (workingHours) {
        staffRecord.workingHours = { ...staffRecord.workingHours, ...workingHours };
      }
      
      await staffRecord.save();
    }

    res.json({
      success: true,
      message: 'Profile updated successfully'
    });

  } catch (error) {
    console.error('Update staff profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile',
      error: error.message
    });
  }
});

// Change password
router.post('/change-password', staffAuth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long'
      });
    }

    const user = await User.findById(req.user.userId);
    
    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.password);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Hash new password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
    
    // Update password
    user.password = hashedPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to change password',
      error: error.message
    });
  }
});

// Get staff dashboard data
router.get('/dashboard', staffAuth, centerAccess, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Import models dynamically to avoid circular dependency
    const { default: Appointment } = await import('../models/Appointment.js');
    const { default: AkshayaCenter } = await import('../models/AkshayaCenter.js');
    const { default: CenterRating } = await import('../models/CenterRating.js');

    // Get center details from database
    const center = await AkshayaCenter.findById(req.staff.centerId)
      .populate('services', 'name category fee');

    if (!center) {
      return res.status(404).json({
        success: false,
        message: 'Center not found'
      });
    }

    // Get today's appointments for the center
    const todayAppointments = await Appointment.find({
      center: req.staff.centerId,
      appointmentDate: { $gte: today, $lt: tomorrow }
    }).populate('service', 'name category fee').populate('user', 'name email phone');

    // Calculate dashboard metrics
    const totalToday = todayAppointments.length;
    const pendingApprovals = todayAppointments.filter(apt => apt.status === 'pending').length;
    const completedToday = todayAppointments.filter(apt => apt.status === 'completed').length;
    const inProgress = todayAppointments.filter(apt => apt.status === 'in_progress').length;
    const confirmedToday = todayAppointments.filter(apt => apt.status === 'confirmed').length;

    // Calculate today's revenue from completed appointments
    const todayRevenue = todayAppointments
      .filter(apt => apt.status === 'completed' && apt.payment?.status === 'paid')
      .reduce((sum, apt) => sum + (apt.service?.fee || 0), 0);

    // Get live center rating from CenterRating model
    const centerRatingStats = await CenterRating.calculateCenterRating(req.staff.centerId);
    const avgRating = centerRatingStats.avgRating || 0;
    const totalRatings = centerRatingStats.totalRatings || 0;

    // Get upcoming appointments (next 5 confirmed or in-progress)
    const upcomingAppointments = todayAppointments
      .filter(apt => apt.status === 'confirmed' || apt.status === 'in_progress')
      .sort((a, b) => a.timeSlot.localeCompare(b.timeSlot))
      .slice(0, 5);

    // Get recent activity (last 10 status changes today)
    const recentActivity = [];
    todayAppointments
      .filter(apt => apt.statusHistory && apt.statusHistory.length > 0)
      .forEach(apt => {
        const latestStatus = apt.statusHistory[apt.statusHistory.length - 1];
        if (latestStatus) {
          const timeAgo = getTimeAgo(latestStatus.changedAt);
          let message = '';
          
          switch (latestStatus.status) {
            case 'confirmed':
              message = `Appointment confirmed for ${apt.user?.name || 'User'}`;
              break;
            case 'in_progress':
              message = `Started processing ${apt.service?.name || 'service'} for ${apt.user?.name || 'User'}`;
              break;
            case 'completed':
              message = `Completed ${apt.service?.name || 'service'} for ${apt.user?.name || 'User'}`;
              break;
            case 'cancelled':
              message = `Appointment cancelled for ${apt.user?.name || 'User'}`;
              break;
            default:
              message = `Status updated to ${latestStatus.status} for ${apt.user?.name || 'User'}`;
          }
          
          recentActivity.push({
            type: 'appointment',
            message,
            time: timeAgo,
            timestamp: latestStatus.changedAt
          });
        }
      });

    // Sort by timestamp and take last 10
    recentActivity.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    const limitedActivity = recentActivity.slice(0, 10).map(({ timestamp, ...rest }) => rest);

    // Get center status
    const currentHour = new Date().getHours();
    const isWorking = currentHour >= 9 && currentHour < 17; // Simple working hours check

    const centerStatus = {
      centerName: center.name,
      isWorking: isWorking,
      todayHours: '9:00 AM - 5:00 PM',
      address: center.address ? `${center.address.street}, ${center.address.city}` : 'Address not available',
      contact: center.contact?.phone || 'Contact not available',
      email: center.contact?.email || 'Email not available',
      district: center.address?.district || 'District not available',
      state: center.address?.state || 'Kerala',
      activeServices: center.services?.length || 0,
      rating: parseFloat(avgRating.toFixed(1)),
      totalRatings: totalRatings,
      todayVisitors: totalToday // Live visitor count from today's appointments
    };

    const dashboardData = {
      metrics: {
        totalToday,
        pendingApprovals,
        completedToday,
        inProgress,
        confirmedToday,
        todayRevenue,
        avgRating: parseFloat(avgRating.toFixed(1)),
        todayVisits: totalToday,
        totalRatings: totalRatings
      },
      upcomingAppointments,
      centerStatus,
      recentActivity: limitedActivity,
      lastUpdated: new Date()
    };

    res.json({
      success: true,
      data: dashboardData
    });

  } catch (error) {
    console.error('Get dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard data',
      error: error.message
    });
  }
});

// Helper function to calculate time ago
function getTimeAgo(date) {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  
  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
  return `${Math.floor(seconds / 86400)} days ago`;
}

// Get appointments for staff center
router.get('/appointments', staffAuth, centerAccess, requirePermission('manage_appointments'), async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      dateRange = 'today', 
      status = 'all', 
      serviceType = 'all', 
      searchTerm = '' 
    } = req.query;

    // Import Appointment model dynamically to avoid circular dependency
    const { default: Appointment } = await import('../models/Appointment.js');

    // Build date filter
    let dateFilter = {};
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    switch (dateRange) {
      case 'today':
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        dateFilter = { appointmentDate: { $gte: today, $lt: tomorrow } };
        break;
      case 'tomorrow':
        const dayAfterTomorrow = new Date(today);
        dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
        const tomorrowStart = new Date(today);
        tomorrowStart.setDate(tomorrowStart.getDate() + 1);
        dateFilter = { appointmentDate: { $gte: tomorrowStart, $lt: dayAfterTomorrow } };
        break;
      case 'week':
        // Get the start of the current week (Sunday)
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay()); // Go back to Sunday
        weekStart.setHours(0, 0, 0, 0);
        // Get the end of the current week (Saturday)
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 7); // Next Sunday (exclusive)
        weekEnd.setHours(0, 0, 0, 0);
        dateFilter = { appointmentDate: { $gte: weekStart, $lt: weekEnd } };
        break;
      case 'month':
        // Start of current month
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        monthStart.setHours(0, 0, 0, 0);
        // Start of next month
        const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 1);
        monthEnd.setHours(0, 0, 0, 0);
        dateFilter = { appointmentDate: { $gte: monthStart, $lt: monthEnd } };
        break;
      case 'all':
        // No date filter for 'all' - shows all appointments for this center
        dateFilter = {};
        break;
      default:
        // Default to today if invalid dateRange
        const defaultTomorrow = new Date(today);
        defaultTomorrow.setDate(defaultTomorrow.getDate() + 1);
        dateFilter = { appointmentDate: { $gte: today, $lt: defaultTomorrow } };
        break;
    }

    // Build query - CRITICAL: Only appointments for this staff's center
    const query = {
      center: req.staff.centerId, // Enforce center-specific access
      ...dateFilter
    };

    // Add status filter
    if (status !== 'all') {
      query.status = status;
    }

    // Build aggregation pipeline for search and filtering
    const pipeline = [
      { $match: query },
      {
        $lookup: {
          from: 'users',
          localField: 'user',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $lookup: {
          from: 'services',
          localField: 'service',
          foreignField: '_id',
          as: 'service'
        }
      },
      {
        $lookup: {
          from: 'akshayacenters',
          localField: 'center',
          foreignField: '_id',
          as: 'center'
        }
      },
      { $unwind: '$user' },
      { $unwind: '$service' },
      { $unwind: '$center' }
    ];

    // Add search filter
    if (searchTerm) {
      pipeline.push({
        $match: {
          $or: [
            { 'user.name': { $regex: searchTerm, $options: 'i' } },
            { 'service.name': { $regex: searchTerm, $options: 'i' } },
            { '_id': { $regex: searchTerm, $options: 'i' } }
          ]
        }
      });
    }

    // Add service filter (by service ID)
    if (serviceType !== 'all' && mongoose.Types.ObjectId.isValid(serviceType)) {
      pipeline.push({
        $match: {
          'service._id': new mongoose.Types.ObjectId(serviceType)
        }
      });
    }

    // Add sorting
    pipeline.push({
      $sort: { appointmentDate: 1, timeSlot: 1 }
    });

    // Execute aggregation for total count
    const totalPipeline = [...pipeline, { $count: 'total' }];
    const totalResult = await Appointment.aggregate(totalPipeline);
    const total = totalResult.length > 0 ? totalResult[0].total : 0;

    // Add pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    pipeline.push(
      { $skip: skip },
      { $limit: parseInt(limit) }
    );

    // Execute main query
    const appointments = await Appointment.aggregate(pipeline);

    const totalPages = Math.ceil(total / parseInt(limit));

    res.json({
      success: true,
      data: {
        appointments,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages
        },
        centerInfo: {
          centerId: req.staff.centerId,
          centerName: req.staff.centerName
        }
      }
    });

  } catch (error) {
    console.error('Get staff appointments error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch appointments',
      error: error.message
    });
  }
});

// Update appointment status - ONLY STAFF CAN UPDATE STATUS
router.put('/appointments/:id/status', staffAuth, centerAccess, requirePermission('update_status'), async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reason, notes } = req.body;

    // Import Appointment model dynamically
    const { default: Appointment } = await import('../models/Appointment.js');
    const { default: Notification } = await import('../models/Notification.js');

    // Validate status
    const validStatuses = ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'rejected'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Valid statuses: ' + validStatuses.join(', ')
      });
    }

    // Find appointment - CRITICAL: ensure it belongs to staff's center ONLY
    const appointment = await Appointment.findOne({
      _id: id,
      center: req.staff.centerId // Enforce center-specific access
    }).populate('user', 'name email phone').populate('service', 'name category');

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found or not accessible from your center'
      });
    }

    // Validate status transition
    const validTransitions = {
      'pending': ['confirmed', 'rejected', 'cancelled'],
      'confirmed': ['in_progress', 'cancelled'],
      'in_progress': ['completed', 'cancelled'],
      'completed': [], // Cannot change from completed
      'cancelled': [], // Cannot change from cancelled
      'rejected': [] // Cannot change from rejected
    };

    if (!validTransitions[appointment.status].includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot change status from ${appointment.status} to ${status}`
      });
    }

    const oldStatus = appointment.status;
    appointment.status = status;
    
    // Add to status history
    if (!appointment.statusHistory) {
      appointment.statusHistory = [];
    }
    
    appointment.statusHistory.push({
      status,
      changedBy: req.user.userId,
      changedAt: new Date(),
      reason: reason || notes,
      staffName: req.user.name,
      centerName: req.staff.centerName
    });

    // Set completion time for completed appointments
    if (status === 'completed') {
      appointment.completedAt = new Date();
      
      // Calculate actual duration if there's an in_progress entry
      const inProgressEntry = appointment.statusHistory.find(h => h.status === 'in_progress');
      if (inProgressEntry) {
        const duration = Math.round((appointment.completedAt - inProgressEntry.changedAt) / (1000 * 60));
        appointment.actualDuration = duration;
      }
    }

    // Add processing notes if provided
    if (notes) {
      appointment.processingNotes = notes;
    }

    await appointment.save();

    // Send notification to user about status change
    try {
      const statusMessages = {
        'confirmed': 'Your appointment has been confirmed by the center staff.',
        'in_progress': 'Your appointment is now in progress.',
        'completed': 'Your appointment has been completed successfully.',
        'cancelled': 'Your appointment has been cancelled by the center staff.',
        'rejected': 'Your appointment has been rejected. Please contact the center for more information.'
      };

      if (statusMessages[status]) {
        await Notification.create({
          user: appointment.user._id,
          type: 'appointment_status',
          title: 'Appointment Status Update',
          message: statusMessages[status],
          meta: { 
            appointmentId: appointment._id, 
            status,
            oldStatus,
            centerId: appointment.center,
            centerName: req.staff.centerName,
            serviceId: appointment.service._id,
            updatedBy: req.user.name
          }
        });
      }
    } catch (notificationError) {
      console.error('Failed to send status notification:', notificationError);
      // Don't fail the status update if notification fails
    }

    res.json({
      success: true,
      message: `Appointment status updated from ${oldStatus} to ${status}`,
      data: {
        appointmentId: appointment._id,
        oldStatus,
        newStatus: status,
        updatedBy: req.user.name,
        updatedAt: new Date(),
        centerName: req.staff.centerName
      }
    });

  } catch (error) {
    console.error('Update appointment status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update appointment status',
      error: error.message
    });
  }
});

// Get appointment details
router.get('/appointments/:id', staffAuth, centerAccess, requirePermission('manage_appointments'), async (req, res) => {
  try {
    const { id } = req.params;

    // Import Appointment model dynamically
    const { default: Appointment } = await import('../models/Appointment.js');

    const appointment = await Appointment.findOne({
      _id: id,
      ...req.centerFilter
    })
    .populate('user', 'name email phone')
    .populate('service', 'name category fees processingTime requiredDocuments')
    .populate('center', 'name address contact');

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    res.json({
      success: true,
      data: appointment
    });

  } catch (error) {
    console.error('Get appointment details error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch appointment details',
      error: error.message
    });
  }
});

// Add comment/note to appointment
router.post('/appointments/:id/notes', staffAuth, centerAccess, requirePermission('manage_appointments'), async (req, res) => {
  try {
    const { id } = req.params;
    const { content, isVisible = true } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Note content is required'
      });
    }

    // Import Appointment model dynamically
    const { default: Appointment } = await import('../models/Appointment.js');

    // Find appointment - ensure it belongs to staff's center
    const appointment = await Appointment.findOne({
      _id: id,
      ...req.centerFilter
    });

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    // Add note
    if (!appointment.staffNotes) {
      appointment.staffNotes = [];
    }

    const note = {
      author: req.user.userId,
      content: content.trim(),
      isVisible: Boolean(isVisible),
      createdAt: new Date()
    };

    appointment.staffNotes.push(note);
    await appointment.save();

    res.json({
      success: true,
      message: 'Note added successfully',
      data: note
    });

  } catch (error) {
    console.error('Add appointment note error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add note',
      error: error.message
    });
  }
});

// Get appointment statistics for staff center
router.get('/appointments/stats/summary', staffAuth, centerAccess, requirePermission('view_reports'), async (req, res) => {
  try {
    const { period = 'today' } = req.query;

    // Import Appointment model dynamically
    const { default: Appointment } = await import('../models/Appointment.js');

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
        startDate.setDate(startDate.getDate() - startDate.getDay()); // Start of week
        endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 7);
        break;
      case 'month':
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        endDate = new Date(today.getFullYear(), today.getMonth() + 1, 1);
        break;
      default:
        startDate = new Date(today);
        endDate = new Date(today);
        endDate.setDate(endDate.getDate() + 1);
    }

    // Get appointments for the period
    const appointments = await Appointment.find({
      ...req.centerFilter,
      appointmentDate: { $gte: startDate, $lt: endDate }
    }).populate('service', 'name category');

    // Calculate statistics
    const stats = {
      total: appointments.length,
      pending: appointments.filter(a => a.status === 'pending').length,
      confirmed: appointments.filter(a => a.status === 'confirmed').length,
      inProgress: appointments.filter(a => a.status === 'in_progress').length,
      completed: appointments.filter(a => a.status === 'completed').length,
      cancelled: appointments.filter(a => a.status === 'cancelled').length,
      byService: {}
    };

    // Group by service
    appointments.forEach(appointment => {
      const serviceName = appointment.service?.name || 'Unknown';
      if (!stats.byService[serviceName]) {
        stats.byService[serviceName] = 0;
      }
      stats.byService[serviceName]++;
    });

    res.json({
      success: true,
      data: {
        period,
        dateRange: { startDate, endDate },
        stats
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

// Add comment to appointment
router.post('/appointments/:id/comments', staffAuth, centerAccess, requirePermission('add_comments'), async (req, res) => {
  try {
    const { id } = req.params;
    const { comment, isVisible = true } = req.body;

    if (!comment || comment.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Comment content is required'
      });
    }

    // Import Appointment model dynamically
    const { default: Appointment } = await import('../models/Appointment.js');

    // Find appointment - ensure it belongs to staff's center
    const appointment = await Appointment.findOne({
      _id: id,
      center: req.staff.centerId
    });

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found or not accessible from your center'
      });
    }

    // Add comment
    if (!appointment.comments) {
      appointment.comments = [];
    }

    const newComment = {
      author: req.user.userId,
      authorType: 'staff',
      content: comment.trim(),
      isVisible: Boolean(isVisible),
      createdAt: new Date()
    };

    appointment.comments.push(newComment);
    await appointment.save();

    res.json({
      success: true,
      message: 'Comment added successfully',
      data: newComment
    });

  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add comment',
      error: error.message
    });
  }
});

// Get appointment details
router.get('/appointments/:id', staffAuth, centerAccess, requirePermission('manage_appointments'), async (req, res) => {
  try {
    const { id } = req.params;

    // Import Appointment model dynamically
    const { default: Appointment } = await import('../models/Appointment.js');

    const appointment = await Appointment.findOne({
      _id: id,
      ...req.centerFilter
    })
    .populate('user', 'name email phone')
    .populate('service', 'name description category fees processingTime requiredDocuments')
    .populate('center', 'name address contact')
    .populate('comments.author', 'name')
    .populate('statusHistory.changedBy', 'name');

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    res.json({
      success: true,
      data: appointment
    });

  } catch (error) {
    console.error('Get appointment details error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch appointment details',
      error: error.message
    });
  }
});

// Get available services (global list - all services admin provides)
// Get all available services (no permission required - all staff should see services)
router.get('/services/available', staffAuth, async (req, res) => {
  try {
    // Import Service model dynamically
    const { default: Service } = await import('../models/Service.js');
    const { default: AkshayaCenter } = await import('../models/AkshayaCenter.js');

    // Get ALL active services that admin has created (global list)
    const services = await Service.find({ isActive: true })
      .select('name description category fee processingTime requiredDocuments')
      .sort({ category: 1, name: 1 });

    // Get center to check which services are enabled/hidden by this specific staff
    const center = await AkshayaCenter.findById(req.staff.centerId);
    const hiddenServiceIds = center?.hiddenServices?.map(id => id.toString()) || [];
    const enabledServiceIds = center?.services?.map(id => id.toString()) || [];

    // Transform the data - ALL services show as disabled by default
    const transformedServices = services.map(service => {
      const serviceId = service._id.toString();
      const isHidden = hiddenServiceIds.includes(serviceId);
      const isEnabled = enabledServiceIds.includes(serviceId);
      
      return {
        ...service.toObject(),
        fees: service.fee, // Map fee to fees for frontend compatibility
        isHidden: isHidden,
        isEnabled: isEnabled, // Only true if staff manually enabled it
        // Add center-specific settings
        availabilityNotes: center?.serviceSettings?.[serviceId]?.availabilityNotes || '',
        estimatedDuration: center?.serviceSettings?.[serviceId]?.estimatedDuration || '',
        // Add center-specific status
        centerStatus: {
          isHidden: isHidden,
          isEnabled: isEnabled,
          canEnable: !isHidden && service.isActive, // Can enable if not hidden and admin hasn't disabled globally
          canHide: true, // Can always hide
          isGloballyActive: service.isActive // Track admin's global control
        }
      };
    });

    res.json({
      success: true,
      data: transformedServices,
      meta: {
        total: transformedServices.length,
        enabled: transformedServices.filter(s => s.isEnabled).length,
        hidden: transformedServices.filter(s => s.isHidden).length,
        available: transformedServices.filter(s => !s.isHidden && s.centerStatus.isGloballyActive).length,
        globallyActive: transformedServices.filter(s => s.centerStatus.isGloballyActive).length
      }
    });

  } catch (error) {
    console.error('Get available services error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch available services',
      error: error.message
    });
  }
});

// Get center services (services enabled at this center)
// Get center services (services enabled at this center) - requires permission
router.get('/services/center', staffAuth, centerAccess, requirePermission('manage_services'), async (req, res) => {
  try {
    // Import models dynamically
    const { default: AkshayaCenter } = await import('../models/AkshayaCenter.js');

    const center = await AkshayaCenter.findById(req.staff.centerId)
      .populate('services', 'name description category fee processingTime');

    if (!center) {
      return res.status(404).json({
        success: false,
        message: 'Center not found'
      });
    }

    // Add center-specific settings to services
    const centerServices = center.services.map(service => ({
      ...service.toObject(),
      fees: service.fee, // Map fee to fees for frontend compatibility
      isEnabled: true,
      // Add any center-specific settings here
      availabilityNotes: center.serviceSettings?.[service._id]?.availabilityNotes || '',
      estimatedDuration: center.serviceSettings?.[service._id]?.estimatedDuration || ''
    }));

    res.json({
      success: true,
      data: centerServices
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

// Toggle service availability at center
// Toggle service availability at center - requires permission
router.put('/services/:id/toggle', staffAuth, centerAccess, requirePermission('manage_services'), async (req, res) => {
  try {
    const { id } = req.params;
    const { enabled } = req.body;

    // Import models dynamically
    const { default: AkshayaCenter } = await import('../models/AkshayaCenter.js');
    const { default: Service } = await import('../models/Service.js');

    // Verify service exists and is globally active (admin control)
    const service = await Service.findById(id);
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    if (!service.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Service has been disabled by admin and cannot be enabled'
      });
    }

    // Get center
    const center = await AkshayaCenter.findById(req.staff.centerId);
    if (!center) {
      return res.status(404).json({
        success: false,
        message: 'Center not found'
      });
    }

    // Check if service is hidden by staff
    const isHidden = center.hiddenServices?.includes(id);
    if (isHidden && enabled) {
      return res.status(400).json({
        success: false,
        message: 'Cannot enable a hidden service. Unhide it first.'
      });
    }

    // Update center services
    if (enabled) {
      // Add service to center if not already present
      if (!center.services.includes(id)) {
        center.services.push(id);
      }
    } else {
      // Remove service from center
      center.services = center.services.filter(serviceId => serviceId.toString() !== id);
    }

    await center.save();

    res.json({
      success: true,
      message: `Service ${enabled ? 'enabled' : 'disabled'} successfully`,
      data: {
        serviceId: id,
        serviceName: service.name,
        enabled: enabled,
        centerName: center.name
      }
    });

  } catch (error) {
    console.error('Toggle service error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update service availability',
      error: error.message
    });
  }
});

// Update service settings at center
router.put('/services/:id/settings', staffAuth, centerAccess, requirePermission('manage_services'), async (req, res) => {
  try {
    const { id } = req.params;
    const { availabilityNotes, estimatedDuration } = req.body;

    // Import models dynamically
    const { default: AkshayaCenter } = await import('../models/AkshayaCenter.js');

    // Get center
    const center = await AkshayaCenter.findById(req.staff.centerId);
    if (!center) {
      return res.status(404).json({
        success: false,
        message: 'Center not found'
      });
    }

    // Initialize serviceSettings if not exists
    if (!center.serviceSettings) {
      center.serviceSettings = {};
    }

    // Update service settings
    center.serviceSettings[id] = {
      availabilityNotes: availabilityNotes || '',
      estimatedDuration: estimatedDuration ? parseInt(estimatedDuration) : null,
      updatedAt: new Date(),
      updatedBy: req.user.userId
    };

    // Mark the field as modified for Mongoose
    center.markModified('serviceSettings');
    await center.save();

    res.json({
      success: true,
      message: 'Service settings updated successfully'
    });

  } catch (error) {
    console.error('Update service settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update service settings',
      error: error.message
    });
  }
});

// Hide/unhide service for staff (not permanent delete)
router.put('/services/:id/hide', staffAuth, centerAccess, requirePermission('manage_services'), async (req, res) => {
  try {
    const { id } = req.params;
    const { hidden } = req.body;

    // Import models dynamically
    const { default: AkshayaCenter } = await import('../models/AkshayaCenter.js');
    const { default: Service } = await import('../models/Service.js');

    // Verify service exists
    const service = await Service.findById(id);
    if (!service || !service.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Service not found or inactive'
      });
    }

    // Get center
    const center = await AkshayaCenter.findById(req.staff.centerId);
    if (!center) {
      return res.status(404).json({
        success: false,
        message: 'Center not found'
      });
    }

    // Initialize hiddenServices array if not exists
    if (!center.hiddenServices) {
      center.hiddenServices = [];
    }

    // Update hidden services list
    if (hidden) {
      // Add service to hidden list if not already present
      if (!center.hiddenServices.includes(id)) {
        center.hiddenServices.push(id);
      }
    } else {
      // Remove service from hidden list
      center.hiddenServices = center.hiddenServices.filter(serviceId => serviceId.toString() !== id);
    }

    await center.save();

    res.json({
      success: true,
      message: `Service ${hidden ? 'hidden' : 'unhidden'} successfully`
    });

  } catch (error) {
    console.error('Hide service error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update service visibility',
      error: error.message
    });
  }
});

// Get hidden services for staff
router.get('/services/hidden', staffAuth, centerAccess, requirePermission('manage_services'), async (req, res) => {
  try {
    // Import models dynamically
    const { default: AkshayaCenter } = await import('../models/AkshayaCenter.js');

    const center = await AkshayaCenter.findById(req.staff.centerId)
      .populate('hiddenServices', 'name description category fee processingTime');

    if (!center) {
      return res.status(404).json({
        success: false,
        message: 'Center not found'
      });
    }

    // Transform hidden services data
    const hiddenServices = (center.hiddenServices || []).map(service => ({
      ...service.toObject(),
      fees: service.fee, // Map fee to fees for frontend compatibility
      isHidden: true
    }));

    res.json({
      success: true,
      data: hiddenServices
    });

  } catch (error) {
    console.error('Get hidden services error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch hidden services',
      error: error.message
    });
  }
});

// Get analytics data for staff center
router.get('/analytics', staffAuth, centerAccess, requirePermission('view_analytics'), async (req, res) => {
  try {
    const { period = 'month', type = 'appointments' } = req.query;

    // Import Appointment model dynamically
    const { default: Appointment } = await import('../models/Appointment.js');

    // Calculate date range based on period
    const now = new Date();
    let startDate = new Date();
    let previousStartDate = new Date();

    switch (period) {
      case 'week':
        startDate.setDate(now.getDate() - 7);
        previousStartDate.setDate(now.getDate() - 14);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        previousStartDate.setMonth(now.getMonth() - 2);
        break;
      case 'quarter':
        startDate.setMonth(now.getMonth() - 3);
        previousStartDate.setMonth(now.getMonth() - 6);
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        previousStartDate.setFullYear(now.getFullYear() - 2);
        break;
      default:
        startDate.setMonth(now.getMonth() - 1);
        previousStartDate.setMonth(now.getMonth() - 2);
    }

    // Get current period appointments
    const currentAppointments = await Appointment.find({
      ...req.centerFilter,
      createdAt: { $gte: startDate, $lte: now }
    }).populate('service', 'name category');

    // Get previous period appointments for comparison
    const previousAppointments = await Appointment.find({
      ...req.centerFilter,
      createdAt: { $gte: previousStartDate, $lt: startDate }
    });

    // Calculate metrics
    const totalAppointments = currentAppointments.length;
    const previousTotal = previousAppointments.length;
    const appointmentChange = previousTotal > 0 
      ? ((totalAppointments - previousTotal) / previousTotal) * 100 
      : 0;

    // Completion rate
    const completedAppointments = currentAppointments.filter(apt => apt.status === 'completed');
    const completionRate = totalAppointments > 0 
      ? (completedAppointments.length / totalAppointments) * 100 
      : 0;

    const previousCompleted = previousAppointments.filter(apt => apt.status === 'completed');
    const previousCompletionRate = previousTotal > 0 
      ? (previousCompleted.length / previousTotal) * 100 
      : 0;
    const completionRateChange = previousCompletionRate > 0 
      ? completionRate - previousCompletionRate 
      : 0;

    // Average processing time
    const completedWithDuration = completedAppointments.filter(apt => apt.actualDuration);
    const averageProcessingTime = completedWithDuration.length > 0
      ? completedWithDuration.reduce((sum, apt) => sum + apt.actualDuration, 0) / completedWithDuration.length
      : 0;

    const previousCompletedWithDuration = previousCompleted.filter(apt => apt.actualDuration);
    const previousAverageProcessingTime = previousCompletedWithDuration.length > 0
      ? previousCompletedWithDuration.reduce((sum, apt) => sum + apt.actualDuration, 0) / previousCompletedWithDuration.length
      : 0;
    const processingTimeChange = averageProcessingTime - previousAverageProcessingTime;

    // User satisfaction
    const ratedAppointments = completedAppointments.filter(apt => apt.rating && apt.rating.score);
    const userSatisfaction = ratedAppointments.length > 0
      ? ratedAppointments.reduce((sum, apt) => sum + apt.rating.score, 0) / ratedAppointments.length
      : 0;

    const previousRated = previousCompleted.filter(apt => apt.rating && apt.rating.score);
    const previousSatisfaction = previousRated.length > 0
      ? previousRated.reduce((sum, apt) => sum + apt.rating.score, 0) / previousRated.length
      : 0;
    const satisfactionChange = userSatisfaction - previousSatisfaction;

    // Status breakdown
    const statusBreakdown = currentAppointments.reduce((acc, apt) => {
      acc[apt.status] = (acc[apt.status] || 0) + 1;
      return acc;
    }, {});

    // Service distribution
    const serviceCount = currentAppointments.reduce((acc, apt) => {
      const serviceName = apt.service?.name || 'Unknown Service';
      acc[serviceName] = (acc[serviceName] || 0) + 1;
      return acc;
    }, {});

    const serviceDistribution = Object.entries(serviceCount)
      .map(([name, count]) => ({
        name,
        count,
        percentage: totalAppointments > 0 ? (count / totalAppointments) * 100 : 0
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Appointment trends (daily for the period)
    const appointmentTrends = [];
    const daysInPeriod = Math.ceil((now - startDate) / (1000 * 60 * 60 * 24));
    
    for (let i = 0; i < Math.min(daysInPeriod, 30); i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const dayAppointments = currentAppointments.filter(apt => {
        const aptDate = new Date(apt.createdAt);
        return aptDate >= date && aptDate < nextDate;
      });

      appointmentTrends.push({
        date: date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
        count: dayAppointments.length
      });
    }

    const analyticsData = {
      totalAppointments,
      appointmentChange,
      completionRate,
      completionRateChange,
      averageProcessingTime: Math.round(averageProcessingTime),
      processingTimeChange: Math.round(processingTimeChange),
      userSatisfaction,
      satisfactionChange,
      statusBreakdown,
      serviceDistribution,
      appointmentTrends: appointmentTrends.slice(-7), // Last 7 days
      period,
      dateRange: {
        start: startDate.toISOString(),
        end: now.toISOString()
      }
    };

    res.json({
      success: true,
      data: analyticsData
    });

  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch analytics data',
      error: error.message
    });
  }
});

// Upload documents for appointment
router.post('/appointments/:id/documents', staffAuth, centerAccess, requirePermission('upload_documents'), async (req, res) => {
  try {
    const { id } = req.params;

    // Import required modules
    const { default: Appointment } = await import('../models/Appointment.js');
    const multer = (await import('multer')).default;
    const path = (await import('path')).default;
    const fs = (await import('fs')).default;

    // Configure multer for file upload
    const storage = multer.diskStorage({
      destination: (req, file, cb) => {
        const uploadDir = path.join(process.cwd(), 'uploads', 'documents');
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
      },
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, `${id}-${uniqueSuffix}-${file.originalname}`);
      }
    });

    const fileFilter = (req, file, cb) => {
      const allowedTypes = ['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx'];
      const fileExtension = file.originalname.split('.').pop().toLowerCase();
      
      if (allowedTypes.includes(fileExtension)) {
        cb(null, true);
      } else {
        cb(new Error(`File type .${fileExtension} is not allowed`), false);
      }
    };

    const upload = multer({
      storage,
      fileFilter,
      limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
      }
    }).single('document');

    // Handle file upload
    upload(req, res, async (err) => {
      if (err) {
        return res.status(400).json({
          success: false,
          message: err.message || 'File upload failed'
        });
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No file uploaded'
        });
      }

      try {
        // Find appointment
        const appointment = await Appointment.findOne({
          _id: id,
          ...req.centerFilter
        });

        if (!appointment) {
          // Clean up uploaded file
          fs.unlinkSync(req.file.path);
          return res.status(404).json({
            success: false,
            message: 'Appointment not found'
          });
        }

        // Add document to appointment
        const document = {
          name: req.file.filename,
          originalName: req.file.originalname,
          type: req.file.mimetype,
          size: req.file.size,
          url: `/uploads/documents/${req.file.filename}`,
          uploadedBy: req.user.userId,
          uploadedAt: new Date(),
          isPublic: true
        };

        if (!appointment.resultDocuments) {
          appointment.resultDocuments = [];
        }

        appointment.resultDocuments.push(document);
        await appointment.save();

        // TODO: Send notification to user about document availability
        // This would be implemented in the notification system

        res.json({
          success: true,
          message: 'Document uploaded successfully',
          data: document
        });

      } catch (error) {
        // Clean up uploaded file on error
        if (req.file && fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
        throw error;
      }
    });

  } catch (error) {
    console.error('Upload document error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload document',
      error: error.message
    });
  }
});

// Get documents for appointment
router.get('/appointments/:id/documents', staffAuth, centerAccess, requirePermission('manage_appointments'), async (req, res) => {
  try {
    const { id } = req.params;

    // Import Appointment model dynamically
    const { default: Appointment } = await import('../models/Appointment.js');

    const appointment = await Appointment.findOne({
      _id: id,
      ...req.centerFilter
    }).select('resultDocuments');

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    res.json({
      success: true,
      data: appointment.resultDocuments || []
    });

  } catch (error) {
    console.error('Get documents error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch documents',
      error: error.message
    });
  }
});

// Delete document
router.delete('/documents/:id', staffAuth, requirePermission('upload_documents'), async (req, res) => {
  try {
    const { id } = req.params;

    // Import required modules
    const { default: Appointment } = await import('../models/Appointment.js');
    const fs = (await import('fs')).default;
    const path = (await import('path')).default;

    // Find appointment with the document
    const appointment = await Appointment.findOne({
      'resultDocuments._id': id,
      ...req.centerFilter
    });

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    // Find the document
    const document = appointment.resultDocuments.id(id);
    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    // Delete file from filesystem
    const filePath = path.join(process.cwd(), 'uploads', 'documents', document.name);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Remove document from appointment
    appointment.resultDocuments.pull(id);
    await appointment.save();

    res.json({
      success: true,
      message: 'Document deleted successfully'
    });

  } catch (error) {
    console.error('Delete document error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete document',
      error: error.message
    });
  }
});

// Get center profile with statistics
router.get('/center-profile', staffAuth, centerAccess, async (req, res) => {
  try {
    // Import models dynamically
    const { default: AkshayaCenter } = await import('../models/AkshayaCenter.js');
    const { default: Appointment } = await import('../models/Appointment.js');
    const { default: User } = await import('../models/User.js');

    // Get center details
    const center = await AkshayaCenter.findById(req.staff.centerId)
      .populate('services', 'name category fee');

    if (!center) {
      return res.status(404).json({
        success: false,
        message: 'Center not found'
      });
    }

    // Get all appointments for this center
    const allAppointments = await Appointment.find({
      center: req.staff.centerId
    }).populate('service', 'name category fee').populate('user', 'name');

    // Calculate statistics
    const totalAppointments = allAppointments.length;
    const completedServices = allAppointments.filter(apt => apt.status === 'completed').length;
    
    // Calculate average rating from completed appointments with ratings
    const ratedAppointments = allAppointments.filter(apt => apt.rating && apt.rating.score);
    const avgRating = ratedAppointments.length > 0
      ? ratedAppointments.reduce((sum, apt) => sum + apt.rating.score, 0) / ratedAppointments.length
      : 0;

    // Get unique customers
    const uniqueCustomers = new Set(allAppointments.map(apt => apt.user?._id?.toString()).filter(Boolean));
    const totalCustomers = uniqueCustomers.size;

    // Calculate service statistics
    const serviceStats = {};
    allAppointments.forEach(apt => {
      if (apt.service && apt.status === 'completed') {
        const serviceName = apt.service.name;
        if (!serviceStats[serviceName]) {
          serviceStats[serviceName] = {
            name: serviceName,
            count: 0,
            revenue: 0
          };
        }
        serviceStats[serviceName].count++;
        serviceStats[serviceName].revenue += apt.service.fee || 0;
      }
    });

    // Get top 4 services by count
    const topServices = Object.values(serviceStats)
      .sort((a, b) => b.count - a.count)
      .slice(0, 4);

    // Get staff info
    const staffUser = await User.findById(req.user.userId).select('name email');

    const profileData = {
      centerName: center.name,
      address: {
        street: center.address?.street || '',
        city: center.address?.city || '',
        district: center.address?.district || '',
        state: center.address?.state || 'Kerala',
        pincode: center.address?.pincode || ''
      },
      contact: {
        phone: center.contact?.phone || '',
        email: center.contact?.email || '',
        website: center.contact?.website || ''
      },
      operatingHours: center.operatingHours || {},
      stats: {
        totalAppointments,
        completedServices,
        avgRating: parseFloat(avgRating.toFixed(1)),
        totalCustomers
      },
      services: topServices,
      staffInfo: {
        name: staffUser?.name || '',
        email: staffUser?.email || '',
        role: req.staff.role || 'staff'
      }
    };

    res.json({
      success: true,
      data: profileData
    });

  } catch (error) {
    console.error('Get center profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch center profile',
      error: error.message
    });
  }
});

// Recommend documents to user
router.post('/appointments/:id/recommend-documents', staffAuth, centerAccess, requirePermission('manage_appointments'), async (req, res) => {
  try {
    const { id } = req.params;
    const { recommendedDocuments, note } = req.body;

    if (!recommendedDocuments || !Array.isArray(recommendedDocuments) || recommendedDocuments.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Recommended documents array is required'
      });
    }

    // Import models dynamically
    const { default: Appointment } = await import('../models/Appointment.js');
    const { default: Notification } = await import('../models/Notification.js');

    // Find appointment
    const appointment = await Appointment.findOne({
      _id: id,
      center: req.staff.centerId
    }).populate('user', 'name email').populate('service', 'name');

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found or not accessible from your center'
      });
    }

    // Add document recommendation to appointment record
    if (!appointment.staffDocumentRecommendations) {
      appointment.staffDocumentRecommendations = [];
    }

    const recommendation = {
      recommendedBy: req.user.userId,
      recommendedAt: new Date(),
      documents: recommendedDocuments,
      note: note || '',
      isAcknowledged: false
    };

    appointment.staffDocumentRecommendations.push(recommendation);

    // Build recommendation message
    let recommendationText = `Document recommendations for your ${appointment.service.name} appointment:\n\n`;
    
    recommendedDocuments.forEach((doc, index) => {
      recommendationText += `${index + 1}. ${doc}\n`;
    });

    if (note && note.trim()) {
      recommendationText += `\nNote from staff: ${note.trim()}`;
    }

    recommendationText += '\n\nPlease bring these documents to your appointment for smooth processing.';

    // Create notification for user
    await Notification.create({
      user: appointment.user._id,
      type: 'document_recommendation',
      title: 'Document Recommendations for Your Appointment',
      message: recommendationText,
      meta: {
        appointmentId: appointment._id,
        serviceId: appointment.service._id,
        centerId: appointment.center,
        recommendedDocuments,
        note: note || '',
        recommendedBy: req.user.name,
        appointmentDate: appointment.appointmentDate,
        timeSlot: appointment.timeSlot
      },
      priority: 'medium'
    });

    // Add comment to appointment for record keeping
    if (!appointment.comments) {
      appointment.comments = [];
    }

    appointment.comments.push({
      author: req.user.userId,
      authorType: 'staff',
      content: `Recommended documents to user: ${recommendedDocuments.join(', ')}${note ? `\nNote: ${note}` : ''}`,
      isVisible: true,
      createdAt: new Date()
    });

    await appointment.save();

    res.json({
      success: true,
      message: 'Document recommendations sent to user successfully',
      data: {
        recommendationsSent: recommendedDocuments.length,
        notificationSent: true,
        recommendedDocuments,
        note,
        recommendation
      }
    });

  } catch (error) {
    console.error('Recommend documents error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send document recommendations',
      error: error.message
    });
  }
});

export default router;

// Recommend alternative documents to user
router.post('/appointments/:id/recommend-alternatives', staffAuth, centerAccess, requirePermission('manage_appointments'), async (req, res) => {
  try {
    const { id } = req.params;
    const { recommendations } = req.body;

    if (!recommendations || !Array.isArray(recommendations) || recommendations.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Recommendations array is required'
      });
    }

    // Import models dynamically
    const { default: Appointment } = await import('../models/Appointment.js');
    const { default: Notification } = await import('../models/Notification.js');
    const { default: DocumentRequirement } = await import('../models/DocumentRequirement.js');

    // Find appointment
    const appointment = await Appointment.findOne({
      _id: id,
      center: req.staff.centerId
    }).populate('user', 'name email').populate('service', 'name');

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found or not accessible from your center'
      });
    }

    // Get document requirements to build recommendation message
    const docRequirements = await DocumentRequirement.findOne({ service: appointment.service._id });
    
    if (!docRequirements) {
      return res.status(404).json({
        success: false,
        message: 'Document requirements not found for this service'
      });
    }

    // Build recommendation message
    let recommendationText = 'Alternative document recommendations for your appointment:\n\n';
    
    recommendations.forEach(rec => {
      const document = docRequirements.documents.find(d => d._id.toString() === rec.documentId);
      if (document && document.alternatives && document.alternatives[rec.alternativeId]) {
        const alternative = document.alternatives[rec.alternativeId];
        recommendationText += `• Instead of "${document.name}", you can use "${alternative.name}"\n`;
        if (alternative.notes) {
          recommendationText += `  Note: ${alternative.notes}\n`;
        }
        recommendationText += '\n';
      }
    });

    recommendationText += 'Please bring any of these alternative documents to your appointment.';

    // Create notification for user
    await Notification.create({
      user: appointment.user._id,
      type: 'document_recommendation',
      title: 'Alternative Document Recommendations',
      message: recommendationText,
      meta: {
        appointmentId: appointment._id,
        serviceId: appointment.service._id,
        centerId: appointment.center,
        recommendations,
        recommendedBy: req.user.name
      },
      priority: 'medium'
    });

    // Add comment to appointment for record keeping
    if (!appointment.comments) {
      appointment.comments = [];
    }

    appointment.comments.push({
      author: req.user.userId,
      authorType: 'staff',
      content: `Recommended alternative documents to user:\n${recommendationText}`,
      isVisible: false, // Internal record
      createdAt: new Date()
    });

    await appointment.save();

    res.json({
      success: true,
      message: 'Alternative document recommendations sent to user',
      data: {
        recommendationsSent: recommendations.length,
        notificationSent: true
      }
    });

  } catch (error) {
    console.error('Recommend alternatives error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send alternative recommendations',
      error: error.message
    });
  }
});

// Get detailed appointment information (enhanced version)
router.get('/appointments/:id/details', staffAuth, centerAccess, requirePermission('manage_appointments'), async (req, res) => {
  try {
    const { id } = req.params;

    // Import models dynamically
    const { default: Appointment } = await import('../models/Appointment.js');

    const appointment = await Appointment.findOne({
      _id: id,
      center: req.staff.centerId
    })
    .populate('user', 'name email phone')
    .populate('service', 'name category fee serviceCharge processingTime requiredDocuments')
    .populate('center', 'name address contact location')
    .populate('comments.author', 'name')
    .populate('staffNotes.author', 'name')
    .populate('statusHistory.changedBy', 'name');

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found or not accessible from your center'
      });
    }

    res.json({
      success: true,
      data: appointment
    });

  } catch (error) {
    console.error('Get detailed appointment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch detailed appointment information',
      error: error.message
    });
  }
});