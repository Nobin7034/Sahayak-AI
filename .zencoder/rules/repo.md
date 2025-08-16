---
description: Repository Information Overview
alwaysApply: true
---

# Sahayak AI Information

## Summary
Sahayak AI is a web application for Akshaya Services, consisting of a React frontend and Express.js backend. The application provides various government services like civil registration, with features including user authentication, service browsing, appointment management, and news updates.

## Structure
- **frontend/**: React application built with Vite
- **backend/**: Express.js API server
- **.zencoder/**: Configuration for Zencoder
- **.bolt/**: Configuration files

## Projects

### Frontend (React Application)
**Configuration File**: frontend/package.json

#### Language & Runtime
**Language**: JavaScript (React)
**Version**: React 18.3.1
**Build System**: Vite 5.4.2
**Package Manager**: npm

#### Dependencies
**Main Dependencies**:
- react: ^18.3.1
- react-dom: ^18.3.1
- react-router-dom: ^6.8.0
- lucide-react: ^0.344.0
- axios: ^1.6.0

**Development Dependencies**:
- @vitejs/plugin-react: ^4.3.1
- tailwindcss: ^3.4.1
- postcss: ^8.4.35
- autoprefixer: ^10.4.18

#### Build & Installation
```bash
cd frontend
npm install
npm run dev    # Development server
npm run build  # Production build
```

#### Main Files
**Entry Point**: frontend/src/main.jsx
**App Component**: frontend/src/App.jsx
**Routing**: React Router with protected routes
**Styling**: TailwindCSS

### Backend (Express.js API)
**Configuration File**: backend/package.json

#### Language & Runtime
**Language**: JavaScript (Node.js)
**Version**: Node.js (ES Modules)
**Package Manager**: npm

#### Dependencies
**Main Dependencies**:
- express: ^4.18.2
- mongoose: ^8.0.0
- cors: ^2.8.5
- dotenv: ^16.3.1
- bcryptjs: ^2.4.3
- jsonwebtoken: ^9.0.2
- multer: ^1.4.5
- nodemailer: ^6.9.7

**Development Dependencies**:
- nodemon: ^3.0.1

#### Build & Installation
```bash
cd backend
npm install
npm run dev    # Development with auto-reload
npm start      # Production
```

#### Main Files
**Entry Point**: backend/server.js
**Environment**: backend/.env
**Database**: MongoDB (configured in .env)

#### Configuration
**Port**: 5000 (default)
**Environment**: development
**Database**: MongoDB (mongodb://localhost:27017/akshaya-services)