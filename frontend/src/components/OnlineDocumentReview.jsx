import React, { useState, useEffect } from 'react';
import {
  FileText,
  CheckCircle,
  AlertTriangle,
  Edit,
  Upload,
  Loader2,
  Shield,
  Eye,
  Lock,
  ArrowRight,
  ArrowLeft
} from 'lucide-react';
import axios from 'axios';
import { auth } from '../firebase';
import StructuredDataEditor from './StructuredDataEditor';
import DocumentUploadModal from './DocumentUploadModal';

const OnlineDocumentReview = ({ 
  selectedDocuments, 
  serviceId, 
  onDataConfirm,
  onBack 
}) => {
  const [pin, setPin] = useState('');
  const [pinVerified, setPinVerified] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [documentData, setDocumentData] = useState([]);
  const [missingDocuments, setMissingDocuments] = useState([]);
  const [editingDocument, setEditingDocument] = useState(null);
  const [uploadingDocument, setUploadingDocument] = useState(null);
  const [showPinInput, setShowPinInput] = useState(true);
  const [previewDocId, setPreviewDocId] = useState(null);
  const [docImageUrls, setDocImageUrls] = useState({});

  const handlePinSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Create a fresh axios instance with proper auth
      const instance = axios.create();
      
      // Get the token - try multiple sources
      let token = localStorage.getItem('token');
      
      console.log('Token from localStorage:', token ? 'Found' : 'Not found');
      
      if (!token && auth.currentUser) {
        console.log('Getting token from Firebase...');
        token = await auth.currentUser.getIdToken(true); // Force refresh
        console.log('Firebase token obtained:', token ? 'Yes' : 'No');
      }
      
      if (!token) {
        throw new Error('Authentication required. Please log in again.');
      }

      console.log('Making request to /api/document-locker/documents/for-service');
      console.log('Service ID:', serviceId);
      console.log('Required documents:', selectedDocuments.length);

      // Verify PIN and fetch documents
      const response = await instance.post('/api/document-locker/documents/for-service', {
        pin,
        serviceId,
        requiredDocuments: selectedDocuments
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Response received:', response.data);

      if (response.data.success) {
        setPinVerified(true);
        setShowPinInput(false);
        setDocumentData(response.data.availableDocuments || []);
        setMissingDocuments(response.data.missingDocuments || []);
      }
    } catch (error) {
      console.error('PIN verification error:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      
      // Handle specific error cases
      if (error.response?.status === 423) {
        // Locker is locked
        const message = error.response?.data?.message || 'Locker is temporarily locked due to multiple failed attempts.';
        setError(message);
      } else if (error.response?.status === 401) {
        setError('Authentication failed. Please refresh the page and try again.');
      } else if (error.response?.status === 404) {
        setError('Document locker not found. Please create a locker first.');
      } else {
        setError(error.response?.data?.message || 'Failed to verify PIN. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEditDocument = (document) => {
    setEditingDocument(document);
  };

  const handleSaveEdit = async (documentId, updatedData) => {
    try {
      // Get fresh token
      let token = localStorage.getItem('token');
      if (!token && auth.currentUser) {
        token = await auth.currentUser.getIdToken(true);
      }

      const response = await axios.put(
        `/api/document-locker/documents/${documentId}/ocr-data`,
        {
          pin,
          extractedData: updatedData
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        // Update local state
        setDocumentData(prev =>
          prev.map(doc =>
            doc._id === documentId
              ? { ...doc, extractedData: updatedData }
              : doc
          )
        );
        setEditingDocument(null);
      }
    } catch (error) {
      console.error('Save edit error:', error);
      setError('Failed to save changes');
    }
  };

  const getDocumentImageUrl = (document) => {
    if (!document.filePath) return null;
    const normalized = document.filePath.replace(/\\/g, '/');
    const idx = normalized.indexOf('uploads/');
    if (idx === -1) return null;
    return '/' + normalized.slice(idx);
  };

  const handleViewDocument = async (docId) => {
    if (previewDocId === docId) {
      setPreviewDocId(null);
      return;
    }
    // If we already fetched this image, just show it
    if (docImageUrls[docId]) {
      setPreviewDocId(docId);
      return;
    }
    try {
      let token = localStorage.getItem('token');
      if (!token && auth.currentUser) token = await auth.currentUser.getIdToken(true);
      const response = await fetch(`/api/document-locker/documents/${docId}/view`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin })
      });
      if (!response.ok) return;
      const blob = await response.blob();
      if (blob.type.startsWith('image/') || blob.type === 'application/pdf') {
        const url = URL.createObjectURL(blob);
        setDocImageUrls(prev => ({ ...prev, [docId]: { url, type: blob.type } }));
        setPreviewDocId(docId);
      }
    } catch (err) {
      console.error('Failed to load document image:', err);
    }
  };

  const normalizeDocumentNameToType = (documentName) => {
    if (!documentName) return null;
    const nameToTypeMap = {
      'aadhaar card': 'aadhaar_card', 'aadhar card': 'aadhaar_card',
      'pan card': 'pan_card', 'voter id': 'voter_id', 'voter id card': 'voter_id',
      'driving license': 'driving_license', 'driving licence': 'driving_license',
      'passport': 'passport', 'ration card': 'ration_card',
      'birth certificate': 'birth_certificate', 'death certificate': 'death_certificate',
      'income certificate': 'income_certificate', 'caste certificate': 'caste_certificate',
      'community certificate': 'community_certificate', 'domicile certificate': 'domicile_certificate',
      'residence certificate': 'residence_certificate', 'marriage certificate': 'marriage_certificate',
      'bank passbook': 'bank_passbook', 'salary slip': 'salary_slip',
      'property document': 'property_document', 'educational certificate': 'educational_certificate',
      'medical certificate': 'medical_certificate', 'photo': 'photo', 'photograph': 'photo',
    };
    return nameToTypeMap[documentName.toLowerCase().trim()] ||
      documentName.toLowerCase().trim().replace(/\s+/g, '_');
  };

  const handleUploadMissing = (doc) => {
    setUploadingDocument(doc);
  };

  const handleUploadComplete = (newDocument, uploadedDocType) => {
    // Backend returns documentId, normalize to _id for consistency with locker docs
    const normalizedDoc = { ...newDocument, _id: newDocument._id || newDocument.documentId };
    setDocumentData(prev => [...prev, normalizedDoc]);
    setMissingDocuments(prev =>
      prev.filter(doc => {
        const docType = normalizeDocumentNameToType(doc.documentName);
        return docType !== uploadedDocType && doc.documentId !== newDocument.documentId;
      })
    );
    setUploadingDocument(null);
  };

  const handleConfirmData = () => {
    // Prepare structured data for appointment
    const structuredData = {
      documents: documentData.map(doc => ({
        documentType: doc.documentType,
        documentId: doc._id,
        extractedData: doc.extractedData,
        isVerified: doc.extractedData?.isVerified || false,
        verifiedAt: doc.extractedData?.verifiedAt
      })),
      userProfile: aggregateUserProfile(documentData)
    };

    onDataConfirm(structuredData);
  };

  const aggregateUserProfile = (documents) => {
    const profile = {};
    
    documents.forEach(doc => {
      if (doc.extractedData) {
        // Aggregate common fields
        if (doc.extractedData.fullName && !profile.fullName) {
          profile.fullName = doc.extractedData.fullName;
        }
        if (doc.extractedData.dateOfBirth && !profile.dateOfBirth) {
          profile.dateOfBirth = doc.extractedData.dateOfBirth;
        }
        if (doc.extractedData.gender && !profile.gender) {
          profile.gender = doc.extractedData.gender;
        }
        if (doc.extractedData.address && !profile.address) {
          profile.address = doc.extractedData.address;
        }
      }
    });

    return profile;
  };

  const getDataCompletenessScore = (document) => {
    if (!document.extractedData) return 0;
    
    const relevantFields = getRelevantFields(document.documentType);
    const filledFields = relevantFields.filter(
      field => document.extractedData[field] && document.extractedData[field] !== ''
    );
    
    return Math.round((filledFields.length / relevantFields.length) * 100);
  };

  const getRelevantFields = (documentType) => {
    const fieldMap = {
      aadhaar_card: ['aadhaarNumber', 'fullName', 'dateOfBirth', 'gender', 'address'],
      pan_card: ['panNumber', 'fullName', 'fatherName', 'dateOfBirth'],
      voter_id: ['voterIdNumber', 'fullName', 'dateOfBirth', 'address'],
      ration_card: ['rationCardNumber', 'headOfFamily', 'address'],
      birth_certificate: ['childName', 'dateOfBirth', 'fatherName', 'motherName'],
      income_certificate: ['fullName', 'annualIncome', 'address'],
      caste_certificate: ['fullName', 'caste', 'address']
    };
    
    return fieldMap[documentType] || ['fullName', 'address'];
  };

  if (showPinInput) {
    return (
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-4">
              <Lock className="h-8 w-8 text-purple-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Unlock Document Locker
            </h2>
            <p className="text-gray-600">
              Enter your PIN to access your stored documents
            </p>
          </div>

          <form onSubmit={handlePinSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Document Locker PIN
              </label>
              <input
                type="password"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                maxLength={6}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-center text-2xl tracking-widest"
                placeholder="••••"
                required
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="flex items-center">
                  <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
                  <span className="text-red-800 text-sm">{error}</span>
                </div>
              </div>
            )}

            <div className="flex space-x-3">
              <button
                type="button"
                onClick={onBack}
                className="flex-1 btn-secondary"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading || pin.length < 4}
                className="flex-1 btn-primary disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Verifying...
                  </div>
                ) : (
                  'Unlock'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Review Your Documents
          </h2>
          <p className="text-gray-600 mt-1">
            Verify and edit your document information before submission
          </p>
        </div>
        <div className="flex items-center space-x-2 text-sm text-green-600 bg-green-50 px-3 py-2 rounded-full">
          <Shield className="h-4 w-4" />
          <span>Locker Unlocked</span>
        </div>
      </div>

      {/* Available Documents */}
      {documentData.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Available Documents ({documentData.length})
          </h3>
          
          {documentData.map((document) => {
            const completeness = getDataCompletenessScore(document);
            const docId = document._id || document.documentId;
            
            return (
              <div
                key={docId}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <FileText className="h-5 w-5 text-blue-600" />
                      <div>
                        <h4 className="font-medium text-gray-900">{document.name}</h4>
                        <p className="text-sm text-gray-500 capitalize">
                          {document.documentType.replace(/_/g, ' ')}
                        </p>
                      </div>
                    </div>
                    
                    {/* Data Completeness */}
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-gray-600">Data Completeness</span>
                        <span className={`font-medium ${
                          completeness >= 80 ? 'text-green-600' :
                          completeness >= 50 ? 'text-yellow-600' :
                          'text-red-600'
                        }`}>
                          {completeness}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            completeness >= 80 ? 'bg-green-600' :
                            completeness >= 50 ? 'bg-yellow-600' :
                            'bg-red-600'
                          }`}
                          style={{ width: `${completeness}%` }}
                        />
                      </div>
                    </div>

                    {/* Key Data Preview */}
                    {document.extractedData && (
                      <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                        {document.extractedData.fullName && (
                          <div>
                            <span className="text-gray-500">Name:</span>
                            <span className="ml-2 text-gray-900">{document.extractedData.fullName}</span>
                          </div>
                        )}
                        {document.extractedData.dateOfBirth && (
                          <div>
                            <span className="text-gray-500">DOB:</span>
                            <span className="ml-2 text-gray-900">
                              {new Date(document.extractedData.dateOfBirth).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col space-y-2">
                    <button
                      onClick={() => handleViewDocument(docId)}
                      className="flex items-center space-x-1 text-gray-500 hover:text-gray-700 text-sm"
                    >
                      <Eye className="h-4 w-4" />
                      <span>{previewDocId === docId ? 'Hide' : 'View'}</span>
                    </button>
                    <button
                      onClick={() => handleEditDocument(document)}
                      className="flex items-center space-x-1 text-blue-600 hover:text-blue-700 text-sm"
                    >
                      <Edit className="h-4 w-4" />
                      <span>Edit</span>
                    </button>
                    {document.extractedData?.isVerified && (
                      <div className="flex items-center space-x-1 text-green-600 text-sm">
                        <CheckCircle className="h-4 w-4" />
                        <span>Verified</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Document Image Preview */}
                {previewDocId === docId && docImageUrls[docId] && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    {docImageUrls[docId].type === 'application/pdf' ? (
                      <iframe
                        src={docImageUrls[docId].url}
                        className="w-full h-72 rounded-lg border border-gray-200"
                        title={document.name}
                      />
                    ) : (
                      <img
                        src={docImageUrls[docId].url}
                        alt={document.name}
                        className="max-h-72 w-auto rounded-lg border border-gray-200 mx-auto block"
                      />
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Missing Documents */}
      {missingDocuments.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Missing Documents ({missingDocuments.length})
          </h3>
          
          {missingDocuments.map((doc) => (
            <div
              key={doc.documentId}
              className="border border-yellow-200 bg-yellow-50 rounded-lg p-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <AlertTriangle className="h-5 w-5 text-yellow-600" />
                  <div>
                    <h4 className="font-medium text-gray-900">
                      {doc.isAlternative ? doc.alternativeName : doc.documentName}
                    </h4>
                    <p className="text-sm text-gray-600">
                      This document is not in your locker
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleUploadMissing(doc)}
                  className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  <Upload className="h-4 w-4" />
                  <span>Upload</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-between pt-6 border-t">
        <button
          onClick={onBack}
          className="btn-secondary flex items-center"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </button>
        <button
          onClick={handleConfirmData}
          disabled={missingDocuments.length > 0}
          className="btn-primary flex items-center disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          Confirm & Continue
          <ArrowRight className="ml-2 h-4 w-4" />
        </button>
      </div>

      {/* Modals */}
      {editingDocument && (
        <StructuredDataEditor
          document={editingDocument}
          onSave={(updatedData) => handleSaveEdit(editingDocument._id, updatedData)}
          onCancel={() => setEditingDocument(null)}
        />
      )}

      {uploadingDocument && (
        <DocumentUploadModal
          documentType={uploadingDocument}
          pin={pin}
          onUploadComplete={(newDoc) => handleUploadComplete(newDoc, normalizeDocumentNameToType(uploadingDocument?.documentName) || uploadingDocument)}
          onCancel={() => setUploadingDocument(null)}
        />
      )}
    </div>
  );
};

export default OnlineDocumentReview;
