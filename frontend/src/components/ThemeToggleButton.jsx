import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useStaffTheme } from '../contexts/StaffThemeContext';

const ThemeToggleButton = ({ className = '', size = 'default' }) => {
  const { theme, toggleTheme, isInitialized } = useStaffTheme();

  const sizeClasses = {
    small: 'h-8 w-8',
    default: 'h-10 w-10',
    large: 'h-12 w-12'
  };

  const iconSizes = {
    small: 'h-4 w-4',
    default: 'h-5 w-5',
    large: 'h-6 w-6'
  };

  const handleClick = () => {
    toggleTheme();
  };

  const handleKeyDown = (event) => {
    // Handle Enter and Space keys for accessibility
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      toggleTheme();
    }
  };

  if (!isInitialized) {
    // Show a placeholder while theme is initializing
    return (
      <div 
        className={`${sizeClasses[size]} rounded-lg bg-gray-200 animate-pulse ${className}`}
        aria-hidden="true"
      />
    );
  }

  return (
    <button
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={`
        ${sizeClasses[size]} 
        rounded-lg 
        flex items-center justify-center 
        transition-all duration-200 ease-in-out
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
        ${theme === 'light' 
          ? 'bg-gray-100 hover:bg-gray-200 text-gray-700 hover:text-gray-900 focus:ring-offset-white' 
          : 'bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white focus:ring-offset-slate-800'
        }
        ${className}
      `}
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      type="button"
    >
      <div className="relative">
        {/* Sun icon for light mode */}
        <Sun 
          className={`
            ${iconSizes[size]} 
            absolute inset-0 
            transition-all duration-300 ease-in-out
            ${theme === 'light' 
              ? 'opacity-100 rotate-0 scale-100' 
              : 'opacity-0 rotate-90 scale-75'
            }
          `}
          aria-hidden="true"
        />
        
        {/* Moon icon for dark mode */}
        <Moon 
          className={`
            ${iconSizes[size]} 
            absolute inset-0 
            transition-all duration-300 ease-in-out
            ${theme === 'dark' 
              ? 'opacity-100 rotate-0 scale-100' 
              : 'opacity-0 -rotate-90 scale-75'
            }
          `}
          aria-hidden="true"
        />
      </div>
      
      {/* Screen reader only text */}
      <span className="sr-only">
        Current theme: {theme} mode. Click to switch to {theme === 'light' ? 'dark' : 'light'} mode.
      </span>
    </button>
  );
};

export default ThemeToggleButton;