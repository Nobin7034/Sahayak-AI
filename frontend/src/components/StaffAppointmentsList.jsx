import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  User, 
  Phone, 
  Mail, 
  FileText, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Eye,
  Edit,
  Filter,
  Search,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  Shield
} from 'lucide-react';
import staffApiService from '../services/staffApiService';
import { useStaffTheme } from '../contexts/StaffThemeContext';
import StaffDocumentView from './StaffDocumentView';

/**
 * AppointmentStatusBadge Component
 * Displays appointment status with appropriate colors
 */
const AppointmentStatusBadge = ({ status }) => {
  const { theme } = useStaffTheme();
  
  const statusConfig = {
    pending: { 
      color: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30', 
      icon: Clock,
      label: 'Pending' 
    },
    confirmed: { 
      color: 'bg-blue-500/20 text-blue-300 border-blue-500/30', 
      icon: CheckCircle,
      label: 'Confirmed' 
    },
    in_progress: { 
      color: 'bg-purple-500/20 text-purple-300 border-purple-500/30', 
      icon: AlertCircle,
      label: 'In Progress' 
    },
    completed: { 
      color: 'bg-green-500/20 text-green-300 border-green-500/30', 
      icon: CheckCircle,
      label: 'Completed' 
    },
    cancelled: { 
      color: 'bg-red-500/20 text-red-300 border-red-500/30', 
      icon: XCircle,
      label: 'Cancelled' 
    }
  };

  const config = statusConfig[status] || statusConfig.pending;
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${config.color}`}>
      <Icon className="h-3 w-3 mr-1" />
      {config.label}
    </span>
  );
};

/**
 * AppointmentCard Component
 * Displays individual appointment with actions
 */
const AppointmentCard = ({ 
  appointment, 
  onStatusUpdate, 
  onViewDetails, 
  permissions = [],
  expanded = false,
  onToggleExpand
}) => {
  const { theme } = useStaffTheme();
  const [updating, setUpdating] = useState(false);

  // Theme-based classes
  const themeClasses = {
    light: {
      card: 'bg-white/80 backdrop-blur-sm border-gray-200 hover:border-gray-300',
      text: {
        primary: 'text-gray-900',
        secondary: 'text-gray-600',
        tertiary: 'text-gray-500'
      },
      avatar: 'bg-gray-200',
      avatarIcon: 'text-gray-500',
      border: 'border-gray-200',
      expandedBg: 'bg-gray-50/50',
      button: 'text-gray-500 hover:text-gray-700'
    },
    dark: {
      card: 'bg-slate-800/50 backdrop-blur-sm border-slate-700 hover:border-slate-600',
      text: {
        primary: 'text-white',
        secondary: 'text-slate-300',
        tertiary: 'text-slate-400'
      },
      avatar: 'bg-slate-600',
      avatarIcon: 'text-slate-300',
      border: 'border-slate-700',
      expandedBg: 'bg-slate-700/50',
      button: 'text-slate-400 hover:text-white'
    }
  };

  const currentTheme = themeClasses[theme];

  const handleStatusUpdate = async (newStatus) => {
    if (!permissions.includes('update_status')) {
      alert('You do not have permission to update appointment status');
      return;
    }

    setUpdating(true);
    try {
      await onStatusUpdate(appointment._id, newStatus);
    } catch (error) {
      console.error('Status update failed:', error);
      alert('Failed to update status: ' + error.message);
    } finally {
      setUpdating(false);
    }
  };

  const getValidStatusTransitions = (currentStatus) => {
    const transitions = {
      'pending': ['confirmed', 'cancelled'],
      'confirmed': ['in_progress', 'cancelled'],
      'in_progress': ['completed', 'cancelled'],
      'completed': [],
      'cancelled': []
    };
    return transitions[currentStatus] || [];
  };

  const validTransitions = getValidStatusTransitions(appointment.status);

  return (
    <div className={`${currentTheme.card} rounded-xl p-4 border transition-all`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
            <button
              onClick={onToggleExpand}
              className={`${currentTheme.button} transition-colors`}
            >
              {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </button>
            <div className={`h-10 w-10 ${currentTheme.avatar} rounded-full flex items-center justify-center`}>
              <User className={`h-5 w-5 ${currentTheme.avatarIcon}`} />
            </div>
            <div>
              <h3 className={`${currentTheme.text.primary} font-medium`}>{appointment.user?.name}</h3>
              <p className={`${currentTheme.text.secondary} text-sm`}>{appointment.service?.name}</p>
            </div>
          </div>

          <div className={`flex items-center space-x-4 text-sm ${currentTheme.text.secondary} mb-3`}>
            <div className="flex items-center space-x-1">
              <Calendar className="h-4 w-4" />
              <span>{new Date(appointment.appointmentDate).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Clock className="h-4 w-4" />
              <span>{appointment.timeSlot}</span>
            </div>
            <AppointmentStatusBadge status={appointment.status} />
          </div>

          {expanded && (
            <div className={`mt-4 space-y-3 border-t ${currentTheme.border} pt-3`}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className={`${currentTheme.text.primary} font-medium mb-2`}>Customer Details</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center space-x-2">
                      <Mail className={`h-4 w-4 ${currentTheme.text.secondary}`} />
                      <span className={currentTheme.text.secondary}>{appointment.user?.email}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Phone className={`h-4 w-4 ${currentTheme.text.secondary}`} />
                      <span className={currentTheme.text.secondary}>{appointment.user?.phone}</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className={`${currentTheme.text.primary} font-medium mb-2`}>Service Details</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center space-x-2">
                      <FileText className={`h-4 w-4 ${currentTheme.text.secondary}`} />
                      <span className={currentTheme.text.secondary}>{appointment.service?.category}</span>
                    </div>
                    <div className={currentTheme.text.secondary}>
                      Fee: ₹{appointment.service?.fees || 'N/A'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Document Status Section */}
              {appointment.selectedDocuments && appointment.selectedDocuments.length > 0 && (
                <div>
                  <h4 className={`${currentTheme.text.primary} font-medium mb-2 flex items-center space-x-2`}>
                    <Shield className="h-4 w-4" />
                    <span>Document Status</span>
                    <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                      {appointment.selectedDocuments.length} documents
                    </span>
                  </h4>
                  <StaffDocumentView
                    appointment={appointment}
                    onValidationUpdate={async (appointmentId, validationData) => {
                      // This would be handled by parent component
                      console.log('Document validation update:', appointmentId, validationData);
                    }}
                    onNotifyUser={async (appointmentId, notificationData) => {
                      // This would be handled by parent component
                      console.log('Notify user:', appointmentId, notificationData);
                    }}
                  />
                </div>
              )}

              {appointment.notes && (
                <div>
                  <h4 className={`${currentTheme.text.primary} font-medium mb-2`}>Notes</h4>
                  <p className={`${currentTheme.text.secondary} text-sm ${currentTheme.expandedBg} p-3 rounded-lg`}>
                    {appointment.notes}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center space-x-2 ml-4">
          {validTransitions.length > 0 && permissions.includes('update_status') && (
            <div className="flex space-x-1">
              {validTransitions.map((status) => (
                <button
                  key={status}
                  onClick={() => handleStatusUpdate(status)}
                  disabled={updating}
                  className={`px-3 py-1 text-xs rounded-md transition-colors ${
                    status === 'confirmed' ? 'bg-blue-600 hover:bg-blue-700 text-white' :
                    status === 'in_progress' ? 'bg-purple-600 hover:bg-purple-700 text-white' :
                    status === 'completed' ? 'bg-green-600 hover:bg-green-700 text-white' :
                    status === 'cancelled' ? 'bg-red-600 hover:bg-red-700 text-white' :
                    'bg-slate-600 hover:bg-slate-700 text-white'
                  } ${updating ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {updating ? '...' : status.replace('_', ' ')}
                </button>
              ))}
            </div>
          )}

          <button
            onClick={() => onViewDetails(appointment)}
            className={`p-2 ${currentTheme.button} transition-colors`}
            title="View Details"
          >
            <Eye className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * AppointmentFilters Component
 * Provides filtering and search functionality
 */
