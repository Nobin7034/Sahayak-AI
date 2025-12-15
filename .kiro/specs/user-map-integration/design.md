# Design Document - User Map Integration

## Overview

The User Map Integration feature transforms the existing Sahayak AI platform into a comprehensive location-based service discovery system. Users can visually locate nearby Akshaya centers on an interactive map, view detailed center information, and seamlessly transition to service booking. The design emphasizes user experience with responsive map interactions, real-time center information, and accessibility compliance.

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend Layer                           │
├─────────────────────────────────────────────────────────────┤
│  Map Component (Leaflet)  │  Search Component  │  Info Panel │
│  - Center Markers         │  - Location Search │  - Details  │
│  - User Location          │  - Geocoding       │  - Services │
│  - Interactive Controls   │  - Filters         │  - Booking  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    API Gateway                              │
├─────────────────────────────────────────────────────────────┤
│  /api/centers/nearby      │  /api/centers/:id  │  External   │
│  /api/centers/search      │  /api/services     │  APIs       │
│  /api/geocode            │  /api/appointments │             │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   Service Layer                             │
├─────────────────────────────────────────────────────────────┤
│  Center Service    │  Geocoding Service  │  Distance Service │
│  - CRUD Operations │  - Nominatim API    │  - Haversine      │
│  - Availability    │  - Address Lookup   │  - Proximity      │
│  - Status Updates  │  - Coordinate Conv. │  - Filtering      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   Data Layer                                │
├─────────────────────────────────────────────────────────────┤
│  MongoDB Collections:                                       │
│  - akshaya_centers (location, services, hours, contact)    │
│  - services (linked to centers)                            │
│  - appointments (center-specific)                          │
│  - users (with location preferences)                       │
└─────────────────────────────────────────────────────────────┘
```

### External Integrations

- **OpenStreetMap**: Tile server for map rendering
- **Nominatim API**: Geocoding and reverse geocoding services
- **Browser Geolocation API**: User location detection
- **Leaflet.js**: Interactive map library

## Components and Interfaces

### Frontend Components

#### MapContainer Component
```javascript
interface MapContainerProps {
  centers: AkshayaCenter[]
  userLocation?: Coordinates
  selectedCenter?: string
  onCenterSelect: (centerId: string) => void
  onLocationChange: (bounds: MapBounds) => void
}
```

#### CenterMarker Component
```javascript
interface CenterMarkerProps {
  center: AkshayaCenter
  isSelected: boolean
  onClick: (centerId: string) => void
  showPopup: boolean
}
```

#### SearchBar Component
```javascript
interface SearchBarProps {
  onSearch: (query: string) => void
  onLocationFound: (coordinates: Coordinates) => void
  placeholder: string
  isLoading: boolean
}
```

#### CenterInfoPanel Component
```javascript
interface CenterInfoPanelProps {
  center: AkshayaCenter | null
  services: Service[]
  distance?: number
  onBookAppointment: (centerId: string) => void
  onClose: () => void
}
```

### Backend Interfaces

#### AkshayaCenter Model
```javascript
interface AkshayaCenter {
  _id: string
  name: string
  address: {
    street: string
    city: string
    district: string
    state: string
    pincode: string
  }
  location: {
    type: 'Point'
    coordinates: [longitude: number, latitude: number]
  }
  contact: {
    phone: string
    email: string
  }
  operatingHours: {
    [day: string]: {
      open: string
      close: string
      isOpen: boolean
    }
  }
  services: string[] // Service IDs
  status: 'active' | 'inactive' | 'maintenance'
  capacity: {
    maxAppointmentsPerDay: number
    currentLoad: number
  }
  createdAt: Date
  updatedAt: Date
}
```

#### API Endpoints

```javascript
// Get nearby centers
GET /api/centers/nearby?lat={lat}&lng={lng}&radius={radius}
Response: { centers: AkshayaCenter[], total: number }

// Search centers by location
GET /api/centers/search?query={address}&radius={radius}
Response: { centers: AkshayaCenter[], coordinates: Coordinates }

// Get center details
GET /api/centers/:id
Response: { center: AkshayaCenter, services: Service[] }

