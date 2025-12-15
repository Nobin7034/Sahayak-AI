import React, { useState, useEffect } from 'react';
import { Search, MapPin, X, Loader } from 'lucide-react';
import geocodingService from '../../services/geocodingService';

const SearchBar = ({ 
  onSearch, 
  onLocationFound, 
  placeholder = "Search for location or address...", 
  isLoading = false 
}) => {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState('');
  const [debounceTimer, setDebounceTimer] = useState(null);

  // Debounced search function
  useEffect(() => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    if (query.trim().length > 2) {
      const timer = setTimeout(() => {
        handleSearch(query);
      }, 300); // 300ms delay
      
      setDebounceTimer(timer);
    } else {
      setError('');
    }

    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
    };
  }, [query]);

  const handleSearch = async (searchQuery) => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setError('');

    try {
      const result = await geocodingService.geocodeAddress(searchQuery);
      
      if (onLocationFound) {
        onLocationFound(result.coordinates);
      }
      
      if (onSearch) {
        onSearch(searchQuery);
      }
    } catch (error) {
      console.error('Search error:', error);
      setError('Location not found. Please try a different search term.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    
    if (value.trim().length === 0) {
      handleClear();
    }
  };

  const handleClear = () => {
    setQuery('');
    setError('');
    setIsSearching(false);
    
    if (onSearch) {
      onSearch(''); // Clear search
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      handleSearch(query);
    }
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser.');
      return;
    }

    setIsSearching(true);
    setError('');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        
        if (onLocationFound) {
          onLocationFound({ lat: latitude, lng: longitude });
        }
        
        setQuery('Current Location');
        setIsSearching(false);
      },
      (error) => {
        console.error('Geolocation error:', error);
        setError('Unable to get your location. Please search manually.');
        setIsSearching(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    );
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            {isSearching || isLoading ? (
              <Loader className="h-5 w-5 text-gray-400 animate-spin" />
            ) : (
              <Search className="h-5 w-5 text-gray-400" />
            )}
          </div>
          
          <input
            type="text"
            value={query}
            onChange={handleInputChange}
            placeholder={placeholder}
            className="block w-full pl-10 pr-20 py-3 border border-gray-300 rounded-lg 
                     focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
                     bg-white shadow-sm text-sm"
            disabled={isSearching || isLoading}
          />
          
          <div className="absolute inset-y-0 right-0 flex items-center">
            {query && (
              <button
                type="button"
                onClick={handleClear}
                className="p-2 text-gray-400 hover:text-gray-600 focus:outline-none"
                disabled={isSearching || isLoading}
              >
                <X className="h-4 w-4" />
              </button>
            )}
            
            <button
              type="button"
              onClick={getCurrentLocation}
              className="p-2 mr-1 text-blue-500 hover:text-blue-700 focus:outline-none
                       disabled:text-gray-400 disabled:cursor-not-allowed"
              disabled={isSearching || isLoading}
              title="Use current location"
            >
              <MapPin className="h-4 w-4" />
            </button>
          </div>
        </div>
      </form>
      
      {error && (
        <div className="mt-2 text-sm text-red-600 bg-red-50 border border-red-200 
                      rounded-md p-2 flex items-center">
          <X className="h-4 w-4 mr-2 flex-shrink-0" />
          {error}
        </div>
      )}
      
      {query && !error && !isSearching && (
        <div className="mt-2 text-xs text-gray-500">
          Press Enter to search or use the location button for current position
        </div>
      )}
    </div>
  );
};

export default SearchBar;