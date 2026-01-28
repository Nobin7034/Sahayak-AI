import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  User, 
  Phone, 
  Mail, 
  Calendar, 
  Clock, 
  FileText, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  MessageSquare,
  Upload,
  Download,
  Eye,
  Edit,
  Save,
  X,
  Plus,
  Image as ImageIcon
} from 'lucide-react';
import axios from 'axios';

const AppointmentDetails = () => {
  const { appointmentId } = useParams();
  const navigate = useNavigate();
  
  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState(false);
  
  // Status update state
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusUpdate, setStatusUpdate] = useState({
    status: '',
    reason: '',
    notes: ''
  });
  
  // Document recommendation state
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [recommendedDocuments, setRecommendedDocuments] = useState([]);
  const [documentNote, setDocumentNote] = useState('');
  
  // Comment state
  const [newComment, setNewComment] = useState('');
  const [showCommentForm, setShowCommentForm] = useState(false);

  useEffect(() => {
    loadAppointmentDetails();
  }, [appointmentId]);

  const loadAppointmentDetails = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/staff/appointments/${appointmentId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.data.success) {
        setAppointment(response.data.data);
        setError('');
      }
    } catch (error) {
      console.error('Load appointment details error:', error);
      setError('Failed to load appointment details');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async () => {
    try {
      setUpdating(true);
      const response = await axios.put(
        `/api/staff/appointments/${appointmentId}/status`,
        { 
          status: statusUpdate.status, 
          reason: statusUpdate.reason,
          notes: statusUpdate.notes 
        },
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (response.data.success) {
        await loadAppointmentDetails();
        setShowStatusModal(false);
        setStatusUpdate({ status: '', reason: '', notes: '' });
      }
    } catch (error) {
      console.error('Status update error:', error);
      setError('Failed to update appointment status');
    } finally {
      setUpdating(false);
    }
  };

  const handleDocumentRecommendation = async () => {
    try {
      setUpdating(true);
      const response = await axios.post(
        `/api/staff/appointments/${appointmentId}/recommend-documents`,
        { 
          recommendedDocuments,
          note: documentNote 
        },
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (response.data.success) {
        await loadAppointmentDetails();
        setShowDocumentModal(false);
        setRecommendedDocuments([]);
        setDocumentNote('');
      }
    } catch (error) {
      console.error('Document recommendation error:', error);
      setError('Failed to send document recommendation');
    } finally {
      setUpdating(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    try {
      setUpdating(true);
      const response = await axios.post(
        `/api/staff/appointments/${appointmentId}/comments`,
        { comment: newComment },
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (response.data.success) {
        await loadAppointmentDetails();
        setNewComment('');
        setShowCommentForm(false);
      }
    } catch (error) {
      console.error('Add comment error:', error);
      setError('Failed to add comment');
    } finally {
      setUpdating(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'confirmed': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'in_progress': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusActions = (status) => {
    const actions = [];
    
    switch (status) {
      case 'pending':
        actions.push(
          { label: 'Accept', action: 'confirmed', color: 'green', icon: CheckCircle },
          { label: 'Reject', action: 'cancelled', color: 'red', icon: XCircle }
        );
        break;
      case 'confirmed':
        actions.push(
          { label: 'Start', action: 'in_progress', color: 'purple', icon: Clock },
          { label: 'Cancel', action: 'cancelled', color: 'red', icon: XCircle }
        );
        break;
      case 'in_progress':
        actions.push(
          { label: 'Complete', action: 'completed', color: 'green', icon: CheckCircle },
          { label: 'Cancel', action: 'cancelled', color: 'red', icon: XCircle }
        );
        break;
    }
    
    return actions;
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeSlot) => {
    return timeSlot || 'Not specified';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading appointment details...</p>
        </div>
      </div>
    );
  }

  if (error && !appointment) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Appointment</h3>
          <p className="text-gray-500 mb-4">{error}</p>
          <button
            onClick={() => navigate('/staff/appointments')}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Back to Appointments
          </button>
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
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => navigate('/staff/appointments')}
                  className="flex items-center text-gray-600 hover:text-gray-900"
                >
                  <ArrowLeft className="h-5 w-5 mr-1" />
                  Back to Appointments
                </button>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Appointment Details</h1>
                  <p className="text-sm text-gray-600 mt-1">
                    Manage appointment and user documents
                  </p>
                </div>
              </div>
              
              {/* Status Badge */}
              {appointment && (
                <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full border ${getStatusColor(appointment.status)}`}>
                  {appointment.status.replace('_', ' ').toUpperCase()}
                </span>
              )}
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

      {/* Main Content */}
      {appointment && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left Column - User & Appointment Info */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* User Information */}
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  User Information
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <div className="flex items-center space-x-4 mb-4">
                      <div className="h-16 w-16 bg-gray-300 rounded-full flex items-center justify-center">
                        <User className="h-8 w-8 text-gray-600" />
                      </div>
                      <div>
                        <h3 className="text-xl font-medium text-gray-900">
                          {appointment.user?.name || 'Unknown User'}
                        </h3>
                        <p className="text-sm text-gray-500">User ID: {appointment.user?._id}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <Mail className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">Email</p>
                        <p className="text-gray-900">{appointment.user?.email || 'Not provided'}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <Phone className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">Phone</p>
                        <p className="text-gray-900">{appointment.user?.phone || 'Not provided'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Contact Actions */}
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="flex space-x-3">
                    {appointment.user?.phone && (
                      <a
                        href={`tel:${appointment.user.phone}`}
                        className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                      >
                        <Phone className="h-4 w-4 mr-2" />
                        Call User
                      </a>
                    )}
                    {appointment.user?.email && (
                      <a
                        href={`mailto:${appointment.user.email}`}
                        className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                      >
                        <Mail className="h-4 w-4 mr-2" />
                        Send Email
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {/* Appointment Information */}
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Calendar className="h-5 w-5 mr-2" />
                  Appointment Information
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-gray-500">Service</p>
                        <p className="text-lg font-medium text-gray-900">
                          {appointment.service?.name || 'Unknown Service'}
                        </p>
                      </div>
                      
                      <div>
                        <p className="text-sm text-gray-500">Date</p>
                        <p className="text-gray-900">{formatDate(appointment.appointmentDate)}</p>
                      </div>
                      
                      <div>
                        <p className="text-sm text-gray-500">Time</p>
                        <p className="text-gray-900">{formatTime(appointment.timeSlot)}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-gray-500">Status</p>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getStatusColor(appointment.status)}`}>
                          {appointment.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                      
                      <div>
                        <p className="text-sm text-gray-500">Appointment ID</p>
                        <p className="font-mono text-sm text-gray-700">{appointment._id}</p>
                      </div>
                      
                      {appointment.notes && (
                        <div>
                          <p className="text-sm text-gray-500">User Notes</p>
                          <p className="text-gray-900">{appointment.notes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* User Documents */}
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                    <FileText className="h-5 w-5 mr-2" />
                    User Documents
                  </h2>
                  <button
                    onClick={() => setShowDocumentModal(true)}
                    className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Recommend Documents
                  </button>
                </div>
                
                {appointment.selectedDocuments && appointment.selectedDocuments.length > 0 ? (
                  <div className="space-y-3">
                    {appointment.selectedDocuments.map((doc, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <FileText className="h-5 w-5 text-blue-600" />
                          <div>
                            <p className="font-medium text-gray-900">
                              {doc.isAlternative ? doc.alternativeName : doc.documentName}
                            </p>
                            {doc.isAlternative && (
                              <p className="text-xs text-orange-600">Alternative document</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">
                            Selected
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Documents Selected</h3>
                    <p className="text-gray-500 mb-4">
                      The user hasn't selected any documents for this appointment.
                    </p>
                    <button
                      onClick={() => setShowDocumentModal(true)}
                      className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 mx-auto"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Recommend Required Documents
                    </button>
                  </div>
                )}
              </div>

              {/* Comments Section */}
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                    <MessageSquare className="h-5 w-5 mr-2" />
                    Comments & Notes
                  </h2>
                  <button
                    onClick={() => setShowCommentForm(!showCommentForm)}
                    className="flex items-center px-3 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Comment
                  </button>
                </div>

                {/* Add Comment Form */}
                {showCommentForm && (
                  <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                    <textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      placeholder="Add your comment or note..."
                    />
                    <div className="flex items-center justify-end space-x-3 mt-3">
                      <button
                        onClick={() => {
                          setShowCommentForm(false);
                          setNewComment('');
                        }}
                        className="px-3 py-2 text-gray-600 hover:text-gray-800"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleAddComment}
                        disabled={!newComment.trim() || updating}
                        className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {updating ? 'Adding...' : 'Add Comment'}
                      </button>
                    </div>
                  </div>
                )}

                {/* Comments List */}
                {appointment.comments && appointment.comments.length > 0 ? (
                  <div className="space-y-4">
                    {appointment.comments.map((comment, index) => (
                      <div key={index} className="border-l-4 border-purple-200 pl-4 py-2">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-gray-900">
                            {comment.authorType === 'staff' ? 'Staff' : 'User'}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(comment.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-gray-700">{comment.content}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <MessageSquare className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500">No comments yet</p>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column - Actions */}
            <div className="space-y-6">
              
              {/* Status Actions */}
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions</h3>
                
                <div className="space-y-3">
                  {getStatusActions(appointment.status).map((action) => {
                    const Icon = action.icon;
                    const buttonClasses = {
                      green: 'bg-green-600 hover:bg-green-700',
                      red: 'bg-red-600 hover:bg-red-700',
                      purple: 'bg-purple-600 hover:bg-purple-700',
                      blue: 'bg-blue-600 hover:bg-blue-700'
                    };
                    return (
                      <button
                        key={action.action}
                        onClick={() => {
                          setStatusUpdate({ status: action.action, reason: '', notes: '' });
                          setShowStatusModal(true);
                        }}
                        className={`w-full flex items-center justify-center px-4 py-3 text-white rounded-lg transition ${buttonClasses[action.color] || 'bg-gray-600 hover:bg-gray-700'}`}
                      >
                        <Icon className="w-5 h-5 mr-2" />
                        {action.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Quick Info */}
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Info</h3>
                
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Created</span>
                    <span className="text-sm text-gray-900">
                      {new Date(appointment.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  
                  {appointment.completedAt && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Completed</span>
                      <span className="text-sm text-gray-900">
                        {new Date(appointment.completedAt).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Documents</span>
                    <span className="text-sm text-gray-900">
                      {appointment.selectedDocuments?.length || 0} selected
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Comments</span>
                    <span className="text-sm text-gray-900">
                      {appointment.comments?.length || 0}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Status Update Modal */}
      {showStatusModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Update Appointment Status
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  New Status
                </label>
                <div className={`px-3 py-2 rounded-md border ${getStatusColor(statusUpdate.status)}`}>
                  {statusUpdate.status.replace('_', ' ').toUpperCase()}
                </div>
              </div>

              {(statusUpdate.status === 'cancelled' || statusUpdate.status === 'completed') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {statusUpdate.status === 'cancelled' ? 'Reason for cancellation *' : 'Completion notes'}
                  </label>
                  <textarea
                    value={statusUpdate.reason}
                    onChange={(e) => setStatusUpdate(prev => ({ ...prev, reason: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder={statusUpdate.status === 'cancelled' 
                      ? 'Please provide a reason for cancellation...'
                      : 'Add any completion notes...'
                    }
                    required={statusUpdate.status === 'cancelled'}
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Additional Notes
                </label>
                <textarea
                  value={statusUpdate.notes}
                  onChange={(e) => setStatusUpdate(prev => ({ ...prev, notes: e.target.value }))}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Add any additional notes..."
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowStatusModal(false);
                  setStatusUpdate({ status: '', reason: '', notes: '' });
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleStatusUpdate}
                disabled={updating || (statusUpdate.status === 'cancelled' && !statusUpdate.reason.trim())}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {updating ? 'Updating...' : 'Update Status'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Document Recommendation Modal */}
      {showDocumentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Recommend Documents to User
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Recommended Documents
                </label>
                <div className="space-y-2">
                  {/* Common document options */}
                  {[
                    'Aadhaar Card',
                    'PAN Card',
                    'Voter ID',
                    'Driving License',
                    'Passport',
                    'Ration Card',
                    'Bank Passbook',
                    'Income Certificate',
                    'Caste Certificate',
                    'Address Proof'
                  ].map((doc) => (
                    <label key={doc} className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={recommendedDocuments.includes(doc)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setRecommendedDocuments(prev => [...prev, doc]);
                          } else {
                            setRecommendedDocuments(prev => prev.filter(d => d !== doc));
                          }
                        }}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="text-sm text-gray-900">{doc}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Note to User
                </label>
                <textarea
                  value={documentNote}
                  onChange={(e) => setDocumentNote(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Add a note explaining why these documents are needed..."
                />
              </div>

              {/* Document Preview with Demo Images */}
              {recommendedDocuments.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Selected Documents Preview</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {recommendedDocuments.map((doc) => (
                      <div key={doc} className="border border-gray-200 rounded-lg p-3 text-center">
                        <ImageIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-xs text-gray-600">{doc}</p>
                        <p className="text-xs text-blue-600 mt-1">Sample image available</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowDocumentModal(false);
                  setRecommendedDocuments([]);
                  setDocumentNote('');
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleDocumentRecommendation}
                disabled={updating || recommendedDocuments.length === 0}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {updating ? 'Sending...' : 'Send Recommendation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppointmentDetails;