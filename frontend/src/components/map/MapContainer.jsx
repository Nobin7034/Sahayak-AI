import { useEffect } from 'react';
import { MapContainer as LeafletMapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom user location icon (blue dot)
const userIcon = new L.Icon({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [20, 33],
  iconAnchor: [10, 33],
  popupAnchor: [0, -33],
  shadowSize: [33, 33],
  className: 'user-location-marker',
});

// Imperatively recenter the map when userLocation changes — fixes Leaflet's non-reactive center prop
function MapRecenter({ lat, lng, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (lat && lng) {
      map.flyTo([lat, lng], zoom, { duration: 1.2 });
    }
  }, [lat, lng, zoom, map]);
  return null;
}

// Koovappally, Kerala — PIN 686518 (9°31'0"N 76°49'0"E)
const DEFAULT_LAT = 9.5167;
const DEFAULT_LNG = 76.8167;
const DEFAULT_ZOOM = 12;

// Validate that GPS coords are within Kerala bounds (rough bounding box)
// Kerala: 8.18°N–12.78°N, 74.85°E–77.42°E
function isValidKeralaCoord(lat, lng) {
  return lat >= 8.0 && lat <= 13.0 && lng >= 74.5 && lng <= 78.0;
}

const MapContainer = ({
  centers = [],
  userLocation = null,
  selectedCenter = null,
  onCenterSelect,
  searchRadius = 20,
}) => {
  // Only use GPS location if it's a valid Kerala coordinate, else fall back to Koovappally
  const rawLat = userLocation?.lat;
  const rawLng = userLocation?.lng;
  const useGPS = rawLat && rawLng && isValidKeralaCoord(rawLat, rawLng);
  const lat = useGPS ? rawLat : DEFAULT_LAT;
  const lng = useGPS ? rawLng : DEFAULT_LNG;
  const zoom = searchRadius >= 50 ? 9 : searchRadius >= 20 ? 10 : 12;

  const handleMarkerClick = (center) => {
    if (onCenterSelect && center._id) onCenterSelect(center._id);
  };

  return (
    <div className="w-full h-full rounded-lg overflow-hidden shadow-lg">
      <LeafletMapContainer
        center={[DEFAULT_LAT, DEFAULT_LNG]}
        zoom={DEFAULT_ZOOM}
        style={{ height: '100%', width: '100%' }}
      >
        {/* Recenter map whenever userLocation or radius changes */}
        <MapRecenter lat={lat} lng={lng} zoom={zoom} />

        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* User location marker + radius circle */}
        <Marker position={[lat, lng]} icon={userIcon}>
          <Popup>
            <strong>📍 Your Location</strong>
            <br />
            <span className="text-xs text-gray-500">{lat.toFixed(4)}° N, {lng.toFixed(4)}° E</span>
          </Popup>
        </Marker>

        {searchRadius !== null && (
          <Circle
            center={[lat, lng]}
            radius={searchRadius * 1000}
            pathOptions={{
              color: '#3B82F6',
              fillColor: '#3B82F6',
              fillOpacity: 0.08,
              weight: 2,
              dashArray: '6, 4',
            }}
          />
        )}

        {/* Center markers */}
        {centers.map((center) => {
          if (!center.location?.coordinates || center.location.coordinates.length !== 2) return null;
          const [cLng, cLat] = center.location.coordinates;
          if (isNaN(cLat) || isNaN(cLng)) return null;

          const isSelected = selectedCenter === center._id;

          return (
            <Marker
              key={center._id}
              position={[cLat, cLng]}
              eventHandlers={{ click: () => handleMarkerClick(center) }}
            >
              <Popup>
                <div className="p-1 min-w-[180px]">
                  <p className="font-semibold text-base">{center.name}</p>
                  <p className="text-sm text-gray-600">
                    {center.address?.city}{center.address?.district ? `, ${center.address.district}` : ''}
                  </p>
                  {center.contact?.phone && (
                    <p className="text-sm mt-1">📞 {center.contact.phone}</p>
                  )}
                  {center.distance != null && (
                    <p className="text-sm text-blue-600 font-medium mt-1">
                      {center.distance < 1
                        ? `${Math.round(center.distance * 1000)}m away`
                        : `${center.distance.toFixed(1)}km away`}
                    </p>
                  )}
                  <span className={`inline-block mt-2 px-2 py-0.5 rounded text-xs ${
                    center.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {center.status === 'active' ? '✓ Open' : 'Closed'}
                  </span>
                  <br />
                  <button
                    onClick={() => handleMarkerClick(center)}
                    className="mt-2 w-full text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700"
                  >
                    Select this center
                  </button>
                </div>
              </Popup>
            </Marker>
          );
        }).filter(Boolean)}
      </LeafletMapContainer>
    </div>
  );
};

export default MapContainer;
