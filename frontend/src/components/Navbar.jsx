import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useLanguage } from '../contexts/LanguageContext'
import { Menu, X, User, LogOut, Bell, Languages, Lock } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import axios from 'axios'

const Navbar = ({ showPublic = false }) => {
  const { user, logout } = useAuth()
  const { language, toggleLanguage } = useLanguage()
  const navigate = useNavigate()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [isNotifOpen, setIsNotifOpen] = useState(false)
  const [unread, setUnread] = useState(0)
  const [notifs, setNotifs] = useState([])
  const userMenuRef = useRef(null)

  useEffect(() => {
    const load = async () => {
      if (!user) return
      try {
        const res = await axios.get('/api/notifications')
        if (res.data?.success) {
          setUnread(res.data.data.unreadCount || 0)
          setNotifs(res.data.data.items || [])
        }
      } catch (_) {}
    }
    load()
  }, [user])

  // Click outside handler for user menu
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false)
      }
    }

    if (isUserMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isUserMenuOpen])

  const toggleNotif = async () => {
    const next = !isNotifOpen
    setIsNotifOpen(next)
    if (next && unread > 0) {
      try {
        await axios.post('/api/notifications/mark-read')
        setUnread(0)
      } catch (_) {}
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/')
    setIsMenuOpen(false)
  }

  return (
    <nav className="bg-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">A</span>
              </div>
              <span className="text-xl font-bold text-gray-900">Akshaya Services</span>
            </Link>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-8">
            <Link to={!showPublic && user ? "/dashboard" : "/"} className="text-gray-700 hover:text-primary transition-colors">
              Home
            </Link>
            {!showPublic && user ? (
              <>
                <Link to="/services" className="text-gray-700 hover:text-primary transition-colors">
                  Services
                </Link>
                <Link to="/centers" className="text-gray-700 hover:text-primary transition-colors">
                  Find Centers
                </Link>
                <Link to="/appointments" className="text-gray-700 hover:text-primary transition-colors">
                  Appointments
                </Link>
                <Link to="/news" className="text-gray-700 hover:text-primary transition-colors">
                  News
                </Link>
                <Link 
                  to="/document-locker" 
                  className="text-gray-700 hover:text-primary transition-colors p-2 rounded-lg hover:bg-gray-50"
                  title="Document Locker"
                >
                  <Lock className="w-5 h-5" />
                </Link>
                {/* Notifications */}
                <div className="relative">
                  <button
                    onClick={toggleNotif}
                    className="relative text-gray-700 hover:text-primary transition-colors"
                    aria-label="Notifications"
                  >
                    <Bell className="w-5 h-5" />
                    {unread > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] leading-none rounded-full px-1.5 py-0.5">
                        {unread}
                      </span>
                    )}
                  </button>
                  {isNotifOpen && (
                    <div className="absolute right-0 mt-2 w-80 bg-white border rounded-lg shadow-lg z-50">
                      <div className="px-3 py-2 border-b font-medium text-gray-800">Notifications</div>
                      <div className="max-h-80 overflow-auto divide-y">
                        {notifs.length === 0 ? (
                          <div className="p-4 text-sm text-gray-500">No notifications</div>
                        ) : (
                          notifs.map((n, i) => (
                            <div key={i} className="p-3 text-sm">
                              <div className="font-semibold text-gray-900">{n.title}</div>
                              <div className="text-gray-700">{n.message}</div>
                              <div className="text-xs text-gray-400 mt-1">{new Date(n.createdAt).toLocaleString()}</div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Language Toggle Button */}
                <button
                  onClick={toggleLanguage}
                  className="flex items-center space-x-1 text-gray-700 hover:text-primary transition-colors px-2 py-1 rounded-md hover:bg-gray-50"
                  title={language === 'en' ? 'Switch to Malayalam' : 'മലയാളത്തിലേക്ക് മാറുക'}
                >
                  <Languages className="w-5 h-5" />
                  <span className="text-sm font-medium">{language === 'en' ? 'EN' : 'മല'}</span>
                </button>
                
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center space-x-2 text-gray-700 hover:text-primary transition-colors px-2 py-1 rounded-md hover:bg-gray-50"
                  >
                    <User className="w-4 h-4" />
                    <span className="text-sm">{user.name}</span>
                  </button>
                  {isUserMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white border rounded-lg shadow-lg py-2 z-50">
                      <Link
                        to="/profile"
                        className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        <User className="w-4 h-4" />
                        <span>Edit Profile</span>
                      </Link>
                      <button
                        onClick={() => { setIsUserMenuOpen(false); handleLogout() }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Logout</span>
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-4">
                <Link to="/login" className="text-gray-700 hover:text-primary transition-colors">
                  Login
                </Link>
                <Link to="/register" className="btn-primary">
                  Register
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-700 hover:text-primary transition-colors"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white border-t">
              <Link
                to={!showPublic && user ? "/dashboard" : "/"}
                className="block px-3 py-2 text-gray-700 hover:text-primary transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Home
              </Link>
              {!showPublic && user ? (
                <>
                  <Link
                    to="/services"
                    className="block px-3 py-2 text-gray-700 hover:text-primary transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Services
                  </Link>
                  <Link
                    to="/centers"
                    className="block px-3 py-2 text-gray-700 hover:text-primary transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Find Centers
                  </Link>
                  <Link
                    to="/appointments"
                    className="block px-3 py-2 text-gray-700 hover:text-primary transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Appointments
                  </Link>
                  <Link
                    to="/news"
                    className="block px-3 py-2 text-gray-700 hover:text-primary transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    News
                  </Link>
                  <Link
                    to="/document-locker"
                    className="flex items-center px-3 py-2 text-gray-700 hover:text-primary transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                    title="Document Locker"
                  >
                    <Lock className="w-4 h-4 mr-2" />
                    Document Locker
                  </Link>
                  <Link
                    to="/profile"
                    className="block px-3 py-2 text-gray-700 hover:text-primary transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Profile
                  </Link>
                  {/* Language Toggle */}
                  <button
                    onClick={() => { toggleLanguage(); setIsMenuOpen(false); }}
                    className="w-full flex items-center space-x-2 px-3 py-2 text-gray-700 hover:text-primary transition-colors"
                  >
                    <Languages className="w-4 h-4" />
                    <span>{language === 'en' ? 'English / മലയാളം' : 'മലയാളം / English'}</span>
                  </button>
                  <div className="px-3 py-2 border-t">
                    <div className="flex items-center space-x-2 mb-2">
                      <User className="w-4 h-4" />
                      <span className="text-sm text-gray-700">{user.name}</span>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="flex items-center space-x-1 text-red-600 hover:text-red-700 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Logout</span>
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="block px-3 py-2 text-gray-700 hover:text-primary transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="block px-3 py-2 text-primary font-semibold"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Register
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}

export default Navbar