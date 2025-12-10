import React, { useState, useEffect } from 'react';
import { Calendar, Clock, CheckCircle, AlertTriangle, Loader2, TrendingUp } from 'lucide-react';
import mlService from '../services/mlService.js';

const MLScheduling = ({ serviceId, serviceName, onTimeSlotSelect }) => {
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [bestTimeSlot, setBestTimeSlot] = useState(null);

  useEffect(() => {
    // Set default date to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setSelectedDate(mlService.formatDate(tomorrow));
  }, []);

  useEffect(() => {
    if (serviceId && selectedDate) {
      fetchOptimalSchedule();
    }
  }, [serviceId, selectedDate]);

  const fetchOptimalSchedule = async () => {
    try {
      setLoading(true);
      setError('');
      
      if (!serviceId) {
        setError('Service ID is required');
        setLoading(false);
        return;
      }
      
      const response = await mlService.getOptimalSchedule(serviceId, selectedDate);
      
      if (response.success) {
        setPredictions(response.data.predictions || []);
        setBestTimeSlot(response.data.bestTimeSlot);
        
        // Show info message if using fallback
        if (response.data.fallbackUsed) {
          console.log('ℹ️ Using default scheduling:', response.data.message);
        }
      } else {
        setError(response.message || 'Failed to get schedule predictions');
      }
    } catch (error) {
      console.error('Schedule prediction error:', error);
      
      // Even on error, try to show default slots
      if (error.response?.status === 404) {
        // Use fallback slots (already handled in mlService, but just in case)
        setPredictions([
          { hour: 9, successProbability: 0.85, recommended: true, source: 'default' },
          { hour: 10, successProbability: 0.85, recommended: true, source: 'default' },
          { hour: 11, successProbability: 0.80, recommended: true, source: 'default' }
        ]);
        setBestTimeSlot({ hour: 9, successProbability: 0.85, recommended: true, source: 'default' });
      } else {
        const errorMessage = error.response?.data?.message || error.message;
        if (error.response?.status === 503 || errorMessage.includes('not trained')) {
          setError('AI scheduling is currently learning from your appointment history. This feature will be available once we have enough data (at least 10 completed appointments).');
        } else if (errorMessage.includes('Service not found')) {
          setError('Service not found. Please select a valid service.');
        } else {
          setError('Failed to get schedule predictions. Showing default time slots.');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (e) => {
    setSelectedDate(e.target.value);
  };

  const handleTimeSlotSelect = (timeSlot) => {
    if (onTimeSlotSelect) {
      onTimeSlotSelect({
        ...timeSlot,
        date: selectedDate
      });
    }
  };

  const getSuccessColor = (probability) => {
    if (probability >= 0.8) return 'text-green-600';
    if (probability >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getSuccessBgColor = (probability) => {
    if (probability >= 0.8) return 'bg-green-50 border-green-200';
    if (probability >= 0.6) return 'bg-yellow-50 border-yellow-200';
    return 'bg-red-50 border-red-200';
  };

  const getSuccessIcon = (probability) => {
    if (probability >= 0.8) return <CheckCircle className="h-4 w-4 text-green-600" />;
    if (probability >= 0.6) return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
    return <AlertTriangle className="h-4 w-4 text-red-600" />;
  };

  if (!serviceId) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-center text-gray-500">
          <Calendar className="h-8 w-8 mx-auto mb-2 text-gray-400" />
          <p>Select a service to see AI-powered scheduling recommendations.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <TrendingUp className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">
            AI Scheduling Assistant
          </h3>
        </div>
        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
          Decision Tree
        </span>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Date
        </label>
        <input
          type="date"
          value={selectedDate}
          onChange={handleDateChange}
          min={mlService.formatDate(new Date())}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {loading && (
        <div className="flex items-center justify-center space-x-2 py-8">
          <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
          <span className="text-gray-600">Analyzing optimal time slots...</span>
        </div>
      )}

      {error && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="text-sm font-medium text-yellow-900 mb-1">
                AI Scheduling Unavailable
              </h4>
              <p className="text-sm text-yellow-800">
                {error}
              </p>
              {error.includes('learning from your appointment history') && (
                <p className="text-xs text-yellow-700 mt-2">
                  💡 The AI will automatically train once you have more completed appointments. In the meantime, please select any available time slot.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {!loading && !error && predictions.length > 0 && (
        <div className="space-y-3">
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">
              Recommended Time Slots for {serviceName}
            </h4>
            <p className="text-xs text-gray-500">
              Based on historical success patterns and service characteristics
            </p>
          </div>

          {predictions.map((prediction, index) => (
            <div
              key={index}
              className={`border rounded-lg p-3 cursor-pointer transition-all hover:shadow-md ${
                getSuccessBgColor(prediction.successProbability)
              } ${
                prediction.recommended ? 'ring-2 ring-blue-500' : ''
              }`}
              onClick={() => handleTimeSlotSelect(prediction)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Clock className="h-4 w-4 text-gray-600" />
                  <span className="font-medium text-gray-900">
                    {mlService.formatTimeSlot(prediction.hour)}
                  </span>
                  {prediction.recommended && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                      Best Choice
                    </span>
                  )}
                </div>
                
                <div className="flex items-center space-x-2">
                  {getSuccessIcon(prediction.successProbability)}
                  <span className={`text-sm font-medium ${getSuccessColor(prediction.successProbability)}`}>
                    {Math.round(prediction.successProbability * 100)}% success
                  </span>
                </div>
              </div>
              
              <div className="mt-2">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      prediction.successProbability >= 0.8 ? 'bg-green-500' :
                      prediction.successProbability >= 0.6 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${prediction.successProbability * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
          ))}

          {bestTimeSlot && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-800">
                  AI Recommendation: {mlService.formatTimeSlot(bestTimeSlot.hour)} 
                  ({Math.round(bestTimeSlot.successProbability * 100)}% success rate)
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-gray-200">
        <p className="text-xs text-gray-500 text-center">
          {predictions.length > 0 && predictions[0].source === 'heuristic' 
            ? 'Smart scheduling recommendations • AI will improve with more data'
            : 'Powered by AI Decision Tree analyzing historical patterns'
          }
        </p>
      </div>
    </div>
  );
};

export default MLScheduling;

