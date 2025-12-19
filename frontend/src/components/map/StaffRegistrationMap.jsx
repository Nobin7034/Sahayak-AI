import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Crosshair, AlertCircle } from 'lucide-react';

// Fix for default markers in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom marker icon for center location
const centerIcon = new L.Icon({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Component to handle map clicks
const MapClickHandler = ({ onLocationSelect, restrictedCenter, restrictedRadius }) => {
  useMapEvents({
    click: (e) => {
      const { lat, lng } = e.latlng;
      
      // Check if click is within restricted radius
      if (restrictedCenter) {
        const distance = L.latLng(restrictedCenter).distanceTo(L.latLng(lat, lng));
        if (distance > restrictedRadius) {
          alert(`Please select a location within ${restrictedRadius/1000}km of the detected area.`);
          return;
        }
      }
      
      onLocationSelect(lat, lng);
    }
  });
  return null;
};

const StaffRegistrationMap = ({ 
  selectedLocation, 
  onLocationSelect, 
  detectedLocation, 
  restrictedRadius = 5000, // 5km in meters
  className = "" 
}) => {
  const [mapCenter, setMapCenter] = useState([10.8505, 76.2711]); // Default Kerala coordinates
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [locationError, setLocationError] = useState(null);
  const mapRef = useRef(null);

  // Auto-detect user location on component mount
  useEffect(() => {
    detectCurrentLocation();
  }, []);

  // Update map center when detected location changes
  useEffect(() => {
    if (detectedLocation?.latitude && detectedLocation?.longitude) {
      const newCenter = [parseFloat(detectedLocation.latitude), parseFloat(detectedLocation.longitude)];
      setMapCenter(newCenter);
      
      // If no location is selected yet, set detected location as default
      if (!selectedLocation?.latitude && !selectedLocation?.longitude) {
        onLocationSelect(detectedLocation.latitude, detectedLocation.longitude);
      }
    }
  }, [detectedLocation, selectedLocation, onLocationSelect]);

  const detectCurrentLocation = () => {
    setIsDetectingLocation(true);
    setLocationError(null);

    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by this browser.");
      setIsDetectingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        try {
          // Reverse geocoding to get address details
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
          );
          const data = await response.json();
          
          if (data && data.address) {
            const addressInfo = {
              latitude: latitude.toString(),
              longitude: longitude.toString(),
              city: data.address.city || data.address.town || data.address.village || '',
              district: data.address.state_district || data.address.county || '',
              state: data.address.state || 'Kerala',
              street: data.address.road || data.address.street || '',
              pincode: data.address.postcode || ''
            };
            
            // Call parent component's location handler
            if (onLocationSelect) {
              onLocationSelect(latitude, longitude, addressInfo);
            }
          }
        } catch (error) {
          console.error('Reverse geocoding failed:', error);
          // Still set the coordinates even if reverse geocoding fails
          if (onLocationSelect) {
            onLocationSelect(latitude, longitude);
          }
        }
        
        setIsDetectingLocation(false);
      },
      (error) => {
        let errorMessage = "Unable to detect location.";
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Location access denied. Please enable location permissions.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Location information unavailable.";
            break;
          case error.TIMEOUT:
            errorMessage = "Location request timed out.";
            break;
        }
        setLocationError(errorMessage);
        setIsDetectingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    );
  };

  const handleManualLocationSelect = (lat, lng) => {
    if (onLocationSelect) {
      onLocationSelect(lat, lng);
    }
  };

  const restrictedCenter = detectedLocation?.latitude && detectedLocation?.longitude 
    ? [parseFloat(detectedLocation.latitude), parseFloat(detectedLocation.longitude)]
    : null;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Location Detection Status */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <div className="flex items-center space-x-2">
          {isDetectingLocation ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span className="text-sm text-blue-800">Detecting your location...</span>
            </>
          ) : locationError ? (
            <>
              <AlertCircle className="h-4 w-4 text-red-600" />
              <span className="text-sm text-red-800">{locationError}</span>
              <button
                type="button"
                onClick={detectCurrentLocation}
                className="ml-2 text-sm text-blue-600 hover:text-blue-800 underline"
              >
                Try Again
              </button>
            </>
          ) : detectedLocation?.latitude ? (
            <>
              <MapPin className="h-4 w-4 text-green-600" />
              <span className="text-sm text-green-800">
                Location detected. Click on the map to adjust the center location.
              </span>
            </>
          ) : (
            <>
              <Crosshair className="h-4 w-4 text-blue-600" />
              <span className="text-sm text-blue-800">
                Click "Detect Location" or select a point on the map.
              </span>
              <button
                type="button"
                onClick={detectCurrentLocation}
                className="ml-2 text-sm text-blue-600 hover:text-blue-800 underline"
              >
                Detect Location
              </button>
            </>
          )}
        </div>
      </div>

      {/* Map Container */}
      <div className="border border-gray-300 rounded-lg overflow-hidden" style={{ height: '400px' }}>
        <MapContainer
          center={mapCenter}
          zoom={15}
          style={{ height: '100%', width: '100%' }}
          ref={mapRef}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          
          {/* Restricted area circle */}
          {restrictedCenter && (
            <Circle
              center={restrictedCenter}
              radius={restrictedRadius}
              pathOptions={{
                color: 'blue',
                fillColor: 'lightblue',
                fillOpacity: 0.1,
                weight: 2,
                dashArray: '5, 5'
              }}
            />
          )}
          
          {/* Selected location marker */}
          {selectedLocation?.latitude && selectedLocation?.longitude && (
            <Marker
              position={[parseFloat(selectedLocation.latitude), parseFloat(selectedLocation.longitude)]}
              icon={centerIcon}
            />
          )}
          
          {/* Map click handler */}
          <MapClickHandler
            onLocationSelect={handleManualLocationSelect}
            restrictedCenter={restrictedCenter}
            restrictedRadius={restrictedRadius}
          />
        </MapContainer>
      </div>

      {/* Selected Coordinates Display */}
      {selectedLocation?.latitude && selectedLocation?.longitude && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <div className="flex items-center space-x-2">
            <MapPin className="h-4 w-4 text-green-600" />
            <span className="text-sm text-green-800">
              Selected Location: {parseFloat(selectedLocation.latitude).toFixed(6)}, {parseFloat(selectedLocation.longitude).toFixed(6)}
            </span>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="text-xs text-gray-600 space-y-1">
        <p>• The map will automatically detect your current location</p>
        <p>• Click anywhere on the map to set the Akshaya center location</p>
        <p>• Selection is restricted to a 5km radius around the detected area</p>
        <p>• The selected coordinates will be used for the center registration</p>
      </div>
    </div>
  );
};

export default StaffRegistrationMap;