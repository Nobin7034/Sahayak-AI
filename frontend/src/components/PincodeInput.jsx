import React, { useState, useEffect, useCallback } from 'react';
import { MapPin, Loader2, AlertCircle, CheckCircle } from 'lucide-react';

const PincodeInput = ({ 
  value, 
  onChange, 
  onValidPincode, 
  isLoading, 
  error, 
  placeholder = "Enter 6-digit pincode" 
}) => {
  const [inputValue, setInputValue] = useState(value || '');
  const [validationError, setValidationError] = useState('');
  const [isValid, setIsValid] = useState(false);

  // Debounce timer ref
  const debounceTimerRef = React.useRef(null);

  // Validate pincode format (6 digits)
  const validatePincodeFormat = useCallback((pincode) => {
    if (!pincode || typeof pincode !== 'string') {
      return false;
    }
    const cleanPincode = pincode.trim();
    return /^\d{6}$/.test(cleanPincode);
  }, []);

  // Handle input change with real-time validation
  const handleInputChange = (e) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    
    // Clear previous debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Real-time format validation (without API calls)
    if (newValue.trim() === '') {
      setValidationError('');
      setIsValid(false);
    } else if (!validatePincodeFormat(newValue)) {
      if (newValue.length > 6) {
        setValidationError('Pincode must be exactly 6 digits');
      } else if (!/^\d*$/.test(newValue)) {
        setValidationError('Pincode must contain only numbers');
      } else if (newValue.length < 6) {
        setValidationError('Pincode must be 6 digits');
      }
      setIsValid(false);
    } else {
      setValidationError('');
      setIsValid(true);
      
      // Debounced API call for valid format
      debounceTimerRef.current = setTimeout(() => {
        if (onValidPincode) {
          onValidPincode(newValue.trim());
        }
      }, 500); // 500ms debounce delay
    }

    // Always call onChange to keep parent in sync
    if (onChange) {
      onChange(newValue);
    }
  };

  // Update internal state when external value changes
  useEffect(() => {
    if (value !== inputValue) {
      setInputValue(value || '');
    }
  }, [value]);

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // Determine the current status for styling and icons
  const getInputStatus = () => {
    if (isLoading) return 'loading';
    if (error) return 'error';
    if (validationError) return 'validation-error';
    if (isValid && inputValue.trim()) return 'valid';
    return 'default';
  };

  const inputStatus = getInputStatus();

  // Style classes based on status
  const getInputClasses = () => {
    const baseClasses = "w-full px-4 py-3 pl-12 pr-12 border rounded-lg focus:outline-none focus:ring-2 transition-colors";
    
    switch (inputStatus) {
      case 'loading':
        return `${baseClasses} border-blue-300 focus:ring-blue-500 focus:border-blue-500`;
      case 'error':
        return `${baseClasses} border-red-300 focus:ring-red-500 focus:border-red-500 bg-red-50`;
      case 'validation-error':
        return `${baseClasses} border-red-300 focus:ring-red-500 focus:border-red-500`;
      case 'valid':
        return `${baseClasses} border-green-300 focus:ring-green-500 focus:border-green-500 bg-green-50`;
      default:
        return `${baseClasses} border-gray-300 focus:ring-blue-500 focus:border-blue-500`;
    }
  };

  // Get the appropriate icon
  const renderIcon = () => {
    switch (inputStatus) {
      case 'loading':
        return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'validation-error':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'valid':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      default:
        return <MapPin className="h-5 w-5 text-gray-400" />;
    }
  };

  // Get error message to display
  const getErrorMessage = () => {
    if (error) return error;
    if (validationError) return validationError;
    return '';
  };

  return (
    <div className="space-y-2">
      <label htmlFor="pincode-input" className="block text-sm font-medium text-gray-700">
        Pincode
      </label>
      
      <div className="relative">
        {/* Left icon */}
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <MapPin className="h-5 w-5 text-gray-400" />
        </div>
        
        {/* Input field */}
        <input
          id="pincode-input"
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          placeholder={placeholder}
          disabled={isLoading}
          maxLength={6}
          className={getInputClasses()}
          aria-describedby={getErrorMessage() ? "pincode-error" : undefined}
          aria-invalid={!!(error || validationError)}
        />
        
        {/* Right status icon */}
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
          {renderIcon()}
        </div>
      </div>
      
      {/* Error message */}
      {getErrorMessage() && (
        <p id="pincode-error" className="text-sm text-red-600 flex items-center space-x-1">
          <AlertCircle className="h-4 w-4" />
          <span>{getErrorMessage()}</span>
        </p>
      )}
      
      {/* Loading message */}
      {isLoading && (
        <p className="text-sm text-blue-600 flex items-center space-x-1">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Finding location...</span>
        </p>
      )}
      
      {/* Success message */}
      {inputStatus === 'valid' && !isLoading && !error && (
        <p className="text-sm text-green-600 flex items-center space-x-1">
          <CheckCircle className="h-4 w-4" />
          <span>Valid pincode format</span>
        </p>
      )}
      
      {/* Help text */}
      <p className="text-xs text-gray-500">
        Enter a 6-digit Indian pincode to automatically center the map on your area
      </p>
    </div>
  );
};

export default PincodeInput;