import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import axios from 'axios';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import User from "../models/User.js";
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/avatars/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'avatar-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// ---------------- Helper: generate JWT ----------------
const generateToken = (user) => {
  return jwt.sign(
    { userId: user._id, email: user.email, role: user.role },
    process.env.JWT_SECRET || "your-secret-key",
    { expiresIn: "7d" }
  );
};

// ---------------- REGISTER ----------------
router.post("/register", async (req, res) => {
  try {

    
    const { 
      accountType,
      firstName, 
      lastName, 
      email, 
      password, 
      phone,
      // Staff-specific fields
      centerName,
      centerAddress,
      centerContact,
      centerLocation
    } = req.body;

    // Set default accountType if not provided
    const userAccountType = accountType || "user";



    // For user registration, require personal information
    if (userAccountType === 'user') {
      const name = `${firstName} ${lastName}`.trim();
      if (!name || !email || !password) {
        return res
          .status(400)
          .json({ success: false, message: "Name, email, and password are required" });
      }
    }

    // For staff registration, only require password and center details
    if (userAccountType === 'staff') {
      if (!password) {
        return res
          .status(400)
          .json({ success: false, message: "Password is required" });
      }
    }

    // Validate staff-specific fields
    if (userAccountType === 'staff') {
      if (!centerName || !centerAddress || !centerContact) {
        return res
          .status(400)
          .json({ success: false, message: "Center details are required for staff registration" });
      }
    }

    let user;
    
    if (userAccountType === 'user') {
      // For user registration, check email and create with personal info
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res
          .status(400)
          .json({ success: false, message: "User already exists with this email" });
      }

      const name = `${firstName} ${lastName}`.trim();
      const hashedPassword = await bcrypt.hash(password, 10);

      user = await User.create({
        name,
        email,
        password: hashedPassword,
        phone,
        role: 'user',
        provider: "local",
        isActive: true
      });
    } else {
      // For staff registration, use center email and create with center name
      const centerEmail = centerContact?.email;
      if (!centerEmail) {
        return res
          .status(400)
          .json({ success: false, message: "Center email is required for staff registration" });
      }

      const existingUser = await User.findOne({ email: centerEmail });
      if (existingUser) {
        return res
          .status(400)
          .json({ success: false, message: "A user already exists with this center email" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      user = await User.create({
        name: centerName, // Use center name as user name
        email: centerEmail, // Use center email as user email
        password: hashedPassword,
        phone: centerContact?.phone,
        role: 'staff',
        provider: "local",
        isActive: false // Staff need approval
      });
    }

    // If staff registration, create the center and staff record
    if (userAccountType === 'staff') {
      // Import models dynamically to avoid circular dependencies
      const { default: AkshayaCenter } = await import('../models/AkshayaCenter.js');
      const { default: Staff } = await import('../models/Staff.js');

      // Auto-geocode if coordinates not provided
      let coordinates = [0, 0]; // Default coordinates
      let actualPincode = centerAddress.pincode; // Default to provided pincode

      if (centerLocation?.latitude && centerLocation?.longitude) {
        coordinates = [parseFloat(centerLocation.longitude), parseFloat(centerLocation.latitude)];

        // Use reverse geocoding to get the correct pincode based on coordinates
        try {
          const geocodeResponse = await fetch(`${req.protocol}://${req.get('host')}/api/geocode/reverse?lat=${centerLocation.latitude}&lng=${centerLocation.longitude}`);
          const geocodeData = await geocodeResponse.json();

          if (geocodeData.success && geocodeData.components) {
            // Extract pincode from reverse geocoding result
            const components = geocodeData.components;
            if (components.postcode) {
              actualPincode = components.postcode;
              console.log(`Reverse geocoded pincode: ${actualPincode} for coordinates: ${centerLocation.latitude}, ${centerLocation.longitude}`);
            }
          }
        } catch (error) {
          console.error('Reverse geocoding failed during center creation:', error);
          // Fall back to provided pincode
        }
      } else if (centerAddress?.pincode) {
        // Try to geocode from pincode (simplified - you could integrate with a geocoding service)
        // For now, use default Kerala coordinates
        coordinates = [76.2711, 10.8505]; // Default Kerala coordinates
      }

      // Create the Akshaya center
      const center = await AkshayaCenter.create({
        name: centerName,
        address: {
          street: centerAddress.street,
          city: centerAddress.city,
          district: centerAddress.district,
          state: centerAddress.state || 'Kerala',
          pincode: actualPincode
        },
        location: {
          type: 'Point',
          coordinates: coordinates
        },
        contact: {
          phone: centerContact.phone,
          email: centerContact.email
        },
        status: 'inactive', // Center is inactive until staff is approved
        operatingHours: {
          monday: { open: '09:00', close: '17:00', isOpen: true },
          tuesday: { open: '09:00', close: '17:00', isOpen: true },
          wednesday: { open: '09:00', close: '17:00', isOpen: true },
          thursday: { open: '09:00', close: '17:00', isOpen: true },
          friday: { open: '09:00', close: '17:00', isOpen: true },
          saturday: { open: '09:00', close: '17:00', isOpen: true },
          sunday: { open: '10:00', close: '16:00', isOpen: false }
        },
        capacity: {
          maxAppointmentsPerDay: 50
        }
      });

      // Create staff record linking user to center
      await Staff.create({
        userId: user._id,
        center: center._id,
        role: 'staff',
        isActive: false, // Staff inactive until approved
        assignedBy: null, // Will be set when approved by admin
        permissions: [
          { action: 'manage_appointments', granted: true },
          { action: 'update_status', granted: true },
          { action: 'add_comments', granted: true },
          { action: 'view_analytics', granted: true }
        ]
      });

      return res.status(201).json({
        success: true,
        message: "Staff registration submitted successfully. Your account is pending admin approval.",
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone,
          isActive: user.isActive,
          centerName: centerName
        },
        requiresApproval: true
      });
    }

    // For regular user registration
    if (userAccountType === 'user') {
      const token = generateToken(user);

      res.status(201).json({
        success: true,
        message: "User registered successfully",
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone,
        },
      });
    }
  } catch (error) {
    console.error("❌ Registration error:", error);
    res
      .status(500)
      .json({ success: false, message: "Registration failed", error: error.message });
  }
});

