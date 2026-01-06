import React from 'react';

/**
 * SkeletonBox Component
 * Basic skeleton loading box with customizable dimensions
 */
const SkeletonBox = ({ 
  width = 'w-full', 
  height = 'h-4', 
  className = '', 
  rounded = 'rounded' 
}) => {
  return (
    <div 
      className={`bg-slate-600 animate-pulse ${width} ${height} ${rounded} ${className}`}
    />
  );
};

/**
 * SkeletonText Component
 * Text skeleton with multiple lines
 */
const SkeletonText = ({ 
  lines = 3, 
  className = '',
  lastLineWidth = 'w-3/4' 
}) => {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, index) => (
        <SkeletonBox
          key={index}
          width={index === lines - 1 ? lastLineWidth : 'w-full'}
          height="h-3"
        />
      ))}
    </div>
  );
};

/**
 * SkeletonCard Component
 * Card-style skeleton with header and content
 */
const SkeletonCard = ({ 
  showHeader = true, 
  showContent = true,
  className = '' 
}) => {
  return (
    <div className={`bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700 ${className}`}>
      {showHeader && (
        <div className="flex items-center justify-between mb-4">
          <SkeletonBox width="w-32" height="h-5" />
          <SkeletonBox width="w-5" height="h-5" rounded="rounded-full" />
        </div>
      )}
      
      {showContent && (
        <div className="space-y-3">
          <SkeletonBox width="w-full" height="h-8" />
          <SkeletonText lines={2} />
        </div>
      )}
    </div>
  );
};

/**
 * SkeletonMetricsCard Component
 * Skeleton for metrics display cards
 */
