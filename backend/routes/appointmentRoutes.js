import express from 'express';
import Appointment from '../models/Appointment.js';
import Service from '../models/Service.js';
import AkshayaCenter from '../models/AkshayaCenter.js';
import Staff from '../models/Staff.js';
import Notification from '../models/Notification.js';
import { userAuth } from '../middleware/auth.js';
import Holiday from '../models/Holiday.js';

const router = express.Router();

// Apply user authentication middleware to all routes
router.use(userAuth);

// Get user's appointments
router.get('/', async (req, res) => {
  try {
    const appointments = await Appointment.find({ user: req.user.userId })
      .populate('service', 'name category fees processingTime')
      .populate('center', 'name address contact')
      .sort({ createdAt: -1 });

    // Add canEdit flag to each appointment
    const now = new Date();
    const appointmentsWithEditFlag = appointments.map(appointment => {
      const appointmentTime = new Date(appointment.appointmentDate);
      const timeDiff = appointmentTime.getTime() - now.getTime();
      const hoursDiff = timeDiff / (1000 * 60 * 60);
      const canEdit = appointment.status === 'pending' && hoursDiff > 3;
      
      return {
        ...appointment.toObject(),
        canEdit
      };
    });

    res.json({
      success: true,
      data: appointmentsWithEditFlag
    });
  } catch (error) {
    console.error('Get appointments error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch appointments',
      error: error.message
    });
  }
});

// Create new appointment
router.post('/', async (req, res) => {
  try {
    const { service, center, appointmentDate, timeSlot, notes, paymentId } = req.body;

    // Verify service exists and is active
    const serviceDoc = await Service.findById(service);
    if (!serviceDoc || !serviceDoc.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Service not found or inactive'
      });
    }

    // Verify center exists and is active
    const centerDoc = await AkshayaCenter.findById(center);
    if (!centerDoc || centerDoc.status !== 'active') {
      return res.status(404).json({
        success: false,
        message: 'Center not found or inactive'
      });
    }

    // Verify center offers the selected service
    if (!centerDoc.services.includes(service)) {
      return res.status(400).json({
        success: false,
        message: 'Selected service is not available at this center'
      });
    }

    // Block Sundays, second Saturdays and manual holidays
    const dateObj = new Date(appointmentDate);
    const day = dateObj.getDay(); // 0=Sun, 6=Sat
    if (day === 0) {
      return res.status(400).json({ success: false, message: 'Bookings are not available on Sundays.' });
    }
    // second Saturday check
    if (day === 6) {
      const d = new Date(dateObj);
      d.setDate(1);
      const firstSatOffset = (6 - d.getDay() + 7) % 7;
      const firstSat = 1 + firstSatOffset;
      const secondSat = firstSat + 7;
      if (dateObj.getDate() === secondSat) {
        return res.status(400).json({ success: false, message: 'Bookings are not available on second Saturdays.' });
      }
    }
    // manual holiday
    const start = new Date(dateObj); start.setHours(0,0,0,0);
    const end = new Date(start); end.setDate(end.getDate() + 1);
    const manualHoliday = await Holiday.findOne({ date: { $gte: start, $lt: end } });
    if (manualHoliday) {
      return res.status(400).json({ success: false, message: `Bookings are not available on this holiday: ${manualHoliday.reason || 'Holiday'}.` });
    }

    // Check if appointment slot is already taken at the specific center
    const existingAppointment = await Appointment.findOne({
      center: center,
      appointmentDate: dateObj,
      timeSlot,
      status: { $in: ['pending', 'confirmed'] }
    });

    if (existingAppointment) {
      return res.status(400).json({
        success: false,
        message: 'This time slot is already booked'
      });
    }

    const appointment = new Appointment({
      user: req.user.userId,
      service: service,
      center: center,
      appointmentDate: dateObj,
      timeSlot,
      notes,
      // Auto-approve when slot free
      status: 'confirmed',
      // Set payment info if provided
      ...(paymentId && {
        payment: {
          status: 'paid',
          amount: serviceDoc.fees,
          paymentId: paymentId
        }
      })
    });

    await appointment.save();

    // Notify staff at the selected center
    try {
      const centerStaff = await Staff.findByCenter(center, true);
      const staffNotifications = centerStaff.map(staff => ({
        user: staff.userId._id,
        type: 'appointment',
        title: 'New Appointment Booked',
        message: `New appointment for ${serviceDoc.name} on ${dateObj.toLocaleDateString()} at ${timeSlot}`,
        meta: {
          appointmentId: appointment._id,
          serviceId: service,
          centerId: center,
          appointmentDate: dateObj,
          timeSlot
        }
      }));

      if (staffNotifications.length > 0) {
        await Notification.insertMany(staffNotifications);
      }
    } catch (notificationError) {
      console.error('Failed to send staff notifications:', notificationError);
      // Don't fail the appointment creation if notifications fail
    }

    const populatedAppointment = await Appointment.findById(appointment._id)
      .populate('service', 'name category fees processingTime')
      .populate('center', 'name address contact');

    res.status(201).json({
      success: true,
      message: 'Appointment booked successfully',
      data: populatedAppointment
    });
  } catch (error) {
    console.error('Create appointment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to book appointment',
      error: error.message
    });
  }
});

