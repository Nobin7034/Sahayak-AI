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
  userLocation = null 
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
    if (!center) return;
    
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
    
    const isOpen = centerService.isCenterOpen(center);
    return {
      status: isOpen ? 'open' : 'closed',
      text: isOpen ? 'Open Now' : 'Closed'
    };
  };

  const formatDistance = (dist) => {
    if (dist === null || dist === undefined) return null;
    if (dist < 1) {
      return `${Math.round(dist * 1000)}m away`;
    }
    return `${dist.toFixed(1)}km away`;
  };

  const getTodayHours = () => {
    if (!center || !center.operatingHours) return null;
    
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const today = days[new Date().getDay()];
    const todayHours = center.operatingHours[today];
    
    if (!todayHours || !todayHours.isOpen) {
      return 'Closed today';
    }
    
    return `${todayHours.open} - ${todayHours.close}`;
  };

  const getDirectionsUrl = () => {
    if (!center || !center.location) return '#';
    
    const [lng, lat] = center.location.coordinates;
    return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
  };

  if (!center) return null;

  const operatingStatus = getOperatingStatus();
  const todayHours = getTodayHours();

  return (
    <div className={`fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-xl z-50 
                   transform transition-transform duration-300 ease-in-out
                   ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
      
      {/* Header */}
      <div className="bg-blue-600 text-white p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h2 className="text-lg font-semibold mb-1">{center.name}</h2>
            <div className="flex items-center text-blue-100 text-sm">
              <MapPin className="h-4 w-4 mr-1" />
              <span>{center.address.city}, {center.address.district}</span>
            </div>
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
          
          <div className="flex items-center">
            <Phone className="h-4 w-4 text-gray-400 mr-3" />
            <a 
              href={`tel:${center.contact.phone}`}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              {center.contact.phone}
            </a>
          </div>
          
          <div className="flex items-center">
            <Mail className="h-4 w-4 text-gray-400 mr-3" />
            <a 
              href={`mailto:${center.contact.email}`}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              {center.contact.email}
            </a>
          </div>
        </div>

        {/* Address */}
        <div className="space-y-2">
          <h3 className="font-medium text-gray-900">Address</h3>
          <div className="text-sm text-gray-600">
            <p>{center.address.street}</p>
            <p>{center.address.city}, {center.address.district}</p>
            <p>{center.address.state} - {center.address.pincode}</p>
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
          disabled={operatingStatus.status === 'closed' || availableServices.length === 0}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium
                   hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500
                   disabled:bg-gray-300 disabled:cursor-not-allowed
                   transition-colors duration-200"
        >
          {availableServices.length === 0 
            ? 'No Services Available' 
            : 'Book Appointment'
          }
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