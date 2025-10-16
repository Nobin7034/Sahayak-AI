import express from 'express';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import { userAuth, adminAuth } from '../middleware/auth.js';
import Service from '../models/Service.js';
import Appointment from '../models/Appointment.js';
import Notification from '../models/Notification.js';
import Holiday from '../models/Holiday.js';

const router = express.Router();

const key_id = process.env.RAZORPAY_KEY_ID || 'rzp_test_RGXWGOBliVCIpU';
const key_secret = process.env.RAZORPAY_KEY_SECRET || '9Q49llzcN0kLD3021OoSstOp';

const razorpay = new Razorpay({ key_id, key_secret });

// Public config for frontend
router.get('/config', (req, res) => {
  return res.json({ success: true, data: { keyId: key_id, currency: 'INR' } });
});

// Create order for a service's serviceCharge
router.post('/create-order', userAuth, async (req, res) => {
  try {
    const { serviceId } = req.body;
    const service = await Service.findById(serviceId);
    if (!service || !service.isActive) {
      return res.status(404).json({ success: false, message: 'Service not found or inactive' });
    }
    const amountPaise = Math.round((service.serviceCharge || 0) * 100);
    if (amountPaise <= 0) {
      return res.status(400).json({ success: false, message: 'Service charge must be greater than 0. Please ask admin to set serviceCharge in Service.' });
    }
    try {
      const shortSvc = String(serviceId).slice(-6);
      const shortTs = Date.now().toString(36);
      let receipt = `svc_${shortSvc}_${shortTs}`;
      if (receipt.length > 40) receipt = receipt.slice(0, 40);
      const order = await razorpay.orders.create({
        amount: amountPaise,
        currency: 'INR',
        receipt,
        notes: { serviceId: serviceId.toString(), userId: req.user.userId }
      });
      return res.status(201).json({ success: true, data: { order } });
    } catch (rzpErr) {
      const details = rzpErr?.error || rzpErr?.response || rzpErr;
      console.error('Razorpay order create error:', details);
      const msg = details?.description || details?.message || 'Razorpay order creation failed. Check keys/network.';
      return res.status(500).json({ success: false, message: msg });
    }
  } catch (error) {
    console.error('Create order error:', error);
    return res.status(500).json({ success: false, message: error?.message || 'Failed to create order' });
  }
});

// Verify payment signature and create appointment entry
router.post('/verify-and-create-appointment', userAuth, async (req, res) => {
  try {
    const { serviceId, appointmentDate, timeSlot, notes, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    // Verify signature
    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expected = crypto.createHmac('sha256', key_secret).update(body).digest('hex');
    if (expected !== razorpay_signature) {
      return res.status(400).json({ success: false, message: 'Payment verification failed' });
    }

    const service = await Service.findById(serviceId);
    if (!service || !service.isActive) {
      return res.status(404).json({ success: false, message: 'Service not found or inactive' });
    }

  // Block Sundays, second Saturdays and manual holidays
    const dateObj = new Date(appointmentDate);
  if (dateObj.getDay() === 0) {
    return res.status(400).json({ success: false, message: 'Bookings are not available on Sundays.' });
  }
  if (dateObj.getDay() === 6) {
    const firstOfMonth = new Date(dateObj.getFullYear(), dateObj.getMonth(), 1);
    const firstSatOffset = (6 - firstOfMonth.getDay() + 7) % 7;
    const firstSat = 1 + firstSatOffset;
    const secondSat = firstSat + 7;
    if (dateObj.getDate() === secondSat) {
      return res.status(400).json({ success: false, message: 'Bookings are not available on second Saturdays.' });
    }
  }
  const start = new Date(dateObj); start.setHours(0,0,0,0);
  const end = new Date(start); end.setDate(end.getDate() + 1);
  const manualHoliday = await Holiday.findOne({ date: { $gte: start, $lt: end } });
  if (manualHoliday) {
    return res.status(400).json({ success: false, message: `Bookings are not available on this holiday: ${manualHoliday.reason || 'Holiday'}.` });
  }

    // Enforce exclusivity: ensure no other appointment has this slot (globally across all services)
    const conflict = await Appointment.findOne({
      appointmentDate: dateObj,
      timeSlot,
      status: { $in: ['pending', 'confirmed'] }
    });
  if (conflict) {
    return res.status(400).json({ success: false, message: 'This time slot is already booked' });
  }

    // Create appointment marked as confirmed once paid
    const appointment = new Appointment({
      user: req.user.userId,
      service: serviceId,
      appointmentDate: dateObj,
      timeSlot,
      notes,
      status: 'confirmed',
      payment: {
        status: 'paid',
        amount: service.serviceCharge,
        currency: 'INR',
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id,
        signature: razorpay_signature,
        history: [{ action: 'payment_captured', meta: { orderId: razorpay_order_id, paymentId: razorpay_payment_id } }]
      }
    });

    await appointment.save();
    const populated = await Appointment.findById(appointment._id).populate('service', 'name category fee processingTime');
    try {
      await Notification.create({
        user: req.user.userId,
        type: 'status',
        title: 'Appointment Confirmed',
        message: `Your booking for ${populated.service?.name || 'service'} is confirmed.`,
        meta: { appointmentId: populated._id }
      });
    } catch (_) {}
    return res.status(201).json({ success: true, message: 'Appointment created', data: populated });
  } catch (error) {
    console.error('Verify/create appointment error:', error);
    return res.status(500).json({ success: false, message: 'Failed to create appointment', error: error.message });
  }
});

// Admin-triggered refund for an appointment's payment
router.post('/refund/:appointmentId', adminAuth, async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const appointment = await Appointment.findById(appointmentId).populate('service', 'serviceCharge');
    if (!appointment) return res.status(404).json({ success: false, message: 'Appointment not found' });
    if (!appointment.payment || appointment.payment.status !== 'paid' || !appointment.payment.paymentId) {
      return res.status(400).json({ success: false, message: 'No eligible paid transaction to refund' });
    }

    // Amount in paise
    const amountPaise = Math.round((appointment.payment.amount || appointment.service?.serviceCharge || 0) * 100);
    const refund = await razorpay.payments.refund(appointment.payment.paymentId, { amount: amountPaise });

    appointment.payment.refundId = refund.id;
    appointment.payment.refundStatus = 'processed';
    appointment.payment.status = 'refunded';
    appointment.payment.history.push({ action: 'refund_processed', meta: { refundId: refund.id } });
    await appointment.save();

    try {
      await Notification.create({
        user: appointment.user,
        type: 'refund',
        title: 'Refund Processed',
        message: `Your refund for the service charge has been processed.`,
        meta: { appointmentId: appointment._id, refundId: refund.id }
      });
    } catch (_) {}

    return res.json({ success: true, message: 'Refund processed', data: { refund } });
  } catch (error) {
    console.error('Refund error:', error);
    return res.status(500).json({ success: false, message: 'Failed to process refund', error: error.message });
  }
});

export default router;


