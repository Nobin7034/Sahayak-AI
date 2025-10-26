// API Configuration
const getApiBaseUrl = () => {
  // In development, use localhost
  if (import.meta.env.DEV) {
    return 'http://localhost:5000';
  }
  
  // In production, use the same domain as the frontend
  // This assumes your backend and frontend are served from the same domain
  return window.location.origin;
};

export const API_BASE_URL = getApiBaseUrl();

// Helper function to construct image URLs
export const getImageUrl = (imagePath) => {
  if (!imagePath) return '';
  
  // Normalize backslashes to forward slashes
  const normalizedPath = imagePath.replace(/\\/g, '/');
  
  // If it's already a full URL, return as is
  if (normalizedPath.startsWith('http')) {
    return normalizedPath;
  }
  
  // If it starts with /uploads, prepend the API base URL
  if (normalizedPath.startsWith('/uploads')) {
    return `${API_BASE_URL}${normalizedPath}`;
  }
  
  // If it starts with uploads (without leading slash), add the slash and base URL
  if (normalizedPath.startsWith('uploads')) {
    return `${API_BASE_URL}/${normalizedPath}`;
  }
  
  // For any other path, return as is
  return normalizedPath;
};


