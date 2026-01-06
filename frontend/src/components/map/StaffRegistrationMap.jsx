import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, Circle, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Crosshair, AlertCircle } from 'lucide-react';
import PincodeInput from '../PincodeInput';
import geocodingService from '../../services/geocodingService';

// Extend Leaflet with bearing and destination point calculations
L.LatLng.prototype.bearingTo = function(other) {
  const lat1 = this.lat * Math.PI / 180;
  const lat2 = other.lat * Math.PI / 180;
  const deltaLng = (other.lng - this.lng) * Math.PI / 180;
  
  const x = Math.sin(deltaLng) * Math.cos(lat2);
  const y = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(deltaLng);
  
  const bearing = Math.atan2(x, y);
  return (bearing * 180 / Math.PI + 360) % 360;
};

L.LatLng.prototype.destinationPoint = function(distance, bearing) {
  const radius = 6371000; // Earth's radius in meters
  const lat1 = this.lat * Math.PI / 180;
  const lng1 = this.lng * Math.PI / 180;
  const bearingRad = bearing * Math.PI / 180;
  
  const lat2 = Math.asin(Math.sin(lat1) * Math.cos(distance / radius) +
                        Math.cos(lat1) * Math.sin(distance / radius) * Math.cos(bearingRad));
  
  const lng2 = lng1 + Math.atan2(Math.sin(bearingRad) * Math.sin(distance / radius) * Math.cos(lat1),
                                Math.cos(distance / radius) - Math.sin(lat1) * Math.sin(lat2));
  
  return L.latLng(lat2 * 180 / Math.PI, lng2 * 180 / Math.PI);
};

