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
  Building,
  Shield,
  Wifi
} from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import centerService from '../services/centerService';
import paymentService from '../services/paymentService';
import { auth } from '../firebase';

// Create authenticated axios instance with same logic as AuthContext
const createAuthenticatedAxios = () => {
  const instance = axios.create();
  
  instance.interceptors.request.use(async (config) => {
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
      console.error('BookAppointment auth error:', error);
      // Let request proceed without token
    }
    return config;
  });
  
  return instance;
};

const BookAppointment = () => {
  const [searchParams] = useSearchParams();
  const serviceId = searchParams.get('service');
  const centerId = searchParams.get('center');
  const documentsParam = searchParams.get('documents');
  const processingModeParam = searchParams.get('processingMode');
  const structuredDataParam = searchParams.get('structuredData');
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Parse selected documents from URL
  const selectedDocuments = documentsParam ? JSON.parse(decodeURIComponent(documentsParam)) : [];
  const processingMode = processingModeParam || 'physical';
  const structuredData = structuredDataParam ? JSON.parse(decodeURIComponent(structuredDataParam)) : null;
  
  // Create authenticated axios instance
  const authAxios = createAuthenticatedAxios();

  const [service, setService] = useState(null);
  const [services, setServices] = useState([]);
  const [center, setCenter] = useState(null);
  const [availableCenters, setAvailableCenters] = useState([]);
  const [formData, setFormData] = useState({
    centerId: centerId || '',
    serviceId: serviceId || '',
    appointmentDate: '',
    timeSlot: '',
    notes: '',
    selectedDocuments: selectedDocuments
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
      await paymentService.loadConfig();
    } catch (error) {
      console.error('Failed to load Razorpay config:', error);
    }
  };

  const loadAllServices = async () => {
    try {
      const response = await authAxios.get('/api/services');
      if (response.data.success) {
        setServices(response.data.data);
      }
    } catch (error) {
      console.error('Failed to load services:', error);
    }
  };

  const loadServiceDetails = async () => {
    try {
      const response = await authAxios.get(`/api/services/${formData.serviceId}`);
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
      const response = await authAxios.get(
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
      const response = await authAxios.get(
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

  const validateBookingTiming = (selectedDate) => {
    const now = new Date();
    const appointmentDate = new Date(selectedDate);
    const isToday = appointmentDate.toDateString() === now.toDateString();
    
    if (isToday) {
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      const currentTime = currentHour * 100 + currentMinute;
      
      // Center working hours: 9:00 AM to 5:00 PM (900 to 1700)
      if (currentTime >= 1700) {
        return {
          valid: false,
          message: 'Cannot book appointments for today after 5:00 PM. Please select tomorrow.'
        };
      }
      
      if (currentTime < 900) {
        return {
          valid: false,
          message: 'Cannot book appointments before center opening hours (9:00 AM).'
        };
      }
    }
    
    // Check if date is more than 3 days in advance
    const maxAdvanceDate = new Date();
    maxAdvanceDate.setDate(maxAdvanceDate.getDate() + 3);
    maxAdvanceDate.setHours(23, 59, 59, 999);
    
    if (appointmentDate > maxAdvanceDate) {
      return {
        valid: false,
        message: 'Appointments can only be booked up to 3 days in advance.'
      };
    }
    
    return { valid: true };
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Validate date selection timing
    if (name === 'appointmentDate' && value) {
      const validation = validateBookingTiming(value);
      if (!validation.valid) {
        setError(validation.message);
        return;
      } else {
        setError('');
      }
    }
    
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
    
    // Validation based on processing mode
    if (processingMode === 'physical') {
      if (!formData.centerId || !formData.serviceId || !formData.appointmentDate || !formData.timeSlot) {
        setError('Please fill in all required fields');
        return;
      }
    } else {
      // Online mode - only need center and service
      if (!formData.centerId || !formData.serviceId) {
        setError('Please select a service and center');
        return;
      }
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Determine payment amount based on processing mode
      const paymentRequired = processingMode === 'online' 
        ? service.fee  // Full amount for online
        : service.serviceCharge;  // Service charge for physical
      
      // If payment is required, handle payment first
      if (paymentRequired > 0) {
        await handlePaymentFlow(paymentRequired);
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

  const handlePaymentFlow = async (amount) => {
    setIsPaying(true);
    
    try {
      // Create payment order with the specified amount
      const orderData = await paymentService.createOrder(
        formData.serviceId, 
        formData.centerId,
        amount  // Pass the amount based on processing mode
      );
      const order = orderData.order;

      // Open Razorpay checkout
      await paymentService.openCheckout({
        amount: order.amount,
        currency: order.currency,
        name: 'Sahayak AI',
        description: `${service.name} - ${center?.name}${processingMode === 'online' ? ' (Full Payment)' : ' (Booking Fee)'}`,
        order_id: order.id,
        prefill: {
          name: user?.name,
          email: user?.email,
          contact: user?.phone
        },
        notes: {
          serviceId: formData.serviceId,
          centerId: formData.centerId,
          processingMode: processingMode
        },
        handler: async (response) => {
          try {
            // Verify payment and create appointment
            await verifyPaymentAndCreateAppointment(response);
          } catch (error) {
            setError('Payment verification failed. Please contact support.');
            setIsPaying(false);
          }
        },
        modal: {
          ondismiss: () => {
            setIsPaying(false);
            setError('Payment cancelled');
          }
        }
      });
    } catch (error) {
      setIsPaying(false);
      throw error;
    }
  };

  const verifyPaymentAndCreateAppointment = async (paymentResponse) => {
    const verificationData = await paymentService.verifyPayment({
      razorpay_order_id: paymentResponse.razorpay_order_id,
      razorpay_payment_id: paymentResponse.razorpay_payment_id,
      razorpay_signature: paymentResponse.razorpay_signature
    });

    await createAppointment(paymentResponse.razorpay_payment_id);
  };

  const createAppointment = async (paymentId = null) => {
    const appointmentData = {
      service: formData.serviceId,
      center: formData.centerId,
      notes: formData.notes,
      selectedDocuments: formData.selectedDocuments,
      processingMode: processingMode,
      structuredDocumentData: structuredData,
      paymentId
    };

    // Only add date/time for physical appointments
    if (processingMode === 'physical') {
      appointmentData.appointmentDate = formData.appointmentDate;
      appointmentData.timeSlot = formData.timeSlot;
    }

    const response = await authAxios.post('/api/appointments', appointmentData);
    
    if (response.data.success) {
      setSuccess(
        processingMode === 'online' 
          ? 'Request submitted successfully! Staff will process it when available.'
          : 'Appointment booked successfully!'
      );
      setTimeout(() => {
        navigate('/appointments');
      }, 2000);
    } else {
      throw new Error(response.data.message || 'Failed to create appointment');
    }
  };

  const getMinDate = () => {
    const now = new Date();
    const currentHour = now.getHours();
    
    // If it's after 5:00 PM today, minimum date is tomorrow
    // If it's before 9:00 AM today, minimum date is today
    // Otherwise, minimum date is today
    if (currentHour >= 17) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      return tomorrow.toISOString().split('T')[0];
    } else {
      return now.toISOString().split('T')[0];
    }
  };

  const getMaxDate = () => {
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 3); // 3 days in advance
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
            
            {/* Processing Mode Indicator */}
            {processingMode === 'online' && (
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
                <div className="flex items-center space-x-2">
                  <Wifi className="h-5 w-5 text-purple-600" />
                  <div className="flex-1">
                    <h3 className="font-medium text-purple-900">Online Processing Mode</h3>
                    <p className="text-sm text-purple-700 mt-1">
                      Your documents and data will be securely shared with authorized staff for remote processing
                    </p>
                    {service && service.fee > 0 && (
                      <div className="mt-3 pt-3 border-t border-purple-200">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-purple-900">Full Payment Required:</span>
                          <span className="text-lg font-bold text-purple-900">₹{service.fee}</span>
                        </div>
                        <p className="text-xs text-purple-600 mt-1">
                          Complete payment upfront for online processing
                        </p>
                      </div>
                    )}
                  </div>
                </div>
                {structuredData && (
                  <div className="mt-3 pt-3 border-t border-purple-200">
                    <p className="text-sm text-purple-800">
                      ✓ {structuredData.documents?.length || 0} documents with structured data attached
                    </p>
                  </div>
                )}
              </div>
            )}
            
            {processingMode === 'physical' && service && service.serviceCharge > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-center space-x-2">
                  <Building className="h-5 w-5 text-blue-600" />
                  <div className="flex-1">
                    <h3 className="font-medium text-blue-900">Walk-in Appointment</h3>
                    <div className="mt-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-blue-900">Booking Fee:</span>
                        <span className="text-lg font-bold text-blue-900">₹{service.serviceCharge}</span>
                      </div>
                      <p className="text-xs text-blue-600 mt-1">
                        Pay remaining ₹{service.fee - service.serviceCharge} at the center
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Selected Documents Summary */}
            {selectedDocuments.length > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-3">
                  <Shield className="h-5 w-5 text-green-600" />
                  <h3 className="font-medium text-green-900">Selected Documents</h3>
                  <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                    {selectedDocuments.length} documents
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {selectedDocuments.map((doc, index) => (
                    <div key={index} className="flex items-center space-x-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-green-800">
                        {doc.isAlternative ? doc.alternativeName : doc.documentName}
                      </span>
                    </div>
                  ))}
                </div>
                <p className="text-green-700 text-xs mt-2">
                  Please bring these documents to your appointment
                </p>
              </div>
            )}
            
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
                      <p className="font-medium text-green-600">₹{service.fee}</p>
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
                      {service.name} - ₹{service.fee}
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

            {/* Date Selection - Only for Physical Mode */}
            {processingMode === 'physical' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Appointment Date *
                </label>
                
                {/* Booking Rules Info */}
                <div className="mb-3 bg-blue-50 border border-blue-200 rounded-md p-3">
                  <div className="flex items-start">
                    <Clock className="h-4 w-4 text-blue-500 mr-2 mt-0.5" />
                    <div className="text-sm text-blue-800">
                      <p className="font-medium mb-1">Booking Rules:</p>
                      <ul className="text-xs space-y-1">
                        <li>• Appointments available: 9:00 AM - 5:00 PM</li>
                        <li>• Book up to 3 days in advance</li>
                        <li>• Cancel until 9:00 AM on appointment day</li>
                        <li>• After 5:00 PM today, book for tomorrow</li>
                      </ul>
                    </div>
                  </div>
                </div>
                
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
            )}

            {/* Time Slot Selection - Only for Physical Mode */}
            {processingMode === 'physical' && (
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
            )}

            {/* Online Mode Info */}
            {processingMode === 'online' && (
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <div className="flex items-start">
                  <Clock className="h-5 w-5 text-purple-600 mr-3 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <h4 className="font-medium text-purple-900 mb-1">
                      No Appointment Time Required
                    </h4>
                    <p className="text-sm text-purple-800">
                      For online processing, staff will handle your request when they're available. 
                      This allows them to prioritize walk-in customers while processing your documents remotely.
                    </p>
                    <p className="text-sm text-purple-700 mt-2">
                      You'll receive notifications about your application status.
                    </p>
                  </div>
                </div>
              </div>
            )}

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
                disabled={loading || isPaying || (processingMode === 'physical' && holidayInfo.isHoliday)}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-md font-medium
                         hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500
                         disabled:bg-gray-300 disabled:cursor-not-allowed
                         transition-colors duration-200"
              >
                {loading || isPaying ? (
                  <div className="flex items-center justify-center">
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    {isPaying ? 'Processing Payment...' : processingMode === 'online' ? 'Submitting Request...' : 'Booking Appointment...'}
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    {processingMode === 'online' ? (
                      <>
                        <Wifi className="h-4 w-4 mr-2" />
                        {service && service.fee > 0 
                          ? `Pay ₹${service.fee} & Submit Request`
                          : 'Submit Online Request'
                        }
                      </>
                    ) : (
                      <>
                        <Calendar className="h-4 w-4 mr-2" />
                        {service && service.serviceCharge > 0 
                          ? `Pay ₹${service.serviceCharge} & Book Appointment`
                          : 'Book Appointment'
                        }
                      </>
                    )}
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