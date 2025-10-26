# Machine Learning Implementation - Sahayak AI

This document describes the implementation of 3 machine learning algorithms in the Sahayak AI project.

## 🤖 Implemented Algorithms

### 1. K-Nearest Neighbors (KNN) - Service Recommendations
- **Purpose**: Recommend services to users based on their behavior patterns
- **Algorithm**: `ml-knn` library
- **Features Used**: Service fee, category, processing time, popularity
- **Training Data**: User appointment history and service interactions
- **API Endpoint**: `GET /api/ml/recommendations`

### 2. Bayesian Classifier - Service Categorization
- **Purpose**: Automatically categorize services based on their features
- **Algorithm**: `ml-bayes` library (Gaussian Naive Bayes)
- **Features Used**: Service fee, processing time, popularity, service charge
- **Training Data**: Existing service categories
- **API Endpoint**: `POST /api/ml/categorize`

### 3. Decision Tree - Appointment Scheduling Optimization
- **Purpose**: Predict optimal appointment times for better success rates
- **Algorithm**: `ml-cart` library
- **Features Used**: Day of week, hour, month, service characteristics
- **Training Data**: Historical appointment success/failure data
- **API Endpoint**: `GET /api/ml/schedule/optimal/:serviceId`

## 📁 File Structure

```
backend/
├── services/
│   └── mlService.js          # Main ML service with all algorithms
├── routes/
│   └── mlRoutes.js           # ML API endpoints
├── scripts/
│   └── testML.js             # ML testing script
└── install-ml-dependencies.bat

frontend/src/
├── services/
│   └── mlService.js          # Frontend ML service client
├── components/
│   ├── MLRecommendations.jsx # Service recommendations component
│   ├── MLScheduling.jsx      # Scheduling assistant component
│   └── MLAdminDashboard.jsx  # Admin ML management
└── pages/
    ├── Dashboard.jsx         # Updated with recommendations
    └── ServiceDetails.jsx    # Updated with scheduling assistant
```

## 🚀 Quick Start

### 1. Install Dependencies
```bash
cd backend
./install-ml-dependencies.bat
# or manually:
npm install ml-knn ml-bayes ml-cart
```

### 2. Start the Server
```bash
npm run dev
```

### 3. Test ML Functionality
```bash
node scripts/testML.js
```

## 🔧 API Endpoints

### Service Recommendations
```http
GET /api/ml/recommendations?limit=5
Authorization: Bearer <token>
```

### Service Categorization
```http
POST /api/ml/categorize
Content-Type: application/json
Authorization: Bearer <token>

{
  "serviceData": {
    "fee": 500,
    "processingTime": "1-3 Days",
    "visitCount": 50,
    "serviceCharge": 100
  }
}
```

### Schedule Optimization
```http
GET /api/ml/schedule/optimal/:serviceId?date=2024-01-15
```

### Model Management
```http
GET /api/ml/status                    # Check model status
POST /api/ml/retrain                  # Retrain all models
POST /api/ml/train/:model            # Train specific model
```

## 🎯 Frontend Integration

### 1. User Dashboard
- **Location**: `/dashboard`
- **Feature**: AI-powered service recommendations in sidebar
- **Component**: `MLRecommendations`

### 2. Service Details
- **Location**: `/service/:id`
- **Feature**: AI scheduling assistant for optimal appointment times
- **Component**: `MLScheduling`

### 3. Admin Panel
- **Location**: `/admin/ml`
- **Feature**: ML model management and monitoring
- **Component**: `MLAdminDashboard`

## 📊 How It Works

### KNN Service Recommendations
1. Analyzes user's appointment history
2. Creates user preference vector based on service features
3. Finds similar services using KNN algorithm
4. Returns personalized recommendations

### Bayesian Service Categorization
1. Trains on existing service categories
2. Uses service features (fee, processing time, etc.)
3. Predicts category with confidence score
4. Helps auto-categorize new services

### Decision Tree Scheduling
1. Analyzes historical appointment success rates
2. Considers time factors (day, hour, month)
3. Predicts optimal appointment times
4. Provides success probability for each time slot

## 🔍 Model Training

Models are automatically trained when:
- First API call is made
- Admin manually triggers retraining
- New data becomes available

Training data requirements:
- **KNN**: At least 10 completed appointments
- **Bayesian**: At least 5 services with categories
- **Decision Tree**: At least 10 completed appointments

## 🎨 UI Features

### ML Recommendations Component
- Shows personalized service recommendations
- Displays similarity scores
- Handles both personalized and popular recommendations
- Responsive design with loading states

### ML Scheduling Component
- Interactive date picker
- Time slot recommendations with success rates
- Visual success probability indicators
- Best time slot highlighting

### ML Admin Dashboard
- Model status monitoring
- Individual model training controls
- Performance overview
- Model capabilities explanation

## 🔧 Configuration

### Model Parameters
```javascript
// KNN
k: 3                    // Number of neighbors

// Decision Tree
maxDepth: 10           // Maximum tree depth
minNumSamples: 3       // Minimum samples per leaf
gainFunction: 'gini'   // Split criterion
```

### Feature Engineering
- **Fee Normalization**: Divide by 1000
- **Category Encoding**: Numerical mapping
- **Time Encoding**: Day of week (0-6), hour (0-23)
- **Popularity**: Visit count / 100

## 🚨 Error Handling

- Graceful fallbacks when models aren't trained
- Popular services shown when no user history
- Clear error messages for API failures
- Loading states for better UX

## 📈 Performance Considerations

- Models are trained in-memory (not persisted)
- Training happens asynchronously
- Caching of model status
- Efficient feature vector calculations

## 🔮 Future Enhancements

1. **Model Persistence**: Save trained models to disk
2. **Real-time Training**: Update models with new data
3. **Advanced Features**: More sophisticated feature engineering
4. **A/B Testing**: Compare ML vs non-ML recommendations
5. **Analytics**: Track ML model performance metrics

## 🐛 Troubleshooting

### Common Issues
1. **Models not training**: Check if enough data exists
2. **API errors**: Verify ML dependencies are installed
3. **Frontend errors**: Check if ML service is running
4. **Poor recommendations**: Retrain models with more data

### Debug Commands
```bash
# Check model status
curl http://localhost:5000/api/ml/status

# Test recommendations
curl -H "Authorization: Bearer <token>" http://localhost:5000/api/ml/recommendations

# Retrain models
curl -X POST -H "Authorization: Bearer <admin-token>" http://localhost:5000/api/ml/retrain
```

## 📝 Notes

- ML algorithms are simple but effective for this use case
- Easy to extend with more sophisticated algorithms
- Well-integrated with existing codebase
- Production-ready with proper error handling
- User-friendly interface with clear explanations

---

**Implementation Status**: ✅ Complete
**Algorithms**: 3/3 implemented
**Frontend Integration**: ✅ Complete
**API Endpoints**: ✅ Complete
**Testing**: ✅ Available
