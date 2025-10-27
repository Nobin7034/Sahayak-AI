import React, { useState, useEffect } from 'react';
import { 
  Brain, 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  Activity, 
  Loader2,
  TrendingUp,
  BarChart3,
  Settings,
  Clock
} from 'lucide-react';
import mlService from '../services/mlService.js';

const MLAdminDashboard = () => {
  const [modelStatus, setModelStatus] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    fetchModelStatus();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchModelStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchModelStatus = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await mlService.getModelStatus();
      
      if (response.success) {
        setModelStatus(response.data.models);
        setLastUpdated(new Date());
      } else {
        setError('Failed to fetch model status');
      }
    } catch (error) {
      console.error('Model status error:', error);
      setError('Failed to fetch model status');
    } finally {
      setLoading(false);
    }
  };

  const getModelInfo = (modelName) => {
    const models = {
      knn: {
        name: 'K-Nearest Neighbors',
        description: 'Service recommendation based on user behavior patterns',
        icon: '🎯',
        color: 'blue'
      },
      bayes: {
        name: 'Bayesian Classifier',
        description: 'Automatic service categorization using probability',
        icon: '📊',
        color: 'green'
      },
      decisionTree: {
        name: 'Decision Tree',
        description: 'Optimal appointment scheduling predictions',
        icon: '🌳',
        color: 'purple'
      }
    };
    return models[modelName] || { name: modelName, description: '', icon: '🤖', color: 'gray' };
  };

  const getStatusIcon = (isTrained) => {
    return isTrained ? (
      <CheckCircle className="h-5 w-5 text-green-600" />
    ) : (
      <XCircle className="h-5 w-5 text-red-600" />
    );
  };

  const getStatusColor = (isTrained) => {
    return isTrained ? 'text-green-600' : 'text-red-600';
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-center space-x-2">
          <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
          <span className="text-gray-600">Loading ML model status...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Brain className="h-6 w-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Machine Learning Monitor
              </h2>
              <p className="text-sm text-gray-600">
                Real-time monitoring of AI models for service recommendations and predictions
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {lastUpdated && (
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <Clock className="h-4 w-4" />
                <span>Updated {lastUpdated.toLocaleTimeString()}</span>
              </div>
            )}
            <button
              onClick={fetchModelStatus}
              disabled={loading}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              <span>Refresh Status</span>
            </button>
          </div>
        </div>
      </div>

      {/* Status Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <XCircle className="h-5 w-5 text-red-600" />
            <span className="text-red-800">{error}</span>
          </div>
        </div>
      )}

      {/* Auto-Training Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center space-x-2">
          <Activity className="h-5 w-5 text-blue-600" />
          <div>
            <h4 className="text-sm font-medium text-blue-900">Automatic Training Enabled</h4>
            <p className="text-xs text-blue-700 mt-1">
              ML models train automatically when users access features. No manual intervention needed.
            </p>
          </div>
        </div>
      </div>

      {/* Model Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {Object.entries(modelStatus).map(([modelName, isTrained]) => {
          const modelInfo = getModelInfo(modelName);
          return (
            <div key={modelName} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{modelInfo.icon}</span>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {modelInfo.name}
                    </h3>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">
                      {modelName}
                    </p>
                  </div>
                </div>
                {getStatusIcon(isTrained)}
              </div>
              
              <p className="text-sm text-gray-600 mb-4">
                {modelInfo.description}
              </p>
              
              <div className="flex items-center justify-between">
                <span className={`text-sm font-medium ${getStatusColor(isTrained)}`}>
                  Status: {isTrained ? 'Active & Ready' : 'Training on Next Use'}
                </span>
                
                <div className={`px-3 py-1 text-xs font-medium rounded-full ${
                  isTrained
                    ? 'bg-green-100 text-green-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {isTrained ? 'Trained' : 'Pending'}
                </div>
              </div>
              
              {!isTrained && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <p className="text-xs text-gray-500">
                    Will auto-train when a user requests this feature
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Model Performance Overview */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center space-x-2 mb-4">
          <BarChart3 className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">
            Model Performance Overview
          </h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              {Object.values(modelStatus).filter(Boolean).length}
            </div>
            <div className="text-sm text-blue-800">Models Trained</div>
          </div>
          
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {Object.values(modelStatus).every(Boolean) ? '100%' : 'Partial'}
            </div>
            <div className="text-sm text-green-800">System Status</div>
          </div>
          
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">3</div>
            <div className="text-sm text-purple-800">Available Models</div>
          </div>
        </div>
      </div>

      {/* Model Capabilities */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Settings className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">
            Model Capabilities & Auto-Training
          </h3>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-start space-x-3">
            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
            <div>
              <h4 className="font-medium text-gray-900">Service Recommendations (KNN)</h4>
              <p className="text-sm text-gray-600 mb-1">
                Analyzes user behavior to suggest relevant services
              </p>
              <p className="text-xs text-gray-500">
                📊 Requires: 10+ completed appointments | Trains: When user views services
              </p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
            <div>
              <h4 className="font-medium text-gray-900">Service Categorization (Bayesian)</h4>
              <p className="text-sm text-gray-600 mb-1">
                Automatically categorizes services based on features
              </p>
              <p className="text-xs text-gray-500">
                📊 Requires: 5+ active services | Trains: When service is categorized
              </p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
            <div>
              <h4 className="font-medium text-gray-900">Schedule Optimization (Decision Tree)</h4>
              <p className="text-sm text-gray-600 mb-1">
                Predicts optimal appointment times for better success rates
              </p>
              <p className="text-xs text-gray-500">
                📊 Requires: 10+ completed appointments | Trains: When user schedules appointment
              </p>
            </div>
          </div>
        </div>
        
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            💡 All models train automatically in the background when sufficient data is available.
            No manual intervention required.
          </p>
        </div>
      </div>
    </div>
  );
};

export default MLAdminDashboard;

