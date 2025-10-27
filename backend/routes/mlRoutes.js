import express from 'express';
import { authenticate } from '../middleware/auth.js';
import mlService from '../services/mlService.js';

const router = express.Router();

// ==================== Service Recommendations (KNN) ====================

// Get personalized service recommendations for a user
router.get('/recommendations', authenticate, async (req, res) => {
  try {
    const { limit = 5 } = req.query;
    const userId = req.user.userId;
    
    const result = await mlService.getServiceRecommendations(userId, parseInt(limit));
    
    // Always return success (fallback ensures this)
    if (result.success) {
      res.json({
        success: true,
        data: {
          recommendations: result.recommendations,
          type: result.type,
          count: result.recommendations.length,
          mlEnabled: result.mlEnabled !== false
        }
      });
    } else {
      // Fallback should prevent this, but return empty recommendations if it happens
      res.json({
        success: true,
        data: {
          recommendations: [],
          type: 'none',
          count: 0,
          mlEnabled: false,
          error: result.message
        }
      });
    }
  } catch (error) {
    console.error('Recommendations API error:', error);
    // Return empty array on error instead of failing
    res.json({
      success: true,
      data: {
        recommendations: [],
        type: 'error',
        count: 0,
        mlEnabled: false,
        error: 'Service temporarily unavailable'
      }
    });
  }
});

