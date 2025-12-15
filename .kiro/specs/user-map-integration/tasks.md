# Implementation Plan

- [x] 1. Set up map integration dependencies and project structure

  - Install Leaflet, react-leaflet, and related mapping dependencies
  - Configure OpenStreetMap tile server integration
  - Set up Nominatim API service configuration
  - Create directory structure for map components and services
  - _Requirements: 1.1, 1.2_

- [x] 2. Create enhanced Akshaya Center data model and API endpoints

  - [ ] 2.1 Update AkshayaCenter model with location and geospatial fields
    - Add MongoDB 2dsphere index for location coordinates
    - Include operating hours, capacity, and status fields
    - Add address structure with geocoding support
    - _Requirements: 1.3, 4.1, 4.2_

  - [ ]* 2.2 Write property test for center data model
    - **Property 1: Center marker display completeness**
    - **Validates: Requirements 1.3**


  - [ ] 2.3 Create center management API endpoints
    - Implement GET /api/centers/nearby with radius filtering
    - Create GET /api/centers/search with geocoding integration
    - Add GET /api/centers/:id for detailed center information
    - _Requirements: 2.1, 2.4, 3.2_

  - [ ]* 2.4 Write property test for radius-based filtering
    - **Property 5: Radius-based center filtering**
    - **Validates: Requirements 2.4**


- [ ] 3. Implement geocoding service integration
  - [ ] 3.1 Create Nominatim API service wrapper
    - Implement address to coordinates conversion
    - Add reverse geocoding functionality
    - Include error handling and rate limiting
    - _Requirements: 2.1, 2.2, 2.3_

  - [x]* 3.2 Write property test for geocoding integration

    - **Property 3: Geocoding API integration**
    - **Validates: Requirements 2.1**

  - [ ] 3.3 Add geocoding endpoint to backend API
    - Create GET /api/geocode route with address parameter
    - Implement caching for common geocoding requests

    - Add input validation and sanitization
    - _Requirements: 2.1, 2.2_

- [ ] 4. Build core map components
  - [ ] 4.1 Create MapContainer component with Leaflet integration
    - Set up OpenStreetMap tile layer
    - Implement user location detection and centering
    - Add map event handlers for bounds changes
    - Configure responsive map sizing
    - _Requirements: 1.1, 1.2, 1.5_


  - [ ]* 4.2 Write property test for map centering
    - **Property 4: Map centering on search results**
    - **Validates: Requirements 2.2**

  - [ ] 4.3 Implement CenterMarker component
    - Create custom markers for Akshaya centers
    - Add click handlers for marker selection
    - Implement popup display with center information
    - Include visual selection indicators
    - _Requirements: 1.4, 3.1, 3.4_

  - [ ]* 4.4 Write property test for marker interactions
    - **Property 2: Marker click information display**
    - **Validates: Requirements 1.4**


  - [ ]* 4.5 Write property test for center selection
    - **Property 7: Center selection visual feedback**
    - **Validates: Requirements 3.1**

- [ ] 5. Implement search and filtering functionality
  - [ ] 5.1 Create SearchBar component
    - Add location/address search input field
    - Implement debounced search to avoid excessive API calls
    - Include loading states and error handling

    - Add search clear functionality
    - _Requirements: 2.1, 2.3, 2.5_

  - [ ]* 5.2 Write property test for search clear functionality
    - **Property 6: Search clear functionality**
    - **Validates: Requirements 2.5**

  - [ ] 5.3 Implement center filtering logic
    - Create distance calculation using Haversine formula
    - Add radius-based center filtering

    - Implement real-time filtering as map bounds change
    - _Requirements: 2.4, 4.3_

  - [ ]* 5.4 Write property test for distance calculation
    - **Property 14: Distance calculation accuracy**
    - **Validates: Requirements 4.3**

- [ ] 6. Build center information and booking integration
  - [ ] 6.1 Create CenterInfoPanel component
    - Display comprehensive center details (name, address, contact, hours)
    - Show available services and current operating status
    - Include distance from user location if available
    - Add appointment availability indicators
    - _Requirements: 3.2, 4.1, 4.2, 4.4_


  - [ ]* 6.2 Write property test for information panel completeness
    - **Property 8: Information panel data completeness**
    - **Validates: Requirements 3.2**

  - [ ]* 6.3 Write property test for operating status calculation
    - **Property 12: Operating status calculation**
    - **Validates: Requirements 4.1**

  - [ ] 6.4 Implement booking integration
    - Add "Book Appointment" button with center context
    - Filter services based on selected center
    - Integrate with existing appointment booking flow
    - _Requirements: 3.3, 3.5_

  - [ ]* 6.5 Write property test for service filtering
    - **Property 11: Service filtering by center**
    - **Validates: Requirements 3.5**

  - [ ]* 6.6 Write property test for booking button availability
    - **Property 9: Booking button availability**
    - **Validates: Requirements 3.3**

- [ ] 7. Implement accessibility and keyboard navigation
  - [ ] 7.1 Add keyboard navigation support
    - Implement arrow key navigation between markers
    - Add Enter key selection for markers
    - Include focus management for map interactions
    - _Requirements: 5.2_

  - [ ]* 7.2 Write property test for keyboard navigation
    - **Property 16: Keyboard navigation functionality**
    - **Validates: Requirements 5.2**

  - [ ] 7.3 Enhance accessibility compliance
    - Add ARIA labels for map elements and markers
    - Implement screen reader support for center information
    - Include alternative text for visual indicators
    - _Requirements: 5.3_

- [ ] 8. Add error handling and fallback mechanisms
  - [ ] 8.1 Implement comprehensive error handling
    - Handle geolocation permission denied scenarios
    - Add fallback for map loading failures
    - Implement retry mechanisms for API failures

    - Create offline mode with cached data
    - _Requirements: 1.5, 2.3, 4.5, 5.4, 5.5_

  - [ ] 8.2 Create fallback list view
    - Build non-JavaScript fallback for center listing

    - Include basic center information and contact details
    - Add progressive enhancement for map functionality
    - _Requirements: 5.5_

- [x] 9. Integrate with existing application

  - [ ] 9.1 Update navigation and routing
    - Add map page to existing navigation structure
    - Create routes for center finder and center details
    - Integrate with existing authentication system
    - _Requirements: 1.1, 3.3_

  - [ ] 9.2 Enhance existing appointment booking
    - Modify appointment form to include center selection
    - Update appointment model to link with specific centers
    - Filter services based on selected center in booking flow
    - _Requirements: 3.5_

  - [ ] 9.3 Update admin interface for center management
    - Add center creation and editing forms with map integration
    - Include location picker for setting center coordinates
    - Add bulk import functionality for existing centers
    - _Requirements: 1.3, 2.4_



- [ ] 10. Performance optimization and caching
  - [ ] 10.1 Implement client-side caching
    - Cache geocoding results for common searches
    - Store map tiles locally for offline access
    - Implement center data caching with TTL
    - _Requirements: 2.1, 2.2_

  - [ ] 10.2 Add marker clustering for performance
    - Group nearby centers when zoomed out
    - Implement dynamic clustering based on zoom level
    - Optimize rendering for large numbers of centers
    - _Requirements: 1.3_

- [ ] 11. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 12. Final integration and testing
  - [ ] 12.1 End-to-end testing setup
    - Create comprehensive user journey tests
    - Test map interactions across different browsers
    - Verify mobile responsiveness and touch interactions
    - _Requirements: 5.1_

  - [ ]* 12.2 Write integration tests for complete workflows
    - Test complete user journey from map to booking
    - Verify API integration with external services
    - Test error scenarios and recovery mechanisms

  - [ ] 12.3 Performance testing and optimization
    - Test map loading performance with large datasets
    - Optimize API response times for center queries
    - Verify memory usage during extended map interactions
    - _Requirements: 1.1, 2.4_

- [ ] 13. Final Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.