import React, { useState, useEffect } from 'react';
import { 
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  Eye,
  UserCheck,
  UserX,
  MapPin,
  Phone,
  Mail,
  Building,
  Clock,
  User,
  Search,
  Filter,
  ExternalLink,
  Settings
} from 'lucide-react';
import axios from 'axios';

const AdminStaff = () => {
  const [staffRegistrations, setStaffRegistrations] = useState([]);
  const [approvedStaff, setApprovedStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // all, pending, approved, rejected
  const [selectedRegistration, setSelectedRegistration] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [approvalAction, setApprovalAction] = useState(''); // 'approve' or 'reject'
  const [approvalNotes, setApprovalNotes] = useState('');
  const [processingApproval, setProcessingApproval] = useState(false);
  const [enableAllServices, setEnableAllServices] = useState(false); // Default to false - admin must explicitly enable services
  const [showContactDropdown, setShowContactDropdown] = useState(null);

  // Contact Info Dropdown Component
  const ContactDropdown = ({ registration, isOpen, onClose }) => {
    if (!isOpen) return null;

    const copyToClipboard = (text, type) => {
      navigator.clipboard.writeText(text).then(() => {
        alert(`${type} copied to clipboard!`);
      }).catch(() => {
        alert(`Failed to copy ${type}`);
      });
    };

    return (
      <div className="absolute right-0 top-8 z-10 bg-white border border-gray-200 rounded-lg shadow-lg p-4 min-w-64">
        <div className="space-y-3">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Contact Information</p>
            <div className="mt-2 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Phone:</span>
                <div className="flex items-center space-x-2">
                  <span 
                    className="text-sm font-medium cursor-pointer hover:text-blue-600"
                    onClick={() => copyToClipboard(registration.phone, 'Phone number')}
                    title="Click to copy"
                  >
                    {registration.phone}
                  </span>
                  <a 
                    href={`tel:${registration.phone}`}
                    className="text-blue-600 hover:text-blue-800"
                    title="Call Now"
                  >
                    <Phone className="w-4 h-4" />
                  </a>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Email:</span>
                <div className="flex items-center space-x-2">
                  <span 
                    className="text-sm font-medium cursor-pointer hover:text-blue-600"
                    onClick={() => copyToClipboard(registration.email, 'Email address')}
                    title="Click to copy"
                  >
                    {registration.email}
                  </span>
                  <a 
                    href={`mailto:${registration.email}`}
                    className="text-blue-600 hover:text-blue-800"
                    title="Send Email"
                  >
                    <Mail className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </div>
          </div>
          <div className="border-t pt-2">
            <button
              onClick={onClose}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  useEffect(() => {
    loadStaffRegistrations();
  }, []);

  // Close contact dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showContactDropdown && !event.target.closest('.contact-dropdown-container')) {
        setShowContactDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showContactDropdown]);

  const loadStaffRegistrations = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/auth/staff-registrations');
      
      if (response.data.success) {
        setStaffRegistrations(response.data.registrations);
      }
      setError('');
    } catch (error) {
      console.error('Load registrations error:', error);
      setError('Failed to load staff registrations');
    } finally {
      setLoading(false);
    }
  };

  const handleApprovalAction = async () => {
    if (!selectedRegistration || !approvalAction) return;

    try {
      setProcessingApproval(true);
      const endpoint = approvalAction === 'approve' 
        ? `/api/auth/admin/approve-staff/${selectedRegistration._id}`
        : `/api/auth/admin/reject-staff/${selectedRegistration._id}`;

      const payload = {
        adminId: JSON.parse(localStorage.getItem('user'))?.id,
        [approvalAction === 'approve' ? 'notes' : 'reason']: approvalNotes,
        ...(approvalAction === 'approve' && { enableAllServices })
      };

      const response = await axios.post(endpoint, payload);

      if (response.data.success) {
        // Reload data
        await loadStaffRegistrations();
        
        // Close modal
        setShowApprovalModal(false);
        setSelectedRegistration(null);
        setApprovalAction('');
        setApprovalNotes('');
        setEnableAllServices(false); // Reset to default (no services)
        
        // Show success message from backend
        alert(response.data.message);
      }
    } catch (error) {
      console.error('Approval action error:', error);
      alert(`Failed to ${approvalAction} registration: ${error.response?.data?.message || error.message}`);
    } finally {
      setProcessingApproval(false);
    }
  };

  const openApprovalModal = (registration, action) => {
    setSelectedRegistration(registration);
    setApprovalAction(action);
    setApprovalNotes('');
    setEnableAllServices(false); // Default to false - admin must explicitly enable services
    setShowApprovalModal(true);
  };

  const openDetailsModal = (registration) => {
    setSelectedRegistration(registration);
    setShowDetailsModal(true);
  };

  const filteredRegistrations = staffRegistrations.filter(registration => {
    const matchesSearch = 
      registration.centerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      registration.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      registration.centerAddress.city?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || registration.approvalStatus === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (approvalStatus) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock, text: 'Pending' },
      approved: { color: 'bg-green-100 text-green-800', icon: CheckCircle, text: 'Approved' },
      rejected: { color: 'bg-red-100 text-red-800', icon: XCircle, text: 'Rejected' }
    };

    const config = statusConfig[approvalStatus] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {config.text}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Loading staff registrations...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Staff Management</h1>
          <p className="text-gray-600">Review and approve staff registration requests</p>
        </div>
        <button
          onClick={loadStaffRegistrations}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search by center name, email, or city..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
        <div className="sm:w-48">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <Clock className="w-8 h-8 text-yellow-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Pending</p>
              <p className="text-2xl font-bold text-gray-900">
                {staffRegistrations.filter(r => r.approvalStatus === 'pending').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <CheckCircle className="w-8 h-8 text-green-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Approved</p>
              <p className="text-2xl font-bold text-gray-900">
                {staffRegistrations.filter(r => r.approvalStatus === 'approved').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <XCircle className="w-8 h-8 text-red-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Rejected</p>
              <p className="text-2xl font-bold text-gray-900">
                {staffRegistrations.filter(r => r.approvalStatus === 'rejected').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <User className="w-8 h-8 text-blue-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Total</p>
              <p className="text-2xl font-bold text-gray-900">{staffRegistrations.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Registrations List */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Staff Registration Requests</h2>
        </div>
        
        {filteredRegistrations.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No staff registrations found</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredRegistrations.map((registration) => (
              <div key={registration._id} className="px-6 py-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <Building className="w-5 h-5 text-gray-400" />
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">
                          {registration.centerName}
                        </h3>
                        <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                          <span className="flex items-center">
                            <Mail className="w-4 h-4 mr-1" />
                            {registration.email}
                          </span>
                          <span className="flex items-center">
                            <MapPin className="w-4 h-4 mr-1" />
                            {registration.centerAddress.city}, {registration.centerAddress.district}
                          </span>
                          <span className="flex items-center">
                            <Clock className="w-4 h-4 mr-1" />
                            {new Date(registration.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {getStatusBadge(registration.approvalStatus)}
                    
                    {/* Contact Button with Dropdown */}
                    <div className="relative contact-dropdown-container">
                      <button
                        onClick={() => setShowContactDropdown(showContactDropdown === registration._id ? null : registration._id)}
                        className="flex items-center px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded-md transition"
                        title="Contact Information"
                      >
                        <Phone className="w-4 h-4 mr-1" />
                        Contact
                      </button>
                      <ContactDropdown 
                        registration={registration}
                        isOpen={showContactDropdown === registration._id}
                        onClose={() => setShowContactDropdown(null)}
                      />
                    </div>
                    
                    {/* View Details Button */}
                    <button
                      onClick={() => openDetailsModal(registration)}
                      className="flex items-center px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded-md transition"
                      title="View Full Details"
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      View
                    </button>
                    
                    {/* Approval Actions */}
                    {registration.approvalStatus === 'pending' && (
                      <>
                        <button
                          onClick={() => openApprovalModal(registration, 'approve')}
                          className="flex items-center px-3 py-1 text-sm text-green-600 hover:bg-green-50 rounded-md transition"
                          title="Approve Registration"
                        >
                          <UserCheck className="w-4 h-4 mr-1" />
                          Approve
                        </button>
                        <button
                          onClick={() => openApprovalModal(registration, 'reject')}
                          className="flex items-center px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded-md transition"
                          title="Reject Registration"
                        >
                          <UserX className="w-4 h-4 mr-1" />
                          Reject
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Details Modal */}
      {showDetailsModal && selectedRegistration && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-lg font-medium text-gray-900">Registration Details</h2>
              <div className="text-sm text-gray-500">
                ID: {selectedRegistration._id.slice(-8)}
              </div>
            </div>
            
            <div className="px-6 py-4 space-y-6">
              {/* Center Information */}
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                  <Building className="w-4 h-4 mr-2" />
                  Center Information
                </h3>
                <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Center Name</p>
                      <p className="font-medium text-gray-900">{selectedRegistration.centerName}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Registration ID</p>
                      <p className="font-mono text-sm text-gray-700">{selectedRegistration._id}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Full Address</p>
                    <p className="text-gray-900">
                      {selectedRegistration.centerAddress.street}<br/>
                      {selectedRegistration.centerAddress.city}, {selectedRegistration.centerAddress.district}<br/>
                      {selectedRegistration.centerAddress.state} - {selectedRegistration.centerAddress.pincode}
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Contact Information */}
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                  <Phone className="w-4 h-4 mr-2" />
                  Contact Information
                </h3>
                <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Email Address</p>
                      <div className="flex items-center space-x-2">
                        <p className="text-gray-900">{selectedRegistration.email}</p>
                        <a 
                          href={`mailto:${selectedRegistration.email}`}
                          className="text-blue-600 hover:text-blue-800"
                          title="Send Email"
                        >
                          <Mail className="w-4 h-4" />
                        </a>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Phone Number</p>
                      <div className="flex items-center space-x-2">
                        <p className="text-gray-900">{selectedRegistration.phone}</p>
                        <a 
                          href={`tel:${selectedRegistration.phone}`}
                          className="text-blue-600 hover:text-blue-800"
                          title="Call Now"
                        >
                          <Phone className="w-4 h-4" />
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Location Details */}
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                  <MapPin className="w-4 h-4 mr-2" />
                  Location Details
                </h3>
                <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Latitude</p>
                      <p className="font-mono text-sm text-gray-700">
                        {selectedRegistration.centerLocation.coordinates?.[1] || 'Not provided'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Longitude</p>
                      <p className="font-mono text-sm text-gray-700">
                        {selectedRegistration.centerLocation.coordinates?.[0] || 'Not provided'}
                      </p>
                    </div>
                  </div>
                  {selectedRegistration.centerLocation.coordinates?.[0] && selectedRegistration.centerLocation.coordinates?.[1] && (
                    <div>
                      <a
                        href={`https://www.google.com/maps?q=${selectedRegistration.centerLocation.coordinates[1]},${selectedRegistration.centerLocation.coordinates[0]}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-blue-600 hover:text-blue-800 text-sm"
                      >
                        <MapPin className="w-4 h-4 mr-1" />
                        View on Google Maps
                      </a>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Registration Status & Timeline */}
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                  <Clock className="w-4 h-4 mr-2" />
                  Registration Status & Timeline
                </h3>
                <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Current Status:</span>
                    {getStatusBadge(selectedRegistration.approvalStatus)}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Submitted On</p>
                      <p className="text-gray-900">{new Date(selectedRegistration.createdAt).toLocaleString()}</p>
                    </div>
                    {selectedRegistration.reviewedAt && (
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Reviewed On</p>
                        <p className="text-gray-900">{new Date(selectedRegistration.reviewedAt).toLocaleString()}</p>
                      </div>
                    )}
                  </div>
                  {selectedRegistration.reviewNotes && (
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Review Notes</p>
                      <p className="text-gray-900 bg-white p-3 rounded border">{selectedRegistration.reviewNotes}</p>
                    </div>
                  )}
                  {selectedRegistration.rejectionReason && (
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Rejection Reason</p>
                      <p className="text-red-700 bg-red-50 p-3 rounded border border-red-200">{selectedRegistration.rejectionReason}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="px-6 py-4 border-t border-gray-200 flex justify-between items-center">
              <div className="flex space-x-3">
                {selectedRegistration.approvalStatus === 'pending' && (
                  <>
                    <button
                      onClick={() => {
                        setShowDetailsModal(false);
                        openApprovalModal(selectedRegistration, 'approve');
                      }}
                      className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                    >
                      <UserCheck className="w-4 h-4 mr-2" />
                      Approve
                    </button>
                    <button
                      onClick={() => {
                        setShowDetailsModal(false);
                        openApprovalModal(selectedRegistration, 'reject');
                      }}
                      className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                    >
                      <UserX className="w-4 h-4 mr-2" />
                      Reject
                    </button>
                  </>
                )}
              </div>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Approval Modal */}
      {showApprovalModal && selectedRegistration && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">
                {approvalAction === 'approve' ? 'Approve' : 'Reject'} Registration
              </h2>
            </div>
            
            <div className="px-6 py-4">
              <p className="text-sm text-gray-600 mb-4">
                Are you sure you want to {approvalAction} the registration for <strong>{selectedRegistration.centerName}</strong>?
              </p>
              
              {/* Enable All Services Option - Only show for approval */}
              {approvalAction === 'approve' && (
                <div className="mb-4 p-3 bg-yellow-50 border border-yellow-300 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      id="enableAllServices"
                      checked={enableAllServices}
                      onChange={(e) => setEnableAllServices(e.target.checked)}
                      className="mt-1 h-4 w-4 text-yellow-600 focus:ring-yellow-500 border-gray-300 rounded"
                    />
                    <div className="flex-1">
                      <label htmlFor="enableAllServices" className="flex items-center text-sm font-medium text-yellow-900 cursor-pointer">
                        <Settings className="w-4 h-4 mr-2" />
                        Enable all services for this center
                      </label>
                      <p className="text-xs text-yellow-800 mt-1">
                        {enableAllServices 
                          ? 'All available services will be automatically assigned to this center upon approval.'
                          : '⚠️ WARNING: No services will be assigned by default. You must manually assign services later via the Centers page.'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {approvalAction === 'approve' ? 'Approval Notes (Optional)' : 'Rejection Reason *'}
                </label>
                <textarea
                  value={approvalNotes}
                  onChange={(e) => setApprovalNotes(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder={approvalAction === 'approve' ? 'Add any notes for the approval...' : 'Please provide a detailed reason for rejection...'}
                  required={approvalAction === 'reject'}
                />
                {approvalAction === 'reject' && (
                  <p className="text-xs text-gray-500 mt-1">
                    This reason will be visible to the staff member and help them understand the decision.
                  </p>
                )}
              </div>
            </div>
            
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => setShowApprovalModal(false)}
                disabled={processingApproval}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleApprovalAction}
                disabled={processingApproval || (approvalAction === 'reject' && !approvalNotes.trim())}
                className={`px-4 py-2 text-white rounded-lg transition ${
                  approvalAction === 'approve'
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-red-600 hover:bg-red-700'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {processingApproval ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  approvalAction === 'approve' ? 'Approve' : 'Reject'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminStaff;