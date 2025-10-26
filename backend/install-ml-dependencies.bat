@echo off
echo Installing ML dependencies for Sahayak AI...
echo.

echo Installing ml-knn...
npm install ml-knn@^2.1.0

echo Installing ml-bayes...
npm install ml-bayes@^0.0.1

echo Installing ml-cart...
npm install ml-cart@^2.0.0

echo.
echo ML dependencies installed successfully!
echo.
echo Available ML algorithms:
echo - K-Nearest Neighbors (KNN) for service recommendations
echo - Bayesian Classifier for service categorization
echo - Decision Tree for appointment scheduling optimization
echo.
echo You can now start the server and access ML features at /api/ml
pause
