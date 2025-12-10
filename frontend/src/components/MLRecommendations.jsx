import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Clock, DollarSign, Users } from 'lucide-react';
import axios from 'axios';

const MLRecommendations = ({ userId, limit = 5 }) => {
  const [recommendations, setRecommendations] = useState([]);
  
  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const response = await axios.get('/services');
      if (response.data.success) {
        // Get first 2 services as recommendations
        const services = response.data.data.slice(0, 2);
        setRecommendations(services);
      }
    } catch (error) {
      console.error('Failed to fetch services:', error);
      // Fallback to empty array or static data
      setRecommendations([]);
    }
  };

  const getCategoryColor = (category) => {
    const colors = {
      'Government Services': 'bg-blue-100 text-blue-800',
      'Document Services': 'bg-green-100 text-green-800',
      'Financial Services': 'bg-purple-100 text-purple-800',
      'Health Services': 'bg-red-100 text-red-800',
      'Education Services': 'bg-yellow-100 text-yellow-800',
      'Other': 'bg-gray-100 text-gray-800'
    };
    return colors[category] || colors['Other'];
  };

  const getProcessingTimeColor = (time) => {
    if (time === 'Same Day') return 'text-green-600';
    if (time === '1-3 Days') return 'text-yellow-600';
    return 'text-blue-600';
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Sparkles className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">
            AI Service Recommendations
          </h3>
        </div>
      </div>

      <div className="space-y-4">
        {recommendations.length > 0 ? recommendations.map((service, index) => (
          <div key={service._id || index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-2">
              <h4 className="font-medium text-gray-900 line-clamp-2">
                {service.name}
              </h4>
            </div>
            
            <p className="text-sm text-gray-600 mb-3 line-clamp-2">
              {service.description}
            </p>
            
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(service.category)}`}>
                {service.category}
              </span>
              <span className={`text-xs font-medium ${getProcessingTimeColor(service.processingTime)}`}>
                <Clock className="h-3 w-3 inline mr-1" />
                {service.processingTime}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <div className="flex items-center space-x-1">
                  <DollarSign className="h-4 w-4" />
                  <span>₹{service.fee}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Users className="h-4 w-4" />
                  <span>{service.visitCount || 0} visits</span>
                </div>
              </div>
              
              <Link 
                to={`/service/${service._id}`}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                View Details →
              </Link>
            </div>
          </div>
        )) : (
          <div className="text-center text-gray-500 py-4">
            No services available
          </div>
        )}
      </div>
    </div>
  );
};

export default MLRecommendations;

