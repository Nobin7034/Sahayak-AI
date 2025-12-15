# Design Document - Staff Module

## Overview

The Staff Module provides a comprehensive interface for Akshaya center staff to manage daily operations, process appointments, and maintain service quality. The design emphasizes efficiency, mobile responsiveness, and real-time updates to support staff workflows. The module integrates seamlessly with the existing user and admin modules while providing center-specific access control and functionality.

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                    Staff Frontend Layer                     │
├─────────────────────────────────────────────────────────────┤
│  Dashboard    │  Appointments  │  Services   │  Analytics   │
│  - Overview   │  - List View   │  - Manage   │  - Metrics   │
│  - Schedule   │  - Status Mgmt │  - Enable   │  - Charts    │
│  - Alerts     │  - Comments    │  - Disable  │  - Reports   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    API Gateway Layer                        │
├─────────────────────────────────────────────────────────────┤
│  /api/staff/appointments  │  /api/staff/services  │  Auth   │
│  /api/staff/dashboard     │  /api/staff/analytics │  Middleware │
│  /api/staff/schedule      │  /api/staff/comments  │  Center │
│  /api/staff/documents     │  /api/notifications   │  Filter │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   Service Layer                             │
├─────────────────────────────────────────────────────────────┤
│  Staff Service     │  Appointment Service │  Document Service │
│  - Authentication │  - Status Updates    │  - File Upload    │
│  - Authorization  │  - Filtering         │  - Validation     │
│  - Center Access  │  - Notifications     │  - Security Scan  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   Data Layer                                │
├─────────────────────────────────────────────────────────────┤
│  Staff Collection  │  Appointments  │  Comments  │  Files   │
│  - Center Link     │  - Status      │  - History │  - Metadata │
│  - Permissions     │  - Updates     │  - Visibility │  - Security │
└─────────────────────────────────────────────────────────────┘
```

### Authentication & Authorization Flow

```
User Login → Staff Role Check → Center Assignment → Dashboard Access
     │              │                    │               │
     ▼              ▼                    ▼               ▼
JWT Token → Role Validation → Center Filter → Feature Access
```

## Components and Interfaces

### Frontend Components

#### StaffDashboard Component
```javascript
interface StaffDashboardProps {
  staffId: string
  centerId: string
  onNavigate: (route: string) => void
}

interface DashboardData {
  todayAppointments: number
  pendingApprovals: number
  completedToday: number
  upcomingAppointments: Appointment[]
  centerStatus: CenterStatus
  notifications: Notification[]
}
```

#### AppointmentManager Component
```javascript
interface AppointmentManagerProps {
  centerId: string
  staffId: string
  filters: AppointmentFilters
  onStatusUpdate: (appointmentId: string, status: string) => void
  onCommentAdd: (appointmentId: string, comment: Comment) => void
}

interface AppointmentFilters {
  dateRange: DateRange
  status: AppointmentStatus[]
  serviceType: string[]
  searchTerm: string
}
```

#### ServiceManager Component
```javascript
interface ServiceManagerProps {
  centerId: string
  availableServices: Service[]
  centerServices: Service[]
  onServiceToggle: (serviceId: string, enabled: boolean) => void
  onServiceUpdate: (serviceId: string, updates: ServiceUpdates) => void
}
```

#### DocumentUploader Component
```javascript
interface DocumentUploaderProps {
  appointmentId: string
  allowedTypes: string[]
  maxFileSize: number
  onUploadComplete: (files: UploadedFile[]) => void
  onUploadError: (error: string) => void
}

interface UploadedFile {
  id: string
  name: string
  type: string
  size: number
  url: string
  uploadedAt: Date
}
```

### Backend Interfaces

#### Staff Model
```javascript
interface Staff {
  _id: string
  userId: ObjectId // Reference to User
  center: ObjectId // Reference to AkshayaCenter
  role: 'staff' | 'supervisor'
  permissions: StaffPermission[]
  isActive: boolean
  assignedAt: Date
  lastLogin: Date
  workingHours: {
    [day: string]: {
      start: string
      end: string
      isWorking: boolean
    }
  }
  createdAt: Date
  updatedAt: Date
}

