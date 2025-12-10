# Sahayak AI

A full-stack AI-powered service management platform with intelligent recommendations, appointment scheduling, and comprehensive admin dashboard.

## 🚀 Features

### User Features
- **Authentication & Authorization**
  - JWT-based authentication
  - Firebase authentication
  - Google OAuth integration
  - User registration and login

- **AI-Powered Services**
  - ML-based service recommendations (KNN, Naive Bayes, Decision Tree)
  - Intelligent appointment scheduling
  - Personalized service suggestions

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

- **ML Model Management**
  - ML model training and monitoring
  - Model performance analytics
  - Recommendation system administration

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

### Machine Learning
- **ml-knn** - K-Nearest Neighbors algorithm
- **ml-naivebayes** - Naive Bayes classifier
- **ml-cart** - Decision Tree algorithm

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
│   ├── services/        # Business logic and ML services
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

### Run Playwright Tests
```bash
cd frontend

# Run all tests
npm test

# Run tests in headed mode
npm run test:headed

# Run tests with UI
npm run test:ui

# Debug tests
npm run test:debug

# View test report
npm run test:report
```

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

### ML Services
- `POST /api/ml/recommend` - Get service recommendations
- `POST /api/ml/schedule` - Get optimal scheduling suggestions
- `GET /api/ml/stats` - Get ML model statistics (Admin)

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

## 🤖 Machine Learning

The application uses three ML algorithms for intelligent recommendations:

1. **K-Nearest Neighbors (KNN)** - Service recommendations based on similar users
2. **Naive Bayes** - Probabilistic service recommendations
3. **Decision Tree** - Rule-based service recommendations

Models are automatically trained on startup and retrained periodically based on user interactions.

## 📄 License

This project is private and proprietary.

## 👥 Contributing

This is a private project. For contributions, please contact the project maintainers.

## 📞 Support

For issues and questions, please create an issue in the repository or contact the development team.

---

**Note**: Make sure to configure all environment variables before running the application. Refer to the setup guides in the `frontend` directory for Firebase and Google OAuth configuration.

