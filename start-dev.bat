@echo off
echo Starting Sahayak AI development servers...

start cmd /k "cd frontend && npm run dev"
start cmd /k "cd backend && npm run dev"

echo Both servers have been started in separate windows.
echo The frontend will automatically open in your default browser.