// Get appointment by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const appointment = await Appointment.findOne({
      _id: id,
      user: req.user.userId
    }).populate('service', 'name category fee processingTime requiredDocuments');

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    // Check if appointment can be edited (more than 3 hours away and not completed/cancelled)
    const now = new Date();
    const appointmentTime = new Date(appointment.appointmentDate);
    const timeDiff = appointmentTime.getTime() - now.getTime();
    const hoursDiff = timeDiff / (1000 * 60 * 60);
    const canEdit = ['pending', 'confirmed'].includes(appointment.status) && hoursDiff > 3;

    res.json({
      success: true,
      data: {
        ...appointment.toObject(),
        canEdit
      }
    });
  } catch (error) {
    console.error('Get appointment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch appointment',
      error: error.message
    });
  }
});

// Update appointment (only if pending and more than 3 hours away)
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { appointmentDate, timeSlot, notes } = req.body;

    const appointment = await Appointment.findOne({
      _id: id,
      user: req.user.userId,
      status: { $in: ['pending', 'confirmed'] }
    });

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found or cannot be modified'
      });
    }

    // Check if appointment is more than 3 hours away
    const now = new Date();
    const appointmentTime = new Date(appointment.appointmentDate);
    const timeDiff = appointmentTime.getTime() - now.getTime();
    const hoursDiff = timeDiff / (1000 * 60 * 60);

    if (hoursDiff <= 3) {
      return res.status(400).json({
        success: false,
        message: 'Appointment cannot be modified within 3 hours of scheduled time'
      });
    }

    // Block Sundays, second Saturdays and manual holidays for the target date
    if (appointmentDate) {
      const d = new Date(appointmentDate);
      if (d.getDay() === 0) {
        return res.status(400).json({ success: false, message: 'Bookings are not available on Sundays.' });
      }
      if (d.getDay() === 6) {
        const firstOfMonth = new Date(d.getFullYear(), d.getMonth(), 1);
        const firstSatOffset = (6 - firstOfMonth.getDay() + 7) % 7;
        const firstSat = 1 + firstSatOffset;
        const secondSat = firstSat + 7;
        if (d.getDate() === secondSat) {
          return res.status(400).json({ success: false, message: 'Bookings are not available on second Saturdays.' });
        }
      }
      const start = new Date(d); start.setHours(0,0,0,0);
      const end = new Date(start); end.setDate(end.getDate() + 1);
      const manualHoliday = await Holiday.findOne({ date: { $gte: start, $lt: end } });
      if (manualHoliday) {
        return res.status(400).json({ success: false, message: `Bookings are not available on this holiday: ${manualHoliday.reason || 'Holiday'}.` });
      }
    }

    // Check if new slot is available (if date/time changed)
    if (appointmentDate || timeSlot) {
      const newDate = appointmentDate ? new Date(appointmentDate) : appointment.appointmentDate;
      const newTimeSlot = timeSlot || appointment.timeSlot;

      const existingAppointment = await Appointment.findOne({
        _id: { $ne: id },
        appointmentDate: newDate,
        timeSlot: newTimeSlot,
        status: { $in: ['pending', 'confirmed'] }
      });

      if (existingAppointment) {
        return res.status(400).json({
          success: false,
          message: 'This time slot is already booked'
        });
      }
    }

    // Update appointment
    if (appointmentDate) appointment.appointmentDate = new Date(appointmentDate);
    if (timeSlot) appointment.timeSlot = timeSlot;
    if (notes !== undefined) appointment.notes = notes;

    await appointment.save();

    const populatedAppointment = await Appointment.findById(appointment._id)
      .populate('service', 'name category fee processingTime');

    res.json({
      success: true,
      message: 'Appointment updated successfully',
      data: populatedAppointment
    });
  } catch (error) {
    console.error('Update appointment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update appointment',
      error: error.message
    });
  }
});

