import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { 
  Users, 
  FileText, 
  Calendar, 
  Settings, 
  TrendingUp, 
  AlertCircle,
  CheckCircle,
  Clock,
  Eye
} from 'lucide-react'
import axios from 'axios'

const AdminDashboard = () => {
  const [stats, setStats] = useState(null)
  const [mostVisitedServices, setMostVisitedServices] = useState([])
  const [recentAppointments, setRecentAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const response = await axios.get('/admin/dashboard-stats')
      if (response.data.success) {
        setStats(response.data.data.stats)
        setMostVisitedServices(response.data.data.mostVisitedServices)
        setRecentAppointments(response.data.data.recentAppointments)
      } else {
        setError('Failed to fetch dashboard data')
      }
    } catch (error) {
      console.error('Dashboard data error:', error)
      setError('Failed to fetch dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'text-yellow-600 bg-yellow-100'
      case 'confirmed': return 'text-blue-600 bg-blue-100'
      case 'completed': return 'text-green-600 bg-green-100'
      case 'cancelled': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600">{error}</p>
          <button 
            onClick={fetchDashboardData}
            className="mt-4 btn-primary"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">Welcome to the Akshaya Services admin panel</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="card p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.totalUsers || 0}</p>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100">
                <FileText className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Services</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.totalServices || 0}</p>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-yellow-100">
                <Calendar className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Appointments</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.totalAppointments || 0}</p>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-red-100">
                <Clock className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending Appointments</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.pendingAppointments || 0}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Most Visited Services */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Most Visited Services</h2>
              <TrendingUp className="h-5 w-5 text-gray-400" />
            </div>
            <div className="space-y-4">
              {mostVisitedServices.map((service, index) => (
                <div key={service._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold">
                      {index + 1}
                    </div>
                    <div className="ml-3">
                      <p className="font-medium text-gray-900">{service.name}</p>
                      <p className="text-sm text-gray-600">{service.category}</p>
                    </div>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <Eye className="h-4 w-4 mr-1" />
                    <span className="text-sm font-medium">{service.visitCount}</span>
                  </div>
                </div>
              ))}
              {mostVisitedServices.length === 0 && (
                <p className="text-gray-500 text-center py-4">No services data available</p>
              )}
            </div>
          </div>

          {/* Recent Appointments */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Recent Appointments</h2>
              <Calendar className="h-5 w-5 text-gray-400" />
            </div>
            <div className="space-y-4">
              {recentAppointments.map((appointment) => (
                <div key={appointment._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{appointment.user?.name}</p>
                    <p className="text-sm text-gray-600">{appointment.service?.name}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(appointment.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="ml-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
                      {appointment.status}
                    </span>
                  </div>
                </div>
              ))}
              {recentAppointments.length === 0 && (
                <p className="text-gray-500 text-center py-4">No recent appointments</p>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link to="/admin/users" className="card p-6 text-center hover:shadow-lg transition-shadow">
              <Users className="h-8 w-8 text-blue-600 mx-auto mb-3" />
              <p className="font-medium text-gray-900">Manage Users</p>
              <p className="text-sm text-gray-600">View and manage user accounts</p>
            </Link>
            
            <Link to="/admin/services" className="card p-6 text-center hover:shadow-lg transition-shadow">
              <FileText className="h-8 w-8 text-green-600 mx-auto mb-3" />
              <p className="font-medium text-gray-900">Manage Services</p>
              <p className="text-sm text-gray-600">Add, edit, or remove services</p>
            </Link>
            
            <Link to="/admin/appointments" className="card p-6 text-center hover:shadow-lg transition-shadow">
              <Calendar className="h-8 w-8 text-yellow-600 mx-auto mb-3" />
              <p className="font-medium text-gray-900">Manage Appointments</p>
              <p className="text-sm text-gray-600">View and update appointments</p>
            </Link>
            
            <Link to="/admin/news" className="card p-6 text-center hover:shadow-lg transition-shadow">
              <Settings className="h-8 w-8 text-purple-600 mx-auto mb-3" />
              <p className="font-medium text-gray-900">Manage News</p>
              <p className="text-sm text-gray-600">Create and publish news</p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard