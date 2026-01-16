import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Calendar, Clock, FileText, User, Phone, Mail, MapPin, ArrowLeft, Edit3, CheckCircle, AlertTriangle, Loader2, X, IndianRupee, Trash2 } from 'lucide-react'
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
  const [appointments, setAppointments] = useState([])
  const [appointmentsLoading, setAppointmentsLoading] = useState(false)
  const [editingAppointment, setEditingAppointment] = useState(null)
  const [editForm, setEditForm] = useState({ appointmentDate: '', timeSlot: '', notes: '' })
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })
  const [razorpayKey, setRazorpayKey] = useState('')
  const [isPaying, setIsPaying] = useState(false)
  const [rescheduleMode, setRescheduleMode] = useState(null) // appointmentId when rescheduling
  const [holidayInfo, setHolidayInfo] = useState({ isHoliday: false, reason: '' })
  const [deleting, setDeleting] = useState(null) // appointmentId when deleting

  useEffect(() => {
    if (serviceId) {
      fetchService()
    } else {
      // Only fetch appointments if user is authenticated
      if (user) {
        fetchAppointments()
      }
    }
  }, [serviceId, user])

  useEffect(() => {
    // load Razorpay key
    const loadConfig = async () => {
      try {
        const res = await axios.get('/api/payments/config')
        if (res.data?.success) setRazorpayKey(res.data.data.keyId)
      } catch (_) {}
    }
    loadConfig()
  }, [])

  useEffect(() => {
    if (formData.appointmentDate && serviceId) {
      fetchAvailableSlots()
      // check holiday info via slots response or a dedicated endpoint
      ;(async () => {
        try {
          const res = await axios.get(`/api/appointments/slots/${serviceId}/${formData.appointmentDate}`)
          if (res.data?.success) {
            setHolidayInfo({ isHoliday: !!res.data.data.isHoliday, reason: res.data.data.reason || '' })
          }
        } catch (_) {
          setHolidayInfo({ isHoliday: false, reason: '' })
        }
      })()
    }
  }, [formData.appointmentDate, serviceId])

  const fetchService = async () => {
    try {
      const response = await axios.get(`/api/services/${serviceId}`)
      if (response.data.success) {
        setService(response.data.data)
      }
    } catch (error) {
      console.error('Service fetch error:', error)
      setError('Failed to fetch service details')
    }
  }

  const fetchAppointments = async () => {
    try {
      setAppointmentsLoading(true)
      const token = localStorage.getItem('token')
      console.log('Fetching appointments with token:', token ? 'Token exists' : 'No token')
      
      const response = await axios.get('/api/appointments')
      if (response.data.success) {
        console.log('Fetched appointments:', response.data.data)
        setAppointments(response.data.data)
      }
    } catch (error) {
      console.error('Appointments fetch error:', error)
      console.error('Error response:', error.response?.data)
      console.error('Error status:', error.response?.status)
      
      // If 403, might be authentication issue
      if (error.response?.status === 403) {
        console.error('403 Forbidden - Check if user is logged in and token is valid')
      }
    } finally {
      setAppointmentsLoading(false)
    }
  }

  const fetchAvailableSlots = async () => {
    try {
      const response = await axios.get(`/api/appointments/slots/${serviceId}/${formData.appointmentDate}`)
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
      // If serviceCharge > 0, collect payment first
      if (service && service.serviceCharge > 0) {
        setIsPaying(true)
        // 1) Create order
        const orderRes = await axios.post('/api/payments/create-order', { serviceId })
        if (!orderRes.data?.success) throw new Error('Failed to create order')
        const order = orderRes.data.data.order

        // 2) Ensure Razorpay script is loaded
        const ensureScript = () => new Promise((resolve, reject) => {
          if (window.Razorpay) return resolve()
          const script = document.createElement('script')
          script.src = 'https://checkout.razorpay.com/v1/checkout.js'
          script.onload = () => resolve()
          script.onerror = () => reject(new Error('Failed to load Razorpay'))
          document.body.appendChild(script)
        })
        await ensureScript()

        // 3) Open checkout
        const options = {
          key: razorpayKey,
          amount: order.amount,
          currency: order.currency,
          name: 'Sahayak AI',
          description: service.name,
          order_id: order.id,
          prefill: { name: user?.name, email: user?.email, contact: user?.phone },
          notes: { serviceId },
          handler: async function (response) {
            try {
              const verifyRes = await axios.post('/api/payments/verify-and-create-appointment', {
                serviceId,
                appointmentDate: formData.appointmentDate,
                timeSlot: formData.timeSlot,
                notes: formData.notes,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature
              })
              if (verifyRes.data?.success) {
                setSuccess('Payment successful and appointment confirmed!')
                setTimeout(() => navigate('/dashboard'), 1500)
              } else {
                setError(verifyRes.data?.message || 'Failed to confirm appointment')
              }
            } catch (err) {
              setError(err.response?.data?.message || 'Payment verification failed')
            } finally {
              setIsPaying(false)
              setLoading(false)
            }
          },
          modal: {
            ondismiss: () => {
              setIsPaying(false)
              setLoading(false)
              setError('Payment cancelled')
            }
          }
        }
        const rzp = new window.Razorpay(options)
        rzp.open()
        return
      }

      // If no serviceCharge, just create appointment
      const response = await axios.post('/api/appointments', {
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
      setError(error.response?.data?.message || error.message || 'Failed to book appointment')
    } finally {
      if (!isPaying) setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  // Handle edit appointment
  const handleEditAppointment = (appointment) => {
    console.log('Edit appointment clicked:', appointment)
    setEditingAppointment(appointment._id)
    setEditForm({
      appointmentDate: new Date(appointment.appointmentDate).toISOString().split('T')[0],
      timeSlot: appointment.timeSlot,
      notes: appointment.notes || ''
    })
    setMessage({ type: '', text: '' })
  }

  // Enter reschedule mode for an ended appointment
  const handleRescheduleAppointment = (appointment) => {
    setRescheduleMode(appointment._id)
    setEditingAppointment(appointment._id)
    setEditForm({
      appointmentDate: new Date().toISOString().split('T')[0],
      timeSlot: '',
      notes: appointment.notes || ''
    })
    setMessage({ type: '', text: '' })
  }

  // Handle save appointment changes
  const handleSaveAppointment = async (e) => {
    e.preventDefault()
    try {
      setSaving(true)
      setMessage({ type: '', text: '' })
      const isReschedule = rescheduleMode === editingAppointment
      const url = isReschedule ? `/api/appointments/${editingAppointment}/reschedule` : `/api/appointments/${editingAppointment}`
      const response = await axios.put(url, editForm)
      
      if (response.data.success) {
        // Update the appointment in the list
        setAppointments(prev => prev.map(apt => 
          apt._id === editingAppointment ? response.data.data : apt
        ))
        setEditingAppointment(null)
        setRescheduleMode(null)
        setMessage({ type: 'success', text: 'Appointment updated successfully!' })
      } else {
        setMessage({ type: 'error', text: response.data.message || 'Failed to update appointment' })
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to update appointment' })
    } finally {
      setSaving(false)
    }
  }

  // Handle cancel edit
  const handleCancelEdit = () => {
    setEditingAppointment(null)
    setRescheduleMode(null)
    setEditForm({ appointmentDate: '', timeSlot: '', notes: '' })
    setMessage({ type: '', text: '' })
  }

  // Handle delete appointment
  const handleDeleteAppointment = async (appointmentId) => {
    if (!window.confirm('Are you sure you want to cancel this appointment? This action cannot be undone.')) {
      return
    }

    try {
      setDeleting(appointmentId)
      const response = await axios.delete(`/api/appointments/${appointmentId}`)
      
      if (response.data.success) {
        // Remove the appointment from the list
        setAppointments(prev => prev.filter(apt => apt._id !== appointmentId))
        setMessage({ type: 'success', text: 'Appointment cancelled successfully!' })
      } else {
        setMessage({ type: 'error', text: response.data.message || 'Failed to cancel appointment' })
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to cancel appointment' })
    } finally {
      setDeleting(null)
    }
  }

  // Get available time slots (updated to exclude 5:00 PM - center closes at 5:00 PM)
  const timeSlots = [
    '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
    '12:00 PM', '12:30 PM', '01:00 PM', '01:30 PM', '02:00 PM', '02:30 PM', 
    '03:00 PM', '03:30 PM', '04:00 PM', '04:30 PM'
  ]

  // Get minimum date (today or tomorrow based on timing rules)
  const getMinDate = () => {
    const now = new Date()
    const currentHour = now.getHours()
    
    // If it's after 5:00 PM today, minimum date is tomorrow
    if (currentHour >= 17) {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      return tomorrow.toISOString().split('T')[0]
    } else {
      return now.toISOString().split('T')[0]
    }
  }

  // Get maximum date (3 days in advance)
  const getMaxDate = () => {
    const maxDate = new Date()
    maxDate.setDate(maxDate.getDate() + 3)
    return maxDate.toISOString().split('T')[0]
  }

  if (!serviceId) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">My Appointments</h1>
            <p className="text-lg text-gray-600">Manage your scheduled appointments</p>
          </div>

          {/* Appointment Rules Info */}
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start">
              <Clock className="w-5 h-5 text-blue-500 mr-3 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-2">Appointment Management Rules:</p>
                <ul className="text-xs space-y-1">
                  <li>• Edit or cancel appointments until 9:00 AM on appointment day</li>
                  <li>• Working hours: 9:00 AM - 5:00 PM (Monday to Saturday)</li>
                  <li>• Book up to 3 days in advance</li>
                  <li>• Closed on Sundays and second Saturdays</li>
                  <li>• For assistance after cutoff time, contact center staff</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Message Display */}
          {message.text && (
            <div className={`mb-6 p-4 rounded-lg border ${
              message.type === 'success' 
                ? 'bg-green-50 border-green-200 text-green-800' 
                : 'bg-red-50 border-red-200 text-red-800'
            }`}>
              <div className="flex items-center gap-2">
                {message.type === 'success' ? (
                  <CheckCircle className="w-5 h-5" />
                ) : (
                  <AlertTriangle className="w-5 h-5" />
                )}
                <span className="text-sm">{message.text}</span>
              </div>
            </div>
          )}

          {/* Browse Services Button */}
          <div className="text-center mb-8">
            <button
              onClick={() => navigate('/services')}
              className="btn-primary"
            >
              Browse Services
            </button>
          </div>

          {/* Appointments List */}
          {appointmentsLoading ? (
            <div className="text-center py-8">
              <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-4" />
              <p className="text-gray-600">Loading appointments...</p>
            </div>
          ) : appointments.length > 0 ? (
            <div className="space-y-4">
              {appointments.map((appointment) => (
                <div
                  key={appointment._id}
                  className="card p-6"
                >
                  {editingAppointment === appointment._id ? (
                    // Edit Form
                    <form onSubmit={handleSaveAppointment} className="space-y-4">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">Edit Appointment</h3>
                        <button
                          type="button"
                          onClick={handleCancelEdit}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Date
                          </label>
                          <input
                            type="date"
                            value={editForm.appointmentDate}
                            onChange={(e) => setEditForm({ ...editForm, appointmentDate: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary focus:border-primary"
                            min={getMinDate()}
                            max={getMaxDate()}
                            required
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Time Slot
                          </label>
                          <select
                            value={editForm.timeSlot}
                            onChange={(e) => setEditForm({ ...editForm, timeSlot: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary focus:border-primary"
                            required
                          >
                            <option value="">Select time</option>
                            {timeSlots.map(slot => (
                              <option key={slot} value={slot}>{slot}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Notes (Optional)
                        </label>
                        <textarea
                          value={editForm.notes}
                          onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary focus:border-primary"
                          rows={3}
                          placeholder="Add any additional notes..."
                        />
                      </div>
                      
                      <div className="flex gap-2">
                        <button
                          type="submit"
                          disabled={saving}
                          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                        >
                          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                          {saving ? 'Saving...' : 'Save Changes'}
                        </button>
                        <button
                          type="button"
                          onClick={handleCancelEdit}
                          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : (
                    // Display Mode
                    <>
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{appointment.service?.name}</h3>
                          <p className="text-sm text-gray-600">{appointment.service?.category}</p>
                        </div>
                      <div className="flex items-center gap-2">
                          <span className={`text-sm px-3 py-1 rounded-full font-medium ${
                            appointment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            appointment.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                            appointment.status === 'completed' ? 'bg-green-100 text-green-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {appointment.status}
                          </span>
                        {appointment.canEdit ? (
                            <button
                              onClick={() => handleEditAppointment(appointment)}
                              className="text-primary hover:text-blue-700 p-1"
                              title="Edit appointment"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                        ) : (
                          (() => {
                            const now = new Date()
                            const aptDate = new Date(appointment.appointmentDate)
                            const appointmentDay = new Date(aptDate)
                            appointmentDay.setHours(9, 0, 0, 0) // 9:00 AM on appointment day
                            
                            const isEnded = aptDate.getTime() < now.getTime()
                            // Can edit/cancel until 9:00 AM on appointment day
                            const canEdit = ['pending', 'confirmed'].includes(appointment.status) && now < appointmentDay
                            const canCancel = ['pending', 'confirmed'].includes(appointment.status) && now < appointmentDay
                            
                            if (isEnded && ['pending','confirmed'].includes(appointment.status)) {
                              return (
                                <button
                                  onClick={() => handleRescheduleAppointment(appointment)}
                                  className="text-orange-600 hover:text-orange-700 text-sm px-3 py-1 border border-orange-300 rounded"
                                  title="Reschedule appointment"
                                >
                                  Reschedule
                                </button>
                              )
                            }
                            
                            if (canEdit) {
                              return (
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => handleEditAppointment(appointment)}
                                    className="text-primary hover:text-blue-700 p-1"
                                    title="Edit appointment"
                                  >
                                    <Edit3 className="w-4 h-4" />
                                  </button>
                                  {canCancel && (
                                    <button
                                      onClick={() => handleDeleteAppointment(appointment._id)}
                                      disabled={deleting === appointment._id}
                                      className="text-red-600 hover:text-red-700 p-1 disabled:opacity-50"
                                      title="Cancel appointment"
                                    >
                                      {deleting === appointment._id ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                      ) : (
                                        <Trash2 className="w-4 h-4" />
                                      )}
                                    </button>
                                  )}
                                </div>
                              )
                            }
                            
                            return (
                              <span className="text-xs text-gray-400">
                                {now >= appointmentDay ? 'Cannot edit after 9:00 AM on appointment day' : 'Cannot edit'}
                              </span>
                            )
                          })()
                        )}
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        {/* Appointment Details Section */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div className="flex items-center space-x-2">
                            <Calendar className="w-4 h-4 text-gray-500" />
                            <span>
                              {(() => {
                                const now = new Date()
                                const aptDate = new Date(appointment.appointmentDate)
                                const ended = aptDate.getTime() < now.getTime()
                                const dateText = `${aptDate.toLocaleDateString()} at ${appointment.timeSlot}`
                                return ended ? `Date ended: ${dateText}` : dateText
                              })()}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Clock className="w-4 h-4 text-gray-500" />
                            <span>Processing: {appointment.service?.processingTime}</span>
                          </div>
                        </div>

                        {/* Center Information Section */}
                        {appointment.center && (
                          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                            <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                              <MapPin className="w-4 h-4 text-blue-600" />
                              Center Details
                            </h4>
                            <div className="space-y-2 text-sm">
                              <div>
                                <span className="text-gray-600">Name:</span>
                                <p className="font-medium text-gray-900">{appointment.center.name}</p>
                              </div>
                              <div>
                                <span className="text-gray-600">Address:</span>
                                <p className="font-medium text-gray-900">
                                  {typeof appointment.center.address === 'string' 
                                    ? appointment.center.address 
                                    : `${appointment.center.address?.street || ''}, ${appointment.center.address?.city || ''}, ${appointment.center.address?.district || ''}, ${appointment.center.address?.state || ''} - ${appointment.center.address?.pincode || ''}`
                                  }
                                </p>
                              </div>
                              {appointment.center.contact && (
                                <div>
                                  <span className="text-gray-600">Contact:</span>
                                  <p className="font-medium text-gray-900">
                                    {typeof appointment.center.contact === 'string'
                                      ? appointment.center.contact
                                      : appointment.center.contact?.phone || appointment.center.contact?.email || 'N/A'
                                    }
                                  </p>
                                </div>
                              )}
                              {appointment.center.location && appointment.center.location.coordinates && (
                                <div className="mt-3">
                                  <a
                                    href={`https://www.google.com/maps?q=${appointment.center.location.coordinates[1]},${appointment.center.location.coordinates[0]}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                  >
                                    <MapPin className="w-4 h-4" />
                                    View on Google Maps
                                  </a>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Payment Information Section */}
                        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                          <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                            <IndianRupee className="w-4 h-4 text-gray-600" />
                            Payment Details
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                            <div>
                              <span className="text-gray-600">Total Fee:</span>
                              <p className="font-medium text-gray-900">
                                {appointment.service?.fee === 0 ? 'Free' : `₹${appointment.service?.fee}`}
                              </p>
                            </div>
                            {appointment.payment && appointment.payment.status === 'paid' && (
                              <>
                                <div>
                                  <span className="text-gray-600">Paid Amount:</span>
                                  <p className="font-medium text-green-600">₹{appointment.payment.amount}</p>
                                </div>
                                <div>
                                  <span className="text-gray-600">Payment Status:</span>
                                  <p className="font-medium text-green-600 capitalize">{appointment.payment.status}</p>
                                </div>
                                {appointment.payment.paymentId && (
                                  <div>
                                    <span className="text-gray-600">Payment ID:</span>
                                    <p className="font-medium text-gray-900 text-xs">{appointment.payment.paymentId}</p>
                                  </div>
                                )}
                              </>
                            )}
                            {(!appointment.payment || appointment.payment.status !== 'paid') && appointment.service?.fee > 0 && (
                              <div>
                                <span className="text-gray-600">Payment Status:</span>
                                <p className="font-medium text-orange-600">Pending - Pay at center</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {appointment.notes && (
                        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                          <p className="text-sm text-gray-700">
                            <strong>Notes:</strong> {appointment.notes}
                          </p>
                        </div>
                      )}
                      
                      {!appointment.canEdit && appointment.status === 'pending' && (
                        <div className="mt-4 flex items-center space-x-2 text-orange-600">
                          <Clock className="w-4 h-4" />
                          <span className="text-sm">Cannot edit after 9:00 AM on appointment day</span>
                        </div>
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No appointments yet</h3>
              <p className="text-gray-500 mb-6">You haven't booked any appointments yet</p>
              <button
                onClick={() => navigate('/services')}
                className="btn-primary"
              >
                Book Your First Appointment
              </button>
            </div>
          )}
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
                  {typeof service.serviceCharge === 'number' && (
                    <div>
                      <span className="text-gray-500">Service Charge (Upfront):</span>
                      <p className="font-medium">₹{service.serviceCharge}</p>
                    </div>
                  )}
                  {typeof service.serviceCharge === 'number' && (
                    <div>
                      <span className="text-gray-500">Remaining on Completion:</span>
                      <p className="font-medium">₹{Math.max((service.fee || 0) - (service.serviceCharge || 0), 0)}</p>
                    </div>
                  )}
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
                {formData.appointmentDate && holidayInfo.isHoliday && (
                  <div className="text-sm text-red-600 mt-2">{holidayInfo.reason ? `${holidayInfo.reason} — no bookings allowed.` : 'This date is a holiday — no bookings allowed.'}</div>
                )}
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
                      {holidayInfo.isHoliday ? `${holidayInfo.reason || 'Holiday'}. No slots available.` : 'No available slots for this date'}
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
                    {isPaying ? 'Processing Payment...' : 'Booking Appointment...'}
                  </div>
                ) : (
                  service && service.serviceCharge > 0 ? `Pay ₹${service.serviceCharge} & Book` : 'Book Appointment'
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