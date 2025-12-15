const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org';

class GeocodingService {
  constructor() {
    this.cache = new Map();
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
}

export default new GeocodingService();