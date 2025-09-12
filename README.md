# Sahayak AI

This is a full-stack application with a React frontend and Express backend.

## Development Setup

### Prerequisites

- Node.js and npm installed
- MongoDB installed and running (for backend)

### Installation

1. Clone the repository
2. Install dependencies for both frontend and backend:

```bash
cd sahayak_ai
cd frontend && npm install
cd ../backend && npm install
```

### Running the Development Servers

You have two options to start both the frontend and backend development servers:

#### Option 1: Using the batch file (Windows)

Simply double-click the `start-dev.bat` file in the root directory, or run it from the command line:

```bash
./start-dev.bat
```

This will open two command prompt windows, one for the frontend and one for the backend.

#### Option 2: Using npm scripts

From the root directory, run:

```bash
npm run dev
```

This will start both the frontend and backend servers in separate windows.

### Accessing the Application

- Frontend: http://localhost:3000 (automatically opens in your default browser)
- Backend API: http://localhost:5000

## Project Structure

```
├── backend/         # Express server
│   ├── config/      # Database configuration
│   ├── middleware/  # Express middleware
│   ├── models/      # Mongoose models
│   ├── routes/      # API routes
│   └── server.js    # Server entry point
└── frontend/        # React application
    ├── public/      # Static files
    └── src/         # React source code
        ├── components/  # Reusable components
        ├── contexts/    # React contexts
        ├── pages/       # Page components
        └── App.jsx      # Main application component
```