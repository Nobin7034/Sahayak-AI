import React from 'react';
import { 
  Calendar, 
  Clock, 
  Users, 
  CheckCircle, 
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Minus
} from 'lucide-react';
import { useStaffTheme } from '../contexts/StaffThemeContext';

/**
 * StaffMetricsCard Component
 * Displays individual metric cards with proper loading states and error handling
 */
const StaffMetricsCard = ({ 
  title, 
  value, 
  icon: Icon, 
  color = 'blue', 
  loading = false, 
  error = null,
  trend = null,
  subtitle = null,
  onClick = null
}) => {
  const { theme } = useStaffTheme();

  // Theme-based classes
  const themeClasses = {
    light: {
      card: 'bg-white/80 backdrop-blur-sm border-gray-200',
      cardHover: 'hover:border-gray-300 hover:bg-white/90',
      cardError: 'border-red-200',
      text: {
        primary: 'text-gray-900',
        secondary: 'text-gray-600',
        tertiary: 'text-gray-500',
        error: 'text-red-600'
      },
      skeleton: 'bg-gray-200'
    },
    dark: {
      card: 'bg-slate-800/50 backdrop-blur-sm border-slate-700',
      cardHover: 'hover:border-slate-600 hover:bg-slate-800/70',
      cardError: 'border-red-500/30',
      text: {
        primary: 'text-white',
        secondary: 'text-slate-300',
        tertiary: 'text-slate-400',
        error: 'text-red-400'
      },
      skeleton: 'bg-slate-600'
    }
  };

  const currentTheme = themeClasses[theme];
  const colorClasses = {
    blue: {
      bg: 'bg-blue-500/20',
      icon: 'text-blue-400',
      trend: 'text-blue-400'
    },
    yellow: {
      bg: 'bg-yellow-500/20',
      icon: 'text-yellow-400',
      trend: 'text-yellow-400'
    },
    purple: {
      bg: 'bg-purple-500/20',
      icon: 'text-purple-400',
      trend: 'text-purple-400'
    },
    green: {
      bg: 'bg-green-500/20',
      icon: 'text-green-400',
      trend: 'text-green-400'
    },
    red: {
      bg: 'bg-red-500/20',
      icon: 'text-red-400',
      trend: 'text-red-400'
    }
  };

  const colors = colorClasses[color] || colorClasses.blue;

  const getTrendIcon = () => {
    if (!trend) return null;
    
    if (trend > 0) return <TrendingUp className="h-3 w-3" />;
    if (trend < 0) return <TrendingDown className="h-3 w-3" />;
    return <Minus className="h-3 w-3" />;
  };

  const getTrendColor = () => {
    if (!trend) return '';
    
    if (trend > 0) return 'text-green-400';
    if (trend < 0) return 'text-red-400';
    return `${currentTheme.text.tertiary}`;
  };

  if (loading) {
    return (
      <div className={`${currentTheme.card} rounded-2xl p-6 border`}>
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className={`h-4 ${currentTheme.skeleton} rounded animate-pulse mb-2`}></div>
            <div className={`h-8 ${currentTheme.skeleton} rounded animate-pulse w-16`}></div>
            {subtitle && <div className={`h-3 ${currentTheme.skeleton} rounded animate-pulse mt-1 w-24`}></div>}
          </div>
          <div className={`h-12 w-12 ${colors.bg} rounded-xl flex items-center justify-center`}>
            <div className={`h-6 w-6 ${currentTheme.skeleton} rounded animate-pulse`}></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${currentTheme.card} ${currentTheme.cardError} rounded-2xl p-6 border`}>
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className={`${currentTheme.text.secondary} text-sm`}>{title}</p>
            <p className={`${currentTheme.text.error} text-sm mt-1`}>Error loading data</p>
          </div>
          <div className="h-12 w-12 bg-red-500/20 rounded-xl flex items-center justify-center">
            <AlertCircle className="h-6 w-6 text-red-400" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`${currentTheme.card} rounded-2xl p-6 border transition-all duration-200 ${
        onClick ? `cursor-pointer ${currentTheme.cardHover}` : ''
      }`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className={`${currentTheme.text.secondary} text-sm`}>{title}</p>
          <div className="flex items-baseline space-x-2">
            <p className={`text-2xl font-bold ${currentTheme.text.primary}`}>{value}</p>
            {trend !== null && (
              <div className={`flex items-center space-x-1 ${getTrendColor()}`}>
                {getTrendIcon()}
                <span className="text-xs font-medium">
                  {Math.abs(trend)}%
                </span>
              </div>
            )}
          </div>
          {subtitle && (
            <p className={`${currentTheme.text.tertiary} text-xs mt-1`}>{subtitle}</p>
          )}
        </div>
        <div className={`h-12 w-12 ${colors.bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
          <Icon className={`h-6 w-6 ${colors.icon}`} />
        </div>
      </div>
    </div>
  );
};

/**
 * StaffMetricsGrid Component
 * Displays a grid of metrics with responsive layout
 */
const StaffMetricsGrid = ({ metrics, loading = false, error = null, onMetricClick = null }) => {
  const metricsConfig = [
    {
      key: 'totalToday',
      title: "Today's Appointments",
      icon: Calendar,
      color: 'blue',
      subtitle: 'Total scheduled'
    },
    {
      key: 'pendingApprovals',
      title: 'Pending Approvals',
      icon: Clock,
      color: 'yellow',
      subtitle: 'Awaiting confirmation'
    },
    {
      key: 'inProgress',
      title: 'In Progress',
      icon: Users,
      color: 'purple',
      subtitle: 'Currently serving'
    },
    {
      key: 'completedToday',
      title: 'Completed Today',
      icon: CheckCircle,
      color: 'green',
      subtitle: 'Successfully finished'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {metricsConfig.map((config) => (
        <StaffMetricsCard
          key={config.key}
          title={config.title}
          value={loading ? 0 : (metrics?.[config.key] || 0)}
          icon={config.icon}
          color={config.color}
          loading={loading}
          error={error}
          subtitle={config.subtitle}
          onClick={onMetricClick ? () => onMetricClick(config.key, config.title) : null}
        />
      ))}
    </div>
  );
};

/**
 * StaffMetricsSummary Component
 * Displays summary metrics with trends and comparisons
 */
const StaffMetricsSummary = ({ 
  metrics, 
  previousMetrics = null, 
  loading = false, 
  error = null 
}) => {
  const calculateTrend = (current, previous) => {
    if (!previous || previous === 0) return null;
    return Math.round(((current - previous) / previous) * 100);
  };

  const totalAppointments = metrics?.totalToday || 0;
  const completionRate = totalAppointments > 0 
    ? Math.round((metrics?.completedToday / totalAppointments) * 100) 
    : 0;

  const previousTotal = previousMetrics?.totalToday || 0;
  const appointmentTrend = calculateTrend(totalAppointments, previousTotal);

  const previousCompleted = previousMetrics?.completedToday || 0;
  const completionTrend = calculateTrend(metrics?.completedToday || 0, previousCompleted);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
      <StaffMetricsCard
        title="Total Appointments"
        value={totalAppointments}
        icon={Calendar}
        color="blue"
        loading={loading}
        error={error}
        trend={appointmentTrend}
        subtitle="vs yesterday"
      />
      
      <StaffMetricsCard
        title="Completion Rate"
        value={`${completionRate}%`}
        icon={CheckCircle}
        color="green"
        loading={loading}
        error={error}
        trend={completionTrend}
        subtitle="of total appointments"
      />
      
      <StaffMetricsCard
        title="Efficiency Score"
        value={metrics?.efficiencyScore || 'N/A'}
        icon={TrendingUp}
        color="purple"
        loading={loading}
        error={error}
        subtitle="based on processing time"
      />
    </div>
  );
};

export default StaffMetricsCard;
export { StaffMetricsGrid, StaffMetricsSummary };