# Sahayak AI

A full-stack service management platform with appointment scheduling and comprehensive admin dashboard.

## 🚀 Features

### User Features
- **Authentication & Authorization**
  - JWT-based authentication
  - Firebase authentication
  - Google OAuth integration
  - User registration and login

- **Service Management**
  - Browse available services
  - View detailed service information
  - Book appointments
  - Track appointment history

- **News & Updates**
  - Read latest news and announcements
  - View detailed news articles
  - Stay updated with platform updates

- **User Dashboard**
  - Personal profile management
  - Appointment tracking
  - Service history

- **Multi-language Support**
  - Language context for internationalization

### Admin Features
- **Admin Dashboard**
  - Comprehensive analytics and statistics
  - User management
  - Service management
  - News management
  - Appointment management
  - System settings

- **Content Management**
  - Create and manage services
  - Publish news articles
  - Manage user accounts
  - Handle appointments

## 🛠️ Tech Stack

### Frontend
- **React 18** - UI library
- **Vite** - Build tool and dev server
- **React Router DOM** - Routing
- **Tailwind CSS** - Styling
- **Firebase** - Authentication
- **Axios** - HTTP client
- **Lucide React** - Icons
- **Playwright** - E2E testing

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database (via Mongoose)
- **Firebase Admin** - Server-side Firebase
- **JWT** - Authentication tokens
- **Bcryptjs** - Password hashing
- **Multer** - File uploads
- **Razorpay** - Payment integration
- **Nodemailer** - Email service
- **RSS Parser** - RSS feed parsing

## 📋 Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or cloud instance)
- Firebase project (for authentication)
- Google OAuth credentials (optional, for Google login)
- Razorpay account (optional, for payments)

## 🔧 Installation

### 1. Clone the repository
```bash
git clone <repository-url>
cd sahayak_ai
```

### 2. Install dependencies
```bash
# Install all dependencies (frontend + backend)
npm run install-all

# Or install separately
cd frontend && npm install
cd ../backend && npm install
```

### 3. Environment Setup

#### Backend Environment Variables
Create a `.env` file in the `backend` directory:
```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_PRIVATE_KEY=your_firebase_private_key
FIREBASE_CLIENT_EMAIL=your_firebase_client_email
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_email_password
```

#### Frontend Environment Variables
Create a `.env` file in the `frontend` directory:
```env
VITE_API_URL=http://localhost:5000
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
VITE_FIREBASE_APP_ID=your_firebase_app_id
VITE_GOOGLE_CLIENT_ID=your_google_oauth_client_id
```

### 4. Database Setup
- Ensure MongoDB is running (local or cloud)
- Update `MONGODB_URI` in backend `.env` file

### 5. Seed Initial Data (Optional)
```bash
cd backend
npm run seed
```

## 🚀 Running the Application

### Development Mode

#### Option 1: Run both frontend and backend together
```bash
npm run dev
```

#### Option 2: Run separately
```bash
# Terminal 1 - Backend
npm run backend

# Terminal 2 - Frontend
npm run frontend
```

### Production Mode
```bash
# Build frontend
cd frontend
npm run build

# Start backend
cd backend
npm start
```

The application will be available at:
- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:5000`

## 📁 Project Structure

```
sahayak_ai/
├── backend/
│   ├── config/          # Database and Firebase configuration
│   ├── middleware/      # Authentication middleware
│   ├── models/          # MongoDB models
│   ├── routes/          # API routes
│   ├── scripts/         # Utility scripts (seeding, testing)
│   ├── services/        # Business logic
│   ├── uploads/         # Uploaded files (avatars, news images)
│   └── server.js        # Express server entry point
│
├── frontend/
│   ├── src/
│   │   ├── components/  # Reusable React components
│   │   ├── contexts/    # React contexts (Auth, Language)
│   │   ├── pages/       # Page components
│   │   ├── services/    # API service functions
│   │   ├── config/      # Configuration files
│   │   └── data/        # Static data and translations
│   ├── tests/           # Playwright E2E tests
│   └── public/          # Static assets
│
└── package.json         # Root package.json with scripts
```

## 🧪 Testing

### Playwright E2E Tests (80+ Tests)

The project includes a comprehensive Playwright E2E test suite with 80+ tests covering all core functionalities.

#### Quick Start
```bash
cd frontend
npm install
npx playwright install
npm run test:e2e
```

#### Test Commands
```bash
# Run all tests
npm run test:e2e

