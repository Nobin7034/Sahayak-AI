import admin from '../config/firebaseAdmin.js';
import jwt from 'jsonwebtoken';
import axios from 'axios';
import User from '../models/User.js';

// Accept BOTH: Firebase ID token OR backend JWT in Authorization header
export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

    if (!token) {
      return res.status(401).json({ success: false, message: 'Access denied. No token provided.' });
    }

    let userPayload = null;

    // Try Firebase first (Admin SDK, with REST fallback)
    try {
      let decoded;
      try {
        decoded = await admin.auth().verifyIdToken(token);
      } catch (adminErr) {
        const apiKey = process.env.FIREBASE_WEB_API_KEY;
        if (!apiKey) throw adminErr;
        try {
          const resp = await axios.post(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`,
            { idToken: token },
            { headers: { 'Content-Type': 'application/json' } }
          );
          const users = resp?.data?.users || [];
          if (!users.length) throw adminErr;
          const u = users[0];
          decoded = {
            uid: u.localId,
            email: u.email,
            name: u.displayName || (u.email ? u.email.split('@')[0] : 'User'),
            picture: u.photoUrl
          };
        } catch (restErr) {
          throw adminErr;
        }
      }

      let user = await User.findOne({ email: decoded.email });
      if (!user) {
        user = await User.create({
          name: decoded.name || decoded.email?.split('@')[0] || 'User',
          email: decoded.email,
          googleId: decoded.uid,
          provider: 'google',
          avatar: decoded.picture,
          role: 'user',
          isActive: true
        });
      }
      if (!user.isActive) {
        return res.status(401).json({ success: false, message: 'Access denied. User inactive.' });
      }
      userPayload = { userId: user._id.toString(), email: user.email, role: user.role, firebaseUid: decoded.uid };
    } catch (firebaseErr) {
      // If Firebase verification fails, try backend JWT
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        const user = await User.findById(decoded.userId);
        if (!user || !user.isActive) {
          return res.status(401).json({ success: false, message: 'Access denied. User not found or inactive.' });
        }
        userPayload = { userId: user._id.toString(), email: user.email, role: user.role };
      } catch (jwtErr) {
        // Both verifications failed
        return res.status(401).json({ success: false, message: 'Access denied. Invalid token.' });
      }
    }

    req.user = userPayload;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({ success: false, message: 'Access denied. Invalid token.' });
  }
};

export const userAuth = async (req, res, next) => {
  try {
    await authenticate(req, res, () => {
      if (req.user.role !== 'user') {
        return res.status(403).json({ success: false, message: 'Access denied. User role required.' });
      }
      next();
    });
  } catch (error) {
    console.error('User auth error:', error);
    res.status(401).json({ success: false, message: 'Authentication failed.' });
  }
};

export const adminAuth = async (req, res, next) => {
  try {
    await authenticate(req, res, () => {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Access denied. Admin role required.' });
      }
      next();
    });
  } catch (error) {
    console.error('Admin auth error:', error);
    res.status(401).json({ success: false, message: 'Authentication failed.' });
  }
};