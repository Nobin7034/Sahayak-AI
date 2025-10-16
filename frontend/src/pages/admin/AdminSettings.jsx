import React, { useState, useEffect } from 'react'
import { Save, RefreshCw, AlertCircle, CheckCircle, Settings as SettingsIcon, Database, Shield, Bell, Globe, Calendar } from 'lucide-react'
import axios from 'axios'

const AdminSettings = () => {
  const [settings, setSettings] = useState({
    siteName: 'Akshaya Services',
    siteDescription: 'Kerala Government Services Portal',
    contactEmail: 'admin@akshaya.gov.in',
    contactPhone: '+91-471-1234567',
    officeHours: '9:00 AM - 5:00 PM',
    address: 'Akshaya Service Center, Thiruvananthapuram, Kerala',
    maxAppointmentsPerDay: 50,
    appointmentAdvanceDays: 30,
    maintenanceMode: false,
    allowUserRegistration: true,
    requireEmailVerification: false
  })
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })
  const [holidays, setHolidays] = useState([])
  const [newHoliday, setNewHoliday] = useState({ date: '', reason: '' })

  useEffect(() => {
    fetchSettings()
    fetchHolidays()
  }, [])

  const fetchSettings = async () => {
    try {
      setLoading(true)
      // In a real app, you'd fetch from /admin/settings
      // For now, we'll use the default settings
      setLoading(false)
    } catch (error) {
      console.error('Fetch settings error:', error)
      setMessage({ type: 'error', text: 'Failed to load settings' })
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
      const res = await axios.get(`/admin/holidays?month=${month}&year=${year}`, config)
      if (res.data?.success) setHolidays(res.data.data)
    } catch (e) {}
  }

  const handleAddHoliday = async (e) => {
    e.preventDefault()
    try {
      const token = localStorage.getItem('token')
      const config = { headers: { 'Authorization': `Bearer ${token}` } }
      const res = await axios.post('/admin/holidays', newHoliday, config)
      if (res.data?.success) {
        setNewHoliday({ date: '', reason: '' })
        await fetchHolidays()
      } else {
        alert('Failed to add holiday')
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add holiday')
    }
  }

  const handleDeleteHoliday = async (id) => {
    try {
      const token = localStorage.getItem('token')
      const config = { headers: { 'Authorization': `Bearer ${token}` } }
      await axios.delete(`/admin/holidays/${id}`, config)
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
      
      // In a real app, you'd save to /admin/settings
      // For now, we'll simulate a save
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setMessage({ type: 'success', text: 'Settings saved successfully!' })
    } catch (error) {
      console.error('Save settings error:', error)
      setMessage({ type: 'error', text: 'Failed to save settings' })
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
      maintenanceMode: false,
      allowUserRegistration: true,
      requireEmailVerification: false
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

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* General Settings */}
          <div className="card p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
              <Globe className="w-5 h-5 mr-2 text-primary" />
              General Settings
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Site Name
                </label>
                <input
                  type="text"
                  name="siteName"
                  value={settings.siteName}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary focus:border-primary"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contact Email
                </label>
                <input
                  type="email"
                  name="contactEmail"
                  value={settings.contactEmail}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary focus:border-primary"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contact Phone
                </label>
                <input
                  type="tel"
                  name="contactPhone"
                  value={settings.contactPhone}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary focus:border-primary"
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
              />
            </div>
          </div>

          {/* Appointment Settings */}
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
                  max="100"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary focus:border-primary"
                />
              </div>

        {/* Holidays Management */}
        <div className="card p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
            <Calendar className="w-5 h-5 mr-2 text-primary" />
            Holidays Management
          </h2>

          <form onSubmit={handleAddHoliday} className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input type="date" value={newHoliday.date} onChange={e => setNewHoliday(prev => ({ ...prev, date: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2" required />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
              <input type="text" value={newHoliday.reason} onChange={e => setNewHoliday(prev => ({ ...prev, reason: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2" placeholder="e.g., Public Holiday" />
            </div>
            <div className="md:col-span-3">
              <button type="submit" className="btn-primary">Add Holiday</button>
            </div>
          </form>

          <div>
            <h3 className="font-semibold text-gray-900 mb-3">This Month</h3>
            <div className="space-y-2">
              {holidays.length === 0 && <div className="text-sm text-gray-500">No holidays added for this month.</div>}
              {holidays.map(h => (
                <div key={h._id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{new Date(h.date).toLocaleDateString()}</div>
                    <div className="text-xs text-gray-600">{h.reason || 'Holiday'}</div>
                  </div>
                  <button type="button" onClick={() => handleDeleteHoliday(h._id)} className="text-red-600 hover:text-red-700 text-sm">Remove</button>
                </div>
              ))}
            </div>
          </div>
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
              </div>
            </div>
          </div>

          {/* System Settings */}
          <div className="card p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
              <Database className="w-5 h-5 mr-2 text-primary" />
              System Settings
            </h2>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-900">Maintenance Mode</h3>
                  <p className="text-sm text-gray-500">Temporarily disable public access to the site</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    name="maintenanceMode"
                    checked={settings.maintenanceMode}
                    onChange={handleChange}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>
              
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

          {/* Action Buttons */}
          <div className="flex justify-between">
            <button
              type="button"
              onClick={resetToDefaults}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors flex items-center"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Reset to Defaults
            </button>
            
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