interface StaffPermission {
  action: string // 'manage_appointments', 'upload_documents', etc.
  granted: boolean
  grantedBy: ObjectId
  grantedAt: Date
}
```

#### Enhanced Appointment Model
```javascript
interface AppointmentComment {
  _id: string
  author: ObjectId // Staff or User
  authorType: 'staff' | 'user'
  content: string
  isVisible: boolean // Visible to user or internal only
  createdAt: Date
}

interface AppointmentStatusHistory {
  status: AppointmentStatus
  changedBy: ObjectId
  changedAt: Date
  reason?: string
}

// Add to existing Appointment model:
interface EnhancedAppointment extends Appointment {
  assignedStaff?: ObjectId
  comments: AppointmentComment[]
  statusHistory: AppointmentStatusHistory[]
  resultDocuments: UploadedFile[]
  estimatedDuration: number // minutes
  actualDuration?: number // minutes
  priority: 'low' | 'normal' | 'high' | 'urgent'
}
```

#### API Endpoints

```javascript
// Staff Authentication & Profile
GET /api/staff/profile
PUT /api/staff/profile
POST /api/staff/change-password

// Dashboard & Analytics
GET /api/staff/dashboard
GET /api/staff/analytics?period={period}&type={type}

// Appointment Management
GET /api/staff/appointments?filters={filters}
PUT /api/staff/appointments/:id/status
POST /api/staff/appointments/:id/comments
GET /api/staff/appointments/:id/history

// Service Management
GET /api/staff/services/available
GET /api/staff/services/center
PUT /api/staff/services/:id/toggle
PUT /api/staff/services/:id/settings

// Document Management
POST /api/staff/appointments/:id/documents
GET /api/staff/appointments/:id/documents
DELETE /api/staff/documents/:id

// Schedule & Calendar
GET /api/staff/schedule?date={date}
GET /api/staff/calendar?month={month}&year={year}

// Notifications
GET /api/staff/notifications
PUT /api/staff/notifications/:id/read
POST /api/staff/notifications/preferences
```

## Data Models

### Staff Collection
```javascript
{
  _id: ObjectId,
  userId: { type: ObjectId, ref: 'User', required: true },
  center: { type: ObjectId, ref: 'AkshayaCenter', required: true },
  role: { 
    type: String, 
    enum: ['staff', 'supervisor'], 
    default: 'staff' 
  },
  permissions: [{
    action: { type: String, required: true },
    granted: { type: Boolean, default: true },
    grantedBy: { type: ObjectId, ref: 'User' },
    grantedAt: { type: Date, default: Date.now }
  }],
  isActive: { type: Boolean, default: true },
  assignedAt: { type: Date, default: Date.now },
  lastLogin: { type: Date },
  workingHours: {
    monday: { start: String, end: String, isWorking: Boolean },
    tuesday: { start: String, end: String, isWorking: Boolean },
    wednesday: { start: String, end: String, isWorking: Boolean },
    thursday: { start: String, end: String, isWorking: Boolean },
    friday: { start: String, end: String, isWorking: Boolean },
    saturday: { start: String, end: String, isWorking: Boolean },
    sunday: { start: String, end: String, isWorking: Boolean }
  },
  preferences: {
    notifications: {
      newAppointments: { type: Boolean, default: true },
      statusUpdates: { type: Boolean, default: true },
      reminders: { type: Boolean, default: true },
      systemAlerts: { type: Boolean, default: true }
    },
    dashboard: {
      defaultView: { type: String, default: 'today' },
      appointmentsPerPage: { type: Number, default: 20 }
    }
  },
  statistics: {
    totalAppointmentsHandled: { type: Number, default: 0 },
    averageProcessingTime: { type: Number, default: 0 },
    completionRate: { type: Number, default: 0 },
    userSatisfactionScore: { type: Number, default: 0 }
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}
```

### Enhanced Appointment Model Updates
```javascript
// Add these fields to existing Appointment model:
{
  assignedStaff: { type: ObjectId, ref: 'Staff' },
  comments: [{
    _id: { type: ObjectId, auto: true },
    author: { type: ObjectId, refPath: 'comments.authorType' },
    authorType: { type: String, enum: ['staff', 'user'] },
    content: { type: String, required: true },
    isVisible: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now }
  }],
  statusHistory: [{
    status: { 
      type: String, 
      enum: ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled'] 
    },
    changedBy: { type: ObjectId, ref: 'User' },
    changedAt: { type: Date, default: Date.now },
    reason: { type: String }
  }],
  resultDocuments: [{
    _id: { type: ObjectId, auto: true },
    name: { type: String, required: true },
    originalName: { type: String, required: true },
    type: { type: String, required: true },
    size: { type: Number, required: true },
    url: { type: String, required: true },
    uploadedBy: { type: ObjectId, ref: 'Staff' },
    uploadedAt: { type: Date, default: Date.now },
    isPublic: { type: Boolean, default: true }
  }],
  estimatedDuration: { type: Number, default: 30 }, // minutes
  actualDuration: { type: Number }, // minutes
  priority: { 
    type: String, 
    enum: ['low', 'normal', 'high', 'urgent'], 
    default: 'normal' 
  },
  processingNotes: { type: String },
  completedAt: { type: Date },
  rating: {
    score: { type: Number, min: 1, max: 5 },
    feedback: { type: String },
    ratedAt: { type: Date }
  }
}
```

### Notification Model
```javascript
{
  _id: ObjectId,
  recipient: { type: ObjectId, ref: 'User', required: true },
  recipientType: { type: String, enum: ['user', 'staff', 'admin'], required: true },
  type: { 
    type: String, 
    enum: ['appointment_booked', 'status_updated', 'document_ready', 'reminder', 'system_alert'],
    required: true 
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
  data: { type: Object }, // Additional context data
  isRead: { type: Boolean, default: false },
  priority: { 
    type: String, 
    enum: ['low', 'normal', 'high', 'urgent'], 
    default: 'normal' 
  },
  channels: [{ 
    type: String, 
    enum: ['in_app', 'email', 'sms', 'push'] 
  }],
  scheduledFor: { type: Date },
  sentAt: { type: Date },
  readAt: { type: Date },
  createdAt: { type: Date, default: Date.now }
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*#
## Property 1: Staff center assignment validation
*For any* staff registration attempt, the system should require valid center assignment by an administrator before granting access
**Validates: Requirements 1.1**

### Property 2: Staff authentication and redirection
*For any* valid staff login, the system should authenticate the user and redirect to their center-specific dashboard
**Validates: Requirements 1.2**

### Property 3: Center data isolation
*For any* staff member accessing the system, only appointments and data for their assigned center should be displayed
**Validates: Requirements 1.3**

### Property 4: Real-time permission updates
*For any* staff member whose center assignment changes, their access permissions should update immediately
**Validates: Requirements 1.4**

### Property 5: Center-specific appointment filtering
*For any* staff member accessing appointments, only appointments for their assigned center should be returned
**Validates: Requirements 2.1**

### Property 6: Appointment data completeness
*For any* displayed appointment, all required fields (user info, service type, date, time, status) should be present
**Validates: Requirements 2.2**

### Property 7: Appointment filtering functionality
*For any* filter criteria applied to appointments, the results should only include appointments matching those criteria
**Validates: Requirements 2.3**

### Property 8: Appointment search functionality
*For any* search term entered, results should include appointments matching user name, service name, or appointment ID
**Validates: Requirements 2.4**

### Property 9: Appointment chronological sorting
*For any* appointment list display, appointments should be sorted by date and time in ascending order
**Validates: Requirements 2.5**

### Property 10: Pending appointment action availability
*For any* pending appointment viewed by staff, accept and reject options should be available
**Validates: Requirements 3.1**

### Property 11: Appointment acceptance workflow
*For any* appointment accepted by staff, the status should change to confirmed and a notification should be sent to the user
**Validates: Requirements 3.2**

### Property 12: Valid status transitions
*For any* appointment status change, only valid transitions should be allowed (pending→confirmed→in_progress→completed)
**Validates: Requirements 3.3**

### Property 13: Completion document requirement
*For any* appointment being marked as completed, result documents must be uploaded before status change is allowed
**Validates: Requirements 3.4**

### Property 14: Cancellation workflow
*For any* appointment cancellation, a reason must be provided and user notification should be triggered
**Validates: Requirements 3.5**

### Property 15: Comment metadata integrity
*For any* comment added by staff, it should be timestamped and associated with the correct staff member
**Validates: Requirements 4.2**

### Property 16: Conditional comment notifications
*For any* comment marked as user-visible, a notification should be sent to the appointment holder
**Validates: Requirements 4.3**

### Property 17: Comment chronological ordering
*For any* appointment history view, comments should be displayed in chronological order by creation time
**Validates: Requirements 4.4**

### Property 18: Comment visibility control
*For any* comment marked as internal-only, it should not be visible to users
**Validates: Requirements 4.5**

### Property 19: File upload validation
*For any* file upload attempt, the system should validate file type, size limits, and security requirements
**Validates: Requirements 5.2**

### Property 20: Document access generation
*For any* uploaded document, secure download links should be generated for the appointment holder
**Validates: Requirements 5.3**

### Property 21: Document notification workflow
*For any* result document upload, users should be notified via email with download instructions
**Validates: Requirements 5.4**

### Property 22: Service activation logic
*For any* service selected by staff, it should be added to their center's available services list
**Validates: Requirements 6.2**

### Property 23: Service deactivation preservation
*For any* service deactivated by staff, new bookings should be prevented while existing appointments are preserved
**Validates: Requirements 6.3**

### Property 24: Real-time service updates
*For any* service availability change, the center's service offerings should update immediately
**Validates: Requirements 6.4**

### Property 25: Schedule organization
*For any* staff schedule view, appointments should be organized by date and time slots
**Validates: Requirements 7.1**

### Property 26: Time calculation accuracy
*For any* scheduled appointment, estimated completion times should be calculated based on service processing duration
**Validates: Requirements 7.3**

### Property 27: Capacity management
*For any* full schedule, the system should prevent overbooking and suggest alternative time slots
**Validates: Requirements 7.4**

### Property 28: Real-time schedule updates
*For any* appointment reschedule or cancellation, the schedule view should update immediately
**Validates: Requirements 7.5**

### Property 29: Analytics calculation accuracy
*For any* center analytics request, statistics should be correctly calculated from appointment data
**Validates: Requirements 8.1**

### Property 30: Performance metrics calculation
*For any* performance metrics display, completion rates and processing times should be calculated correctly
**Validates: Requirements 8.2**

### Property 31: Notification triggering
*For any* new appointment booked at a center, real-time notifications should be sent to assigned staff
**Validates: Requirements 9.1**

### Property 32: Time-based reminder notifications
*For any* appointment approaching within 30 minutes, reminder notifications should be sent to staff
**Validates: Requirements 9.2**

### Property 33: Priority notification handling
*For any* urgent appointment scheduled, high-priority notifications should be sent with distinct alerts
**Validates: Requirements 9.3**

### Property 34: Notification preference compliance
*For any* notification sent, it should respect the staff member's configured notification preferences
**Validates: Requirements 9.5**

### Property 35: Mobile functionality parity
*For any* core system function, it should work correctly on mobile devices
**Validates: Requirements 10.2**

### Property 36: Mobile upload functionality
*For any* document upload on mobile, camera capture and photo uploads should work with automatic compression
**Validates: Requirements 10.3**

### Property 37: Offline sync integrity
*For any* changes made while offline, they should be properly synchronized when connectivity is restored
**Validates: Requirements 10.4**

## Error Handling

### Authentication & Authorization Errors
- **Invalid Staff Credentials**: Clear error messages for incorrect login attempts
- **Center Assignment Missing**: Prevent access and guide to contact administrator
- **Permission Denied**: Informative messages when staff lack required permissions
- **Session Expiry**: Automatic redirect to login with session restoration

### Appointment Management Errors
- **Invalid Status Transitions**: Prevent illegal status changes with explanatory messages
- **Concurrent Updates**: Handle simultaneous appointment updates with conflict resolution
- **Missing Required Data**: Validate all required fields before allowing status changes
- **Capacity Exceeded**: Prevent overbooking with clear capacity indicators

### File Upload Errors
- **File Type Validation**: Reject unsupported file types with allowed format list
- **Size Limit Exceeded**: Clear messages about file size limits and compression options
- **Security Scan Failures**: Block potentially malicious files with security warnings
- **Storage Failures**: Retry mechanisms and fallback storage options

### Network & Connectivity Errors
- **API Timeouts**: Retry mechanisms with exponential backoff
- **Offline Mode**: Cache critical data and queue actions for later sync
- **Sync Conflicts**: Merge strategies for conflicting offline changes
- **Real-time Updates**: Fallback to polling when WebSocket connections fail

## Testing Strategy

### Unit Testing Approach
Unit tests will verify specific functionality and edge cases:
- Staff authentication and authorization flows
- Appointment status transition logic
- File upload validation and processing
- Notification triggering and delivery
- Analytics calculation accuracy

### Property-Based Testing Approach
Property-based tests will verify universal properties using **fast-check** library:
- Each property-based test will run a minimum of 100 iterations
- Tests will use smart generators for realistic staff, appointment, and center data
- Each test will be tagged with format: **Feature: staff-module, Property {number}: {property_text}**

**Property-Based Testing Requirements:**
- Use fast-check library for JavaScript property-based testing
- Configure each test to run minimum 100 iterations
- Generate realistic test data (staff assignments, appointments, documents)
- Test universal properties that should hold across all valid inputs

### Integration Testing
- End-to-end staff workflows from login to appointment completion
- Real-time notification delivery across different channels
- File upload and download workflows with security validation
- Mobile interface functionality and offline sync

### Performance Testing
- Dashboard loading times with large appointment datasets
- Real-time update performance with multiple concurrent staff users
- File upload performance with various file sizes and types
- Mobile interface responsiveness and data usage optimization

## Security Considerations

### Access Control
- **Role-Based Permissions**: Granular permissions for different staff actions
- **Center Isolation**: Strict data isolation between different centers
- **Session Management**: Secure session handling with automatic timeout
- **API Authentication**: JWT-based authentication for all API endpoints

### Data Protection
- **Sensitive Information**: Encryption for personal and medical data
- **File Security**: Virus scanning and secure storage for uploaded documents
- **Audit Logging**: Comprehensive logging of all staff actions and data access
- **Data Retention**: Configurable retention policies for different data types

### Communication Security
- **Notification Security**: Secure delivery of notifications with PII protection
- **API Security**: Rate limiting and input validation for all endpoints
- **File Transfer**: Encrypted file uploads and secure download links
- **Real-time Updates**: Secure WebSocket connections with authentication

## Performance Optimization

### Frontend Performance
- **Lazy Loading**: Load appointment data on-demand with pagination
- **Caching**: Client-side caching of frequently accessed data
- **Optimistic Updates**: Immediate UI updates with server confirmation
- **Mobile Optimization**: Compressed images and minimal data transfer

### Backend Performance
- **Database Indexing**: Optimized indexes for appointment queries by center and date
- **Caching Strategy**: Redis caching for frequently accessed staff and center data
- **Background Processing**: Asynchronous processing for notifications and file operations
- **Query Optimization**: Efficient database queries with proper joins and filtering

### Real-time Features
- **WebSocket Optimization**: Efficient connection management and message routing
- **Notification Batching**: Group related notifications to reduce overhead
- **Update Throttling**: Prevent excessive updates during high-activity periods
- **Connection Resilience**: Automatic reconnection and state synchronization