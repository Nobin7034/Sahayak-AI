import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Edit, 
  Trash2, 
  MapPin, 
  Phone, 
  Mail, 
  User,
  Users,
  Search,
  Filter,
  Settings,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  Eye,
  UserCheck,
  UserX,
  Shield
} from 'lucide-react';
import axios from 'axios';

const AdminStaff = () => {
  const [staff, setStaff] = useState([]);
  const [centers, setCenters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [centerFilter, setCenterFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    centerId: '',
    role: 'staff',
    permissions: [
      'manage_appointments',
      'update_status',
      'add_comments',
      'upload_documents',
      'manage_services',
      'view_analytics'
    ],
    workingHours: {
      monday: { start: '09:00', end: '17:00', isWorking: true },
      tuesday: { start: '09:00', end: '17:00', isWorking: true },
      wednesday: { start: '09:00', end: '17:00', isWorking: true },
      thursday: { start: '09:00', end: '17:00', isWorking: true },
      friday: { start: '09:00', end: '17:00', isWorking: true },
      saturday: { start: '09:00', end: '17:00', isWorking: true },
      sunday: { start: '10:00', end: '16:00', isWorking: false }
    }
  });

  const availablePermissions = [
    { key: 'manage_appointments', label: 'Manage Appointments', description: 'View and manage center appointments' },
    { key: 'update_status', label: 'Update Status', description: 'Change appointment status' },
    { key: 'add_comments', label: 'Add Comments', description: 'Add comments to appointments' },
    { key: 'upload_documents', label: 'Upload Documents', description: 'Upload result documents' },
    { key: 'manage_services', label: 'Manage Services', description: 'Configure center services' },
    { key: 'view_analytics', label: 'View Analytics', description: 'Access center analytics' },
    { key: 'manage_schedule', label: 'Manage Schedule', description: 'Manage appointment schedules' }
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      const [staffResponse, centersResponse] = await Promise.all([
        axios.get('/api/admin/staff', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }),
        axios.get('/api/admin/centers', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        })
      ]);

      if (staffResponse.data.success) {
        setStaff(staffResponse.data.data);
      }

      if (centersResponse.data.success) {
        setCenters(centersResponse.data.data);
      }

      setError('');
    } catch (error) {
      console.error('Load data error:', error);
      setError('Failed to load staff data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const payload = {
        ...formData,
        permissions: formData.permissions.map(permission => ({
          action: permission,
          granted: true
        }))
      };

      if (editingStaff) {
        await axios.put(`/api/admin/staff/${editingStaff._id}`, payload, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
      } else {
        await axios.post('/api/admin/staff', payload, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
      }
      
      setShowModal(false);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Error saving staff:', error);
      setError(error.response?.data?.message || 'Failed to save staff member');
    }
  };

  const handleEdit = (staffMember) => {
    setEditingStaff(staffMember);
    setFormData({
      name: staffMember.user?.name || '',
      email: staffMember.user?.email || '',
      phone: staffMember.user?.phone || '',
      password: '', // Don't populate password for security
      centerId: staffMember.center?._id || '',
      role: staffMember.role || 'staff',
      permissions: staffMember.permissions?.filter(p => p.granted).map(p => p.action) || [],
      workingHours: staffMember.workingHours || formData.workingHours
    });
    setShowModal(true);
  };

  const handleDelete = async (staffId) => {
    if (!confirm('Are you sure you want to delete this staff member?')) return;

    try {
      await axios.delete(`/api/admin/staff/${staffId}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      loadData();
    } catch (error) {
      console.error('Error deleting staff:', error);
      setError('Failed to delete staff member');
    }
  };

  const handleStatusToggle = async (staffId, isActive) => {
    try {
      await axios.put(`/api/admin/staff/${staffId}/status`, 
        { isActive: !isActive },
        {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }
      );
      loadData();
    } catch (error) {
      console.error('Error updating staff status:', error);
      setError('Failed to update staff status');
    }
  };

  const handlePermissionsUpdate = async (staffId, permissions) => {
    try {
      await axios.put(`/api/admin/staff/${staffId}/permissions`, 
        { permissions },
        {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }
      );
      setShowPermissionsModal(false);
      setSelectedStaff(null);
      loadData();
    } catch (error) {
      console.error('Error updating permissions:', error);
      setError('Failed to update permissions');
    }
  };

  const resetForm = () => {
    setEditingStaff(null);
    setFormData({
      name: '',
      email: '',
      phone: '',
      password: '',
      centerId: '',
      role: 'staff',
      permissions: [
        'manage_appointments',
        'update_status',
        'add_comments',
        'upload_documents',
        'manage_services',
        'view_analytics'
      ],
      workingHours: {
        monday: { start: '09:00', end: '17:00', isWorking: true },
        tuesday: { start: '09:00', end: '17:00', isWorking: true },
        wednesday: { start: '09:00', end: '17:00', isWorking: true },
        thursday: { start: '09:00', end: '17:00', isWorking: true },
        friday: { start: '09:00', end: '17:00', isWorking: true },
        saturday: { start: '09:00', end: '17:00', isWorking: true },
        sunday: { start: '10:00', end: '16:00', isWorking: false }
      }
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePermissionToggle = (permission) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permission)
        ? prev.permissions.filter(p => p !== permission)
        : [...prev.permissions, permission]
    }));
  };

  const getCenterName = (centerId) => {
    const center = centers.find(c => c._id === centerId);
    return center ? center.name : 'Unknown Center';
  };

  const filteredStaff = staff.filter(staffMember => {
    const matchesSearch = staffMember.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         staffMember.user?.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCenter = centerFilter === 'all' || staffMember.center?._id === centerFilter;
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && staffMember.isActive) ||
                         (statusFilter === 'inactive' && !staffMember.isActive);
    
    return matchesSearch && matchesCenter && matchesStatus;
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Staff Management</h1>
          <p className="text-gray-600">Manage staff members and their center assignments</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Staff Member
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search staff..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          <div className="sm:w-48">
            <select
              value={centerFilter}
              onChange={(e) => setCenterFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Centers</option>
              {centers.map(center => (
                <option key={center._id} value={center._id}>{center.name}</option>
              ))}
            </select>
          </div>
          <div className="sm:w-32">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Staff Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredStaff.map((staffMember) => (
          <div key={staffMember._id} className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center">
                <div className="h-12 w-12 bg-gray-300 rounded-full flex items-center justify-center mr-3">
                  <User className="h-6 w-6 text-gray-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {staffMember.user?.name || 'Unknown'}
                  </h3>
                  <p className="text-sm text-gray-600">{staffMember.role}</p>
                </div>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                staffMember.isActive 
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}>
                {staffMember.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>

            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-center">
                <Mail className="h-4 w-4 mr-2" />
                {staffMember.user?.email || 'No email'}
              </div>
              <div className="flex items-center">
                <Phone className="h-4 w-4 mr-2" />
                {staffMember.user?.phone || 'No phone'}
              </div>
              <div className="flex items-center">
                <MapPin className="h-4 w-4 mr-2" />
                {getCenterName(staffMember.center?._id)}
              </div>
              <div className="flex items-center">
                <Shield className="h-4 w-4 mr-2" />
                {staffMember.permissions?.filter(p => p.granted).length || 0} permissions
              </div>
            </div>

            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <div className="flex space-x-2">
                <button
                  onClick={() => handleEdit(staffMember)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-md"
                  title="Edit Staff"
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button
                  onClick={() => {
                    setSelectedStaff(staffMember);
                    setShowPermissionsModal(true);
                  }}
                  className="p-2 text-purple-600 hover:bg-purple-50 rounded-md"
                  title="Manage Permissions"
                >
                  <Settings className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDelete(staffMember._id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-md"
                  title="Delete Staff"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <button
                onClick={() => handleStatusToggle(staffMember._id, staffMember.isActive)}
                className={`p-2 rounded-md ${
                  staffMember.isActive
                    ? 'text-red-600 hover:bg-red-50'
                    : 'text-green-600 hover:bg-green-50'
                }`}
                title={staffMember.isActive ? 'Deactivate' : 'Activate'}
              >
                {staffMember.isActive ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredStaff.length === 0 && (
        <div className="text-center py-12">
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No staff members found</h3>
          <p className="text-gray-600">
            {searchTerm || centerFilter !== 'all' || statusFilter !== 'all'
              ? 'Try adjusting your search or filter criteria.'
              : 'Get started by adding your first staff member.'
            }
          </p>
        </div>
      )}

      {/* Add/Edit Staff Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                {editingStaff ? 'Edit Staff Member' : 'Add New Staff Member'}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name *
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
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {editingStaff ? 'New Password (leave blank to keep current)' : 'Password *'}
                    </label>
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      required={!editingStaff}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Center Assignment */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Assigned Center *
                    </label>
                    <select
                      name="centerId"
                      value={formData.centerId}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select a center</option>
                      {centers.map(center => (
                        <option key={center._id} value={center._id}>
                          {center.name} - {center.address?.city}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Role
                    </label>
                    <select
                      name="role"
                      value={formData.role}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="staff">Staff</option>
                      <option value="supervisor">Supervisor</option>
                    </select>
                  </div>
                </div>

                {/* Permissions */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Permissions
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {availablePermissions.map(permission => (
                      <label key={permission.key} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.permissions.includes(permission.key)}
                          onChange={() => handlePermissionToggle(permission.key)}
                          className="mr-2"
                        />
                        <span className="text-sm">{permission.label}</span>
                      </label>
                    ))}
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
                    {editingStaff ? 'Update Staff Member' : 'Create Staff Member'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Permissions Modal */}
      {showPermissionsModal && selectedStaff && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Manage Permissions - {selectedStaff.user?.name}
            </h3>
            
            <div className="space-y-3">
              {availablePermissions.map(permission => {
                const hasPermission = selectedStaff.permissions?.find(p => p.action === permission.key && p.granted);
                return (
                  <div key={permission.key} className="flex items-start">
                    <input
                      type="checkbox"
                      id={permission.key}
                      defaultChecked={hasPermission}
                      className="mt-1 mr-3"
                    />
                    <div>
                      <label htmlFor={permission.key} className="text-sm font-medium text-gray-900">
                        {permission.label}
                      </label>
                      <p className="text-xs text-gray-600">{permission.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowPermissionsModal(false);
                  setSelectedStaff(null);
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const checkboxes = document.querySelectorAll('input[type="checkbox"]:checked');
                  const permissions = Array.from(checkboxes).map(cb => ({
                    action: cb.id,
                    granted: true
                  }));
                  handlePermissionsUpdate(selectedStaff._id, permissions);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Update Permissions
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminStaff;