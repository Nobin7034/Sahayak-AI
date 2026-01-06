import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Calendar, 
  Clock, 
  FileText, 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  ArrowLeft, 
  CheckCircle, 
  AlertTriangle, 
  Loader2,
  IndianRupee,
  Building
} from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import centerService from '../services/centerService';

const BookAppointment = () => {
  const [searchParams] = useSearchParams();
  const serviceId = searchParams.get('service');
  const centerId = searchParams.get('center');
  const navigate = useNavigate();
  const { user } = useAuth();

  const [service, setService] = useState(null);
  const [services, setServices] = useState([]);
  const [center, setCenter] = useState(null);
  const [availableCenters, setAvailableCenters] = useState([]);
  const [formData, setFormData] = useState({
    centerId: centerId || '',
    serviceId: serviceId || '',
    appointmentDate: '',
    timeSlot: '',
    notes: ''
  });
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [razorpayKey, setRazorpayKey] = useState('');
  const [isPaying, setIsPaying] = useState(false);
  const [holidayInfo, setHolidayInfo] = useState({ isHoliday: false, reason: '' });

  useEffect(() => {
    loadInitialData();
    loadRazorpayConfig();
    loadAllServices();
  }, []);

  useEffect(() => {
    if (formData.centerId) {
      loadCenterDetails();
    }
  }, [formData.centerId]);

  useEffect(() => {
    if (formData.serviceId) {
      loadServiceDetails();
      loadAvailableCenters();
    }
  }, [formData.serviceId]);

  useEffect(() => {
    if (formData.appointmentDate && formData.centerId && formData.serviceId) {
      fetchAvailableSlots();
      checkHolidayInfo();
    }
  }, [formData.appointmentDate, formData.centerId, formData.serviceId]);

  const loadInitialData = () => {
    if (serviceId) {
      setFormData(prev => ({ ...prev, serviceId }));
    }
    if (centerId) {
      setFormData(prev => ({ ...prev, centerId }));
    }
  };

  const loadRazorpayConfig = async () => {
    try {
      const res = await axios.get('/api/payments/config');
      if (res.data?.success) {
        setRazorpayKey(res.data.data.keyId);
      }
    } catch (error) {
      console.error('Failed to load Razorpay config:', error);
    }
  };

  const loadAllServices = async () => {
    try {
      const response = await axios.get('/api/services');
      if (response.data.success) {
        setServices(response.data.data);
      }
    } catch (error) {
      console.error('Failed to load services:', error);
    }
  };

  const loadServiceDetails = async () => {
    try {
      const response = await axios.get(`/api/services/${formData.serviceId}`);
      if (response.data.success) {
        setService(response.data.data);
      }
    } catch (error) {
      console.error('Service fetch error:', error);
      setError('Failed to fetch service details');
    }
  };

  const loadCenterDetails = async () => {
    try {
      const response = await centerService.getCenterById(formData.centerId);
      setCenter(response.center);
    } catch (error) {
      console.error('Center fetch error:', error);
      setError('Failed to fetch center details');
    }
  };

  const loadAvailableCenters = async () => {
    try {
      const response = await centerService.getAllCenters();
      // Filter centers that offer the selected service
      const centersWithService = response.centers.filter(center => 
        center.services.some(s => s._id === formData.serviceId)
      );
      setAvailableCenters(centersWithService);
    } catch (error) {
      console.error('Centers fetch error:', error);
      setError('Failed to fetch available centers');
    }
  };

  const fetchAvailableSlots = async () => {
    try {
      const response = await axios.get(
        `/api/appointments/slots/${formData.serviceId}/${formData.appointmentDate}?center=${formData.centerId}`
      );
      if (response.data.success) {
        setAvailableSlots(response.data.data.availableSlots || []);
      }
    } catch (error) {
      console.error('Slots fetch error:', error);
      setAvailableSlots([]);
    }
  };

  const checkHolidayInfo = async () => {
    try {
      const response = await axios.get(
        `/api/appointments/slots/${formData.serviceId}/${formData.appointmentDate}?center=${formData.centerId}`
      );
      if (response.data?.success) {
        setHolidayInfo({
          isHoliday: !!response.data.data.isHoliday,
          reason: response.data.data.reason || ''
        });
      }
    } catch (error) {
      setHolidayInfo({ isHoliday: false, reason: '' });
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear dependent fields when changing center or service
    if (name === 'centerId' || name === 'serviceId') {
      setFormData(prev => ({
        ...prev,
        appointmentDate: '',
        timeSlot: ''
      }));
      setAvailableSlots([]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.centerId || !formData.serviceId || !formData.appointmentDate || !formData.timeSlot) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // If service has charges, handle payment first
      if (service && service.fees > 0) {
        await handlePaymentFlow();
      } else {
        await createAppointment();
      }
    } catch (error) {
      console.error('Appointment booking error:', error);
      setError(error.message || 'Failed to book appointment');
    } finally {
      setLoading(false);
      setIsPaying(false);
    }
  };

  const handlePaymentFlow = async () => {
    setIsPaying(true);
    
    // Create payment order
    const orderRes = await axios.post('/api/payments/create-order', {
      serviceId: formData.serviceId,
      centerId: formData.centerId
    });
    
    if (!orderRes.data?.success) {
      throw new Error('Failed to create payment order');
    }
    
    const order = orderRes.data.data.order;

    // Ensure Razorpay script is loaded
    await ensureRazorpayScript();

    // Open Razorpay checkout
    const options = {
      key: razorpayKey,
      amount: order.amount,
      currency: order.currency,
      name: 'Sahayak AI',
      description: `${service.name} - ${center?.name}`,
      order_id: order.id,
      prefill: {
        name: user?.name,
        email: user?.email,
        contact: user?.phone
      },
      notes: {
        serviceId: formData.serviceId,
        centerId: formData.centerId
      },
      handler: async (response) => {
        try {
          // Verify payment and create appointment
          await verifyPaymentAndCreateAppointment(response);
        } catch (error) {
          setError('Payment verification failed. Please contact support.');
        }
      },
      modal: {
        ondismiss: () => {
          setIsPaying(false);
          setError('Payment cancelled');
        }
      }
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
  };

  const ensureRazorpayScript = () => {
    return new Promise((resolve, reject) => {
      if (window.Razorpay) return resolve();
      
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Razorpay'));
      document.body.appendChild(script);
    });
  };

  const verifyPaymentAndCreateAppointment = async (paymentResponse) => {
    const verifyRes = await axios.post('/api/payments/verify', {
      razorpay_order_id: paymentResponse.razorpay_order_id,
      razorpay_payment_id: paymentResponse.razorpay_payment_id,
      razorpay_signature: paymentResponse.razorpay_signature
    });

    if (!verifyRes.data?.success) {
      throw new Error('Payment verification failed');
    }

    await createAppointment(paymentResponse.razorpay_payment_id);
  };

  const createAppointment = async (paymentId = null) => {
    const appointmentData = {
      service: formData.serviceId,
      center: formData.centerId,
      appointmentDate: formData.appointmentDate,
      timeSlot: formData.timeSlot,
      notes: formData.notes,
      paymentId
    };

    const response = await axios.post('/api/appointments', appointmentData);
    
    if (response.data.success) {
      setSuccess('Appointment booked successfully!');
      setTimeout(() => {
        navigate('/appointments');
      }, 2000);
    } else {
      throw new Error(response.data.message || 'Failed to create appointment');
    }
  };

  const getMinDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  const getMaxDate = () => {
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 30); // 30 days from now
    return maxDate.toISOString().split('T')[0];
  };

  if (!formData.serviceId && !formData.centerId) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-2xl mx-auto px-4">
          <div className="bg-white rounded-lg shadow-sm p-6 text-center">
            <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Service or Center Required
            </h2>
            <p className="text-gray-600 mb-4">
              Please select a service or center first to book an appointment.
            </p>
            <div className="space-y-2">
              <button
                onClick={() => navigate('/services')}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
              >
                Browse Services
              </button>
              <button
                onClick={() => navigate('/centers')}
                className="w-full bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700"
              >
                Find Centers
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-blue-600 hover:text-blue-700 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Book Appointment</h1>
          <p className="text-gray-600">Schedule your appointment for government services</p>
        </div>

        {/* Success Message */}
        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-md p-4">
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
              <span className="text-green-800">{success}</span>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
              <span className="text-red-800">{error}</span>
            </div>
          </div>
        )}

        {/* Booking Form */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Service Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Service *
              </label>
              {service ? (
                <div className="bg-gray-50 border rounded-md p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900">{service.name}</h3>
                      <p className="text-sm text-gray-600">{service.category}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-green-600">₹{service.fees}</p>
                      <p className="text-xs text-gray-500">{service.processingTime}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <select
                  name="serviceId"
                  value={formData.serviceId}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Select a service</option>
                  {services.map((service) => (
                    <option key={service._id} value={service._id}>
                      {service.name} - ₹{service.fees}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Center Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Akshaya Center *
              </label>
              {center ? (
                <div className="bg-gray-50 border rounded-md p-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{center.name}</h3>
                      <p className="text-sm text-gray-600 flex items-center mt-1">
                        <MapPin className="h-4 w-4 mr-1" />
                        {center.address.city}, {center.address.district}
                      </p>
                      <p className="text-sm text-gray-600 flex items-center mt-1">
                        <Phone className="h-4 w-4 mr-1" />
                        {center.contact.phone}
                      </p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      centerService.isCenterOpen(center)
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {centerService.isCenterOpen(center) ? 'Open' : 'Closed'}
                    </span>
                  </div>
                </div>
              ) : (
                <select
                  name="centerId"
                  value={formData.centerId}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Select a center</option>
                  {availableCenters.map((center) => (
                    <option key={center._id} value={center._id}>
                      {center.name} - {center.address.city}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Date Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Appointment Date *
              </label>
              <input
                type="date"
                name="appointmentDate"
                value={formData.appointmentDate}
                onChange={handleInputChange}
                min={getMinDate()}
                max={getMaxDate()}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
              
              {holidayInfo.isHoliday && (
                <div className="mt-2 bg-yellow-50 border border-yellow-200 rounded-md p-3">
                  <div className="flex items-center">
                    <AlertTriangle className="h-4 w-4 text-yellow-500 mr-2" />
                    <span className="text-yellow-800 text-sm">
                      {holidayInfo.reason || 'This date is a holiday. Please select another date.'}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Time Slot Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Time Slot *
              </label>
              {availableSlots.length > 0 ? (
                <div className="grid grid-cols-3 gap-2">
                  {availableSlots.map((slot) => (
                    <label
                      key={slot}
                      className={`flex items-center justify-center p-2 border rounded-md cursor-pointer transition-colors ${
                        formData.timeSlot === slot
                          ? 'bg-blue-100 border-blue-500 text-blue-700'
                          : 'bg-white border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="timeSlot"
                        value={slot}
                        checked={formData.timeSlot === slot}
                        onChange={handleInputChange}
                        className="sr-only"
                      />
                      <Clock className="h-4 w-4 mr-1" />
                      {slot}
                    </label>
                  ))}
                </div>
              ) : formData.appointmentDate && !holidayInfo.isHoliday ? (
                <div className="text-sm text-gray-500 bg-gray-50 border rounded-md p-3">
                  No available slots for the selected date. Please choose another date.
                </div>
              ) : (
                <div className="text-sm text-gray-500 bg-gray-50 border rounded-md p-3">
                  Please select a date to view available time slots.
                </div>
              )}
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Additional Notes (Optional)
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                rows={3}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Any additional information or special requirements..."
              />
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={loading || isPaying || holidayInfo.isHoliday}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-md font-medium
                         hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500
                         disabled:bg-gray-300 disabled:cursor-not-allowed
                         transition-colors duration-200"
              >
                {loading || isPaying ? (
                  <div className="flex items-center justify-center">
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    {isPaying ? 'Processing Payment...' : 'Booking Appointment...'}
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <Calendar className="h-4 w-4 mr-2" />
                    {service && service.fees > 0 
                      ? `Pay ₹${service.fees} & Book Appointment`
                      : 'Book Appointment'
                    }
                  </div>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default BookAppointment;