// ---------------- CHECK EMAIL (live validation) ----------------
router.get('/check-email', async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }
    const existing = await User.findOne({ email }).lean();
    return res.json({ success: true, exists: !!existing });
  } catch (error) {
    console.error('❌ Email check error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ---------------- LOGIN (AUTO ROLE DETECTION) ----------------
router.post("/login", async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ success: false, message: "Email and password are required" });
    }

    // If role is specified, use the old behavior for backward compatibility
    if (role) {
      const user = await User.findOne({ 
        email, 
        role, 
        isActive: true,
        ...(role === 'staff' && { approvalStatus: 'approved' })
      });
      if (!user) {
        return res.status(401).json({ success: false, message: "Invalid credentials" });
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ success: false, message: "Invalid credentials" });
      }

      user.lastLogin = new Date();
      await user.save();

      const token = generateToken(user);
      return res.json({ success: true, message: "Login successful", token, user });
    }

    // Auto role detection: Find user by email first, then validate
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    // Check if password is valid
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({ success: false, message: "Account is inactive" });
    }

    // For staff users, check approval status
    if (user.role === 'staff' && user.approvalStatus !== 'approved') {
      return res.status(401).json({ 
        success: false, 
        message: "Staff account is pending approval" 
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    const token = generateToken(user);

    res.json({ 
      success: true, 
      message: "Login successful", 
      token, 
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        avatar: user.avatar,
        provider: user.provider,
        lastLogin: user.lastLogin
      }
    });
  } catch (error) {
    console.error("❌ Login error:", error);
    res
      .status(500)
      .json({ success: false, message: "Login failed", error: error.message });
  }
});

