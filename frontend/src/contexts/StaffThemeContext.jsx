import React, { createContext, useContext, useState, useEffect } from 'react';

// Theme configuration schema
const themeConfig = {
  light: {
    // Backgrounds
    primary: 'bg-gray-50',
    secondary: 'bg-white',
    tertiary: 'bg-gray-100',
    
    // Text Colors
    textPrimary: 'text-gray-900',
    textSecondary: 'text-gray-600',
    textTertiary: 'text-gray-500',
    
    // Borders
    borderPrimary: 'border-gray-200',
    borderSecondary: 'border-gray-300',
    
    // Interactive States
    hover: 'hover:bg-gray-100',
    focus: 'focus:ring-blue-500',
    active: 'bg-blue-600 text-white'
  },
  dark: {
    // Backgrounds
    primary: 'bg-slate-900',
    secondary: 'bg-slate-800',
    tertiary: 'bg-slate-700',
    
    // Text Colors
    textPrimary: 'text-white',
    textSecondary: 'text-slate-300',
    textTertiary: 'text-slate-400',
    
    // Borders
    borderPrimary: 'border-slate-700',
    borderSecondary: 'border-slate-600',
    
    // Interactive States
    hover: 'hover:bg-slate-700',
    focus: 'focus:ring-blue-500',
    active: 'bg-blue-600 text-white'
  }
};

// Local storage utilities
const STAFF_THEME_KEY = 'staff-theme-preference';

const themeStorage = {
  save: (theme) => {
    try {
      localStorage.setItem(STAFF_THEME_KEY, theme);
    } catch (error) {
      console.warn('Failed to save theme preference:', error);
    }
  },
  load: () => {
    try {
      return localStorage.getItem(STAFF_THEME_KEY) || null;
    } catch (error) {
      console.warn('Failed to load theme preference:', error);
      return null;
    }
  },
  clear: () => {
    try {
      localStorage.removeItem(STAFF_THEME_KEY);
    } catch (error) {
      console.warn('Failed to clear theme preference:', error);
    }
  }
};

// System preference detection
const getSystemPreference = () => {
  try {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  } catch (error) {
    console.warn('Failed to detect system preference:', error);
    return 'light';
  }
};

// Theme class generator
export const getThemeClasses = (theme, component) => {
  const config = themeConfig[theme] || themeConfig.light;
  
  switch (component) {
    case 'layout':
      return {
        background: config.primary,
        sidebar: config.secondary,
        border: config.borderPrimary,
        text: config.textPrimary
      };
    case 'card':
      return {
        background: config.secondary,
        border: config.borderPrimary,
        text: config.textPrimary,
        hover: config.hover
      };
    case 'button':
      return {
        primary: config.active,
        secondary: `${config.tertiary} ${config.textPrimary} ${config.hover}`,
        border: config.borderPrimary
      };
    case 'input':
      return {
        background: config.secondary,
        border: config.borderSecondary,
        text: config.textPrimary,
        focus: config.focus
      };
    default:
      return config;
  }
};

// Context interface
const StaffThemeContext = createContext({
  theme: 'light',
  toggleTheme: () => {},
  setTheme: () => {},
  themeClasses: themeConfig.light
});

// Theme provider component
export const StaffThemeProvider = ({ children, defaultTheme = 'light' }) => {
  const [theme, setThemeState] = useState('light');
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize theme on mount
  useEffect(() => {
    const initializeTheme = () => {
      try {
        // Priority: 1. Saved preference, 2. Default prop, 3. System preference, 4. Light theme
        const savedTheme = themeStorage.load();
        const systemTheme = getSystemPreference();
        
        let initialTheme = 'light';
        
        if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark')) {
          initialTheme = savedTheme;
        } else if (defaultTheme && (defaultTheme === 'light' || defaultTheme === 'dark')) {
          initialTheme = defaultTheme;
        } else {
          initialTheme = systemTheme;
        }
        
        setThemeState(initialTheme);
        setIsInitialized(true);
        
        // Apply theme to document root for global styles
        document.documentElement.setAttribute('data-staff-theme', initialTheme);
        
      } catch (error) {
        console.error('Failed to initialize theme:', error);
        setThemeState('light');
        setIsInitialized(true);
        document.documentElement.setAttribute('data-staff-theme', 'light');
      }
    };

    initializeTheme();
  }, [defaultTheme]);

  // Listen for system preference changes
  useEffect(() => {
    if (!isInitialized) return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e) => {
      // Only update if no saved preference exists
      const savedTheme = themeStorage.load();
      if (!savedTheme) {
        const newTheme = e.matches ? 'dark' : 'light';
        setThemeState(newTheme);
        document.documentElement.setAttribute('data-staff-theme', newTheme);
      }
    };

    try {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } catch (error) {
      console.warn('Failed to listen for system preference changes:', error);
    }
  }, [isInitialized]);

  const setTheme = (newTheme) => {
    if (newTheme !== 'light' && newTheme !== 'dark') {
      console.warn('Invalid theme value:', newTheme);
      return;
    }

    try {
      setThemeState(newTheme);
      themeStorage.save(newTheme);
      document.documentElement.setAttribute('data-staff-theme', newTheme);
      
      // Announce theme change to screen readers
      const announcement = document.createElement('div');
      announcement.setAttribute('aria-live', 'polite');
      announcement.setAttribute('aria-atomic', 'true');
      announcement.className = 'sr-only';
      announcement.textContent = `Theme changed to ${newTheme} mode`;
      document.body.appendChild(announcement);
      
      setTimeout(() => {
        if (document.body.contains(announcement)) {
          document.body.removeChild(announcement);
        }
      }, 1000);
      
    } catch (error) {
      console.error('Failed to set theme:', error);
    }
  };

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
  };

  const contextValue = {
    theme,
    toggleTheme,
    setTheme,
    themeClasses: themeConfig[theme] || themeConfig.light,
    isInitialized
  };

  return (
    <StaffThemeContext.Provider value={contextValue}>
      {children}
    </StaffThemeContext.Provider>
  );
};

// Custom hook for using theme context
export const useStaffTheme = () => {
  const context = useContext(StaffThemeContext);
  
  if (!context) {
    throw new Error('useStaffTheme must be used within a StaffThemeProvider');
  }
  
  return context;
};

export default StaffThemeContext;