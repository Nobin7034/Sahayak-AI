import axios from 'axios';
import { API_BASE_URL } from '../config/api.js';

const API_URL = `${API_BASE_URL}/api`;

class CenterService {
  constructor() {
    this.api = axios.create({
      baseURL: API_URL,
      timeout: 10000
    });

    // Add auth token to requests
    this.api.interceptors.request.use((config) => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
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
    if (!center || !center.operatingHours) {
      return false;
    }

    const now = new Date();
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const currentDay = days[now.getDay()];
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
      // Check if center has valid location coordinates
      if (!center.location || !center.location.coordinates || center.location.coordinates.length !== 2) {
        console.warn(`Center ${center.name} has invalid location coordinates:`, center.location);
        return false;
      }
      
      try {
        const distance = this.calculateDistance(
          userLat, 
          userLng, 
          center.location.coordinates[1], // latitude
          center.location.coordinates[0]  // longitude
        );
        return distance <= maxDistance;
      } catch (error) {
        console.error(`Error calculating distance for center ${center.name}:`, error);
        return false;
      }
    }).map(center => ({
      ...center,
      distance: this.calculateDistance(
        userLat, 
        userLng, 
        center.location.coordinates[1], // latitude
        center.location.coordinates[0]  // longitude
      )
    })).sort((a, b) => a.distance - b.distance); // Sort by distance, closest first
  }
}

export default new CenterService();