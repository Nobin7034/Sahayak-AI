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
      .populate('service', 'name category fee processingTime serviceCharge')
      .populate('center', 'name address contact location')
      .sort({ createdAt: -1 });

    // Add canEdit and canCancel flags to each appointment
    const now = new Date();
    const appointmentsWithFlags = appointments.map(appointment => {
      const appointmentDate = new Date(appointment.appointmentDate);
      const appointmentDay = new Date(appointmentDate);
      appointmentDay.setHours(9, 0, 0, 0); // 9:00 AM on appointment day
      
      // Can edit/cancel until 9:00 AM on appointment day
      const canEdit = ['pending', 'confirmed'].includes(appointment.status) && now < appointmentDay;
      const canCancel = ['pending', 'confirmed'].includes(appointment.status) && now < appointmentDay;
      
      return {
        ...appointment.toObject(),
        canEdit,
        canCancel
      };
    });

    res.json({
      success: true,
      data: appointmentsWithFlags
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
    console.log('Appointment creation request:', req.body);
    const { service, center, appointmentDate, timeSlot, notes, paymentId, selectedDocuments } = req.body;

    // Verify service exists and is active
    const serviceDoc = await Service.findById(service);
    if (!serviceDoc || !serviceDoc.isActive) {
      console.log('Service validation failed:', { service, found: !!serviceDoc, active: serviceDoc?.isActive });
      return res.status(404).json({
        success: false,
        message: 'Service not found or inactive'
      });
    }

    // Validate document selection if provided and service has document requirements
    // Temporarily disabled for debugging
    /*
    if (selectedDocuments && selectedDocuments.length > 0) {
      // Use the new minimum documents validation from Service model
      const totalDocs = (serviceDoc.documents?.length || 0) + (serviceDoc.requiredDocuments?.length || 0);
      const minimumRequired = serviceDoc.minimumRequiredDocuments ?? Math.max(1, totalDocs - 1);
      
      if (totalDocs > 0 && selectedDocuments.length < minimumRequired) {
        console.log('Document validation failed:', { 
          selectedCount: selectedDocuments.length, 
          minimumRequired, 
          totalDocs 
        });
        return res.status(400).json({
          success: false,
          message: `Please select at least ${minimumRequired} documents to proceed. You have selected ${selectedDocuments.length}.`
        });
      }
    }
    */

    // Verify center exists and is active
    const centerDoc = await AkshayaCenter.findById(center);
    if (!centerDoc || centerDoc.status !== 'active') {
      console.log('Center validation failed:', { center, found: !!centerDoc, status: centerDoc?.status });
      return res.status(404).json({
        success: false,
        message: 'Center not found or inactive'
      });
    }

    // Verify center offers the selected service
    if (!centerDoc.services.includes(service)) {
      console.log('Service not available at center:', { center, service, availableServices: centerDoc.services });
      return res.status(400).json({
        success: false,
        message: 'Selected service is not available at this center'
      });
    }

    // Validate appointment timing rules
    const appointmentDateTime = new Date(appointmentDate);
    const now = new Date();
    
    console.log('Date validation:', { appointmentDate, appointmentDateTime, now });
    
    // Check advance booking rules (3 days in advance maximum)
    const maxAdvanceDate = new Date();
    maxAdvanceDate.setDate(maxAdvanceDate.getDate() + 3);
    maxAdvanceDate.setHours(23, 59, 59, 999);
    
    if (appointmentDateTime > maxAdvanceDate) {
      console.log('Advance booking validation failed:', { appointmentDateTime, maxAdvanceDate });
      return res.status(400).json({
        success: false,
        message: 'Appointments can only be booked up to 3 days in advance'
      });
    }

    // Check minimum booking time (cannot book for today if center is closed or after hours)
    const isToday = appointmentDateTime.toDateString() === now.toDateString();
    if (isToday) {
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      const currentTime = currentHour * 100 + currentMinute;
      
      // Center working hours: 9:00 AM to 5:00 PM (900 to 1700)
      if (currentTime >= 1700) {
        return res.status(400).json({
          success: false,
          message: 'Cannot book appointments for today after 5:00 PM. Please book for tomorrow.'
        });
      }
      
      if (currentTime < 900) {
        return res.status(400).json({
          success: false,
          message: 'Cannot book appointments before center opening hours (9:00 AM)'
        });
      }
    }

    // Validate time slot is within working hours (9:00 AM to 5:00 PM)
    const timeSlotHour = parseInt(timeSlot.split(':')[0]);
    const timeSlotPeriod = timeSlot.includes('PM') ? 'PM' : 'AM';
    let timeSlotIn24 = timeSlotHour;
    
    if (timeSlotPeriod === 'PM' && timeSlotHour !== 12) {
      timeSlotIn24 += 12;
    } else if (timeSlotPeriod === 'AM' && timeSlotHour === 12) {
      timeSlotIn24 = 0;
    }
    
    console.log('Time slot validation:', { timeSlot, timeSlotHour, timeSlotPeriod, timeSlotIn24 });
    
    if (timeSlotIn24 < 9 || timeSlotIn24 >= 17) {
      console.log('Time slot validation failed:', { timeSlotIn24 });
      return res.status(400).json({
        success: false,
        message: 'Appointments can only be booked between 9:00 AM and 5:00 PM'
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
      // Store selected documents
      selectedDocuments: selectedDocuments || [],
      // Set payment info if provided
      ...(paymentId && {
        payment: {
          status: 'paid',
          amount: serviceDoc.fee,
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
      .populate('service', 'name category fee processingTime')
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

    // Check if appointment can be edited/cancelled (before 9:00 AM on appointment day)
    const now = new Date();
    const appointmentDate = new Date(appointment.appointmentDate);
    const appointmentDay = new Date(appointmentDate);
    appointmentDay.setHours(9, 0, 0, 0); // 9:00 AM on appointment day
    
    const canEdit = ['pending', 'confirmed'].includes(appointment.status) && now < appointmentDay;
    const canCancel = ['pending', 'confirmed'].includes(appointment.status) && now < appointmentDay;

    res.json({
      success: true,
      data: {
        ...appointment.toObject(),
        canEdit,
        canCancel
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

// Update appointment (only if pending and before 9:00 AM on appointment day)
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

    // Check modification timing rules - can only modify until 9:00 AM on appointment day
    const now = new Date();
    const currentAppointmentDate = new Date(appointment.appointmentDate);
    const appointmentDay = new Date(currentAppointmentDate);
    appointmentDay.setHours(9, 0, 0, 0); // 9:00 AM on appointment day
    
    if (now >= appointmentDay) {
      return res.status(400).json({
        success: false,
        message: 'Appointments cannot be modified after 9:00 AM on the appointment day'
      });
    }

    // Validate new appointment timing rules if date is being changed
    if (appointmentDate) {
      const newAppointmentDate = new Date(appointmentDate);
      const maxAdvanceDate = new Date();
      maxAdvanceDate.setDate(maxAdvanceDate.getDate() + 3);
      maxAdvanceDate.setHours(23, 59, 59, 999);
      
      if (newAppointmentDate > maxAdvanceDate) {
        return res.status(400).json({
          success: false,
          message: 'Appointments can only be booked up to 3 days in advance'
        });
      }

      // Check if new date is today and validate timing
      const isNewDateToday = newAppointmentDate.toDateString() === now.toDateString();
      if (isNewDateToday) {
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        const currentTime = currentHour * 100 + currentMinute;
        
        if (currentTime >= 1700) {
          return res.status(400).json({
            success: false,
            message: 'Cannot reschedule to today after 5:00 PM. Please select tomorrow.'
          });
        }
        
        if (currentTime < 900) {
          return res.status(400).json({
            success: false,
            message: 'Cannot reschedule before center opening hours (9:00 AM)'
          });
        }
      }
    }

    // Validate time slot is within working hours if being changed
    if (timeSlot) {
      const timeSlotHour = parseInt(timeSlot.split(':')[0]);
      const timeSlotPeriod = timeSlot.includes('PM') ? 'PM' : 'AM';
      let timeSlotIn24 = timeSlotHour;
      
      if (timeSlotPeriod === 'PM' && timeSlotHour !== 12) {
        timeSlotIn24 += 12;
      } else if (timeSlotPeriod === 'AM' && timeSlotHour === 12) {
        timeSlotIn24 = 0;
      }
      
      if (timeSlotIn24 < 9 || timeSlotIn24 >= 17) {
        return res.status(400).json({
          success: false,
          message: 'Appointments can only be scheduled between 9:00 AM and 5:00 PM'
        });
      }
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
        center: appointment.center, // Ensure we check within the same center
        appointmentDate: newDate,
        timeSlot: newTimeSlot,
        status: { $in: ['pending', 'confirmed'] }
      });

      if (existingAppointment) {
        return res.status(400).json({
          success: false,
          message: 'This time slot is already booked at this center'
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

    // Check cancellation timing rules - can only cancel until 9:00 AM on appointment day
    const now = new Date();
    const appointmentDate = new Date(appointment.appointmentDate);
    const appointmentDay = new Date(appointmentDate);
    appointmentDay.setHours(9, 0, 0, 0); // 9:00 AM on appointment day
    
    // If it's the appointment day and current time is 9:00 AM or later, prevent cancellation
    if (now >= appointmentDay) {
      return res.status(400).json({
        success: false,
        message: 'Appointments cannot be cancelled after 9:00 AM on the appointment day. Please contact the center staff for assistance.'
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

    // Define available time slots within working hours (9:00 AM to 5:00 PM)
    const allTimeSlots = [
      '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
      '12:00 PM', '12:30 PM', '01:00 PM', '01:30 PM', '02:00 PM', '02:30 PM', 
      '03:00 PM', '03:30 PM', '04:00 PM', '04:30 PM'
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