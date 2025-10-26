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
    
    if (result.success) {
      res.json({
        success: true,
        data: {
          recommendations: result.recommendations,
          type: result.type,
          count: result.recommendations.length
        }
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message || 'Failed to get recommendations'
      });
    }
  } catch (error) {
    console.error('Recommendations API error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
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
    
    if (result.success) {
      res.json({
        success: true,
        data: {
          predictedCategory: result.predictedCategory,
          confidence: result.confidence,
          probabilities: result.probabilities
        }
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message || 'Categorization failed'
      });
    }
  } catch (error) {
    console.error('Categorization API error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
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
    
    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'Date is required (YYYY-MM-DD format)'
      });
    }
    
    const result = await mlService.predictOptimalSchedule(serviceId, date);
    
    if (result.success) {
      res.json({
        success: true,
        data: {
          service: result.service,
          predictions: result.predictions,
          bestTimeSlot: result.bestTimeSlot,
          recommendedSlots: result.predictions.filter(p => p.recommended)
        }
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message || 'Schedule prediction failed'
      });
    }
  } catch (error) {
    console.error('Schedule prediction API error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
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

// Retrain all ML models
router.post('/retrain', authenticate, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }
    
    const results = await mlService.retrainAllModels();
    
    res.json({
      success: true,
      data: {
        results: results,
        message: 'Model retraining completed'
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

// Train individual models
router.post('/train/:model', authenticate, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }
    
    const { model } = req.params;
    let result = false;
    
    switch (model) {
      case 'knn':
        result = await mlService.trainKNN();
        break;
      case 'bayes':
        result = await mlService.trainBayesianClassifier();
        break;
      case 'decisiontree':
        result = await mlService.trainDecisionTree();
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid model name. Use: knn, bayes, or decisiontree'
        });
    }
    
    res.json({
      success: result,
      data: {
        model: model,
        trained: result,
        message: result ? `${model} model trained successfully` : `${model} model training failed`
      }
    });
  } catch (error) {
    console.error('Individual model training API error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

export default router;
