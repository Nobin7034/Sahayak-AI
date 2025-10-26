import React, { useState, useEffect } from 'react';
import { 
  Brain, 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Loader2,
  TrendingUp,
  BarChart3,
  Settings
} from 'lucide-react';
import mlService from '../services/mlService.js';

const MLAdminDashboard = () => {
  const [modelStatus, setModelStatus] = useState({});
  const [loading, setLoading] = useState(true);
  const [retraining, setRetraining] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchModelStatus();
  }, []);

  const fetchModelStatus = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await mlService.getModelStatus();
      
      if (response.success) {
        setModelStatus(response.data.models);
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

  const handleRetrainAll = async () => {
    try {
      setRetraining(true);
      setError('');
      setSuccess('');
      
      const response = await mlService.retrainModels();
      
      if (response.success) {
        setSuccess('All models retrained successfully!');
        await fetchModelStatus();
      } else {
        setError('Failed to retrain models');
      }
    } catch (error) {
      console.error('Retrain error:', error);
      setError('Failed to retrain models');
    } finally {
      setRetraining(false);
    }
  };

  const handleTrainModel = async (modelName) => {
    try {
      setRetraining(true);
      setError('');
      setSuccess('');
      
      const response = await mlService.trainModel(modelName);
      
      if (response.success) {
        setSuccess(`${modelName} model trained successfully!`);
        await fetchModelStatus();
      } else {
        setError(`Failed to train ${modelName} model`);
      }
    } catch (error) {
      console.error('Train model error:', error);
      setError(`Failed to train ${modelName} model`);
    } finally {
      setRetraining(false);
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
                Machine Learning Dashboard
              </h2>
              <p className="text-sm text-gray-600">
                Manage and monitor AI models for service recommendations and predictions
              </p>
            </div>
          </div>
          
          <button
            onClick={handleRetrainAll}
            disabled={retraining}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {retraining ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            <span>Retrain All Models</span>
          </button>
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

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <span className="text-green-800">{success}</span>
          </div>
        </div>
      )}

      {/* Model Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {Object.entries(modelStatus).map(([modelName, isTrained]) => {
          const modelInfo = getModelInfo(modelName);
          return (
            <div key={modelName} className="bg-white rounded-lg shadow-md p-6">
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
                  {isTrained ? 'Trained' : 'Not Trained'}
                </span>
                
                <button
                  onClick={() => handleTrainModel(modelName)}
                  disabled={retraining}
                  className={`px-3 py-1 text-xs font-medium rounded-full ${
                    isTrained
                      ? 'bg-green-100 text-green-800 hover:bg-green-200'
                      : 'bg-red-100 text-red-800 hover:bg-red-200'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {retraining ? 'Training...' : isTrained ? 'Retrain' : 'Train'}
                </button>
              </div>
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
            Model Capabilities
          </h3>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-start space-x-3">
            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
            <div>
              <h4 className="font-medium text-gray-900">Service Recommendations</h4>
              <p className="text-sm text-gray-600">
                KNN algorithm analyzes user behavior to suggest relevant services
              </p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
            <div>
              <h4 className="font-medium text-gray-900">Service Categorization</h4>
              <p className="text-sm text-gray-600">
                Bayesian classifier automatically categorizes services based on features
              </p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
            <div>
              <h4 className="font-medium text-gray-900">Schedule Optimization</h4>
              <p className="text-sm text-gray-600">
                Decision tree predicts optimal appointment times for better success rates
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MLAdminDashboard;
