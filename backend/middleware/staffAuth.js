import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Staff from '../models/Staff.js';

// Staff authentication middleware
export const staffAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);
    
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token. User not found or inactive.'
      });
    }

    // Check if user has staff role
    if (user.role !== 'staff' && user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Staff privileges required.'
      });
    }

    // Get staff record for staff users
    let staffRecord = null;
    if (user.role === 'staff') {
      staffRecord = await Staff.findByUserId(user._id);
      
      if (!staffRecord || !staffRecord.isActive) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Staff assignment not found or inactive.'
        });
      }
    }

    // Attach user and staff info to request
    req.user = {
      userId: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    };

    if (staffRecord) {
      req.staff = {
        staffId: staffRecord._id,
        centerId: staffRecord.center._id,
        centerName: staffRecord.center.name,
        role: staffRecord.role,
        permissions: staffRecord.permissions,
        isCurrentlyWorking: staffRecord.isCurrentlyWorking
      };
    }

    next();
  } catch (error) {
    console.error('Staff auth error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token.'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired.'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Authentication error.',
      error: error.message
    });
  }
};

// Permission check middleware factory
export const requirePermission = (permission) => {
  return (req, res, next) => {
    // Admin users have all permissions
    if (req.user.role === 'admin') {
      return next();
    }

    // Check if staff has the required permission
    if (!req.staff) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Staff record not found.'
      });
    }

    const hasPermission = req.staff.permissions.some(
      p => p.action === permission && p.granted
    );

    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Permission '${permission}' required.`
      });
    }

    next();
  };
};

// Center access middleware - ensures staff can only access their center's data
export const centerAccess = (req, res, next) => {
  // Admin users can access all centers
  if (req.user.role === 'admin') {
    return next();
  }

  // Staff users can only access their assigned center
  if (!req.staff || !req.staff.centerId) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Center assignment required.'
    });
  }

  // Add center filter to request for use in queries
  req.centerFilter = { center: req.staff.centerId };
  
  next();
};

// Working hours check middleware
export const workingHoursCheck = (req, res, next) => {
  // Admin users can access anytime
  if (req.user.role === 'admin') {
    return next();
  }

  // Check if staff is currently in working hours
  if (req.staff && !req.staff.isCurrentlyWorking) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Outside working hours.',
      workingHours: true
    });
  }

  next();
};