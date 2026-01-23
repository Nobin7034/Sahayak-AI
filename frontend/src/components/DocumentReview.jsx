import React, { useState } from 'react';
import { 
  FileText, 
  Eye, 
  X, 
  Info,
  Shield,
  Clock,
  ArrowRight,
  ArrowLeft,
  CheckCircle
} from 'lucide-react';
import { getImageUrl } from '../config/api';

const DocumentReview = ({ requirements, onReviewComplete, onBack }) => {
  const [previewModal, setPreviewModal] = useState({ open: false, document: null });

  if (!requirements) {
    return (
      <div className="text-center py-12">
        <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">Loading document requirements...</p>
      </div>
    );
  }

  const { documents, minimumRequired, totalDocuments, instructions } = requirements;

  const handlePreview = (document) => {
    setPreviewModal({ open: true, document });
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Document Requirements Review</h2>
        <p className="text-gray-600 mb-4">
          Please review the documents required for this service. You can view sample documents to understand the format.
        </p>
        
        {/* Requirements Summary */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <Info className="h-5 w-5 text-blue-600" />
            <span className="font-medium text-blue-900">Requirements Summary</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-blue-700">Total Documents Available:</span>
              <span className="font-medium ml-2">{totalDocuments}</span>
            </div>
            <div>
              <span className="text-blue-700">Minimum Required:</span>
              <span className="font-medium ml-2">{minimumRequired}</span>
            </div>
          </div>
          <p className="text-blue-800 text-sm mt-2">{instructions}</p>
        </div>
      </div>

      {/* Document List */}
      <div className="space-y-4 mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Available Documents</h3>
        {documents.map((document, index) => (
          <DocumentReviewCard
            key={document._id || index}
            document={document}
            onPreview={handlePreview}
          />
        ))}
      </div>

      {/* Important Notes */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
        <div className="flex items-center space-x-2 mb-2">
          <Shield className="h-5 w-5 text-yellow-600" />
          <span className="font-medium text-yellow-900">Important Notes</span>
        </div>
        <ul className="text-yellow-800 text-sm space-y-1">
          <li>• All documents must be original or self-attested copies</li>
          <li>• Ensure all information is clearly visible and matches your application details</li>
          <li>• You need at least {minimumRequired} documents from the list above</li>
          <li>• Alternative documents are acceptable where mentioned</li>
          <li>• Bring both original and photocopies to your appointment</li>
        </ul>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between">
        <button
          onClick={onBack}
          className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center space-x-2"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Services</span>
        </button>
        
        <button
          onClick={onReviewComplete}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
        >
          <span>I Understand - Select My Documents</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>

      {/* Preview Modal */}
      {previewModal.open && (
        <DocumentPreviewModal
          document={previewModal.document}
          onClose={() => setPreviewModal({ open: false, document: null })}
        />
      )}
    </div>
  );
};

const DocumentReviewCard = ({ document, onPreview }) => {
  const [showAlternatives, setShowAlternatives] = useState(false);

  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
      <div className="flex items-start space-x-4">
        {/* Demo Image Section */}
        <div className="flex-shrink-0">
          {document.referenceImage || document.sampleUrl || document.imageUrl ? (
            <div className="relative group">
              <img 
                src={getImageUrl(document.referenceImage || document.sampleUrl || document.imageUrl)} 
                alt={`Demo ${document.name}`}
                className="w-24 h-24 object-cover rounded-lg border border-gray-300 cursor-pointer hover:border-blue-500 transition-colors"
                onClick={() => onPreview(document)}
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
              <div className="hidden w-24 h-24 bg-gray-100 rounded-lg border border-gray-300 flex-col items-center justify-center">
                <FileText className="h-8 w-8 text-gray-400 mb-1" />
                <span className="text-xs text-gray-500 text-center">No Image</span>
              </div>
              {/* Hover overlay */}
              <div 
                className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 rounded-lg transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer"
                onClick={() => onPreview(document)}
              >
                <Eye className="h-6 w-6 text-white" />
              </div>
            </div>
          ) : (
            <div className="w-24 h-24 bg-gray-100 rounded-lg border border-gray-300 flex flex-col items-center justify-center">
              <FileText className="h-8 w-8 text-gray-400 mb-1" />
              <span className="text-xs text-gray-500 text-center">No Demo</span>
            </div>
          )}
        </div>

        {/* Content Section */}
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
            <div>
              <h3 className="font-medium text-gray-900 text-lg">{document.name}</h3>
              <div className="flex items-center space-x-2 mt-1">
                {document.isMandatory || document.isRequired ? (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    <Shield className="h-3 w-3 mr-1" />
                    Mandatory
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    Optional
                  </span>
                )}
                
                {document.category && (
                  <span className="text-xs text-gray-500 capitalize bg-blue-50 px-2 py-1 rounded">
                    {document.category}
                  </span>
                )}
                
                {document.validityPeriod && (
                  <span className="inline-flex items-center text-xs text-gray-500 bg-green-50 px-2 py-1 rounded">
                    <Clock className="h-3 w-3 mr-1" />
                    Valid: {document.validityPeriod}
                  </span>
                )}
              </div>
            </div>
          </div>
          
          <p className="text-gray-600 text-sm mb-3">{document.description}</p>
          
          {document.notes && (
            <div className="bg-yellow-50 border border-yellow-200 rounded p-2 mb-3">
              <p className="text-yellow-800 text-xs">{document.notes}</p>
            </div>
          )}
          
          {document.alternatives && document.alternatives.length > 0 && (
            <div className="mt-3">
              <button
                onClick={() => setShowAlternatives(!showAlternatives)}
                className="text-blue-600 text-sm hover:text-blue-800 flex items-center space-x-1"
              >
                <span>{showAlternatives ? 'Hide' : 'Show'} alternatives ({document.alternatives.length})</span>
                <ArrowRight className={`h-3 w-3 transition-transform ${showAlternatives ? 'rotate-90' : ''}`} />
              </button>
              
              {showAlternatives && (
                <div className="mt-2 space-y-2">
                  <p className="text-xs text-gray-600 font-medium">Any one of the following:</p>
                  {document.alternatives.map((alt, index) => (
                    <div key={index} className="bg-gray-50 border border-gray-200 rounded p-3 flex items-start space-x-3">
                      {/* Alternative document demo image */}
                      {(alt.referenceImage || alt.imageUrl) ? (
                        <div className="relative group flex-shrink-0">
                          <img 
                            src={getImageUrl(alt.referenceImage || alt.imageUrl)} 
                            alt={`Demo ${alt.name}`}
                            className="w-12 h-12 object-cover rounded border border-gray-300 cursor-pointer hover:border-blue-500 transition-colors"
                            onClick={() => onPreview({
                              ...alt,
                              name: `${document.name} - ${alt.name}`,
                              referenceImage: alt.referenceImage || alt.imageUrl,
                              description: alt.description || `Alternative document: ${alt.name}`
                            })}
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                          <div className="hidden w-12 h-12 bg-gray-200 rounded border border-gray-300 flex-col items-center justify-center flex-shrink-0">
                            <FileText className="h-4 w-4 text-gray-400" />
                          </div>
                          {/* Hover overlay for alternative */}
                          <div 
                            className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 rounded transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer"
                            onClick={() => onPreview({
                              ...alt,
                              name: `${document.name} - ${alt.name}`,
                              referenceImage: alt.referenceImage || alt.imageUrl,
                              description: alt.description || `Alternative document: ${alt.name}`
                            })}
                          >
                            <Eye className="h-4 w-4 text-white" />
                          </div>
                        </div>
                      ) : (
                        <div className="w-12 h-12 bg-gray-200 rounded border border-gray-300 flex flex-col items-center justify-center flex-shrink-0">
                          <FileText className="h-4 w-4 text-gray-400" />
                        </div>
                      )}
                      
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-sm text-gray-900">{alt.name}</p>
                          {(alt.referenceImage || alt.imageUrl) && (
                            <button
                              onClick={() => onPreview({
                                ...alt,
                                name: `${document.name} - ${alt.name}`,
                                referenceImage: alt.referenceImage || alt.imageUrl,
                                description: alt.description || `Alternative document: ${alt.name}`
                              })}
                              className="flex items-center space-x-1 text-blue-600 text-xs hover:text-blue-800 px-2 py-1 border border-blue-200 rounded hover:bg-blue-50"
                            >
                              <Eye className="h-3 w-3" />
                              <span>View</span>
                            </button>
                          )}
                        </div>
                        <p className="text-xs text-gray-600">{alt.description}</p>
                        {alt.notes && (
                          <p className="text-xs text-blue-600 mt-1">{alt.notes}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          
          {/* Action button moved to bottom right */}
          <div className="flex justify-end mt-3">
            {(document.referenceImage || document.sampleUrl || document.imageUrl) && (
              <button
                onClick={() => onPreview(document)}
                className="flex items-center space-x-1 text-blue-600 text-sm hover:text-blue-800 px-3 py-1 border border-blue-200 rounded hover:bg-blue-50"
              >
                <Eye className="h-4 w-4" />
                <span>View Full Size</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const DocumentPreviewModal = ({ document, onClose }) => {
  return (
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
            <X className="h-6 w-6" />
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
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'block';
                }}
              />
              <div style={{ display: 'none' }} className="text-gray-500 py-12">
                <FileText className="h-12 w-12 mx-auto mb-2" />
                <p>Sample document preview not available</p>
              </div>
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
            {document.validityPeriod && (
              <div className="mt-2 flex items-center text-sm text-gray-600">
                <Clock className="h-4 w-4 mr-1" />
                <span>Valid for: {document.validityPeriod}</span>
              </div>
            )}
          </div>
        </div>
        
        <div className="p-4 border-t bg-gray-50 flex justify-between items-center">
          <div className="text-sm text-gray-600">
            Click and drag to move • Scroll to zoom
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default DocumentReview;