import express from 'express';
import mongoose from 'mongoose';
import CenterRating from '../models/CenterRating.js';
import Appointment from '../models/Appointment.js';
import { authenticate } from '../middleware/auth.js';
import { staffAuth, centerAccess, requirePermission } from '../middleware/staffAuth.js';

const router = express.Router();

// User submits a rating for a center (after appointment completion)
router.post('/', authenticate, async (req, res) => {
  try {
    const { centerId, appointmentId, rating, review, categories } = req.body;

    // Validate required fields
    if (!centerId || !rating) {
      return res.status(400).json({
        success: false,
        message: 'Center ID and rating are required'
      });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5'
      });
    }

    // If appointmentId is provided, verify the appointment exists and belongs to the user
    if (appointmentId) {
      const appointment = await Appointment.findOne({
        _id: appointmentId,
        user: req.user.userId,
        center: centerId,
        status: 'completed'
      });

      if (!appointment) {
        return res.status(404).json({
          success: false,
          message: 'Completed appointment not found'
        });
      }

      // Check if rating already exists for this appointment
      const existingRating = await CenterRating.findOne({
        appointment: appointmentId,
        user: req.user.userId
      });

      if (existingRating) {
        return res.status(400).json({
          success: false,
          message: 'You have already rated this appointment'
        });
      }
    }

    // Create rating
    const newRating = await CenterRating.create({
      center: centerId,
      user: req.user.userId,
      appointment: appointmentId || undefined,
      rating,
      review: review || '',
      categories: categories || {},
      isVerified: appointmentId ? true : false // Verified if linked to appointment
    });

    await newRating.populate('user', 'name');

    res.status(201).json({
      success: true,
      message: 'Rating submitted successfully',
      data: newRating
    });

  } catch (error) {
    console.error('Submit rating error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit rating',
      error: error.message
    });
  }
});

// Get ratings for a center (public)
router.get('/center/:centerId', async (req, res) => {
  try {
    const { centerId } = req.params;
    const { page = 1, limit = 10, sort = 'recent' } = req.query;

    // Build query
    const query = {
      center: centerId,
      status: 'active'
    };

    // Build sort
    let sortOption = {};
    switch (sort) {
      case 'recent':
        sortOption = { createdAt: -1 };
        break;
      case 'highest':
        sortOption = { rating: -1, createdAt: -1 };
        break;
      case 'lowest':
        sortOption = { rating: 1, createdAt: -1 };
        break;
      case 'helpful':
        sortOption = { 'helpful.length': -1, createdAt: -1 };
        break;
      default:
        sortOption = { createdAt: -1 };
    }

    // Get ratings with pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const ratings = await CenterRating.find(query)
      .populate('user', 'name')
      .populate('response.respondedBy', 'name')
      .sort(sortOption)
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count
    const total = await CenterRating.countDocuments(query);

    // Get rating statistics
    const stats = await CenterRating.calculateCenterRating(centerId);
    const distribution = await CenterRating.getRatingDistribution(centerId);

    res.json({
      success: true,
      data: {
        ratings,
        stats,
        distribution,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / parseInt(limit))
        }
      }
    });

  } catch (error) {
    console.error('Get center ratings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch ratings',
      error: error.message
    });
  }
});

// Get user's rating for a center
router.get('/my-rating/:centerId', authenticate, async (req, res) => {
  try {
    const { centerId } = req.params;
    const { appointmentId } = req.query;

    const query = {
      center: centerId,
      user: req.user.userId
    };

    if (appointmentId) {
      query.appointment = appointmentId;
    }

    const rating = await CenterRating.findOne(query)
      .populate('center', 'name')
      .populate('response.respondedBy', 'name');

    res.json({
      success: true,
      data: rating
    });

  } catch (error) {
    console.error('Get user rating error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch rating',
      error: error.message
    });
  }
});

// Update user's rating
router.put('/:ratingId', authenticate, async (req, res) => {
  try {
    const { ratingId } = req.params;
    const { rating, review, categories } = req.body;

    // Find rating
    const existingRating = await CenterRating.findOne({
      _id: ratingId,
      user: req.user.userId
    });

    if (!existingRating) {
      return res.status(404).json({
        success: false,
        message: 'Rating not found'
      });
    }

    // Update fields
    if (rating !== undefined) {
      if (rating < 1 || rating > 5) {
        return res.status(400).json({
          success: false,
          message: 'Rating must be between 1 and 5'
        });
      }
      existingRating.rating = rating;
    }

    if (review !== undefined) {
      existingRating.review = review;
    }

    if (categories) {
      existingRating.categories = { ...existingRating.categories, ...categories };
    }

    await existingRating.save();

    res.json({
      success: true,
      message: 'Rating updated successfully',
      data: existingRating
    });

  } catch (error) {
    console.error('Update rating error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update rating',
      error: error.message
    });
  }
});

