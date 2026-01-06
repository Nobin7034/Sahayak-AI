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
  Bell,
  MapPin,
  User,
  Clock,
  Building
} from 'lucide-react';

const StaffLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [staffData, setStaffData] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();

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
    navigate('/staff/login');
  };

  const isActive = (href) => {
    return location.pathname === href;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 flex z-40 md:hidden ${sidebarOpen ? '' : 'hidden'}`}>
        <div className="fixed inset-0 bg-slate-900 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
        <div className="relative flex-1 flex flex-col max-w-xs w-full bg-slate-800 border-r border-slate-700">
          <div className="absolute top-0 right-0 -mr-12 pt-2">
            <button
              className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-6 w-6 text-white" />
            </button>
          </div>
          
          {/* Mobile sidebar content */}
          <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
            <div className="flex-shrink-0 flex items-center px-4">
              <div className="h-8 w-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <MapPin className="h-5 w-5 text-white" />
              </div>
              <span className="ml-2 text-lg font-semibold text-white">SAHAYAK AI</span>
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
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-300 hover:bg-slate-700 hover:text-white'
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
            <div className="flex-shrink-0 flex border-t border-slate-700 p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-10 w-10 bg-slate-600 rounded-full flex items-center justify-center">
                    <User className="h-5 w-5 text-slate-300" />
                  </div>
                </div>
                <div className="ml-3">
                  <p className="text-base font-medium text-white">{staffData.user.name}</p>
                  <p className="text-sm font-medium text-slate-400">{staffData.centerName}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
        <div className="flex-1 flex flex-col min-h-0 border-r border-slate-700 bg-slate-800">
          <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
            <div className="flex items-center flex-shrink-0 px-4">
              <div className="h-8 w-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <MapPin className="h-5 w-5 text-white" />
              </div>
              <span className="ml-2 text-lg font-semibold text-white">SAHAYAK AI</span>
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
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-300 hover:bg-slate-700 hover:text-white'
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
            <div className="flex-shrink-0 flex border-t border-slate-700 p-4">
              <div className="flex items-center w-full">
                <div className="flex-shrink-0">
                  <div className="h-9 w-9 bg-slate-600 rounded-full flex items-center justify-center">
                    <User className="h-4 w-4 text-slate-300" />
                  </div>
                </div>
                <div className="ml-3 flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{staffData.user.name}</p>
                  <p className="text-xs text-slate-400 truncate">{staffData.centerName}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="ml-2 p-1 text-slate-400 hover:text-white transition-colors"
                  title="Logout"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="md:pl-64 flex flex-col flex-1">
        {/* Top navigation */}
        <div className="sticky top-0 z-10 md:hidden pl-1 pt-1 sm:pl-3 sm:pt-3 bg-slate-900">
          <button
            className="-ml-0.5 -mt-0.5 h-12 w-12 inline-flex items-center justify-center rounded-md text-slate-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>

        {/* Page content */}
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
};

export default StaffLayout;