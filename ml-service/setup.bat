@echo off
echo ========================================
echo ML Service Setup
echo ========================================
echo.

echo Creating Python virtual environment...
python -m venv venv

echo.
echo Activating virtual environment...
call venv\Scripts\activate.bat

echo.
echo Installing dependencies...
pip install --upgrade pip
pip install -r requirements.txt

echo.
echo ========================================
echo Setup Complete!
echo ========================================
echo.
echo IMPORTANT: Place your document_authentication_model.h5 file in the ml-service/models/ directory
echo.
echo To start the ML service, run: start-ml-service.bat
echo.
pause
