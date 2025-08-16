# Admin System Setup Guide

This guide will help you set up the admin system for the Sahayak AI application.

## Features Added

### Backend Features
- **User Role Management**: Added role-based authentication (user/admin)
- **Admin Authentication**: Separate admin login with JWT tokens
- **Service Management**: CRUD operations for government services
- **News Management**: Create, edit, and publish news articles
- **Appointment Management**: View and manage customer appointments
- **User Management**: View and manage customer accounts
- **Dashboard Analytics**: Statistics and insights for admin

### Frontend Features
- **Admin/User Login Toggle**: Option to login as admin or customer
- **Admin Dashboard**: Comprehensive dashboard with statistics
- **Admin Panel**: Separate admin interface with sidebar navigation
- **Service Management UI**: Add, edit, and manage services
- **News Management UI**: Create and publish news articles
- **Appointment Management UI**: View and update appointment status
- **User Management UI**: View and manage customer accounts

## Setup Instructions

### 1. Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies (if not already installed):
   ```bash
   npm install
   ```

3. Seed the database with admin user and sample data:
   ```bash
   npm run seed
   ```

4. Start the backend server:
   ```bash
   npm run dev
   ```

### 2. Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies (if not already installed):
   ```bash
   npm install
   ```

3. Start the frontend development server:
   ```bash
   npm run dev
   ```

## Default Admin Credentials

After running the seed script, you can login as admin with:

- **Email**: `admin@akshaya.gov.in`
- **Password**: `admin123`
- **Role**: Select "Admin" on the login page

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login (user/admin)
- `POST /api/auth/register` - Register new user
- `GET /api/auth/me` - Get current user info

### Admin Routes (Requires Admin Authentication)
- `GET /api/admin/dashboard-stats` - Dashboard statistics
- `GET /api/admin/users` - Get all users
- `PATCH /api/admin/users/:id/status` - Update user status
- `GET /api/admin/services` - Get all services
- `POST /api/admin/services` - Create new service
- `PUT /api/admin/services/:id` - Update service
- `DELETE /api/admin/services/:id` - Delete service
- `GET /api/admin/news` - Get all news
- `POST /api/admin/news` - Create news
- `PUT /api/admin/news/:id` - Update news
- `DELETE /api/admin/news/:id` - Delete news
- `GET /api/admin/appointments` - Get all appointments
- `PATCH /api/admin/appointments/:id/status` - Update appointment status

### Public Routes
- `GET /api/services` - Get active services
- `GET /api/services/:id` - Get service details
- `GET /api/news` - Get published news
- `GET /api/news/:id` - Get news details

### User Routes (Requires User Authentication)
- `GET /api/appointments` - Get user appointments
- `POST /api/appointments` - Create appointment
- `PUT /api/appointments/:id` - Update appointment
- `DELETE /api/appointments/:id` - Cancel appointment

## Admin Panel Features

### Dashboard
- Total users, services, appointments statistics
- Most visited services
- Recent appointments
- Quick action buttons

### User Management
- View all registered customers
- Activate/deactivate user accounts
- Search and filter users
- Pagination support

### Service Management
- Add new government services
- Edit existing services
- Set fees and processing times
- Manage required documents
- Toggle service availability

### News Management
- Create news articles
- Edit and update news
- Publish/unpublish news
- Categorize news (announcement, update, alert, general)
- Track view counts

### Appointment Management
- View all customer appointments
- Filter by status (pending, confirmed, completed, cancelled)
- Update appointment status
- Add notes to appointments
- Search appointments

## Database Models

### User Model
- name, email, password, phone
- role (user/admin)
- isActive, lastLogin, createdAt

### Service Model
- name, description, category, fee
- processingTime, requiredDocuments
- isActive, visitCount, createdBy

### News Model
- title, content, summary, category
- isPublished, publishDate, viewCount
- createdBy, createdAt, updatedAt

### Appointment Model
- user, service, appointmentDate, timeSlot
- status, notes, documents
- createdAt, updatedAt

## Security Features

- JWT-based authentication
- Role-based access control
- Password hashing with bcrypt
- Protected admin routes
- Input validation and sanitization

## Usage Tips

1. **First Time Setup**: Run the seed script to create admin user and sample data
2. **Admin Access**: Always select "Admin" role when logging in as administrator
3. **Service Management**: Add required documents as comma-separated values
4. **News Publishing**: Use the publish toggle to make news visible to users
5. **Appointment Status**: Update appointment status to keep customers informed

## Troubleshooting

1. **Login Issues**: Ensure you're selecting the correct role (Admin/Customer)
2. **Database Connection**: Check MongoDB connection string in .env file
3. **CORS Issues**: Ensure backend is running on port 5000
4. **Authentication Errors**: Check JWT_SECRET in environment variables

## Next Steps

1. Add email notifications for appointment updates
2. Implement file upload for service documents
3. Add more detailed analytics and reports
4. Implement audit logs for admin actions
5. Add bulk operations for user management