const AppointmentFilters = ({ 
  filters, 
  onFiltersChange, 
  onSearch,
  loading = false 
}) => {
  const { theme } = useStaffTheme();
  const [searchTerm, setSearchTerm] = useState('');

  // Theme-based classes
  const themeClasses = {
    light: {
      container: 'bg-white/80 backdrop-blur-sm border-gray-200',
      input: 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500',
      select: 'bg-gray-50 border-gray-300 text-gray-900 focus:ring-blue-500 focus:border-blue-500',
      icon: 'text-gray-500'
    },
    dark: {
      container: 'bg-slate-800/50 backdrop-blur-sm border-slate-700',
      input: 'bg-slate-700 border-slate-600 text-white placeholder-slate-400 focus:ring-blue-500 focus:border-blue-500',
      select: 'bg-slate-700 border-slate-600 text-white focus:ring-blue-500 focus:border-blue-500',
      icon: 'text-slate-400'
    }
  };

  const currentTheme = themeClasses[theme];

  const handleSearch = (e) => {
    e.preventDefault();
    onSearch(searchTerm);
  };

  return (
    <div className={`${currentTheme.container} rounded-xl p-4 border mb-6`}>
      <div className="flex flex-col md:flex-row gap-4">
        {/* Search */}
        <form onSubmit={handleSearch} className="flex-1">
          <div className="relative">
            <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 ${currentTheme.icon}`} />
            <input
              type="text"
              placeholder="Search by name, service, or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${currentTheme.input}`}
            />
          </div>
        </form>

        {/* Status Filter */}
        <select
          value={filters.status || 'all'}
          onChange={(e) => onFiltersChange({ ...filters, status: e.target.value })}
          className={`px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${currentTheme.select}`}
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>

        {/* Date Range Filter */}
        <select
          value={filters.dateRange || 'today'}
          onChange={(e) => onFiltersChange({ ...filters, dateRange: e.target.value })}
          className={`px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${currentTheme.select}`}
        >
          <option value="today">Today</option>
          <option value="tomorrow">Tomorrow</option>
          <option value="week">This Week</option>
          <option value="month">This Month</option>
          <option value="all">All Dates</option>
        </select>
      </div>
    </div>
  );
};

