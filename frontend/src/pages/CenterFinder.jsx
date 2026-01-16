import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import axios from 'axios';
import MapContainer from '../components/map/MapContainer';
import SearchBar from '../components/map/SearchBar';
import CenterInfoPanel from '../components/map/CenterInfoPanel';
import centerService from '../services/centerService';
import { MapPin, List, Grid, ArrowLeft, Phone } from 'lucide-react';

const CenterFinder = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const serviceId = searchParams.get('service');
  
  const [centers, setCenters] = useState([]);
  const [filteredCenters, setFilteredCenters] = useState([]);
  const [selectedCenter, setSelectedCenter] = useState(null);
  const [selectedService, setSelectedService] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState('map'); // 'map' or 'list'
  const [searchRadius, setSearchRadius] = useState(10); // km - Default to 10km for local view

  useEffect(() => {
    const loadData = async () => {
      if (serviceId) {
        await loadServiceDetails();
      }
      await loadAllCenters();
      requestUserLocation();
    };
    
    loadData();
  }, [serviceId]);

  const loadServiceDetails = async () => {
    try {
      const response = await axios.get(`/services/${serviceId}`);
      if (response.data.success) {
        setSelectedService(response.data.data);
      }
    } catch (error) {
      console.error('Error loading service details:', error);
      setError('Failed to load service details.');
    }
  };

  const loadAllCenters = async () => {
    setLoading(true);
    try {
      const response = await centerService.getAllCenters();
      let allCenters = response.centers || [];
      
      // If a service is selected, filter centers that offer this service
      if (serviceId) {
        allCenters = allCenters.filter(center => 
          center.services && center.services.some(service => service._id === serviceId)
        );
      }
      
      setCenters(allCenters);
      
      // If user location is available and no service filter, show nearby centers by default
      if (userLocation && !serviceId) {
        const centersWithDistance = centerService.filterCentersByDistance(
          allCenters, 
          userLocation.lat, 
          userLocation.lng, 
          searchRadius
        );
        setFilteredCenters(centersWithDistance);
      } else {
        setFilteredCenters(allCenters);
      }
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
          // Automatically load nearby centers within 10km
          loadNearbyCenters(latitude, longitude, 10);
        },
        (error) => {
          console.log('Geolocation error:', error);
          // Continue without user location - show all centers
          setFilteredCenters(centers);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        }
      );
    } else {
      // Geolocation not supported - show all centers
      setFilteredCenters(centers);
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
    // Navigate to appointment booking with selected center and service
    const params = new URLSearchParams();
    params.set('center', centerId);
    if (serviceId) {
      params.set('service', serviceId);
    }
    navigate(`/appointments/book?${params.toString()}`);
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
            {selectedService && (
              <div className="mb-4">
                <button
                  onClick={() => navigate('/services')}
                  className="flex items-center text-blue-600 hover:text-blue-700 mb-3"
                >
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Back to Services
                </button>
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-semibold text-blue-900">{selectedService.name}</h2>
                      <p className="text-sm text-blue-700">
                        Select a center that offers this service • Fee: {selectedService.fees === 0 ? 'Free' : `₹${selectedService.fees}`}
                      </p>
                    </div>
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                      {selectedService.category}
                    </span>
                  </div>
                </div>
              </div>
            )}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {selectedService ? 'Select Akshaya Center' : 'Find Akshaya Centers'}
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  {selectedService 
                    ? `Centers offering ${selectedService.name} service`
                    : 'Locate nearby centers and book appointments for government services'
                  }
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
              {selectedService && ` offering ${selectedService.name}`}
              {userLocation && searchRadius && ` within ${searchRadius}km`}
              {searchRadius === null && ' (showing all centers)'}
            </span>
            
            <div className="flex items-center space-x-4">
              {userLocation && (
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-700">Distance:</span>
                  <div className="flex space-x-1">
                    {[5, 10, 20, 50, 100].map((radius) => (
                      <button
                        key={radius}
                        onClick={() => {
                          setSearchRadius(radius);
                          if (userLocation) {
                            loadNearbyCenters(userLocation.lat, userLocation.lng, radius);
                          }
                        }}
                        className={`px-3 py-1 text-sm rounded-full transition-colors ${
                          searchRadius === radius
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {radius}km
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              <button
                onClick={() => {
                  setFilteredCenters(centers);
                  setSearchRadius(null);
                }}
                className={`px-3 py-1 text-sm rounded-full transition-colors ${
                  searchRadius === null
                    ? 'bg-gray-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All Centers
              </button>
            </div>
          </div>
          
          {/* Location Detection Info */}
          {userLocation && (
            <div className="mt-2 text-xs text-blue-600 bg-blue-50 rounded-lg p-2">
              📍 Showing centers within {searchRadius || 'all'} km of your location. 
              {searchRadius && ` Adjust the distance filter above to see more centers.`}
            </div>
          )}
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

      {/* Center Statistics */}
      {!selectedService && (
        <div className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">{centers.length}</div>
                <div className="text-sm text-blue-700">Total Centers</div>
              </div>
              <div className="bg-green-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-green-600">
                  {centers.filter(c => c.status === 'active').length}
                </div>
                <div className="text-sm text-green-700">Active Centers</div>
              </div>
              <div className="bg-purple-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {userLocation ? filteredCenters.length : centers.length}
                </div>
                <div className="text-sm text-purple-700">
                  {searchRadius ? `Within ${searchRadius}km` : 'Available'}
                </div>
              </div>
              <div className="bg-orange-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {centers.reduce((total, center) => total + (center.services?.length || 0), 0)}
                </div>
                <div className="text-sm text-orange-700">Total Services</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1">
        {viewMode === 'map' ? (
          /* Map View */
          <div className="flex h-[calc(100vh-280px)] min-h-[600px]">
            {/* Map Container */}
            <div className={`transition-all duration-300 ${selectedCenter ? 'w-2/3' : 'w-full'}`}>
              <MapContainer
                centers={filteredCenters}
                userLocation={userLocation}
                selectedCenter={selectedCenter?._id}
                onCenterSelect={handleCenterSelect}
                searchRadius={searchRadius}
              />
            </div>
            
            {/* Center Info Panel - Right Side */}
            {selectedCenter && (
              <div className="w-1/3 border-l bg-white">
                <CenterInfoPanel
                  center={selectedCenter}
                  distance={selectedCenter?.distance}
                  onBookAppointment={handleBookAppointment}
                  onClose={handleClosePanel}
                  userLocation={userLocation}
                  selectedService={selectedService}
                  isDesktopSidePanel={true}
                />
              </div>
            )}
          </div>
        ) : (
          /* List View */
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
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
                    
                    {center.contact?.phone && (
                      <p className="text-xs text-gray-500 flex items-center mt-1">
                        <Phone className="h-3 w-3 mr-1" />
                        {center.contact.phone}
                      </p>
                    )}
                    
                    {center.services && center.services.length > 0 && (
                      <p className="text-xs text-gray-500 mt-1">
                        {center.services.length} service{center.services.length !== 1 ? 's' : ''} available
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
          </div>
        )}

        {/* No Results */}
        {filteredCenters.length === 0 && !loading && (
          <div className="text-center py-12">
            <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {selectedService ? 'No centers offer this service' : 'No centers found'}
            </h3>
            <p className="text-gray-600 mb-4">
              {selectedService 
                ? `No centers in your area offer ${selectedService.name}. Try expanding your search radius or browse other services.`
                : 'Try adjusting your search criteria or increasing the search radius.'
              }
            </p>
            <div className="space-x-2">
              {selectedService && (
                <Link
                  to="/services"
                  className="inline-block bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                >
                  Browse Other Services
                </Link>
              )}
              <button
                onClick={() => {
                  setFilteredCenters(centers);
                  setSearchRadius(null);
                  setError('');
                }}
                className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
              >
                Show All Centers
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CenterFinder;