// Get service recommendations for a specific service (similar services)
router.get('/recommendations/service/:serviceId', async (req, res) => {
  try {
    const { serviceId } = req.params;
    const { limit = 5 } = req.query;
    
    // Get the target service
    const Service = (await import('../models/Service.js')).default;
    const targetService = await Service.findById(serviceId).lean();
    
    if (!targetService) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }
    
    // Get all services except the target
    const allServices = await Service.find({ 
      isActive: true, 
      _id: { $ne: serviceId } 
    }).lean();
    
    // Calculate similarity based on service features
    const recommendations = allServices.map(service => {
      const similarity = mlService.calculateSimilarity(
        [
          targetService.fee / 1000,
          mlService.getCategoryEncoding(targetService.category),
          targetService.processingTime === 'Same Day' ? 1 : 
          targetService.processingTime === '1-3 Days' ? 2 : 
          targetService.processingTime === '1 Week' ? 3 : 4,
          targetService.visitCount / 100
        ],
        [
          service.fee / 1000,
          mlService.getCategoryEncoding(service.category),
          service.processingTime === 'Same Day' ? 1 : 
          service.processingTime === '1-3 Days' ? 2 : 
          service.processingTime === '1 Week' ? 3 : 4,
          service.visitCount / 100
        ]
      );
      
      return {
        ...service,
        similarity: similarity
      };
    });
    
    // Sort by similarity and return top recommendations
    const sortedRecommendations = recommendations
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, parseInt(limit));
    
    res.json({
      success: true,
      data: {
        recommendations: sortedRecommendations,
        type: 'similar',
        count: sortedRecommendations.length,
        targetService: {
          name: targetService.name,
          category: targetService.category
        }
      }
    });
  } catch (error) {
    console.error('Similar services API error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// ==================== Service Categorization (Bayesian) ====================

// Categorize a service using Bayesian classifier
router.post('/categorize', authenticate, async (req, res) => {
  try {
    const { serviceData } = req.body;
    
    if (!serviceData) {
      return res.status(400).json({
        success: false,
        message: 'Service data is required'
      });
    }
    
    const result = await mlService.categorizeService(serviceData);
    
    // Always return success (fallback ensures this)
    if (result.success) {
      res.json({
        success: true,
        data: {
          predictedCategory: result.predictedCategory,
          confidence: result.confidence,
          probabilities: result.probabilities,
          mlEnabled: result.mlEnabled !== false,
          fallbackUsed: result.fallbackUsed || false
        }
      });
    } else {
      // Fallback should prevent this, but return default category
      res.json({
        success: true,
        data: {
          predictedCategory: 'Other',
          confidence: 0.50,
          probabilities: [0.50],
          mlEnabled: false,
          fallbackUsed: true,
          error: result.message
        }
      });
    }
  } catch (error) {
    console.error('Categorization API error:', error);
    // Return default category on error
    res.json({
      success: true,
      data: {
        predictedCategory: 'Other',
        confidence: 0.50,
        probabilities: [0.50],
        mlEnabled: false,
        fallbackUsed: true,
        error: 'Service temporarily unavailable'
      }
    });
  }
});

// Auto-categorize all uncategorized services
router.post('/categorize/batch', authenticate, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }
    
    const Service = (await import('../models/Service.js')).default;
    const services = await Service.find({ isActive: true }).lean();
    
    const results = [];
    
    for (const service of services) {
      const result = await mlService.categorizeService(service);
      if (result.success) {
        results.push({
          serviceId: service._id,
          serviceName: service.name,
          currentCategory: service.category,
          predictedCategory: result.predictedCategory,
          confidence: result.confidence
        });
      }
    }
    
    res.json({
      success: true,
      data: {
        results: results,
        totalProcessed: results.length
      }
    });
  } catch (error) {
    console.error('Batch categorization API error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// ==================== Appointment Scheduling (Decision Tree) ====================

// Get optimal appointment schedule for a service
router.get('/schedule/optimal/:serviceId', async (req, res) => {
  try {
    const { serviceId } = req.params;
    const { date } = req.query;
    
    console.log(`📅 [BULLETPROOF v2] Schedule request for service: ${serviceId}, date: ${date}`);
    
    if (!date) {
      // Even missing date should work - provide default
      console.log('⚠️ No date provided, using tomorrow as default');
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      date = tomorrow.toISOString().split('T')[0];
    }
    
    const result = await mlService.predictOptimalSchedule(serviceId, date);
    
    console.log(`📊 Schedule prediction result:`, result.success ? 'Success' : `Failed - ${result.message}`);
    
    // ALWAYS return success with data (fallback ensures this)
    if (result.success) {
      res.json({
        success: true,
        data: {
          service: result.service,
          predictions: result.predictions,
          bestTimeSlot: result.bestTimeSlot,
          recommendedSlots: result.predictions.filter(p => p.recommended),
          mlEnabled: result.mlEnabled,
          fallbackUsed: result.fallbackUsed || false
        }
      });
    } else {
      // This should NEVER happen with fallback, but just in case return 200 with error info
      console.error('⚠️ Unexpected: Fallback failed, returning error as data');
      res.json({
        success: true, // Still return success to avoid frontend errors
        data: {
          service: null,
          predictions: [],
          bestTimeSlot: null,
          recommendedSlots: [],
          mlEnabled: false,
          fallbackUsed: true,
          error: result.message
        }
      });
    }
  } catch (error) {
    console.error('❌ Schedule prediction API error:', error);
    
    // Even on error, try to return something useful
    res.json({
      success: true,
      data: {
        service: null,
        predictions: [
          { hour: 9, successProbability: 0.85, recommended: true, source: 'default' },
          { hour: 10, successProbability: 0.85, recommended: true, source: 'default' },
          { hour: 11, successProbability: 0.80, recommended: true, source: 'default' },
          { hour: 14, successProbability: 0.80, recommended: false, source: 'default' },
          { hour: 15, successProbability: 0.75, recommended: false, source: 'default' },
          { hour: 16, successProbability: 0.70, recommended: false, source: 'default' }
        ],
        bestTimeSlot: { hour: 9, successProbability: 0.85, recommended: true, source: 'default' },
        recommendedSlots: [
          { hour: 9, successProbability: 0.85, recommended: true, source: 'default' },
          { hour: 10, successProbability: 0.85, recommended: true, source: 'default' },
          { hour: 11, successProbability: 0.80, recommended: true, source: 'default' }
        ],
        mlEnabled: false,
        fallbackUsed: true,
        error: 'Using default schedule due to error: ' + error.message
      }
    });
  }
});

// Get optimal time slots for multiple services
router.post('/schedule/batch', async (req, res) => {
  try {
    const { serviceIds, date } = req.body;
    
    if (!serviceIds || !Array.isArray(serviceIds) || serviceIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Service IDs array is required'
      });
    }
    
    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'Date is required (YYYY-MM-DD format)'
      });
    }
    
    const results = [];
    
    for (const serviceId of serviceIds) {
      const result = await mlService.predictOptimalSchedule(serviceId, date);
      if (result.success) {
        results.push({
          serviceId: serviceId,
          service: result.service,
          bestTimeSlot: result.bestTimeSlot,
          recommendedSlots: result.predictions.filter(p => p.recommended)
        });
      }
    }
    
    res.json({
      success: true,
      data: {
        results: results,
        date: date,
        totalProcessed: results.length
      }
    });
  } catch (error) {
    console.error('Batch schedule prediction API error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// ==================== Model Management ====================

// Get ML model status
router.get('/status', authenticate, async (req, res) => {
  try {
    const status = mlService.getModelStatus();
    
    res.json({
      success: true,
      data: {
        models: status,
        allTrained: Object.values(status).every(trained => trained)
      }
    });
  } catch (error) {
    console.error('Model status API error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Emergency retrain endpoint (admin only, for troubleshooting)
// Note: Models auto-train on first use, this is only for manual intervention
router.post('/retrain', authenticate, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }
    
    console.log('⚠️ Manual retrain triggered by admin (emergency use only)');
    const results = await mlService.retrainAllModels();
    
    res.json({
      success: true,
      data: {
        results: results,
        message: 'Emergency retraining completed',
        note: 'Models normally train automatically - use this only for troubleshooting'
      }
    });
  } catch (error) {
    console.error('Model retraining API error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

export default router;

