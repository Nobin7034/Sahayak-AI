import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from './config/db.js';

dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();
const PORT = process.env.PORT || 5000;

// Resolve __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files statically (single unified path)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Import Routes
import testRoutes from './routes/testRoutes.js';
import authRoutes from './routes/authRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import serviceRoutes from './routes/serviceRoutes.js';
import newsRoutes from './routes/newsRoutes.js';
import appointmentRoutes from './routes/appointmentRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import centerRoutes from './routes/centers.js';
import geocodeRoutes from './routes/geocode.js';
import staffRoutes from './routes/staffRoutes.js';
import ratingRoutes from './routes/ratingRoutes.js';

// Base route (dev info). In production we serve the frontend build instead.
app.get('/', (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    res.sendFile(path.join(__dirname, '..', 'frontend', 'dist', 'index.html'));
    return;
  }
  res.json({ 
    message: 'Akshaya Services Backend API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      admin: '/api/admin',
      services: '/api/services',
      news: '/api/news',
      appointments: '/api/appointments',
      centers: '/api/centers',
      geocode: '/api/geocode',
      staff: '/api/staff',
      test: '/api/test',
      uploads: '/uploads/*'
    }
  });
});

// Use Routes
app.use('/api/test', testRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/centers', centerRoutes);
app.use('/api/geocode', geocodeRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/ratings', ratingRoutes);

// Serve frontend in production
if (process.env.NODE_ENV === 'production') {
  const clientPath = path.join(__dirname, '..', 'frontend', 'dist');
  app.use(express.static(clientPath));

  // For any non-API route, send the React index.html
  app.get('*', (req, res) => {
    if (req.path.startsWith('/api')) {
      res.status(404).json({ error: 'Not Found' });
      return;
    }
    res.sendFile(path.join(clientPath, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`🚀 Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
