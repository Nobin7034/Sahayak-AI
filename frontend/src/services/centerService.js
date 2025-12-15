import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

class CenterService {
  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000
    });
  }

  // Calculate distance between two points using Haversine formula
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Distance in kilometers
  }

  toRadians(degrees) {
    return degrees * (Math.PI/180);
  }

  async getAllCenters() {
    try {
      const response = await this.api.get('/centers');
      return response.data;
    } catch (error) {
      console.error('Error fetching centers:', error);
      throw error;
    }
  }

  async getNearbyCenters(lat, lng, radius = 50) {
    try {
      const response = await this.api.get(`/centers/nearby?lat=${lat}&lng=${lng}&radius=${radius}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching nearby centers:', error);
      throw error;
    }
  }

  async searchCenters(query, radius = 50) {
    try {
      const response = await this.api.get(`/centers/search?query=${encodeURIComponent(query)}&radius=${radius}`);
      return response.data;
    } catch (error) {
      console.error('Error searching centers:', error);
      throw error;
    }
  }

  async getCenterById(id) {
    try {
      const response = await this.api.get(`/centers/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching center details:', error);
      throw error;
    }
  }

  async getCenterServices(centerId) {
    try {
      const response = await this.api.get(`/centers/${centerId}/services`);
      return response.data;
    } catch (error) {
      console.error('Error fetching center services:', error);
      throw error;
    }
  }

  // Check if center is currently open based on operating hours
  isCenterOpen(center) {
    const now = new Date();
    const currentDay = now.toLocaleLowerCase().substring(0, 3); // mon, tue, etc.
    const currentTime = now.getHours() * 100 + now.getMinutes(); // HHMM format

    const daySchedule = center.operatingHours[currentDay];
    if (!daySchedule || !daySchedule.isOpen) {
      return false;
    }

    const openTime = this.timeStringToNumber(daySchedule.open);
    const closeTime = this.timeStringToNumber(daySchedule.close);

    return currentTime >= openTime && currentTime <= closeTime;
  }

  timeStringToNumber(timeString) {
    // Convert "09:30" to 930
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 100 + minutes;
  }

  // Filter centers by distance from a point
  filterCentersByDistance(centers, userLat, userLng, maxDistance) {
    return centers.filter(center => {
      const distance = this.calculateDistance(
        userLat, 
        userLng, 
        center.location.coordinates[1], 
        center.location.coordinates[0]
      );
      return distance <= maxDistance;
    }).map(center => ({
      ...center,
      distance: this.calculateDistance(
        userLat, 
        userLng, 
        center.location.coordinates[1], 
        center.location.coordinates[0]
      )
    }));
  }
}

export default new CenterService();