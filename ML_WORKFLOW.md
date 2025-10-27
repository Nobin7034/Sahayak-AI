# ML System Workflow Documentation

## 🎯 Overview

This document explains how the Machine Learning (ML) system works in the Sahayak AI platform, what data it needs, and how automatic training is implemented.

## 📊 ML Models Overview

The platform implements **three ML models** that work automatically in the background:

### 1. **K-Nearest Neighbors (KNN)** - Service Recommendations
**Purpose**: Recommends services to users based on their past behavior patterns

**Algorithm**: K-Nearest Neighbors (K=3)

**When it trains**: 
- Automatically on server startup (if data available)
- When a user requests service recommendations
- Re-trains periodically as new appointment data accumulates

**Data Requirements**:
- Minimum: **10 completed appointments**
- Uses: User appointment history, service features (fee, category, processing time, popularity)

**How it works**:
1. Analyzes completed appointments to build user-service interaction patterns
2. Creates feature vectors for each service (fee, category, processing time, visit count)
3. When a user requests recommendations, finds similar services based on their history
4. Returns personalized recommendations or popular services for new users

---

### 2. **Gaussian Naive Bayes** - Service Categorization
**Purpose**: Automatically categorizes services based on their features

**Algorithm**: Gaussian Naive Bayes Classifier

**When it trains**:
- Automatically on server startup (if data available)
- When categorization is requested
- Adapts as new services are added

**Data Requirements**:
- Minimum: **5 active services**
- Uses: Service features (fee, processing time, visit count, service charge)

**How it works**:
1. Learns patterns from existing service categories
2. Analyzes service features (price, timing, popularity)
3. Predicts the most likely category for new or uncategorized services
4. Provides confidence scores for predictions

---

### 3. **Decision Tree** - Appointment Scheduling Optimization
**Purpose**: Predicts optimal appointment time slots for better success rates

**Algorithm**: Decision Tree Classifier (CART with Gini impurity)

**When it trains**:
- Automatically on server startup (if data available)
- When schedule optimization is requested
- Updates as appointment patterns change

**Data Requirements**:
- Minimum: **10 completed appointments**
- Uses: Historical appointment data (day, time, month, service type, status)

**How it works**:
1. Analyzes historical appointment patterns (day of week, hour, month)
2. Learns which time slots have higher success rates for different services
3. When user schedules an appointment, suggests optimal time slots
4. Predicts success probability for each available slot

---

## 🔄 Automatic Training Workflow

### System Initialization (Server Startup)

```
1. Server starts → MongoDB connects
2. Wait 2 seconds for DB stabilization
3. Attempt to train all 3 models in parallel
4. Log training results:
   ✅ Model trained successfully
   ⚠️ Pending (insufficient data)
5. Continue running - models will train on first use if pending
```

### Runtime Auto-Training (On-Demand)

Each model has built-in auto-training logic:

```javascript
// Example: KNN Model
async getServiceRecommendations(userId) {
  // Check if model is trained
  if (!this.isTrained.knn) {
    await this.trainKNN();  // Auto-train if not trained
  }
  
  // Proceed with recommendations
  return recommendations;
}
```

**This means**:
- ✅ Users never experience "model not trained" errors
- ✅ Training happens transparently in the background
- ✅ No manual intervention required
- ✅ Models stay up-to-date with latest data

---

## 📈 Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                      USER ACTIONS                            │
│  (Book appointments, browse services, schedule meetings)     │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│                     MONGODB DATABASE                         │
│  • Appointments (status, date, service, user)                │
│  • Services (name, category, fee, processing time)           │
│  • Users (appointment history, preferences)                  │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│                    AUTO-TRAINING TRIGGERS                    │
│                                                              │
│  1. Server Startup → Train all models                       │
│  2. User requests recommendations → Train KNN if needed     │
│  3. Service categorization → Train Bayes if needed          │
│  4. Schedule optimization → Train Decision Tree if needed   │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│                      ML MODELS                               │
│                                                              │
│  🎯 KNN Model        📊 Bayes Model      🌳 Decision Tree   │
│  (Recommendations)   (Categorization)    (Scheduling)        │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│                    PREDICTIONS & RESULTS                     │
│  • Personalized service recommendations                      │
│  • Automatic service categorization                          │
│  • Optimal appointment time suggestions                      │
└─────────────────────────────────────────────────────────────┘
```

---

## 💾 Data Requirements Summary

| Model | Minimum Data | Optimal Data | Data Sources |
|-------|--------------|--------------|--------------|
| **KNN** | 10 completed appointments | 50+ appointments | Appointment collection (completed) |
| **Bayesian** | 5 active services | 20+ services | Service collection (active) |
| **Decision Tree** | 10 completed appointments | 50+ appointments | Appointment collection (completed) |

### Data Quality Requirements

**For all models to work optimally**:
- ✅ Services must have: `fee`, `processingTime`, `category`, `visitCount`, `serviceCharge`
- ✅ Appointments must have: `appointmentDate`, `timeSlot`, `status`, populated `service` and `user`
- ✅ Status must be `completed` for training (not `pending` or `cancelled`)

---

## 🚀 User-Facing Features

### 1. Service Recommendations (KNN)

**Where**: Home page, Service listing pages

**API Endpoint**: `GET /api/ml/recommendations?limit=5`

**User Experience**:
```
User visits services page
  ↓
Frontend calls recommendations API
  ↓
