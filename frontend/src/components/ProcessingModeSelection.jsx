import React, { useState } from 'react';
import { 
  Building, 
  Wifi, 
  CheckCircle, 
  Clock, 
  IndianRupee,
  FileText,
  Shield,
  ArrowRight,
  ArrowLeft,
  Info
} from 'lucide-react';

const ProcessingModeSelection = ({ 
  service, 
  center, 
  selectedDocuments,
  onModeSelect,
  onBack
}) => {
  const [selectedMode, setSelectedMode] = useState(null);

  const handleModeSelection = (mode) => {
    setSelectedMode(mode);
  };

  const handleContinue = () => {
    if (selectedMode) {
      onModeSelect(selectedMode);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Choose Your Processing Mode
        </h2>
        <p className="text-gray-600">
          Select how you'd like to complete your service application
        </p>
      </div>

      {/* Service & Center Summary */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900">{service.name}</h3>
            <p className="text-sm text-gray-600 mt-1">{center.name}</p>
            <p className="text-sm text-gray-500">{center.address.city}, {center.address.district}</p>
          </div>
          <div className="text-right">
            <div className="text-lg font-semibold text-green-600">
              ₹{service.fee}
            </div>
            <div className="text-xs text-gray-500">{service.processingTime}</div>
          </div>
        </div>
        
        {selectedDocuments.length > 0 && (
          <div className="mt-3 pt-3 border-t border-blue-200">
            <div className="flex items-center text-sm text-blue-800">
              <Shield className="h-4 w-4 mr-2" />
              <span>{selectedDocuments.length} documents selected</span>
            </div>
          </div>
        )}
      </div>

      {/* Mode Selection Cards */}
      <div className="grid md:grid-cols-2 gap-6">
        
        {/* Physical Visit Mode */}
        <div
          onClick={() => handleModeSelection('physical')}
          className={`relative border-2 rounded-lg p-6 cursor-pointer transition-all ${
            selectedMode === 'physical'
              ? 'border-blue-600 bg-blue-50 shadow-lg'
              : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
          }`}
        >
          {selectedMode === 'physical' && (
            <div className="absolute top-4 right-4">
              <CheckCircle className="h-6 w-6 text-blue-600" />
            </div>
          )}
          
          <div className="flex items-center mb-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Building className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="ml-3 text-lg font-semibold text-gray-900">
              Visit Center
            </h3>
          </div>
          
          <p className="text-gray-600 mb-4">
            I am visiting the Akshaya center for service completion
          </p>
          
          <div className="space-y-3">
            <div className="flex items-start">
              <CheckCircle className="h-5 w-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
              <span className="text-sm text-gray-700">
                Book appointment for center visit
              </span>
            </div>
            
            <div className="flex items-start">
              <CheckCircle className="h-5 w-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
              <span className="text-sm text-gray-700">
                Bring physical documents
              </span>
            </div>
            
            <div className="flex items-start">
              <CheckCircle className="h-5 w-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
              <span className="text-sm text-gray-700">
                Staff assistance available
              </span>
            </div>
            
            <div className="flex items-start">
              <CheckCircle className="h-5 w-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
              <span className="text-sm text-gray-700">
                Standard processing time
              </span>
            </div>
          </div>
          
          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-gray-600">Booking Fee:</span>
              <span className="font-semibold text-gray-900">₹{service.serviceCharge || 0}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Pay at Center:</span>
              <span className="font-semibold text-gray-900">₹{service.fee - (service.serviceCharge || 0)}</span>
            </div>
          </div>
        </div>

        {/* Online Processing Mode */}
        <div
          onClick={() => handleModeSelection('online')}
          className={`relative border-2 rounded-lg p-6 cursor-pointer transition-all ${
            selectedMode === 'online'
              ? 'border-purple-600 bg-purple-50 shadow-lg'
              : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
          }`}
        >
          {selectedMode === 'online' && (
            <div className="absolute top-4 right-4">
              <CheckCircle className="h-6 w-6 text-purple-600" />
            </div>
          )}
          
          <div className="flex items-center mb-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Wifi className="h-8 w-8 text-purple-600" />
            </div>
            <h3 className="ml-3 text-lg font-semibold text-gray-900">
              Process Online
            </h3>
          </div>
          
          <p className="text-gray-600 mb-4">
            Process my service online with AI-assisted document verification
          </p>
          
          <div className="space-y-3">
            <div className="flex items-start">
              <CheckCircle className="h-5 w-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
              <span className="text-sm text-gray-700">
                Auto-fill from Document Locker
              </span>
            </div>
            
            <div className="flex items-start">
              <CheckCircle className="h-5 w-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
              <span className="text-sm text-gray-700">
                Upload & verify documents online
              </span>
            </div>
            
            <div className="flex items-start">
              <CheckCircle className="h-5 w-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
              <span className="text-sm text-gray-700">
                AI-assisted form filling
              </span>
            </div>
            
            <div className="flex items-start">
              <CheckCircle className="h-5 w-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
              <span className="text-sm text-gray-700">
                Remote processing by staff
              </span>
            </div>
          </div>
          
          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Full Payment Required:</span>
              <span className="font-semibold text-gray-900">₹{service.fee}</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">Complete payment upfront</p>
          </div>
          
          {service.onlineProcessingEnabled === false && (
            <div className="mt-3 bg-yellow-50 border border-yellow-200 rounded p-2">
              <div className="flex items-start">
                <Info className="h-4 w-4 text-yellow-600 mr-2 mt-0.5 flex-shrink-0" />
                <span className="text-xs text-yellow-800">
                  Online processing not available for this service
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Information Banner */}
      {selectedMode === 'online' && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="flex items-start">
            <Info className="h-5 w-5 text-purple-600 mr-3 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h4 className="font-medium text-purple-900 mb-1">
                How Online Processing Works
              </h4>
              <ul className="text-sm text-purple-800 space-y-1">
                <li>• Your documents from the Document Locker will be automatically loaded</li>
                <li>• You can review and edit the extracted information</li>
                <li>• Upload any missing documents with instant OCR processing</li>
                <li>• Authorized staff will securely access your data for form filling</li>
                <li>• Full payment is required upfront for online processing</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {selectedMode === 'physical' && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start">
            <Info className="h-5 w-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h4 className="font-medium text-blue-900 mb-1">
                What to Bring to Your Appointment
              </h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Original documents and photocopies</li>
                <li>• Valid ID proof</li>
                <li>• Any additional documents specified for the service</li>
                <li>• Payment can be made at the center</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Continue Button */}
      <div className="flex justify-between pt-4">
        <button
          onClick={onBack}
          className="btn-secondary flex items-center"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Center Selection
        </button>
        <button
          onClick={handleContinue}
          disabled={!selectedMode || (selectedMode === 'online' && service.onlineProcessingEnabled === false)}
          className="btn-primary flex items-center disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          Continue
          <ArrowRight className="ml-2 h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default ProcessingModeSelection;
