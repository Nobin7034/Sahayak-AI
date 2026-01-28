import express from 'express';
import Service from '../models/Service.js';
import { userAuth } from '../middleware/auth.js';

const router = express.Router();

// Get all active services (public)
router.get('/', async (req, res) => {
  try {
    const services = await Service.find({ isActive: true })
      .select('-createdBy')
      .populate('documents.template')
      .populate('documents.alternatives.template')
      .sort({ visitCount: -1, createdAt: -1 });

    res.json({
      success: true,
      data: services
    });
  } catch (error) {
    console.error('Get services error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch services',
      error: error.message
    });
  }
});

// Get service by ID and increment visit count
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const service = await Service.findById(id)
      .populate('documents.template')
      .populate('documents.alternatives.template');
    if (!service || !service.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    // Increment visit count
    service.visitCount += 1;
    await service.save();

    res.json({
      success: true,
      data: service
    });
  } catch (error) {
    console.error('Get service error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch service',
      error: error.message
    });
  }
});

// Get services by category
router.get('/category/:category', async (req, res) => {
  try {
    const { category } = req.params;
    
    const services = await Service.find({ 
      category: new RegExp(category, 'i'), 
      isActive: true 
    }).select('-createdBy')
      .sort({ visitCount: -1, createdAt: -1 });

    res.json({
      success: true,
      data: services
    });
  } catch (error) {
    console.error('Get services by category error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch services',
      error: error.message
    });
  }
});

// Search services
router.get('/search/:query', async (req, res) => {
  try {
    const { query } = req.params;
    
    const services = await Service.find({
      $and: [
        { isActive: true },
        {
          $or: [
            { name: new RegExp(query, 'i') },
            { description: new RegExp(query, 'i') },
            { category: new RegExp(query, 'i') }
          ]
        }
      ]
    }).select('-createdBy')
      .sort({ visitCount: -1, createdAt: -1 });

    res.json({
      success: true,
      data: services
    });
  } catch (error) {
    console.error('Search services error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search services',
      error: error.message
    });
  }
});

// Get document requirements for a service
router.get('/:id/documents', async (req, res) => {
  try {
    const { id } = req.params;
    
    const service = await Service.findById(id)
      .populate('documents.template')
      .populate('documents.alternatives.template');
      
    if (!service || !service.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    // Calculate total documents
    const totalDocuments = (service.documents?.length || 0) + (service.requiredDocuments?.length || 0);
    const minimumRequired = service.minimumRequiredDocuments ?? Math.max(1, totalDocuments - 1);

    // Prepare document requirements response
    const documentRequirements = {
      serviceId: service._id,
      serviceName: service.name,
      totalDocuments,
      minimumRequired,
      documents: service.documents || [],
      legacyDocuments: service.requiredDocuments || [],
      instructions: `Please select at least ${minimumRequired} documents from the ${totalDocuments} available options to proceed with your application.`,
      validationRules: {
        totalRequired: totalDocuments,
        minimumThreshold: minimumRequired
      }
    };

    res.json({
      success: true,
      data: documentRequirements
    });
  } catch (error) {
    console.error('Get document requirements error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch document requirements',
      error: error.message
    });
  }
});

export default router;