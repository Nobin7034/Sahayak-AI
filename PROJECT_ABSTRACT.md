# Sahayak AI (Akshaya Services) - Project Abstract

## Executive Summary

**Sahayak AI**, also branded as **Akshaya Services**, is a comprehensive full-stack web application designed to digitize and streamline government service management and citizen engagement in India. The platform serves as an integrated e-governance solution that enables citizens to book appointments, apply for government services, track application statuses, and stay informed about government initiatives through a modern, user-friendly interface.

## Project Overview

### Purpose
The application aims to bridge the gap between citizens and government services by providing a transparent, efficient, and accessible platform for:
- Service discovery and information
- Appointment scheduling and management
- Document requirement tracking
- Payment processing for service charges
- News and announcement distribution
- Administrative oversight and management

### Technology Stack

#### Frontend
- **Framework**: React 18.3 (with Vite 5.4)
- **UI Library**: React Router DOM 6.8 for routing
- **Styling**: Tailwind CSS 3.4 with PostCSS
- **Icons**: Lucide React
- **Authentication**: Firebase 12.2 (Google OAuth) + JWT
- **HTTP Client**: Axios 1.6
- **Testing**: Playwright 1.40 for end-to-end testing
- **Deployment**: Static build served from Express backend

#### Backend
- **Runtime**: Node.js (ES Modules)
- **Framework**: Express 4.21
- **Database**: MongoDB with Mongoose 8.17
- **Authentication**: JWT (jsonwebtoken 9.0) + Firebase Admin 13.5
- **Payment Integration**: Razorpay 2.9
- **File Upload**: Multer 1.4
- **Email Service**: Nodemailer 6.9
- **Security**: bcryptjs 2.4, CORS 2.8

### Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Single Web Service                    │
│  ┌─────────────────────────────────────────────────┐   │
│  │            Express Backend Server                │   │
│  │                                                   │   │
│  │  ┌───────────────────────────────────────────┐   │   │
│  │  │        REST API (Production: /api/*)      │   │   │
│  │  │  • Authentication                         │   │   │
│  │  │  • Services Management                    │   │   │
│  │  │  • Appointment Scheduling                 │   │   │
│  │  │  • Payment Processing (Razorpay)          │   │   │
│  │  │  • News & Notifications                   │   │   │
│  │  │  • Admin Operations                       │   │   │
│  │  └───────────────────────────────────────────┘   │   │
│  │                                                   │   │
│  │  ┌───────────────────────────────────────────┐   │   │
│  │  │    Static Frontend Build (React SPA)       │   │   │
│  │  │  Served at root, handles client-side      │   │   │
│  │  │  routing for all non-API requests         │   │   │
│  │  └───────────────────────────────────────────┘   │   │
│  └───────────────────────────────────────────────────┘   │
│                                                          │
│  MongoDB Database (Mongoose ODM)                        │
│  • Users (with role-based access)                       │
│  • Services (government services catalog)              │
│  • Appointments (booking & status tracking)            │
│  • News (announcements & updates)                      │
│  • Notifications (real-time updates)                   │
│  • Document Templates                                   │
│  • Holidays (service availability)                      │
└─────────────────────────────────────────────────────────┘
```

**Deployment**: Single Render Web Service hosting both backend API and frontend build, using MongoDB Atlas cloud database.

## Core Features

### 1. **User Authentication & Authorization**
- **Dual Authentication System**:
  - Traditional email/password authentication with JWT tokens
  - Google OAuth 2.0 integration via Firebase Authentication
- **Role-Based Access Control (RBAC)**:
  - Regular users: Can book appointments, browse services, view news
  - Admin users: Full system management capabilities
- **Security Features**:
  - Password hashing with bcryptjs
  - Token-based authentication with JWT
  - Protected routes on both frontend and backend
  - Google OAuth token verification via Firebase Admin SDK

### 2. **Service Catalog Management**
- **Comprehensive Service Information**:
  - Service name, description, and categorization
  - Processing time and fee structure
  - Service charges (upfront booking fees)
  - Active/inactive service status
- **Document Requirements System**:
  - Mandatory and optional document tracking
  - Rich document structure with alternatives
  - Document template references
  - Image URL integration for document samples
  - Pre-check rules before service application
- **Service Analytics**:
  - Visit count tracking
  - Created by admin tracking
  - Timestamps for creation and updates

### 3. **Appointment Management System**
- **Booking Capabilities**:
  - Service selection
  - Date and time slot selection
  - Optional notes for appointment-specific requirements
  - Document upload integration
- **Status Tracking**:
  - Pending: Awaiting confirmation
  - Confirmed: Appointment scheduled
  - Completed: Service delivered
  - Cancelled: Appointment terminated
- **User Experience Features**:
  - Inline editing of appointments (with time restrictions)
  - Cannot edit within 3 hours of appointment time
  - Dashboard view with appointment history
  - Quick stats for completed, in-progress, and upcoming appointments

### 4. **Integrated Payment System**
- **Payment Gateway**: Razorpay integration
- **Payment Tracking**:
  - Order ID, Payment ID, and Signature tracking
  - Payment status (unpaid, paid, refunded, failed)
  - Currency support (default INR)
  - Payment history log
- **Refund Management**:
  - Refund request processing
  - Refund status tracking
  - Refund ID management
- **Service Charge Collection**:
  - Upfront booking fees
  - Configurable per service
  - Automatic amount calculation

### 5. **Content Management**
- **News & Announcements**:
  - Image upload support (Multer)
  - Rich content for government updates
  - Category-based organization
  - Latest news API endpoint
  - Admin-driven content publication
- **Notifications System**:
  - Real-time notification counts
  - Bell icon with unread badges
  - Notification history
  - Mark as read functionality
  - User-specific notifications

### 6. **Admin Dashboard**
- **User Management**:
  - User list with role assignment
  - Active/inactive status management
  - User profile administration
- **Service Administration**:
  - Create, edit, delete services
  - Service activation/deactivation
  - Document requirement configuration
  - Template management
- **Appointment Management**:
  - View all user appointments
  - Status updates
  - Appointment filtering
- **Content Administration**:
  - News article creation and editing
  - Holiday calendar management
  - System settings configuration

### 7. **Responsive Design**
- **Mobile-First Approach**: Tailwind CSS responsive utilities
- **Navigation**:
  - Desktop menu with full functionality
  - Mobile hamburger menu
  - Touch-friendly interactions
- **Component Architecture**:
  - Reusable UI components (Navbar, Footer, ProtectedRoute)
  - Layout components (AdminLayout)
  - Context-based state management (AuthContext)

### 8. **File Management**
- **Upload Handling**:
  - Static file serving from `/uploads` endpoint
  - Image upload for news articles
  - Document upload for appointments
  - Multer-based file processing
- **File Organization**:
  - Timestamp-based filename generation
  - Unique identifier injection
  - Organized uploads directory structure

## User Journey

### Citizen Journey
1. **Discovery**: Browse available government services
2. **Information Gathering**: View service details, required documents, fees
3. **Registration**: Sign up via email/password or Google OAuth
4. **Appointment Booking**: Select service, choose date/time slot
5. **Payment Processing**: Pay service charges via Razorpay
6. **Document Preparation**: Review required documents, upload if needed
7. **Tracking**: Monitor appointment status through dashboard
8. **Updates**: Receive notifications about appointment changes
9. **Completion**: Mark appointment as completed after service delivery

### Administrator Journey
1. **Access**: Login with admin credentials
2. **User Management**: Monitor and manage user accounts
3. **Service Management**: Add/edit/remove services
4. **Appointment Oversight**: Track all appointments, update statuses
5. **Content Management**: Publish news, manage holidays
6. **Analytics**: View service popularity, appointment statistics
7. **System Configuration**: Adjust settings, manage templates

## Technical Implementation Highlights

### Backend Architecture
- **Modular Route Design**:
  - `/api/auth`: Authentication endpoints
  - `/api/admin`: Admin-specific operations
  - `/api/services`: Service catalog management
  - `/api/appointments`: Booking management
  - `/api/news`: Content distribution
  - `/api/payments`: Transaction processing
  - `/api/notifications`: Real-time updates
- **Middleware Integration**:
  - Authentication verification
  - Role-based access control
  - Error handling
  - Request validation
- **Database Models**:
  - User model with dual authentication support
  - Service model with rich document structure
  - Appointment model with payment integration
  - News, Notification, Holiday models
  - DocumentTemplate model for reusable templates

### Frontend Architecture
- **Component Hierarchy**:
  - Page-level components (Dashboard, Services, Appointments)
  - Layout components (AdminLayout, ProtectedRoute)
  - Reusable UI components (Navbar, Footer)
- **State Management**:
  - AuthContext for global authentication state
  - Axios interceptors for token management
  - Local component state for UI interactions
- **Routing Strategy**:
  - Public routes (Landing, Login, Register)
  - Protected routes (Dashboard, Services, Appointments)
  - Admin-only routes (Admin dashboard pages)
- **Authentication Flow**:
  - Email/password: Backend JWT issuance
  - Google OAuth: Firebase client-side auth + backend token exchange

## Data Models

### User Schema
```javascript
{
  name: String,
  email: String (unique),
  password: String (conditional),
  googleId: String (indexed),
  provider: 'local' | 'google',
  avatar: String,
  phone: String,
  role: 'user' | 'admin',
  lastLogin: Date,
  isActive: Boolean,
  createdAt: Date
}
```

### Service Schema
```javascript
{
  name: String,
  description: String,
  category: String,
  fee: Number,
  serviceCharge: Number,
  processingTime: String,
  preCheckRules: [String],
  documents: [{
    name: String,
    requirement: 'mandatory' | 'optional',
    notes: String,
    template: ObjectId,
    imageUrl: String,
    alternatives: Array
  }],
  isActive: Boolean,
  visitCount: Number,
  createdBy: ObjectId (User),
  createdAt: Date,
  updatedAt: Date
}
```

### Appointment Schema
```javascript
{
  user: ObjectId (User),
  service: ObjectId (Service),
  appointmentDate: Date,
  timeSlot: String,
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled',
  payment: {
    status: 'unpaid' | 'paid' | 'refunded' | 'failed',
    amount: Number,
    currency: String,
    orderId: String,
    paymentId: String,
    signature: String,
    refundId: String,
    refundStatus: String,
    gateway: String,
    history: Array
  },
  notes: String,
  documents: Array,
  createdAt: Date,
  updatedAt: Date
}
```

## Security Features

1. **Authentication Security**:
   - JWT token-based authentication
   - Password hashing with bcrypt (12 rounds)
   - Google OAuth token verification via Firebase Admin
   - Token expiration handling
   - Secure cookie configuration

2. **API Security**:
   - Role-based access control middleware
   - Protected route enforcement
   - Input validation
   - SQL injection prevention (MongoDB NoSQL)
   - CORS configuration

3. **Payment Security**:
   - Razorpay secure payment gateway
   - Payment signature verification
   - Refund security checks
   - Transaction history logging

4. **File Upload Security**:
   - File type validation
   - File size restrictions
   - Unique filename generation
   - Secure file serving

## Testing & Quality Assurance

- **End-to-End Testing**: Playwright framework integration
- **Test Coverage**:
  - Login functionality
  - API accessibility
  - User authentication flows
  - Google OAuth flow
- **Development Scripts**:
  - Test environment setup
  - Mock data generation
  - Automated test execution

## Deployment Architecture

### Production Environment
- **Host**: Render Web Service
- **URL**: `https://sahayak-ai-c7ol.onrender.com`
- **Database**: MongoDB Atlas cloud instance
- **Build Process**:
  - Frontend build generates static assets to `dist/`
  - Backend serves both API and static files
  - Single origin deployment (no CORS issues)
- **Environment Variables**:
  - `NODE_ENV`: production
  - `MONGODB_URI`: Atlas connection string
  - `JWT_SECRET`: Token signing secret
  - `VITE_GOOGLE_CLIENT_ID`: OAuth client ID
  - Razorpay credentials

### Development Environment
- **Frontend**: Vite dev server on `localhost:5173`
- **Backend**: Express server on `localhost:5000`
- **Hot Module Replacement**: Real-time development feedback
- **Environment Configuration**: Local `.env` files

## Performance Optimizations

1. **Frontend Optimizations**:
   - Vite build for fast development
   - Code splitting for reduced initial load
   - React lazy loading for routes
   - Optimized bundle size

2. **Backend Optimizations**:
   - Mongoose indexing on frequently queried fields
   - Efficient database queries with population
   - Static file caching
   - Lean query methods

3. **Database Optimizations**:
   - Indexed fields for fast lookups
   - Proper schema design
   - Efficient population strategies

## Scalability Considerations

- **Horizontal Scaling**: Stateless API design allows multiple instances
- **Database Scalability**: MongoDB Atlas handles replication and sharding
- **CDN Integration**: Static assets can be served via CDN
- **Caching Strategy**: Redis integration potential for session management
- **Load Balancing**: Render's built-in load balancing

## Future Enhancements

1. **Advanced Features**:
   - SMS notifications via Twilio
   - Email notifications for appointments
   - Multi-language support
   - Dark mode theme
   - Advanced search and filtering
   - Appointment history analytics

2. **Integration Opportunities**:
   - Aadhaar verification integration
   - Government document verification APIs
   - Third-party service provider integration
   - Multi-payment gateway support

3. **Mobile Development**:
   - Progressive Web App (PWA) capabilities
   - React Native mobile app
   - Push notification support

4. **Analytics & Reporting**:
   - Admin dashboard with charts and graphs
   - Service usage analytics
   - User behavior tracking
   - Performance monitoring

## Conclusion

**Sahayak AI (Akshaya Services)** represents a modern, scalable solution for e-governance in India. By combining cutting-edge web technologies with user-centric design, the platform provides a seamless experience for both citizens seeking government services and administrators managing the system. The application's modular architecture, robust security features, and comprehensive functionality make it a viable solution for digitizing government service delivery and improving citizen engagement.

The project demonstrates proficiency in:
- Full-stack development with JavaScript ecosystem
- Modern authentication patterns (JWT + OAuth)
- Payment gateway integration
- Responsive design principles
- Database design and optimization
- Deployment and DevOps practices
- Testing and quality assurance

**Technology Keywords**: React, Express, MongoDB, JWT, Google OAuth, Firebase, Razorpay, Tailwind CSS, Vite, Playwright, E-governance, Digital India

**Project Repository**: https://github.com/Nobin7034/Sahayak-AI  
**Live Application**: https://sahayak-ai-c7ol.onrender.com

