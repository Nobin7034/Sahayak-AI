import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  Clock, 
  Users, 
  CheckCircle,
  XCircle,
  AlertCircle,
  BarChart3,
  PieChart,
  RefreshCw,
  Download,
  Filter
} from 'lucide-react';
import axios from 'axios';

const StaffAnalytics = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [period, setPeriod] = useState('month');
  const [chartType, setChartType] = useState('appointments');

  useEffect(() => {
    loadAnalytics();
  }, [period]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      
      const response = await axios.get(`/api/staff/analytics?period=${period}&type=${chartType}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.data.success) {
        setAnalytics(response.data.data);
        setError('');
      }
    } catch (error) {
      console.error('Load analytics error:', error);
      setError('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('en-IN').format(num);
  };

  const formatPercentage = (num) => {
    return `${num.toFixed(1)}%`;
  };

  const getChangeColor = (change) => {
    if (change > 0) return 'text-green-600';
    if (change < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const getChangeIcon = (change) => {
    if (change > 0) return <TrendingUp className="h-4 w-4" />;
    if (change < 0) return <TrendingDown className="h-4 w-4" />;
    return null;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Analytics</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={loadAnalytics}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Try Again
          </button>
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
                <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
                <p className="text-sm text-gray-600 mt-1">
                  Performance metrics and insights for your center
                </p>
              </div>
              
              <div className="flex items-center space-x-3">
                <select
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm
                           focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                  <option value="quarter">This Quarter</option>
                  <option value="year">This Year</option>
                </select>
                
                <button
                  onClick={loadAnalytics}
                  disabled={loading}
                  className="flex items-center px-3 py-2 text-sm text-gray-600 hover:text-gray-900 
                           disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          
          {/* Total Appointments */}
          <div className="bg-white rounded-lg shadow-sm p-6 border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Appointments</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {analytics?.totalAppointments ? formatNumber(analytics.totalAppointments) : '0'}
                </p>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            {analytics?.appointmentChange !== undefined && (
              <div className={`flex items-center mt-2 text-sm ${getChangeColor(analytics.appointmentChange)}`}>
                {getChangeIcon(analytics.appointmentChange)}
                <span className="ml-1">
                  {analytics.appointmentChange > 0 ? '+' : ''}{analytics.appointmentChange}% from last {period}
                </span>
              </div>
            )}
          </div>

          {/* Completion Rate */}
          <div className="bg-white rounded-lg shadow-sm p-6 border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completion Rate</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {analytics?.completionRate ? formatPercentage(analytics.completionRate) : '0%'}
                </p>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
            {analytics?.completionRateChange !== undefined && (
              <div className={`flex items-center mt-2 text-sm ${getChangeColor(analytics.completionRateChange)}`}>
                {getChangeIcon(analytics.completionRateChange)}
                <span className="ml-1">
                  {analytics.completionRateChange > 0 ? '+' : ''}{analytics.completionRateChange}% from last {period}
                </span>
              </div>
            )}
          </div>

          {/* Average Processing Time */}
          <div className="bg-white rounded-lg shadow-sm p-6 border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg. Processing Time</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {analytics?.averageProcessingTime ? `${analytics.averageProcessingTime}m` : '0m'}
                </p>
              </div>
              <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Clock className="h-6 w-6 text-purple-600" />
              </div>
            </div>
            {analytics?.processingTimeChange !== undefined && (
              <div className={`flex items-center mt-2 text-sm ${getChangeColor(-analytics.processingTimeChange)}`}>
                {getChangeIcon(-analytics.processingTimeChange)}
                <span className="ml-1">
                  {analytics.processingTimeChange > 0 ? '+' : ''}{analytics.processingTimeChange}m from last {period}
                </span>
              </div>
            )}
          </div>

          {/* User Satisfaction */}
          <div className="bg-white rounded-lg shadow-sm p-6 border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">User Satisfaction</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {analytics?.userSatisfaction ? `${analytics.userSatisfaction.toFixed(1)}/5` : '0/5'}
                </p>
              </div>
              <div className="h-12 w-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Users className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
            {analytics?.satisfactionChange !== undefined && (
              <div className={`flex items-center mt-2 text-sm ${getChangeColor(analytics.satisfactionChange)}`}>
                {getChangeIcon(analytics.satisfactionChange)}
                <span className="ml-1">
                  {analytics.satisfactionChange > 0 ? '+' : ''}{analytics.satisfactionChange.toFixed(1)} from last {period}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          
          {/* Appointment Trends */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="px-6 py-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">Appointment Trends</h3>
            </div>
            <div className="p-6">
              {analytics?.appointmentTrends ? (
                <div className="space-y-4">
                  {analytics.appointmentTrends.map((trend, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">{trend.date}</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${(trend.count / Math.max(...analytics.appointmentTrends.map(t => t.count))) * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium text-gray-900">{trend.count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No trend data available</p>
                </div>
              )}
            </div>
          </div>

          {/* Service Distribution */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="px-6 py-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">Popular Services</h3>
            </div>
            <div className="p-6">
              {analytics?.serviceDistribution ? (
                <div className="space-y-4">
                  {analytics.serviceDistribution.map((service, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm text-gray-900 font-medium">{service.name}</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-green-600 h-2 rounded-full" 
                            style={{ width: `${service.percentage}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-600">{service.count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <PieChart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No service data available</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Status Breakdown */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="px-6 py-4 border-b">
            <h3 className="text-lg font-semibold text-gray-900">Appointment Status Breakdown</h3>
          </div>
          <div className="p-6">
            {analytics?.statusBreakdown ? (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {Object.entries(analytics.statusBreakdown).map(([status, count]) => {
                  const getStatusColor = (status) => {
                    switch (status) {
                      case 'pending': return 'bg-yellow-100 text-yellow-800';
                      case 'confirmed': return 'bg-blue-100 text-blue-800';
                      case 'in_progress': return 'bg-purple-100 text-purple-800';
                      case 'completed': return 'bg-green-100 text-green-800';
                      case 'cancelled': return 'bg-red-100 text-red-800';
                      default: return 'bg-gray-100 text-gray-800';
                    }
                  };

                  return (
                    <div key={status} className="text-center">
                      <div className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(status)}`}>
                        {status.replace('_', ' ').toUpperCase()}
                      </div>
                      <p className="text-2xl font-semibold text-gray-900 mt-2">{count}</p>
                      <p className="text-sm text-gray-600">
                        {analytics.totalAppointments > 0 
                          ? `${((count / analytics.totalAppointments) * 100).toFixed(1)}%`
                          : '0%'
                        }
                      </p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No status data available</p>
              </div>
            )}
          </div>
        </div>

        {/* Export Options */}
        <div className="mt-6 text-center">
          <button
            onClick={() => {
              // TODO: Implement export functionality
              alert('Export functionality will be implemented');
            }}
            className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
          >
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </button>
        </div>
      </div>
    </div>
  );
};

export default StaffAnalytics;