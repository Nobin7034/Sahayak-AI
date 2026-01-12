import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Calendar,
  FileText,
  TrendingUp,
  Settings,
  LogOut,
  Menu,
  X,
  MapPin,
  User,
  Building
} from 'lucide-react';
import { StaffThemeProvider, useStaffTheme } from '../contexts/StaffThemeContext';
import ThemeToggleButton from './ThemeToggleButton';

const StaffLayoutContent = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [staffData, setStaffData] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { theme } = useStaffTheme();

  useEffect(() => {
    // Load staff data from localStorage
    const storedStaff = localStorage.getItem('staff');
    const storedUser = localStorage.getItem('user');
    
    if (storedStaff && storedUser) {
      setStaffData({
        ...JSON.parse(storedStaff),
        user: JSON.parse(storedUser)
      });
    }
  }, []);

  const navigation = [
    { name: 'Dashboard', href: '/staff/dashboard', icon: LayoutDashboard },
    { name: 'Appointments', href: '/staff/appointments', icon: Calendar },
    { name: 'Services', href: '/staff/services', icon: FileText },
    { name: 'Analytics', href: '/staff/analytics', icon: TrendingUp },
    { name: 'Profile', href: '/staff/profile', icon: Building },
    { name: 'Settings', href: '/staff/settings', icon: Settings },
  ];

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('staff');
    navigate('/login');
  };

  const isActive = (href) => {
    return location.pathname === href;
  };

  // Theme-based classes
  const themeClasses = {
    light: {
      background: 'bg-gradient-to-br from-gray-50 via-gray-100 to-gray-50',
      sidebar: 'bg-white border-gray-200',
      sidebarMobile: 'bg-white border-gray-200',
      overlay: 'bg-gray-900 bg-opacity-75',
      text: {
        primary: 'text-gray-900',
        secondary: 'text-gray-600',
        tertiary: 'text-gray-500'
      },
      nav: {
        active: 'bg-blue-600 text-white',
        inactive: 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
      },
      button: {
        mobile: 'text-gray-600 hover:text-gray-900 focus:ring-blue-500',
        logout: 'text-gray-500 hover:text-gray-700'
      },
      avatar: 'bg-gray-200',
      avatarText: 'text-gray-600'
    },
    dark: {
      background: 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900',
      sidebar: 'bg-slate-800 border-slate-700',
      sidebarMobile: 'bg-slate-800 border-slate-700',
      overlay: 'bg-slate-900 bg-opacity-75',
      text: {
        primary: 'text-white',
        secondary: 'text-slate-300',
        tertiary: 'text-slate-400'
      },
      nav: {
        active: 'bg-blue-600 text-white',
        inactive: 'text-slate-300 hover:bg-slate-700 hover:text-white'
      },
      button: {
        mobile: 'text-slate-400 hover:text-white focus:ring-blue-500',
        logout: 'text-slate-400 hover:text-white'
      },
      avatar: 'bg-slate-600',
      avatarText: 'text-slate-300'
    }
  };

  const currentTheme = themeClasses[theme];

  return (
    <div className={`min-h-screen ${currentTheme.background}`}>
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 flex z-40 md:hidden ${sidebarOpen ? '' : 'hidden'}`}>
        <div className={`fixed inset-0 ${currentTheme.overlay}`} onClick={() => setSidebarOpen(false)} />
        <div className={`relative flex-1 flex flex-col max-w-xs w-full ${currentTheme.sidebarMobile} border-r`}>
          <div className="absolute top-0 right-0 -mr-12 pt-2">
            <button
              className={`ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset ${currentTheme.button.mobile}`}
              onClick={() => setSidebarOpen(false)}
            >
              <X className={`h-6 w-6 ${currentTheme.text.primary}`} />
            </button>
          </div>
          
          {/* Mobile sidebar content */}
          <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
            <div className="flex-shrink-0 flex items-center px-4">
              <div className="h-8 w-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <MapPin className="h-5 w-5 text-white" />
              </div>
              <span className={`ml-2 text-lg font-semibold ${currentTheme.text.primary}`}>SAHAYAK AI</span>
            </div>
            
            <nav className="mt-5 px-2 space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`group flex items-center px-2 py-2 text-base font-medium rounded-md transition-colors ${
                      isActive(item.href)
                        ? currentTheme.nav.active
                        : currentTheme.nav.inactive
                    }`}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <Icon className="mr-4 h-6 w-6" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>
          
          {/* Mobile user info */}
          {staffData && (
            <div className={`flex-shrink-0 flex border-t ${theme === 'light' ? 'border-gray-200' : 'border-slate-700'} p-4`}>
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className={`h-10 w-10 ${currentTheme.avatar} rounded-full flex items-center justify-center`}>
                    <User className={`h-5 w-5 ${currentTheme.avatarText}`} />
                  </div>
                </div>
                <div className="ml-3">
                  <p className={`text-base font-medium ${currentTheme.text.primary}`}>{staffData.user.name}</p>
                  <p className={`text-sm font-medium ${currentTheme.text.tertiary}`}>{staffData.centerName}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
        <div className={`flex-1 flex flex-col min-h-0 border-r ${currentTheme.sidebar}`}>
          <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
            <div className="flex items-center flex-shrink-0 px-4">
              <div className="h-8 w-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <MapPin className="h-5 w-5 text-white" />
              </div>
              <span className={`ml-2 text-lg font-semibold ${currentTheme.text.primary}`}>SAHAYAK AI</span>
            </div>
            
            <nav className="mt-5 flex-1 px-2 space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${
                      isActive(item.href)
                        ? currentTheme.nav.active
                        : currentTheme.nav.inactive
                    }`}
                  >
                    <Icon className="mr-3 h-5 w-5" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>
          
          {/* Desktop user info */}
          {staffData && (
            <div className={`flex-shrink-0 flex border-t ${theme === 'light' ? 'border-gray-200' : 'border-slate-700'} p-4`}>
              <div className="flex items-center w-full">
                <div className="flex-shrink-0">
                  <div className={`h-9 w-9 ${currentTheme.avatar} rounded-full flex items-center justify-center`}>
                    <User className={`h-4 w-4 ${currentTheme.avatarText}`} />
                  </div>
                </div>
                <div className="ml-3 flex-1 min-w-0">
                  <p className={`text-sm font-medium ${currentTheme.text.primary} truncate`}>{staffData.user.name}</p>
                  <p className={`text-xs ${currentTheme.text.tertiary} truncate`}>{staffData.centerName}</p>
                </div>
                <div className="ml-2 flex items-center space-x-2">
                  <ThemeToggleButton size="small" />
                  <button
                    onClick={handleLogout}
                    className={`p-1 ${currentTheme.button.logout} transition-colors`}
                    title="Logout"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="md:pl-64 flex flex-col flex-1">
        {/* Top navigation */}
        <div className={`sticky top-0 z-10 md:hidden pl-1 pt-1 sm:pl-3 sm:pt-3 ${currentTheme.background}`}>
          <div className="flex items-center justify-between pr-4">
            <button
              className={`-ml-0.5 -mt-0.5 h-12 w-12 inline-flex items-center justify-center rounded-md ${currentTheme.button.mobile} focus:outline-none focus:ring-2 focus:ring-inset`}
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-6 w-6" />
            </button>
            <ThemeToggleButton size="small" />
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
};

const StaffLayout = ({ children }) => {
  return (
    <StaffThemeProvider>
      <StaffLayoutContent>
        {children}
      </StaffLayoutContent>
    </StaffThemeProvider>
  );
};

export default StaffLayout;