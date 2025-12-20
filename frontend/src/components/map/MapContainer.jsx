import React, { useState, useEffect } from 'react';
import { MapContainer as LeafletMapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const MapContainer = ({ 
  centers = [], 
  userLocation = null, 
  selectedCenter = null, 
  onCenterSelect, 
  onLocationChange,
  searchRadius = 10 // Default 10km radius
}) => {
  const [mapCenter, setMapCenter] = useState([10.8505, 76.2711]); // Default Kerala location
  const [zoom, setZoom] = useState(8);

  useEffect(() => {
    // Request user location if not provided
    if (!userLocation && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setMapCenter([latitude, longitude]);
          setZoom(14); // Higher zoom for local area view
        },
        (error) => {
          console.log('Geolocation error:', error);
          // Keep default Kerala location
        }
      );
    } else if (userLocation) {
      setMapCenter([userLocation.lat, userLocation.lng]);
      setZoom(14); // Higher zoom for local area view
    }
  }, [userLocation]);

  const handleMarkerClick = (center) => {
    if (onCenterSelect && center._id) {
      onCenterSelect(center._id);
    }
  };

  return (
    <div className="w-full h-full rounded-lg overflow-hidden shadow-lg">
      <LeafletMapContainer
        center={mapCenter}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        whenReady={() => {
          console.log('Map is ready');
        }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* User location marker */}
        {userLocation && (
          <>
            <Marker position={[userLocation.lat, userLocation.lng]}>
              <Popup>Your Location</Popup>
            </Marker>
            
            {/* Search radius circle */}
            <Circle
              center={[userLocation.lat, userLocation.lng]}
              radius={searchRadius * 1000} // Convert km to meters
              pathOptions={{
                color: '#3B82F6',
                fillColor: '#3B82F6',
                fillOpacity: 0.1,
                weight: 2,
                dashArray: '5, 5'
              }}
            />
          </>
        )}
        
        {/* Akshaya center markers */}
        {centers.filter(center => 
          center.location && 
          center.location.coordinates && 
          center.location.coordinates.length === 2
        ).map((center) => (
          <Marker
            key={center._id}
            position={[center.location.coordinates[1], center.location.coordinates[0]]}
            eventHandlers={{
              click: () => handleMarkerClick(center)
            }}
          >
            <Popup>
              <div className="p-2">
                <h3 className="font-semibold text-lg">{center.name || 'Unnamed Center'}</h3>
                <p className="text-sm text-gray-600 mb-2">
                  {center.address?.street && `${center.address.street}, `}
                  {center.address?.city || 'Unknown City'}
                </p>
                {center.contact?.phone && (
                  <p className="text-sm">
                    <strong>Phone:</strong> {center.contact.phone}
                  </p>
                )}
                {center.contact?.email && (
                  <p className="text-sm">
                    <strong>Email:</strong> {center.contact.email}
                  </p>
                )}
                <div className="mt-2">
                  <span className={`px-2 py-1 rounded text-xs ${
                    center.status === 'active' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {center.status === 'active' ? 'Open' : 'Closed'}
                  </span>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </LeafletMapContainer>
    </div>
  );
};

export default MapContainer;