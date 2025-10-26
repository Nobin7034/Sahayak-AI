import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { LanguageProvider } from './contexts/LanguageContext'

// Get client ID from .env
const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

if (!clientId) {
  console.error("❌ Google Client ID is missing. Did you set VITE_GOOGLE_CLIENT_ID in .env?");
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <GoogleOAuthProvider 
    clientId={clientId}
    onScriptLoadError={(error) => console.error('Google API script failed to load:', error)}
    onScriptLoadSuccess={() => console.log('✅ Google API script loaded successfully')}
    // disableOneTap is optional – keep it true if you don't want auto-popup login
  >
    <React.StrictMode>
      <LanguageProvider>
        <App />
      </LanguageProvider>
    </React.StrictMode>
  </GoogleOAuthProvider>
)
