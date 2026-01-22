import express from 'express';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { authenticate } from '../middleware/auth.js';
import Service from '../models/Service.js';
import Appointment from '../models/Appointment.js';
import AkshayaCenter from '../models/AkshayaCenter.js';

// Ensure environment variables are loaded
dotenv.config();

const router = express.Router();

// Initialize Razorpay
let razorpay = null;

try {
  if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
    razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
    console.log('✅ Razorpay initialized successfully');
  } else {
    console.warn('⚠️ Razorpay credentials not found in environment variables');
  }
} catch (error) {
  console.error('❌ Failed to initialize Razorpay:', error.message);
}

// Get Razorpay configuration
router.get('/config', (req, res) => {
  try {
    if (!process.env.RAZORPAY_KEY_ID) {
      return res.status(500).json({
        success: false,
        message: 'Razorpay not configured'
      });
    }

    res.json({
      success: true,
      data: {
        keyId: process.env.RAZORPAY_KEY_ID
      }
    });
  } catch (error) {
    console.error('Config fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payment configuration'
    });
  }
});

// Create payment order
router.post('/create-order', authenticate, async (req, res) => {
  try {
    if (!razorpay) {
      return res.status(500).json({
        success: false,
        message: 'Payment service not available'
      });
    }

    const { serviceId, centerId } = req.body;

    if (!serviceId || !centerId) {
      return res.status(400).json({
        success: false,
        message: 'Service ID and Center ID are required'
      });
    }

    // Fetch service details
    const service = await Service.findById(serviceId);
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    // Fetch center details
    const center = await AkshayaCenter.findById(centerId);
    if (!center) {
      return res.status(404).json({
        success: false,
        message: 'Center not found'
      });
    }

    // Check if service has charges
    if (service.fee <= 0) {
      return res.status(400).json({
        success: false,
        message: 'This service does not require payment'
      });
    }

    // Create Razorpay order with short receipt (max 40 chars)
    const receipt = `${Date.now().toString().slice(-10)}_${req.user.userId.slice(-8)}`;
    
    const orderOptions = {
      amount: service.fee * 100, // Amount in paise
      currency: 'INR',
      receipt: receipt,
      notes: {
        serviceId: serviceId,
        centerId: centerId,
        userId: req.user.userId,
        serviceName: service.name,
        centerName: center.name
      }
    };

    const order = await razorpay.orders.create(orderOptions);

    res.json({
      success: true,
      data: {
        order: {
          id: order.id,
          amount: order.amount,
          currency: order.currency,
          receipt: order.receipt
        },
        service: {
          id: service._id,
          name: service.name,
          fee: service.fee
        },
        center: {
          id: center._id,
          name: center.name
        }
      }
    });

  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create payment order',
      error: error.message
    });
  }
});

// Verify payment
router.post('/verify', authenticate, async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: 'Missing payment verification parameters'
      });
    }

    // Verify signature
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: 'Payment verification failed'
      });
    }

    // Fetch payment details from Razorpay
    const payment = await razorpay.payments.fetch(razorpay_payment_id);
    
    if (payment.status !== 'captured') {
      return res.status(400).json({
        success: false,
        message: 'Payment not captured'
      });
    }

    res.json({
      success: true,
      data: {
        paymentId: razorpay_payment_id,
        orderId: razorpay_order_id,
        signature: razorpay_signature,
        amount: payment.amount / 100, // Convert back to rupees
        status: payment.status
      }
    });

  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Payment verification failed',
      error: error.message
    });
  }
});

// Get payment details
router.get('/payment/:paymentId', authenticate, async (req, res) => {
  try {
    const { paymentId } = req.params;

    const payment = await razorpay.payments.fetch(paymentId);

    res.json({
      success: true,
      data: {
        id: payment.id,
        amount: payment.amount / 100,
        currency: payment.currency,
        status: payment.status,
        method: payment.method,
        createdAt: new Date(payment.created_at * 1000),
        notes: payment.notes
      }
    });

  } catch (error) {
    console.error('Payment fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payment details',
      error: error.message
    });
  }
});

// Refund payment
router.post('/refund', authenticate, async (req, res) => {
  try {
    const { paymentId, amount, reason } = req.body;

    if (!paymentId) {
      return res.status(400).json({
        success: false,
        message: 'Payment ID is required'
      });
    }

    // Create refund
    const refundOptions = {
      payment_id: paymentId,
      notes: {
        reason: reason || 'Appointment cancellation',
        refundedBy: req.user.userId
      }
    };

    if (amount) {
      refundOptions.amount = amount * 100; // Convert to paise
    }

    const refund = await razorpay.payments.refund(paymentId, refundOptions);

    res.json({
      success: true,
      data: {
        refundId: refund.id,
        paymentId: refund.payment_id,
        amount: refund.amount / 100,
        status: refund.status,
        createdAt: new Date(refund.created_at * 1000)
      }
    });

  } catch (error) {
    console.error('Refund error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process refund',
      error: error.message
    });
  }
});

// Webhook for payment status updates
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const signature = req.headers['x-razorpay-signature'];
    const body = req.body;

    // Verify webhook signature
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    if (signature !== expectedSignature) {
      return res.status(400).json({
        success: false,
        message: 'Invalid webhook signature'
      });
    }

    const event = JSON.parse(body);
    
    // Handle different webhook events
    switch (event.event) {
      case 'payment.captured':
        await handlePaymentCaptured(event.payload.payment.entity);
        break;
      case 'payment.failed':
        await handlePaymentFailed(event.payload.payment.entity);
        break;
      case 'refund.processed':
        await handleRefundProcessed(event.payload.refund.entity);
        break;
      default:
        console.log('Unhandled webhook event:', event.event);
    }

    res.json({ success: true });

  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({
      success: false,
      message: 'Webhook processing failed'
    });
  }
});

// Helper functions for webhook handling
const handlePaymentCaptured = async (payment) => {
  try {
    // Find appointment with this payment ID and update status
    const appointment = await Appointment.findOne({
      'payment.paymentId': payment.id
    });

    if (appointment) {
      appointment.payment.status = 'paid';
      appointment.payment.history.push({
        action: 'payment_captured',
        meta: { paymentId: payment.id, amount: payment.amount / 100 }
      });
      await appointment.save();
    }
  } catch (error) {
    console.error('Error handling payment captured:', error);
  }
};

const handlePaymentFailed = async (payment) => {
  try {
    // Find appointment with this payment ID and update status
    const appointment = await Appointment.findOne({
      'payment.orderId': payment.order_id
    });

    if (appointment) {
      appointment.payment.status = 'failed';
      appointment.payment.history.push({
        action: 'payment_failed',
        meta: { paymentId: payment.id, reason: payment.error_description }
      });
      await appointment.save();
    }
  } catch (error) {
    console.error('Error handling payment failed:', error);
  }
};

const handleRefundProcessed = async (refund) => {
  try {
    // Find appointment with this payment ID and update refund status
    const appointment = await Appointment.findOne({
      'payment.paymentId': refund.payment_id
    });

    if (appointment) {
      appointment.payment.refundStatus = 'processed';
      appointment.payment.refundId = refund.id;
      appointment.payment.history.push({
        action: 'refund_processed',
        meta: { refundId: refund.id, amount: refund.amount / 100 }
      });
      await appointment.save();
    }
  } catch (error) {
    console.error('Error handling refund processed:', error);
  }
};

export default router;