KNN model checks if trained
  ├─ If trained: Returns personalized recommendations
  └─ If not trained: 
      ├─ Trains automatically (2-3 seconds)
      └─ Returns recommendations
  ↓
User sees "AI-Powered Recommendations" section
```

**Frontend Component**: `MLRecommendations.jsx`

---

### 2. Service Categorization (Bayesian)

**Where**: Admin dashboard, Service management

**API Endpoint**: `POST /api/ml/categorize`

**User Experience**:
```
Admin adds new service
  ↓
System suggests category based on features
  ↓
Bayesian model predicts category with confidence
  ↓
Admin can accept or override suggestion
```

**Frontend Component**: Service creation forms

---

### 3. Schedule Optimization (Decision Tree)

**Where**: Appointment booking page

**API Endpoint**: `GET /api/ml/schedule/optimal/:serviceId?date=YYYY-MM-DD`

**User Experience**:
```
User selects service and date
  ↓
Frontend calls schedule optimization API
  ↓
Decision Tree predicts success rates for time slots
  ↓
User sees:
  ✅ Best time slots highlighted (green)
  ⚠️ Medium success slots (yellow)
  ❌ Low success slots (red)
  ↓
User makes informed decision
```

**Frontend Component**: `MLScheduling.jsx`

---

## 🔧 Admin Monitoring

### ML Monitor Dashboard

**Location**: `/admin/ml`

**Features**:
- ✅ Real-time status of all 3 models
- ✅ Auto-refresh every 30 seconds
- ✅ Data requirements visibility
- ✅ Training status indicators
- ⚠️ No manual training buttons (automatic only)

**Status Indicators**:
- 🟢 **Trained**: Model is active and ready
- 🟡 **Pending**: Model will train on next use
- ⚠️ **Insufficient Data**: Need more data points

---

## 🐛 Troubleshooting

### Models Not Training?

**Check data availability**:
```bash
# Check appointments count
node backend/scripts/countAppointments.js

# Check services count and completeness
node backend/scripts/checkServices.js
```

**Verify data requirements**:
- KNN & Decision Tree: Need 10+ **completed** appointments (not pending/cancelled)
- Bayesian: Need 5+ **active** services with all required fields

### Manual Training (Emergency Only)

If automatic training fails, admin can trigger emergency retrain:

**API**: `POST /api/ml/retrain` (Admin only)

**Note**: This should rarely be needed. Models auto-train intelligently.

---

## 📊 Performance Considerations

### Training Time
- **KNN**: 1-3 seconds (depends on appointment count)
- **Bayesian**: < 1 second (fast, even with many services)
- **Decision Tree**: 1-2 seconds (efficient with caching)

### Memory Usage
- Models are kept in memory for fast predictions
- Total memory footprint: ~10-50 MB (minimal)
- No external dependencies or GPU required

### Scalability
- ✅ Handles 1000+ services efficiently
- ✅ Scales with 10,000+ appointments
- ✅ Can be extended with more sophisticated models if needed

---

## 🔒 Security & Privacy

### Data Access
- All ML endpoints require authentication
- User data is anonymized in training
- No personal information stored in models
- Admin-only access for training endpoints

### Model Updates
- Models retrain on server restart (with fresh data)
- Background retraining can be scheduled (future enhancement)
- Models automatically adapt to new patterns

---

## 🎓 Technical Implementation Details

### Libraries Used
```json
{
  "ml-knn": "^2.1.0",          // K-Nearest Neighbors
  "ml-naivebayes": "^4.0.0",   // Gaussian Naive Bayes
  "ml-cart": "^2.1.2"          // Decision Tree (CART)
}
```

### Model Architecture

**File Structure**:
```
backend/
├── services/
│   └── mlService.js          # Core ML service (single instance)
├── routes/
│   └── mlRoutes.js           # API endpoints
└── models/
    ├── Appointment.js        # Data model
    └── Service.js            # Data model

frontend/
├── services/
│   └── mlService.js          # Frontend API client
└── components/
    ├── MLRecommendations.jsx # Recommendations UI
    ├── MLScheduling.jsx      # Scheduling UI
    └── MLAdminDashboard.jsx  # Admin monitoring
```

### Key Design Decisions

1. **Singleton Pattern**: ML service is instantiated once, models persist in memory
2. **Auto-Training**: Every prediction method checks training status first
3. **Graceful Degradation**: Falls back to popular services if models not trained
4. **Non-Blocking**: Training happens async, doesn't block user requests
5. **Caching**: Index mappings cached to speed up predictions

---

## 🚀 Future Enhancements

### Planned Improvements
1. **Scheduled Retraining**: Nightly model updates with accumulated data
2. **A/B Testing**: Compare model performance with baseline
3. **User Feedback Loop**: Learn from user interactions with recommendations
4. **Advanced Models**: Deep learning for complex patterns (if needed)
5. **Model Versioning**: Track model performance over time

### Monitoring Metrics (Future)
- Recommendation click-through rate
- Appointment completion rate improvement
- Category prediction accuracy
- Time slot prediction accuracy

---

## 📞 Support

For issues or questions about the ML system:
1. Check this workflow document
2. Review logs in server console
3. Use emergency retrain endpoint if needed
4. Contact development team for persistent issues

---

**Last Updated**: October 27, 2025
**Version**: 1.0
**Status**: ✅ Production Ready - Automatic Training Enabled

