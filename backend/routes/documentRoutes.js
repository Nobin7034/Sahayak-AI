import express from 'express';
import DocumentRequirement from '../models/DocumentRequirement.js';
import Service from '../models/Service.js';
import { userAuth } from '../middleware/auth.js';
import { staffAuth } from '../middleware/staffAuth.js';

const router = express.Router();

// Get document requirements for a service (public access)
router.get('/service/:serviceId', async (req, res) => {
  try {
    const { serviceId } = req.params;

    // Verify service exists
    const service = await Service.findById(serviceId);
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    // Get document requirements with populated templates
    const requirements = await DocumentRequirement.findOne({ service: serviceId })
      .populate('documents.alternatives.template', 'title imageUrl');
    
    if (!requirements) {
      // Fallback to service's rich document structure if no detailed requirements exist
      const serviceWithTemplates = await Service.findById(serviceId)
        .populate('documents.template', 'title imageUrl')
        .populate('documents.alternatives.template', 'title imageUrl');
      
      // Use rich documents structure if available, otherwise fall back to simple requiredDocuments
      const documentsToUse = serviceWithTemplates.documents && serviceWithTemplates.documents.length > 0 
        ? serviceWithTemplates.documents 
        : serviceWithTemplates.requiredDocuments;

      let formattedDocuments;
      
      if (Array.isArray(documentsToUse) && typeof documentsToUse[0] === 'string') {
        // Simple string array fallback
        formattedDocuments = documentsToUse.map((doc, index) => ({
          _id: `fallback_${index}`,
          name: doc,
          description: `Required document: ${doc}`,
          category: 'other',
          isMandatory: true,
          isRequired: true,
          alternatives: [],
          notes: 'Please bring original and one photocopy'
        }));
      } else {
        // Rich documents structure
        formattedDocuments = documentsToUse.map((doc, index) => ({
          _id: doc._id || `service_doc_${index}`,
          name: doc.name,
          description: doc.notes || `Required document: ${doc.name}`,
          category: 'other',
          isMandatory: doc.requirement === 'mandatory',
          isRequired: doc.requirement === 'mandatory',
          // Handle demo images from templates or direct URLs
          referenceImage: doc.template?.imageUrl || doc.imageUrl,
          sampleUrl: doc.template?.imageUrl || doc.imageUrl,
          alternatives: (doc.alternatives || []).map((alt, altIndex) => ({
            _id: alt._id || `alt_${index}_${altIndex}`,
            name: alt.name,
            description: alt.notes || `Alternative document: ${alt.name}`,
            referenceImage: alt.template?.imageUrl || alt.imageUrl,
            notes: alt.notes
          })),
          notes: doc.notes,
          validityPeriod: doc.validityPeriod,
          acceptableFormats: doc.acceptableFormats || ['original', 'self-attested copy']
        }));
      }

      return res.json({
        success: true,
        data: {
          service: serviceId,
          documents: formattedDocuments,
          minimumRequired: formattedDocuments.filter(doc => doc.isMandatory).length || formattedDocuments.length,
          totalDocuments: formattedDocuments.length,
          instructions: 'Please review the document requirements and ensure you have the necessary documents before proceeding.',
          validationRules: {
            totalRequired: formattedDocuments.length,
            minimumThreshold: formattedDocuments.filter(doc => doc.isMandatory).length || Math.ceil(formattedDocuments.length * 0.8)
          }
        }
      });
    }

    // Format the requirements data to ensure demo images are properly included
    const formattedRequirements = {
      ...requirements.toObject(),
      documents: requirements.documents.map(doc => ({
        ...doc.toObject(),
        // Ensure referenceImage and sampleUrl are available for frontend
        referenceImage: doc.referenceImage,
        sampleUrl: doc.referenceImage, // Alias for compatibility
        alternatives: doc.alternatives.map(alt => ({
          ...alt.toObject(),
          referenceImage: alt.referenceImage
        }))
      }))
    };

    res.json({
      success: true,
      data: formattedRequirements
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

// Validate user's document selection (public access for now)
router.post('/validate', async (req, res) => {
  try {
    const { serviceId, selectedDocuments } = req.body;

    if (!serviceId || !selectedDocuments || !Array.isArray(selectedDocuments)) {
      return res.status(400).json({
        success: false,
        message: 'Service ID and selected documents are required'
      });
    }

    // Get document requirements
    const requirements = await DocumentRequirement.findOne({ service: serviceId });
    
    if (!requirements) {
      return res.status(404).json({
        success: false,
        message: 'Document requirements not found for this service'
      });
    }

    // Validate selection
    const validation = validateDocumentSelection(requirements, selectedDocuments);

    res.json({
      success: true,
      data: validation
    });

  } catch (error) {
    console.error('Document validation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to validate document selection',
      error: error.message
    });
  }
});

// Staff: Update document validation status for appointment
router.put('/appointment/:appointmentId/validate', staffAuth, async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const { isValidated, missingDocuments, staffNotes } = req.body;

    const Appointment = (await import('../models/Appointment.js')).default;
    
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    // Update document validation
    appointment.documentValidation = {
      isValidated: isValidated || false,
      validatedBy: req.user.userId,
      validatedAt: new Date(),
      missingDocuments: missingDocuments || [],
      staffNotes: staffNotes || ''
    };

    await appointment.save();

    res.json({
      success: true,
      message: 'Document validation updated successfully',
      data: appointment.documentValidation
    });

  } catch (error) {
    console.error('Update document validation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update document validation',
      error: error.message
    });
  }
});

// Staff: Notify user about missing documents
router.post('/appointment/:appointmentId/notify-missing', staffAuth, async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const { missingDocuments, alternatives, message } = req.body;

    const Appointment = (await import('../models/Appointment.js')).default;
    const Notification = (await import('../models/Notification.js')).default;
    
    const appointment = await Appointment.findById(appointmentId)
      .populate('user', 'name email')
      .populate('service', 'name');

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    // Create notification for user
    const notification = new Notification({
      user: appointment.user._id,
      type: 'document_missing',
      title: 'Missing Documents for Appointment',
      message: message || `Some required documents are missing for your ${appointment.service.name} appointment.`,
      data: {
        appointmentId: appointment._id,
        serviceName: appointment.service.name,
        missingDocuments,
        alternatives,
        appointmentDate: appointment.appointmentDate
      },
      priority: 'high'
    });

    await notification.save();

    // Add staff comment to appointment
    appointment.comments.push({
      author: req.user.userId,
      authorType: 'staff',
      content: `Missing documents notification sent: ${missingDocuments.join(', ')}`,
      isVisible: true
    });

    await appointment.save();

    res.json({
      success: true,
      message: 'Missing document notification sent successfully'
    });

  } catch (error) {
    console.error('Notify missing documents error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send missing document notification',
      error: error.message
    });
  }
});

