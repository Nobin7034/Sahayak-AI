import React, { useState, useEffect } from 'react'
import { Save, RefreshCw, AlertCircle, CheckCircle, Settings as SettingsIcon, Database, Globe, Calendar, Zap } from 'lucide-react'
import axios from 'axios'

const AdminSettings = () => {
  const [settings, setSettings] = useState({
    // General Settings
    siteName: '',
    siteDescription: '',
    contactEmail: '',
    contactPhone: '',
    officeHours: '',
    address: '',
    
    // Appointment Settings
    maxAppointmentsPerDay: 50,
    appointmentAdvanceDays: 3,
    appointmentSlotDuration: 30,
    workingHours: { start: '09:00', end: '17:00' },
    workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
    
    // System Settings
    maintenanceMode: false,
    maintenanceMessage: '',
    allowUserRegistration: true,
    requireEmailVerification: false,
    allowGoogleSignIn: true,
    
    // Feature Flags
    enableCenterRatings: true,
    enableAppointmentRescheduling: true,
    enableDocumentUpload: true,
    enableChatSupport: false,
    
    // Content Settings
    welcomeMessage: '',
    footerText: '',
    privacyPolicyUrl: '',
    termsOfServiceUrl: ''
  })
  
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })
  const [holidays, setHolidays] = useState([])
  const [newHoliday, setNewHoliday] = useState({ date: '', reason: '' })
  const [activeTab, setActiveTab] = useState('general')

  useEffect(() => {
    fetchSettings()
    fetchHolidays()
  }, [])

  const fetchSettings = async () => {
    try {
      setLoading(true)
      const response = await axios.get('/api/admin/settings')
      if (response.data.success) {
        setSettings(response.data.data)
      }
    } catch (error) {
      console.error('Fetch settings error:', error)
      setMessage({ type: 'error', text: 'Failed to load settings' })
    } finally {
      setLoading(false)
    }
  }

  const fetchHolidays = async () => {
    try {
      const token = localStorage.getItem('token')
      const config = { headers: { 'Authorization': `Bearer ${token}` } }
      const today = new Date()
      const month = String(today.getMonth() + 1)
      const year = String(today.getFullYear())
      const res = await axios.get(`/api/admin/holidays?month=${month}&year=${year}`, config)
      if (res.data?.success) setHolidays(res.data.data)
    } catch (e) {}
  }

  const handleAddHoliday = async (e) => {
    e.preventDefault()
    if (!newHoliday.date) {
      setMessage({ type: 'error', text: 'Please select a date for the holiday' })
      return
    }
    
    try {
      const token = localStorage.getItem('token')
      const config = { headers: { 'Authorization': `Bearer ${token}` } }
      const res = await axios.post('/api/admin/holidays', newHoliday, config)
      if (res.data?.success) {
        setNewHoliday({ date: '', reason: '' })
        await fetchHolidays()
        setMessage({ type: 'success', text: 'Holiday added successfully' })
      } else {
        setMessage({ type: 'error', text: 'Failed to add holiday' })
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to add holiday' })
    }
  }

  const handleDeleteHoliday = async (id) => {
    try {
      const token = localStorage.getItem('token')
      const config = { headers: { 'Authorization': `Bearer ${token}` } }
      await axios.delete(`/api/admin/holidays/${id}`, config)
      await fetchHolidays()
    } catch (err) {
      alert('Failed to delete holiday')
    }
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      setSaving(true)
      setMessage({ type: '', text: '' })
      
      const response = await axios.put('/api/admin/settings', settings)
      
      if (response.data.success) {
        setMessage({ type: 'success', text: 'Settings saved successfully! Changes are now live.' })
        
        // If maintenance mode was toggled, show additional message
        if (settings.maintenanceMode) {
          setTimeout(() => {
            setMessage({ type: 'warning', text: 'Maintenance mode is now ACTIVE. Public users cannot access the site.' })
          }, 2000)
        }
      } else {
        setMessage({ type: 'error', text: response.data.message || 'Failed to save settings' })
      }
    } catch (error) {
      console.error('Save settings error:', error)
      setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to save settings' })
    } finally {
      setSaving(false)
    }
  }

  const resetToDefaults = () => {
    setSettings({
      siteName: 'Akshaya Services',
      siteDescription: 'Kerala Government Services Portal',
      contactEmail: 'admin@akshaya.gov.in',
      contactPhone: '+91-471-1234567',
      officeHours: '9:00 AM - 5:00 PM',
      address: 'Akshaya Service Center, Thiruvananthapuram, Kerala',
      maxAppointmentsPerDay: 50,
      appointmentAdvanceDays: 30,
      appointmentSlotDuration: 30,
      workingHours: { start: '09:00', end: '17:00' },
      workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
      maintenanceMode: false,
      maintenanceMessage: '',
      allowUserRegistration: true,
      requireEmailVerification: false,
      allowGoogleSignIn: true,
      enableCenterRatings: true,
      enableAppointmentRescheduling: true,
      enableDocumentUpload: true,
      enableChatSupport: false,
      welcomeMessage: '',
      footerText: '',
      privacyPolicyUrl: '',
      termsOfServiceUrl: ''
    })
    setMessage({ type: 'info', text: 'Settings reset to defaults' })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-primary animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading settings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <SettingsIcon className="w-8 h-8 mr-3 text-primary" />
            Admin Settings
          </h1>
          <p className="text-gray-600 mt-2">Manage system configuration and preferences</p>
        </div>

        {/* Message Display */}
        {message.text && (
          <div className={`mb-6 p-4 rounded-lg border ${
            message.type === 'success' 
              ? 'bg-green-50 border-green-200 text-green-800' 
              : message.type === 'error'
              ? 'bg-red-50 border-red-200 text-red-800'
              : 'bg-blue-50 border-blue-200 text-blue-800'
          }`}>
            <div className="flex items-center gap-2">
              {message.type === 'success' ? (
                <CheckCircle className="w-5 h-5" />
              ) : message.type === 'error' ? (
                <AlertCircle className="w-5 h-5" />
              ) : (
                <RefreshCw className="w-5 h-5" />
              )}
              <span className="text-sm">{message.text}</span>
            </div>
          </div>
        )}

        <div className="mb-8">
          {/* Tab Navigation */}
          <div className="border-b border-gray-200 mb-6">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: 'general', name: 'General', icon: Globe },
                { id: 'appointments', name: 'Appointments', icon: Calendar },
                { id: 'system', name: 'System', icon: Database },
                { id: 'features', name: 'Features', icon: Zap }
              ].map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                      activeTab === tab.id
                        ? 'border-primary text-primary'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.name}</span>
                  </button>
                )
              })}
            </nav>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* General Settings Tab */}
          {activeTab === 'general' && (
            <div className="card p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                <Globe className="w-5 h-5 mr-2 text-primary" />
                General Settings
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Site Name *
                  </label>
                  <input
                    type="text"
                    name="siteName"
                    value={settings.siteName}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary focus:border-primary"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contact Email *
                  </label>
                  <input
                    type="email"
                    name="contactEmail"
                    value={settings.contactEmail}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary focus:border-primary"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contact Phone *
                  </label>
                  <input
                    type="tel"
                    name="contactPhone"
                    value={settings.contactPhone}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary focus:border-primary"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Office Hours
                  </label>
                  <input
                    type="text"
                    name="officeHours"
                    value={settings.officeHours}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary focus:border-primary"
                    placeholder="e.g., 9:00 AM - 5:00 PM"
                  />
                </div>
              </div>
              
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Site Description
                </label>
                <textarea
                  name="siteDescription"
                  value={settings.siteDescription}
                  onChange={handleChange}
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary focus:border-primary"
                  placeholder="Brief description of your service portal"
                />
              </div>
              
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address
                </label>
                <textarea
                  name="address"
                  value={settings.address}
                  onChange={handleChange}
                  rows={2}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary focus:border-primary"
                  placeholder="Physical address of your main office"
                />
              </div>
            </div>
          )}

          {/* Appointment Settings Tab */}
          {activeTab === 'appointments' && (
            <div className="card p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                <Calendar className="w-5 h-5 mr-2 text-primary" />
                Appointment Settings
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max Appointments Per Day
                  </label>
                  <input
                    type="number"
                    name="maxAppointmentsPerDay"
                    value={settings.maxAppointmentsPerDay}
                    onChange={handleChange}
                    min="1"
                    max="1000"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary focus:border-primary"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Appointment Advance Days
                  </label>
                  <input
                    type="number"
                    name="appointmentAdvanceDays"
                    value={settings.appointmentAdvanceDays}
                    onChange={handleChange}
                    min="1"
                    max="90"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary focus:border-primary"
                  />
                  <p className="text-xs text-gray-500 mt-1">How many days in advance users can book</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Slot Duration (minutes)
                  </label>
                  <select
                    name="appointmentSlotDuration"
                    value={settings.appointmentSlotDuration}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary focus:border-primary"
                  >
                    <option value={15}>15 minutes</option>
                    <option value={30}>30 minutes</option>
                    <option value={45}>45 minutes</option>
                    <option value={60}>1 hour</option>
                    <option value={90}>1.5 hours</option>
                    <option value={120}>2 hours</option>
                  </select>
                </div>
              </div>
              
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Working Hours
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Start Time</label>
                    <input
                      type="time"
                      value={settings.workingHours?.start || '09:00'}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        workingHours: { ...prev.workingHours, start: e.target.value }
                      }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">End Time</label>
                    <input
                      type="time"
                      value={settings.workingHours?.end || '17:00'}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        workingHours: { ...prev.workingHours, end: e.target.value }
                      }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary focus:border-primary"
                    />
                  </div>
                </div>
              </div>
              
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Working Days
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(day => (
                    <label key={day} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={settings.workingDays?.includes(day)}
                        onChange={(e) => {
                          const days = settings.workingDays || []
                          if (e.target.checked) {
                            setSettings(prev => ({
                              ...prev,
                              workingDays: [...days, day]
                            }))
                          } else {
                            setSettings(prev => ({
                              ...prev,
                              workingDays: days.filter(d => d !== day)
                            }))
                          }
                        }}
                        className="rounded border-gray-300 text-primary focus:ring-primary"
                      />
                      <span className="text-sm capitalize">{day.slice(0, 3)}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* System Settings Tab */}
          {activeTab === 'system' && (
            <div className="card p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                <Database className="w-5 h-5 mr-2 text-primary" />
                System Settings
              </h2>
              
              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 border border-red-200 rounded-lg bg-red-50">
                  <div>
                    <h3 className="text-sm font-medium text-red-900">Maintenance Mode</h3>
                    <p className="text-sm text-red-700">Temporarily disable public access to the site</p>
                    {settings.maintenanceMode && (
                      <p className="text-xs text-red-600 mt-1 font-medium">⚠️ ACTIVE - Public users cannot access the site</p>
                    )}
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      name="maintenanceMode"
                      checked={settings.maintenanceMode}
                      onChange={handleChange}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                  </label>
                </div>
                
                {settings.maintenanceMode && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Maintenance Message
                    </label>
                    <textarea
                      name="maintenanceMessage"
                      value={settings.maintenanceMessage}
                      onChange={handleChange}
                      rows={3}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary focus:border-primary"
                      placeholder="Message to show users during maintenance"
                    />
                  </div>
                )}
                
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">Allow User Registration</h3>
                    <p className="text-sm text-gray-500">Allow new users to register accounts</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      name="allowUserRegistration"
                      checked={settings.allowUserRegistration}
                      onChange={handleChange}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">Google Sign-In</h3>
                    <p className="text-sm text-gray-500">Allow users to sign in with Google</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      name="allowGoogleSignIn"
                      checked={settings.allowGoogleSignIn}
                      onChange={handleChange}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">Require Email Verification</h3>
                    <p className="text-sm text-gray-500">Require users to verify their email before accessing the system</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      name="requireEmailVerification"
                      checked={settings.requireEmailVerification}
                      onChange={handleChange}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Add more tabs here... */}
          {activeTab === 'features' && (
            <div className="card p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                <Zap className="w-5 h-5 mr-2 text-primary" />
                Feature Flags
              </h2>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">Center Ratings</h3>
                    <p className="text-sm text-gray-500">Allow users to rate and review service centers</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      name="enableCenterRatings"
                      checked={settings.enableCenterRatings}
                      onChange={handleChange}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">Appointment Rescheduling</h3>
                    <p className="text-sm text-gray-500">Allow users to reschedule their appointments</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      name="enableAppointmentRescheduling"
                      checked={settings.enableAppointmentRescheduling}
                      onChange={handleChange}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">Document Upload</h3>
                    <p className="text-sm text-gray-500">Allow users to upload documents for their applications</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      name="enableDocumentUpload"
                      checked={settings.enableDocumentUpload}
                      onChange={handleChange}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">Chat Support</h3>
                    <p className="text-sm text-gray-500">Enable live chat support for users</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      name="enableChatSupport"
                      checked={settings.enableChatSupport}
                      onChange={handleChange}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>
              </div>

              {/* Holiday Management Section within Features */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Calendar className="w-5 h-5 mr-2 text-primary" />
                  Holiday Management
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                    <input 
                      type="date" 
                      value={newHoliday.date} 
                      onChange={e => setNewHoliday(prev => ({ ...prev, date: e.target.value }))} 
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary focus:border-primary" 
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
                    <input 
                      type="text" 
                      value={newHoliday.reason} 
                      onChange={e => setNewHoliday(prev => ({ ...prev, reason: e.target.value }))} 
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary focus:border-primary" 
                      placeholder="e.g., Public Holiday" 
                    />
                  </div>
                  <div className="md:col-span-3">
                    <button 
                      type="button" 
                      onClick={(e) => {
                        e.preventDefault();
                        handleAddHoliday(e);
                      }}
                      className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Add Holiday
                    </button>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-3">This Month's Holidays</h4>
                  <div className="space-y-2">
                    {holidays.length === 0 && <div className="text-sm text-gray-500">No holidays added for this month.</div>}
                    {holidays.map(h => (
                      <div key={h._id} className="flex items-center justify-between p-3 border rounded-lg bg-gray-50">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{new Date(h.date).toLocaleDateString()}</div>
                          <div className="text-xs text-gray-600">{h.reason || 'Holiday'}</div>
                        </div>
                        <button 
                          type="button" 
                          onClick={() => handleDeleteHoliday(h._id)} 
                          className="text-red-600 hover:text-red-700 text-sm px-2 py-1 rounded hover:bg-red-50"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <button
                type="button"
                onClick={resetToDefaults}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors flex items-center"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Reset to Defaults
              </button>
              
              {settings.maintenanceMode && (
                <div className="flex items-center space-x-2 text-red-600 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  <span className="font-medium">Maintenance Mode Active</span>
                </div>
              )}
            </div>
            
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center"
            >
              {saving ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AdminSettings