// Delete user's rating
router.delete('/:ratingId', authenticate, async (req, res) => {
  try {
    const { ratingId } = req.params;

    const rating = await CenterRating.findOneAndDelete({
      _id: ratingId,
      user: req.user.userId
    });

    if (!rating) {
      return res.status(404).json({
        success: false,
        message: 'Rating not found'
      });
    }

    res.json({
      success: true,
      message: 'Rating deleted successfully'
    });

  } catch (error) {
    console.error('Delete rating error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete rating',
      error: error.message
    });
  }
});

// Mark rating as helpful
router.post('/:ratingId/helpful', authenticate, async (req, res) => {
  try {
    const { ratingId } = req.params;

    const rating = await CenterRating.findById(ratingId);

    if (!rating) {
      return res.status(404).json({
        success: false,
        message: 'Rating not found'
      });
    }

    await rating.markHelpful(req.user.userId);

    res.json({
      success: true,
      message: 'Rating marked as helpful',
      data: { helpfulCount: rating.helpful.length }
    });

  } catch (error) {
    console.error('Mark helpful error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark rating as helpful',
      error: error.message
    });
  }
});

// Report rating
router.post('/:ratingId/report', authenticate, async (req, res) => {
  try {
    const { ratingId } = req.params;
    const { reason } = req.body;

    if (!reason || reason.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Report reason is required'
      });
    }

    const rating = await CenterRating.findById(ratingId);

    if (!rating) {
      return res.status(404).json({
        success: false,
        message: 'Rating not found'
      });
    }

    await rating.report(req.user.userId, reason);

    res.json({
      success: true,
      message: 'Rating reported successfully'
    });

  } catch (error) {
    console.error('Report rating error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to report rating',
      error: error.message
    });
  }
});

// Staff responds to rating
router.post('/:ratingId/respond', staffAuth, centerAccess, requirePermission('manage_ratings'), async (req, res) => {
  try {
    const { ratingId } = req.params;
    const { responseText } = req.body;

    if (!responseText || responseText.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Response text is required'
      });
    }

    // Find rating and verify it belongs to staff's center
    const rating = await CenterRating.findOne({
      _id: ratingId,
      center: req.staff.centerId
    });

    if (!rating) {
      return res.status(404).json({
        success: false,
        message: 'Rating not found'
      });
    }

    // Add response
    rating.response = {
      text: responseText,
      respondedBy: req.user.userId,
      respondedAt: new Date()
    };

    await rating.save();
    await rating.populate('response.respondedBy', 'name');

    res.json({
      success: true,
      message: 'Response added successfully',
      data: rating
    });

  } catch (error) {
    console.error('Respond to rating error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add response',
      error: error.message
    });
  }
});

// Staff gets all ratings for their center
router.get('/staff/center-ratings', staffAuth, centerAccess, requirePermission('view_ratings'), async (req, res) => {
  try {
    const { page = 1, limit = 20, status = 'active', minRating, maxRating } = req.query;

    // Build query
    const query = {
      center: req.staff.centerId,
      status
    };

    if (minRating) {
      query.rating = { ...query.rating, $gte: parseInt(minRating) };
    }

    if (maxRating) {
      query.rating = { ...query.rating, $lte: parseInt(maxRating) };
    }

    // Get ratings with pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const ratings = await CenterRating.find(query)
      .populate('user', 'name email')
      .populate('appointment', 'appointmentDate service')
      .populate('response.respondedBy', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count
    const total = await CenterRating.countDocuments(query);

    // Get rating statistics
    const stats = await CenterRating.calculateCenterRating(req.staff.centerId);
    const distribution = await CenterRating.getRatingDistribution(req.staff.centerId);

    res.json({
      success: true,
      data: {
        ratings,
        stats,
        distribution,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / parseInt(limit))
        }
      }
    });

  } catch (error) {
    console.error('Get staff center ratings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch ratings',
      error: error.message
    });
  }
});

// Staff hides/unhides a rating
router.put('/staff/:ratingId/visibility', staffAuth, centerAccess, requirePermission('manage_ratings'), async (req, res) => {
  try {
    const { ratingId } = req.params;
    const { status } = req.body;

    if (!['active', 'hidden'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be "active" or "hidden"'
      });
    }

    // Find rating and verify it belongs to staff's center
    const rating = await CenterRating.findOne({
      _id: ratingId,
      center: req.staff.centerId
    });

    if (!rating) {
      return res.status(404).json({
        success: false,
        message: 'Rating not found'
      });
    }

    rating.status = status;
    await rating.save();

    res.json({
      success: true,
      message: `Rating ${status === 'hidden' ? 'hidden' : 'made visible'} successfully`
    });

  } catch (error) {
    console.error('Update rating visibility error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update rating visibility',
      error: error.message
    });
  }
});

export default router;