# Interactive UI mode (Recommended)
npm run test:e2e:ui

# Run with visible browser
npm run test:e2e:headed

# Debug mode
npm run test:e2e:debug

# Specific browser
npm run test:e2e:chromium
npm run test:e2e:firefox
npm run test:e2e:webkit

# Mobile tests
npm run test:e2e:mobile

# View HTML report
npm run test:report

# Generate Allure report
npm run test:allure

# Generate test summary
npm run test:summary
```

#### Test Coverage
- ✅ Landing Page & Navigation (8 tests)
- ✅ Authentication (13 tests)
- ✅ Services Management (13 tests)
- ✅ Appointments (12 tests)
- ✅ User Dashboard (9 tests)
- ✅ News & Content (10 tests)
- ✅ Admin Dashboard (11 tests)
- ✅ Admin User Management (13 tests)
- ✅ Admin Services (8 tests)
- ✅ Admin Appointments (5 tests)
- ✅ Admin Centers (8 tests)
- ✅ Admin Staff (10 tests)
- ✅ Staff Dashboard (14 tests)
- ✅ Document Management (11 tests)
- ✅ Center Finder (12 tests)
- ✅ Navigation (11 tests)
- ✅ Responsive Design (13 tests)
- ✅ Accessibility (13 tests)
- ✅ Performance (11 tests)
- ✅ Error Handling (12 tests)

#### Documentation
- **START_TESTING.md** - Quick start guide
- **QUICK_TEST_REFERENCE.md** - Command reference
- **frontend/TESTING_GUIDE.md** - Complete testing guide
- **frontend/TEST_DOCUMENTATION.md** - Detailed test docs
- **TEST_SETUP_COMPLETE.md** - Setup summary

#### Windows Users
Double-click **`run-tests.bat`** for an interactive test menu.

## 📝 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/google` - Google OAuth login
- `GET /api/auth/me` - Get current user

### Services
- `GET /api/services` - Get all services
- `GET /api/services/:id` - Get service details
- `POST /api/services` - Create service (Admin)
- `PUT /api/services/:id` - Update service (Admin)
- `DELETE /api/services/:id` - Delete service (Admin)

### Appointments
- `GET /api/appointments` - Get user appointments
- `POST /api/appointments` - Create appointment
- `PUT /api/appointments/:id` - Update appointment
- `DELETE /api/appointments/:id` - Cancel appointment

### News
- `GET /api/news` - Get all news
- `GET /api/news/:id` - Get news details
- `POST /api/news` - Create news (Admin)
- `PUT /api/news/:id` - Update news (Admin)
- `DELETE /api/news/:id` - Delete news (Admin)

### Admin
- `GET /api/admin/dashboard` - Admin dashboard stats
- `GET /api/admin/users` - Get all users
- `PUT /api/admin/users/:id` - Update user (Admin)

## 🔐 Security Features

- JWT token-based authentication
- Password hashing with bcrypt
- Protected routes (user and admin)
- CORS configuration
- Input validation
- File upload security

## 📄 License

This project is private and proprietary.

## 👥 Contributing

This is a private project. For contributions, please contact the project maintainers.

## 📞 Support

For issues and questions, please create an issue in the repository or contact the development team.

---

**Note**: Make sure to configure all environment variables before running the application. Refer to the setup guides in the `frontend` directory for Firebase and Google OAuth configuration.


