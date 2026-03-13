import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:5001';

class MLService {
  /**
   * Verify if a document is authentic or fake using ML model
   * @param {string} filePath - Path to the document image file
   * @returns {Promise<Object>} Verification result
   */
  async verifyDocument(filePath) {
    try {
      // Check if ML service is available
      const isAvailable = await this.checkHealth();
      if (!isAvailable) {
        throw new Error('ML service is not available');
      }

      // Create form data
      const formData = new FormData();
      formData.append('document', fs.createReadStream(filePath));

      // Call ML service
      const response = await axios.post(
        `${ML_SERVICE_URL}/verify-document`,
        formData,
        {
          headers: {
            ...formData.getHeaders()
          },
          timeout: 30000 // 30 seconds timeout
        }
      );

      if (response.data.success) {
        return {
          success: true,
          isAuthentic: response.data.prediction === 'authentic',
          confidence: response.data.confidence,
          prediction: response.data.prediction,
          details: response.data.details
        };
      } else {
        throw new Error(response.data.error || 'Verification failed');
      }
    } catch (error) {
      console.error('ML Service Error:', error.message);
      
      // If ML service is down, return a fallback response
      if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
        console.warn('ML service unavailable, allowing upload without verification');
        return {
          success: true,
          isAuthentic: true,
          confidence: null,
          prediction: 'unverified',
          details: {
            interpretation: 'ML service unavailable - document uploaded without verification'
          },
          warning: 'Document verification service is currently unavailable'
        };
      }

      throw error;
    }
  }

  /**
   * Check if ML service is healthy and available
   * @returns {Promise<boolean>}
   */
  async checkHealth() {
    try {
      const response = await axios.get(`${ML_SERVICE_URL}/health`, {
        timeout: 5000
      });
      return response.data.status === 'healthy' && response.data.model_loaded;
    } catch (error) {
      console.warn('ML service health check failed:', error.message);
      return false;
    }
  }

  /**
   * Get ML model information
   * @returns {Promise<Object>}
   */
  async getModelInfo() {
    try {
      const response = await axios.get(`${ML_SERVICE_URL}/model-info`, {
        timeout: 5000
      });
      return response.data;
    } catch (error) {
      console.error('Failed to get model info:', error.message);
      return null;
    }
  }
}

export default new MLService();
