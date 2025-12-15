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
  Edit
} from 'lucide-react';
import axios from 'axios';

const StaffServices = () => {
  const [availableServices, setAvailableServices] = useState([]);
  const [centerServices, setCenterServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [serviceSettings, setServiceSettings] = useState({
    availabilityNotes: '',
    customFees: '',
    estimatedDuration: ''
  });

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    try {
      setLoading(true);
      
      // Load available services and center services
      const [availableResponse, centerResponse] = await Promise.all([
        axios.get('/api/staff/services/available', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }),
        axios.get('/api/staff/services/center', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        })
      ]);

      if (availableResponse.data.success) {
        setAvailableServices(availableResponse.data.data);
      }

      if (centerResponse.data.success) {
        setCenterServices(centerResponse.data.data);
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
      const response = await axios.put(
        `/api/staff/services/${serviceId}/toggle`,
        { enabled },
        {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }
      );

      if (response.data.success) {
        // Refresh services
        loadServices();
      }
    } catch (error) {
      console.error('Service toggle error:', error);
      setError('Failed to update service availability');
    }
  };

  const handleServiceSettings = async (serviceId, settings) => {
    try {
      const response = await axios.put(
        `/api/staff/services/${serviceId}/settings`,
        settings,
        {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }
      );

      if (response.data.success) {
        loadServices();
        setShowAddModal(false);
        setSelectedService(null);
      }
    } catch (error) {
      console.error('Service settings error:', error);
      setError('Failed to update service settings');
    }
  };

  const getServiceStatus = (serviceId) => {
    return centerServices.find(s => s._id === serviceId);
  };

  const isServiceEnabled = (serviceId) => {
    const centerService = getServiceStatus(serviceId);
    return centerService && centerService.isEnabled;
  };

  const filteredServices = availableServices.filter(service => {
    const matchesSearch = service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         service.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = categoryFilter === 'all' || service.category === categoryFilter;
    
    return matchesSearch && matchesCategory;
  });

  const categories = [...new Set(availableServices.map(s => s.category))];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading services...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Service Management</h1>
                <p className="text-sm text-gray-600 mt-1">
                  Manage services available at your center
                </p>
              </div>
              
              <button
                onClick={loadServices}
                disabled={loading}
                className="flex items-center px-3 py-2 text-sm text-gray-600 hover:text-gray-900 
                         disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Search */}
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search services..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md 
                         focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md 
                       focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
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
            const isEnabled = isServiceEnabled(service._id);
            const centerService = getServiceStatus(service._id);
            
            return (
              <div 
                key={service._id} 
                className={`bg-white rounded-lg shadow-sm border p-6 transition-all ${
                  isEnabled ? 'border-green-200 bg-green-50' : 'border-gray-200'
                }`}
              >
                {/* Service Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">{service.name}</h3>
                    <p className="text-sm text-gray-600 mt-1">{service.category}</p>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {isEnabled ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <div className="h-5 w-5 rounded-full border-2 border-gray-300" />
                    )}
                  </div>
                </div>

                {/* Service Details */}
                <div className="space-y-2 text-sm text-gray-600 mb-4">
                  <div className="flex items-center">
                    <IndianRupee className="h-4 w-4 mr-2" />
                    <span>₹{service.fees}</span>
                  </div>
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-2" />
                    <span>{service.processingTime}</span>
                  </div>
                  {service.description && (
                    <p className="text-gray-600 text-sm mt-2 line-clamp-2">
                      {service.description}
                    </p>
                  )}
                </div>

                {/* Center-specific Settings */}
                {isEnabled && centerService && (
                  <div className="bg-white rounded-md border p-3 mb-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Center Settings</h4>
                    {centerService.availabilityNotes && (
                      <p className="text-xs text-gray-600 mb-1">
                        <strong>Notes:</strong> {centerService.availabilityNotes}
                      </p>
                    )}
                    {centerService.customFees && (
                      <p className="text-xs text-gray-600 mb-1">
                        <strong>Custom Fees:</strong> ₹{centerService.customFees}
                      </p>
                    )}
                    {centerService.estimatedDuration && (
                      <p className="text-xs text-gray-600">
                        <strong>Duration:</strong> {centerService.estimatedDuration} mins
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
                          availabilityNotes: centerService?.availabilityNotes || '',
                          customFees: centerService?.customFees || '',
                          estimatedDuration: centerService?.estimatedDuration || ''
                        });
                        setShowAddModal(true);
                      }}
                      className="p-2 text-gray-400 hover:text-blue-600"
                      title="Service Settings"
                    >
                      <Settings className="h-4 w-4" />
                    </button>
                    
                    <button
                      className="p-2 text-gray-400 hover:text-gray-600"
                      title="View Details"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  </div>

                  <button
                    onClick={() => handleServiceToggle(service._id, !isEnabled)}
                    className={`flex items-center px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                      isEnabled
                        ? 'bg-red-100 text-red-700 hover:bg-red-200'
                        : 'bg-green-100 text-green-700 hover:bg-green-200'
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
                </div>
              </div>
            );
          })}
        </div>

        {/* No Services */}
        {filteredServices.length === 0 && (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No services found</h3>
            <p className="text-gray-500">
              {searchTerm || categoryFilter !== 'all'
                ? 'Try adjusting your search criteria or filters.'
                : 'No services are available for configuration.'
              }
            </p>
          </div>
        )}
      </div>

      {/* Service Settings Modal */}
      {showAddModal && selectedService && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Service Settings - {selectedService.name}
            </h3>
            
            <div className="space-y-4">
              {/* Availability Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Availability Notes
                </label>
                <textarea
                  value={serviceSettings.availabilityNotes}
                  onChange={(e) => setServiceSettings(prev => ({ 
                    ...prev, 
                    availabilityNotes: e.target.value 
                  }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md 
                           focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Special requirements, equipment needed, etc."
                />
              </div>

              {/* Custom Fees */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Custom Fees (Optional)
                </label>
                <div className="relative">
                  <IndianRupee className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
                  <input
                    type="number"
                    value={serviceSettings.customFees}
                    onChange={(e) => setServiceSettings(prev => ({ 
                      ...prev, 
                      customFees: e.target.value 
                    }))}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md 
                             focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Override default fees"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Default: ₹{selectedService.fees}
                </p>
              </div>

              {/* Estimated Duration */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Estimated Duration (Minutes)
                </label>
                <input
                  type="number"
                  value={serviceSettings.estimatedDuration}
                  onChange={(e) => setServiceSettings(prev => ({ 
                    ...prev, 
                    estimatedDuration: e.target.value 
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md 
                           focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Processing time at your center"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Default: {selectedService.processingTime}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setSelectedService(null);
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={() => handleServiceSettings(selectedService._id, serviceSettings)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
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