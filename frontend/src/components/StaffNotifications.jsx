import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  BellRing, 
  Calendar, 
  AlertCircle, 
  CheckCircle, 
  Info, 
  X,
  Eye,
  EyeOff,
  RefreshCw,
  Clock
} from 'lucide-react';
import staffApiService from '../services/staffApiService';

/**
 * NotificationIcon Component
 * Displays appropriate icon based on notification type
 */
const NotificationIcon = ({ type, isRead }) => {
  const iconProps = {
    className: `h-4 w-4 ${isRead ? 'text-slate-400' : 'text-blue-400'}`
  };

  switch (type) {
    case 'appointment':
      return <Calendar {...iconProps} />;
    case 'system':
      return <AlertCircle {...iconProps} />;
    case 'announcement':
      return <Info {...iconProps} />;
    default:
      return <Bell {...iconProps} />;
  }
};

/**
 * NotificationItem Component
 * Displays individual notification with actions
 */
const NotificationItem = ({ 
  notification, 
  onMarkAsRead, 
  onDismiss,
  onClick 
}) => {
  const [processing, setProcessing] = useState(false);

  const handleMarkAsRead = async (e) => {
    e.stopPropagation();
    if (notification.isRead) return;

    setProcessing(true);
    try {
      await onMarkAsRead(notification._id);
    } catch (error) {
      console.error('Mark as read failed:', error);
    } finally {
      setProcessing(false);
    }
  };

  const handleDismiss = async (e) => {
    e.stopPropagation();
    setProcessing(true);
    try {
      await onDismiss(notification._id);
    } catch (error) {
      console.error('Dismiss failed:', error);
    } finally {
      setProcessing(false);
    }
  };

  const formatTime = (date) => {
    const now = new Date();
    const notificationDate = new Date(date);
    const diffInMinutes = Math.floor((now - notificationDate) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  return (
    <div 
      className={`p-4 border-l-4 cursor-pointer transition-all hover:bg-slate-700/30 ${
        notification.isRead 
          ? 'border-slate-600 bg-slate-800/30' 
          : 'border-blue-500 bg-blue-500/10'
      }`}
      onClick={() => onClick && onClick(notification)}
    >
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0 mt-1">
          <NotificationIcon type={notification.type} isRead={notification.isRead} />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h4 className={`text-sm font-medium ${
                notification.isRead ? 'text-slate-300' : 'text-white'
              }`}>
                {notification.title}
              </h4>
              <p className={`text-sm mt-1 ${
                notification.isRead ? 'text-slate-400' : 'text-slate-300'
              }`}>
                {notification.message}
              </p>
              <div className="flex items-center space-x-2 mt-2">
                <Clock className="h-3 w-3 text-slate-500" />
                <span className="text-xs text-slate-500">
                  {formatTime(notification.createdAt)}
                </span>
                {!notification.isRead && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-500/20 text-blue-300">
                    New
                  </span>
                )}
              </div>
            </div>
            
            <div className="flex items-center space-x-1 ml-2">
              {!notification.isRead && (
                <button
                  onClick={handleMarkAsRead}
                  disabled={processing}
                  className="p-1 text-slate-400 hover:text-white transition-colors"
                  title="Mark as read"
                >
                  <Eye className="h-4 w-4" />
                </button>
              )}
              <button
                onClick={handleDismiss}
                disabled={processing}
                className="p-1 text-slate-400 hover:text-red-400 transition-colors"
                title="Dismiss"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * NotificationBell Component
 * Bell icon with unread count badge
 */
const NotificationBell = ({ 
  unreadCount = 0, 
  onClick, 
  isOpen = false,
  className = "" 
}) => {
  return (
    <button
      onClick={onClick}
      className={`relative p-2 text-slate-400 hover:text-white transition-colors ${className}`}
    >
      {unreadCount > 0 ? (
        <BellRing className="h-5 w-5" />
      ) : (
        <Bell className="h-5 w-5" />
      )}
      
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </button>
  );
};

/**
 * NotificationDropdown Component
 * Dropdown panel showing notifications
 */
const NotificationDropdown = ({ 
  isOpen, 
  onClose, 
  notifications = [], 
  loading = false,
  onMarkAsRead,
  onDismiss,
  onMarkAllAsRead,
  onRefresh
}) => {
  if (!isOpen) return null;

  const unreadNotifications = notifications.filter(n => !n.isRead);

  return (
    <div className="absolute right-0 top-full mt-2 w-96 bg-slate-800 border border-slate-700 rounded-xl shadow-xl z-50">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-700">
        <h3 className="text-lg font-semibold text-white">Notifications</h3>
        <div className="flex items-center space-x-2">
          {unreadNotifications.length > 0 && (
            <button
              onClick={onMarkAllAsRead}
              className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
            >
              Mark all read
            </button>
          )}
          <button
            onClick={onRefresh}
            disabled={loading}
            className="p-1 text-slate-400 hover:text-white transition-colors"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-h-96 overflow-y-auto">
        {loading && notifications.length === 0 ? (
          <div className="p-4 text-center">
            <RefreshCw className="h-6 w-6 text-slate-400 animate-spin mx-auto mb-2" />
            <p className="text-slate-400 text-sm">Loading notifications...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-8 text-center">
            <Bell className="h-12 w-12 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400">No notifications</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-700">
            {notifications.map((notification) => (
              <NotificationItem
                key={notification._id}
                notification={notification}
                onMarkAsRead={onMarkAsRead}
                onDismiss={onDismiss}
                onClick={(notification) => {
                  // Handle notification click - could navigate or show details
                  console.log('Notification clicked:', notification);
                  if (!notification.isRead) {
                    onMarkAsRead(notification._id);
                  }
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div className="p-3 border-t border-slate-700 text-center">
          <button 
            onClick={() => {
              // Navigate to full notifications page
              window.location.href = '/staff/notifications';
            }}
            className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
          >
            View all notifications
          </button>
        </div>
      )}
    </div>
  );
};

/**
 * StaffNotifications Component
 * Main notifications component with bell and dropdown
 */
const StaffNotifications = ({ 
  autoRefresh = true,
  refreshInterval = 30000 // 30 seconds
}) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    loadNotifications();

    // Set up auto-refresh
    if (autoRefresh) {
      const interval = setInterval(loadNotifications, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval]);

  useEffect(() => {
    // Update unread count when notifications change
    const count = notifications.filter(n => !n.isRead).length;
    setUnreadCount(count);
  }, [notifications]);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const response = await staffApiService.getNotifications();
      
      if (response.success) {
        setNotifications(response.data || []);
        setError('');
      }
    } catch (error) {
      console.error('Load notifications error:', error);
      setError(error.message || 'Failed to load notifications');
      
      // Use mock data for development
      setNotifications([
        {
          _id: '1',
          type: 'appointment',
          title: 'New Appointment Booked',
          message: 'Rajesh Kumar has booked an appointment for Aadhaar Card Update at 10:00 AM',
          isRead: false,
          createdAt: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
          meta: { appointmentId: 'apt_123' }
        },
        {
          _id: '2',
          type: 'system',
          title: 'System Maintenance',
          message: 'Scheduled maintenance will occur tonight from 11 PM to 1 AM',
          isRead: false,
          createdAt: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
        },
        {
          _id: '3',
          type: 'announcement',
          title: 'New Service Added',
          message: 'Digital Signature Certificate service is now available at your center',
          isRead: true,
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await staffApiService.markNotificationAsRead(notificationId);
      
      // Update local state
      setNotifications(prev => 
        prev.map(n => 
          n._id === notificationId 
            ? { ...n, isRead: true }
            : n
        )
      );
    } catch (error) {
      console.error('Mark as read failed:', error);
    }
  };

  const handleDismiss = async (notificationId) => {
    // Remove from local state immediately for better UX
    setNotifications(prev => prev.filter(n => n._id !== notificationId));
    
    try {
      // Call API to dismiss notification
      // await staffApiService.dismissNotification(notificationId);
    } catch (error) {
      console.error('Dismiss failed:', error);
      // Reload notifications on error
      loadNotifications();
    }
  };

  const handleMarkAllAsRead = async () => {
    const unreadIds = notifications.filter(n => !n.isRead).map(n => n._id);
    
    // Update local state immediately
    setNotifications(prev => 
      prev.map(n => ({ ...n, isRead: true }))
    );

    try {
      // Mark all as read in parallel
      await Promise.all(
        unreadIds.map(id => staffApiService.markNotificationAsRead(id))
      );
    } catch (error) {
      console.error('Mark all as read failed:', error);
      // Reload notifications on error
      loadNotifications();
    }
  };

  const handleToggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  const handleCloseDropdown = () => {
    setIsOpen(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isOpen && !event.target.closest('.notification-container')) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <div className="relative notification-container">
      <NotificationBell
        unreadCount={unreadCount}
        onClick={handleToggleDropdown}
        isOpen={isOpen}
      />
      
      <NotificationDropdown
        isOpen={isOpen}
        onClose={handleCloseDropdown}
        notifications={notifications}
        loading={loading}
        onMarkAsRead={handleMarkAsRead}
        onDismiss={handleDismiss}
        onMarkAllAsRead={handleMarkAllAsRead}
        onRefresh={loadNotifications}
      />
    </div>
  );
};

/**
 * NotificationsList Component
 * Full page notifications list
 */
const NotificationsList = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all'); // all, unread, read

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const response = await staffApiService.getNotifications();
      
      if (response.success) {
        setNotifications(response.data || []);
        setError('');
      }
    } catch (error) {
      console.error('Load notifications error:', error);
      setError(error.message || 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'unread') return !notification.isRead;
    if (filter === 'read') return notification.isRead;
    return true;
  });

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700">
        {/* Header */}
        <div className="p-6 border-b border-slate-700">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-white">Notifications</h1>
            <button
              onClick={loadNotifications}
              disabled={loading}
              className="p-2 text-slate-400 hover:text-white transition-colors"
            >
              <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
          
          {/* Filter tabs */}
          <div className="flex space-x-4 mt-4">
            {['all', 'unread', 'read'].map((filterType) => (
              <button
                key={filterType}
                onClick={() => setFilter(filterType)}
                className={`px-3 py-1 rounded-md text-sm transition-colors ${
                  filter === filterType
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
                {filterType === 'unread' && (
                  <span className="ml-1 bg-red-500 text-white text-xs rounded-full px-1">
                    {notifications.filter(n => !n.isRead).length}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div>
          {loading ? (
            <div className="p-8 text-center">
              <RefreshCw className="h-8 w-8 text-slate-400 animate-spin mx-auto mb-4" />
              <p className="text-slate-400">Loading notifications...</p>
            </div>
          ) : error ? (
            <div className="p-8 text-center">
              <AlertCircle className="h-8 w-8 text-red-400 mx-auto mb-4" />
              <p className="text-red-400 mb-4">{error}</p>
              <button
                onClick={loadNotifications}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                Try Again
              </button>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="p-8 text-center">
              <Bell className="h-12 w-12 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400">
                {filter === 'all' ? 'No notifications' : `No ${filter} notifications`}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-700">
              {filteredNotifications.map((notification) => (
                <NotificationItem
                  key={notification._id}
                  notification={notification}
                  onMarkAsRead={async (id) => {
                    await staffApiService.markNotificationAsRead(id);
                    setNotifications(prev => 
                      prev.map(n => 
                        n._id === id ? { ...n, isRead: true } : n
                      )
                    );
                  }}
                  onDismiss={async (id) => {
                    setNotifications(prev => prev.filter(n => n._id !== id));
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StaffNotifications;
export { NotificationBell, NotificationDropdown, NotificationsList };