// Geocode address
GET /api/geocode?address={address}
Response: { coordinates: Coordinates, displayName: string }
```

## Data Models

### Enhanced Models

#### AkshayaCenter Collection
```javascript
{
  _id: ObjectId,
  name: String (required),
  address: {
    street: String (required),
    city: String (required),
    district: String (required),
    state: String (default: "Kerala"),
    pincode: String (required, pattern: /^\d{6}$/)
  },
  location: {
    type: { type: String, enum: ['Point'], required: true },
    coordinates: [Number] (required, index: '2dsphere')
  },
  contact: {
    phone: String (required, pattern: /^\+91\d{10}$/),
    email: String (required, format: email)
  },
  operatingHours: {
    monday: { open: String, close: String, isOpen: Boolean },
    tuesday: { open: String, close: String, isOpen: Boolean },
    wednesday: { open: String, close: String, isOpen: Boolean },
    thursday: { open: String, close: String, isOpen: Boolean },
    friday: { open: String, close: String, isOpen: Boolean },
    saturday: { open: String, close: String, isOpen: Boolean },
    sunday: { open: String, close: String, isOpen: Boolean }
  },
  services: [{ type: ObjectId, ref: 'Service' }],
  status: { type: String, enum: ['active', 'inactive', 'maintenance'], default: 'active' },
  capacity: {
    maxAppointmentsPerDay: { type: Number, default: 50 },
    currentLoad: { type: Number, default: 0 }
  },
  metadata: {
    visitCount: { type: Number, default: 0 },
    rating: { type: Number, min: 0, max: 5 },
    lastUpdated: { type: Date, default: Date.now }
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}
```

#### Enhanced Service Model
```javascript
{
  _id: ObjectId,
  name: String (required),
  description: String,
  category: String (required),
  fees: Number (required),
  processingTime: String (required),
  requiredDocuments: [String],
  availableAt: [{ type: ObjectId, ref: 'AkshayaCenter' }], // Centers offering this service
  isActive: { type: Boolean, default: true },
  createdAt: Date,
  updatedAt: Date
}
```

#### Enhanced Appointment Model
```javascript
{
  _id: ObjectId,
  user: { type: ObjectId, ref: 'User', required: true },
  center: { type: ObjectId, ref: 'AkshayaCenter', required: true },
  service: { type: ObjectId, ref: 'Service', required: true },
  appointmentDate: Date (required),
  timeSlot: String (required),
  status: { type: String, enum: ['pending', 'confirmed', 'completed', 'cancelled'], default: 'pending' },
  documents: [String], // File paths
  notes: String,
  createdAt: Date,
  updatedAt: Date
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Center marker display completeness
*For any* set of active Akshaya centers in the database, all centers should appear as markers on the map when the map is displayed
**Validates: Requirements 1.3**

### Property 2: Marker click information display
*For any* Akshaya center marker, clicking on it should display a popup containing the center's name, address, contact information, and available services
**Validates: Requirements 1.4**

### Property 3: Geocoding API integration
*For any* valid address input in the search field, the system should call the Nominatim API and receive geocoding results
**Validates: Requirements 2.1**

### Property 4: Map centering on search results
*For any* successful geocoding result, the map should center on the returned coordinates and highlight centers within the specified radius
**Validates: Requirements 2.2**

### Property 5: Radius-based center filtering
*For any* searched location and configurable radius, only centers within that distance should be displayed in the search results
**Validates: Requirements 2.4**

### Property 6: Search clear functionality
*For any* active search state, clearing the search should return the map to its default view showing all available centers
**Validates: Requirements 2.5**

### Property 7: Center selection visual feedback
*For any* Akshaya center marker, clicking on it should highlight that center with a distinct visual indicator while removing highlights from other centers
**Validates: Requirements 3.1**

### Property 8: Information panel data completeness
*For any* selected Akshaya center, the information panel should display all required fields: name, address, contact details, operating hours, and available services
**Validates: Requirements 3.2**

### Property 9: Booking button availability
*For any* center with available services, the information panel should provide a functional button to proceed to service booking
**Validates: Requirements 3.3**

### Property 10: Center selection state management
*For any* sequence of center selections, each new selection should update the information panel and visual highlights correctly
**Validates: Requirements 3.4**

### Property 11: Service filtering by center
*For any* selected center, the booking process should show only services that are available at that specific center
**Validates: Requirements 3.5**

### Property 12: Operating status calculation
*For any* center and current time, the displayed operating status should correctly reflect whether the center is open or closed based on its operating hours
**Validates: Requirements 4.1**

### Property 13: Service availability indication
*For any* center with limited service availability, the system should clearly indicate which services are currently offered
**Validates: Requirements 4.2**

### Property 14: Distance calculation accuracy
*For any* user location and center coordinates, the displayed distance should be calculated correctly using the Haversine formula
**Validates: Requirements 4.3**

### Property 15: Appointment availability display
*For any* center with appointment capacity constraints, the system should display accurate availability indicators for different time slots
**Validates: Requirements 4.4**

### Property 16: Keyboard navigation functionality
*For any* keyboard navigation sequence, users should be able to navigate between center markers using arrow keys and select markers using Enter
**Validates: Requirements 5.2**

## Error Handling

### Network Connectivity
- **Map Loading Failures**: Display fallback message with retry option when OpenStreetMap tiles fail to load
- **API Timeouts**: Implement 10-second timeout for Nominatim API calls with graceful degradation
- **Offline Mode**: Cache last known center data and provide limited functionality when network is unavailable

### Geolocation Errors
- **Permission Denied**: Fall back to default Kerala location (10.8505° N, 76.2711° E)
- **Position Unavailable**: Show manual location search as primary option
- **Timeout**: Proceed with default location after 5-second timeout

### Data Validation
- **Invalid Coordinates**: Validate latitude (-90 to 90) and longitude (-180 to 180) ranges
- **Missing Center Data**: Handle centers with incomplete information gracefully
- **Service Availability**: Verify service-center relationships before displaying booking options

### User Experience
- **Loading States**: Show skeleton loaders for map initialization and data fetching
- **Error Messages**: Provide clear, actionable error messages in user's preferred language
- **Retry Mechanisms**: Allow users to retry failed operations with exponential backoff

## Testing Strategy

### Unit Testing Approach
Unit tests will verify specific examples and edge cases:
- Map component initialization with various props
- Geocoding service with known addresses
- Distance calculation with specific coordinate pairs
- Center filtering with boundary conditions
- Error handling for network failures

### Property-Based Testing Approach
Property-based tests will verify universal properties across all inputs using **fast-check** library:
- Each property-based test will run a minimum of 100 iterations
- Tests will use smart generators that create realistic test data within valid ranges
- Each test will be tagged with comments referencing the corresponding correctness property

**Property-Based Testing Requirements:**
- Use fast-check library for JavaScript property-based testing
- Configure each test to run minimum 100 iterations
- Tag each test with format: **Feature: user-map-integration, Property {number}: {property_text}**
- Generate realistic test data (valid coordinates, addresses, center data)
- Test universal properties that should hold across all valid inputs

### Integration Testing
- End-to-end map interaction workflows
- API integration with external services (Nominatim, OpenStreetMap)
- Cross-browser compatibility for map rendering
- Mobile device touch interactions

### Accessibility Testing
- Screen reader compatibility with map elements
- Keyboard navigation through all interactive components
- Color contrast compliance for map markers and UI elements
- Focus management during map interactions

## Performance Considerations

### Map Rendering
- **Marker Clustering**: Group nearby centers when zoomed out to improve performance
- **Lazy Loading**: Load center details only when markers are clicked
- **Tile Caching**: Implement client-side caching for map tiles
- **Viewport Optimization**: Only render markers within current map bounds

### API Optimization
- **Debounced Search**: Delay geocoding requests by 300ms to avoid excessive API calls
- **Request Caching**: Cache geocoding results for common searches
- **Batch Operations**: Group multiple center queries when possible
- **Rate Limiting**: Respect Nominatim API usage policies (1 request/second)

### Data Management
- **Geospatial Indexing**: Use MongoDB 2dsphere index for efficient proximity queries
- **Center Pagination**: Implement pagination for large numbers of centers
- **Real-time Updates**: Use WebSocket connections for live center status updates
- **Memory Management**: Clean up map event listeners and components on unmount

## Security Considerations

### API Security
- **Rate Limiting**: Implement client-side and server-side rate limiting for geocoding requests
- **Input Validation**: Sanitize all user inputs before sending to external APIs
- **API Key Management**: Secure storage and rotation of external service credentials
- **CORS Configuration**: Properly configure cross-origin requests for map services

### Location Privacy
- **Permission Handling**: Request location permission only when needed
- **Data Minimization**: Store only necessary location data
- **User Consent**: Clear consent mechanisms for location sharing
- **Data Retention**: Implement policies for location data cleanup

### Data Protection
- **Center Information**: Validate and sanitize all center data before display
- **User Tracking**: Minimize tracking of user location and search patterns
- **Secure Transmission**: Use HTTPS for all API communications
- **Error Information**: Avoid exposing sensitive system information in error messages