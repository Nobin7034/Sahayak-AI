@echo off
echo Starting Sahayak AI development servers...

start cmd /k "cd frontend && npm run dev"
start cmd /k "cd backend && npm run dev"
start cmd /k "cd ml-service && start-ml-service.bat"

echo All three servers have been started in separate windows:
echo - Frontend: http://localhost:3000
echo - Backend: http://localhost:5000
echo - ML Service: http://localhost:5001
echo.
echo The frontend will automatically open in your default browser.