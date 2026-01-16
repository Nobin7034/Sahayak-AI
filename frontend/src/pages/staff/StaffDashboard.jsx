import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  Users, 
  CheckCircle, 
  AlertCircle, 
  TrendingUp,
  MapPin,
  Bell,
  RefreshCw,
  Eye,
  Edit,
  Plus,
  DollarSign,
  Settings,
  BarChart3,
  User,
  Building,
  Star
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useStaffTheme } from '../../contexts/StaffThemeContext';
import staffApiService from '../../services/staffApiService';
import { StaffMetricsGrid, StaffMetricsSummary } from '../../components/StaffMetricsCard';
import StaffAppointmentsList from '../../components/StaffAppointmentsList';
import StaffNotifications from '../../components/StaffNotifications';
import CenterStatusCard from '../../components/CenterStatusCard';
import StaffQuickActions from '../../components/StaffQuickActions';
import ErrorBoundary, { NetworkErrorBoundary, useErrorRecovery } from '../../components/ErrorBoundary';
import { SkeletonDashboard, SkeletonMetricsCard, SkeletonAppointmentCard } from '../../components/SkeletonLoaders';

const StaffDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [dashboardData, setDashboardData] = useState(null);
  const [staffInfo, setStaffInfo] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [networkError, setNetworkError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const { user } = useAuth();
  const { theme } = useStaffTheme();

  // Theme-based classes
  const themeClasses = {
    light: {
      background: 'bg-gradient-to-br from-gray-50 via-gray-100 to-gray-50',
      card: 'bg-white/80 backdrop-blur-sm border-gray-200',
      cardSolid: 'bg-white border-gray-200',
      text: {
        primary: 'text-gray-900',
        secondary: 'text-gray-600',
        tertiary: 'text-gray-500'
      },
      error: {
        background: 'bg-red-50',
        border: 'border-red-200',
        text: 'text-red-700'
      },
      networkError: {
        background: 'bg-red-50/90',
        border: 'border-red-200/50',
        text: 'text-red-700'
      },
      button: {
        primary: 'bg-blue-600 hover:bg-blue-700 text-white',
        secondary: 'bg-gray-100 hover:bg-gray-200 text-gray-700',
        refresh: 'text-gray-500 hover:text-gray-700 focus:ring-blue-500'
      }
    },
    dark: {
      background: 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900',
      card: 'bg-slate-800/50 backdrop-blur-sm border-slate-700',
      cardSolid: 'bg-slate-800 border-slate-700',
      text: {
        primary: 'text-white',
        secondary: 'text-slate-300',
        tertiary: 'text-slate-400'
      },
      error: {
        background: 'bg-red-500/20',
        border: 'border-red-500/30',
        text: 'text-red-300'
      },
      networkError: {
        background: 'bg-red-500/20',
        border: 'border-red-500/30',
        text: 'text-red-300'
      },
      button: {
        primary: 'bg-blue-600 hover:bg-blue-700 text-white',
        secondary: 'bg-slate-700 hover:bg-slate-600 text-slate-300',
        refresh: 'text-slate-400 hover:text-white focus:ring-blue-500'
      }
    }
  };

  const currentTheme = themeClasses[theme];

  useEffect(() => {
    loadDashboardData();
    loadStaffInfo();
    
    // Set up auto-refresh every 30 seconds
    const interval = setInterval(() => {
      loadDashboardData(true);
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event) => {
      // Alt + R for refresh
      if (event.altKey && event.key === 'r') {
        event.preventDefault();
        handleRefresh();
      }
      
      // Alt + N for notifications
      if (event.altKey && event.key === 'n') {
        event.preventDefault();
        // Focus on notifications bell
        const notificationBell = document.querySelector('[data-notification-bell]');
        if (notificationBell) {
          notificationBell.click();
        }
      }
      
      // Alt + A for appointments
      if (event.altKey && event.key === 'a') {
        event.preventDefault();
        window.location.href = '/staff/appointments';
      }
      
      // Escape to close any open modals/dropdowns
      if (event.key === 'Escape') {
        // Close any open dropdowns or modals
        const openDropdowns = document.querySelectorAll('[data-dropdown-open="true"]');
        openDropdowns.forEach(dropdown => {
          dropdown.click();
        });
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Focus management for accessibility
  useEffect(() => {
    // Set page title for screen readers
    document.title = `Staff Dashboard - ${dashboardData?.centerStatus?.centerName || 'Akshaya Center'}`;
    
    // Announce page load to screen readers
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = 'Staff dashboard loaded successfully';
    document.body.appendChild(announcement);
    
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  }, [dashboardData?.centerStatus]);

  // Announce data updates to screen readers
  useEffect(() => {
    if (dashboardData && !loading) {
      const announcement = document.createElement('div');
      announcement.setAttribute('aria-live', 'polite');
      announcement.className = 'sr-only';
      announcement.textContent = `Dashboard updated. ${dashboardData?.metrics?.totalToday || 0} appointments today, ${dashboardData?.metrics?.pendingApprovals || 0} pending approvals.`;
      document.body.appendChild(announcement);
      
      setTimeout(() => {
        document.body.removeChild(announcement);
      }, 2000);
    }
  }, [dashboardData, loading, dashboardData?.metrics]);

  const loadStaffInfo = () => {
    const storedUser = localStorage.getItem('user');
    const storedStaff = localStorage.getItem('staff');
    if (storedUser) {
      setStaffInfo({
        user: JSON.parse(storedUser),
        staff: storedStaff ? JSON.parse(storedStaff) : null
      });
    }
  };

  const loadDashboardData = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      
      const response = await staffApiService.getDashboardData();

      if (response.success) {
        setDashboardData(response.data);
        setError('');
        setLastRefresh(new Date());
        setNetworkError(null);
        setRetryCount(0);
      }
    } catch (error) {
      console.error('Dashboard data load error:', error);
      setRetryCount(prev => prev + 1);
      
      // Handle different types of errors
      if (error.message.includes('Network error') || error.message.includes('fetch')) {
        setNetworkError('Unable to connect to server. Please check your internet connection.');
      } else if (error.message.includes('Session expired') || error.message.includes('401')) {
        // Dispatch auth error event
        window.dispatchEvent(new CustomEvent('auth_error', { 
          detail: { type: 'auth_error', message: 'Session expired' }
        }));
        return;
      } else {
        setError(error.message || 'Failed to load dashboard data');
      }
      
      // Auto-retry with exponential backoff for network errors
      if (retryCount < 3 && (error.message.includes('Network error') || error.message.includes('fetch'))) {
        const retryDelay = Math.min(1000 * Math.pow(2, retryCount), 10000); // Max 10 seconds
        setTimeout(() => {
          console.log(`Auto-retry attempt ${retryCount + 1} in ${retryDelay}ms`);
          loadDashboardData(isRefresh);
        }, retryDelay);
        return;
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRetryCount(0);
    setNetworkError(null);
    loadDashboardData(true);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500';
      case 'confirmed': return 'bg-blue-500';
      case 'in_progress': return 'bg-purple-500';
      case 'completed': return 'bg-green-500';
      case 'cancelled': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusTextColor = (status) => {
    switch (status) {
      case 'pending': return 'text-yellow-100';
      case 'confirmed': return 'text-blue-100';
      case 'in_progress': return 'text-purple-100';
      case 'completed': return 'text-green-100';
      case 'cancelled': return 'text-red-100';
      default: return 'text-gray-100';
    }
  };

  if (loading) {
    return <SkeletonDashboard />;
  }

  if (error) {
    return (
      <div className={`min-h-screen ${currentTheme.background} flex items-center justify-center`}>
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className={`text-xl font-semibold ${currentTheme.text.primary} mb-2`}>Error Loading Dashboard</h2>
          <p className={`${currentTheme.text.secondary} mb-4`}>{error}</p>
          <button
            onClick={() => loadDashboardData()}
            className={`${currentTheme.button.primary} px-4 py-2 rounded-md transition-colors`}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const { metrics, upcomingAppointments, centerStatus, recentActivity } = dashboardData;

  return (
    <ErrorBoundary>
      <NetworkErrorBoundary onRetry={handleRefresh}>
        <div 
          className={`min-h-screen ${currentTheme.background}`}
          role="main"
          aria-label="Staff Dashboard"
        >
          {/* Skip to main content link for accessibility */}
          <a 
            href="#main-content" 
            className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-blue-600 text-white px-4 py-2 rounded-md z-50"
          >
            Skip to main content
          </a>

          {/* Keyboard shortcuts info (hidden, for screen readers) */}
          <div className="sr-only">
            <h2>Keyboard Shortcuts</h2>
            <ul>
              <li>Alt + R: Refresh dashboard</li>
              <li>Alt + N: Open notifications</li>
              <li>Alt + A: Go to appointments</li>
              <li>Escape: Close open menus</li>
            </ul>
          </div>

          {/* Network Error Banner */}
          {networkError && (
            <div 
              className={`${currentTheme.networkError.background} border-b ${currentTheme.networkError.border} p-3`}
              role="alert"
              aria-live="assertive"
            >
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <AlertCircle className="h-5 w-5 text-red-400" aria-hidden="true" />
                    <span className={`${currentTheme.networkError.text} text-sm`}>{networkError}</span>
                    {retryCount > 0 && (
                      <span className="text-red-400 text-xs">
                        (Retry {retryCount}/3)
                      </span>
                    )}
                  </div>
                  <button
                    onClick={handleRefresh}
                    disabled={refreshing}
                    className={`${currentTheme.networkError.text} hover:text-red-200 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-red-400 rounded`}
                    aria-label="Retry connection"
                  >
                    {refreshing ? 'Retrying...' : 'Retry Now'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Header */}
          <header className={`${currentTheme.card} border-b relative z-30 overflow-visible`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 overflow-visible">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-3 sm:space-x-4">
                    <div className="h-10 w-10 sm:h-12 sm:w-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                      <Building className="h-5 w-5 sm:h-6 sm:w-6 text-white" aria-hidden="true" />
                    </div>
                    <div>
                      <h1 className={`text-xl sm:text-2xl font-bold ${currentTheme.text.primary}`}>Staff Dashboard</h1>
                      <p className={`${currentTheme.text.secondary} text-sm sm:text-base`}>{centerStatus?.centerName}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <div 
                      className={`h-2 w-2 rounded-full ${networkError ? 'bg-red-400' : 'bg-green-400 animate-pulse'}`}
                      aria-hidden="true"
                    ></div>
                    <span 
                      className={`text-sm ${networkError ? 'text-red-400' : 'text-green-400'}`}
                      aria-label={`Connection status: ${networkError ? 'Offline' : 'Online'}`}
                    >
                      {networkError ? 'Offline' : 'Online'}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 sm:space-x-4 w-full sm:w-auto justify-between sm:justify-end">
                  <div data-notification-bell>
                    <StaffNotifications />
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className={`h-6 w-6 sm:h-8 sm:w-8 ${theme === 'light' ? 'bg-gray-200' : 'bg-slate-600'} rounded-full flex items-center justify-center`}>
                      <User className={`h-3 w-3 sm:h-4 sm:w-4 ${theme === 'light' ? 'text-gray-600' : 'text-slate-300'}`} aria-hidden="true" />
                    </div>
                    <span className={`${currentTheme.text.primary} text-sm font-medium hidden sm:inline`}>
                      {staffInfo?.user?.name || user?.name}
                    </span>
                  </div>
                  <button
                    onClick={handleRefresh}
                    disabled={refreshing}
                    className={`p-2 ${currentTheme.button.refresh} transition-colors focus:outline-none focus:ring-2 rounded`}
                    title={networkError ? 'Retry connection (Alt+R)' : 'Refresh data (Alt+R)'}
                    aria-label={networkError ? 'Retry connection' : 'Refresh dashboard data'}
                  >
                    <RefreshCw className={`h-4 w-4 sm:h-5 sm:w-5 ${refreshing ? 'animate-spin' : ''}`} aria-hidden="true" />
                  </button>
                </div>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main 
            id="main-content"
            className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8"
          >
            
            {/* Top Row - Center Status & Quick Actions */}
            <section aria-label="Dashboard overview" className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
              
              {/* Center Status */}
              <ErrorBoundary fallback={({ retry }) => (
                <div className={`${currentTheme.error.background} border ${currentTheme.error.border} rounded-2xl p-6`} role="alert">
                  <h3 className={`${currentTheme.error.text} font-medium mb-2`}>Center Status Error</h3>
                  <p className={`${currentTheme.error.text} text-sm mb-3`}>Failed to load center information</p>
                  <button 
                    onClick={retry} 
                    className={`${currentTheme.button.primary} px-3 py-1 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-400`}
                  >
                    Retry
                  </button>
                </div>
              )}>
                <CenterStatusCard
                  centerInfo={{
                    name: centerStatus?.centerName || 'Akshaya Center',
                    address: centerStatus?.address || 'Address not available',
                    district: centerStatus?.district || 'District',
                    state: centerStatus?.state || 'State',
                    contact: centerStatus?.contact || 'Contact not available',
                    email: centerStatus?.email || 'Email not available',
                    rating: centerStatus?.rating || metrics?.avgRating || 0,
                    activeServices: centerStatus?.activeServices || 0,
                    todayVisitors: centerStatus?.todayVisitors || metrics?.todayVisits || 0,
                    totalRatings: metrics?.totalRatings || 0,
                    isWorking: centerStatus?.isWorking !== undefined ? centerStatus.isWorking : true,
                    todayHours: centerStatus?.todayHours || '9:00 AM - 5:00 PM'
                  }}
                  staffInfo={staffInfo}
                  loading={loading}
                  error={error}
                  onRefresh={handleRefresh}
                  showShiftInfo={true}
                  showMetrics={true}
                />
              </ErrorBoundary>

              {/* Revenue Card */}
              <div className={`${currentTheme.card} rounded-2xl p-4 sm:p-6 border`}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className={`text-lg font-semibold ${currentTheme.text.primary}`}>Today's Revenue</h3>
                  <DollarSign className="h-5 w-5 text-green-400" aria-hidden="true" />
                </div>
                <div className="space-y-2">
                  <div className={`text-2xl font-bold ${currentTheme.text.primary}`} aria-label={`Today's revenue: ${metrics?.todayRevenue || 0} rupees`}>
                    ₹{metrics?.todayRevenue || 0}
                  </div>
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="h-4 w-4 text-green-400" aria-hidden="true" />
                    <span className="text-green-400 text-sm">From {metrics?.completedToday || 0} completed services</span>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <ErrorBoundary fallback={({ retry }) => (
                <div className={`${currentTheme.error.background} border ${currentTheme.error.border} rounded-2xl p-6`} role="alert">
                  <h3 className={`${currentTheme.error.text} font-medium mb-2`}>Quick Actions Error</h3>
                  <button 
                    onClick={retry} 
                    className={`${currentTheme.button.primary} px-3 py-1 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-400`}
                  >
                    Retry
                  </button>
                </div>
              )}>
                <StaffQuickActions
                  userPermissions={staffInfo?.staff?.permissions || ['manage_appointments', 'update_status', 'view_customers', 'manage_services']}
                  onActionClick={(actionId) => {
                    console.log(`Quick action clicked: ${actionId}`);
                    // Handle action-specific logic here
                    switch (actionId) {
                      case 'new-appointment':
                        // Navigate to new appointment page
                        break;
                      case 'quick-service':
                        // Open quick service modal
                        break;
                      default:
                        break;
                    }
                  }}
                  columns={2}
                  title="Quick Actions"
                />
              </ErrorBoundary>
            </section>

            {/* Metrics Summary */}
            <section aria-label="Performance metrics summary" className="mb-6">
              <ErrorBoundary fallback={({ retry }) => (
                <div className={`${currentTheme.error.background} border ${currentTheme.error.border} rounded-lg p-4 mb-6`} role="alert">
                  <h3 className={`${currentTheme.error.text} font-medium mb-2`}>Metrics Error</h3>
                  <button 
                    onClick={retry} 
                    className={`${currentTheme.button.primary} px-3 py-1 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-400`}
                  >
                    Retry
                  </button>
                </div>
              )}>
                <StaffMetricsSummary 
                  metrics={metrics}
                  loading={loading}
                  error={error}
                />
              </ErrorBoundary>
            </section>

            {/* Detailed Metrics Grid */}
            <section aria-label="Detailed performance metrics" className="mb-6 sm:mb-8">
              <ErrorBoundary fallback={({ retry }) => (
                <div className={`${currentTheme.error.background} border ${currentTheme.error.border} rounded-lg p-4 mb-6`} role="alert">
                  <h3 className={`${currentTheme.error.text} font-medium mb-2`}>Dashboard Metrics Error</h3>
                  <button 
                    onClick={retry} 
                    className={`${currentTheme.button.primary} px-3 py-1 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-400`}
                  >
                    Retry
                  </button>
                </div>
              )}>
                <StaffMetricsGrid 
                  metrics={metrics}
                  loading={loading}
                  error={error}
                  onMetricClick={(key, title) => {
                    console.log(`Clicked on ${title} (${key})`);
                    // Navigate to detailed view or show modal
                  }}
                />
              </ErrorBoundary>
            </section>

            {/* Bottom Row */}
            <section aria-label="Appointments and activity" className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              
              {/* Upcoming Appointments */}
              <ErrorBoundary fallback={({ retry }) => (
                <div className={`${currentTheme.error.background} border ${currentTheme.error.border} rounded-xl p-6`} role="alert">
                  <h3 className={`${currentTheme.error.text} font-medium mb-2`}>Appointments Error</h3>
                  <button 
                    onClick={retry} 
                    className={`${currentTheme.button.primary} px-3 py-1 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-400`}
                  >
                    Retry
                  </button>
                </div>
              )}>
                <StaffAppointmentsList
                  permissions={staffInfo?.staff?.permissions || ['manage_appointments', 'update_status']}
                  onAppointmentUpdate={(appointmentId, newStatus) => {
                    console.log(`Appointment ${appointmentId} updated to ${newStatus}`);
                    // Refresh dashboard data to update metrics
                    loadDashboardData(true);
                  }}
                  maxItems={5}
                  showFilters={false}
                  title="Recent Appointments"
                />
              </ErrorBoundary>

              {/* Recent Activity */}
              <div className={`${currentTheme.card} rounded-2xl p-4 sm:p-6 border`}>
                <h2 className={`text-lg font-semibold ${currentTheme.text.primary} mb-4`}>Recent Activity</h2>
                {(!recentActivity || recentActivity.length === 0) ? (
                  <div className="text-center py-8" role="status" aria-label="No recent activity">
                    <AlertCircle className={`h-12 w-12 ${theme === 'light' ? 'text-gray-400' : 'text-slate-600'} mx-auto mb-4`} aria-hidden="true" />
                    <p className={`${currentTheme.text.tertiary}`}>No recent activity</p>
                    <p className={`${currentTheme.text.tertiary} text-sm mt-1`}>Activity will appear here as you work</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recentActivity.map((activity, index) => (
                      <div key={index} className="flex items-center space-x-3">
                        <div className="h-8 w-8 bg-blue-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                          <AlertCircle className="h-4 w-4 text-blue-400" aria-hidden="true" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`${currentTheme.text.secondary} text-sm truncate`}>{activity.message}</p>
                          <p className={`${currentTheme.text.tertiary} text-xs mt-1`}>{activity.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>

            {/* Last Updated */}
            <footer className="mt-6 sm:mt-8 text-center">
              <p className={`${currentTheme.text.tertiary} text-sm`}>
                Last updated: {dashboardData?.lastUpdated ? new Date(dashboardData.lastUpdated).toLocaleString() : 'Just now'}
                {retryCount > 0 && (
                  <span className="ml-2 text-yellow-400">
                    (After {retryCount} retry{retryCount > 1 ? 'ies' : ''})
                  </span>
                )}
              </p>
            </footer>
          </main>
        </div>
      </NetworkErrorBoundary>
    </ErrorBoundary>
  );
};

export default StaffDashboard;