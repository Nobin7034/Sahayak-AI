import React, { useEffect, useState } from 'react';
import { X, FileText, Shield, Loader2, Download } from 'lucide-react';
import axios from 'axios';

const SecureDocumentViewer = ({ document: documentData, onClose }) => {
  const [imageUrl, setImageUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [downloading, setDownloading] = useState(false);

  // Check if this is a photo document (downloadable)
  const isPhotoDocument = documentData.documentType?.toLowerCase() === 'photo' || 
                          documentData.documentType?.toLowerCase() === 'passport_photo';

  useEffect(() => {
    // Disable right-click only for non-photo documents
    const handleContextMenu = (e) => {
      if (!isPhotoDocument) {
        e.preventDefault();
      }
    };
    
    // Disable keyboard shortcuts for screenshots only for non-photo documents
    const handleKeyDown = (e) => {
      if (!isPhotoDocument) {
        // Prevent PrintScreen, Ctrl+P, Cmd+Shift+3/4/5 (Mac screenshots)
        if (
          e.key === 'PrintScreen' ||
          (e.ctrlKey && e.key === 'p') ||
          (e.metaKey && e.shiftKey && ['3', '4', '5'].includes(e.key))
        ) {
          e.preventDefault();
          alert('Screenshots are disabled for security reasons');
        }
      }
    };

    window.document.addEventListener('contextmenu', handleContextMenu);
    window.document.addEventListener('keydown', handleKeyDown);

    return () => {
      window.document.removeEventListener('contextmenu', handleContextMenu);
      window.document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isPhotoDocument]);

  useEffect(() => {
    // Fetch document image with authentication
    const fetchDocument = async () => {
      if (!documentData.documentId) {
        setError('Document ID not available');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await axios.get(
          `/api/staff/documents/${documentData.documentId}/secure-view`,
          {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            responseType: 'blob' // Important: get image as blob
          }
        );

        // Create a blob URL for the image
        const blob = new Blob([response.data], { type: response.headers['content-type'] || 'image/jpeg' });
        const url = URL.createObjectURL(blob);
        setImageUrl(url);
        setError(null);
      } catch (err) {
        console.error('Error loading document:', err);
        setError(err.response?.data?.message || 'Failed to load document');
      } finally {
        setLoading(false);
      }
    };

    fetchDocument();

    // Cleanup: revoke blob URL when component unmounts
    return () => {
      if (imageUrl) {
        URL.revokeObjectURL(imageUrl);
      }
    };
  }, [documentData.documentId]);

  const handleDownload = async () => {
    if (!isPhotoDocument || !documentData.documentId) return;

    try {
      setDownloading(true);
      const response = await axios.get(
        `/api/staff/documents/${documentData.documentId}/download`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          responseType: 'blob'
        }
      );

      // Create download link
      const blob = new Blob([response.data], { type: response.headers['content-type'] || 'image/jpeg' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `user-photo-${documentData.documentId}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error downloading photo:', err);
      alert('Failed to download photo');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-95 flex items-center justify-center z-50"
      style={{ userSelect: isPhotoDocument ? 'auto' : 'none' }}
    >
      <div className="relative w-full h-full max-w-6xl max-h-screen p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 bg-gray-900 bg-opacity-90 p-4 rounded-t-lg">
          <div className="flex items-center space-x-3">
            <Shield className={`h-6 w-6 ${isPhotoDocument ? 'text-green-500' : 'text-yellow-500'}`} />
            <div>
              <h3 className="text-lg font-semibold text-white capitalize">
                {documentData.documentType.replace(/_/g, ' ')}
              </h3>
              <p className={`text-xs flex items-center ${isPhotoDocument ? 'text-green-300' : 'text-yellow-300'}`}>
                <Shield className="h-3 w-3 mr-1" />
                {isPhotoDocument ? 'Photo - Download Allowed' : 'Secure View - Protected Document'}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {isPhotoDocument && (
              <button
                onClick={handleDownload}
                disabled={downloading || !imageUrl}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {downloading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Downloading...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Download Photo
                  </>
                )}
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-800 rounded-full transition-colors"
            >
              <X className="h-6 w-6 text-white" />
            </button>
          </div>
        </div>

        {/* Document Container */}
        <div 
          className="bg-gray-800 rounded-lg overflow-hidden relative"
          style={{ 
            height: 'calc(100% - 100px)'
          }}
        >
          {/* Security Watermark Overlay - Only for non-photo documents */}
          {!isPhotoDocument && (
            <div 
              className="absolute inset-0 z-10 pointer-events-none"
              style={{
                background: `repeating-linear-gradient(
                  45deg,
                  transparent,
                  transparent 150px,
                  rgba(255, 255, 255, 0.02) 150px,
                  rgba(255, 255, 255, 0.02) 300px
                )`
              }}
            >
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-white text-opacity-5 text-8xl font-bold transform -rotate-45 select-none">
                  CONFIDENTIAL
                </div>
              </div>
            </div>
          )}

          {/* Document Image */}
          <div className="w-full h-full flex items-center justify-center p-4">
            {loading ? (
              <div className="text-center text-white">
                <Loader2 className="h-12 w-12 mx-auto mb-4 animate-spin" />
                <p>Loading secure document...</p>
              </div>
            ) : error ? (
              <div className="text-center text-red-400">
                <FileText className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p className="font-medium mb-2">Failed to load document</p>
                <p className="text-sm">{error}</p>
              </div>
            ) : imageUrl ? (
              <img
                src={imageUrl}
                alt="Document"
                className="max-w-full max-h-full object-contain select-none"
                draggable={isPhotoDocument}
                onContextMenu={(e) => !isPhotoDocument && e.preventDefault()}
                style={{
                  pointerEvents: isPhotoDocument ? 'auto' : 'none',
                  userSelect: isPhotoDocument ? 'auto' : 'none',
                  WebkitUserSelect: isPhotoDocument ? 'auto' : 'none',
                  MozUserSelect: isPhotoDocument ? 'auto' : 'none',
                  msUserSelect: isPhotoDocument ? 'auto' : 'none'
                }}
              />
            ) : (
              <div className="text-center text-gray-400">
                <FileText className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p>Document not available</p>
              </div>
            )}
          </div>
        </div>

        {/* Security Notice */}
        <div className={`mt-4 ${isPhotoDocument ? 'bg-green-900' : 'bg-yellow-900'} bg-opacity-50 border ${isPhotoDocument ? 'border-green-700' : 'border-yellow-700'} rounded-lg p-3`}>
          <div className="flex items-start space-x-2">
            <Shield className={`h-5 w-5 ${isPhotoDocument ? 'text-green-500' : 'text-yellow-500'} mt-0.5 flex-shrink-0`} />
            <div className={`text-xs ${isPhotoDocument ? 'text-green-200' : 'text-yellow-200'}`}>
              <p className="font-medium mb-1">{isPhotoDocument ? 'Photo Document:' : 'Security Notice:'}</p>
              <ul className={`list-disc list-inside space-y-1 ${isPhotoDocument ? 'text-green-300' : 'text-yellow-300'}`}>
                {isPhotoDocument ? (
                  <>
                    <li>This photo can be downloaded for service processing purposes</li>
                    <li>Download is logged and monitored for security purposes</li>
                    <li>Use downloaded photo only for official service processing</li>
                  </>
                ) : (
                  <>
                    <li>This document is protected and cannot be downloaded or screenshot</li>
                    <li>Access is logged and monitored for security purposes</li>
                    <li>Document access will be revoked after service completion</li>
                  </>
                )}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SecureDocumentViewer;
