import React, { useState, useEffect } from 'react';
import { 
  Edit, 
  Trash2, 
  MapPin, 
  Phone, 
  Mail, 
  Clock,
  Users,
  Search,
  AlertTriangle,
  Settings,
  CheckCircle,
  XCircle
} from 'lucide-react';
import axios from 'axios';

const AdminCenters = () => {
  const [centers, setCenters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingCenter, setEditingCenter] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Service management states
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [selectedCenter, setSelectedCenter] = useState(null);
  const [availableServices, setAvailableServices] = useState([]);
  const [centerServices, setCenterServices] = useState([]);
  const [loadingServices, setLoadingServices] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    address: {
      street: '',
      city: '',
      district: '',
      state: 'Kerala',
      pincode: ''
    },
    contact: {
      phone: '',
      email: ''
    },
    operatingHours: {
      monday: { open: '09:00', close: '17:00', isOpen: true },
      tuesday: { open: '09:00', close: '17:00', isOpen: true },
      wednesday: { open: '09:00', close: '17:00', isOpen: true },
      thursday: { open: '09:00', close: '17:00', isOpen: true },
      friday: { open: '09:00', close: '17:00', isOpen: true },
      saturday: { open: '09:00', close: '17:00', isOpen: true },
      sunday: { open: '10:00', close: '16:00', isOpen: false }
    },
    capacity: {
      maxAppointmentsPerDay: 50
    },
    status: 'active'
  });

  useEffect(() => {
    loadCenters();
    
    // Add visibility change listener to refresh when page becomes visible
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadCenters();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Cleanup listener on unmount
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const loadCenters = async () => {
    try {
      setLoading(true);
      // Use admin endpoint to get all centers including inactive ones
      const response = await fetch('/api/centers/admin/all', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to load centers');
      }
      
      const data = await response.json();
      setCenters(data.centers || []);
    } catch (error) {
      console.error('Error loading centers:', error);
      setError('Failed to load centers');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      if (editingCenter) {
        // Update existing center
        await updateCenter();
      } else {
        // Create new center
        await createCenter();
      }
      
      setShowModal(false);
      resetForm();
      loadCenters();
    } catch (error) {
      console.error('Error saving center:', error);
      setError(error.message || 'Failed to save center');
    }
  };

  const createCenter = async () => {
    const response = await fetch('/api/centers', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(formData)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to create center');
    }
  };

  const updateCenter = async () => {
    const response = await fetch(`/api/centers/${editingCenter._id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(formData)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to update center');
    }
  };

  const handleEdit = (center) => {
    setEditingCenter(center);
    setFormData({
      name: center.name,
      address: center.address,
      contact: center.contact,
      operatingHours: center.operatingHours,
      capacity: center.capacity,
      status: center.status
    });
    setShowModal(true);
  };

  const handleDelete = async (centerId) => {
    if (!confirm('Are you sure you want to deactivate this center? This will also deactivate the associated staff member.')) return;

    try {
      const response = await fetch(`/api/centers/${centerId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to deactivate center');
      }

      // Show success message
      setError(''); // Clear any previous errors
      loadCenters(); // Reload to show updated status
    } catch (error) {
      console.error('Error deactivating center:', error);
      setError('Failed to deactivate center');
    }
  };

  const toggleUserStatusFromCenter = async (userId, currentStatus, userName) => {
    if (!confirm(`Are you sure you want to ${currentStatus ? 'deactivate' : 'activate'} user "${userName}"?`)) {
      return;
    }

    try {
      const response = await axios.patch(`/api/admin/users/${userId}/status`, {
        isActive: !currentStatus
      }, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.data.success) {
        // Refresh centers to show updated user status
        loadCenters();
        const statusText = !currentStatus ? 'activated' : 'deactivated';
        alert(`User ${statusText} successfully!`);
      }
    } catch (error) {
      console.error('Toggle user status error:', error);
      alert('Failed to update user status');
    }
  };

  const handlePermanentDelete = async (centerId, centerName) => {
    const confirmMessage = `⚠️ PERMANENT DELETE WARNING ⚠️

This will PERMANENTLY DELETE the center "${centerName}" and ALL associated data including:
- Center record
- Staff user account
- All appointments
- All related data

This action CANNOT be undone!

Type "DELETE" to confirm permanent deletion:`;

    const userInput = prompt(confirmMessage);
    
    if (userInput !== 'DELETE') {
      return; // User cancelled or didn't type DELETE
    }

    try {
      const response = await fetch(`/api/centers/${centerId}/permanent`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to permanently delete center');
      }

      // Show success message
      setError(''); // Clear any previous errors
      loadCenters(); // Reload to show updated list
      alert('Center permanently deleted successfully');
    } catch (error) {
      console.error('Error permanently deleting center:', error);
      setError('Failed to permanently delete center: ' + error.message);
    }
  };

  const handleBulkDelete = async () => {
    const inactiveCenters = filteredCenters.filter(center => center.status === 'inactive');
    
    if (inactiveCenters.length === 0) {
      alert('No inactive centers found to delete.');
      return;
    }

    const confirmMessage = `⚠️ BULK PERMANENT DELETE WARNING ⚠️

This will PERMANENTLY DELETE ${inactiveCenters.length} inactive centers and ALL associated data including:
- All center records
- All staff user accounts
- All appointments
- All related data

This action CANNOT be undone!

Centers to be deleted:
${inactiveCenters.map(c => `- ${c.name}`).join('\n')}

Type "DELETE ALL" to confirm bulk permanent deletion:`;

    const userInput = prompt(confirmMessage);
    
    if (userInput !== 'DELETE ALL') {
      return; // User cancelled or didn't type DELETE ALL
    }

    try {
      setLoading(true);
      let deletedCount = 0;
      let errors = [];

      // Delete each inactive center
      for (const center of inactiveCenters) {
        try {
          const response = await fetch(`/api/centers/${center._id}/permanent`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          });

          if (response.ok) {
            deletedCount++;
          } else {
            const errorData = await response.json();
            errors.push(`${center.name}: ${errorData.message}`);
          }
        } catch (error) {
          errors.push(`${center.name}: ${error.message}`);
        }
      }

      // Show results
      if (deletedCount > 0) {
        alert(`Successfully deleted ${deletedCount} centers.${errors.length > 0 ? `\n\nErrors:\n${errors.join('\n')}` : ''}`);
      } else {
        alert(`Failed to delete centers:\n${errors.join('\n')}`);
      }

      // Reload centers
      loadCenters();
    } catch (error) {
      console.error('Error in bulk delete:', error);
      setError('Failed to perform bulk delete: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEditingCenter(null);
    setFormData({
      name: '',
      address: {
        street: '',
        city: '',
        district: '',
        state: 'Kerala',
        pincode: ''
      },
      contact: {
        phone: '',
        email: ''
      },
      operatingHours: {
        monday: { open: '09:00', close: '17:00', isOpen: true },
        tuesday: { open: '09:00', close: '17:00', isOpen: true },
        wednesday: { open: '09:00', close: '17:00', isOpen: true },
        thursday: { open: '09:00', close: '17:00', isOpen: true },
        friday: { open: '09:00', close: '17:00', isOpen: true },
        saturday: { open: '09:00', close: '17:00', isOpen: true },
        sunday: { open: '10:00', close: '16:00', isOpen: false }
      },
      capacity: {
        maxAppointmentsPerDay: 50
      },
      status: 'active'
    });
  };

  // Service Management Functions
  const openServiceModal = async (center) => {
    setSelectedCenter(center);
    setShowServiceModal(true);
    await loadServicesForCenter(center._id);
  };

  const loadServicesForCenter = async (centerId) => {
    try {
      setLoadingServices(true);
      
      // Load all available services
      const servicesResponse = await axios.get('/api/admin/services', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      
      // Load center's current services
      const centerResponse = await axios.get(`/api/admin/centers/${centerId}/services`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      
      setAvailableServices(servicesResponse.data.data || []);
      setCenterServices(centerResponse.data.services || []);
    } catch (error) {
      console.error('Error loading services:', error);
      setError('Failed to load services');
    } finally {
      setLoadingServices(false);
    }
  };

  const toggleServiceForCenter = async (serviceId, isEnabled) => {
    try {
      const endpoint = isEnabled 
        ? `/api/admin/centers/${selectedCenter._id}/services/${serviceId}`
        : `/api/admin/centers/${selectedCenter._id}/services/${serviceId}`;
      
      const method = isEnabled ? 'POST' : 'DELETE';
      
      await axios({
        method,
        url: endpoint,
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      
      // Reload services for the center
      await loadServicesForCenter(selectedCenter._id);
    } catch (error) {
      console.error('Error toggling service:', error);
      setError('Failed to update service');
    }
  };

  const enableAllServicesForCenter = async () => {
    try {
      await axios.post(`/api/admin/centers/${selectedCenter._id}/services/enable-all`, {}, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      
      // Reload services for the center
      await loadServicesForCenter(selectedCenter._id);
      alert('All services enabled successfully!');
    } catch (error) {
      console.error('Error enabling all services:', error);
      setError('Failed to enable all services');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const filteredCenters = centers.filter(center => {
    const matchesSearch = center.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         center.address.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         center.address.district.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || center.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Akshaya Centers</h1>
          <p className="text-gray-600">Manage Akshaya service centers</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> Centers are now registered by staff during their registration process. 
            Use the Staff Management section to approve pending staff applications and activate their centers.
          </p>
        </div>
        
        {/* Show warning for inactive centers */}
        {statusFilter === 'inactive' && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start">
              <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 mr-2" />
              <div>
                <p className="text-sm text-red-800">
                  <strong>Inactive Centers:</strong> These centers are deactivated and not visible to users. 
                  You can permanently delete inactive centers by clicking the warning icon (⚠️). 
                </p>
                <p className="text-xs text-red-700 mt-1">
                  <strong>Warning:</strong> Permanent deletion cannot be undone and will remove all associated data including staff accounts and appointments.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search centers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          <div className="sm:w-48">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="maintenance">Maintenance</option>
            </select>
          </div>
          
          {/* Refresh Button */}
          <div className="sm:w-auto">
            <button
              onClick={loadCenters}
              disabled={loading}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center"
              title="Refresh centers data"
            >
              <Settings className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
          
          {/* Bulk delete button for inactive centers */}
          {statusFilter === 'inactive' && filteredCenters.length > 0 && (
            <div className="sm:w-auto">
              <button
                onClick={() => handleBulkDelete()}
                className="w-full px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center justify-center"
                title="Permanently delete all inactive centers"
              >
                <AlertTriangle className="h-4 w-4 mr-2" />
                Delete All Inactive
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Centers Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredCenters.map((center) => (
          <div key={center._id} className={`bg-white rounded-lg shadow-sm border p-6 ${
            center.registeredBy && !center.registeredBy.isActive 
              ? 'border-red-200 bg-red-50/30' 
              : ''
          }`}>
            {/* Warning banner for inactive users */}
            {center.registeredBy && !center.registeredBy.isActive && (
              <div className="mb-4 p-2 bg-red-100 border border-red-300 rounded-md">
                <div className="flex items-center text-sm text-red-800">
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  <span>Staff user is inactive - center may not be operational</span>
                </div>
              </div>
            )}
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900">{center.name}</h3>
                <p className="text-sm text-gray-600 flex items-center mt-1">
                  <MapPin className="h-4 w-4 mr-1" />
                  {center.address.city}, {center.address.district}
                </p>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                center.status === 'active' 
                  ? 'bg-green-100 text-green-800'
                  : center.status === 'maintenance'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-red-100 text-red-800'
              }`}>
                {center.status}
              </span>
            </div>

            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-center">
                <Phone className="h-4 w-4 mr-2" />
                {center.contact.phone}
              </div>
              <div className="flex items-center">
                <Mail className="h-4 w-4 mr-2" />
                {center.contact.email}
              </div>
              <div className="flex items-center">
                <Users className="h-4 w-4 mr-2" />
                {center.capacity?.maxAppointmentsPerDay || 50} appointments/day
              </div>
              {center.registeredBy && (
                <div className="space-y-1">
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-2" />
                    Staff: {center.registeredBy.name}
                  </div>
                  <div className="flex items-center">
                    {center.registeredBy.isActive ? (
                      <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 mr-2 text-red-600" />
                    )}
                  <div className="flex items-center justify-between">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      center.registeredBy.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      User {center.registeredBy.isActive ? 'Active' : 'Inactive'}
                    </span>
                    <button
                      onClick={() => toggleUserStatusFromCenter(
                        center.registeredBy._id, 
                        center.registeredBy.isActive, 
                        center.registeredBy.name
                      )}
                      className={`text-xs px-2 py-1 rounded-md border ${
                        center.registeredBy.isActive
                          ? 'border-red-300 text-red-700 hover:bg-red-50'
                          : 'border-green-300 text-green-700 hover:bg-green-50'
                      }`}
                      title={`${center.registeredBy.isActive ? 'Deactivate' : 'Activate'} user`}
                    >
                      {center.registeredBy.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                  </div>
                  </div>
                  {center.registeredBy.approvalStatus && (
                    <div className="flex items-center">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        center.registeredBy.approvalStatus === 'approved' 
                          ? 'bg-blue-100 text-blue-800' 
                          : center.registeredBy.approvalStatus === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {center.registeredBy.approvalStatus}
                      </span>
                    </div>
                  )}
                </div>
              )}
              {center.metadata && (
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-2" />
                  {center.metadata.visitCount || 0} visits
                </div>
              )}
            </div>

            <div className="flex items-center justify-end space-x-2 mt-4 pt-4 border-t">
              <button
                onClick={() => openServiceModal(center)}
                className="p-2 text-green-600 hover:bg-green-50 rounded-md"
                title="Manage Services"
              >
                <Settings className="h-4 w-4" />
              </button>
              
              <button
                onClick={() => handleEdit(center)}
                className="p-2 text-blue-600 hover:bg-blue-50 rounded-md"
                title="Edit Center"
              >
                <Edit className="h-4 w-4" />
              </button>
              
              {center.status === 'active' ? (
                <button
                  onClick={() => handleDelete(center._id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-md"
                  title="Deactivate Center"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              ) : (
                <button
                  onClick={() => handlePermanentDelete(center._id, center.name)}
                  className="p-2 text-red-700 hover:bg-red-100 rounded-md border border-red-300"
                  title="Permanently Delete Center (Cannot be undone!)"
                >
                  <AlertTriangle className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredCenters.length === 0 && (
        <div className="text-center py-12">
          <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No centers found</h3>
          <p className="text-gray-600">
            {searchTerm || statusFilter !== 'all' 
              ? 'Try adjusting your search or filter criteria.'
              : 'Get started by adding your first Akshaya center.'
            }
          </p>
        </div>
      )}

      {/* Modal for Add/Edit Center */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                {editingCenter ? 'Edit Center' : 'Add New Center'}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Basic Information */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Center Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* Address */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Street Address *
                    </label>
                    <input
                      type="text"
                      name="address.street"
                      value={formData.address.street}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      City *
                    </label>
                    <input
                      type="text"
                      name="address.city"
                      value={formData.address.city}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      District *
                    </label>
                    <input
                      type="text"
                      name="address.district"
                      value={formData.address.district}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Pincode *
                    </label>
                    <input
                      type="text"
                      name="address.pincode"
                      value={formData.address.pincode}
                      onChange={handleInputChange}
                      pattern="[0-9]{6}"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Contact */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone *
                    </label>
                    <input
                      type="tel"
                      name="contact.phone"
                      value={formData.contact.phone}
                      onChange={handleInputChange}
                      pattern="^\+91[0-9]{10}$"
                      placeholder="+919876543210"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email *
                    </label>
                    <input
                      type="email"
                      name="contact.email"
                      value={formData.contact.email}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Capacity and Status */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Max Appointments/Day
                    </label>
                    <input
                      type="number"
                      name="capacity.maxAppointmentsPerDay"
                      value={formData.capacity.maxAppointmentsPerDay}
                      onChange={handleInputChange}
                      min="1"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="maintenance">Maintenance</option>
                    </select>
                  </div>
                </div>

                {/* Form Actions */}
                <div className="flex items-center justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    {editingCenter ? 'Update Center' : 'Create Center'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Service Management Modal */}
      {showServiceModal && selectedCenter && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">
                  Manage Services - {selectedCenter.name}
                </h2>
                <button
                  onClick={() => setShowServiceModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>

              {loadingServices ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Quick Actions */}
                  <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                    <div>
                      <h3 className="font-medium text-blue-900">Quick Actions</h3>
                      <p className="text-sm text-blue-700">Enable all services for this center at once</p>
                    </div>
                    <button
                      onClick={enableAllServicesForCenter}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Enable All Services
                    </button>
                  </div>

                  {/* Services List */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Available Services</h3>
                    
                    {availableServices.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-gray-500">No services available</p>
                      </div>
                    ) : (
                      <div className="grid gap-4">
                        {availableServices.map((service) => {
                          const isEnabled = centerServices.some(cs => cs._id === service._id);
                          
                          return (
                            <div key={service._id} className="border rounded-lg p-4">
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center space-x-3">
                                    <h4 className="font-medium text-gray-900">{service.name}</h4>
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                      isEnabled 
                                        ? 'bg-green-100 text-green-800'
                                        : 'bg-gray-100 text-gray-800'
                                    }`}>
                                      {isEnabled ? 'Enabled' : 'Disabled'}
                                    </span>
                                  </div>
                                  <p className="text-sm text-gray-600 mt-1">{service.description}</p>
                                  <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                                    <span>Category: {service.category}</span>
                                    <span>Fee: ₹{service.fee}</span>
                                    <span>Processing: {service.processingTime} mins</span>
                                  </div>
                                </div>
                                
                                <div className="flex items-center space-x-2">
                                  <button
                                    onClick={() => toggleServiceForCenter(service._id, !isEnabled)}
                                    className={`px-3 py-1 rounded-md text-sm font-medium ${
                                      isEnabled
                                        ? 'bg-red-100 text-red-700 hover:bg-red-200'
                                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                                    }`}
                                  >
                                    {isEnabled ? 'Disable' : 'Enable'}
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Currently Enabled Services Summary */}
                  <div className="border-t pt-4">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Enabled Services ({centerServices.length})
                    </h3>
                    {centerServices.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {centerServices.map((service) => (
                          <span
                            key={service._id}
                            className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm"
                          >
                            {service.name}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm">No services enabled for this center</p>
                    )}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end space-x-3 pt-6 border-t">
                <button
                  onClick={() => setShowServiceModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCenters;