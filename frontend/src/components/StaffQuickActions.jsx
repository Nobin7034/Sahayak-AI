import React, { useState } from 'react';
import { 
  Plus, 
  Calendar, 
  Users, 
  Settings, 
  BarChart3,
  Upload,
  Search,
  CheckCircle,
  AlertCircle,
  Clock,
  RefreshCw,
  Printer
} from 'lucide-react';
import { useStaffTheme } from '../contexts/StaffThemeContext';

/**
 * ActionButton Component
 * Individual action button with permission checking and feedback
 */
const ActionButton = ({ 
  icon: Icon, 
  label, 
  onClick, 
  disabled = false, 
  loading = false,
  permission = null,
  userPermissions = [],
  variant = 'primary',
  size = 'normal',
  tooltip = null
}) => {
  const { theme } = useStaffTheme();
  const [feedback, setFeedback] = useState(null);

  // Check if user has required permission
  const hasPermission = !permission || userPermissions.includes(permission);
  const isDisabled = disabled || loading || !hasPermission;

  const handleClick = async () => {
    if (isDisabled) {
      if (!hasPermission) {
        setFeedback({ type: 'error', message: 'Insufficient permissions' });
        setTimeout(() => setFeedback(null), 3000);
      }
      return;
    }

    try {
      setFeedback({ type: 'loading', message: 'Processing...' });
      await onClick();
      setFeedback({ type: 'success', message: 'Action completed' });
      setTimeout(() => setFeedback(null), 2000);
    } catch (error) {
      setFeedback({ type: 'error', message: error.message || 'Action failed' });
      setTimeout(() => setFeedback(null), 3000);
    }
  };

  const getVariantClasses = () => {
    const baseClasses = `transition-all duration-200 rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 ${theme === 'light' ? 'focus:ring-offset-white' : 'focus:ring-offset-slate-800'}`;
    
    if (isDisabled) {
      return `${baseClasses} ${theme === 'light' ? 'bg-gray-200 text-gray-400' : 'bg-slate-700 text-slate-500'} cursor-not-allowed`;
    }

    const lightVariants = {
      primary: `${baseClasses} bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500`,
      secondary: `${baseClasses} bg-gray-200 hover:bg-gray-300 text-gray-700 focus:ring-gray-500`,
      success: `${baseClasses} bg-green-600 hover:bg-green-700 text-white focus:ring-green-500`,
      warning: `${baseClasses} bg-yellow-600 hover:bg-yellow-700 text-white focus:ring-yellow-500`,
      danger: `${baseClasses} bg-red-600 hover:bg-red-700 text-white focus:ring-red-500`
    };

    const darkVariants = {
      primary: `${baseClasses} bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500`,
      secondary: `${baseClasses} bg-slate-600 hover:bg-slate-700 text-white focus:ring-slate-500`,
      success: `${baseClasses} bg-green-600 hover:bg-green-700 text-white focus:ring-green-500`,
      warning: `${baseClasses} bg-yellow-600 hover:bg-yellow-700 text-white focus:ring-yellow-500`,
      danger: `${baseClasses} bg-red-600 hover:bg-red-700 text-white focus:ring-red-500`
    };

    const variants = theme === 'light' ? lightVariants : darkVariants;
    return variants[variant] || variants.primary;
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'small':
        return 'p-2 text-xs';
      case 'large':
        return 'p-4 text-base';
      default:
        return 'p-3 text-sm';
    }
  };

  return (
    <div className="relative">
      <button
        onClick={handleClick}
        disabled={isDisabled}
        className={`${getVariantClasses()} ${getSizeClasses()} flex flex-col items-center justify-center space-y-1 w-full`}
        title={tooltip || (!hasPermission ? 'Insufficient permissions' : label)}
      >
        {loading ? (
          <RefreshCw className="h-4 w-4 animate-spin" />
        ) : (
          <Icon className="h-4 w-4" />
        )}
        <span className="text-xs">{label}</span>
      </button>

      {/* Feedback Toast */}
      {feedback && (
        <div className={`absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-3 py-1 rounded-md text-xs z-10 ${
          feedback.type === 'success' ? 'bg-green-600 text-white' :
          feedback.type === 'error' ? 'bg-red-600 text-white' :
          'bg-blue-600 text-white'
        }`}>
          {feedback.message}
        </div>
      )}
    </div>
  );
};

/**
 * QuickActionsGrid Component
 * Grid layout for quick action buttons
 */
const QuickActionsGrid = ({ 
  actions, 
  userPermissions = [], 
  loading = false,
  columns = 2 
}) => {
  return (
    <div className={`grid grid-cols-${columns} gap-3`}>
      {actions.map((action, index) => (
        <ActionButton
          key={action.id || index}
          icon={action.icon}
          label={action.label}
          onClick={action.onClick}
          disabled={action.disabled || loading}
          loading={action.loading}
          permission={action.permission}
          userPermissions={userPermissions}
          variant={action.variant}
          size={action.size}
          tooltip={action.tooltip}
        />
      ))}
    </div>
  );
};

/**
 * StaffQuickActions Component
 * Main component with predefined staff actions
 */
const StaffQuickActions = ({ 
  userPermissions = [],
  onActionClick = null,
  customActions = [],
  showDefaultActions = true,
  columns = 2,
  title = "Quick Actions"
}) => {
  const { theme } = useStaffTheme();
  const [actionStates, setActionStates] = useState({});

  // Theme-based classes
  const themeClasses = {
    light: {
      card: 'bg-white/80 backdrop-blur-sm border-gray-200',
      text: {
        primary: 'text-gray-900',
        secondary: 'text-gray-600',
        tertiary: 'text-gray-500'
      }
    },
    dark: {
      card: 'bg-slate-800/50 backdrop-blur-sm border-slate-700',
      text: {
        primary: 'text-white',
        secondary: 'text-slate-300',
        tertiary: 'text-slate-400'
      }
    }
  };

  const currentTheme = themeClasses[theme];

  const setActionLoading = (actionId, loading) => {
    setActionStates(prev => ({
      ...prev,
      [actionId]: { ...prev[actionId], loading }
    }));
  };

  const handleActionClick = async (actionId, actionFn) => {
    setActionLoading(actionId, true);
    try {
      if (onActionClick) {
        await onActionClick(actionId);
      } else if (actionFn) {
        await actionFn();
      }
    } catch (error) {
      throw error;
    } finally {
      setActionLoading(actionId, false);
    }
  };

  const defaultActions = [
    {
      id: 'view-appointments',
      icon: Calendar,
      label: 'Appointments',
      permission: 'manage_appointments',
      variant: 'primary',
      onClick: () => handleActionClick('view-appointments', () => {
        window.location.href = '/staff/appointments';
      }),
      tooltip: 'View and manage appointments'
    },
    {
      id: 'manage-services',
      icon: CheckCircle,
      label: 'Services',
      permission: 'manage_services',
      variant: 'secondary',
      onClick: () => handleActionClick('manage-services', () => {
        window.location.href = '/staff/services';
      }),
      tooltip: 'Manage center services'
    },
    {
      id: 'view-analytics',
      icon: BarChart3,
      label: 'Analytics',
      permission: 'view_analytics',
      variant: 'secondary',
      onClick: () => handleActionClick('view-analytics', () => {
        window.location.href = '/staff/analytics';
      }),
      tooltip: 'View performance analytics'
    },
    {
      id: 'staff-profile',
      icon: Settings,
      label: 'Settings',
      permission: null, // Always available
      variant: 'secondary',
      onClick: () => handleActionClick('staff-profile', () => {
        window.location.href = '/staff/settings';
      }),
      tooltip: 'Manage your settings'
    }
  ];

  // Combine default and custom actions
  const allActions = [
    ...(showDefaultActions ? defaultActions : []),
    ...customActions
  ].map(action => ({
    ...action,
    loading: actionStates[action.id]?.loading || false
  }));

  // Filter actions based on permissions
  const availableActions = allActions.filter(action => 
    !action.permission || userPermissions.includes(action.permission)
  );

  const unavailableActions = allActions.filter(action => 
    action.permission && !userPermissions.includes(action.permission)
  );

  return (
    <div className={`${currentTheme.card} rounded-2xl p-6 border`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className={`text-lg font-semibold ${currentTheme.text.primary}`}>{title}</h3>
        <div className="flex items-center space-x-2">
          <span className={`text-xs ${currentTheme.text.tertiary}`}>
            {availableActions.length} actions available
          </span>
          {unavailableActions.length > 0 && (
            <span className="text-xs text-red-400" title={`${unavailableActions.length} actions require additional permissions`}>
              <AlertCircle className="h-3 w-3" />
            </span>
          )}
        </div>
      </div>

      {availableActions.length === 0 ? (
        <div className="text-center py-8">
          <AlertCircle className={`h-8 w-8 ${theme === 'light' ? 'text-gray-400' : 'text-slate-600'} mx-auto mb-2`} />
          <p className={`${currentTheme.text.tertiary} text-sm`}>No actions available</p>
          <p className={`${currentTheme.text.tertiary} text-xs`}>Contact your administrator for permissions</p>
        </div>
      ) : (
        <QuickActionsGrid
          actions={availableActions}
          userPermissions={userPermissions}
          columns={columns}
        />
      )}

      {/* Permission Info */}
      {unavailableActions.length > 0 && (
        <div className={`mt-4 pt-3 border-t ${theme === 'light' ? 'border-gray-200' : 'border-slate-700'}`}>
          <details className="group">
            <summary className={`text-xs ${currentTheme.text.tertiary} cursor-pointer hover:${currentTheme.text.secondary} transition-colors`}>
              {unavailableActions.length} restricted actions
            </summary>
            <div className="mt-2 space-y-1">
              {unavailableActions.map((action, index) => (
                <div key={index} className="flex items-center justify-between text-xs">
                  <span className={currentTheme.text.tertiary}>{action.label}</span>
                  <span className="text-red-400">Requires: {action.permission}</span>
                </div>
              ))}
            </div>
          </details>
        </div>
      )}
    </div>
  );
};

/**
 * ActionFeedbackSystem Component
 * Global feedback system for actions
 */
const ActionFeedbackSystem = ({ 
  feedbacks = [], 
  onDismiss = null,
  position = 'top-right' 
}) => {
  const getPositionClasses = () => {
    switch (position) {
      case 'top-left':
        return 'top-4 left-4';
      case 'top-right':
        return 'top-4 right-4';
      case 'bottom-left':
        return 'bottom-4 left-4';
      case 'bottom-right':
        return 'bottom-4 right-4';
      default:
        return 'top-4 right-4';
    }
  };

  if (feedbacks.length === 0) return null;

  return (
    <div className={`fixed ${getPositionClasses()} z-50 space-y-2`}>
      {feedbacks.map((feedback, index) => (
        <div
          key={feedback.id || index}
          className={`flex items-center space-x-3 px-4 py-3 rounded-lg shadow-lg border ${
            feedback.type === 'success' ? 'bg-green-600 border-green-500 text-white' :
            feedback.type === 'error' ? 'bg-red-600 border-red-500 text-white' :
            feedback.type === 'warning' ? 'bg-yellow-600 border-yellow-500 text-white' :
            'bg-blue-600 border-blue-500 text-white'
          }`}
        >
          <div className="flex-shrink-0">
            {feedback.type === 'success' && <CheckCircle className="h-5 w-5" />}
            {feedback.type === 'error' && <AlertCircle className="h-5 w-5" />}
            {feedback.type === 'warning' && <AlertCircle className="h-5 w-5" />}
            {feedback.type === 'info' && <Clock className="h-5 w-5" />}
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium">{feedback.title}</p>
            {feedback.message && (
              <p className="text-xs opacity-90">{feedback.message}</p>
            )}
          </div>
          {onDismiss && (
            <button
              onClick={() => onDismiss(feedback.id)}
              className="flex-shrink-0 text-white/70 hover:text-white transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      ))}
    </div>
  );
};

export default StaffQuickActions;
export { ActionButton, QuickActionsGrid, ActionFeedbackSystem };