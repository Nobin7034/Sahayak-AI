import express from 'express';
import Appointment from '../models/Appointment.js';
import Service from '../models/Service.js';
import { userAuth } from '../middleware/auth.js';

const router = express.Router();

// Apply user authentication middleware to all routes
router.use(userAuth);

// Get user's appointments
router.get('/', async (req, res) => {
  try {
    const appointments = await Appointment.find({ user: req.user.userId })
      .populate('service', 'name category fee processingTime')
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
    const { serviceId, appointmentDate, timeSlot, notes } = req.body;

    // Verify service exists and is active
    const service = await Service.findById(serviceId);
    if (!service || !service.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Service not found or inactive'
      });
    }

    // Check if appointment slot is already taken
    const existingAppointment = await Appointment.findOne({
      service: serviceId,
      appointmentDate: new Date(appointmentDate),
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
      service: serviceId,
      appointmentDate: new Date(appointmentDate),
      timeSlot,
      notes
    });

    await appointment.save();

    const populatedAppointment = await Appointment.findById(appointment._id)
      .populate('service', 'name category fee processingTime');

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

    // Check if appointment can be edited (more than 3 hours away and pending)
    const now = new Date();
    const appointmentTime = new Date(appointment.appointmentDate);
    const timeDiff = appointmentTime.getTime() - now.getTime();
    const hoursDiff = timeDiff / (1000 * 60 * 60);
    const canEdit = appointment.status === 'pending' && hoursDiff > 3;

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
      status: 'pending'
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

    // Check if new slot is available (if date/time changed)
    if (appointmentDate || timeSlot) {
      const newDate = appointmentDate ? new Date(appointmentDate) : appointment.appointmentDate;
      const newTimeSlot = timeSlot || appointment.timeSlot;

      const existingAppointment = await Appointment.findOne({
        _id: { $ne: id },
        service: appointment.service,
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

// Get available time slots for a service on a specific date
router.get('/slots/:serviceId/:date', async (req, res) => {
  try {
    const { serviceId, date } = req.params;
    
    // Define available time slots (you can make this configurable)
    const allTimeSlots = [
      '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
      '12:00 PM', '12:30 PM', '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM',
      '04:00 PM', '04:30 PM', '05:00 PM'
    ];

    // Get booked slots for the date
    const bookedAppointments = await Appointment.find({
      service: serviceId,
      appointmentDate: new Date(date),
      status: { $in: ['pending', 'confirmed'] }
    }).select('timeSlot');

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