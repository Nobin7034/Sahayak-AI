import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Plus, 
  Minus, 
  Settings, 
  FileText, 
  IndianRupee,
  Clock,
  Users,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  Eye,
  EyeOff,
  Trash2,
  Filter
} from 'lucide-react';
import staffApiService from '../../services/staffApiService';
import { useStaffTheme } from '../../contexts/StaffThemeContext';

const StaffServices = () => {
  const { theme } = useStaffTheme();
  const [availableServices, setAvailableServices] = useState([]);
  const [centerServices, setCenterServices] = useState([]);
  const [hiddenServices, setHiddenServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [viewFilter, setViewFilter] = useState('available'); // available, enabled, hidden
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [serviceSettings, setServiceSettings] = useState({
    availabilityNotes: '',
    customFees: '',
    estimatedDuration: ''
  });

  // Theme-based classes
  const themeClasses = {
    light: {
      background: 'bg-gray-50',
      card: 'bg-white border-gray-200',
      header: 'bg-white border-gray-200',
      text: {
        primary: 'text-gray-900',
        secondary: 'text-gray-600',
        tertiary: 'text-gray-500'
      },
      button: {
        primary: 'bg-blue-600 hover:bg-blue-700 text-white',
        secondary: 'bg-gray-100 hover:bg-gray-200 text-gray-700',
        success: 'bg-green-100 hover:bg-green-200 text-green-700',
        danger: 'bg-red-100 hover:bg-red-200 text-red-700',
        warning: 'bg-yellow-100 hover:bg-yellow-200 text-yellow-700'
      },
      input: 'bg-white border-gray-300 text-gray-900 focus:ring-blue-500 focus:border-blue-500',
      select: 'bg-white border-gray-300 text-gray-900 focus:ring-blue-500 focus:border-blue-500'
    },
    dark: {
      background: 'bg-slate-900',
      card: 'bg-slate-800 border-slate-700',
      header: 'bg-slate-800 border-slate-700',
      text: {
        primary: 'text-white',
        secondary: 'text-slate-300',
        tertiary: 'text-slate-400'
      },
      button: {
        primary: 'bg-blue-600 hover:bg-blue-700 text-white',
        secondary: 'bg-slate-600 hover:bg-slate-700 text-white',
        success: 'bg-green-600 hover:bg-green-700 text-white',
        danger: 'bg-red-600 hover:bg-red-700 text-white',
        warning: 'bg-yellow-600 hover:bg-yellow-700 text-white'
      },
      input: 'bg-slate-700 border-slate-600 text-white focus:ring-blue-500 focus:border-blue-500',
      select: 'bg-slate-700 border-slate-600 text-white focus:ring-blue-500 focus:border-blue-500'
    }
  };

  const currentTheme = themeClasses[theme];

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    try {
      setLoading(true);
      
      // Load all services (now includes status for this center)
      const availableResponse = await staffApiService.getAvailableServices();

      if (availableResponse.success) {
        setAvailableServices(availableResponse.data);
        
        // Extract center services and hidden services from the available services
        const enabled = availableResponse.data.filter(service => service.isEnabled);
        const hidden = availableResponse.data.filter(service => service.isHidden);
        
        setCenterServices(enabled);
        setHiddenServices(hidden);
      }

      setError('');
    } catch (error) {
      console.error('Load services error:', error);
      setError('Failed to load services');
    } finally {
      setLoading(false);
    }
  };

  const handleServiceToggle = async (serviceId, enabled) => {
    try {
      const response = await staffApiService.toggleServiceAvailability(serviceId, enabled);
      if (response.success) {
        loadServices();
      }
    } catch (error) {
      console.error('Service toggle error:', error);
      setError('Failed to update service availability');
    }
  };

  const handleServiceHide = async (serviceId, hidden) => {
    try {
      const response = await staffApiService.toggleServiceVisibility(serviceId, hidden);
      if (response.success) {
        loadServices();
      }
    } catch (error) {
      console.error('Service hide error:', error);
      setError('Failed to update service visibility');
    }
  };

  const handleServiceSettings = async (serviceId, settings) => {
    try {
      const response = await staffApiService.updateServiceSettings(serviceId, settings);
      if (response.success) {
        loadServices();
        setShowSettingsModal(false);
        setSelectedService(null);
      }
    } catch (error) {
      console.error('Service settings error:', error);
      setError('Failed to update service settings');
    }
  };

  const getServiceStatus = (serviceId) => {
    return availableServices.find(s => s._id === serviceId);
  };

  const isServiceEnabled = (serviceId) => {
    const service = getServiceStatus(serviceId);
    return service && service.isEnabled;
  };

  const isServiceHidden = (serviceId) => {
    const service = getServiceStatus(serviceId);
    return service && service.isHidden;
  };

  const getDisplayServices = () => {
    let services = [];
    
    switch (viewFilter) {
      case 'available':
        // Show all services that are not hidden by this center
        services = availableServices.filter(service => !service.isHidden);
        break;
      case 'enabled':
        // Show only services that are enabled at this center
        services = availableServices.filter(service => service.isEnabled);
        break;
      case 'hidden':
        // Show services that are hidden by this center
        services = availableServices.filter(service => service.isHidden);
        break;
      default:
        services = availableServices.filter(service => !service.isHidden);
    }

    return services.filter(service => {
      const matchesSearch = service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           service.description?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = categoryFilter === 'all' || service.category === categoryFilter;
      
      return matchesSearch && matchesCategory;
    });
  };

  const filteredServices = getDisplayServices();
  const allServices = availableServices; // Now all services are in availableServices
  const categories = [...new Set(allServices.map(s => s.category))];

  // Calculate counts for display
  const availableCount = availableServices.filter(s => !s.isHidden).length;
  const enabledCount = availableServices.filter(s => s.isEnabled).length;
  const hiddenCount = availableServices.filter(s => s.isHidden).length;

  if (loading) {
    return (
      <div className={`min-h-screen ${currentTheme.background} flex items-center justify-center`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className={`mt-4 ${currentTheme.text.secondary}`}>Loading services...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${currentTheme.background}`}>
      {/* Header */}
      <div className={`${currentTheme.header} shadow-sm border-b`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className={`text-2xl font-bold ${currentTheme.text.primary}`}>Service Management</h1>
                <p className={`text-sm ${currentTheme.text.secondary} mt-1`}>
                  Manage services available at your center
                </p>
              </div>
              
              <button
                onClick={loadServices}
                disabled={loading}
                className={`flex items-center px-3 py-2 text-sm ${currentTheme.text.secondary} hover:${currentTheme.text.primary} 
                         disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className={`${currentTheme.header} border-b`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            
            {/* View Filter */}
            <select
              value={viewFilter}
              onChange={(e) => setViewFilter(e.target.value)}
              className={`px-3 py-2 border rounded-md focus:ring-2 ${currentTheme.select}`}
            >
              <option value="available">Available Services ({availableCount})</option>
              <option value="enabled">Enabled Services ({enabledCount})</option>
              <option value="hidden">Hidden Services ({hiddenCount})</option>
            </select>

            {/* Search */}
            <div className="relative">
              <Search className={`h-4 w-4 absolute left-3 top-3 ${currentTheme.text.tertiary}`} />
              <input
                type="text"
                placeholder="Search services..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full pl-10 pr-4 py-2 border rounded-md focus:ring-2 ${currentTheme.input}`}
              />
            </div>

            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className={`px-3 py-2 border rounded-md focus:ring-2 ${currentTheme.select}`}
            >
              <option value="all">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>

            {/* Stats */}
            <div className={`flex items-center justify-center px-3 py-2 ${currentTheme.text.secondary} text-sm`}>
              Showing {filteredServices.length} services
            </div>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
              <span className="text-red-800">{error}</span>
            </div>
          </div>
        </div>
      )}

      {/* Services Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredServices.map((service) => {
            const isEnabled = service.isEnabled;
            const isHidden = service.isHidden;
            
            return (
              <div 
                key={service._id} 
                className={`${currentTheme.card} rounded-lg shadow-sm border p-6 transition-all ${
                  isEnabled ? 'border-green-200 bg-green-50/50' : 
                  isHidden ? 'border-red-200 bg-red-50/50' : ''
                }`}
              >
                {/* Service Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className={`text-lg font-semibold ${currentTheme.text.primary}`}>{service.name}</h3>
                    <p className={`text-sm ${currentTheme.text.secondary} mt-1`}>{service.category}</p>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {isEnabled && <CheckCircle className="h-5 w-5 text-green-600" />}
                    {isHidden && <EyeOff className="h-5 w-5 text-red-600" />}
                    {!isEnabled && !isHidden && (
                      <div className="h-5 w-5 rounded-full border-2 border-gray-300" title="Available but not enabled" />
                    )}
                  </div>
                </div>

                {/* Service Details */}
                <div className={`space-y-2 text-sm ${currentTheme.text.secondary} mb-4`}>
                  <div className="flex items-center">
                    <IndianRupee className="h-4 w-4 mr-2" />
                    <span>₹{service.fees}</span>
                  </div>
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-2" />
                    <span>{service.processingTime}</span>
                  </div>
                  {service.description && (
                    <p className={`${currentTheme.text.secondary} text-sm mt-2 line-clamp-2`}>
                      {service.description}
                    </p>
                  )}
                </div>

                {/* Center-specific Settings */}
                {isEnabled && service.centerStatus && (
                  <div className={`${currentTheme.card} rounded-md border p-3 mb-4`}>
                    <h4 className={`text-sm font-medium ${currentTheme.text.primary} mb-2`}>Center Settings</h4>
                    {service.availabilityNotes && (
                      <p className={`text-xs ${currentTheme.text.secondary} mb-1`}>
                        <strong>Notes:</strong> {service.availabilityNotes}
                      </p>
                    )}
                    {service.customFees && (
                      <p className={`text-xs ${currentTheme.text.secondary} mb-1`}>
                        <strong>Custom Fees:</strong> ₹{service.customFees}
                      </p>
                    )}
                    {service.estimatedDuration && (
                      <p className={`text-xs ${currentTheme.text.secondary}`}>
                        <strong>Duration:</strong> {service.estimatedDuration} mins
                      </p>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => {
                        setSelectedService(service);
                        setServiceSettings({
                          availabilityNotes: service.availabilityNotes || '',
                          customFees: service.customFees || '',
                          estimatedDuration: service.estimatedDuration || ''
                        });
                        setShowSettingsModal(true);
                      }}
                      className={`p-2 ${currentTheme.text.tertiary} hover:${currentTheme.text.primary}`}
                      title="Service Settings"
                    >
                      <Settings className="h-4 w-4" />
                    </button>
                    
                    <button
                      className={`p-2 ${currentTheme.text.tertiary} hover:${currentTheme.text.primary}`}
                      title="View Details"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="flex space-x-2">
                    {/* Hide/Unhide Button */}
                    {!isHidden ? (
                      <button
                        onClick={() => handleServiceHide(service._id, true)}
                        className={`flex items-center px-3 py-1 rounded-md text-sm font-medium transition-colors ${currentTheme.button.warning}`}
                        title="Hide service from your center"
                      >
                        <EyeOff className="h-4 w-4 mr-1" />
                        Hide
                      </button>
                    ) : (
                      <button
                        onClick={() => handleServiceHide(service._id, false)}
                        className={`flex items-center px-3 py-1 rounded-md text-sm font-medium transition-colors ${currentTheme.button.success}`}
                        title="Unhide service"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Unhide
                      </button>
                    )}

                    {/* Enable/Disable Button */}
                    {!isHidden && (
                      <button
                        onClick={() => handleServiceToggle(service._id, !isEnabled)}
                        className={`flex items-center px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                          isEnabled ? currentTheme.button.danger : currentTheme.button.success
                        }`}
                      >
                        {isEnabled ? (
                          <>
                            <Minus className="h-4 w-4 mr-1" />
                            Disable
                          </>
                        ) : (
                          <>
                            <Plus className="h-4 w-4 mr-1" />
                            Enable
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* No Services */}
        {filteredServices.length === 0 && (
          <div className="text-center py-12">
            <FileText className={`h-12 w-12 ${currentTheme.text.tertiary} mx-auto mb-4`} />
            <h3 className={`text-lg font-medium ${currentTheme.text.primary} mb-2`}>No services found</h3>
            <p className={currentTheme.text.secondary}>
              {searchTerm || categoryFilter !== 'all'
                ? 'Try adjusting your search criteria or filters.'
                : `No ${viewFilter} services available.`
              }
            </p>
          </div>
        )}
      </div>

      {/* Service Settings Modal */}
      {showSettingsModal && selectedService && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`${currentTheme.card} rounded-lg max-w-md w-full p-6`}>
            <h3 className={`text-lg font-semibold ${currentTheme.text.primary} mb-4`}>
              Service Settings - {selectedService.name}
            </h3>
            
            <div className="space-y-4">
              {/* Availability Notes */}
              <div>
                <label className={`block text-sm font-medium ${currentTheme.text.primary} mb-1`}>
                  Availability Notes
                </label>
                <textarea
                  value={serviceSettings.availabilityNotes}
                  onChange={(e) => setServiceSettings(prev => ({ 
                    ...prev, 
                    availabilityNotes: e.target.value 
                  }))}
                  rows={3}
                  className={`w-full px-3 py-2 border rounded-md focus:ring-2 ${currentTheme.input}`}
                  placeholder="Special requirements, equipment needed, etc."
                />
              </div>

              {/* Custom Fees */}
              <div>
                <label className={`block text-sm font-medium ${currentTheme.text.primary} mb-1`}>
                  Custom Fees (Optional)
                </label>
                <div className="relative">
                  <IndianRupee className={`h-4 w-4 absolute left-3 top-3 ${currentTheme.text.tertiary}`} />
                  <input
                    type="number"
                    value={serviceSettings.customFees}
                    onChange={(e) => setServiceSettings(prev => ({ 
                      ...prev, 
                      customFees: e.target.value 
                    }))}
                    className={`w-full pl-10 pr-4 py-2 border rounded-md focus:ring-2 ${currentTheme.input}`}
                    placeholder="Override default fees"
                  />
                </div>
                <p className={`text-xs ${currentTheme.text.tertiary} mt-1`}>
                  Default: ₹{selectedService.fees}
                </p>
              </div>

              {/* Estimated Duration */}
              <div>
                <label className={`block text-sm font-medium ${currentTheme.text.primary} mb-1`}>
                  Estimated Duration (Minutes)
                </label>
                <input
                  type="number"
                  value={serviceSettings.estimatedDuration}
                  onChange={(e) => setServiceSettings(prev => ({ 
                    ...prev, 
                    estimatedDuration: e.target.value 
                  }))}
                  className={`w-full px-3 py-2 border rounded-md focus:ring-2 ${currentTheme.input}`}
                  placeholder="Processing time at your center"
                />
                <p className={`text-xs ${currentTheme.text.tertiary} mt-1`}>
                  Default: {selectedService.processingTime}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowSettingsModal(false);
                  setSelectedService(null);
                }}
                className={`px-4 py-2 rounded-md ${currentTheme.button.secondary}`}
              >
                Cancel
              </button>
              <button
                onClick={() => handleServiceSettings(selectedService._id, serviceSettings)}
                className={`px-4 py-2 rounded-md ${currentTheme.button.primary}`}
              >
                Save Settings
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffServices;