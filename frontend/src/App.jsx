import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import LandingPage from './pages/LandingPage'
import Login from './pages/Login'
import Register from './pages/Register'
import Services from './pages/Services'
import ServiceDetails from './pages/ServiceDetails'
import ServiceApplication from './pages/ServiceApplication'
import Appointments from './pages/Appointments'
import News from './pages/News'
import NewsDetail from './pages/NewsDetail'
import Dashboard from './pages/Dashboard'
import Profile from './pages/Profile'
import ProtectedRoute from './components/ProtectedRoute'
import AdminProtectedRoute from './components/AdminProtectedRoute'
import AdminLayout from './components/AdminLayout'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminUsers from './pages/admin/AdminUsers'
import AdminServices from './pages/admin/AdminServices'
import AdminNews from './pages/admin/AdminNews'
import AdminAppointments from './pages/admin/AdminAppointments'
import AdminSettings from './pages/admin/AdminSettings'
import AdminCenters from './pages/admin/AdminCenters'
import CenterFinder from './pages/CenterFinder'
import BookAppointment from './pages/BookAppointment'
import StaffDashboard from './pages/staff/StaffDashboard'
import StaffAppointments from './pages/staff/StaffAppointments'
import AppointmentDetails from './pages/staff/AppointmentDetails'
import StaffServices from './pages/staff/StaffServices'
import StaffAnalytics from './pages/staff/StaffAnalytics'
import StaffProfile from './pages/staff/StaffProfile'
import StaffSettings from './pages/staff/StaffSettings'
import StaffLayout from './components/StaffLayout'

function App() {
  return (
    <AuthProvider>
      <Router future={{ v7_relativeSplatPath: true }}>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={
            <div className="min-h-screen bg-gray-50">
              <Navbar showPublic={true} />
              <LandingPage />
              <Footer />
            </div>
          } />
          <Route path="/login" element={
            <div className="min-h-screen bg-gray-50">
              <Login />
            </div>
          } />
          <Route path="/register" element={
            <div className="min-h-screen bg-gray-50">
              <Register />
            </div>
          } />

          {/* User Protected Routes */}
          <Route path="/services" element={
            <ProtectedRoute>
              <div className="min-h-screen bg-gray-50">
                <Navbar />
                <Services />
                <Footer />
              </div>
            </ProtectedRoute>
          } />
          <Route path="/service/:id" element={
            <ProtectedRoute>
              <div className="min-h-screen bg-gray-50">
                <Navbar />
                <ServiceDetails />
                <Footer />
              </div>
            </ProtectedRoute>
          } />
          <Route path="/service/:id/apply" element={
            <ProtectedRoute>
              <div className="min-h-screen bg-gray-50">
                <Navbar />
                <ServiceApplication />
                <Footer />
              </div>
            </ProtectedRoute>
          } />
          <Route path="/book-appointment" element={
            <ProtectedRoute>
              <div className="min-h-screen bg-gray-50">
                <Navbar />
                <BookAppointment />
                <Footer />
              </div>
            </ProtectedRoute>
          } />
          <Route path="/appointments" element={
            <ProtectedRoute>
              <div className="min-h-screen bg-gray-50">
                <Navbar />
                <Appointments />
                <Footer />
              </div>
            </ProtectedRoute>
          } />
          <Route path="/appointments/book" element={
            <ProtectedRoute>
              <div className="min-h-screen bg-gray-50">
                <Navbar />
                <BookAppointment />
                <Footer />
              </div>
            </ProtectedRoute>
          } />
          <Route path="/news" element={
            <ProtectedRoute>
              <div className="min-h-screen bg-gray-50">
                <Navbar />
                <News />
                <Footer />
              </div>
            </ProtectedRoute>
          } />
          <Route path="/news/:id" element={
            <ProtectedRoute>
              <div className="min-h-screen bg-gray-50">
                <Navbar />
                <NewsDetail />
                <Footer />
              </div>
            </ProtectedRoute>
          } />
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <div className="min-h-screen bg-gray-50">
                <Navbar />
                <Dashboard />
                <Footer />
              </div>
            </ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute>
              <div className="min-h-screen bg-gray-50">
                <Navbar />
                <Profile />
                <Footer />
              </div>
            </ProtectedRoute>
          } />
          <Route path="/centers" element={
            <ProtectedRoute>
              <div className="min-h-screen bg-gray-50">
                <Navbar />
                <CenterFinder />
                <Footer />
              </div>
            </ProtectedRoute>
          } />

          {/* Admin Protected Routes */}
          <Route path="/admin/dashboard" element={
            <AdminProtectedRoute>
              <AdminLayout>
                <AdminDashboard />
              </AdminLayout>
            </AdminProtectedRoute>
          } />
          <Route path="/admin/users" element={
            <AdminProtectedRoute>
              <AdminLayout>
                <AdminUsers />
              </AdminLayout>
            </AdminProtectedRoute>
          } />
          <Route path="/admin/services" element={
            <AdminProtectedRoute>
              <AdminLayout>
                <AdminServices />
              </AdminLayout>
            </AdminProtectedRoute>
          } />
          <Route path="/admin/news" element={
            <AdminProtectedRoute>
              <AdminLayout>
                <AdminNews />
              </AdminLayout>
            </AdminProtectedRoute>
          } />
          <Route path="/admin/appointments" element={
            <AdminProtectedRoute>
              <AdminLayout>
                <AdminAppointments />
              </AdminLayout>
            </AdminProtectedRoute>
          } />
          <Route path="/admin/settings" element={
            <AdminProtectedRoute>
              <AdminLayout>
                <AdminSettings />
              </AdminLayout>
            </AdminProtectedRoute>
          } />
          <Route path="/admin/centers" element={
            <AdminProtectedRoute>
              <AdminLayout>
                <AdminCenters />
              </AdminLayout>
            </AdminProtectedRoute>
          } />

          {/* Staff Routes */}
          <Route path="/staff/dashboard" element={
            <ProtectedRoute>
              <StaffLayout>
                <StaffDashboard />
              </StaffLayout>
            </ProtectedRoute>
          } />
          <Route path="/staff/appointments" element={
            <ProtectedRoute>
              <StaffLayout>
                <StaffAppointments />
              </StaffLayout>
            </ProtectedRoute>
          } />
          <Route path="/staff/appointments/:appointmentId" element={
            <ProtectedRoute>
              <StaffLayout>
                <AppointmentDetails />
              </StaffLayout>
            </ProtectedRoute>
          } />
          <Route path="/staff/services" element={
            <ProtectedRoute>
              <StaffLayout>
                <StaffServices />
              </StaffLayout>
            </ProtectedRoute>
          } />
          <Route path="/staff/analytics" element={
            <ProtectedRoute>
              <StaffLayout>
                <StaffAnalytics />
              </StaffLayout>
            </ProtectedRoute>
          } />
          <Route path="/staff/profile" element={
            <ProtectedRoute>
              <StaffLayout>
                <StaffProfile />
              </StaffLayout>
            </ProtectedRoute>
          } />
          <Route path="/staff/settings" element={
            <ProtectedRoute>
              <StaffLayout>
                <StaffSettings />
              </StaffLayout>
            </ProtectedRoute>
          } />
        </Routes>
      </Router>
    </AuthProvider>
  )
}

export default App