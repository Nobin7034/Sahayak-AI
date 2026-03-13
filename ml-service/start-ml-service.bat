@echo off
echo ========================================
echo Starting ML Service
echo ========================================
echo.

REM Check if virtual environment exists
if not exist "venv\Scripts\activate.bat" (
    echo Virtual environment not found!
    echo Please run setup.bat first
    pause
    exit /b 1
)

REM Check if model file exists
if not exist "models\document_authentication_model.h5" (
    echo WARNING: Model file not found!
    echo Please place document_authentication_model.h5 in ml-service/models/ directory
    echo.
    pause
)

echo Activating virtual environment...
call venv\Scripts\activate.bat

echo.
echo Starting Flask ML API on port 5001...
echo.
python app.py

pause
