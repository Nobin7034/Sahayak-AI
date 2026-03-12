import React, { useState, useRef } from 'react';
import {
  X,
  Upload,
  Camera,
  FileText,
  Loader2,
  CheckCircle,
  AlertTriangle,
  QrCode
} from 'lucide-react';
import axios from 'axios';
import { auth } from '../firebase';

const DocumentUploadModal = ({ documentType, pin, onUploadComplete, onCancel }) => {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [uploadMethod, setUploadMethod] = useState('file'); // 'file', 'camera', 'qr'
  const [performOCR, setPerformOCR] = useState(true); // User choice: perform OCR or skip
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError('');
      
      // Create preview for images
      if (selectedFile.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreview(reader.result);
        };
        reader.readAsDataURL(selectedFile);
      } else {
        setPreview(null);
      }
    }
  };

  const handleCameraCapture = (e) => {
    const capturedFile = e.target.files[0];
    if (capturedFile) {
      setFile(capturedFile);
      setError('');
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(capturedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file to upload');
      return;
    }

    setUploading(true);
    if (performOCR) {
      setProcessing(true);
    }
    setError('');

    try {
      // Get fresh token
      let token = localStorage.getItem('token');
      if (!token && auth.currentUser) {
        token = await auth.currentUser.getIdToken(true);
      }

      if (!token) {
        throw new Error('Authentication required. Please log in again.');
      }

      const formData = new FormData();
      formData.append('document', file);
      formData.append('pin', pin);
      
      // Extract documentType string properly
      let docType = documentType;
      if (typeof documentType === 'object') {
        docType = documentType.documentType || documentType.type || 'other';
      }
      formData.append('documentType', docType);
      
      // Extract document name
      let docName = file.name;
      if (typeof documentType === 'object') {
        docName = documentType.documentName || documentType.name || file.name;
      }
      formData.append('name', docName);
      
      formData.append('performOCR', performOCR.toString()); // Send user's OCR choice

      const response = await axios.post(
        '/api/document-locker/upload',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        onUploadComplete(response.data.data);
      }
    } catch (error) {
      console.error('Upload error:', error);
      setError(error.response?.data?.message || 'Failed to upload document');
    } finally {
      setUploading(false);
      setProcessing(false);
    }
  };

  const getDocumentTypeName = () => {
    if (typeof documentType === 'string') {
      return documentType.replace(/_/g, ' ');
    }
    return documentType.documentName || documentType.documentType?.replace(/_/g, ' ') || 'Document';
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full my-8 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b flex-shrink-0">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">
              Upload Document
            </h3>
            <p className="text-sm text-gray-600 mt-1 capitalize">
              {getDocumentTypeName()}
            </p>
          </div>
          <button
            onClick={onCancel}
            className="text-gray-500 hover:text-gray-700"
            disabled={uploading}
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {/* Upload Method Selection */}
          <div className="flex space-x-3 mb-6">
            <button
              onClick={() => setUploadMethod('file')}
              className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-lg border-2 transition-colors ${
                uploadMethod === 'file'
                  ? 'border-blue-600 bg-blue-50 text-blue-700'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <FileText className="h-5 w-5" />
              <span>File Upload</span>
            </button>
            
            <button
              onClick={() => setUploadMethod('camera')}
              className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-lg border-2 transition-colors ${
                uploadMethod === 'camera'
                  ? 'border-blue-600 bg-blue-50 text-blue-700'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <Camera className="h-5 w-5" />
              <span>Camera</span>
            </button>
            
            <button
              onClick={() => setUploadMethod('qr')}
              className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-lg border-2 transition-colors ${
                uploadMethod === 'qr'
                  ? 'border-blue-600 bg-blue-50 text-blue-700'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              disabled
              title="QR scan coming soon"
            >
              <QrCode className="h-5 w-5" />
              <span>QR Scan</span>
            </button>
          </div>

          {/* Upload Area */}
          {uploadMethod === 'file' && (
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,application/pdf"
                onChange={handleFileSelect}
                className="hidden"
              />
              
              {!file ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors"
                >
                  <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-2">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-sm text-gray-500">
                    PNG, JPG, WEBP or PDF (max 10MB)
                  </p>
                </div>
              ) : (
                <div className="border border-gray-200 rounded-lg p-4">
                  {preview ? (
                    <img
                      src={preview}
                      alt="Preview"
                      className="max-h-64 mx-auto rounded"
                    />
                  ) : (
                    <div className="flex items-center justify-center py-8">
                      <FileText className="h-16 w-16 text-gray-400" />
                    </div>
                  )}
                  <div className="mt-4 text-center">
                    <p className="text-sm font-medium text-gray-900">{file.name}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                    <button
                      onClick={() => {
                        setFile(null);
                        setPreview(null);
                      }}
                      className="text-sm text-blue-600 hover:text-blue-700 mt-2"
                    >
                      Change file
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {uploadMethod === 'camera' && (
            <div>
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleCameraCapture}
                className="hidden"
              />
              
              {!file ? (
                <div
                  onClick={() => cameraInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors"
                >
                  <Camera className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-2">
                    Click to open camera
                  </p>
                  <p className="text-sm text-gray-500">
                    Take a photo of your document
                  </p>
                </div>
              ) : (
                <div className="border border-gray-200 rounded-lg p-4">
                  <img
                    src={preview}
                    alt="Captured"
                    className="max-h-64 mx-auto rounded"
                  />
                  <div className="mt-4 text-center">
                    <button
                      onClick={() => {
                        setFile(null);
                        setPreview(null);
                      }}
                      className="text-sm text-blue-600 hover:text-blue-700"
                    >
                      Retake photo
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {uploadMethod === 'qr' && (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
              <QrCode className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">
                QR Code Scanning
              </p>
              <p className="text-sm text-gray-500">
                Coming soon - Scan QR codes from DigiLocker and other sources
              </p>
            </div>
          )}

          {/* Processing Status */}
          {processing && (
            <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center">
                <Loader2 className="h-5 w-5 text-blue-600 animate-spin mr-3" />
                <div>
                  <p className="text-sm font-medium text-blue-900">
                    Processing document...
                  </p>
                  <p className="text-xs text-blue-700 mt-1">
                    Extracting data using OCR technology
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center">
                <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
                <span className="text-red-800 text-sm">{error}</span>
              </div>
            </div>
          )}

          {/* OCR Choice - Only show when file is selected */}
          {file && (
            <div className="mt-4 bg-purple-50 border border-purple-200 rounded-lg p-4">
              <h4 className="font-medium text-purple-900 mb-3">
                How would you like to process this document?
              </h4>
              
              <div className="space-y-3">
                <label className={`flex items-start p-3 border-2 rounded-lg cursor-pointer transition-colors ${
                  performOCR 
                    ? 'border-purple-600 bg-purple-100' 
                    : 'border-gray-300 bg-white hover:border-gray-400'
                }`}>
                  <input
                    type="radio"
                    name="ocrChoice"
                    checked={performOCR}
                    onChange={() => setPerformOCR(true)}
                    className="mt-1 mr-3"
                  />
                  <div className="flex-1">
                    <div className="flex items-center">
                      <CheckCircle className="h-5 w-5 text-purple-600 mr-2" />
                      <span className="font-medium text-gray-900">Perform OCR (Recommended)</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      Extract and structure data from the document. You can review and edit the extracted information. 
                      Data will be saved to your Document Locker for future use.
                    </p>
                  </div>
                </label>

                <label className={`flex items-start p-3 border-2 rounded-lg cursor-pointer transition-colors ${
                  !performOCR 
                    ? 'border-gray-600 bg-gray-100' 
                    : 'border-gray-300 bg-white hover:border-gray-400'
                }`}>
                  <input
                    type="radio"
                    name="ocrChoice"
                    checked={!performOCR}
                    onChange={() => setPerformOCR(false)}
                    className="mt-1 mr-3"
                  />
                  <div className="flex-1">
                    <div className="flex items-center">
                      <FileText className="h-5 w-5 text-gray-600 mr-2" />
                      <span className="font-medium text-gray-900">Skip OCR</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      Send the raw image directly without data extraction. Staff will process manually. 
                      Document will not be saved to your locker.
                    </p>
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* Info */}
          <div className="mt-4 bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="flex items-start">
              <CheckCircle className="h-5 w-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-gray-700">
                <p className="font-medium mb-1">What happens next?</p>
                <ul className="space-y-1 text-xs">
                  {performOCR ? (
                    <>
                      <li>• Document will be uploaded to your secure locker</li>
                      <li>• OCR will extract text and structured data</li>
                      <li>• You can review and edit the extracted information</li>
                      <li>• Structured data will be attached to your appointment</li>
                      <li>• Document saved for future reuse</li>
                    </>
                  ) : (
                    <>
                      <li>• Document image will be uploaded directly</li>
                      <li>• No data extraction performed</li>
                      <li>• Raw image attached to your appointment</li>
                      <li>• Staff will process manually</li>
                      <li>• Document not saved to locker</li>
                    </>
                  )}
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 p-6 border-t bg-gray-50 flex-shrink-0">
          <button
            onClick={onCancel}
            className="btn-secondary"
            disabled={uploading}
          >
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={!file || uploading}
            className="btn-primary flex items-center disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {uploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {performOCR ? 'Uploading & Processing...' : 'Uploading...'}
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                {performOCR ? 'Upload & Process with OCR' : 'Upload Raw Image'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DocumentUploadModal;
