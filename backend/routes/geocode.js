import express from 'express';
import axios from 'axios';

const router = express.Router();

const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org';

// Rate limiting variables
let lastRequestTime = 0;
const minRequestInterval = 1000; // 1 second between requests

// Simple in-memory cache
const geocodeCache = new Map();

// Helper function to delay requests
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// GET /api/geocode - Geocode an address
router.get('/', async (req, res) => {
  try {
    const { address } = req.query;

    if (!address) {
      return res.status(400).json({
        success: false,
        message: 'Address parameter is required'
      });
    }

    // Check cache first
    if (geocodeCache.has(address)) {
      return res.json({
        success: true,
        ...geocodeCache.get(address)
      });
    }

    // Rate limiting - ensure at least 1 second between requests
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTime;
    if (timeSinceLastRequest < minRequestInterval) {
      await delay(minRequestInterval - timeSinceLastRequest);
    }

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
      timeout: 10000
    });

    lastRequestTime = Date.now();

    if (response.data.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No results found for the given address'
      });
    }

    const result = {
      coordinates: {
        lat: parseFloat(response.data[0].lat),
        lng: parseFloat(response.data[0].lon)
      },
      displayName: response.data[0].display_name,
      boundingBox: response.data[0].boundingbox
    };

    // Cache the result
    geocodeCache.set(address, result);

    res.json({
      success: true,
      ...result
    });

  } catch (error) {
    console.error('Geocoding error:', error);
    
    if (error.code === 'ECONNABORTED') {
      return res.status(408).json({
        success: false,
        message: 'Geocoding request timed out'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error geocoding address',
      error: error.message
    });
  }
});

// GET /api/geocode/reverse - Reverse geocode coordinates
router.get('/reverse', async (req, res) => {
  try {
    const { lat, lng } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude parameters are required'
      });
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);

    // Validate coordinates
    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      return res.status(400).json({
        success: false,
        message: 'Invalid coordinates'
      });
    }

    const cacheKey = `${latitude},${longitude}`;

    // Check cache first
    if (geocodeCache.has(cacheKey)) {
      return res.json({
        success: true,
        ...geocodeCache.get(cacheKey)
      });
    }

    // Rate limiting
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTime;
    if (timeSinceLastRequest < minRequestInterval) {
      await delay(minRequestInterval - timeSinceLastRequest);
    }

    const response = await axios.get(`${NOMINATIM_BASE_URL}/reverse`, {
      params: {
        format: 'json',
        lat: latitude,
        lon: longitude
      },
      headers: {
        'User-Agent': 'Sahayak-AI-App/1.0'
      },
      timeout: 10000
    });

    lastRequestTime = Date.now();

    const result = {
      address: response.data.display_name,
      components: response.data.address
    };

    // Cache the result
    geocodeCache.set(cacheKey, result);

    res.json({
      success: true,
      ...result
    });

  } catch (error) {
    console.error('Reverse geocoding error:', error);
    
    if (error.code === 'ECONNABORTED') {
      return res.status(408).json({
        success: false,
        message: 'Reverse geocoding request timed out'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error reverse geocoding coordinates',
      error: error.message
    });
  }
});

// POST /api/geocode/clear-cache - Clear geocoding cache (Admin only)
router.post('/clear-cache', (req, res) => {
  geocodeCache.clear();
  res.json({
    success: true,
    message: 'Geocoding cache cleared successfully'
  });
});

export default router;