// ---------------- GOOGLE SIGN-IN (via Firebase ID token) ----------------
router.post("/google", async (req, res) => {
  try {
    const idToken = req.body.token; // Firebase ID token from client

    if (!idToken) {
      return res.status(400).json({ success: false, message: "Missing Firebase ID token" });
    }

    // Verify Firebase ID token using Admin SDK, with REST fallback if Admin is not configured
    const adminModule = await import('../config/firebaseAdmin.js');
    let uid, email, name, picture;
    try {
      const decoded = await adminModule.default.auth().verifyIdToken(idToken);
      ({ uid, email, name, picture } = decoded);
    } catch (adminErr) {
      try {
        const apiKey = process.env.FIREBASE_WEB_API_KEY;
        if (!apiKey) throw new Error('FIREBASE_WEB_API_KEY not set');
        const resp = await axios.post(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`,
          { idToken },
          { headers: { 'Content-Type': 'application/json' } }
        );
        const users = resp?.data?.users || [];
        if (!users.length) throw new Error('Invalid Firebase ID token');
        const u = users[0];
        uid = u.localId;
        email = u.email;
        name = u.displayName || (email ? email.split('@')[0] : 'User');
        picture = u.photoUrl;
      } catch (restErr) {
        throw adminErr;
      }
    }

    let user = await User.findOne({ email });
    if (!user) {
      // Always create new Google users with 'user' role
      user = await User.create({
        name: name || email.split("@")[0],
        email,
        googleId: uid,
        provider: "google",
        avatar: picture,
        role: "user", // Security: Always default to 'user' role
      });
    } else if (!user.googleId) {
      user.googleId = uid;
      user.provider = "google";
      user.avatar = user.avatar || picture;
      await user.save();
    }

    user.lastLogin = new Date();
    await user.save();

    // No backend JWT; client will send Firebase ID token on each request
    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
      },
    });
  } catch (err) {
    console.error("❌ Google auth error:", err?.response?.data || err?.message || err);
    res.status(401).json({
      success: false,
      message: "Google authentication failed",
      error: err?.message || 'Unknown error',
      details: err?.response?.data,
    });
  }
});

// ---------------- CURRENT USER (uses Firebase-authenticated request) ----------------
router.get("/me", authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select("-password");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    res.json({ success: true, user });
  } catch (error) {
    console.error("❌ Get user error:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
});

// ---------------- UPDATE CURRENT USER ----------------
router.put("/me", authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const { name, phone, avatar } = req.body;
    
    // Validate name
    if (typeof name === 'string' && name.trim()) {
      user.name = name.trim();
    }
    
    // Validate phone number
    if (typeof phone === 'string') {
      const trimmedPhone = phone.trim();
      
      if (trimmedPhone) {
        // Phone validation function
        const validateIndianPhone = (phoneNumber) => {
          // Remove all non-digit characters
          const cleanPhone = phoneNumber.replace(/\D/g, '');
          
          // Check if it's a valid Indian mobile number
          // Indian mobile numbers: 10 digits starting with 6, 7, 8, or 9
          // Or with country code: +91 followed by 10 digits
          const indianMobileRegex = /^[6-9]\d{9}$/;
          const indianMobileWithCountryCode = /^(\+91|91)?[6-9]\d{9}$/;
          
          if (cleanPhone.length === 10 && indianMobileRegex.test(cleanPhone)) {
            return { valid: true, formatted: `+91${cleanPhone}` };
          } else if (cleanPhone.length === 12 && cleanPhone.startsWith('91') && indianMobileWithCountryCode.test(cleanPhone)) {
            return { valid: true, formatted: `+${cleanPhone}` };
          } else if (cleanPhone.length === 13 && cleanPhone.startsWith('91') && indianMobileWithCountryCode.test('+' + cleanPhone)) {
            return { valid: true, formatted: `+${cleanPhone}` };
          } else if (phoneNumber.startsWith('+91') && phoneNumber.length === 14 && indianMobileWithCountryCode.test(phoneNumber)) {
            return { valid: true, formatted: phoneNumber };
          } else {
            return { valid: false, formatted: null };
          }
        };
        
        const phoneValidation = validateIndianPhone(trimmedPhone);
        if (!phoneValidation.valid) {
          return res.status(400).json({ 
            success: false, 
            message: "Please enter a valid Indian mobile number (10 digits starting with 6, 7, 8, or 9)" 
          });
        }
        
        user.phone = phoneValidation.formatted;
      } else {
        user.phone = ''; // Allow empty phone
      }
    }
    
    // Validate avatar
    if (typeof avatar === 'string') {
      user.avatar = avatar.trim();
    }

    await user.save();

    const sanitized = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      avatar: user.avatar,
      provider: user.provider,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt
    };

    res.json({ success: true, message: 'Profile updated successfully', user: sanitized });
  } catch (error) {
    console.error('❌ Update user error:', error);
    res.status(500).json({ success: false, message: 'Update failed', error: error.message });
  }
});

// ---------------- CHANGE PASSWORD (LOCAL ONLY) ----------------
router.put('/me/password', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    if (user.provider !== 'local') {
      return res.status(400).json({ success: false, message: 'Password managed by Google account' });
    }

    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Current and new password are required' });
    }

    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect' });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    console.error('❌ Change password error:', error);
    res.status(500).json({ success: false, message: 'Password update failed', error: error.message });
  }
});

// ---------------- STAFF REGISTRATION ----------------
router.post("/staff-register", async (req, res) => {
  try {
    const { 
      password,
      centerName,
      centerAddress,
      centerContact,
      centerLocation
    } = req.body;

    // Validate required fields
    if (!password) {
      return res.status(400).json({ 
        success: false, 
        message: "Password is required" 
      });
    }

    if (!centerName || !centerAddress || !centerContact || !centerLocation) {
      return res.status(400).json({ 
        success: false, 
        message: "All center details are required" 
      });
    }

    // Validate phone number format (10 digits starting with 6-9)
    if (!centerContact.phone || !/^[6-9][0-9]{9}$/.test(centerContact.phone)) {
      return res.status(400).json({ 
        success: false, 
        message: "Please enter a valid 10-digit phone number starting with 6, 7, 8, or 9" 
      });
    }

    // Format phone number with country code for storage
    const formattedPhone = `+91${centerContact.phone}`;

    // Check if email already exists
    const existingUser = await User.findOne({ email: centerContact.email });
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: "A user already exists with this email" 
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create staff user account (pending approval)
    const staffUser = await User.create({
      name: centerName, // Use center name as staff name
      email: centerContact.email,
      password: hashedPassword,
      phone: formattedPhone,
      role: 'staff',
      provider: 'local',
      isActive: false, // Inactive until approved
      approvalStatus: 'pending'
    });

    // Create Akshaya center (inactive until staff is approved)
    const { default: AkshayaCenter } = await import('../models/AkshayaCenter.js');
    const center = await AkshayaCenter.create({
      name: centerName,
      address: centerAddress,
      location: {
        type: 'Point',
        coordinates: [
          parseFloat(centerLocation.longitude),
          parseFloat(centerLocation.latitude)
        ]
      },
      contact: {
        ...centerContact,
        phone: formattedPhone
      },
      status: 'inactive', // Inactive until staff is approved
      registeredBy: staffUser._id
    });

    // Create Staff record (inactive until approved)
    const { default: Staff } = await import('../models/Staff.js');
    await Staff.create({
      userId: staffUser._id,
      center: center._id,
      role: 'staff',
      isActive: false, // Inactive until approved
      permissions: [
        { action: 'manage_appointments', granted: true },
        { action: 'update_status', granted: true },
        { action: 'add_comments', granted: true },
        { action: 'view_analytics', granted: true }
      ]
    });

    // Create notification for all admins about new staff registration
    try {
      const adminUsers = await User.find({ role: 'admin', isActive: true }).select('_id');
      const { default: Notification } = await import('../models/Notification.js');
      
      const notifications = adminUsers.map(admin => ({
        user: admin._id,
        type: 'staff_registration',
        title: 'New Staff Registration',
        message: `New staff registration from ${centerName}. Please review and approve.`,
        meta: {
          staffUserId: staffUser._id,
          centerName: centerName,
          centerEmail: centerContact.email
        }
      }));

      if (notifications.length > 0) {
        await Notification.insertMany(notifications);
      }
    } catch (notificationError) {
      console.error('Failed to create admin notifications:', notificationError);
      // Don't fail the registration if notification fails
    }

    res.status(201).json({
      success: true,
      message: "Staff registration submitted successfully. Your account is pending admin approval.",
      userId: staffUser._id,
      centerId: center._id,
      requiresApproval: true
    });

  } catch (error) {
    console.error("❌ Staff registration error:", error);
    
    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({ 
        success: false, 
        message: "A user already exists with this email" 
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: "Staff registration failed", 
      error: error.message 
    });
  }
});

// ---------------- CHECK EMAIL FOR STAFF REGISTRATION ----------------
router.get('/check-staff-email', async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    // Check if email exists in User table
    const existingUser = await User.findOne({ email }).lean();
    
    return res.json({ success: true, exists: !!existingUser });
  } catch (error) {
    console.error('❌ Staff email check error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ---------------- GET STAFF REGISTRATIONS (for admin) ----------------
router.get('/staff-registrations', async (req, res) => {
  try {
    // Get all staff users with their associated centers
    const { default: AkshayaCenter } = await import('../models/AkshayaCenter.js');
    
    const staffUsers = await User.find({ 
      role: 'staff' 
    })
    .select('-password') // Don't send password hashes
    .sort({ createdAt: -1 });

    // Get associated centers for each staff member
    const registrations = await Promise.all(
      staffUsers.map(async (staff) => {
        const center = await AkshayaCenter.findOne({ registeredBy: staff._id });
        return {
          _id: staff._id,
          name: staff.name,
          email: staff.email,
          phone: staff.phone,
          approvalStatus: staff.approvalStatus,
          reviewedBy: staff.reviewedBy,
          reviewedAt: staff.reviewedAt,
          reviewNotes: staff.reviewNotes,
          createdAt: staff.createdAt,
          // Center details
          centerName: center?.name || '',
          centerAddress: center?.address || {},
          centerContact: center?.contact || {},
          centerLocation: center?.location || {},
          centerStatus: center?.status || 'inactive'
        };
      })
    );
    
    return res.json({ 
      success: true, 
      registrations,
      count: registrations.length 
    });
  } catch (error) {
    console.error('❌ Get staff registrations error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ---------------- UPLOAD AVATAR ----------------
router.post('/upload-avatar', authenticate, upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Update user's avatar URL
    const avatarUrl = `/uploads/avatars/${req.file.filename}`;
    user.avatar = avatarUrl;
    await user.save();

    res.json({
      success: true,
      message: 'Avatar uploaded successfully',
      avatarUrl: avatarUrl
    });
  } catch (error) {
    console.error('❌ Avatar upload error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Avatar upload failed', 
      error: error.message 
    });
  }
});

// ---------------- ADMIN: APPROVE STAFF REGISTRATION ----------------
router.post('/admin/approve-staff/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { adminId, notes = '', enableAllServices = false } = req.body; // Changed default to false

    // Find the staff user
    const staffUser = await User.findById(userId);
    if (!staffUser || staffUser.role !== 'staff') {
      return res.status(404).json({ 
        success: false, 
        message: 'Staff user not found' 
      });
    }

    if (staffUser.approvalStatus !== 'pending') {
      return res.status(400).json({ 
        success: false, 
        message: 'Staff registration has already been processed' 
      });
    }

    // Find the associated center
    const { default: AkshayaCenter } = await import('../models/AkshayaCenter.js');
    const center = await AkshayaCenter.findOne({ registeredBy: userId });
    if (!center) {
      return res.status(404).json({ 
        success: false, 
        message: 'Associated center not found' 
      });
    }

    // Find the staff record
    const { default: Staff } = await import('../models/Staff.js');
    const staffRecord = await Staff.findOne({ userId: userId });
    if (!staffRecord) {
      return res.status(404).json({ 
        success: false, 
        message: 'Staff record not found' 
      });
    }

    // Approve the staff user
    staffUser.approvalStatus = 'approved';
    staffUser.isActive = true;
    staffUser.reviewedBy = adminId;
    staffUser.reviewedAt = new Date();
    staffUser.reviewNotes = notes;
    await staffUser.save();

    // Activate the center
    center.status = 'active';
    
    let servicesAssigned = 0;
    let newServicesAdded = 0;
    
    // Auto-assign all existing services to the newly approved center (if enabled)
    if (enableAllServices) {
      const { default: Service } = await import('../models/Service.js');
      const allServices = await Service.find({ isActive: true }).select('_id');
      const serviceIds = allServices.map(service => service._id);
      
      // Add all services to the center if not already present
      const existingServiceIds = center.services.map(id => id.toString());
      const newServiceIds = serviceIds.filter(id => !existingServiceIds.includes(id.toString()));
      
      if (newServiceIds.length > 0) {
        center.services.push(...newServiceIds);
        newServicesAdded = newServiceIds.length;
      }
      
      servicesAssigned = serviceIds.length;
      console.log(`✅ Center ${center.name} approved and ${servicesAssigned} services automatically assigned`);
    } else {
      console.log(`✅ Center ${center.name} approved without automatic service assignment`);
    }
    
    await center.save();
    

    // Activate the staff record
    staffRecord.isActive = true;
    staffRecord.assignedBy = adminId;
    await staffRecord.save();

    // Send approval notification to the staff member
    try {
      const { default: Notification } = await import('../models/Notification.js');
      await Notification.create({
        user: staffUser._id,
        type: 'approval',
        title: 'Staff Registration Approved',
        message: `Congratulations! Your staff registration for ${center.name} has been approved. You can now login to your dashboard.`,
        meta: {
          centerName: center.name,
          centerId: center._id,
          approvedBy: adminId
        }
      });
    } catch (notificationError) {
      console.error('Failed to create approval notification:', notificationError);
      // Don't fail the approval if notification fails
    }

    res.json({
      success: true,
      message: enableAllServices 
        ? `Staff registration approved successfully. ${servicesAssigned} services automatically assigned to ${center.name}.`
        : `Staff registration approved successfully. No services were automatically assigned to ${center.name}.`,
      data: {
        user: { id: staffUser._id, name: staffUser.name, email: staffUser.email },
        center: { id: center._id, name: center.name },
        staff: { id: staffRecord._id },
        servicesAssigned: servicesAssigned,
        newServicesAdded: newServicesAdded,
        enableAllServices: enableAllServices
      }
    });

  } catch (error) {
    console.error('❌ Staff approval error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to approve staff registration', 
      error: error.message 
    });
  }
});

// ---------------- ADMIN: REJECT STAFF REGISTRATION ----------------
router.post('/admin/reject-staff/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { adminId, reason = '' } = req.body;

    // Find the staff user
    const staffUser = await User.findById(userId);
    if (!staffUser || staffUser.role !== 'staff') {
      return res.status(404).json({ 
        success: false, 
        message: 'Staff user not found' 
      });
    }

    if (staffUser.approvalStatus !== 'pending') {
      return res.status(400).json({ 
        success: false, 
        message: 'Staff registration has already been processed' 
      });
    }

    // Reject the staff user
    staffUser.approvalStatus = 'rejected';
    staffUser.reviewedBy = adminId;
    staffUser.reviewedAt = new Date();
    staffUser.reviewNotes = reason;
    await staffUser.save();

    // Send rejection notification to the staff member
    try {
      const { default: Notification } = await import('../models/Notification.js');
      await Notification.create({
        user: staffUser._id,
        type: 'rejection',
        title: 'Staff Registration Rejected',
        message: `Your staff registration has been rejected. Reason: ${reason || 'No reason provided'}`,
        meta: {
          rejectedBy: adminId,
          reason: reason
        }
      });
    } catch (notificationError) {
      console.error('Failed to create rejection notification:', notificationError);
      // Don't fail the rejection if notification fails
    }

    res.json({
      success: true,
      message: 'Staff registration rejected',
      userId
    });

  } catch (error) {
    console.error('❌ Staff rejection error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to reject staff registration', 
      error: error.message 
    });
  }
});

export default router;
