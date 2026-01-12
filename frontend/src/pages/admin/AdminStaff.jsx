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
  Filter
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

  useEffect(() => {
    loadStaffRegistrations();
  }, []);

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
        [approvalAction === 'approve' ? 'notes' : 'reason']: approvalNotes
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
        
        // Show success message
        alert(`Staff registration ${approvalAction}d successfully!`);
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
                  
                  <div className="flex items-center space-x-3">
                    {getStatusBadge(registration.approvalStatus)}
                    
                    <button
                      onClick={() => openDetailsModal(registration)}
                      className="flex items-center px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded-md transition"
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      View
                    </button>
                    
                    {registration.approvalStatus === 'pending' && (
                      <>
                        <button
                          onClick={() => openApprovalModal(registration, 'approve')}
                          className="flex items-center px-3 py-1 text-sm text-green-600 hover:bg-green-50 rounded-md transition"
                        >
                          <UserCheck className="w-4 h-4 mr-1" />
                          Approve
                        </button>
                        <button
                          onClick={() => openApprovalModal(registration, 'reject')}
                          className="flex items-center px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded-md transition"
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
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Registration Details</h2>
            </div>
            
            <div className="px-6 py-4 space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-2">Center Information</h3>
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <p><strong>Name:</strong> {selectedRegistration.centerName}</p>
                  <p><strong>Address:</strong> {selectedRegistration.centerAddress.street}, {selectedRegistration.centerAddress.city}</p>
                  <p><strong>District:</strong> {selectedRegistration.centerAddress.district}</p>
                  <p><strong>State:</strong> {selectedRegistration.centerAddress.state}</p>
                  <p><strong>Pincode:</strong> {selectedRegistration.centerAddress.pincode}</p>
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-2">Contact Information</h3>
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <p><strong>Email:</strong> {selectedRegistration.email}</p>
                  <p><strong>Phone:</strong> {selectedRegistration.phone}</p>
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-2">Location</h3>
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <p><strong>Coordinates:</strong> {selectedRegistration.centerLocation.coordinates?.[1]}, {selectedRegistration.centerLocation.coordinates?.[0]}</p>
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-2">Registration Status</h3>
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <p><strong>Status:</strong> {getStatusBadge(selectedRegistration.approvalStatus)}</p>
                  <p><strong>Submitted:</strong> {new Date(selectedRegistration.createdAt).toLocaleString()}</p>
                  {selectedRegistration.reviewedAt && (
                    <>
                      <p><strong>Reviewed:</strong> {new Date(selectedRegistration.reviewedAt).toLocaleString()}</p>
                      {selectedRegistration.reviewNotes && (
                        <p><strong>Notes:</strong> {selectedRegistration.reviewNotes}</p>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
            
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
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
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {approvalAction === 'approve' ? 'Approval Notes (Optional)' : 'Rejection Reason'}
                </label>
                <textarea
                  value={approvalNotes}
                  onChange={(e) => setApprovalNotes(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder={approvalAction === 'approve' ? 'Add any notes...' : 'Please provide a reason for rejection...'}
                />
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
                disabled={processingApproval}
                className={`px-4 py-2 text-white rounded-lg transition ${
                  approvalAction === 'approve'
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-red-600 hover:bg-red-700'
                } disabled:opacity-50`}
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