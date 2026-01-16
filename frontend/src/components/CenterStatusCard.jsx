import React, { useState, useEffect } from 'react';
import { 
  MapPin, 
  Clock, 
  Phone, 
  Mail, 
  Building, 
  Users, 
  Star,
  CheckCircle,
  AlertCircle,
  XCircle,
  RefreshCw,
  Calendar,
  Activity
} from 'lucide-react';
import { useStaffTheme } from '../contexts/StaffThemeContext';

/**
 * WorkingStatusIndicator Component
 * Shows current working status with appropriate colors
 */
const WorkingStatusIndicator = ({ isWorking, workingHours }) => {
  const { theme } = useStaffTheme();
  
  const themeClasses = {
    light: {
      text: {
        primary: 'text-gray-900',
        secondary: 'text-gray-600'
      }
    },
    dark: {
      text: {
        primary: 'text-white',
        secondary: 'text-slate-400'
      }
    }
  };

  const currentTheme = themeClasses[theme];

  const getCurrentTime = () => {
    return new Date().toLocaleTimeString('en-IN', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const [currentTime, setCurrentTime] = useState(getCurrentTime());

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(getCurrentTime());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-2">
        <div className={`h-3 w-3 rounded-full ${
          isWorking ? 'bg-green-400 animate-pulse' : 'bg-red-400'
        }`}></div>
        <span className={`text-sm font-medium ${
          isWorking ? 'text-green-400' : 'text-red-400'
        }`}>
          {isWorking ? 'Active' : 'Closed'}
        </span>
      </div>
      <div className="text-right">
        <p className={`text-sm font-medium ${currentTheme.text.primary}`}>{currentTime}</p>
        <p className={`text-xs ${currentTheme.text.secondary}`}>{workingHours}</p>
      </div>
    </div>
  );
};

/**
 * CenterInfoSection Component
 * Displays center contact and location information
 */
const CenterInfoSection = ({ centerInfo }) => {
  const { theme } = useStaffTheme();
  
  const themeClasses = {
    light: {
      text: {
        primary: 'text-gray-900',
        secondary: 'text-gray-600',
        tertiary: 'text-gray-500'
      },
      icon: 'text-gray-500'
    },
    dark: {
      text: {
        primary: 'text-white',
        secondary: 'text-slate-300',
        tertiary: 'text-slate-500'
      },
      icon: 'text-slate-400'
    }
  };

  const currentTheme = themeClasses[theme];

  return (
    <div className="space-y-3">
      <div className="flex items-center space-x-3">
        <MapPin className={`h-4 w-4 ${currentTheme.icon} flex-shrink-0`} />
        <div className="flex-1 min-w-0">
          <p className={`${currentTheme.text.secondary} text-sm truncate`}>{centerInfo?.address}</p>
          <p className={`${currentTheme.text.tertiary} text-xs`}>{centerInfo?.district}, {centerInfo?.state}</p>
        </div>
      </div>
      
      {centerInfo?.contact && (
        <div className="flex items-center space-x-3">
          <Phone className={`h-4 w-4 ${currentTheme.icon} flex-shrink-0`} />
          <span className={`${currentTheme.text.secondary} text-sm`}>{centerInfo.contact}</span>
        </div>
      )}
      
      {centerInfo?.email && (
        <div className="flex items-center space-x-3">
          <Mail className={`h-4 w-4 ${currentTheme.icon} flex-shrink-0`} />
          <span className={`${currentTheme.text.secondary} text-sm`}>{centerInfo.email}</span>
        </div>
      )}
      
      {centerInfo?.rating && (
        <div className="flex items-center space-x-3">
          <Star className={`h-4 w-4 ${currentTheme.icon} flex-shrink-0`} />
          <div className="flex items-center space-x-2">
            <span className={`${currentTheme.text.secondary} text-sm`}>{centerInfo.rating}</span>
            <div className="flex space-x-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`h-3 w-3 ${
                    star <= Math.floor(centerInfo.rating)
                      ? 'text-yellow-400 fill-current'
                      : theme === 'light' ? 'text-gray-300' : 'text-slate-600'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * StaffShiftInfo Component
 * Shows current staff shift information
 */
const StaffShiftInfo = ({ staffInfo, shiftData }) => {
  const { theme } = useStaffTheme();
  
  const themeClasses = {
    light: {
      container: 'bg-gray-100 border-gray-300',
      text: {
        primary: 'text-gray-900',
        secondary: 'text-gray-600',
        tertiary: 'text-gray-500'
      },
      border: 'border-gray-300'
    },
    dark: {
      container: 'bg-slate-700/30 border-slate-600',
      text: {
        primary: 'text-white',
        secondary: 'text-slate-300',
        tertiary: 'text-slate-400'
      },
      border: 'border-slate-600'
    }
  };

  const currentTheme = themeClasses[theme];

  const getShiftStatus = () => {
    if (!shiftData) return { status: 'unknown', message: 'Shift data unavailable' };
    
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    if (shiftData.startTime && shiftData.endTime) {
      const startMinutes = parseTimeToMinutes(shiftData.startTime);
      const endMinutes = parseTimeToMinutes(shiftData.endTime);
      
      if (currentTime >= startMinutes && currentTime <= endMinutes) {
        return { 
          status: 'active', 
          message: `On duty until ${shiftData.endTime}`,
          timeRemaining: endMinutes - currentTime
        };
      } else if (currentTime < startMinutes) {
        return { 
          status: 'upcoming', 
          message: `Shift starts at ${shiftData.startTime}`,
          timeUntil: startMinutes - currentTime
        };
      } else {
        return { 
          status: 'ended', 
          message: `Shift ended at ${shiftData.endTime}`
        };
      }
    }
    
    return { status: 'unknown', message: 'No shift scheduled' };
  };

  const parseTimeToMinutes = (timeStr) => {
    const [time, period] = timeStr.split(' ');
    const [hours, minutes] = time.split(':').map(Number);
    let totalMinutes = hours * 60 + minutes;
    
    if (period === 'PM' && hours !== 12) {
      totalMinutes += 12 * 60;
    } else if (period === 'AM' && hours === 12) {
      totalMinutes -= 12 * 60;
    }
    
    return totalMinutes;
  };

  const formatMinutesToTime = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const shiftStatus = getShiftStatus();

  return (
    <div className={`${currentTheme.container} rounded-lg p-3 border`}>
      <div className="flex items-center justify-between mb-2">
        <h4 className={`${currentTheme.text.primary} font-medium text-sm`}>Your Shift</h4>
        <div className={`h-2 w-2 rounded-full ${
          shiftStatus.status === 'active' ? 'bg-green-400' :
          shiftStatus.status === 'upcoming' ? 'bg-yellow-400' :
          shiftStatus.status === 'ended' ? 'bg-red-400' :
          theme === 'light' ? 'bg-gray-400' : 'bg-slate-400'
        }`}></div>
      </div>
      
      <p className={`${currentTheme.text.secondary} text-xs mb-1`}>{shiftStatus.message}</p>
      
      {shiftStatus.timeRemaining && (
        <p className={`${currentTheme.text.tertiary} text-xs`}>
          {formatMinutesToTime(shiftStatus.timeRemaining)} remaining
        </p>
      )}
      
      {shiftStatus.timeUntil && (
        <p className={`${currentTheme.text.tertiary} text-xs`}>
          Starts in {formatMinutesToTime(shiftStatus.timeUntil)}
        </p>
      )}
      
      {shiftData?.breakTime && (
        <div className={`mt-2 pt-2 border-t ${currentTheme.border}`}>
          <p className={`${currentTheme.text.tertiary} text-xs`}>
            Break: {shiftData.breakTime.start} - {shiftData.breakTime.end}
          </p>
        </div>
      )}
    </div>
  );
};

/**
 * CenterMetrics Component
 * Shows center performance metrics
 */
const CenterMetrics = ({ metrics, loading = false }) => {
  const { theme } = useStaffTheme();
  
  const themeClasses = {
    light: {
      text: {
        primary: 'text-gray-900',
        secondary: 'text-gray-600'
      },
      skeleton: 'bg-gray-200'
    },
    dark: {
      text: {
        primary: 'text-white',
        secondary: 'text-slate-400'
      },
      skeleton: 'bg-slate-600'
    }
  };

  const currentTheme = themeClasses[theme];

  const metricsData = [
    {
      label: 'Today\'s Visitors',
      value: metrics?.todayVisitors || 0,
      icon: Users,
      color: 'text-blue-400'
    },
    {
      label: 'Services Active',
      value: metrics?.activeServices || 0,
      icon: Activity,
      color: 'text-green-400'
    },
    {
      label: 'Avg. Rating',
      value: metrics?.avgRating ? `${metrics.avgRating.toFixed(1)}/5` : 'N/A',
      icon: Star,
      color: 'text-yellow-400',
      subtitle: metrics?.totalRatings ? `${metrics.totalRatings} ratings` : ''
    }
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-3 gap-3">
        {metricsData.map((_, index) => (
          <div key={index} className="text-center">
            <div className={`h-4 ${currentTheme.skeleton} rounded animate-pulse mb-1`}></div>
            <div className={`h-3 ${currentTheme.skeleton} rounded animate-pulse w-8 mx-auto`}></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-3">
      {metricsData.map((metric, index) => {
        const Icon = metric.icon;
        return (
          <div key={index} className="text-center">
            <div className="flex items-center justify-center mb-1">
              <Icon className={`h-4 w-4 ${metric.color}`} />
            </div>
            <p className={`${currentTheme.text.primary} text-sm font-medium`}>{metric.value}</p>
            <p className={`${currentTheme.text.secondary} text-xs`}>{metric.label}</p>
            {metric.subtitle && (
              <p className={`${currentTheme.text.secondary} text-xs opacity-70`}>{metric.subtitle}</p>
            )}
          </div>
        );
      })}
    </div>
  );
};

/**
 * CenterStatusCard Component
 * Main component displaying center status and information
 */
const CenterStatusCard = ({ 
  centerInfo = null,
  staffInfo = null,
  loading = false,
  error = null,
  onRefresh = null,
  showShiftInfo = true,
  showMetrics = true
}) => {
  const { theme } = useStaffTheme();
  
  // Theme-based classes
  const themeClasses = {
    light: {
      card: 'bg-white/80 backdrop-blur-sm border-gray-200',
      text: {
        primary: 'text-gray-900',
        secondary: 'text-gray-600',
        tertiary: 'text-gray-500'
      },
      skeleton: 'bg-gray-200'
    },
    dark: {
      card: 'bg-slate-800/50 backdrop-blur-sm border-slate-700',
      text: {
        primary: 'text-white',
        secondary: 'text-slate-300',
        tertiary: 'text-slate-400'
      },
      skeleton: 'bg-slate-600'
    }
  };

  const currentTheme = themeClasses[theme];
  const [realTimeData, setRealTimeData] = useState({
    isWorking: true,
    workingHours: '9:00 AM - 5:00 PM',
    currentVisitors: 12,
    todayVisitors: 45
  });

  // Mock shift data - in real app this would come from props or API
  const shiftData = {
    startTime: '9:00 AM',
    endTime: '5:00 PM',
    breakTime: {
      start: '1:00 PM',
      end: '2:00 PM'
    }
  };

  useEffect(() => {
    // Update real-time data periodically
    const interval = setInterval(() => {
      const now = new Date();
      const currentHour = now.getHours();
      
      // Simple logic to determine if center is working
      const isWorking = currentHour >= 9 && currentHour < 17;
      
      setRealTimeData(prev => ({
        ...prev,
        isWorking
      }));
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className={`${currentTheme.card} rounded-2xl p-6 border`}>
        <div className="flex items-center justify-between mb-4">
          <div className={`h-5 ${currentTheme.skeleton} rounded animate-pulse w-32`}></div>
          <div className={`h-4 w-4 ${currentTheme.skeleton} rounded animate-pulse`}></div>
        </div>
        <div className="space-y-3">
          <div className={`h-4 ${currentTheme.skeleton} rounded animate-pulse`}></div>
          <div className={`h-4 ${currentTheme.skeleton} rounded animate-pulse w-3/4`}></div>
          <div className={`h-4 ${currentTheme.skeleton} rounded animate-pulse w-1/2`}></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${currentTheme.card} rounded-2xl p-6 border border-red-500/30`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className={`text-lg font-semibold ${currentTheme.text.primary}`}>Center Status</h3>
          <AlertCircle className="h-5 w-5 text-red-400" />
        </div>
        <div className="text-center py-4">
          <p className="text-red-400 text-sm mb-2">{error}</p>
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="text-blue-400 hover:text-blue-300 text-sm transition-colors"
            >
              Try Again
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`${currentTheme.card} rounded-2xl p-6 border`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className={`text-lg font-semibold ${currentTheme.text.primary}`}>Center Status</h3>
        <div className="flex items-center space-x-2">
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="p-1 text-slate-400 hover:text-white transition-colors"
              title="Refresh"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          )}
          <Building className="h-5 w-5 text-slate-400" />
        </div>
      </div>

      {/* Working Status */}
      <WorkingStatusIndicator 
        isWorking={centerInfo?.isWorking !== undefined ? centerInfo.isWorking : realTimeData.isWorking}
        workingHours={centerInfo?.todayHours || realTimeData.workingHours}
      />

      <div className="mt-4 space-y-4">
        {/* Center Information */}
        <div>
          <h4 className={`${currentTheme.text.primary} font-medium mb-2 text-sm`}>Center Information</h4>
          <CenterInfoSection centerInfo={centerInfo} />
        </div>

        {/* Center Metrics */}
        {showMetrics && (
          <div>
            <h4 className={`${currentTheme.text.primary} font-medium mb-2 text-sm`}>Today's Overview</h4>
            <CenterMetrics 
              metrics={{
                todayVisitors: centerInfo?.todayVisitors || 0,
                activeServices: centerInfo?.activeServices || 0,
                avgRating: centerInfo?.rating || 0,
                totalRatings: centerInfo?.totalRatings || 0
              }}
              loading={loading}
            />
          </div>
        )}

        {/* Staff Shift Information */}
        {showShiftInfo && staffInfo && (
          <div>
            <h4 className={`${currentTheme.text.primary} font-medium mb-2 text-sm`}>Shift Information</h4>
            <StaffShiftInfo 
              staffInfo={staffInfo}
              shiftData={shiftData}
            />
          </div>
        )}
      </div>

      {/* Last Updated */}
      <div className={`mt-4 pt-3 border-t ${theme === 'light' ? 'border-gray-200' : 'border-slate-700'}`}>
        <p className={`${currentTheme.text.tertiary} text-xs text-center`}>
          Last updated: {new Date().toLocaleTimeString()}
        </p>
      </div>
    </div>
  );
};

export default CenterStatusCard;
export { WorkingStatusIndicator, CenterInfoSection, StaffShiftInfo, CenterMetrics };