import axios from 'axios';

class MLService {
  constructor() {
    this.baseURL = '/api/ml';
  }

  // ==================== Service Recommendations ====================
  
  async getRecommendations(limit = 5) {
    try {
      const response = await axios.get(`${this.baseURL}/recommendations`, {
        params: { limit }
      });
      return response.data;
    } catch (error) {
      console.error('Failed to get recommendations:', error);
      // Return fallback instead of throwing
      return {
        success: true,
        data: {
          recommendations: [
            {
              _id: 'dummy1',
              name: 'Birth Certificate',
              description: 'Apply for official birth certificate from the civil registration department',
              category: 'Civil Registration',
              fee: 50,
              processingTime: '7-10 days',
              visitCount: 150
            },
            {
              _id: 'dummy2',
              name: 'Aadhaar Card',
              description: 'Get your Aadhaar card or update existing information',
              category: 'Identity Services',
              fee: 0,
              processingTime: '15-30 days',
              visitCount: 200
            }
          ],
          type: 'popular',
          count: 2,
          mlEnabled: false
        }
      };
    }
  }

  async getSimilarServices(serviceId, limit = 5) {
    try {
      const response = await axios.get(`${this.baseURL}/recommendations/service/${serviceId}`, {
        params: { limit }
      });
      return response.data;
    } catch (error) {
      console.error('Failed to get similar services:', error);
      throw error;
    }
  }

  // ==================== Service Categorization ====================
  
  async categorizeService(serviceData) {
    try {
      const response = await axios.post(`${this.baseURL}/categorize`, {
        serviceData
      });
      return response.data;
    } catch (error) {
      console.error('Failed to categorize service:', error);
      throw error;
    }
  }

  async batchCategorize() {
    try {
      const response = await axios.post(`${this.baseURL}/categorize/batch`);
      return response.data;
    } catch (error) {
      console.error('Failed to batch categorize:', error);
      throw error;
    }
  }

  // ==================== Appointment Scheduling ====================
  
  async getOptimalSchedule(serviceId, date) {
    try {
      if (!serviceId) {
        throw new Error('Service ID is required');
      }
      
      const response = await axios.get(`${this.baseURL}/schedule/optimal/${serviceId}`, {
        params: { date }
      });
      return response.data;
    } catch (error) {
      console.error('Failed to get optimal schedule:', error);
      
      // Return fallback response instead of throwing
      if (error.response?.status === 404 || !serviceId) {
        return {
          success: true,
          data: {
            predictions: [
              { hour: 9, successProbability: 0.85, recommended: true, source: 'default' },
              { hour: 10, successProbability: 0.85, recommended: true, source: 'default' },
              { hour: 11, successProbability: 0.80, recommended: true, source: 'default' },
              { hour: 14, successProbability: 0.80, recommended: false, source: 'default' },
              { hour: 15, successProbability: 0.75, recommended: false, source: 'default' },
              { hour: 16, successProbability: 0.70, recommended: false, source: 'default' }
            ],
            bestTimeSlot: { hour: 9, successProbability: 0.85, recommended: true, source: 'default' },
            recommendedSlots: [
              { hour: 9, successProbability: 0.85, recommended: true, source: 'default' },
              { hour: 10, successProbability: 0.85, recommended: true, source: 'default' },
              { hour: 11, successProbability: 0.80, recommended: true, source: 'default' }
            ],
            mlEnabled: false,
            fallbackUsed: true
          }
        };
      }
      
      throw error;
    }
  }

  async getBatchSchedule(serviceIds, date) {
    try {
      const response = await axios.post(`${this.baseURL}/schedule/batch`, {
        serviceIds,
        date
      });
      return response.data;
    } catch (error) {
      console.error('Failed to get batch schedule:', error);
      throw error;
    }
  }

  // ==================== Model Management ====================
  
  async getModelStatus() {
    try {
      const response = await axios.get(`${this.baseURL}/status`);
      return response.data;
    } catch (error) {
      console.error('Failed to get model status:', error);
      throw error;
    }
  }

  async retrainModels() {
    try {
      const response = await axios.post(`${this.baseURL}/retrain`);
      return response.data;
    } catch (error) {
      console.error('Failed to retrain models:', error);
      throw error;
    }
  }

  async trainModel(modelName) {
    try {
      const response = await axios.post(`${this.baseURL}/train/${modelName}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to train ${modelName} model:`, error);
      throw error;
    }
  }

  // ==================== Helper Methods ====================
  
  formatDate(date) {
    if (date instanceof Date) {
      return date.toISOString().split('T')[0];
    }
    return date;
  }

  formatTimeSlot(hour) {
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour}:00 ${period}`;
  }

  getConfidenceColor(confidence) {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  }

  getConfidenceText(confidence) {
    if (confidence >= 0.8) return 'High';
    if (confidence >= 0.6) return 'Medium';
    return 'Low';
  }
}

export default new MLService();

