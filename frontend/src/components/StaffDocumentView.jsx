import React, { useState } from 'react';
import { 
  FileText, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Eye, 
  MessageSquare,
  Shield,
  Clock,
  User,
  Calendar
} from 'lucide-react';

const StaffDocumentView = ({ appointment, onValidationUpdate, onNotifyUser }) => {
  const [validationModal, setValidationModal] = useState({ open: false, type: 'validate' });
  const [notificationModal, setNotificationModal] = useState({ open: false });
  const [validationData, setValidationData] = useState({
    isValidated: false,
    missingDocuments: [],
    staffNotes: ''
  });
  const [notificationData, setNotificationData] = useState({
    missingDocuments: [],
    alternatives: '',
    message: ''
  });

  const { selectedDocuments = [], documentValidation = {} } = appointment;

  const handleValidationSubmit = async () => {
    try {
      await onValidationUpdate(appointment._id, validationData);
      setValidationModal({ open: false, type: 'validate' });
    } catch (error) {
      console.error('Validation update failed:', error);
    }
  };

  const handleNotificationSubmit = async () => {
    try {
      await onNotifyUser(appointment._id, notificationData);
      setNotificationModal({ open: false });
      setNotificationData({ missingDocuments: [], alternatives: '', message: '' });
    } catch (error) {
      console.error('Notification failed:', error);
    }
  };

  if (!selectedDocuments || selectedDocuments.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="flex items-center space-x-2 text-gray-600">
          <FileText className="h-5 w-5" />
          <span className="text-sm">No documents selected for this appointment</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Document Status Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <FileText className="h-5 w-5 text-blue-600" />
          <h3 className="font-medium text-gray-900">Document Status</h3>
          <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
            {selectedDocuments.length} documents
          </span>
        </div>
        
        <div className="flex items-center space-x-2">
          {documentValidation.isValidated ? (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
              <CheckCircle className="h-3 w-3 mr-1" />
              Validated
            </span>
          ) : (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
              <AlertTriangle className="h-3 w-3 mr-1" />
              Pending Review
            </span>
          )}
        </div>
      </div>

      {/* Selected Documents List */}
      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="p-4">
          <h4 className="text-sm font-medium text-gray-900 mb-3">User Selected Documents</h4>
          <div className="space-y-2">
            {selectedDocuments.map((doc, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <div>
                    <span className="text-sm font-medium text-gray-900">
                      {doc.isAlternative ? doc.alternativeName : doc.documentName}
                    </span>
                    {doc.isAlternative && (
                      <span className="ml-2 text-xs text-blue-600 bg-blue-100 px-1 py-0.5 rounded">
                        Alternative
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-1 text-xs text-gray-500">
                  <Calendar className="h-3 w-3" />
                  <span>{new Date(doc.selectedAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Validation Status */}
      {documentValidation.validatedAt && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start space-x-2">
            <User className="h-4 w-4 text-blue-600 mt-0.5" />
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-1">
                <span className="text-sm font-medium text-blue-900">
                  Validated by Staff
                </span>
                <div className="flex items-center space-x-1 text-xs text-blue-700">
                  <Clock className="h-3 w-3" />
                  <span>{new Date(documentValidation.validatedAt).toLocaleString()}</span>
                </div>
              </div>
              
              {documentValidation.staffNotes && (
                <p className="text-sm text-blue-800 mt-2">
                  <strong>Notes:</strong> {documentValidation.staffNotes}
                </p>
              )}
              
              {documentValidation.missingDocuments && documentValidation.missingDocuments.length > 0 && (
                <div className="mt-2">
                  <p className="text-sm font-medium text-red-800 mb-1">Missing Documents:</p>
                  <ul className="text-sm text-red-700 space-y-1">
                    {documentValidation.missingDocuments.map((doc, index) => (
                      <li key={index} className="flex items-center space-x-1">
                        <XCircle className="h-3 w-3" />
                        <span>{doc}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex space-x-3">
        <button
          onClick={() => setValidationModal({ open: true, type: 'validate' })}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
        >
          <CheckCircle className="h-4 w-4" />
          <span>Update Validation</span>
        </button>
        
        <button
          onClick={() => setNotificationModal({ open: true })}
          className="flex items-center space-x-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-sm"
        >
          <MessageSquare className="h-4 w-4" />
          <span>Notify User</span>
        </button>
      </div>

      {/* Validation Modal */}
      {validationModal.open && (
        <ValidationModal
          appointment={appointment}
          validationData={validationData}
          setValidationData={setValidationData}
          onSubmit={handleValidationSubmit}
          onClose={() => setValidationModal({ open: false, type: 'validate' })}
        />
      )}

      {/* Notification Modal */}
      {notificationModal.open && (
        <NotificationModal
          appointment={appointment}
          notificationData={notificationData}
          setNotificationData={setNotificationData}
          onSubmit={handleNotificationSubmit}
          onClose={() => setNotificationModal({ open: false })}
        />
      )}
    </div>
  );
};

const ValidationModal = ({ appointment, validationData, setValidationData, onSubmit, onClose }) => {
  const handleMissingDocumentToggle = (docName) => {
    const current = validationData.missingDocuments;
    const updated = current.includes(docName)
      ? current.filter(d => d !== docName)
      : [...current, docName];
    
    setValidationData(prev => ({
      ...prev,
      missingDocuments: updated
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-medium text-gray-900">
            Document Validation
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <XCircle className="h-6 w-6" />
          </button>
        </div>
        
        <div className="p-4 overflow-y-auto">
          {/* Validation Status */}
          <div className="mb-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={validationData.isValidated}
                onChange={(e) => setValidationData(prev => ({
                  ...prev,
                  isValidated: e.target.checked
                }))}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-900">
                Mark as validated
              </span>
            </label>
          </div>

          {/* Selected Documents Review */}
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-900 mb-2">
              Review Selected Documents
            </h4>
            <div className="space-y-2">
              {appointment.selectedDocuments.map((doc, index) => (
                <div key={index} className="flex items-center justify-between p-2 border rounded">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">
                      {doc.isAlternative ? doc.alternativeName : doc.documentName}
                    </span>
                  </div>
                  <button
                    onClick={() => handleMissingDocumentToggle(doc.documentName)}
                    className={`text-xs px-2 py-1 rounded ${
                      validationData.missingDocuments.includes(doc.documentName)
                        ? 'bg-red-100 text-red-800'
                        : 'bg-gray-100 text-gray-700 hover:bg-red-100 hover:text-red-800'
                    }`}
                  >
                    {validationData.missingDocuments.includes(doc.documentName) ? 'Missing' : 'Mark Missing'}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Staff Notes */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Staff Notes
            </label>
            <textarea
              value={validationData.staffNotes}
              onChange={(e) => setValidationData(prev => ({
                ...prev,
                staffNotes: e.target.value
              }))}
              rows={3}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Add notes about document validation..."
            />
          </div>
        </div>
        
        <div className="p-4 border-t bg-gray-50 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={onSubmit}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Update Validation
          </button>
        </div>
      </div>
    </div>
  );
};

const NotificationModal = ({ appointment, notificationData, setNotificationData, onSubmit, onClose }) => {
  const availableDocuments = appointment.selectedDocuments?.map(doc => 
    doc.isAlternative ? doc.alternativeName : doc.documentName
  ) || [];

  const handleMissingDocumentToggle = (docName) => {
    const current = notificationData.missingDocuments;
    const updated = current.includes(docName)
      ? current.filter(d => d !== docName)
      : [...current, docName];
    
    setNotificationData(prev => ({
      ...prev,
      missingDocuments: updated
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-medium text-gray-900">
            Notify User About Missing Documents
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <XCircle className="h-6 w-6" />
          </button>
        </div>
        
        <div className="p-4 overflow-y-auto">
          {/* Missing Documents Selection */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Missing Documents
            </label>
            <div className="space-y-2">
              {availableDocuments.map((docName, index) => (
                <label key={index} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={notificationData.missingDocuments.includes(docName)}
                    onChange={() => handleMissingDocumentToggle(docName)}
                    className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                  />
                  <span className="text-sm text-gray-900">{docName}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Alternative Documents */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Alternative Documents (Optional)
            </label>
            <textarea
              value={notificationData.alternatives}
              onChange={(e) => setNotificationData(prev => ({
                ...prev,
                alternatives: e.target.value
              }))}
              rows={2}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Suggest alternative documents that can be used instead..."
            />
          </div>

          {/* Custom Message */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Custom Message
            </label>
            <textarea
              value={notificationData.message}
              onChange={(e) => setNotificationData(prev => ({
                ...prev,
                message: e.target.value
              }))}
              rows={3}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Add a custom message for the user..."
            />
          </div>
        </div>
        
        <div className="p-4 border-t bg-gray-50 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={onSubmit}
            disabled={notificationData.missingDocuments.length === 0}
            className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            Send Notification
          </button>
        </div>
      </div>
    </div>
  );
};

export default StaffDocumentView;