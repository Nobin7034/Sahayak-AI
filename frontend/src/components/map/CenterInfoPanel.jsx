import React, { useState, useEffect } from 'react';
import { 
  X, 
  MapPin, 
  Phone, 
  Mail, 
  Clock, 
  Calendar,
  Users,
  Star,
  Navigation,
  ExternalLink
} from 'lucide-react';
import centerService from '../../services/centerService';

const CenterInfoPanel = ({ 
  center, 
  services = [], 
  distance = null, 
  onBookAppointment, 
  onClose,
  userLocation = null,
  selectedService = null,
  isDesktopSidePanel = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [availableServices, setAvailableServices] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (center) {
      setIsOpen(true);
      loadCenterServices();
    } else {
      setIsOpen(false);
    }
  }, [center]);

  const loadCenterServices = async () => {
    if (!center || !center._id) return;
    
    setLoading(true);
    try {
      const response = await centerService.getCenterServices(center._id);
      setAvailableServices(response.services || []);
    } catch (error) {
      console.error('Error loading center services:', error);
      setAvailableServices([]);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setTimeout(() => {
      if (onClose) onClose();
    }, 300); // Wait for animation to complete
  };

  const handleBookAppointment = () => {
    if (onBookAppointment && center) {
      onBookAppointment(center._id);
    }
  };

  const getOperatingStatus = () => {
    if (!center) return { status: 'unknown', text: 'Unknown' };
    
    try {
      const isOpen = centerService.isCenterOpen(center);
      return {
        status: isOpen ? 'open' : 'closed',
        text: isOpen ? 'Open Now' : 'Closed'
      };
    } catch (error) {
      console.error('Error checking center status:', error);
      return { status: 'unknown', text: 'Status Unknown' };
    }
  };

  const formatDistance = (dist) => {
    if (dist === null || dist === undefined) return null;
    if (dist < 1) {
      return `${Math.round(dist * 1000)}m away`;
    }
    return `${dist.toFixed(1)}km away`;
  };

  const getTodayHours = () => {
    if (!center || !center.operatingHours) return 'Hours not available';
    
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const today = days[new Date().getDay()];
    const todayHours = center.operatingHours[today];
    
    if (!todayHours || !todayHours.isOpen) {
      return 'Closed today';
    }
    
    return `${todayHours.open} - ${todayHours.close}`;
  };

  const getDirectionsUrl = () => {
    if (!center || !center.location || !center.location.coordinates) return '#';
    
    const [lng, lat] = center.location.coordinates;
    if (!lng || !lat) return '#';
    
    return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
  };

  if (!center) return null;

  // Show loading state while center data is being fetched
  if (loading) {
    const loadingClasses = isDesktopSidePanel 
      ? "w-full h-full bg-white rounded-lg shadow-lg border"
      : "fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-xl z-50 transform transition-transform duration-300 ease-in-out translate-x-0";
    
    return (
      <div className={loadingClasses}>
        <div className="bg-blue-600 text-white p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Loading...</h2>
            <button
              onClick={handleClose}
              className="p-1 hover:bg-blue-700 rounded-full transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  const operatingStatus = getOperatingStatus();
  const todayHours = getTodayHours();

  // Desktop side panel layout
  if (isDesktopSidePanel) {
    return (
      <div className="w-full h-full bg-white flex flex-col">
        {/* Header */}
        <div className="bg-blue-600 text-white p-4 flex-shrink-0">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h2 className="text-lg font-semibold mb-1">{center.name || 'Center Name'}</h2>
              {center.address && (center.address.city || center.address.district) && (
                <div className="flex items-center text-blue-100 text-sm">
                  <MapPin className="h-4 w-4 mr-1" />
                  <span>
                    {center.address.city && center.address.city}
                    {center.address.city && center.address.district && ', '}
                    {center.address.district && center.address.district}
                  </span>
                </div>
              )}
              {distance !== null && (
                <div className="text-blue-100 text-sm mt-1">
                  <Navigation className="h-4 w-4 inline mr-1" />
                  {formatDistance(distance)}
                </div>
              )}
            </div>
            <button
              onClick={handleClose}
              className="p-1 hover:bg-blue-700 rounded-full transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Status and Hours */}
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Clock className="h-5 w-5 text-gray-400 mr-2" />
              <span className="text-sm text-gray-600">Status:</span>
            </div>
            <div className="flex items-center">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                operatingStatus.status === 'open' 
                  ? 'bg-green-100 text-green-800' 
                  : operatingStatus.status === 'closed'
                  ? 'bg-red-100 text-red-800'
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {operatingStatus.text}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Calendar className="h-5 w-5 text-gray-400 mr-2" />
              <span className="text-sm text-gray-600">Today:</span>
            </div>
            <span className="text-sm font-medium">{todayHours}</span>
          </div>

          {/* Contact Information */}
          <div className="space-y-2">
            <h3 className="font-medium text-gray-900">Contact Information</h3>
            {center.contact?.phone && (
              <div className="flex items-center">
                <Phone className="h-4 w-4 text-gray-400 mr-3" />
                <a 
                  href={`tel:${center.contact.phone}`}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  {center.contact.phone}
                </a>
              </div>
            )}
            {center.contact?.email && (
              <div className="flex items-center">
                <Mail className="h-4 w-4 text-gray-400 mr-3" />
                <a 
                  href={`mailto:${center.contact.email}`}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  {center.contact.email}
                </a>
              </div>
            )}
          </div>

          {/* Address */}
          <div className="space-y-2">
            <h3 className="font-medium text-gray-900">Address</h3>
            <div className="text-sm text-gray-600">
              {center.address?.street && <p>{center.address.street}</p>}
              <p>
                {center.address?.city && center.address.city}
                {center.address?.city && center.address?.district && ', '}
                {center.address?.district && center.address.district}
              </p>
              {center.address?.state && center.address?.pincode && (
                <p>{center.address.state} - {center.address.pincode}</p>
              )}
            </div>
            <a
              href={getDirectionsUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
            >
              <ExternalLink className="h-4 w-4 mr-1" />
              Get Directions
            </a>
          </div>

          {/* Available Services */}
          <div className="space-y-2">
            <h3 className="font-medium text-gray-900">Available Services</h3>
            {loading ? (
              <div className="text-sm text-gray-500">Loading services...</div>
            ) : availableServices.length > 0 ? (
              <div className="space-y-2">
                {availableServices.slice(0, 5).map((service) => (
                  <div key={service._id} className="bg-gray-50 rounded-lg p-3">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-gray-900">{service.name}</h4>
                        <p className="text-xs text-gray-600 mt-1">{service.category}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-green-600">
                          {service.fees === 0 || service.fees === undefined ? 'Free' : `₹${service.fees}`}
                        </p>
                        <p className="text-xs text-gray-500">{service.processingTime}</p>
                      </div>
                    </div>
                  </div>
                ))}
                {availableServices.length > 5 && (
                  <p className="text-xs text-gray-500">
                    +{availableServices.length - 5} more services
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-500">Loading services...</p>
            )}
          </div>

          {/* Center Information */}
          <div className="bg-gray-50 rounded-lg p-3">
            <h3 className="font-medium text-gray-900 mb-2">Center Information</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center">
                <Users className="h-4 w-4 text-gray-400 mr-1" />
                <span>{center.capacity?.maxAppointmentsPerDay || 50}/day</span>
              </div>
              {center.metadata?.rating > 0 && (
                <div className="flex items-center">
                  <Star className="h-4 w-4 text-yellow-400 mr-1" />
                  <span>{center.metadata.rating.toFixed(1)}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t bg-gray-50 p-4 flex-shrink-0">
          <button
            onClick={handleBookAppointment}
            disabled={operatingStatus.status === 'closed'}
            className={`w-full py-3 px-4 rounded-lg font-medium transition-colors duration-200 ${
              operatingStatus.status !== 'closed'
                ? 'bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {operatingStatus.status === 'closed' ? 'Center Closed' : 'Book Appointment'}
          </button>
        </div>
      </div>
    );
  }

  // Mobile overlay layout
  return (
    <div className={`fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-xl z-50 
                   transform transition-transform duration-300 ease-in-out
                   ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
      
      {/* Header */}
      <div className="bg-blue-600 text-white p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h2 className="text-lg font-semibold mb-1">{center.name || 'Center Name'}</h2>
            {center.address && (center.address.city || center.address.district) && (
              <div className="flex items-center text-blue-100 text-sm">
                <MapPin className="h-4 w-4 mr-1" />
                <span>
                  {center.address.city && center.address.city}
                  {center.address.city && center.address.district && ', '}
                  {center.address.district && center.address.district}
                </span>
              </div>
            )}
            {distance !== null && (
              <div className="text-blue-100 text-sm mt-1">
                <Navigation className="h-4 w-4 inline mr-1" />
                {formatDistance(distance)}
              </div>
            )}
          </div>
          <button
            onClick={handleClose}
            className="p-1 hover:bg-blue-700 rounded-full transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        
        {/* Operating Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Clock className="h-5 w-5 text-gray-400 mr-2" />
            <span className="text-sm text-gray-600">Status:</span>
          </div>
          <div className="flex items-center">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              operatingStatus.status === 'open' 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {operatingStatus.text}
            </span>
          </div>
        </div>

        {/* Today's Hours */}
        {todayHours && (
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Calendar className="h-5 w-5 text-gray-400 mr-2" />
              <span className="text-sm text-gray-600">Today:</span>
            </div>
            <span className="text-sm font-medium">{todayHours}</span>
          </div>
        )}

        {/* Contact Information */}
        <div className="space-y-2">
          <h3 className="font-medium text-gray-900">Contact Information</h3>
          
          {center.contact?.phone && (
            <div className="flex items-center">
              <Phone className="h-4 w-4 text-gray-400 mr-3" />
              <a 
                href={`tel:${center.contact.phone}`}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                {center.contact.phone}
              </a>
            </div>
          )}
          
          {center.contact?.email && (
            <div className="flex items-center">
              <Mail className="h-4 w-4 text-gray-400 mr-3" />
              <a 
                href={`mailto:${center.contact.email}`}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                {center.contact.email}
              </a>
            </div>
          )}

          {(!center.contact?.phone && !center.contact?.email) && (
            <p className="text-sm text-gray-500">Contact information not available</p>
          )}
        </div>

        {/* Address */}
        <div className="space-y-2">
          <h3 className="font-medium text-gray-900">Address</h3>
          {center.address ? (
            <div className="text-sm text-gray-600">
              {center.address.street && <p>{center.address.street}</p>}
              <p>
                {center.address.city && center.address.city}
                {center.address.city && center.address.district && ', '}
                {center.address.district && center.address.district}
              </p>
              <p>
                {center.address.state && center.address.state}
                {center.address.state && center.address.pincode && ' - '}
                {center.address.pincode && center.address.pincode}
              </p>
            </div>
          ) : (
            <p className="text-sm text-gray-500">Address not available</p>
          )}
          
          {center.location?.coordinates && (
            <a
              href={getDirectionsUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
            >
              <ExternalLink className="h-4 w-4 mr-1" />
              Get Directions
            </a>
          )}
        </div>

        {/* Selected Service or Available Services */}
        <div className="space-y-2">
          {selectedService ? (
            <>
              <h3 className="font-medium text-gray-900">Selected Service</h3>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-blue-900">{selectedService.name}</h4>
                    <p className="text-xs text-blue-700 mt-1">{selectedService.category}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-green-600">
                      {selectedService.fees === 0 ? 'Free' : `₹${selectedService.fees}`}
                    </p>
                    <p className="text-xs text-gray-500">{selectedService.processingTime}</p>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              <h3 className="font-medium text-gray-900">Available Services</h3>
              
              {loading ? (
                <div className="text-sm text-gray-500">Loading services...</div>
              ) : availableServices.length > 0 ? (
                <div className="space-y-2">
                  {availableServices.slice(0, 5).map((service) => (
                    <div key={service._id} className="bg-gray-50 rounded-lg p-3">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="text-sm font-medium text-gray-900">{service.name}</h4>
                          <p className="text-xs text-gray-600 mt-1">{service.category}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-green-600">₹{service.fees}</p>
                          <p className="text-xs text-gray-500">{service.processingTime}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {availableServices.length > 5 && (
                    <p className="text-xs text-gray-500 text-center">
                      +{availableServices.length - 5} more services available
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No services information available</p>
              )}
            </>
          )}
        </div>

        {/* Center Stats */}
        {center.metadata && (
          <div className="bg-gray-50 rounded-lg p-3">
            <h3 className="font-medium text-gray-900 mb-2">Center Information</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              {center.metadata.rating > 0 && (
                <div className="flex items-center">
                  <Star className="h-4 w-4 text-yellow-400 mr-1" />
                  <span>{center.metadata.rating.toFixed(1)}</span>
                </div>
              )}
              
              {center.capacity && (
                <div className="flex items-center">
                  <Users className="h-4 w-4 text-gray-400 mr-1" />
                  <span>{center.capacity.maxAppointmentsPerDay}/day</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer - Book Appointment Button */}
      <div className="border-t bg-gray-50 p-4">
        <button
          onClick={handleBookAppointment}
          disabled={operatingStatus.status === 'closed'}
          className={`w-full py-3 px-4 rounded-lg font-medium transition-colors duration-200 ${
            operatingStatus.status !== 'closed'
              ? 'bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          {operatingStatus.status === 'closed' ? 'Center Closed' : 'Book Appointment'}
        </button>
        
        {operatingStatus.status === 'closed' && (
          <p className="text-xs text-gray-500 text-center mt-2">
            Center is currently closed
          </p>
        )}
      </div>
    </div>
  );
};

export default CenterInfoPanel;