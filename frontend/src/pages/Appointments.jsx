import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Calendar, Clock, FileText, User, Phone, Mail, MapPin, ArrowLeft } from 'lucide-react'
import axios from 'axios'
import { useAuth } from '../contexts/AuthContext'

const Appointments = () => {
  const [searchParams] = useSearchParams()
  const serviceId = searchParams.get('service')
  const navigate = useNavigate()
  const { user } = useAuth()

  const [service, setService] = useState(null)
  const [formData, setFormData] = useState({
    appointmentDate: '',
    timeSlot: '',
    notes: ''
  })
  const [availableSlots, setAvailableSlots] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    if (serviceId) {
      fetchService()
    }
  }, [serviceId])

  useEffect(() => {
    if (formData.appointmentDate && serviceId) {
      fetchAvailableSlots()
    }
  }, [formData.appointmentDate, serviceId])

  const fetchService = async () => {
    try {
      const response = await axios.get(`/services/${serviceId}`)
      if (response.data.success) {
        setService(response.data.data)
      }
    } catch (error) {
      console.error('Service fetch error:', error)
      setError('Failed to fetch service details')
    }
  }

  const fetchAvailableSlots = async () => {
    try {
      const response = await axios.get(`/appointments/slots/${serviceId}/${formData.appointmentDate}`)
      if (response.data.success) {
        setAvailableSlots(response.data.data.availableSlots)
      }
    } catch (error) {
      console.error('Slots fetch error:', error)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!serviceId) {
      setError('Please select a service first')
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const response = await axios.post('/appointments', {
        serviceId,
        appointmentDate: formData.appointmentDate,
        timeSlot: formData.timeSlot,
        notes: formData.notes
      })

      if (response.data.success) {
        setSuccess('Appointment booked successfully!')
        setTimeout(() => {
          navigate('/dashboard')
        }, 2000)
      } else {
        setError(response.data.message || 'Failed to book appointment')
      }
    } catch (error) {
      console.error('Appointment booking error:', error)
      setError(error.response?.data?.message || 'Failed to book appointment')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  // Get minimum date (tomorrow)
  const getMinDate = () => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    return tomorrow.toISOString().split('T')[0]
  }

  // Get maximum date (30 days from now)
  const getMaxDate = () => {
    const maxDate = new Date()
    maxDate.setDate(maxDate.getDate() + 30)
    return maxDate.toISOString().split('T')[0]
  }

  if (!serviceId) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-2xl mx-auto px-4">
          <div className="text-center">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Book an Appointment</h2>
            <p className="text-gray-600 mb-6">Please select a service first to book an appointment</p>
            <button
              onClick={() => navigate('/services')}
              className="btn-primary"
            >
              Browse Services
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-primary hover:text-blue-700 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </button>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Book Appointment</h1>
          <p className="text-gray-600">Schedule your appointment for the selected service</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Service Details */}
          <div className="card p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Service Details</h2>
            {service ? (
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-900">{service.name}</h3>
                  <p className="text-gray-600">{service.description}</p>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Category:</span>
                    <p className="font-medium">{service.category}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Fee:</span>
                    <p className="font-medium">
                      {service.fee === 0 ? 'Free' : `₹${service.fee}`}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500">Processing Time:</span>
                    <p className="font-medium">{service.processingTime}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Documents Required:</span>
                    <p className="font-medium">{service.requiredDocuments?.length || 0}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded mb-4"></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="h-3 bg-gray-200 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded"></div>
                </div>
              </div>
            )}

            {/* User Info */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-3">Your Information</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center space-x-2">
                  <User className="w-4 h-4 text-gray-500" />
                  <span>{user?.name}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Mail className="w-4 h-4 text-gray-500" />
                  <span>{user?.email}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Phone className="w-4 h-4 text-gray-500" />
                  <span>{user?.phone}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <MapPin className="w-4 h-4 text-gray-500" />
                  <span>Akshaya Service Center</span>
                </div>
              </div>
            </div>
          </div>

          {/* Appointment Form */}
          <div className="card p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Schedule Appointment</h2>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-4">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg mb-4">
                {success}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Date Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Appointment Date
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <input
                    type="date"
                    name="appointmentDate"
                    value={formData.appointmentDate}
                    onChange={handleChange}
                    min={getMinDate()}
                    max={getMaxDate()}
                    required
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                  />
                </div>
              </div>

              {/* Time Slot Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Time Slot
                </label>
                {formData.appointmentDate ? (
                  availableSlots.length > 0 ? (
                    <div className="grid grid-cols-3 gap-2">
                      {availableSlots.map((slot) => (
                        <label
                          key={slot}
                          className={`flex items-center justify-center p-2 border rounded-lg cursor-pointer transition-colors ${
                            formData.timeSlot === slot
                              ? 'border-primary bg-primary text-white'
                              : 'border-gray-300 hover:border-primary'
                          }`}
                        >
                          <input
                            type="radio"
                            name="timeSlot"
                            value={slot}
                            onChange={handleChange}
                            className="sr-only"
                            required
                          />
                          <span className="text-sm font-medium">{slot}</span>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-gray-500">
                      No available slots for this date
                    </div>
                  )
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    Please select a date first
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
                  onChange={handleChange}
                  rows={3}
                  placeholder="Any additional information or special requirements..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || !formData.appointmentDate || !formData.timeSlot}
                className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Booking Appointment...
                  </div>
                ) : (
                  'Book Appointment'
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Appointments