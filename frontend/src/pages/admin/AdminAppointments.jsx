import React, { useState, useEffect } from 'react'
import { Search, Filter, Calendar, User, FileText, Clock, CheckCircle, XCircle, IndianRupee, BarChart3, Building, MapPin } from 'lucide-react'
import axios from 'axios'

const AdminAppointments = () => {
  const [appointments, setAppointments] = useState([])
  const [appointmentsByCenter, setAppointmentsByCenter] = useState({})
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [centerFilter, setCenterFilter] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [pagination, setPagination] = useState(null)
  const [viewMode, setViewMode] = useState('list') // 'list' or 'stats'

  const statusOptions = [
    { value: '', label: 'All Status' },
    { value: 'pending', label: 'Pending' },
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' }
  ]

  useEffect(() => {
    fetchAppointments()
    if (viewMode === 'stats') {
      fetchStats()
    }
  }, [currentPage, statusFilter, centerFilter, viewMode])

  const fetchAppointments = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10'
      })
      
      if (statusFilter) {
        params.append('status', statusFilter)
      }
      if (centerFilter) {
        params.append('center', centerFilter)
      }

      const response = await axios.get(`/api/admin/appointments?${params}`)
      if (response.data.success) {
        setAppointments(response.data.data.appointments)
        setAppointmentsByCenter(response.data.data.appointmentsByCenter || {})
        setPagination(response.data.data.pagination)
      } else {
        setError('Failed to fetch appointments')
      }
    } catch (error) {
      console.error('Fetch appointments error:', error)
      setError('Failed to fetch appointments')
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await axios.get('/api/admin/appointments/stats?period=month')
      if (response.data.success) {
        setStats(response.data.data)
      }
    } catch (error) {
      console.error('Fetch stats error:', error)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'confirmed': return 'bg-blue-100 text-blue-800'
      case 'in_progress': return 'bg-purple-100 text-purple-800'
      case 'completed': return 'bg-green-100 text-green-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />
      case 'confirmed': return <CheckCircle className="h-4 w-4" />
      case 'in_progress': return <Clock className="h-4 w-4" />
      case 'completed': return <CheckCircle className="h-4 w-4" />
      case 'cancelled': return <XCircle className="h-4 w-4" />
      default: return <Clock className="h-4 w-4" />
    }
  }

  const filteredAppointments = appointments.filter(appointment =>
    appointment.user?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    appointment.service?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    appointment.center?.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading && appointments.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading appointments...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Appointment Monitoring</h1>
        <p className="text-gray-600 mt-1">Monitor appointment activity across all centers (Read-Only)</p>
        <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-blue-700">
                <strong>Note:</strong> Appointment management is handled by individual center staff. 
                This dashboard provides read-only monitoring for system oversight.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* View Mode Toggle */}
      <div className="mb-6">
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
          <button
            onClick={() => setViewMode('list')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              viewMode === 'list' 
                ? 'bg-white text-gray-900 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Appointment List
          </button>
          <button
            onClick={() => setViewMode('stats')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              viewMode === 'stats' 
                ? 'bg-white text-gray-900 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Statistics
          </button>
        </div>
      </div>

      {viewMode === 'stats' && stats && (
        <div className="mb-8">
          {/* Statistics Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="card p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-blue-100">
                  <Calendar className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Appointments</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalAppointments}</p>
                </div>
              </div>
            </div>

            <div className="card p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-green-100">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Completed</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.statusStats.completed}</p>
                </div>
              </div>
            </div>

            <div className="card p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-yellow-100">
                  <Clock className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Pending</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.statusStats.pending}</p>
                </div>
              </div>
            </div>

            <div className="card p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-purple-100">
                  <Building className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active Centers</p>
                  <p className="text-2xl font-bold text-gray-900">{Object.keys(stats.centerStats).length}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Center Performance */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance by Center</h3>
              <div className="space-y-4">
                {Object.entries(stats.centerStats).map(([centerName, centerData]) => (
                  <div key={centerName} className="border-b border-gray-200 pb-4 last:border-b-0">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <Building className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="font-medium text-gray-900">{centerName}</span>
                      </div>
                      <span className="text-sm text-gray-500">{centerData.location}</span>
                    </div>
                    <div className="grid grid-cols-5 gap-2 text-xs">
                      <div className="text-center">
                        <div className="font-medium text-gray-900">{centerData.total}</div>
                        <div className="text-gray-500">Total</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium text-yellow-600">{centerData.pending}</div>
                        <div className="text-gray-500">Pending</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium text-blue-600">{centerData.confirmed}</div>
                        <div className="text-gray-500">Confirmed</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium text-green-600">{centerData.completed}</div>
                        <div className="text-gray-500">Completed</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium text-red-600">{centerData.cancelled}</div>
                        <div className="text-gray-500">Cancelled</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Popular Services</h3>
              <div className="space-y-3">
                {Object.entries(stats.serviceStats)
                  .sort(([,a], [,b]) => b - a)
                  .slice(0, 10)
                  .map(([serviceName, count]) => (
                    <div key={serviceName} className="flex items-center justify-between">
                      <span className="text-gray-900">{serviceName}</span>
                      <span className="text-sm font-medium text-gray-600">{count} appointments</span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {viewMode === 'list' && (
        <>
          {/* Search and Filters */}
          <div className="card p-4 mb-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Search by customer, service, or center..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
              >
                {statusOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          {/* Appointments by Center */}
          {Object.keys(appointmentsByCenter).length > 0 && (
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Appointments by Center</h2>
              <div className="space-y-6">
                {Object.entries(appointmentsByCenter).map(([centerName, centerAppointments]) => (
                  <div key={centerName} className="card p-6">
                    <div className="flex items-center mb-4">
                      <Building className="h-5 w-5 text-gray-400 mr-2" />
                      <h3 className="text-lg font-medium text-gray-900">{centerName}</h3>
                      <span className="ml-2 px-2 py-1 bg-gray-100 text-gray-600 text-sm rounded-full">
                        {centerAppointments.length} appointments
                      </span>
                    </div>
                    <div className="space-y-3">
                      {centerAppointments.slice(0, 3).map((appointment) => (
                        <div key={appointment._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-2">
                              <User className="h-4 w-4 text-gray-400" />
                              <span className="font-medium text-gray-900">{appointment.user?.name}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <FileText className="h-4 w-4 text-gray-400" />
                              <span className="text-gray-600">{appointment.service?.name}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Calendar className="h-4 w-4 text-gray-400" />
                              <span className="text-gray-600">
                                {new Date(appointment.appointmentDate).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {getStatusIcon(appointment.status)}
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
                              {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                            </span>
                          </div>
                        </div>
                      ))}
                      {centerAppointments.length > 3 && (
                        <div className="text-center text-gray-500 text-sm">
                          ... and {centerAppointments.length - 3} more appointments
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* All Appointments List */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">All Appointments</h2>
            {filteredAppointments.map((appointment) => (
              <div key={appointment._id} className="card p-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4 mb-3">
                      <div className="flex items-center space-x-2">
                        <User className="h-5 w-5 text-gray-400" />
                        <span className="font-medium text-gray-900">{appointment.user?.name}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <FileText className="h-5 w-5 text-gray-400" />
                        <span className="text-gray-600">{appointment.service?.name}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Building className="h-5 w-5 text-gray-400" />
                        <span className="text-gray-600">{appointment.center?.name}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-5 w-5 text-gray-400" />
                        <span className="text-gray-600">
                          {new Date(appointment.appointmentDate).toLocaleDateString()} at {appointment.timeSlot}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span>Email: {appointment.user?.email}</span>
                      <span>Phone: {appointment.user?.phone || 'N/A'}</span>
                      <span>Fee: ₹{appointment.service?.fee || 0}</span>
                      {appointment.payment && (
                        <span className="flex items-center gap-1">
                          <IndianRupee className="h-4 w-4" />
                          Paid: ₹{appointment.payment.amount || 0} ({appointment.payment.status})
                        </span>
                      )}
                      <span>Booked: {new Date(appointment.createdAt).toLocaleDateString()}</span>
                    </div>

                    {appointment.center?.address && (
                      <div className="mt-2 flex items-center text-sm text-gray-500">
                        <MapPin className="h-4 w-4 mr-1" />
                        <span>{appointment.center.address.city}, {appointment.center.address.district}</span>
                      </div>
                    )}

                    {appointment.notes && (
                      <div className="mt-2 p-2 bg-gray-50 rounded text-sm text-gray-600">
                        <strong>Notes:</strong> {appointment.notes}
                      </div>
                    )}
                  </div>

                  <div className="mt-4 lg:mt-0 lg:ml-6 flex flex-col lg:items-end space-y-3">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(appointment.status)}
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(appointment.status)}`}>
                        {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500">
                      Managed by center staff
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredAppointments.length === 0 && !loading && (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No appointments found</p>
            </div>
          )}

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing page {pagination.currentPage} of {pagination.totalPages}
                {' '}({pagination.totalAppointments} total appointments)
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={!pagination.hasPrev}
                  className="px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={!pagination.hasNext}
                  className="px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default AdminAppointments