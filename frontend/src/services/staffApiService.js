import axios from 'axios';

/**
 * Staff API Service
 * Handles all staff-specific API calls with proper authentication
 */
class StaffApiService {
  constructor() {
    this.baseURL = '/api/staff';
  }

  /**
   * Get authentication headers with staff JWT token
   */
  getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  }

  /**
   * Get staff dashboard data
   */
  async getDashboardData() {
    try {
      const response = await axios.get(`${this.baseURL}/dashboard`, {
        headers: this.getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Dashboard API error:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Get staff profile information
   */
  async getProfile() {
    try {
      const response = await axios.get(`${this.baseURL}/profile`, {
        headers: this.getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Profile API error:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Update staff profile
   */
  async updateProfile(profileData) {
    try {
      const response = await axios.put(`${this.baseURL}/profile`, profileData, {
        headers: this.getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Update profile API error:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Get appointments for staff center
   */
  async getAppointments(filters = {}) {
    try {
      const queryParams = new URLSearchParams(filters).toString();
      const url = `${this.baseURL}/appointments${queryParams ? `?${queryParams}` : ''}`;
      
      const response = await axios.get(url, {
        headers: this.getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Appointments API error:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Update appointment status
   */
  async updateAppointmentStatus(appointmentId, status, reason = '', notes = '') {
    try {
      const response = await axios.put(
        `${this.baseURL}/appointments/${appointmentId}/status`,
        { status, reason, notes },
        { headers: this.getAuthHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error('Update appointment status API error:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Get notifications for staff
   */
  async getNotifications() {
    try {
      const response = await axios.get('/api/notifications', {
        headers: this.getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Notifications API error:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Mark notification as read
   */
  async markNotificationAsRead(notificationId) {
    try {
      const response = await axios.put(
        `/api/notifications/${notificationId}/read`,
        {},
        { headers: this.getAuthHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error('Mark notification read API error:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Get center services
   */
  async getCenterServices() {
    try {
      const response = await axios.get(`${this.baseURL}/services/center`, {
        headers: this.getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Center services API error:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Get analytics data
   */
  async getAnalytics(period = 'month', type = 'appointments') {
    try {
      const response = await axios.get(`${this.baseURL}/analytics`, {
        params: { period, type },
        headers: this.getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Analytics API error:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Handle API errors with proper error messages and retry mechanisms
   */
  handleError(error) {
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;
      
      switch (status) {
        case 401:
          // Authentication error - redirect to staff login
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          localStorage.removeItem('staff');
          window.location.href = '/staff/login';
          return new Error('Session expired. Please login again.');
          
        case 403:
          return new Error(data.message || 'Access denied. Insufficient permissions.');
          
        case 404:
          return new Error(data.message || 'Resource not found.');
          
        case 500:
          return new Error(data.message || 'Server error. Please try again later.');
          
        default:
          return new Error(data.message || `Request failed with status ${status}`);
      }
    } else if (error.request) {
      // Network error
      return new Error('Network error. Please check your connection and try again.');
    } else {
      // Other error
      return new Error(error.message || 'An unexpected error occurred.');
    }
  }

  /**
   * Retry mechanism for failed requests
   */
  async retryRequest(requestFn, maxRetries = 3, delay = 1000) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await requestFn();
      } catch (error) {
        if (attempt === maxRetries) {
          throw error;
        }
        
        // Don't retry authentication errors
        if (error.message.includes('Session expired') || error.message.includes('Access denied')) {
          throw error;
        }
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, delay * attempt));
      }
    }
  }
}

// Export singleton instance
export default new StaffApiService();