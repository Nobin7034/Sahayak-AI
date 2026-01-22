import express from 'express';
import AkshayaCenter from '../models/AkshayaCenter.js';
import Service from '../models/Service.js';
import axios from 'axios';

const router = express.Router();

// Nominatim API configuration
const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org';

// Helper function for geocoding
async function geocodeAddress(address) {
  try {
    const response = await axios.get(`${NOMINATIM_BASE_URL}/search`, {
      params: {
        format: 'json',
        q: address,
        limit: 1,
        countrycodes: 'in'
      },
      headers: {
        'User-Agent': 'Sahayak-AI-App/1.0'
      },
      timeout: 5000
    });

    if (response.data.length === 0) {
      throw new Error('No results found for the given address');
    }

    return {
      coordinates: {
        lat: parseFloat(response.data[0].lat),
        lng: parseFloat(response.data[0].lon)
      },
      displayName: response.data[0].display_name
    };
  } catch (error) {
    console.error('Geocoding error:', error);
    throw error;
  }
}

// GET /api/centers - Get all centers (public endpoint shows only active)
router.get('/', async (req, res) => {
  try {
    const centers = await AkshayaCenter.find({ status: 'active' })
      .populate('services', 'name category fees processingTime')
      .sort({ name: 1 });
    
    res.json({
      success: true,
      centers,
      total: centers.length
    });
  } catch (error) {
    console.error('Error fetching centers:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching centers',
      error: error.message
    });
  }
});

// GET /api/centers/admin/all - Get all centers for admin (including inactive)
router.get('/admin/all', async (req, res) => {
  try {
    const centers = await AkshayaCenter.find({})
      .populate('services', 'name category fees processingTime')
      .populate('registeredBy', 'name email role isActive approvalStatus') // Added isActive and approvalStatus
      .sort({ name: 1 });
    
    res.json({
      success: true,
      centers,
      total: centers.length
    });
  } catch (error) {
    console.error('Error fetching all centers:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching centers',
      error: error.message
    });
  }
});

// GET /api/centers/nearby - Get nearby centers
router.get('/nearby', async (req, res) => {
  try {
    const { lat, lng, radius = 50 } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required'
      });
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);
    const maxDistance = parseFloat(radius) * 1000; // Convert km to meters

    // Validate coordinates
    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      return res.status(400).json({
        success: false,
        message: 'Invalid coordinates'
      });
    }

    const centers = await AkshayaCenter.findNearby(longitude, latitude, maxDistance)
      .populate('services', 'name category fees processingTime');

    // Add distance to each center
    const centersWithDistance = centers.map(center => {
      const distance = center.distanceFrom(longitude, latitude);
      return {
        ...center.toObject(),
        distance: Math.round(distance * 100) / 100 // Round to 2 decimal places
      };
    });

    res.json({
      success: true,
      centers: centersWithDistance,
      total: centersWithDistance.length,
      searchLocation: { lat: latitude, lng: longitude },
      radius: parseFloat(radius)
    });
  } catch (error) {
    console.error('Error fetching nearby centers:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching nearby centers',
      error: error.message
    });
  }
});

// GET /api/centers/search - Search centers by location
router.get('/search', async (req, res) => {
  try {
    const { query, radius = 50 } = req.query;

    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    // First, geocode the search query
    const geocodeResult = await geocodeAddress(query);
    const { lat, lng } = geocodeResult.coordinates;
    const maxDistance = parseFloat(radius) * 1000; // Convert km to meters

    // Find nearby centers
    const centers = await AkshayaCenter.findNearby(lng, lat, maxDistance)
      .populate('services', 'name category fees processingTime');

    // Add distance to each center
    const centersWithDistance = centers.map(center => {
      const distance = center.distanceFrom(lng, lat);
      return {
        ...center.toObject(),
        distance: Math.round(distance * 100) / 100
      };
    });

    res.json({
      success: true,
      centers: centersWithDistance,
      total: centersWithDistance.length,
      searchQuery: query,
      searchLocation: { lat, lng },
      displayName: geocodeResult.displayName,
      radius: parseFloat(radius)
    });
  } catch (error) {
    console.error('Error searching centers:', error);
    res.status(500).json({
      success: false,
      message: 'Error searching centers',
      error: error.message
    });
  }
});

// GET /api/centers/:id - Get center by ID
router.get('/:id', async (req, res) => {
  try {
    const center = await AkshayaCenter.findById(req.params.id)
      .populate('services', 'name description category fees processingTime requiredDocuments');

    if (!center) {
      return res.status(404).json({
        success: false,
        message: 'Center not found'
      });
    }

    // Increment visit count
    center.metadata.visitCount += 1;
    await center.save();

    res.json({
      success: true,
      center: {
        ...center.toObject(),
        isCurrentlyOpen: center.isCurrentlyOpen
      }
    });
  } catch (error) {
    console.error('Error fetching center:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching center details',
      error: error.message
    });
  }
});

// GET /api/centers/:id/services - Get services for a specific center
router.get('/:id/services', async (req, res) => {
  try {
    const center = await AkshayaCenter.findById(req.params.id)
      .populate('services');

    if (!center) {
      return res.status(404).json({
        success: false,
        message: 'Center not found'
      });
    }

    res.json({
      success: true,
      services: center.services,
      centerName: center.name
    });
  } catch (error) {
    console.error('Error fetching center services:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching center services',
      error: error.message
    });
  }
});