// Helper function to validate document selection
// Helper function to validate document selection with refined rules
function validateDocumentSelection(requirements, selectedDocuments) {
  const { documents, validationRules } = requirements;
  const { totalRequired, minimumThreshold, categoryRequirements, priorityRequirements } = validationRules;
  
  // Count selected documents
  const selectedCount = selectedDocuments.length;
  
  // Check if minimum threshold is met
  const meetsThreshold = selectedCount >= minimumThreshold;
  
  // Validate category requirements
  const categoryValidation = {};
  let categoryRequirementsMet = true;
  
  if (categoryRequirements && categoryRequirements.length > 0) {
    categoryRequirements.forEach(catReq => {
      const selectedInCategory = selectedDocuments.filter(selected => {
        const doc = documents.find(d => d._id.toString() === selected.documentId);
        return doc && doc.category === catReq.category;
      }).length;
      
      categoryValidation[catReq.category] = {
        required: catReq.minimumRequired,
        selected: selectedInCategory,
        met: selectedInCategory >= catReq.minimumRequired,
        description: catReq.description
      };
      
      if (selectedInCategory < catReq.minimumRequired) {
        categoryRequirementsMet = false;
      }
    });
  }
  
  // Validate priority requirements
  const priorityValidation = {};
  let priorityRequirementsMet = true;
  
  if (priorityRequirements && priorityRequirements.length > 0) {
    priorityRequirements.forEach(priReq => {
      const selectedInPriority = selectedDocuments.filter(selected => {
        const doc = documents.find(d => d._id.toString() === selected.documentId);
        return doc && doc.priority === priReq.priority;
      }).length;
      
      priorityValidation[priReq.priority] = {
        required: priReq.minimumRequired,
        selected: selectedInPriority,
        met: selectedInPriority >= priReq.minimumRequired,
        description: priReq.description
      };
      
      if (selectedInPriority < priReq.minimumRequired) {
        priorityRequirementsMet = false;
      }
    });
  }
  
  // Overall validation result
  const isValid = meetsThreshold && categoryRequirementsMet && priorityRequirementsMet;
  
  // Generate missing document suggestions
  const missingCategories = Object.entries(categoryValidation)
    .filter(([_, validation]) => !validation.met)
    .map(([category, validation]) => ({
      category,
      needed: validation.required - validation.selected,
      description: validation.description
    }));
  
  const missingPriorities = Object.entries(priorityValidation)
    .filter(([_, validation]) => !validation.met)
    .map(([priority, validation]) => ({
      priority: parseInt(priority),
      needed: validation.required - validation.selected,
      description: validation.description
    }));
  
  // Generate user-friendly message
  let message = '';
  if (isValid) {
    message = `Great! You have selected ${selectedCount} documents which meets the minimum requirement. You can proceed to center selection.`;
  } else {
    const issues = [];
    if (!meetsThreshold) {
      issues.push(`You need at least ${minimumThreshold} documents (currently have ${selectedCount})`);
    }
    if (missingCategories.length > 0) {
      missingCategories.forEach(cat => {
        issues.push(`Need ${cat.needed} more ${cat.category} document(s)`);
      });
    }
    if (missingPriorities.length > 0) {
      missingPriorities.forEach(pri => {
        const priorityName = pri.priority === 1 ? 'high priority' : pri.priority === 2 ? 'medium priority' : 'low priority';
        issues.push(`Need ${pri.needed} more ${priorityName} document(s)`);
      });
    }
    message = `Please select additional documents: ${issues.join(', ')}.`;
  }
  
  return {
    isValid,
    selectedCount,
    totalRequired,
    minimumThreshold,
    meetsThreshold,
    categoryValidation,
    priorityValidation,
    categoryRequirementsMet,
    priorityRequirementsMet,
    missingCategories,
    missingPriorities,
    canProceed: isValid,
    message,
    completionPercentage: Math.round((selectedCount / totalRequired) * 100)
  };
}

export default router;