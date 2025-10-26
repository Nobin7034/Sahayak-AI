import React, { useState, useEffect } from 'react';
import { Sparkles, Clock, DollarSign, Users, TrendingUp, AlertCircle, Loader2 } from 'lucide-react';
import mlService from '../services/mlService.js';

const MLRecommendations = ({ userId, limit = 5 }) => {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [type, setType] = useState('');

  useEffect(() => {
    if (userId) {
      fetchRecommendations();
    }
  }, [userId, limit]);

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await mlService.getRecommendations(limit);
      
      if (response.success) {
        setRecommendations(response.data.recommendations);
        setType(response.data.type);
      } else {
        setError(response.message || 'Failed to load recommendations');
      }
    } catch (error) {
      console.error('Recommendations error:', error);
      setError('Failed to load recommendations');
    } finally {
      setLoading(false);
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

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-center space-x-2">
          <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
          <span className="text-gray-600">Loading AI recommendations...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center space-x-2 text-red-600">
          <AlertCircle className="h-5 w-5" />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  if (recommendations.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-center text-gray-500">
          <Sparkles className="h-8 w-8 mx-auto mb-2 text-gray-400" />
          <p>No recommendations available at the moment.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Sparkles className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">
            AI-Powered Recommendations
          </h3>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          type === 'personalized' 
            ? 'bg-blue-100 text-blue-800' 
            : 'bg-gray-100 text-gray-800'
        }`}>
          {type === 'personalized' ? 'Personalized' : 'Popular'}
        </span>
      </div>

      <div className="space-y-4">
        {recommendations.map((service, index) => (
          <div key={service._id || index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-2">
              <h4 className="font-medium text-gray-900 line-clamp-2">
                {service.name}
              </h4>
              {service.similarity && (
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                  {Math.round(service.similarity * 100)}% match
                </span>
              )}
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
              
              <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                View Details →
              </button>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-4 pt-4 border-t border-gray-200">
        <p className="text-xs text-gray-500 text-center">
          Powered by K-Nearest Neighbors algorithm
        </p>
      </div>
    </div>
  );
};

export default MLRecommendations;
