import axios from 'axios';
import { auth } from '../firebase';

class PaymentService {
  constructor() {
    this.razorpayKey = null;
    
    // Create axios instance with auth interceptor
    this.api = axios.create({
      timeout: 10000
    });

    // Add auth token to requests - same logic as AuthContext
    this.api.interceptors.request.use(async (config) => {
      try {
        config.headers = config.headers || {};

        // First try backend JWT token
        const jwtToken = localStorage.getItem('token');
        if (jwtToken) {
          config.headers.Authorization = `Bearer ${jwtToken}`;
          return config;
        }

        // Fallback to Firebase ID token
        const currentUser = auth.currentUser;
        if (currentUser) {
          const token = await currentUser.getIdToken(false);
          config.headers.Authorization = `Bearer ${token}`;
        }
      } catch (error) {
        console.error('Payment service auth error:', error);
        // Let request proceed without token
      }
      return config;
    });
  }

  // Load Razorpay configuration
  async loadConfig() {
    try {
      const response = await this.api.get('/api/payments/config');
      if (response.data?.success) {
        this.razorpayKey = response.data.data.keyId;
        return this.razorpayKey;
      }
      throw new Error('Failed to load payment configuration');
    } catch (error) {
      console.error('Payment config error:', error);
      throw error;
    }
  }

  // Create payment order
  async createOrder(serviceId, centerId) {
    try {
      const response = await this.api.post('/api/payments/create-order', {
        serviceId,
        centerId
      });
      
      if (response.data?.success) {
        return response.data.data;
      }
      throw new Error(response.data?.message || 'Failed to create payment order');
    } catch (error) {
      console.error('Create order error:', error);
      throw error;
    }
  }

  // Verify payment
  async verifyPayment(paymentData) {
    try {
      const response = await this.api.post('/api/payments/verify', paymentData);
      
      if (response.data?.success) {
        return response.data.data;
      }
      throw new Error(response.data?.message || 'Payment verification failed');
    } catch (error) {
      console.error('Payment verification error:', error);
      throw error;
    }
  }

  // Load Razorpay script
  async loadRazorpayScript() {
    return new Promise((resolve, reject) => {
      if (window.Razorpay) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Razorpay SDK'));
      document.head.appendChild(script);
    });
  }

  // Open Razorpay checkout
  async openCheckout(options) {
    await this.loadRazorpayScript();
    
    if (!this.razorpayKey) {
      await this.loadConfig();
    }

    const razorpayOptions = {
      key: this.razorpayKey,
      ...options
    };

    const rzp = new window.Razorpay(razorpayOptions);
    rzp.open();
    return rzp;
  }

  // Get payment details
  async getPaymentDetails(paymentId) {
    try {
      const response = await this.api.get(`/api/payments/payment/${paymentId}`);
      
      if (response.data?.success) {
        return response.data.data;
      }
      throw new Error(response.data?.message || 'Failed to fetch payment details');
    } catch (error) {
      console.error('Get payment details error:', error);
      throw error;
    }
  }

  // Request refund
  async requestRefund(paymentId, amount, reason) {
    try {
      const response = await this.api.post('/api/payments/refund', {
        paymentId,
        amount,
        reason
      });
      
      if (response.data?.success) {
        return response.data.data;
      }
      throw new Error(response.data?.message || 'Failed to process refund');
    } catch (error) {
      console.error('Refund error:', error);
      throw error;
    }
  }

  // Format amount for display
  formatAmount(amount, currency = 'INR') {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(amount);
  }

  // Validate payment amount
  validateAmount(amount) {
    if (!amount || amount <= 0) {
      throw new Error('Invalid payment amount');
    }
    
    if (amount < 1) {
      throw new Error('Minimum payment amount is ₹1');
    }
    
    if (amount > 100000) {
      throw new Error('Maximum payment amount is ₹1,00,000');
    }
    
    return true;
  }
}

// Export singleton instance
const paymentService = new PaymentService();
export default paymentService;