// POST /api/centers - Create new center (Admin only)
router.post('/', async (req, res) => {
  try {
    const {
      name,
      address,
      contact,
      operatingHours,
      services = [],
      capacity
    } = req.body;

    // Geocode the address to get coordinates
    const fullAddress = `${address.street}, ${address.city}, ${address.district}, ${address.state}, ${address.pincode}`;
    const geocodeResult = await geocodeAddress(fullAddress);

    // Get all existing services to auto-assign to the new center
    const allServices = await Service.find({});
    const serviceIds = allServices.map(service => service._id);

    const centerData = {
      name,
      address,
      location: {
        type: 'Point',
        coordinates: [geocodeResult.coordinates.lng, geocodeResult.coordinates.lat]
      },
      contact,
      operatingHours: operatingHours || {},
      services: serviceIds, // Auto-assign all existing services
      capacity: capacity || {}
    };

    const center = new AkshayaCenter(centerData);
    await center.save();

    // Populate services for response
    await center.populate('services', 'name category fees processingTime');

    res.status(201).json({
      success: true,
      message: `Center created successfully with ${serviceIds.length} services automatically assigned`,
      center
    });
  } catch (error) {
    console.error('Error creating center:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating center',
      error: error.message
    });
  }
});

// PUT /api/centers/:id - Update center (Admin only)
router.put('/:id', async (req, res) => {
  try {
    const center = await AkshayaCenter.findById(req.params.id);
    
    if (!center) {
      return res.status(404).json({
        success: false,
        message: 'Center not found'
      });
    }

    // If address is being updated, re-geocode
    if (req.body.address) {
      const fullAddress = `${req.body.address.street}, ${req.body.address.city}, ${req.body.address.district}, ${req.body.address.state}, ${req.body.address.pincode}`;
      const geocodeResult = await geocodeAddress(fullAddress);
      req.body.location = {
        type: 'Point',
        coordinates: [geocodeResult.coordinates.lng, geocodeResult.coordinates.lat]
      };
    }

    Object.assign(center, req.body);
    await center.save();

    res.json({
      success: true,
      message: 'Center updated successfully',
      center
    });
  } catch (error) {
    console.error('Error updating center:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating center',
      error: error.message
    });
  }
});

// DELETE /api/centers/:id - Soft delete center (Admin only)
router.delete('/:id', async (req, res) => {
  try {
    const center = await AkshayaCenter.findById(req.params.id);
    
    if (!center) {
      return res.status(404).json({
        success: false,
        message: 'Center not found'
      });
    }

    // Soft delete by setting status to inactive
    center.status = 'inactive';
    center.updatedAt = new Date();
    await center.save();

    // Also update the associated staff user status if exists
    const User = (await import('../models/User.js')).default;
    if (center.registeredBy) {
      await User.findByIdAndUpdate(center.registeredBy, { 
        isActive: false,
        updatedAt: new Date()
      });
    }

    res.json({
      success: true,
      message: 'Center marked as inactive successfully'
    });
  } catch (error) {
    console.error('Error deactivating center:', error);
    res.status(500).json({
      success: false,
      message: 'Error deactivating center',
      error: error.message
    });
  }
});

// DELETE /api/centers/:id/permanent - Permanently delete center (Admin only)
router.delete('/:id/permanent', async (req, res) => {
  try {
    const center = await AkshayaCenter.findById(req.params.id);
    
    if (!center) {
      return res.status(404).json({
        success: false,
        message: 'Center not found'
      });
    }

    // Only allow permanent deletion of inactive centers
    if (center.status !== 'inactive') {
      return res.status(400).json({
        success: false,
        message: 'Only inactive centers can be permanently deleted. Please deactivate the center first.'
      });
    }

    // Delete associated staff records first
    const { default: Staff } = await import('../models/Staff.js');
    await Staff.deleteMany({ center: center._id });

    // Delete associated appointments if any
    const { default: Appointment } = await import('../models/Appointment.js');
    await Appointment.deleteMany({ center: center._id });

    // Delete the associated staff user if exists
    const User = (await import('../models/User.js')).default;
    if (center.registeredBy) {
      await User.findByIdAndDelete(center.registeredBy);
    }

    // Finally delete the center
    await AkshayaCenter.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Center permanently deleted successfully'
    });
  } catch (error) {
    console.error('Error permanently deleting center:', error);
    res.status(500).json({
      success: false,
      message: 'Error permanently deleting center',
      error: error.message
    });
  }
});

// POST /api/centers/sync-services - Sync all services to all centers (Admin only)
router.post('/sync-services', async (req, res) => {
  try {
    const result = await AkshayaCenter.autoAssignServicesToAllCenters();
    
    res.json({
      success: true,
      message: `Successfully synced ${result.servicesCount} services to ${result.centersUpdated} centers`,
      data: result
    });
  } catch (error) {
    console.error('Error syncing services to centers:', error);
    res.status(500).json({
      success: false,
      message: 'Error syncing services to centers',
      error: error.message
    });
  }
});
export default router;