/**
 * StaffAppointmentsList Component
 * Main component for displaying and managing appointments
 */
const StaffAppointmentsList = ({ 
  permissions = [],
  onAppointmentUpdate = null,
  maxItems = null,
  showFilters = true,
  title = "Appointments"
}) => {
  const { theme } = useStaffTheme();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    status: 'all',
    dateRange: 'today',
    searchTerm: ''
  });
  const [expandedItems, setExpandedItems] = useState(new Set());
  const [pagination, setPagination] = useState({
    page: 1,
    limit: maxItems || 20,
    total: 0,
    totalPages: 0
  });

  // Theme-based classes
  const themeClasses = {
    light: {
      container: 'bg-white/80 backdrop-blur-sm border-gray-200',
      text: {
        primary: 'text-gray-900',
        secondary: 'text-gray-600',
        tertiary: 'text-gray-500'
      },
      skeleton: 'bg-gray-200',
      skeletonCard: 'bg-gray-100/50',
      icon: 'text-gray-400',
      button: 'text-gray-500 hover:text-gray-700',
      paginationButton: 'bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400',
      border: 'border-gray-200'
    },
    dark: {
      container: 'bg-slate-800/50 backdrop-blur-sm border-slate-700',
      text: {
        primary: 'text-white',
        secondary: 'text-slate-300',
        tertiary: 'text-slate-400'
      },
      skeleton: 'bg-slate-600',
      skeletonCard: 'bg-slate-700/50',
      icon: 'text-slate-600',
      button: 'text-slate-400 hover:text-white',
      paginationButton: 'bg-slate-700 text-white hover:bg-slate-600 disabled:bg-slate-800 disabled:text-slate-500',
      border: 'border-slate-700'
    }
  };

  const currentTheme = themeClasses[theme];

  useEffect(() => {
    loadAppointments();
  }, [filters, pagination.page]);

  const loadAppointments = async () => {
    setLoading(true);
    try {
      const queryParams = {
        ...filters,
        page: pagination.page,
        limit: pagination.limit
      };

      const response = await staffApiService.getAppointments(queryParams);
      
      if (response.success) {
        setAppointments(response.data.appointments);
        setPagination(prev => ({
          ...prev,
          total: response.data.pagination.total,
          totalPages: response.data.pagination.totalPages
        }));
        setError('');
      }
    } catch (error) {
      console.error('Load appointments error:', error);
      setError(error.message || 'Failed to load appointments');
      
      // Use mock data for development
      setAppointments([
        {
          _id: '1',
          user: { name: 'Rajesh Kumar', email: 'rajesh@example.com', phone: '9876543210' },
          service: { name: 'Aadhaar Card Update', category: 'Identity', fees: 50 },
          appointmentDate: new Date(),
          timeSlot: '10:00 AM',
          status: 'confirmed',
          notes: 'Customer needs to update address'
        },
        {
          _id: '2',
          user: { name: 'Priya Nair', email: 'priya@example.com', phone: '9876543211' },
          service: { name: 'PAN Card Application', category: 'Identity', fees: 110 },
          appointmentDate: new Date(),
          timeSlot: '11:30 AM',
          status: 'pending'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (appointmentId, newStatus, reason = '', notes = '') => {
    try {
      const response = await staffApiService.updateAppointmentStatus(
        appointmentId, 
        newStatus, 
        reason, 
        notes
      );
      
      if (response.success) {
        // Update local state
        setAppointments(prev => 
          prev.map(apt => 
            apt._id === appointmentId 
              ? { ...apt, status: newStatus }
              : apt
          )
        );
        
        // Notify parent component
        if (onAppointmentUpdate) {
          onAppointmentUpdate(appointmentId, newStatus);
        }
      }
    } catch (error) {
      throw error;
    }
  };

  const handleViewDetails = (appointment) => {
    // Toggle expanded state or navigate to details page
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(appointment._id)) {
        newSet.delete(appointment._id);
      } else {
        newSet.add(appointment._id);
      }
      return newSet;
    });
  };

  const handleToggleExpand = (appointmentId) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(appointmentId)) {
        newSet.delete(appointmentId);
      } else {
        newSet.add(appointmentId);
      }
      return newSet;
    });
  };

  const handleSearch = (searchTerm) => {
    setFilters(prev => ({ ...prev, searchTerm }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleFiltersChange = (newFilters) => {
    setFilters(newFilters);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  if (loading && appointments.length === 0) {
    return (
      <div className={`${currentTheme.container} rounded-xl p-6 border`}>
        <div className="flex items-center justify-between mb-4">
          <h2 className={`text-lg font-semibold ${currentTheme.text.primary}`}>{title}</h2>
          <RefreshCw className={`h-5 w-5 ${currentTheme.text.secondary} animate-spin`} />
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className={`${currentTheme.skeletonCard} rounded-lg p-4`}>
              <div className="flex items-center space-x-3">
                <div className={`h-10 w-10 ${currentTheme.skeleton} rounded-full animate-pulse`}></div>
                <div className="flex-1 space-y-2">
                  <div className={`h-4 ${currentTheme.skeleton} rounded animate-pulse w-1/3`}></div>
                  <div className={`h-3 ${currentTheme.skeleton} rounded animate-pulse w-1/2`}></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {showFilters && (
        <AppointmentFilters
          filters={filters}
          onFiltersChange={handleFiltersChange}
          onSearch={handleSearch}
          loading={loading}
        />
      )}

      <div className={`${currentTheme.container} rounded-xl p-6 border`}>
        <div className="flex items-center justify-between mb-6">
          <h2 className={`text-lg font-semibold ${currentTheme.text.primary}`}>{title}</h2>
          <div className="flex items-center space-x-2">
            {loading && <RefreshCw className={`h-5 w-5 ${currentTheme.text.secondary} animate-spin`} />}
            <button
              onClick={loadAppointments}
              disabled={loading}
              className={`p-2 ${currentTheme.button} transition-colors`}
              title="Refresh"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4 mb-4">
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        )}

        {appointments.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className={`h-12 w-12 ${currentTheme.icon} mx-auto mb-4`} />
            <p className={currentTheme.text.secondary}>No appointments found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {appointments.slice(0, maxItems || appointments.length).map((appointment) => (
              <AppointmentCard
                key={appointment._id}
                appointment={appointment}
                onStatusUpdate={handleStatusUpdate}
                onViewDetails={handleViewDetails}
                permissions={permissions}
                expanded={expandedItems.has(appointment._id)}
                onToggleExpand={() => handleToggleExpand(appointment._id)}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {!maxItems && pagination.totalPages > 1 && (
          <div className={`flex items-center justify-between mt-6 pt-4 border-t ${currentTheme.border}`}>
            <p className={`${currentTheme.text.secondary} text-sm`}>
              Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
              {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
              {pagination.total} appointments
            </p>
            <div className="flex space-x-2">
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                disabled={pagination.page === 1}
                className={`px-3 py-1 rounded-md transition-colors ${currentTheme.paginationButton} disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                Previous
              </button>
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                disabled={pagination.page === pagination.totalPages}
                className={`px-3 py-1 rounded-md transition-colors ${currentTheme.paginationButton} disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StaffAppointmentsList;
export { AppointmentStatusBadge, AppointmentCard };