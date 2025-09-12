@echo off
echo Starting backend server...
start cmd /k "cd backend && npm run dev"
echo Starting frontend server...
start cmd /k "cd frontend && npm run dev"
echo Both servers started. Please check the command windows for any errors.
echo.
echo After the servers are running, please test the Google login with the following steps:
echo 1. Open the frontend in your browser (http://localhost:5173 or the URL shown in the frontend terminal)
echo 2. Go to the login page
echo 3. Select the appropriate role (user or admin)
echo 4. Click "Login with Google" and select your account
echo 5. Check the browser console (F12) and backend terminal for detailed logs
echo.
echo Press any key to close this window...
pause > nul