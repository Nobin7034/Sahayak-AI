@echo off
echo ========================================
echo Sahayak AI - Playwright Test Runner
echo ========================================
echo.

REM Check if node_modules exists
if not exist "frontend\node_modules" (
    echo Installing frontend dependencies...
    cd frontend
    call npm install
    cd ..
)

REM Check if Playwright browsers are installed
echo Checking Playwright browsers...
cd frontend
call npx playwright install >nul 2>&1
cd ..

echo.
echo Starting tests...
echo.
echo Options:
echo 1. Run all tests (headless)
echo 2. Run tests with browser visible
echo 3. Run tests in UI mode (interactive)
echo 4. Run tests in debug mode
echo 5. Run specific browser tests
echo 6. View test report
echo 7. Generate Allure report
echo 8. Exit
echo.

set /p choice="Enter your choice (1-8): "

cd frontend

if "%choice%"=="1" (
    echo Running all tests in headless mode...
    call npm run test:e2e
    call npm run test:summary
    echo.
    echo Test report generated! Run option 6 to view.
) else if "%choice%"=="2" (
    echo Running tests with visible browser...
    call npm run test:e2e:headed
) else if "%choice%"=="3" (
    echo Opening Playwright UI mode...
    call npm run test:e2e:ui
) else if "%choice%"=="4" (
    echo Running tests in debug mode...
    call npm run test:e2e:debug
) else if "%choice%"=="5" (
    echo.
    echo Select browser:
    echo 1. Chrome
    echo 2. Firefox
    echo 3. Safari (WebKit)
    echo 4. Mobile browsers
    set /p browser="Enter choice (1-4): "
    
    if "!browser!"=="1" (
        call npm run test:e2e:chromium
    ) else if "!browser!"=="2" (
        call npm run test:e2e:firefox
    ) else if "!browser!"=="3" (
        call npm run test:e2e:webkit
    ) else if "!browser!"=="4" (
        call npm run test:e2e:mobile
    )
) else if "%choice%"=="6" (
    echo Opening test report...
    call npm run test:report
) else if "%choice%"=="7" (
    echo Generating Allure report...
    call npm run test:allure
) else if "%choice%"=="8" (
    echo Exiting...
    cd ..
    exit /b 0
) else (
    echo Invalid choice!
)

cd ..
echo.
echo ========================================
echo Tests completed!
echo ========================================
pause
