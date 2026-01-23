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
  Eye,
  MessageSquare,
  Save,
  Send,
  Download,
  Upload,
  Star,
  MapPin,
  CreditCard,
  History,
  Edit3,
  Plus,
  Trash2
} from 'lucide-react';
import axios from 'axios';
import { getImageUrl } from '../../config/api';

const AppointmentDetails = () => {
  const { appointmentId } = useParams();
  const navigate = useNavigate();
  
  const [appointment, setAppointment] = useState(null);
  const [documentRequirements, setDocumentRequirements] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  
  // State for various actions
  const [statusUpdate, setStatusUpdate] = useState({ status: '', reason: '', notes: '' });
  const [newComment, setNewComment] = useState('');
  const [documentValidation, setDocumentValidation] = useState({
    isValidated: false,
    missingDocuments: [],
    staffNotes: ''
  });
  const [recommendedAlternatives, setRecommendedAlternatives] = useState([]);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);

  useEffect(() => {
    if (appointmentId) {
      loadAppointmentDetails();
    }
  }, [appointmentId]);

  const loadAppointmentDetails = async () => {
    try {
      setLoading(true);
      
      // Load appointment details
      const appointmentResponse = await axios.get(`/api/staff/appointments/${appointmentId}/details`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });

      if (appointmentResponse.data.success) {
        const appointmentData = appointmentResponse.data.data;
        setAppointment(appointmentData);
        
        // Initialize document validation state
        setDocumentValidation({
          isValidated: appointmentData.documentValidation?.isValidated || false,
          missingDocuments: appointmentData.documentValidation?.missingDocuments || [],
          staffNotes: appointmentData.documentValidation?.staffNotes || ''
        });

        // Load document requirements for the service
        if (appointmentData.service?._id) {
          const docResponse = await axios.get(`/api/documents/service/${appointmentData.service._id}`);
          if (docResponse.data.success) {
            setDocumentRequirements(docResponse.data.data);
          }
        }
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
      const response = await axios.put(
        `/api/staff/appointments/${appointmentId}/status`,
        statusUpdate,
        { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } }
      );

      if (response.data.success) {
        await loadAppointmentDetails();
        setShowStatusModal(false);
        setStatusUpdate({ status: '', reason: '', notes: '' });
      }
    } catch (error) {
      console.error('Status update error:', error);
      setError('Failed to update appointment status');
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    try {
      const response = await axios.post(
        `/api/staff/appointments/${appointmentId}/comments`,
        { comment: newComment },
        { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } }
      );

      if (response.data.success) {
        await loadAppointmentDetails();
        setNewComment('');
      }
    } catch (error) {
      console.error('Add comment error:', error);
      setError('Failed to add comment');
    }
  };

  const handleDocumentValidation = async () => {
    try {
      const response = await axios.put(
        `/api/documents/appointment/${appointmentId}/validate`,
        documentValidation,
        { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } }
      );

      if (response.data.success) {
        await loadAppointmentDetails();
      }
    } catch (error) {
      console.error('Document validation error:', error);
      setError('Failed to update document validation');
    }
  };

  const recommendAlternativeDocument = (documentId, alternativeId) => {
    const existing = recommendedAlternatives.find(r => r.documentId === documentId);
    if (existing) {
      setRecommendedAlternatives(prev => 
        prev.map(r => r.documentId === documentId ? { ...r, alternativeId } : r)
      );
    } else {
      setRecommendedAlternatives(prev => [...prev, { documentId, alternativeId }]);
    }
  };

  const sendAlternativeRecommendations = async () => {
    try {
      const response = await axios.post(
        `/api/staff/appointments/${appointmentId}/recommend-alternatives`,
        { recommendations: recommendedAlternatives },
        { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } }
      );

      if (response.data.success) {
        setRecommendedAlternatives([]);
        // Show success message
      }
    } catch (error) {
      console.error('Send recommendations error:', error);
      setError('Failed to send alternative recommendations');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'confirmed': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'in_progress': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusActions = (status) => {
    switch (status) {
      case 'pending':
        return [
          { label: 'Accept', action: 'confirmed', color: 'green', icon: CheckCircle },
          { label: 'Reject', action: 'rejected', color: 'red', icon: XCircle }
        ];
      case 'confirmed':
        return [
          { label: 'Start Service', action: 'in_progress', color: 'purple', icon: Clock },
          { label: 'Cancel', action: 'cancelled', color: 'red', icon: XCircle }
        ];
      case 'in_progress':
        return [
          { label: 'Complete', action: 'completed', color: 'green', icon: CheckCircle }
        ];
      default:
        return [];
    }
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
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Appointment</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => navigate('/staff/appointments')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
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
                  <p className="text-sm text-gray-600">
                    {appointment?.user?.name} • {appointment?.service?.name}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full border ${getStatusColor(appointment?.status)}`}>
                  {appointment?.status?.replace('_', ' ').toUpperCase()}
                </span>
                
                {getStatusActions(appointment?.status).map((action) => {
                  const Icon = action.icon;
                  const colorClasses = {
                    green: 'bg-green-600 hover:bg-green-700',
                    red: 'bg-red-600 hover:bg-red-700',
                    purple: 'bg-purple-600 hover:bg-purple-700'
                  };
                  return (
                    <button
                      key={action.action}
                      onClick={() => {
                        setStatusUpdate({ status: action.action, reason: '', notes: '' });
                        setShowStatusModal(true);
                      }}
                      className={`flex items-center px-4 py-2 text-white rounded-lg transition ${colorClasses[action.color]}`}
                    >
                      <Icon className="w-4 h-4 mr-2" />
                      {action.label}
                    </button>
                  );
                })}
              </div>
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

      {/* Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {[
              { id: 'overview', label: 'Overview', icon: User },
              { id: 'documents', label: 'Documents', icon: FileText },
              { id: 'communication', label: 'Communication', icon: MessageSquare },
              { id: 'history', label: 'History', icon: History }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'overview' && (
          <OverviewTab appointment={appointment} />
        )}
        
        {activeTab === 'documents' && (
          <DocumentsTab 
            appointment={appointment}
            documentRequirements={documentRequirements}
            documentValidation={documentValidation}
            setDocumentValidation={setDocumentValidation}
            onValidate={handleDocumentValidation}
            recommendedAlternatives={recommendedAlternatives}
            onRecommendAlternative={recommendAlternativeDocument}
            onSendRecommendations={sendAlternativeRecommendations}
            onPreviewDocument={setSelectedDocument}
          />
        )}
        
        {activeTab === 'communication' && (
          <CommunicationTab 
            appointment={appointment}
            newComment={newComment}
            setNewComment={setNewComment}
            onAddComment={handleAddComment}
          />
        )}
        
        {activeTab === 'history' && (
          <HistoryTab appointment={appointment} />
        )}
      </div>

      {/* Status Update Modal */}
      {showStatusModal && (
        <StatusUpdateModal
          appointment={appointment}
          statusUpdate={statusUpdate}
          setStatusUpdate={setStatusUpdate}
          onUpdate={handleStatusUpdate}
          onClose={() => setShowStatusModal(false)}
        />
      )}

      {/* Document Preview Modal */}
      {selectedDocument && (
        <DocumentPreviewModal
          document={selectedDocument}
          onClose={() => setSelectedDocument(null)}
        />
      )}
    </div>
  );
};

// Overview Tab Component
const OverviewTab = ({ appointment }) => (
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
    {/* User Information */}
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
        <User className="w-5 h-5 mr-2" />
        User Information
      </h3>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">Name</span>
          <span className="font-medium">{appointment?.user?.name || 'N/A'}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">Email</span>
          <div className="flex items-center space-x-2">
            <span className="text-sm">{appointment?.user?.email || 'N/A'}</span>
            {appointment?.user?.email && (
              <a href={`mailto:${appointment.user.email}`} className="text-blue-600 hover:text-blue-800">
                <Mail className="w-4 h-4" />
              </a>
            )}
          </div>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">Phone</span>
          <div className="flex items-center space-x-2">
            <span className="text-sm">{appointment?.user?.phone || 'N/A'}</span>
            {appointment?.user?.phone && (
              <a href={`tel:${appointment.user.phone}`} className="text-blue-600 hover:text-blue-800">
                <Phone className="w-4 h-4" />
              </a>
            )}
          </div>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">User ID</span>
          <span className="font-mono text-xs text-gray-600">{appointment?.user?._id}</span>
        </div>
      </div>
    </div>

    {/* Appointment Information */}
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
        <Calendar className="w-5 h-5 mr-2" />
        Appointment Information
      </h3>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">Service</span>
          <span className="font-medium">{appointment?.service?.name || 'N/A'}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">Date</span>
          <span className="text-sm">{appointment?.appointmentDate ? formatDate(appointment.appointmentDate) : 'N/A'}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">Time</span>
          <span className="text-sm">{formatTime(appointment?.timeSlot)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">Center</span>
          <span className="text-sm">{appointment?.center?.name || 'N/A'}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">Fee</span>
          <span className="text-sm">₹{appointment?.service?.fee || 0}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">Processing Time</span>
          <span className="text-sm">{appointment?.service?.processingTime || 'N/A'}</span>
        </div>
      </div>
    </div>

    {/* Payment Information */}
    {appointment?.payment && (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <CreditCard className="w-5 h-5 mr-2" />
          Payment Information
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Status</span>
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
              appointment.payment.status === 'paid' ? 'bg-green-100 text-green-800' :
              appointment.payment.status === 'failed' ? 'bg-red-100 text-red-800' :
              'bg-yellow-100 text-yellow-800'
            }`}>
              {appointment.payment.status.toUpperCase()}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Amount</span>
            <span className="font-medium">₹{appointment.payment.amount}</span>
          </div>
          {appointment.payment.paymentId && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Payment ID</span>
              <span className="font-mono text-xs text-gray-600">{appointment.payment.paymentId}</span>
            </div>
          )}
        </div>
      </div>
    )}

    {/* Notes */}
    {appointment?.notes && (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Notes</h3>
        <p className="text-gray-700">{appointment.notes}</p>
      </div>
    )}
  </div>
);

