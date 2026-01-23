import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  Eye, 
  X, 
  Info,
  Shield,
  Clock,
  ArrowRight,
  ArrowLeft,
  Star,
  Image,
  Download
} from 'lucide-react';
import axios from 'axios';
import { getImageUrl } from '../config/api';

const DocumentValidation = ({ serviceId, onValidationComplete, onBack }) => {
  const [requirements, setRequirements] = useState(null);
  const [selectedDocuments, setSelectedDocuments] = useState([]);
  const [validation, setValidation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [previewModal, setPreviewModal] = useState({ open: false, document: null });

  useEffect(() => {
    fetchDocumentRequirements();
  }, [serviceId]);

  useEffect(() => {
    if (requirements && selectedDocuments.length >= 0) {
      validateSelection();
    }
  }, [selectedDocuments, requirements]);

  const fetchDocumentRequirements = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/documents/service/${serviceId}`);
      if (response.data.success) {
        setRequirements(response.data.data);
      } else {
        setError('Failed to fetch document requirements');
      }
    } catch (error) {
      console.error('Document requirements fetch error:', error);
      // Fallback: create basic requirements from service data if available
      setError('Document requirements not available. Please proceed to center selection.');
      // Allow proceeding without document validation
      setTimeout(() => {
        onValidationComplete([], { canProceed: true, message: 'Proceeding without document validation' });
      }, 2000);
    } finally {
      setLoading(false);
    }
  };

  const validateSelection = async () => {
    try {
      const response = await axios.get(`/api/documents/service/${serviceId}`);
      if (response.data.success) {
        const requirements = response.data.data;
        
        // Perform client-side validation with refined rules
        const { documents, validationRules } = requirements;
        const { totalRequired, minimumThreshold } = validationRules;
        const selectedCount = selectedDocuments.length;
        const meetsThreshold = selectedCount >= minimumThreshold;
        
        // Check category requirements
        let categoryRequirementsMet = true;
        const categoryValidation = {};
        
        if (validationRules.categoryRequirements) {
          validationRules.categoryRequirements.forEach(catReq => {
            const selectedInCategory = selectedDocuments.filter(selected => {
              const doc = documents.find(d => d._id === selected.documentId);
              return doc && doc.category === catReq.category;
            }).length;
            
            categoryValidation[catReq.category] = {
              required: catReq.minimumRequired,
              selected: selectedInCategory,
              met: selectedInCategory >= catReq.minimumRequired
            };
            
            if (selectedInCategory < catReq.minimumRequired) {
              categoryRequirementsMet = false;
            }
          });
        }
        
        // Check priority requirements
        let priorityRequirementsMet = true;
        const priorityValidation = {};
        
        if (validationRules.priorityRequirements) {
          validationRules.priorityRequirements.forEach(priReq => {
            const selectedInPriority = selectedDocuments.filter(selected => {
              const doc = documents.find(d => d._id === selected.documentId);
              return doc && doc.priority === priReq.priority;
            }).length;
            
            priorityValidation[priReq.priority] = {
              required: priReq.minimumRequired,
              selected: selectedInPriority,
              met: selectedInPriority >= priReq.minimumRequired
            };
            
            if (selectedInPriority < priReq.minimumRequired) {
              priorityRequirementsMet = false;
            }
          });
        }
        
        const isValid = meetsThreshold && categoryRequirementsMet && priorityRequirementsMet;
        const completionPercentage = Math.round((selectedCount / totalRequired) * 100);
        
        // Generate user-friendly message
        let message = '';
        if (isValid) {
          message = `Great! You have selected ${selectedCount} documents which meets the minimum requirement. You can proceed to center selection.`;
        } else {
          const issues = [];
          if (!meetsThreshold) {
            issues.push(`You need at least ${minimumThreshold} documents (currently have ${selectedCount})`);
          }
          
          Object.entries(categoryValidation).forEach(([category, validation]) => {
            if (!validation.met) {
              const needed = validation.required - validation.selected;
              issues.push(`Need ${needed} more ${category} document(s)`);
            }
          });
          
          Object.entries(priorityValidation).forEach(([priority, validation]) => {
            if (!validation.met) {
              const needed = validation.required - validation.selected;
              const priorityName = priority === '1' ? 'high priority' : priority === '2' ? 'medium priority' : 'low priority';
              issues.push(`Need ${needed} more ${priorityName} document(s)`);
            }
          });
          
          message = `Please select additional documents: ${issues.join(', ')}.`;
        }
        
        setValidation({
          isValid,
          selectedCount,
          totalRequired,
          minimumThreshold,
          meetsThreshold,
          categoryValidation,
          priorityValidation,
          categoryRequirementsMet,
          priorityRequirementsMet,
          canProceed: isValid,
          message,
          completionPercentage
        });
      }
    } catch (error) {
      console.error('Document validation error:', error);
      // Fallback validation for when API is not available
      if (requirements && selectedDocuments.length >= 0) {
        const meetsThreshold = selectedDocuments.length >= requirements.validationRules.minimumThreshold;
        setValidation({
          isValid: meetsThreshold,
          selectedCount: selectedDocuments.length,
          totalRequired: requirements.validationRules.totalRequired,
          minimumThreshold: requirements.validationRules.minimumThreshold,
          meetsThreshold,
          canProceed: meetsThreshold,
          message: meetsThreshold 
            ? 'Document selection is valid. You can proceed to center selection.'
            : `Please select ${requirements.validationRules.minimumThreshold - selectedDocuments.length} more documents.`,
          completionPercentage: Math.round((selectedDocuments.length / requirements.validationRules.totalRequired) * 100)
        });
      }
    }
  };

  const handleDocumentToggle = (document, isAlternative = false, alternativeDoc = null) => {
    const documentId = document._id;
    const existingIndex = selectedDocuments.findIndex(
      selected => selected.documentId === documentId
    );

    if (existingIndex >= 0) {
      // Remove if already selected
      setSelectedDocuments(prev => prev.filter((_, index) => index !== existingIndex));
    } else {
      // Add new selection
      const newSelection = {
        documentId,
        documentName: document.name,
        isAlternative,
        alternativeName: alternativeDoc?.name || null,
        selectedAt: new Date(),
        priority: document.priority,
        category: document.category
      };
      setSelectedDocuments(prev => [...prev, newSelection]);
    }
  };

  const isDocumentSelected = (documentId) => {
    return selectedDocuments.some(selected => selected.documentId === documentId);
  };

  const handlePreview = (document) => {
    setPreviewModal({ open: true, document });
  };

  const handleProceed = () => {
    if (validation && validation.canProceed) {
      onValidationComplete(selectedDocuments, validation);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading document requirements...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <p className="text-red-600 mb-4">{error}</p>
        <button 
          onClick={fetchDocumentRequirements}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!requirements) {
    return (
      <div className="text-center py-12">
        <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">No document requirements found for this service.</p>
        <button 
          onClick={() => onValidationComplete([], { canProceed: true })}
          className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Continue
        </button>
      </div>
    );
  }

  const { documents, validationRules, instructions } = requirements;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Select Your Documents</h2>
        <p className="text-gray-600 mb-4">{instructions}</p>
        
        {/* Requirements Summary */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <Info className="h-5 w-5 text-blue-600" />
            <span className="font-medium text-blue-900">Requirements Summary</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-blue-700">Total Documents:</span>
              <span className="font-medium ml-2">{validationRules.totalRequired}</span>
            </div>
            <div>
              <span className="text-blue-700">Minimum Required:</span>
              <span className="font-medium ml-2">{validationRules.minimumThreshold}</span>
            </div>
            <div>
              <span className="text-blue-700">Selected:</span>
              <span className="font-medium ml-2">{selectedDocuments.length}</span>
            </div>
          </div>
          
          {/* Progress Bar */}
          {validation && (
            <div className="mt-3">
              <div className="flex justify-between text-xs text-blue-700 mb-1">
                <span>Progress</span>
                <span>{validation.completionPercentage}%</span>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${validation.completionPercentage}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Document List */}
      <div className="space-y-4 mb-8">
        {documents.map((document, index) => (
          <EnhancedDocumentCard
            key={document._id || index}
            document={document}
            isSelected={isDocumentSelected(document._id)}
            onToggle={handleDocumentToggle}
            onPreview={handlePreview}
          />
        ))}
      </div>

      {/* Validation Status */}
      {validation && (
        <div className={`border rounded-lg p-4 mb-6 ${
          validation.canProceed 
            ? 'bg-green-50 border-green-200' 
            : 'bg-yellow-50 border-yellow-200'
        }`}>
          <div className="flex items-center space-x-2 mb-2">
            {validation.canProceed ? (
              <CheckCircle className="h-5 w-5 text-green-600" />
            ) : (
              <AlertCircle className="h-5 w-5 text-yellow-600" />
            )}
            <span className={`font-medium ${
              validation.canProceed ? 'text-green-900' : 'text-yellow-900'
            }`}>
              {validation.message}
            </span>
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className={validation.canProceed ? 'text-green-700' : 'text-yellow-700'}>
                Selected: {validation.selectedCount} / {validation.minimumThreshold} minimum
              </span>
            </div>
            <div>
              <span className={validation.meetsThreshold ? 'text-green-700' : 'text-red-700'}>
                Threshold: {validation.meetsThreshold ? '✓' : '✗'}
              </span>
            </div>
          </div>

          {/* Category Requirements Status */}
          {validation.categoryValidation && Object.keys(validation.categoryValidation).length > 0 && (
            <div className="mt-3 p-3 bg-white border border-gray-200 rounded">
              <p className="text-sm font-medium text-gray-800 mb-2">Category Requirements:</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {Object.entries(validation.categoryValidation).map(([category, catValidation]) => (
                  <div key={category} className="flex justify-between">
                    <span className="capitalize">{category}:</span>
                    <span className={catValidation.met ? 'text-green-600' : 'text-red-600'}>
                      {catValidation.selected}/{catValidation.required} {catValidation.met ? '✓' : '✗'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-between">
        <button
          onClick={onBack}
          className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center space-x-2"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back</span>
        </button>
        
        <button
          onClick={handleProceed}
          disabled={!validation || !validation.canProceed}
          className={`px-6 py-2 rounded-lg flex items-center space-x-2 ${
            validation && validation.canProceed
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          <span>Proceed to Center Selection</span>
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

const EnhancedDocumentCard = ({ document, isSelected, onToggle, onPreview }) => {
  const [showAlternatives, setShowAlternatives] = useState(false);

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 1: return 'bg-red-100 text-red-800 border-red-200';
      case 2: return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 3: return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityLabel = (priority) => {
    switch (priority) {
      case 1: return 'High Priority';
      case 2: return 'Medium Priority';
      case 3: return 'Low Priority';
      default: return 'Standard';
    }
  };

  return (
    <div className={`border rounded-lg p-4 transition-all ${
      isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
    }`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
            <button
              onClick={() => onToggle(document)}
              className={`flex items-center justify-center w-5 h-5 rounded border-2 ${
                isSelected 
                  ? 'bg-blue-600 border-blue-600' 
                  : 'border-gray-300 hover:border-blue-500'
              }`}
            >
              {isSelected && <CheckCircle className="h-3 w-3 text-white" />}
            </button>
            
            <div className="flex-1">
              <h3 className="font-medium text-gray-900">{document.name}</h3>
              <div className="flex items-center space-x-2 mt-1">
                {document.isRequired ? (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200">
                    <Shield className="h-3 w-3 mr-1" />
                    Required
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">
                    Optional
                  </span>
                )}
                
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(document.priority)}`}>
                  <Star className="h-3 w-3 mr-1" />
                  {getPriorityLabel(document.priority)}
                </span>
                
                {document.category && (
                  <span className="text-xs text-gray-500 capitalize bg-gray-100 px-2 py-1 rounded">
                    {document.category}
                  </span>
                )}
                
                {document.validityPeriod && (
                  <span className="inline-flex items-center text-xs text-gray-500">
                    <Clock className="h-3 w-3 mr-1" />
                    Valid: {document.validityPeriod}
                  </span>
                )}
              </div>
            </div>
          </div>
          
          <p className="text-gray-600 text-sm mb-3">{document.description}</p>
          
          {/* Reference Image Preview */}
          {(document.referenceImage || document.sampleUrl || document.imageUrl) && (
            <div className="mb-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <img 
                    src={getImageUrl(document.referenceImage || document.sampleUrl || document.imageUrl)} 
                    alt={`Reference for ${document.name}`}
                    className="w-16 h-16 object-cover rounded border border-gray-300"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                  <div style={{ display: 'none' }} className="w-16 h-16 bg-gray-200 rounded border border-gray-300 flex items-center justify-center">
                    <Image className="h-6 w-6 text-gray-400" />
                  </div>
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-600 mb-1">Reference Image</p>
                  <button
                    onClick={() => onPreview(document)}
                    className="text-blue-600 text-xs hover:text-blue-800 flex items-center space-x-1"
                  >
                    <Eye className="h-3 w-3" />
                    <span>View Full Size</span>
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {/* Acceptable Formats */}
          {document.acceptableFormats && document.acceptableFormats.length > 0 && (
            <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded">
              <p className="text-xs font-medium text-blue-800 mb-1">Acceptable Formats:</p>
              <div className="flex flex-wrap gap-1">
                {document.acceptableFormats.map((format, index) => (
                  <span key={index} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                    {format}
                  </span>
                ))}
              </div>
            </div>
          )}
          
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
                    <div key={index} className="bg-gray-50 border border-gray-200 rounded p-3">
                      <div className="flex items-start space-x-3">
                        {(alt.referenceImage || alt.imageUrl) && (
                          <div className="relative group flex-shrink-0">
                            <img 
                              src={getImageUrl(alt.referenceImage || alt.imageUrl)} 
                              alt={`Reference for ${alt.name}`}
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
                            <div className="hidden w-12 h-12 bg-gray-200 rounded border border-gray-300 flex-col items-center justify-center">
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
                        )}
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-sm text-gray-900">{alt.name}</p>
                              <p className="text-xs text-gray-600">{alt.description}</p>
                              {alt.notes && (
                                <p className="text-xs text-blue-600 mt-1">{alt.notes}</p>
                              )}
                            </div>
                            <div className="flex items-center space-x-2">
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
                              <button
                                onClick={() => onToggle(document, true, alt)}
                                className="text-blue-600 text-xs hover:text-blue-800 px-2 py-1 border border-blue-200 rounded hover:bg-blue-50"
                              >
                                Select This
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        
        <div className="flex flex-col space-y-2 ml-4">
          {document.referenceImage && (
            <button
              onClick={() => onPreview(document)}
              className="flex items-center space-x-1 text-blue-600 text-sm hover:text-blue-800 px-3 py-1 border border-blue-200 rounded hover:bg-blue-50"
            >
              <Eye className="h-4 w-4" />
              <span>Preview</span>
            </button>
          )}
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
            Reference: {document.name}
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
                alt={`Reference ${document.name}`}
                className="max-w-full h-auto mx-auto rounded-lg shadow-lg border border-gray-200"
                style={{ maxHeight: '60vh' }}
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'block';
                }}
              />
              <div style={{ display: 'none' }} className="text-gray-500 py-12">
                <Image className="h-12 w-12 mx-auto mb-2" />
                <p>Reference image not available</p>
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-500 py-12">
              <Image className="h-12 w-12 mx-auto mb-2" />
              <p>No reference image available</p>
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
            
            {document.acceptableFormats && document.acceptableFormats.length > 0 && (
              <div className="mt-3">
                <p className="text-sm font-medium text-gray-700 mb-2">Acceptable Formats:</p>
                <div className="flex flex-wrap gap-2">
                  {document.acceptableFormats.map((format, index) => (
                    <span key={index} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                      {format}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {document.validityPeriod && (
              <div className="mt-2 flex items-center text-sm text-gray-600">
                <Clock className="h-4 w-4 mr-1" />
                <span>Valid for: {document.validityPeriod}</span>
              </div>
            )}
          </div>
          
          {document.alternatives && document.alternatives.length > 0 && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Alternative Documents</h4>
              <p className="text-sm text-blue-700 mb-3">You can use any one of these instead:</p>
              <div className="space-y-2">
                {document.alternatives.map((alt, index) => (
                  <div key={index} className="flex items-start space-x-3 p-2 bg-white rounded border">
                    {(alt.referenceImage || alt.imageUrl) && (
                      <img 
                        src={getImageUrl(alt.referenceImage || alt.imageUrl)} 
                        alt={`Reference for ${alt.name}`}
                        className="w-12 h-12 object-cover rounded border flex-shrink-0"
                      />
                    )}
                    <div>
                      <p className="font-medium text-sm text-gray-900">{alt.name}</p>
                      <p className="text-xs text-gray-600">{alt.description}</p>
                      {alt.notes && (
                        <p className="text-xs text-blue-600 mt-1">{alt.notes}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
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

export default DocumentValidation;