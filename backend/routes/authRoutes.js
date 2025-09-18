import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import axios from 'axios';
import User from "../models/User.js";
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

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
    const { name, email, password, phone, role = "user" } = req.body;

    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ success: false, message: "Name, email, and password are required" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res
        .status(400)
        .json({ success: false, message: "User already exists with this email" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      phone,
      role,
      provider: "local",
    });

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

// ---------------- LOGIN ----------------
router.post("/login", async (req, res) => {
  try {
    const { email, password, role = "user" } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ success: false, message: "Email and password are required" });
    }

    const user = await User.findOne({ email, role, isActive: true });
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

    res.json({ success: true, message: "Login successful", token, user });
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
      user = await User.create({
        name: name || email.split("@")[0],
        email,
        googleId: uid,
        provider: "google",
        avatar: picture,
        role: req.body.role || "user",
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
router.put("/me", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ success: false, message: "No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "your-secret-key");
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const { name, phone, avatar } = req.body;
    if (typeof name === 'string' && name.trim()) user.name = name.trim();
    if (typeof phone === 'string') user.phone = phone.trim();
    if (typeof avatar === 'string') user.avatar = avatar.trim();

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

    res.json({ success: true, message: 'Profile updated', user: sanitized });
  } catch (error) {
    console.error('❌ Update user error:', error);
    res.status(500).json({ success: false, message: 'Update failed', error: error.message });
  }
});

// ---------------- CHANGE PASSWORD (LOCAL ONLY) ----------------
router.put('/me/password', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const user = await User.findById(decoded.userId);
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

export default router;