// Fix for default markers in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom marker icon for pincode center location (fixed)
const pincodeIcon = new L.Icon({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Custom marker icon for service center location (adjustable)
const serviceCenterIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,' + btoa(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#10b981" width="24" height="24">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
    </svg>
  `),
  iconSize: [30, 30],
  iconAnchor: [15, 30],
  popupAnchor: [0, -30]
});

// Component to handle map clicks with enhanced validation
const MapClickHandler = ({ onLocationSelect, restrictedCenter, restrictedRadius, onValidationError }) => {
  useMapEvents({
    click: (e) => {
      const { lat, lng } = e.latlng;
      
      // Check if click is within restricted radius
      if (restrictedCenter) {
        const distance = L.latLng(restrictedCenter).distanceTo(L.latLng(lat, lng));
        if (distance > restrictedRadius) {
          const distanceKm = (distance / 1000).toFixed(2);
          const maxDistanceKm = (restrictedRadius / 1000).toFixed(0);
          const errorMessage = `Location is ${distanceKm}km from pincode center. Please select within ${maxDistanceKm}km radius.`;
          
          if (onValidationError) {
            onValidationError(errorMessage);
          } else {
            alert(errorMessage);
          }
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
  className = "",
  initialPincode = ""
}) => {
  const [mapCenter, setMapCenter] = useState([10.8505, 76.2711]); // Default Kerala coordinates
  const [mapZoom, setMapZoom] = useState(8); // Default zoom for Kerala view
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [locationError, setLocationError] = useState(null);
  const [pincode, setPincode] = useState(initialPincode);
  const [pincodeLocation, setPincodeLocation] = useState(null);
  const [isGeocodingPincode, setIsGeocodingPincode] = useState(false);
  const [pincodeError, setPincodeError] = useState(null);
  const [validationError, setValidationError] = useState(null);
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
      setMapZoom(13); // Slightly closer zoom for detected location
      
      // If no location is selected yet, set detected location as default
      if (!selectedLocation?.latitude && !selectedLocation?.longitude) {
        onLocationSelect(detectedLocation.latitude, detectedLocation.longitude);
      }
    }
  }, [detectedLocation, selectedLocation, onLocationSelect]);

  // Update map center when pincode location is set
  useEffect(() => {
    if (pincodeLocation?.coordinates) {
      const newCenter = [pincodeLocation.coordinates.lat, pincodeLocation.coordinates.lng];
      setMapCenter(newCenter);
      
      // Set zoom level to show approximately 20km radius (good view of 5km circle)
      // Zoom level 12 shows roughly 20km radius, perfect for seeing the 5km service area
      setMapZoom(12);
      
      // DON'T automatically set the selected location to pincode center
      // Let user click or drag to select the exact service center location
      // Only clear validation errors
      setValidationError(null);
    }
  }, [pincodeLocation]);

  // Handle pincode geocoding
  const handleValidPincode = async (validPincode) => {
    setIsGeocodingPincode(true);
    setPincodeError(null);
    
    try {
      const result = await geocodingService.geocodePincode(validPincode);
      setPincodeLocation(result);
    } catch (error) {
      console.error('Pincode geocoding failed:', error);
      setPincodeError(error.message);
    } finally {
      setIsGeocodingPincode(false);
    }
  };

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

  // Handle marker drag with validation
  const handleMarkerDrag = (e) => {
    const marker = e.target;
    const position = marker.getLatLng();
    
    // Check if the new position is within the restricted radius
    if (pincodeLocation) {
      const pincodeCenter = L.latLng(pincodeLocation.coordinates.lat, pincodeLocation.coordinates.lng);
      const distance = pincodeCenter.distanceTo(position);
      
      if (distance > restrictedRadius) {
        // Snap back to the boundary
        const bearing = pincodeCenter.bearingTo(position);
        const maxPosition = pincodeCenter.destinationPoint(restrictedRadius, bearing);
        marker.setLatLng(maxPosition);
        
        // Show validation error
        const distanceKm = (distance / 1000).toFixed(2);
        const maxDistanceKm = (restrictedRadius / 1000).toFixed(0);
        const errorMessage = `Marker moved ${distanceKm}km from pincode center. Snapped to ${maxDistanceKm}km boundary.`;
        handleValidationError(errorMessage);
        
        // Update with the snapped position
        if (onLocationSelect) {
          onLocationSelect(maxPosition.lat, maxPosition.lng);
        }
      } else {
        // Clear any validation errors
        setValidationError(null);
        
        // Update with the new position
        if (onLocationSelect) {
          onLocationSelect(position.lat, position.lng);
        }
      }
    }
  };

  const handleManualLocationSelect = (lat, lng) => {
    // Clear any previous validation errors
    setValidationError(null);
    
    if (onLocationSelect) {
      onLocationSelect(lat, lng);
    }
  };

  // Handle validation errors from map clicks
  const handleValidationError = (errorMessage) => {
    setValidationError(errorMessage);
    // Clear error after 5 seconds
    setTimeout(() => {
      setValidationError(null);
    }, 5000);
  };

  // Determine the restricted center - prioritize pincode location over detected location
  const restrictedCenter = pincodeLocation?.coordinates 
    ? [pincodeLocation.coordinates.lat, pincodeLocation.coordinates.lng]
    : (detectedLocation?.latitude && detectedLocation?.longitude 
      ? [parseFloat(detectedLocation.latitude), parseFloat(detectedLocation.longitude)]
      : null);

  // Get the service area information for display
  const getServiceAreaInfo = () => {
    if (pincodeLocation) {
      return {
        pincode: pincodeLocation.address.pincode,
        city: pincodeLocation.address.city,
        district: pincodeLocation.address.district,
        state: pincodeLocation.address.state
      };
    }
    return null;
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Pincode Input Section */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <PincodeInput
          value={pincode}
          onChange={setPincode}
          onValidPincode={handleValidPincode}
          isLoading={isGeocodingPincode}
          error={pincodeError}
          placeholder="Enter 6-digit pincode to set service area"
        />
      </div>

      {/* Validation Error Display */}
      {validationError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <span className="text-sm text-red-800">{validationError}</span>
          </div>
        </div>
      )}

      {/* Service Area Information */}
      {pincodeLocation && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-center space-x-2">
            <MapPin className="h-4 w-4 text-blue-600" />
            <span className="text-sm text-blue-800 font-medium">
              Service Area: {getServiceAreaInfo()?.pincode} - {getServiceAreaInfo()?.city}, {getServiceAreaInfo()?.district}
            </span>
          </div>
          <p className="text-xs text-blue-600 mt-1">
            5km radius service area centered on this pincode location
          </p>
          {!selectedLocation?.latitude && (
            <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
              <p className="text-xs text-yellow-800 font-medium">
                📍 Next Step: Click anywhere within the blue circle to select your exact Akshaya center location
              </p>
            </div>
          )}
        </div>
      )}

      {/* Location Detection Status */}
      {!pincodeLocation && (
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
                  Location detected. Enter pincode above or click on the map to adjust the center location.
                </span>
              </>
            ) : (
              <>
                <Crosshair className="h-4 w-4 text-blue-600" />
                <span className="text-sm text-blue-800">
                  Enter pincode above, click "Detect Location" or select a point on the map.
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
      )}

      {/* Map Container */}
      <div className="border border-gray-300 rounded-lg overflow-hidden" style={{ height: '400px' }}>
        <MapContainer
          center={mapCenter}
          zoom={mapZoom}
          style={{ height: '100%', width: '100%' }}
          ref={mapRef}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          
          {/* Service area circle - always centered on pincode location */}
          {pincodeLocation && (
            <Circle
              center={[pincodeLocation.coordinates.lat, pincodeLocation.coordinates.lng]}
              radius={restrictedRadius}
              pathOptions={{
                color: '#3b82f6',
                fillColor: '#3b82f6',
                fillOpacity: 0.1,
                weight: 2,
                dashArray: '5, 5'
              }}
            />
          )}
          
          {/* Fallback service area circle for detected location when no pincode */}
          {!pincodeLocation && restrictedCenter && (
            <Circle
              center={restrictedCenter}
              radius={restrictedRadius}
              pathOptions={{
                color: '#3b82f6',
                fillColor: '#3b82f6',
                fillOpacity: 0.1,
                weight: 2,
                dashArray: '5, 5'
              }}
            />
          )}
          
          {/* Pincode location marker (center of service area - fixed) */}
          {pincodeLocation && (
            <Marker
              position={[pincodeLocation.coordinates.lat, pincodeLocation.coordinates.lng]}
              icon={pincodeIcon}
            >
              <Popup>
                <div className="text-sm">
                  <div className="font-semibold text-blue-800">Service Area Center (Fixed)</div>
                  <div>Pincode: {pincodeLocation.address.pincode}</div>
                  <div>City: {pincodeLocation.address.city}</div>
                  <div>District: {pincodeLocation.address.district}</div>
                  <div className="text-xs text-gray-600 mt-1">
                    5km radius service area boundary
                  </div>
                </div>
              </Popup>
            </Marker>
          )}
          
          {/* Selected service center location marker (draggable within service area) */}
          {selectedLocation?.latitude && selectedLocation?.longitude && (
            <Marker
              position={[parseFloat(selectedLocation.latitude), parseFloat(selectedLocation.longitude)]}
              icon={serviceCenterIcon}
              draggable={true}
              eventHandlers={{
                dragend: handleMarkerDrag,
              }}
            >
              <Popup>
                <div className="text-sm">
                  <div className="font-semibold text-green-800">🏢 Your Akshaya Center Location</div>
                  <div className="text-xs text-gray-600 mb-2">This is where your center will appear on the user map</div>
                  <div>Lat: {parseFloat(selectedLocation.latitude).toFixed(6)}</div>
                  <div>Lng: {parseFloat(selectedLocation.longitude).toFixed(6)}</div>
                  {selectedLocation.city && (
                    <div>City: {selectedLocation.city}</div>
                  )}
                  {pincodeLocation && (
                    <div className="text-xs text-gray-600 mt-1">
                      Drag to adjust within {pincodeLocation.address.pincode} service area
                    </div>
                  )}
                  <div className="text-xs text-blue-600 mt-1">
                    💡 Tip: Drag this marker to your exact building location
                  </div>
                </div>
              </Popup>
            </Marker>
          )}
          
          {/* Map click handler with enhanced validation */}
          <MapClickHandler
            onLocationSelect={handleManualLocationSelect}
            restrictedCenter={pincodeLocation ? [pincodeLocation.coordinates.lat, pincodeLocation.coordinates.lng] : restrictedCenter}
            restrictedRadius={restrictedRadius}
            onValidationError={handleValidationError}
          />
        </MapContainer>
      </div>

      {/* Selected Coordinates Display with Distance Information */}
      {selectedLocation?.latitude && selectedLocation?.longitude && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <div className="flex items-center space-x-2">
            <MapPin className="h-4 w-4 text-green-600" />
            <span className="text-sm text-green-800 font-medium">
              ✅ Akshaya Center Location Selected
            </span>
          </div>
          <div className="text-xs text-green-700 mt-1 space-y-1">
            <p>📍 Coordinates: {parseFloat(selectedLocation.latitude).toFixed(6)}, {parseFloat(selectedLocation.longitude).toFixed(6)}</p>
            {pincodeLocation && (
              <>
                <p>📮 Service Area: {getServiceAreaInfo()?.pincode} - {getServiceAreaInfo()?.city}</p>
                <p>📏 Distance from pincode center: {
                  (L.latLng(pincodeLocation.coordinates.lat, pincodeLocation.coordinates.lng)
                    .distanceTo(L.latLng(parseFloat(selectedLocation.latitude), parseFloat(selectedLocation.longitude))) / 1000)
                    .toFixed(2)
                }km</p>
              </>
            )}
            <p className="text-green-600 font-medium">This location will appear on the user map after admin approval</p>
          </div>
        </div>
      )}

      {/* Location Selection Prompt */}
      {pincodeLocation && !selectedLocation?.latitude && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
          <div className="flex items-center space-x-2">
            <MapPin className="h-4 w-4 text-orange-600" />
            <span className="text-sm text-orange-800 font-medium">
              📍 Please select your exact Akshaya center location
            </span>
          </div>
          <p className="text-xs text-orange-700 mt-1">
            Click anywhere within the blue circle on the map to place your service center marker
          </p>
        </div>
      )}

      {/* Instructions */}
      <div className="text-xs text-gray-600 space-y-1">
        <p>• <strong>Step 1:</strong> Enter your pincode above to set your 5km service area</p>
        <p>• <strong>Step 2:</strong> Click anywhere within the blue circle to place your service center marker</p>
        <p>• <strong>Step 3:</strong> Drag the green marker to fine-tune your exact service center location</p>
        <p>• The blue marker shows the pincode center (fixed), green marker shows your service center (draggable)</p>
        <p>• Dragging outside the service area will snap the marker back to the boundary</p>
        <p>• Selected coordinates will be used for staff registration</p>
      </div>
    </div>
  );
};

export default StaffRegistrationMap;