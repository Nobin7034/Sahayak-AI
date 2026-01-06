import React from 'react';
import { AlertTriangle, RefreshCw, Home, Bug, Mail } from 'lucide-react';

/**
 * ErrorBoundary Component
 * Catches React component crashes and provides recovery options
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error details
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo,
      hasError: true
    });

    // Report error to monitoring service
    this.reportError(error, errorInfo);
  }

  reportError = (error, errorInfo) => {
    // In a real app, send to error reporting service like Sentry
    const errorReport = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      userId: localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).id : null
    };

    console.log('Error Report:', errorReport);
    
    // Could send to API endpoint for logging
    // fetch('/api/errors', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(errorReport)
    // });
  };

  handleRetry = () => {
    this.setState(prevState => ({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: prevState.retryCount + 1
    }));
  };

  handleGoHome = () => {
    window.location.href = '/staff/dashboard';
  };

  handleReportBug = () => {
    const subject = encodeURIComponent('Staff Dashboard Error Report');
    const body = encodeURIComponent(`
Error: ${this.state.error?.message}
Time: ${new Date().toISOString()}
URL: ${window.location.href}
User Agent: ${navigator.userAgent}

Stack Trace:
${this.state.error?.stack}

Component Stack:
${this.state.errorInfo?.componentStack}
    `);
    
    window.open(`mailto:support@akshaya.kerala.gov.in?subject=${subject}&body=${body}`);
  };

  render() {
    if (this.state.hasError) {
      const { error, retryCount } = this.state;
      const { fallback: CustomFallback, showDetails = false } = this.props;

      // If custom fallback provided, use it
      if (CustomFallback) {
        return (
          <CustomFallback
            error={error}
            retry={this.handleRetry}
            retryCount={retryCount}
          />
        );
      }

      // Default error UI
      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-slate-800/50 backdrop-blur-sm rounded-2xl p-8 border border-slate-700 text-center">
            <div className="mb-6">
              <AlertTriangle className="h-16 w-16 text-red-400 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-white mb-2">Something went wrong</h1>
              <p className="text-slate-300 text-sm">
                The staff dashboard encountered an unexpected error. Don't worry, your data is safe.
              </p>
            </div>

            {showDetails && error && (
              <div className="mb-6 p-4 bg-slate-900/50 rounded-lg border border-slate-600">
                <h3 className="text-white font-medium mb-2">Error Details</h3>
                <p className="text-red-400 text-xs font-mono break-all">
                  {error.message}
                </p>
                {retryCount > 0 && (
                  <p className="text-slate-400 text-xs mt-2">
                    Retry attempts: {retryCount}
                  </p>
                )}
              </div>
            )}

            <div className="space-y-3">
              <button
                onClick={this.handleRetry}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Try Again</span>
              </button>

              <button
                onClick={this.handleGoHome}
                className="w-full bg-slate-600 hover:bg-slate-700 text-white py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
              >
                <Home className="h-4 w-4" />
                <span>Go to Dashboard</span>
              </button>

              <button
                onClick={this.handleReportBug}
                className="w-full bg-slate-700 hover:bg-slate-600 text-slate-300 py-2 px-4 rounded-lg text-sm transition-colors flex items-center justify-center space-x-2"
              >
                <Bug className="h-3 w-3" />
                <span>Report Bug</span>
              </button>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-700">
              <p className="text-slate-500 text-xs">
                If this problem persists, please contact technical support.
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * NetworkErrorBoundary Component
 * Handles network-related errors with retry mechanisms
 */
