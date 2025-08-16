import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import axios from 'axios'
import { 
  Calendar, 
  FileText, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  User,
  Phone,
  Mail,
  MapPin,
  Loader2
} from 'lucide-react'

const Dashboard = () => {
  const { user } = useAuth()
  const [appointments, setAppointments] = useState([])
  const [stats, setStats] = useState({
    completed: 0,
    inProgress: 0,
    upcoming: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    // Only fetch data if user is logged in
    if (user) {
      const fetchUserData = async () => {
        try {
          setLoading(true)
          
          // Fetch user appointments
          const appointmentsResponse = await axios.get('/appointments')
          
          if (appointmentsResponse.data.success) {
            const userAppointments = appointmentsResponse.data.data
            setAppointments(userAppointments)
            
            // Update stats based on real data
            setStats({
              completed: userAppointments.filter(app => app.status === 'completed').length,
              inProgress: userAppointments.filter(app => app.status === 'confirmed').length,
              upcoming: userAppointments.filter(app => app.status === 'pending').length
            })
          } else {
            setError('Failed to load your dashboard data.')
          }
          
          setLoading(false)
        } catch (err) {
          console.error('Error fetching dashboard data:', err)
          setError('Failed to load your dashboard data. Please try again later.')
          setLoading(false)
        }
      }
      
      fetchUserData()
    } else {
      setLoading(false)
    }
  }, [user])

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
          <p className="text-lg text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md p-6 bg-white rounded-lg shadow">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Something went wrong</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {user?.name}!
          </h1>
          <p className="text-lg text-gray-600">
            Here's an overview of your government service applications and appointments
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="card p-6">
                <div className="flex items-center">
                  <div className="bg-green-100 p-3 rounded-lg">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-2xl font-bold text-gray-900">{stats.completed}</p>
                    <p className="text-gray-600">Completed Applications</p>
                  </div>
                </div>
              </div>

              <div className="card p-6">
                <div className="flex items-center">
                  <div className="bg-yellow-100 p-3 rounded-lg">
                    <Clock className="w-6 h-6 text-yellow-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-2xl font-bold text-gray-900">{stats.inProgress}</p>
                    <p className="text-gray-600">In Progress</p>
                  </div>
                </div>
              </div>

              <div className="card p-6">
                <div className="flex items-center">
                  <div className="bg-blue-100 p-3 rounded-lg">
                    <Calendar className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-2xl font-bold text-gray-900">{stats.upcoming}</p>
                    <p className="text-gray-600">Upcoming Appointments</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Appointments (renamed from Applications) */}
            <div className="card p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Recent Appointments</h2>
                <Link
                  to="/services"
                  className="text-primary hover:text-blue-700 font-medium"
                >
                  Book New Appointment
                </Link>
              </div>

              {appointments.length > 0 ? (
                <div className="space-y-4">
                  {appointments.slice(0, 3).map((appointment) => (
                    <div
                      key={appointment._id}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center space-x-4">
                        <FileText className="w-5 h-5 text-gray-400" />
                        <div>
                          <h3 className="font-semibold text-gray-900">{appointment.service?.name}</h3>
                          <p className="text-sm text-gray-600">
                            {new Date(appointment.appointmentDate).toLocaleDateString()} at {appointment.timeSlot}
                          </p>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        appointment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        appointment.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                        appointment.status === 'completed' ? 'bg-green-100 text-green-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {appointment.status}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <h3 className="text-lg font-medium text-gray-900 mb-1">No appointments yet</h3>
                  <p className="text-gray-500 mb-4">You haven't booked any appointments yet</p>
                  <Link
                    to="/services"
                    className="inline-block px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Browse Available Services
                  </Link>
                </div>
              )}
            </div>

            {/* All Appointments */}
            <div className="card p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">All Appointments</h2>
                <Link
                  to="/services"
                  className="text-primary hover:text-blue-700 font-medium"
                >
                  Book New
                </Link>
              </div>

              {appointments.length > 0 ? (
                <div className="space-y-4">
                  {appointments.map((appointment) => (
                    <div
                      key={appointment._id}
                      className="p-4 border border-gray-200 rounded-lg"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-gray-900">{appointment.service?.name}</h3>
                        <span className={`text-sm px-2 py-1 rounded ${
                          appointment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          appointment.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                          appointment.status === 'completed' ? 'bg-green-100 text-green-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {appointment.status}
                        </span>
                      </div>
                      <div className="space-y-1 text-sm text-gray-600">
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4" />
                          <span>{new Date(appointment.appointmentDate).toLocaleDateString()} at {appointment.timeSlot}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <MapPin className="w-4 h-4" />
                          <span>Akshaya Service Center</span>
                        </div>
                        {appointment.notes && (
                          <div className="flex items-start space-x-2">
                            <FileText className="w-4 h-4 mt-0.5" />
                            <span>{appointment.notes}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <h3 className="text-lg font-medium text-gray-900 mb-1">No appointments yet</h3>
                  <p className="text-gray-500 mb-4">You don't have any scheduled appointments</p>
                  <Link
                    to="/services"
                    className="inline-block px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Book an Appointment
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Profile Card */}
            <div className="card p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Profile Information</h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <User className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-700">{user?.name}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Mail className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-700">{user?.email}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Phone className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-700">{user?.phone}</span>
                </div>
              </div>
              <button className="w-full mt-4 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                Edit Profile
              </button>
            </div>

            {/* Quick Actions */}
            <div className="card p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <Link
                  to="/services"
                  className="block w-full px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-700 transition-colors text-center"
                >
                  Apply for Service
                </Link>
                <Link
                  to="/appointments"
                  className="block w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-center"
                >
                  Book Appointment
                </Link>
                <Link
                  to="/news"
                  className="block w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-center"
                >
                  Read Latest News
                </Link>
              </div>
            </div>

            {/* Important Notice */}
            <div className="card p-6 bg-yellow-50 border-yellow-200">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-yellow-900 mb-2">Important Notice</h3>
                  <p className="text-sm text-yellow-800">
                    New digital certificate service is now available. Update your documents 
                    for faster processing.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard