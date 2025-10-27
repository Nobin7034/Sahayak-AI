# AI/ML Admin Dashboard - Complete Guide

## 🎯 Overview

Your application has a fully integrated **Machine Learning Admin Dashboard** at `/admin/ml` that manages three AI models for intelligent service recommendations, categorization, and appointment scheduling.

---

## 📊 The Three AI Models

### 1. **K-Nearest Neighbors (KNN)** - Service Recommendations 🎯
- **What it does:** Analyzes user appointment history and recommends similar services
- **How it works:** Learns from completed appointments to suggest services users will likely be interested in
- **Data needed:** At least 10 completed appointments in the system

### 2. **Bayesian Classifier** - Service Categorization 📊
- **What it does:** Automatically categorizes services based on their characteristics (fee, processing time, etc.)
- **How it works:** Uses probability to predict the best category for any service
- **Data needed:** Training data for different service characteristics

### 3. **Decision Tree** - Appointment Scheduling 🌳
- **What it does:** Predicts optimal appointment time slots for better success rates
- **How it works:** Analyzes patterns in completed appointments to find the best time slots
- **Data needed:** Historical appointment data

---

## ✅ Frontend Setup (Already Done!)

### Location
```
frontend/src/admin/ml → /admin/ml route
```

### Features Already Implemented:
✅ ML Admin Dashboard component (`MLAdminDashboard.jsx`)
✅ Navigation link in Admin Panel sidebar
✅ Training controls (Train individual models + Retrain All)
✅ Model status display
✅ Performance overview cards
✅ Model capabilities documentation

### How to Access:
1. Log in as Admin
2. Go to Admin Panel
3. Click **"AI/ML"** in the sidebar
4. You'll see:
   - Current status of all 3 models
   - Train/Retrain buttons for each model
   - Performance metrics
   - Model capabilities overview

---

## 🔧 Backend Setup Status

### API Routes (All Set Up)
```
GET  /api/ml/status              - Check model training status
POST /api/ml/retrain             - Retrain all models
POST /api/ml/train/:model        - Train individual model (knn, bayes, decisiontree)
GET  /api/ml/recommendations     - Get service recommendations for user
POST /api/ml/categorize          - Categorize a single service
POST /api/ml/categorize/batch    - Auto-categorize all services
GET  /api/ml/schedule/optimal/:id - Get optimal appointment times
POST /api/ml/schedule/batch      - Get batch schedule predictions
```

### Package Dependencies (Installed)
```json
{
  "ml-knn": "^3.0.0",
  "ml-naivebayes": "^4.0.0",
  "ml-cart": "^1.0.8"
}
```

---

## ⚠️ Current Issues & Solutions

### Issue 1: ❌ 404 Error on Production (sahayak-ai-c7ol.onrender.com)

**Problem:** Backend deployed to Render doesn't have the latest ML routes

**Why:** Backend code was updated but Render deployment wasn't redeployed

**Solution:**
✅ You already pushed to Git
✅ Render should auto-deploy (or manually trigger in Render dashboard)
✅ Wait for deployment to complete (2-5 minutes)
✅ Check Render logs to verify ML packages installed

**Verify it worked:**
- Visit: `https://sahayak-ai-c7ol.onrender.com/api/ml/status`
- Should return JSON with model status (not 404)

### Issue 2: 📊 Models Say "Not Trained"

**Why:** Models need sufficient data to train:

| Model | Data Requirement |
|-------|------------------|
| KNN | ≥ 10 completed appointments |
| Bayes | Service data with categories |
| Decision Tree | Historical appointment data |

**What to do:**
1. Create test appointments first
2. Mark some as "completed" in admin panel
3. Then click "Train" buttons in ML Dashboard

**For Quick Testing:**
- Go to Admin → Services → Create a few services
- Go to Services page (as user) → Book some appointments
- Go to Admin → Appointments → Mark them as "completed"
- Return to Admin → AI/ML → Click "Retrain All Models"

---

## 🚀 How to Use AI/ML Features

### Step 1: Access the Dashboard
```
Admin Panel → AI/ML tab
```

### Step 2: Train Individual Models
- Click the red "Train" button on any untrained model
- Wait for it to complete
- Button turns green when trained

### Step 3: Retrain All Models
- Click blue "Retrain All Models" button (top right)
- Useful when new appointment data is added

### Step 4: Monitor Status
- Green checkmark = Model trained ✅
- Red X = Model not trained ❌
- Each card shows:
  - Model name
  - Description
  - Current status
  - Train/Retrain button

---

## 📱 Using ML Features in the App

### For Users:
1. **Service Recommendations** - Shown on Dashboard (when KNN is trained)
2. **Similar Services** - Available on Service detail pages
3. **Optimal Appointment Times** - Suggested during booking

### For Admins:
1. **Batch Categorization** - Auto-categorize all services
2. **Performance Metrics** - See how well models are performing
3. **Model Management** - Train/retrain as needed

---

## 🐛 Troubleshooting

### "Failed to fetch model status"
**Cause:** Backend not responding to ML endpoints
**Fix:**
1. Check if backend is running locally (port 5000)
2. For production, check Render logs for deployment issues
3. Ensure ML packages are installed: `npm install`

### Models stay "Not Trained"
**Cause:** Not enough data in database
**Fix:**
1. Create more appointments through the app
2. Mark appointments as "completed" in Admin
3. Click "Train" button in ML Dashboard

### Training button stays in "Training..." state
**Cause:** Server error or network timeout
**Fix:**
1. Open browser console (F12) for error messages
2. Check backend logs
3. Try individual model training instead of "Retrain All"

---

## 📊 Database Requirements

For models to work optimally, ensure your database has:

```javascript
// Example data structure needed:
Appointments: [
  {
    user: ObjectId,
    service: ObjectId,
    status: 'completed', // Important: status must be 'completed'
    createdAt: Date,
    date: Date,
    timeSlot: String
  }
]

Services: [
  {
    name: String,
    category: String,
    fee: Number,
    processingTime: 'Same Day' | '1-3 Days' | '1 Week' | '2 Weeks',
    visitCount: Number
  }
]
```

---

## 🔍 Next Steps

1. **Deploy Backend** (if on production)
   - Push to Git (done ✅)
   - Wait for Render auto-deploy or manually trigger
   - Verify deployment successful in Render logs

2. **Generate Training Data** (if local)
   - Create test appointments through the app
   - Mark them as completed
   - Add services with proper categories

3. **Train Models**
   - Go to Admin → AI/ML
   - Click "Train" on each model
   - Watch them turn green ✅

4. **Monitor Performance**
   - Check model status regularly
   - Retrain when new data is added
   - View performance metrics

---

## 🎓 Technical Details

### Model Algorithms:
- **KNN:** Uses k=3 neighbors for similarity matching
- **Bayesian:** Gaussian Naive Bayes for probability-based classification
- **Decision Tree:** CART algorithm for optimal splits

### Feature Engineering:
- Service fee (normalized by 1000)
- Category encoding (numeric mapping)
- Processing time (1-4 scale)
- Visit count (popularity metric)

### Training Process:
- All models train in-memory on demand
- No pre-computed weights needed
- Fresh training happens each time "Train" is clicked
- Models persist during server runtime

---

## 📞 Support

If you encounter issues:
1. Check browser console (F12) for frontend errors
2. Check backend logs for server errors
3. Verify database has required data
4. Ensure packages installed: `cd backend && npm install`
5. Restart backend server if needed

---

**Status:** ✅ Frontend Complete | ⏳ Backend Deployment Pending | 📊 Ready to Train Models