// Reschedule an appointment (allow if appointment time has passed or within 3 hours)
router.put('/:id/reschedule', async (req, res) => {
  try {
    const { id } = req.params;
    const { appointmentDate, timeSlot, notes } = req.body;

    if (!appointmentDate || !timeSlot) {
      return res.status(400).json({
        success: false,
        message: 'New appointmentDate and timeSlot are required'
      });
    }

    // Block Sundays, second Saturdays and manual holidays
    const targetDate = new Date(appointmentDate);
    if (targetDate.getDay() === 0) {
      return res.status(400).json({ success: false, message: 'Bookings are not available on Sundays.' });
    }
    if (targetDate.getDay() === 6) {
      const firstOfMonth = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);
      const firstSatOffset = (6 - firstOfMonth.getDay() + 7) % 7;
      const firstSat = 1 + firstSatOffset;
      const secondSat = firstSat + 7;
      if (targetDate.getDate() === secondSat) {
        return res.status(400).json({ success: false, message: 'Bookings are not available on second Saturdays.' });
      }
    }
    const startR = new Date(targetDate); startR.setHours(0,0,0,0);
    const endR = new Date(startR); endR.setDate(endR.getDate() + 1);
    const manualHolidayR = await Holiday.findOne({ date: { $gte: startR, $lt: endR } });
    if (manualHolidayR) {
      return res.status(400).json({ success: false, message: `Bookings are not available on this holiday: ${manualHolidayR.reason || 'Holiday'}.` });
    }

    const appointment = await Appointment.findOne({
      _id: id,
      user: req.user.userId,
      status: { $in: ['pending', 'confirmed'] }
    });

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found or cannot be rescheduled'
      });
    }

    // Ensure the original appointment is ended or within the restricted window
    const now = new Date();
    const originalTime = new Date(appointment.appointmentDate);
    const timeDiffHours = (originalTime.getTime() - now.getTime()) / (1000 * 60 * 60);
    const isEnded = originalTime.getTime() < now.getTime();
    const isWithinWindow = timeDiffHours <= 3; // same logic used for edit restriction

    if (!isEnded && !isWithinWindow) {
      // If it's not ended and not within restricted window, suggest using normal update
      return res.status(400).json({
        success: false,
        message: 'Use standard update; appointment is editable (more than 3 hours away)'
      });
    }

    // Check if new slot is available
    const newDate = targetDate;
    const conflict = await Appointment.findOne({
      _id: { $ne: id },
      appointmentDate: newDate,
      timeSlot,
      status: { $in: ['pending', 'confirmed'] }
    });

    if (conflict) {
      return res.status(400).json({
        success: false,
        message: 'This time slot is already booked'
      });
    }

    // Apply new schedule; keep status pending
    appointment.appointmentDate = newDate;
    appointment.timeSlot = timeSlot;
    if (notes !== undefined) appointment.notes = notes;

    await appointment.save();

    const populatedAppointment = await Appointment.findById(appointment._id)
      .populate('service', 'name category fee processingTime');

    return res.json({
      success: true,
      message: 'Appointment rescheduled successfully',
      data: populatedAppointment
    });
  } catch (error) {
    console.error('Reschedule appointment error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to reschedule appointment',
      error: error.message
    });
  }
});

