import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  ArrowLeft, 
  ArrowRight, 
  Clock, 
  IndianRupee, 
  FileText, 
  CheckCircle, 
  Calendar, 
  Loader2, 
  Eye, 
  X,
  MapPin,
  Phone,
  Building,
  List,
  Map
} from 'lucide-react'
import axios from 'axios'
import centerService from '../services/centerService'
import MapContainer from '../components/map/MapContainer'
import SearchBar from '../components/map/SearchBar'
import CenterInfoPanel from '../components/map/CenterInfoPanel'

const ServiceApplication = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  
  // State management
  const [currentStep, setCurrentStep] = useState(1) // 1: Documents, 2: Center Selection, 3: Appointment
  const [service, setService] = useState(null)
  const [centers, setCenters] = useState([])
  const [filteredCenters, setFilteredCenters] = useState([])
  const [selectedCenter, setSelectedCenter] = useState(null)
  const [userLocation, setUserLocation] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [preview, setPreview] = useState({ open: false, title: '', url: '' })
  const [viewMode, setViewMode] = useState('map') // 'map' or 'list'
  const [searchRadius, setSearchRadius] = useState(10) // km

  useEffect(() => {
    fetchService()
    requestUserLocation()
  }, [id])

  useEffect(() => {
    if (service && currentStep === 2) {
      fetchAvailableCenters()
    }
  }, [service, currentStep])

  const requestUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation({ lat: latitude, lng: longitude });
        },
        (error) => {
          console.log('Geolocation error:', error);
          // Continue without user location
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        }
      );
    }
  };

  const fetchService = async () => {
    try {
      setLoading(true)
      const response = await axios.get(`/api/services/${id}`)
      if (response.data.success) {
        setService(response.data.data)
      } else {
        setError('Service not found')
      }
    } catch (error) {
      console.error('Service fetch error:', error)
      setError('Failed to fetch service details')
    } finally {
      setLoading(false)
    }
  }

  const fetchAvailableCenters = async () => {
    try {
      const response = await centerService.getAllCenters()
      
      // Filter centers that offer the selected service
      const centersWithService = response.centers.filter(center => 
        center.services.some(s => s._id === service._id)
      )
      
      setCenters(centersWithService)
      
      // If user location is available, filter by distance
      if (userLocation && centersWithService.length > 0) {
        try {
          const centersWithDistance = centerService.filterCentersByDistance(
            centersWithService, 
            userLocation.lat, 
            userLocation.lng, 
            searchRadius
          )
          setFilteredCenters(centersWithDistance)
        } catch (distanceError) {
          console.error('Error filtering by distance:', distanceError)
          // Fallback to showing all centers with service
          setFilteredCenters(centersWithService)
        }
      } else {
        setFilteredCenters(centersWithService)
      }
    } catch (error) {
      console.error('Centers fetch error:', error)
      setError('Failed to fetch available centers')
    }
  }

  const handleSearch = async (query) => {
    if (!query.trim()) {
      // Clear search - show all centers or nearby if user location available
      if (userLocation) {
        const centersWithDistance = centerService.filterCentersByDistance(
          centers, 
          userLocation.lat, 
          userLocation.lng, 
          searchRadius
        )
        setFilteredCenters(centersWithDistance)
      } else {
        setFilteredCenters(centers)
      }
      return
    }

    try {
      const response = await centerService.searchCenters(query, searchRadius)
      setFilteredCenters(response.centers || [])
    } catch (error) {
      console.error('Error searching centers:', error)
      setError('Search failed. Please try again.')
    }
  }

  const handleLocationFound = (coordinates) => {
    setUserLocation(coordinates)
    if (centers.length > 0) {
      const centersWithDistance = centerService.filterCentersByDistance(
        centers, 
        coordinates.lat, 
        coordinates.lng, 
        searchRadius
      )
      setFilteredCenters(centersWithDistance)
    }
  }

  const handleRadiusChange = (radius) => {
    setSearchRadius(radius)
    if (userLocation && centers.length > 0) {
      const centersWithDistance = centerService.filterCentersByDistance(
        centers, 
        userLocation.lat, 
        userLocation.lng, 
        radius
      )
      setFilteredCenters(centersWithDistance)
    }
  }

  const handleNextStep = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleCenterSelect = async (centerId) => {
    try {
      const response = await centerService.getCenterById(centerId)
      setSelectedCenter(response.center)
    } catch (error) {
      console.error('Error loading center details:', error)
      setError('Failed to load center details')
    }
  }

  const handleCenterSelectFromList = (center) => {
    setSelectedCenter(center)
  }

  const handleBookAppointment = () => {
    if (selectedCenter) {
      navigate(`/book-appointment?service=${service._id}&center=${selectedCenter._id}`)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
          <p className="text-lg text-gray-600">Loading service details...</p>
        </div>
      </div>
    )
  }

  if (error || !service) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={() => navigate('/services')}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-700"
          >
            Back to Services
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/services')}
            className="inline-flex items-center text-primary hover:text-blue-700 font-medium mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Services
          </button>
          
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{service.name}</h1>
                <p className="text-gray-600">{service.category}</p>
              </div>
              <div className="text-right">
                <div className="text-lg font-semibold text-green-600">
                  {service.fees === 0 ? 'Free' : `₹${service.fees}`}
                </div>
                <div className="text-sm text-gray-500">{service.processingTime}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className={`flex items-center ${currentStep >= 1 ? 'text-primary' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                currentStep >= 1 ? 'bg-primary text-white' : 'bg-gray-200'
              }`}>
                1
              </div>
              <span className="ml-2 font-medium">Review Documents</span>
            </div>
            
            <div className={`flex-1 h-1 mx-4 ${currentStep >= 2 ? 'bg-primary' : 'bg-gray-200'}`}></div>
            
            <div className={`flex items-center ${currentStep >= 2 ? 'text-primary' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                currentStep >= 2 ? 'bg-primary text-white' : 'bg-gray-200'
              }`}>
                2
              </div>
              <span className="ml-2 font-medium">Select Center</span>
            </div>
            
            <div className={`flex-1 h-1 mx-4 ${currentStep >= 3 ? 'bg-primary' : 'bg-gray-200'}`}></div>
            
            <div className={`flex items-center ${currentStep >= 3 ? 'text-primary' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                currentStep >= 3 ? 'bg-primary text-white' : 'bg-gray-200'
              }`}>
                3
              </div>
              <span className="ml-2 font-medium">Book Appointment</span>
            </div>
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          {/* Step 1: Document Requirements */}
          {currentStep === 1 && (
            <div>
              <div className="flex items-center space-x-2 mb-6">
                <FileText className="w-6 h-6 text-primary" />
                <h2 className="text-2xl font-bold text-gray-900">Required Documents</h2>
              </div>
              
              <p className="text-gray-600 mb-6">
                Please review the documents required for this service. Make sure you have all necessary documents before proceeding.
              </p>

              <div className="space-y-4 mb-8">
                {service.documents && service.documents.length > 0 ? (
                  service.documents.map((d, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{d.name}</h3>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          d.requirement === 'optional' ? 'bg-gray-100 text-gray-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {d.requirement === 'optional' ? 'Optional' : 'Mandatory'}
                        </span>
                      </div>
                      
                      {d.notes && <p className="text-gray-600 mb-3">{d.notes}</p>}
                      
                      {(d.imageUrl || d?.template?.imageUrl) && (
                        <button
                          type="button"
                          className="inline-flex items-center text-primary hover:text-blue-700 text-sm"
                          onClick={() => {
                            const url = d.imageUrl || d?.template?.imageUrl
                            setPreview({ open: true, title: d.name, url })
                          }}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View Sample Document
                        </button>
                      )}

                      {/* Alternatives */}
                      {d.alternatives && d.alternatives.length > 0 && (
                        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                          <div className="text-sm font-medium text-gray-800 mb-2">
                            Alternative Documents (any one):
                          </div>
                          <div className="space-y-2">
                            {d.alternatives.map((alt, altIndex) => (
                              <div key={altIndex} className="flex items-center justify-between">
                                <span className="text-sm text-gray-700">{alt.name}</span>
                                {(alt.imageUrl || alt?.template?.imageUrl) && (
                                  <button
                                    type="button"
                                    className="text-primary hover:text-blue-700 text-xs"
                                    onClick={() => {
                                      const url = alt.imageUrl || alt?.template?.imageUrl
                                      setPreview({ open: true, title: alt.name, url })
                                    }}
                                  >
                                    <Eye className="w-3 h-3 mr-1 inline" />
                                    Sample
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                ) : service.requiredDocuments && service.requiredDocuments.length > 0 ? (
                  service.requiredDocuments.map((doc, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <h3 className="text-lg font-semibold text-gray-900">{doc}</h3>
                        <span className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-700">
                          Required
                        </span>
                      </div>
                      <p className="text-gray-600 mt-2">
                        Please ensure this document is original or self-attested copy.
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No specific documents required for this service.
                  </div>
                )}
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-center space-x-2 mb-2">
                  <CheckCircle className="w-5 h-5 text-blue-600" />
                  <span className="font-semibold text-blue-900">Important Note</span>
                </div>
                <p className="text-blue-800 text-sm">
                  All documents must be original or self-attested copies. Ensure all information 
                  is clearly visible and matches your application details exactly.
                </p>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleNextStep}
                  className="btn-primary flex items-center"
                >
                  I Have All Documents - Continue
                  <ArrowRight className="ml-2 w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Center Selection */}
          {currentStep === 2 && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-2">
                  <Building className="w-6 h-6 text-primary" />
                  <h2 className="text-2xl font-bold text-gray-900">Select Akshaya Center</h2>
                </div>
                
                {/* View Toggle */}
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setViewMode('map')}
                    className={`p-2 rounded-lg transition-colors ${
                      viewMode === 'map' 
                        ? 'bg-blue-100 text-blue-600' 
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                    title="Map View"
                  >
                    <Map className="h-5 w-5" />
                  </button>
                  
                  <button
                    onClick={() => setViewMode('list')}
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
              
              <p className="text-gray-600 mb-4">
                Choose an Akshaya Center near you that offers this service.
              </p>

              {/* Search Bar */}
              <div className="mb-4">
                <SearchBar
                  onSearch={handleSearch}
                  onLocationFound={handleLocationFound}
                  placeholder="Search by location, address, or area name..."
                />
              </div>

              {/* Distance Filter */}
              {userLocation && (
                <div className="mb-4 flex items-center justify-between text-sm">
                  <span className="text-gray-600">
                    {filteredCenters.length} center{filteredCenters.length !== 1 ? 's' : ''} found
                    {searchRadius && ` within ${searchRadius}km`}
                  </span>
                  
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-700 font-medium">Distance:</span>
                    <div className="flex space-x-1">
                      {[5, 10, 20, 50].map((radius) => (
                        <button
                          key={radius}
                          onClick={() => handleRadiusChange(radius)}
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
                </div>
              )}

              {viewMode === 'map' ? (
                /* Map View */
                <div className="mb-6">
                  <div className="flex h-[500px] rounded-lg overflow-hidden border">
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
                          onClose={() => setSelectedCenter(null)}
                          userLocation={userLocation}
                          selectedService={service}
                          isDesktopSidePanel={true}
                        />
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* List View */
                <div className="mb-6 space-y-4 max-h-[500px] overflow-y-auto">
                  {filteredCenters.length > 0 ? (
                    filteredCenters.map((center) => (
                      <div 
                        key={center._id} 
                        className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                          selectedCenter?._id === center._id 
                            ? 'border-primary bg-blue-50' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => handleCenterSelectFromList(center)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900">{center.name}</h3>
                            <div className="flex items-center text-gray-600 mt-1">
                              <MapPin className="w-4 h-4 mr-1" />
                              <span>{center.address.city}, {center.address.district}</span>
                            </div>
                            <div className="flex items-center text-gray-600 mt-1">
                              <Phone className="w-4 h-4 mr-1" />
                              <span>{center.contact.phone}</span>
                            </div>
                            {center.distance && (
                              <div className="text-blue-600 font-medium mt-1">
                                {center.distance < 1 
                                  ? `${Math.round(center.distance * 1000)}m away`
                                  : `${center.distance.toFixed(1)}km away`
                                }
                              </div>
                            )}
                            <div className="mt-2">
                              <span className="text-sm text-gray-500">
                                Working Hours: {center.workingHours?.start} - {center.workingHours?.end}
                              </span>
                            </div>
                          </div>
                          <div className="flex flex-col items-end">
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              centerService.isCenterOpen(center)
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {centerService.isCenterOpen(center) ? 'Open' : 'Closed'}
                            </span>
                            {selectedCenter?._id === center._id && (
                              <CheckCircle className="w-5 h-5 text-primary mt-2" />
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      No centers available for this service in your area.
                      {userLocation && (
                        <div className="mt-2">
                          <button
                            onClick={() => handleRadiusChange(50)}
                            className="text-blue-600 hover:text-blue-700"
                          >
                            Try expanding search to 50km
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-between">
                <button
                  onClick={handlePrevStep}
                  className="btn-secondary flex items-center"
                >
                  <ArrowLeft className="mr-2 w-4 h-4" />
                  Back to Documents
                </button>
                <button
                  onClick={handleNextStep}
                  disabled={!selectedCenter}
                  className="btn-primary flex items-center disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  Continue to Booking
                  <ArrowRight className="ml-2 w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Appointment Booking */}
          {currentStep === 3 && (
            <div>
              <div className="flex items-center space-x-2 mb-6">
                <Calendar className="w-6 h-6 text-primary" />
                <h2 className="text-2xl font-bold text-gray-900">Book Your Appointment</h2>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-6 mb-6">
                <h3 className="font-semibold text-gray-900 mb-4">Booking Summary</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Service:</span>
                    <span className="font-medium">{service.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Center:</span>
                    <span className="font-medium">{selectedCenter?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Fee:</span>
                    <span className="font-medium text-green-600">
                      {service.fees === 0 ? 'Free' : `₹${service.fees}`}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Processing Time:</span>
                    <span className="font-medium">{service.processingTime}</span>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-center space-x-2 mb-2">
                  <CheckCircle className="w-5 h-5 text-blue-600" />
                  <span className="font-semibold text-blue-900">Ready to Book</span>
                </div>
                <p className="text-blue-800 text-sm">
                  You'll be redirected to select your preferred date and time slot for the appointment.
                </p>
              </div>

              <div className="flex justify-between">
                <button
                  onClick={handlePrevStep}
                  className="btn-secondary flex items-center"
                >
                  <ArrowLeft className="mr-2 w-4 h-4" />
                  Back to Center Selection
                </button>
                <button
                  onClick={handleBookAppointment}
                  className="btn-primary flex items-center"
                >
                  <Calendar className="mr-2 w-4 h-4" />
                  Book Appointment
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Image Preview Modal */}
      {preview.open && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full mx-4">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">{preview.title}</h3>
              <button
                className="text-gray-500 hover:text-gray-700"
                onClick={() => setPreview({ open: false, title: '', url: '' })}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4">
              <img 
                src={preview.url} 
                alt={preview.title} 
                className="max-h-[70vh] w-auto max-w-full object-contain rounded border mx-auto" 
              />
              <div className="text-xs text-gray-500 mt-2 text-center">Sample document image</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ServiceApplication