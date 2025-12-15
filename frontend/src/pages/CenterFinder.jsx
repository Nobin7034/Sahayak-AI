import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MapContainer from '../components/map/MapContainer';
import SearchBar from '../components/map/SearchBar';
import CenterInfoPanel from '../components/map/CenterInfoPanel';
import centerService from '../services/centerService';
import { MapPin, List, Grid } from 'lucide-react';

const CenterFinder = () => {
  const navigate = useNavigate();
  const [centers, setCenters] = useState([]);
  const [filteredCenters, setFilteredCenters] = useState([]);
  const [selectedCenter, setSelectedCenter] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState('map'); // 'map' or 'list'
  const [searchRadius, setSearchRadius] = useState(50); // km

  useEffect(() => {
    loadAllCenters();
    requestUserLocation();
  }, []);

  const loadAllCenters = async () => {
    setLoading(true);
    try {
      const response = await centerService.getAllCenters();
      setCenters(response.centers || []);
      setFilteredCenters(response.centers || []);
    } catch (error) {
      console.error('Error loading centers:', error);
      setError('Failed to load Akshaya centers. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const requestUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation({ lat: latitude, lng: longitude });
          loadNearbyCenters(latitude, longitude);
        },
        (error) => {
          console.log('Geolocation error:', error);
          // Continue without user location
        }
      );
    }
  };

  const loadNearbyCenters = async (lat, lng, radius = searchRadius) => {
    try {
      const response = await centerService.getNearbyCenters(lat, lng, radius);
      setFilteredCenters(response.centers || []);
    } catch (error) {
      console.error('Error loading nearby centers:', error);
      // Fall back to all centers
      setFilteredCenters(centers);
    }
  };

  const handleSearch = async (query) => {
    if (!query.trim()) {
      // Clear search - show all centers or nearby if user location available
      if (userLocation) {
        loadNearbyCenters(userLocation.lat, userLocation.lng);
      } else {
        setFilteredCenters(centers);
      }
      return;
    }

    try {
      const response = await centerService.searchCenters(query, searchRadius);
      setFilteredCenters(response.centers || []);
    } catch (error) {
      console.error('Error searching centers:', error);
      setError('Search failed. Please try again.');
    }
  };

  const handleLocationFound = (coordinates) => {
    setUserLocation(coordinates);
    loadNearbyCenters(coordinates.lat, coordinates.lng);
  };

  const handleCenterSelect = async (centerId) => {
    try {
      const response = await centerService.getCenterById(centerId);
      setSelectedCenter(response.center);
    } catch (error) {
      console.error('Error loading center details:', error);
      setError('Failed to load center details.');
    }
  };

  const handleBookAppointment = (centerId) => {
    // Navigate to appointment booking with selected center
    navigate(`/appointments/book?center=${centerId}`);
  };

  const handleClosePanel = () => {
    setSelectedCenter(null);
  };

  const toggleViewMode = () => {
    setViewMode(viewMode === 'map' ? 'list' : 'map');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading Akshaya Centers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Find Akshaya Centers</h1>
                <p className="text-sm text-gray-600 mt-1">
                  Locate nearby centers and book appointments for government services
                </p>
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={toggleViewMode}
                  className={`p-2 rounded-lg transition-colors ${
                    viewMode === 'map' 
                      ? 'bg-blue-100 text-blue-600' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                  title="Map View"
                >
                  <MapPin className="h-5 w-5" />
                </button>
                
                <button
                  onClick={toggleViewMode}
                  className={`p-2 rounded-lg transition-colors ${
                    viewMode === 'list' 
                      ? 'bg-blue-100 text-blue-600' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                  title="List View"
                >
                  <List className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <SearchBar
            onSearch={handleSearch}
            onLocationFound={handleLocationFound}
            placeholder="Search by location, address, or area name..."
          />
          
          {/* Search Stats */}
          <div className="mt-3 flex items-center justify-between text-sm text-gray-600">
            <span>
              {filteredCenters.length} center{filteredCenters.length !== 1 ? 's' : ''} found
              {userLocation && ` within ${searchRadius}km`}
            </span>
            
            {userLocation && (
              <div className="flex items-center space-x-2">
                <label htmlFor="radius" className="text-sm">Radius:</label>
                <select
                  id="radius"
                  value={searchRadius}
                  onChange={(e) => {
                    const radius = parseInt(e.target.value);
                    setSearchRadius(radius);
                    loadNearbyCenters(userLocation.lat, userLocation.lng, radius);
                  }}
                  className="text-sm border border-gray-300 rounded px-2 py-1"
                >
                  <option value={10}>10km</option>
                  <option value={25}>25km</option>
                  <option value={50}>50km</option>
                  <option value={100}>100km</option>
                </select>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-red-800">{error}</p>
            <button
              onClick={() => setError('')}
              className="mt-2 text-sm text-red-600 hover:text-red-800"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {viewMode === 'map' ? (
          /* Map View */
          <div className="relative">
            <MapContainer
              centers={filteredCenters}
              userLocation={userLocation}
              selectedCenter={selectedCenter?._id}
              onCenterSelect={handleCenterSelect}
            />
            
            {/* Center Info Panel */}
            <CenterInfoPanel
              center={selectedCenter}
              distance={selectedCenter?.distance}
              onBookAppointment={handleBookAppointment}
              onClose={handleClosePanel}
              userLocation={userLocation}
            />
          </div>
        ) : (
          /* List View */
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredCenters.map((center) => (
              <div
                key={center._id}
                className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => handleCenterSelect(center._id)}
              >
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-gray-900">{center.name}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      center.status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {center.status === 'active' ? 'Open' : 'Closed'}
                    </span>
                  </div>
                  
                  <div className="text-sm text-gray-600 space-y-1">
                    <p className="flex items-center">
                      <MapPin className="h-4 w-4 mr-1" />
                      {center.address.city}, {center.address.district}
                    </p>
                    
                    {center.distance && (
                      <p className="text-blue-600 font-medium">
                        {center.distance < 1 
                          ? `${Math.round(center.distance * 1000)}m away`
                          : `${center.distance.toFixed(1)}km away`
                        }
                      </p>
                    )}
                  </div>
                  
                  <div className="mt-3 pt-3 border-t">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleBookAppointment(center._id);
                      }}
                      className="w-full bg-blue-600 text-white py-2 px-4 rounded-md text-sm
                               hover:bg-blue-700 transition-colors"
                    >
                      Book Appointment
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* No Results */}
        {filteredCenters.length === 0 && !loading && (
          <div className="text-center py-12">
            <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No centers found</h3>
            <p className="text-gray-600 mb-4">
              Try adjusting your search criteria or increasing the search radius.
            </p>
            <button
              onClick={() => {
                setFilteredCenters(centers);
                setError('');
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Show All Centers
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CenterFinder;