// Cancel appointment
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const appointment = await Appointment.findOne({
      _id: id,
      user: req.user.userId,
      status: { $in: ['pending', 'confirmed'] }
    });

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found or cannot be cancelled'
      });
    }

    // Check if appointment can be cancelled (more than 3 hours away)
    const now = new Date();
    const appointmentTime = new Date(appointment.appointmentDate);
    const timeDiff = appointmentTime.getTime() - now.getTime();
    const hoursDiff = timeDiff / (1000 * 60 * 60);

    if (hoursDiff <= 3) {
      return res.status(400).json({
        success: false,
        message: 'Appointment cannot be cancelled within 3 hours of scheduled time'
      });
    }

    appointment.status = 'cancelled';
    await appointment.save();

    res.json({
      success: true,
      message: 'Appointment cancelled successfully'
    });
  } catch (error) {
    console.error('Cancel appointment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel appointment',
      error: error.message
    });
  }
});

// Get available time slots for a service on a specific date at a specific center
router.get('/slots/:serviceId/:date', async (req, res) => {
  try {
    const { serviceId, date } = req.params;
    const { center } = req.query;
    const asDate = new Date(date);
    // Sundays
    if (asDate.getDay() === 0) {
      return res.json({ success: true, data: { date, availableSlots: [], bookedSlots: [], isHoliday: true, reason: 'Sunday' } });
    }
    // second Saturday
    if (asDate.getDay() === 6) {
      const firstOfMonth = new Date(asDate.getFullYear(), asDate.getMonth(), 1);
      const firstSatOffset = (6 - firstOfMonth.getDay() + 7) % 7;
      const firstSat = 1 + firstSatOffset;
      const secondSat = firstSat + 7;
      if (asDate.getDate() === secondSat) {
        return res.json({ success: true, data: { date, availableSlots: [], bookedSlots: [], isHoliday: true, reason: 'Second Saturday' } });
      }
    }
    // manual holiday
    const start = new Date(asDate); start.setHours(0,0,0,0);
    const end = new Date(start); end.setDate(end.getDate() + 1);
    const manualHoliday = await Holiday.findOne({ date: { $gte: start, $lt: end } });
    if (manualHoliday) {
      return res.json({ success: true, data: { date, availableSlots: [], bookedSlots: [], isHoliday: true, reason: manualHoliday.reason || 'Holiday' } });
    }

    // Define available time slots (you can make this configurable)
    const allTimeSlots = [
      '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
      '12:00 PM', '12:30 PM', '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM',
      '04:00 PM', '04:30 PM', '05:00 PM'
    ];

    // Get booked slots for the date at the specific center (if provided)
    const query = {
      appointmentDate: asDate,
      status: { $in: ['pending', 'confirmed'] }
    };
    
    if (center) {
      query.center = center;
    }
    
    const bookedAppointments = await Appointment.find(query).select('timeSlot');

    const bookedSlots = bookedAppointments.map(apt => apt.timeSlot);
    const availableSlots = allTimeSlots.filter(slot => !bookedSlots.includes(slot));

    res.json({
      success: true,
      data: {
        date,
        availableSlots,
        bookedSlots
      }
    });
  } catch (error) {
    console.error('Get available slots error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch available slots',
      error: error.message
    });
  }
});

export default router;