const SkeletonMetricsCard = ({ className = '' }) => {
  return (
    <div className={`bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <SkeletonBox width="w-24" height="h-3" className="mb-2" />
          <SkeletonBox width="w-16" height="h-8" />
        </div>
        <div className="h-12 w-12 bg-slate-600 rounded-xl animate-pulse flex items-center justify-center">
          <SkeletonBox width="w-6" height="h-6" />
        </div>
      </div>
    </div>
  );
};

/**
 * SkeletonAppointmentCard Component
 * Skeleton for appointment list items
 */
const SkeletonAppointmentCard = ({ className = '' }) => {
  return (
    <div className={`bg-slate-700/30 rounded-xl p-4 border border-slate-600 ${className}`}>
      <div className="flex items-center space-x-3">
        <SkeletonBox width="w-10" height="h-10" rounded="rounded-full" />
        <div className="flex-1 space-y-2">
          <SkeletonBox width="w-32" height="h-4" />
          <SkeletonBox width="w-48" height="h-3" />
          <div className="flex items-center space-x-4">
            <SkeletonBox width="w-20" height="h-3" />
            <SkeletonBox width="w-16" height="h-3" />
            <SkeletonBox width="w-12" height="h-5" rounded="rounded-full" />
          </div>
        </div>
        <div className="flex space-x-2">
          <SkeletonBox width="w-8" height="w-8" rounded="rounded-md" />
          <SkeletonBox width="w-8" height="w-8" rounded="rounded-md" />
        </div>
      </div>
    </div>
  );
};

/**
 * SkeletonNotification Component
 * Skeleton for notification items
 */
const SkeletonNotification = ({ className = '' }) => {
  return (
    <div className={`p-4 border-l-4 border-slate-600 ${className}`}>
      <div className="flex items-start space-x-3">
        <SkeletonBox width="w-4" height="h-4" rounded="rounded-full" className="mt-1" />
        <div className="flex-1 space-y-2">
          <SkeletonBox width="w-48" height="h-4" />
          <SkeletonText lines={2} lastLineWidth="w-2/3" />
          <SkeletonBox width="w-20" height="h-3" />
        </div>
        <div className="flex space-x-1">
          <SkeletonBox width="w-4" height="h-4" />
          <SkeletonBox width="w-4" height="h-4" />
        </div>
      </div>
    </div>
  );
};

/**
 * SkeletonTable Component
 * Skeleton for table layouts
 */
const SkeletonTable = ({ 
  rows = 5, 
  columns = 4, 
  className = '' 
}) => {
  return (
    <div className={`space-y-3 ${className}`}>
      {/* Header */}
      <div className="grid grid-cols-4 gap-4 p-4 border-b border-slate-700">
        {Array.from({ length: columns }).map((_, index) => (
          <SkeletonBox key={index} width="w-20" height="h-4" />
        ))}
      </div>
      
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="grid grid-cols-4 gap-4 p-4">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <SkeletonBox 
              key={colIndex} 
              width={colIndex === 0 ? 'w-24' : 'w-16'} 
              height="h-3" 
            />
          ))}
        </div>
      ))}
    </div>
  );
};

/**
 * SkeletonDashboard Component
 * Complete dashboard skeleton layout
 */
const SkeletonDashboard = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header Skeleton */}
      <div className="bg-slate-800/50 backdrop-blur-sm border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <SkeletonBox width="w-12" height="h-12" rounded="rounded-xl" />
              <div className="space-y-2">
                <SkeletonBox width="w-48" height="h-6" />
                <SkeletonBox width="w-32" height="h-4" />
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <SkeletonBox width="w-8" height="h-8" rounded="rounded-full" />
              <SkeletonBox width="w-24" height="h-4" />
              <SkeletonBox width="w-8" height="h-8" rounded="rounded-full" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Skeleton */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Top Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>

        {/* Metrics Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <SkeletonMetricsCard />
          <SkeletonMetricsCard />
          <SkeletonMetricsCard />
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <SkeletonMetricsCard />
          <SkeletonMetricsCard />
          <SkeletonMetricsCard />
          <SkeletonMetricsCard />
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Appointments Skeleton */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700">
            <div className="flex items-center justify-between mb-6">
              <SkeletonBox width="w-32" height="h-5" />
              <SkeletonBox width="w-4" height="h-4" />
            </div>
            <div className="space-y-4">
              <SkeletonAppointmentCard />
              <SkeletonAppointmentCard />
              <SkeletonAppointmentCard />
            </div>
          </div>

          {/* Activity Skeleton */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700">
            <SkeletonBox width="w-28" height="h-5" className="mb-4" />
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <SkeletonBox width="w-8" height="h-8" rounded="rounded-full" />
                  <div className="flex-1 space-y-1">
                    <SkeletonBox width="w-full" height="h-3" />
                    <SkeletonBox width="w-20" height="h-2" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * SkeletonList Component
 * Generic list skeleton
 */
const SkeletonList = ({ 
  items = 5, 
  itemHeight = 'h-16',
  showAvatar = true,
  className = '' 
}) => {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: items }).map((_, index) => (
        <div key={index} className={`flex items-center space-x-3 p-3 ${itemHeight}`}>
          {showAvatar && (
            <SkeletonBox width="w-10" height="h-10" rounded="rounded-full" />
          )}
          <div className="flex-1 space-y-2">
            <SkeletonBox width="w-3/4" height="h-4" />
            <SkeletonBox width="w-1/2" height="h-3" />
          </div>
          <SkeletonBox width="w-16" height="h-6" rounded="rounded-md" />
        </div>
      ))}
    </div>
  );
};

/**
 * PulseLoader Component
 * Simple pulsing dot loader
 */
const PulseLoader = ({ 
  size = 'medium', 
  color = 'blue',
  className = '' 
}) => {
  const sizeClasses = {
    small: 'h-2 w-2',
    medium: 'h-3 w-3',
    large: 'h-4 w-4'
  };

  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    red: 'bg-red-500',
    yellow: 'bg-yellow-500',
    purple: 'bg-purple-500'
  };

  return (
    <div className={`flex space-x-1 ${className}`}>
      {[0, 1, 2].map((index) => (
        <div
          key={index}
          className={`${sizeClasses[size]} ${colorClasses[color]} rounded-full animate-pulse`}
          style={{
            animationDelay: `${index * 0.2}s`,
            animationDuration: '1s'
          }}
        />
      ))}
    </div>
  );
};

/**
 * SpinnerLoader Component
 * Spinning circle loader
 */
const SpinnerLoader = ({ 
  size = 'medium', 
  color = 'blue',
  className = '' 
}) => {
  const sizeClasses = {
    small: 'h-4 w-4',
    medium: 'h-6 w-6',
    large: 'h-8 w-8'
  };

  const colorClasses = {
    blue: 'border-blue-500',
    green: 'border-green-500',
    red: 'border-red-500',
    yellow: 'border-yellow-500',
    purple: 'border-purple-500'
  };

  return (
    <div 
      className={`${sizeClasses[size]} border-2 ${colorClasses[color]} border-t-transparent rounded-full animate-spin ${className}`}
    />
  );
};

export default SkeletonBox;
export {
  SkeletonText,
  SkeletonCard,
  SkeletonMetricsCard,
  SkeletonAppointmentCard,
  SkeletonNotification,
  SkeletonTable,
  SkeletonDashboard,
  SkeletonList,
  PulseLoader,
  SpinnerLoader
};