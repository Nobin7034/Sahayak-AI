import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { GoogleOAuthProvider } from '@react-oauth/google'

// Log the client ID being used (without exposing full ID in production)
const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
console.log('Using Google Client ID:', clientId.substring(0, 8) + '...');

ReactDOM.createRoot(document.getElementById('root')).render(
  <GoogleOAuthProvider 
    clientId={clientId} 
    onScriptLoadError={(error) => console.error('Google API script failed to load:', error)}
    onScriptLoadSuccess={() => console.log('Google API script loaded successfully')}
  >
    <React.StrictMode>
      <App />
    </React.StrictMode>
  </GoogleOAuthProvider>
)
