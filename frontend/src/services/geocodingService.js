const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org';

class GeocodingService {
  constructor() {
    this.cache = new Map();
    this.pincodeCache = new Map();
    this.lastRequestTime = 0;
    this.minRequestInterval = 1000; // 1 second between requests to respect Nominatim policy
  }

  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async geocodeAddress(address) {
    // Check cache first
    if (this.cache.has(address)) {
      return this.cache.get(address);
    }

    // Rate limiting - ensure at least 1 second between requests
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    if (timeSinceLastRequest < this.minRequestInterval) {
      await this.delay(this.minRequestInterval - timeSinceLastRequest);
    }

    try {
      const response = await fetch(
        `${NOMINATIM_BASE_URL}/search?format=json&q=${encodeURIComponent(address)}&limit=1&countrycodes=in`,
        {
          headers: {
            'User-Agent': 'Sahayak-AI-App/1.0'
          }
        }
      );

      this.lastRequestTime = Date.now();

      if (!response.ok) {
        throw new Error(`Geocoding request failed: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.length === 0) {
        throw new Error('No results found for the given address');
      }

      const result = {
        coordinates: {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon)
        },
        displayName: data[0].display_name,
        boundingBox: data[0].boundingbox
      };

      // Cache the result
      this.cache.set(address, result);
      
      return result;
    } catch (error) {
      console.error('Geocoding error:', error);
      throw error;
    }
  }

  async reverseGeocode(lat, lng) {
    const cacheKey = `${lat},${lng}`;
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    // Rate limiting
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    if (timeSinceLastRequest < this.minRequestInterval) {
      await this.delay(this.minRequestInterval - timeSinceLastRequest);
    }

    try {
      const response = await fetch(
        `${NOMINATIM_BASE_URL}/reverse?format=json&lat=${lat}&lon=${lng}`,
        {
          headers: {
            'User-Agent': 'Sahayak-AI-App/1.0'
          }
        }
      );

      this.lastRequestTime = Date.now();

      if (!response.ok) {
        throw new Error(`Reverse geocoding request failed: ${response.status}`);
      }

      const data = await response.json();
      
      const result = {
        address: data.display_name,
        components: data.address
      };

      // Cache the result
      this.cache.set(cacheKey, result);
      
      return result;
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      throw error;
    }
  }

  clearCache() {
    this.cache.clear();
  }

  /**
   * Validates if the input string is a valid Indian pincode format
   * @param {string} pincode - The pincode string to validate
   * @returns {boolean} - True if valid 6-digit pincode format
   */
  validatePincodeFormat(pincode) {
    if (!pincode || typeof pincode !== 'string') {
      return false;
    }
    
    // Remove any whitespace and check if it's exactly 6 digits
    const cleanPincode = pincode.trim();
    return /^\d{6}$/.test(cleanPincode);
  }

  /**
   * Gets cached pincode result if available
   * @param {string} pincode - The pincode to check in cache
   * @returns {Object|null} - Cached result or null if not found
   */
  getCachedPincodeResult(pincode) {
    return this.pincodeCache.get(pincode) || null;
  }

  /**
   * Geocodes a pincode to geographical coordinates
   * @param {string} pincode - 6-digit Indian pincode
   * @returns {Promise<Object>} - Geocoding result with coordinates and address info
   */
  async geocodePincode(pincode) {
    // Validate pincode format first
    if (!this.validatePincodeFormat(pincode)) {
      throw new Error('Invalid pincode format. Please enter a valid 6-digit pincode.');
    }

    const cleanPincode = pincode.trim();

    // Check cache first
    const cachedResult = this.getCachedPincodeResult(cleanPincode);
    if (cachedResult) {
      return cachedResult;
    }

    // Rate limiting - ensure at least 1 second between requests
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    if (timeSinceLastRequest < this.minRequestInterval) {
      await this.delay(this.minRequestInterval - timeSinceLastRequest);
    }

    try {
      // Search for pincode in India specifically
      const response = await fetch(
        `${NOMINATIM_BASE_URL}/search?format=json&q=${cleanPincode}&limit=1&countrycodes=in&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'Sahayak-AI-App/1.0'
          }
        }
      );

      this.lastRequestTime = Date.now();

      if (!response.ok) {
        throw new Error(`Pincode geocoding request failed: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.length === 0) {
        throw new Error(`Pincode ${cleanPincode} not found. Please check the pincode and try again.`);
      }

      const locationData = data[0];
      
      // Extract address components
      const address = locationData.address || {};
      
      const result = {
        coordinates: {
          lat: parseFloat(locationData.lat),
          lng: parseFloat(locationData.lon)
        },
        address: {
          pincode: cleanPincode,
          city: address.city || address.town || address.village || address.suburb || 'Unknown',
          district: address.state_district || address.county || 'Unknown',
          state: address.state || 'Unknown',
          country: address.country || 'India',
          formattedAddress: locationData.display_name
        },
        boundingBox: locationData.boundingbox ? locationData.boundingbox.map(coord => parseFloat(coord)) : null,
        lastUpdated: new Date()
      };

      // Cache the result with timestamp for potential expiration
      this.pincodeCache.set(cleanPincode, result);
      
      return result;
    } catch (error) {
      console.error('Pincode geocoding error:', error);
      
      // Provide more specific error messages
      if (error.message.includes('not found')) {
        throw new Error(`Pincode ${cleanPincode} not found. Please verify the pincode is correct.`);
      } else if (error.message.includes('failed')) {
        throw new Error('Unable to connect to geocoding service. Please check your internet connection and try again.');
      } else {
        throw new Error(`Geocoding failed: ${error.message}`);
      }
    }
  }

  /**
   * Clears all caches including pincode cache
   */
  clearAllCaches() {
    this.cache.clear();
    this.pincodeCache.clear();
  }

  /**
   * Clears only the pincode cache
   */
  clearPincodeCache() {
    this.pincodeCache.clear();
  }

  /**
   * Gets cache statistics for debugging
   * @returns {Object} - Cache size information
   */
  getCacheStats() {
    return {
      generalCacheSize: this.cache.size,
      pincodeCacheSize: this.pincodeCache.size,
      totalCacheSize: this.cache.size + this.pincodeCache.size
    };
  }
}

export default new GeocodingService();