const NetworkErrorBoundary = ({ children, onRetry }) => {
  const [networkError, setNetworkError] = React.useState(null);
  const [retrying, setRetrying] = React.useState(false);

  React.useEffect(() => {
    const handleOnline = () => {
      if (networkError) {
        setNetworkError(null);
        if (onRetry) onRetry();
      }
    };

    const handleOffline = () => {
      setNetworkError('No internet connection');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [networkError, onRetry]);

  const handleRetry = async () => {
    setRetrying(true);
    try {
      if (onRetry) {
        await onRetry();
      }
      setNetworkError(null);
    } catch (error) {
      setNetworkError(error.message);
    } finally {
      setRetrying(false);
    }
  };

  if (networkError) {
    return (
      <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4 m-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="h-5 w-5 text-red-400" />
            <div>
              <h3 className="text-red-300 font-medium">Connection Error</h3>
              <p className="text-red-400 text-sm">{networkError}</p>
            </div>
          </div>
          <button
            onClick={handleRetry}
            disabled={retrying}
            className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-md text-sm transition-colors disabled:opacity-50"
          >
            {retrying ? 'Retrying...' : 'Retry'}
          </button>
        </div>
      </div>
    );
  }

  return children;
};

/**
 * AuthErrorHandler Component
 * Handles authentication errors with redirect
 */
const AuthErrorHandler = ({ children }) => {
  React.useEffect(() => {
    const handleAuthError = (event) => {
      if (event.detail?.type === 'auth_error') {
        // Clear auth data
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('staff');
        
        // Redirect to staff login
        window.location.href = '/staff/login?reason=session_expired';
      }
    };

    window.addEventListener('auth_error', handleAuthError);
    return () => window.removeEventListener('auth_error', handleAuthError);
  }, []);

  return children;
};

/**
 * ErrorRecoveryProvider Component
 * Provides error recovery context and utilities
 */
const ErrorRecoveryContext = React.createContext();

const ErrorRecoveryProvider = ({ children }) => {
  const [errors, setErrors] = React.useState([]);
  const [recoveryAttempts, setRecoveryAttempts] = React.useState({});

  const addError = (error, context = {}) => {
    const errorId = Date.now().toString();
    const errorEntry = {
      id: errorId,
      message: error.message || 'Unknown error',
      type: error.type || 'general',
      context,
      timestamp: new Date(),
      resolved: false
    };

    setErrors(prev => [...prev, errorEntry]);
    return errorId;
  };

  const resolveError = (errorId) => {
    setErrors(prev => 
      prev.map(error => 
        error.id === errorId 
          ? { ...error, resolved: true }
          : error
      )
    );
  };

  const clearErrors = () => {
    setErrors([]);
    setRecoveryAttempts({});
  };

  const attemptRecovery = async (errorId, recoveryFn) => {
    const attempts = recoveryAttempts[errorId] || 0;
    
    if (attempts >= 3) {
      throw new Error('Maximum recovery attempts exceeded');
    }

    setRecoveryAttempts(prev => ({
      ...prev,
      [errorId]: attempts + 1
    }));

    try {
      await recoveryFn();
      resolveError(errorId);
    } catch (error) {
      if (attempts >= 2) {
        // Final attempt failed, mark as unrecoverable
        setErrors(prev => 
          prev.map(err => 
            err.id === errorId 
              ? { ...err, unrecoverable: true }
              : err
          )
        );
      }
      throw error;
    }
  };

  const value = {
    errors: errors.filter(e => !e.resolved),
    addError,
    resolveError,
    clearErrors,
    attemptRecovery,
    recoveryAttempts
  };

  return (
    <ErrorRecoveryContext.Provider value={value}>
      {children}
    </ErrorRecoveryContext.Provider>
  );
};

const useErrorRecovery = () => {
  const context = React.useContext(ErrorRecoveryContext);
  if (!context) {
    throw new Error('useErrorRecovery must be used within ErrorRecoveryProvider');
  }
  return context;
};

/**
 * withErrorRecovery HOC
 * Wraps components with error recovery capabilities
 */
const withErrorRecovery = (Component, options = {}) => {
  return function WrappedComponent(props) {
    const { addError, attemptRecovery } = useErrorRecovery();
    const [componentError, setComponentError] = React.useState(null);

    const handleError = (error, context = {}) => {
      const errorId = addError(error, { component: Component.name, ...context });
      setComponentError({ error, errorId });
    };

    const handleRecovery = async () => {
      if (componentError) {
        try {
          await attemptRecovery(componentError.errorId, options.recoveryFn || (() => {}));
          setComponentError(null);
        } catch (error) {
          console.error('Recovery failed:', error);
        }
      }
    };

    if (componentError) {
      return (
        <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-red-300 font-medium">Component Error</h3>
              <p className="text-red-400 text-sm">{componentError.error.message}</p>
            </div>
            <button
              onClick={handleRecovery}
              className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-md text-sm"
            >
              Retry
            </button>
          </div>
        </div>
      );
    }

    return <Component {...props} onError={handleError} />;
  };
};

export default ErrorBoundary;
export { 
  NetworkErrorBoundary, 
  AuthErrorHandler, 
  ErrorRecoveryProvider, 
  useErrorRecovery, 
  withErrorRecovery 
};