export default AppointmentDetails;

// Documents Tab Component
const DocumentsTab = ({ 
  appointment, 
  documentRequirements, 
  documentValidation, 
  setDocumentValidation,
  onValidate,
  recommendedAlternatives,
  onRecommendAlternative,
  onSendRecommendations,
  onPreviewDocument
}) => (
  <div className="space-y-6">
    {/* Document Validation Status */}
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <FileText className="w-5 h-5 mr-2" />
          Document Validation
        </h3>
        <div className="flex items-center space-x-2">
          <span className={`px-3 py-1 text-sm font-medium rounded-full ${
            documentValidation.isValidated 
              ? 'bg-green-100 text-green-800' 
              : 'bg-yellow-100 text-yellow-800'
          }`}>
            {documentValidation.isValidated ? 'Validated' : 'Pending Validation'}
          </span>
          <button
            onClick={onValidate}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
          >
            <Save className="w-4 h-4 mr-2" />
            Update Validation
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Validation Status
          </label>
          <div className="flex items-center space-x-4">
            <label className="flex items-center">
              <input
                type="radio"
                checked={documentValidation.isValidated === true}
                onChange={() => setDocumentValidation(prev => ({ ...prev, isValidated: true }))}
                className="mr-2"
              />
              <span className="text-sm">All documents valid</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                checked={documentValidation.isValidated === false}
                onChange={() => setDocumentValidation(prev => ({ ...prev, isValidated: false }))}
                className="mr-2"
              />
              <span className="text-sm">Documents missing/invalid</span>
            </label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Staff Notes
          </label>
          <textarea
            value={documentValidation.staffNotes}
            onChange={(e) => setDocumentValidation(prev => ({ ...prev, staffNotes: e.target.value }))}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Add validation notes..."
          />
        </div>
      </div>

      {!documentValidation.isValidated && (
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Missing Documents
          </label>
          <div className="flex flex-wrap gap-2">
            {documentRequirements?.documents?.map((doc) => (
              <label key={doc._id} className="flex items-center">
                <input
                  type="checkbox"
                  checked={documentValidation.missingDocuments.includes(doc.name)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setDocumentValidation(prev => ({
                        ...prev,
                        missingDocuments: [...prev.missingDocuments, doc.name]
                      }));
                    } else {
                      setDocumentValidation(prev => ({
                        ...prev,
                        missingDocuments: prev.missingDocuments.filter(name => name !== doc.name)
                      }));
                    }
                  }}
                  className="mr-2"
                />
                <span className="text-sm">{doc.name}</span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>

    {/* User's Selected Documents */}
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">User's Selected Documents</h3>
      {appointment?.selectedDocuments?.length > 0 ? (
        <div className="space-y-3">
          {appointment.selectedDocuments.map((selected, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">
                  {selected.isAlternative ? selected.alternativeName : selected.documentName}
                </p>
                {selected.isAlternative && (
                  <p className="text-sm text-blue-600">Alternative document</p>
                )}
                <p className="text-xs text-gray-500">
                  Selected on {new Date(selected.selectedAt).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  documentValidation.missingDocuments.includes(selected.documentName) ||
                  documentValidation.missingDocuments.includes(selected.alternativeName)
                    ? 'bg-red-100 text-red-800'
                    : 'bg-green-100 text-green-800'
                }`}>
                  {documentValidation.missingDocuments.includes(selected.documentName) ||
                   documentValidation.missingDocuments.includes(selected.alternativeName)
                    ? 'Missing/Invalid'
                    : 'Valid'
                  }
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500 text-center py-4">No documents selected by user</p>
      )}
    </div>

    {/* Document Requirements & Alternatives */}
    {documentRequirements && (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Document Requirements & Alternatives</h3>
          {recommendedAlternatives.length > 0 && (
            <button
              onClick={onSendRecommendations}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center"
            >
              <Send className="w-4 h-4 mr-2" />
              Send Recommendations ({recommendedAlternatives.length})
            </button>
          )}
        </div>

        <div className="space-y-6">
          {documentRequirements.documents?.map((doc) => (
            <div key={doc._id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start space-x-4">
                {/* Document Demo Image */}
                <div className="flex-shrink-0">
                  {(doc.referenceImage || doc.sampleUrl || doc.imageUrl) ? (
                    <img 
                      src={getImageUrl(doc.referenceImage || doc.sampleUrl || doc.imageUrl)} 
                      alt={`Demo ${doc.name}`}
                      className="w-16 h-16 object-cover rounded border border-gray-300 cursor-pointer hover:border-blue-500"
                      onClick={() => onPreviewDocument(doc)}
                    />
                  ) : (
                    <div className="w-16 h-16 bg-gray-100 rounded border border-gray-300 flex items-center justify-center">
                      <FileText className="h-6 w-6 text-gray-400" />
                    </div>
                  )}
                </div>

                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900">{doc.name}</h4>
                    <div className="flex items-center space-x-2">
                      {(doc.referenceImage || doc.sampleUrl || doc.imageUrl) && (
                        <button
                          onClick={() => onPreviewDocument(doc)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      )}
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        doc.isRequired || doc.isMandatory 
                          ? 'bg-red-100 text-red-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {doc.isRequired || doc.isMandatory ? 'Required' : 'Optional'}
                      </span>
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-3">{doc.description}</p>
                  
                  {doc.notes && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded p-2 mb-3">
                      <p className="text-xs text-yellow-800">{doc.notes}</p>
                    </div>
                  )}

                  {/* Alternatives */}
                  {doc.alternatives && doc.alternatives.length > 0 && (
                    <div className="mt-3">
                      <p className="text-sm font-medium text-gray-700 mb-2">
                        Alternative Documents ({doc.alternatives.length}):
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {doc.alternatives.map((alt, altIndex) => (
                          <div key={altIndex} className="bg-gray-50 border border-gray-200 rounded p-3">
                            <div className="flex items-start space-x-3">
                              {(alt.referenceImage || alt.imageUrl) && (
                                <img 
                                  src={getImageUrl(alt.referenceImage || alt.imageUrl)} 
                                  alt={`Demo ${alt.name}`}
                                  className="w-10 h-10 object-cover rounded border border-gray-300 cursor-pointer hover:border-blue-500"
                                  onClick={() => onPreviewDocument({
                                    ...alt,
                                    name: `${doc.name} - ${alt.name}`,
                                    referenceImage: alt.referenceImage || alt.imageUrl
                                  })}
                                />
                              )}
                              <div className="flex-1">
                                <div className="flex items-center justify-between">
                                  <p className="font-medium text-sm text-gray-900">{alt.name}</p>
                                  <button
                                    onClick={() => onRecommendAlternative(doc._id, altIndex)}
                                    className={`px-2 py-1 text-xs rounded ${
                                      recommendedAlternatives.some(r => r.documentId === doc._id && r.alternativeId === altIndex)
                                        ? 'bg-purple-100 text-purple-800'
                                        : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                                    }`}
                                  >
                                    {recommendedAlternatives.some(r => r.documentId === doc._id && r.alternativeId === altIndex)
                                      ? 'Recommended'
                                      : 'Recommend'
                                    }
                                  </button>
                                </div>
                                <p className="text-xs text-gray-600">{alt.description}</p>
                                {alt.notes && (
                                  <p className="text-xs text-blue-600 mt-1">{alt.notes}</p>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )}
  </div>
);

// Communication Tab Component
const CommunicationTab = ({ appointment, newComment, setNewComment, onAddComment }) => (
  <div className="space-y-6">
    {/* Add New Comment */}
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Comment</h3>
      <div className="space-y-4">
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Add a comment for the user or internal notes..."
        />
        <div className="flex justify-end">
          <button
            onClick={onAddComment}
            disabled={!newComment.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            <MessageSquare className="w-4 h-4 mr-2" />
            Add Comment
          </button>
        </div>
      </div>
    </div>

    {/* Comments History */}
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Comments & Communication</h3>
      {appointment?.comments?.length > 0 ? (
        <div className="space-y-4">
          {appointment.comments
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .map((comment, index) => (
              <div key={index} className="border-l-4 border-blue-200 pl-4 py-2">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-gray-900">
                      {comment.authorType === 'staff' ? 'Staff' : 'User'}
                    </span>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      comment.authorType === 'staff' 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {comment.authorType.toUpperCase()}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500">
                    {new Date(comment.createdAt).toLocaleString()}
                  </span>
                </div>
                <p className="text-gray-700">{comment.content}</p>
              </div>
            ))}
        </div>
      ) : (
        <p className="text-gray-500 text-center py-4">No comments yet</p>
      )}
    </div>

    {/* Staff Notes */}
    {appointment?.staffNotes?.length > 0 && (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Staff Notes</h3>
        <div className="space-y-3">
          {appointment.staffNotes.map((note, index) => (
            <div key={index} className="bg-yellow-50 border border-yellow-200 rounded p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-yellow-800">Internal Note</span>
                <span className="text-xs text-yellow-600">
                  {new Date(note.createdAt).toLocaleString()}
                </span>
              </div>
              <p className="text-yellow-800">{note.content}</p>
            </div>
          ))}
        </div>
      </div>
    )}
  </div>
);

// History Tab Component
const HistoryTab = ({ appointment }) => (
  <div className="space-y-6">
    {/* Status History */}
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
        <History className="w-5 h-5 mr-2" />
        Status History
      </h3>
      {appointment?.statusHistory?.length > 0 ? (
        <div className="space-y-4">
          {appointment.statusHistory
            .sort((a, b) => new Date(b.changedAt) - new Date(a.changedAt))
            .map((history, index) => (
              <div key={index} className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
                <div className={`w-3 h-3 rounded-full mt-1 ${
                  history.status === 'completed' ? 'bg-green-500' :
                  history.status === 'cancelled' || history.status === 'rejected' ? 'bg-red-500' :
                  history.status === 'in_progress' ? 'bg-purple-500' :
                  history.status === 'confirmed' ? 'bg-blue-500' :
                  'bg-yellow-500'
                }`} />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-900">
                      Status changed to {history.status.replace('_', ' ').toUpperCase()}
                    </span>
                    <span className="text-sm text-gray-500">
                      {new Date(history.changedAt).toLocaleString()}
                    </span>
                  </div>
                  {history.staffName && (
                    <p className="text-sm text-gray-600">By: {history.staffName}</p>
                  )}
                  {history.reason && (
                    <p className="text-sm text-gray-700 mt-1">{history.reason}</p>
                  )}
                </div>
              </div>
            ))}
        </div>
      ) : (
        <p className="text-gray-500 text-center py-4">No status changes recorded</p>
      )}
    </div>

    {/* Document Validation History */}
    {appointment?.documentValidation && (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Document Validation History</h3>
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium text-gray-900">Current Status</span>
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
              appointment.documentValidation.isValidated 
                ? 'bg-green-100 text-green-800' 
                : 'bg-yellow-100 text-yellow-800'
            }`}>
              {appointment.documentValidation.isValidated ? 'Validated' : 'Pending'}
            </span>
          </div>
          {appointment.documentValidation.validatedAt && (
            <p className="text-sm text-gray-600">
              Validated on: {new Date(appointment.documentValidation.validatedAt).toLocaleString()}
            </p>
          )}
          {appointment.documentValidation.staffNotes && (
            <p className="text-sm text-gray-700 mt-2">
              Notes: {appointment.documentValidation.staffNotes}
            </p>
          )}
          {appointment.documentValidation.missingDocuments?.length > 0 && (
            <div className="mt-2">
              <p className="text-sm font-medium text-red-800">Missing Documents:</p>
              <ul className="text-sm text-red-700 ml-4">
                {appointment.documentValidation.missingDocuments.map((doc, index) => (
                  <li key={index}>• {doc}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    )}
  </div>
);

// Status Update Modal Component
const StatusUpdateModal = ({ appointment, statusUpdate, setStatusUpdate, onUpdate, onClose }) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-lg max-w-md w-full p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Update Appointment Status</h3>
      
      <div className="space-y-4">
        <div>
          <p className="text-sm text-gray-600">
            <strong>User:</strong> {appointment?.user?.name}
          </p>
          <p className="text-sm text-gray-600">
            <strong>Service:</strong> {appointment?.service?.name}
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">New Status</label>
          <div className="px-3 py-2 rounded-md border bg-gray-50">
            {statusUpdate.status.replace('_', ' ').toUpperCase()}
          </div>
        </div>

        {(statusUpdate.status === 'cancelled' || statusUpdate.status === 'rejected' || statusUpdate.status === 'completed') && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {statusUpdate.status === 'completed' ? 'Completion notes' : 'Reason *'}
            </label>
            <textarea
              value={statusUpdate.reason}
              onChange={(e) => setStatusUpdate(prev => ({ ...prev, reason: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder={
                statusUpdate.status === 'completed' 
                  ? 'Add completion notes...'
                  : 'Please provide a reason...'
              }
              required={statusUpdate.status !== 'completed'}
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Additional Notes</label>
          <textarea
            value={statusUpdate.notes}
            onChange={(e) => setStatusUpdate(prev => ({ ...prev, notes: e.target.value }))}
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Optional additional notes..."
          />
        </div>
      </div>

      <div className="flex items-center justify-end space-x-3 mt-6">
        <button
          onClick={onClose}
          className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
        >
          Cancel
        </button>
        <button
          onClick={onUpdate}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Update Status
        </button>
      </div>
    </div>
  </div>
);

// Document Preview Modal Component
const DocumentPreviewModal = ({ document, onClose }) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="text-lg font-medium text-gray-900">
          Sample: {document.name}
        </h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"
        >
          <XCircle className="h-6 w-6" />
        </button>
      </div>
      
      <div className="p-4 overflow-y-auto max-h-[calc(90vh-120px)]">
        {(document.referenceImage || document.sampleUrl || document.imageUrl) ? (
          <div className="text-center">
            <img 
              src={getImageUrl(document.referenceImage || document.sampleUrl || document.imageUrl)} 
              alt={`Sample ${document.name}`}
              className="max-w-full h-auto mx-auto rounded-lg shadow-lg border border-gray-200"
              style={{ maxHeight: '60vh' }}
            />
          </div>
        ) : (
          <div className="text-center text-gray-500 py-12">
            <FileText className="h-12 w-12 mx-auto mb-2" />
            <p>No sample document available</p>
          </div>
        )}
        
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2">Document Information</h4>
          <p className="text-sm text-gray-700 mb-2">{document.description}</p>
          {document.notes && (
            <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded">
              <p className="text-sm text-blue-800">{document.notes}</p>
            </div>
          )}
        </div>
      </div>
      
      <div className="p-4 border-t bg-gray-50 flex justify-end">
        <button
          onClick={onClose}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Close
        </button>
      </div>
    </div>
  </div>
);

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