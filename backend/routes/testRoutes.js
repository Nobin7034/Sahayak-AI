import express from 'express';
import User from '../models/User.js';

const router = express.Router();

// Test route to check database connection
router.get('/db-test', async (req, res) => {
  try {
    // Try to count users to verify DB connection
    const count = await User.countDocuments();
    res.json({ 
      success: true, 
      message: 'Database connection successful', 
      userCount: count 
    });
  } catch (error) {
    console.error('Database test error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Database connection failed', 
      error: error.message 
    });
  }
});

// Test route to create a test user
router.post('/create-test-user', async (req, res) => {
  try {
    // Create a test user
    const testUser = new User({
      name: 'Test User',
      email: `test${Date.now()}@example.com`,
      password: 'password123',
      phone: '1234567890'
    });
    
    await testUser.save();
    
    res.status(201).json({
      success: true,
      message: 'Test user created successfully',
      user: {
        id: testUser._id,
        name: testUser.name,
        email: testUser.email
      }
    });
  } catch (error) {
    console.error('Create test user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create test user',
      error: error.message
    });
  }
});

export default router;