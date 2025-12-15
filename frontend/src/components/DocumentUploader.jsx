import React, { useState, useRef } from 'react';
import { 
  Upload, 
  File, 
  X, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  Camera,
  FileText,
  Image as ImageIcon
} from 'lucide-react';
import axios from 'axios';

const DocumentUploader = ({ 
  appointmentId, 
  allowedTypes = ['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx'],
  maxFileSize = 5 * 1024 * 1024, // 5MB
  onUploadComplete,
  onUploadError,
  multiple = true
}) => {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const validateFile = (file) => {
    const fileExtension = file.name.split('.').pop().toLowerCase();
    
    if (!allowedTypes.includes(fileExtension)) {
      return `File type .${fileExtension} is not allowed. Allowed types: ${allowedTypes.join(', ')}`;
    }
    
    if (file.size > maxFileSize) {
      return `File size exceeds ${Math.round(maxFileSize / (1024 * 1024))}MB limit`;
    }
    
    return null;
  };

  const handleFileSelect = (selectedFiles) => {
    const fileArray = Array.from(selectedFiles);
    const validFiles = [];
    const errors = [];

    fileArray.forEach(file => {
      const error = validateFile(file);
      if (error) {
        errors.push(`${file.name}: ${error}`);
      } else {
        validFiles.push({
          file,
          id: Math.random().toString(36).substr(2, 9),
          name: file.name,
          size: file.size,
          type: file.type,
          status: 'pending'
        });
      }
    });

    if (errors.length > 0) {
      if (onUploadError) {
        onUploadError(errors.join('\n'));
      }
    }

    if (multiple) {
      setFiles(prev => [...prev, ...validFiles]);
    } else {
      setFiles(validFiles.slice(0, 1));
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    
    const droppedFiles = e.dataTransfer.files;
    handleFileSelect(droppedFiles);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOver(false);
  };

  const removeFile = (fileId) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const uploadFiles = async () => {
    if (files.length === 0) return;

    setUploading(true);
    const uploadedFiles = [];
    const failedFiles = [];

    try {
      for (const fileItem of files) {
        if (fileItem.status === 'uploaded') continue;

        const formData = new FormData();
        formData.append('document', fileItem.file);
        formData.append('appointmentId', appointmentId);

        try {
          const response = await axios.post(
            `/api/staff/appointments/${appointmentId}/documents`,
            formData,
            {
              headers: {
                'Content-Type': 'multipart/form-data',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
              },
              onUploadProgress: (progressEvent) => {
                const progress = Math.round(
                  (progressEvent.loaded * 100) / progressEvent.total
                );
                
                setFiles(prev => prev.map(f => 
                  f.id === fileItem.id 
                    ? { ...f, progress, status: 'uploading' }
                    : f
                ));
              }
            }
          );

          if (response.data.success) {
            setFiles(prev => prev.map(f => 
              f.id === fileItem.id 
                ? { ...f, status: 'uploaded', uploadedFile: response.data.data }
                : f
            ));
            uploadedFiles.push(response.data.data);
          }
        } catch (error) {
          console.error('File upload error:', error);
          setFiles(prev => prev.map(f => 
            f.id === fileItem.id 
              ? { ...f, status: 'error', error: error.response?.data?.message || 'Upload failed' }
              : f
          ));
          failedFiles.push(fileItem.name);
        }
      }

      if (uploadedFiles.length > 0 && onUploadComplete) {
        onUploadComplete(uploadedFiles);
      }

      if (failedFiles.length > 0 && onUploadError) {
        onUploadError(`Failed to upload: ${failedFiles.join(', ')}`);
      }

    } catch (error) {
      console.error('Upload process error:', error);
      if (onUploadError) {
        onUploadError('Upload process failed');
      }
    } finally {
      setUploading(false);
    }
  };

  const getFileIcon = (fileName) => {
    const extension = fileName.split('.').pop().toLowerCase();
    
    if (['jpg', 'jpeg', 'png', 'gif', 'bmp'].includes(extension)) {
      return <ImageIcon className="h-8 w-8 text-blue-500" />;
    } else if (['pdf'].includes(extension)) {
      return <FileText className="h-8 w-8 text-red-500" />;
    } else {
      return <File className="h-8 w-8 text-gray-500" />;
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="w-full">
      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          dragOver 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Upload Documents
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Drag and drop files here, or click to select files
        </p>
        
        <div className="flex items-center justify-center space-x-4">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Select Files
          </button>
          
          {/* Camera capture for mobile */}
          <button
            onClick={() => cameraInputRef.current?.click()}
            className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 md:hidden"
          >
            <Camera className="h-4 w-4 mr-2 inline" />
            Camera
          </button>
        </div>

        <p className="text-xs text-gray-500 mt-2">
          Allowed: {allowedTypes.join(', ')} • Max size: {Math.round(maxFileSize / (1024 * 1024))}MB
        </p>

        {/* Hidden file inputs */}
        <input
          ref={fileInputRef}
          type="file"
          multiple={multiple}
          accept={allowedTypes.map(type => `.${type}`).join(',')}
          onChange={(e) => handleFileSelect(e.target.files)}
          className="hidden"
        />
        
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={(e) => handleFileSelect(e.target.files)}
          className="hidden"
        />
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="mt-6">
          <h4 className="text-sm font-medium text-gray-900 mb-3">
            Selected Files ({files.length})
          </h4>
          
          <div className="space-y-3">
            {files.map((fileItem) => (
              <div key={fileItem.id} className="flex items-center p-3 bg-gray-50 rounded-lg">
                <div className="flex-shrink-0 mr-3">
                  {getFileIcon(fileItem.name)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {fileItem.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatFileSize(fileItem.size)}
                  </p>
                  
                  {/* Progress bar */}
                  {fileItem.status === 'uploading' && (
                    <div className="mt-1">
                      <div className="w-full bg-gray-200 rounded-full h-1">
                        <div 
                          className="bg-blue-600 h-1 rounded-full transition-all duration-300"
                          style={{ width: `${fileItem.progress || 0}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                  
                  {/* Error message */}
                  {fileItem.status === 'error' && (
                    <p className="text-xs text-red-600 mt-1">
                      {fileItem.error}
                    </p>
                  )}
                </div>

                {/* Status icon */}
                <div className="flex-shrink-0 ml-3">
                  {fileItem.status === 'pending' && (
                    <button
                      onClick={() => removeFile(fileItem.id)}
                      className="text-gray-400 hover:text-red-500"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                  {fileItem.status === 'uploading' && (
                    <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
                  )}
                  {fileItem.status === 'uploaded' && (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  )}
                  {fileItem.status === 'error' && (
                    <AlertCircle className="h-4 w-4 text-red-500" />
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Upload button */}
          {files.some(f => f.status === 'pending') && (
            <div className="mt-4">
              <button
                onClick={uploadFiles}
                disabled={uploading}
                className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 
                         disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {uploading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Files
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DocumentUploader;