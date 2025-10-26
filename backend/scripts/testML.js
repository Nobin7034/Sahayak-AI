import mlService from '../services/mlService.js';
import connectDB from '../config/db.js';

// Connect to database
await connectDB();

console.log('🤖 Testing ML Service Implementation...\n');

// Test 1: Model Status
console.log('1. Checking Model Status:');
const status = mlService.getModelStatus();
console.log('   KNN:', status.knn ? '✅ Trained' : '❌ Not Trained');
console.log('   Bayesian:', status.bayes ? '✅ Trained' : '❌ Not Trained');
console.log('   Decision Tree:', status.decisionTree ? '✅ Trained' : '❌ Not Trained');
console.log('');

// Test 2: Train Models
console.log('2. Training Models:');
console.log('   Training KNN...');
const knnResult = await mlService.trainKNN();
console.log('   KNN Training:', knnResult ? '✅ Success' : '❌ Failed');

console.log('   Training Bayesian Classifier...');
const bayesResult = await mlService.trainBayesianClassifier();
console.log('   Bayesian Training:', bayesResult ? '✅ Success' : '❌ Failed');

console.log('   Training Decision Tree...');
const dtResult = await mlService.trainDecisionTree();
console.log('   Decision Tree Training:', dtResult ? '✅ Success' : '❌ Failed');
console.log('');

// Test 3: Service Categorization
console.log('3. Testing Service Categorization:');
const testService = {
  fee: 500,
  processingTime: '1-3 Days',
  visitCount: 50,
  serviceCharge: 100
};

const categorization = await mlService.categorizeService(testService);
if (categorization.success) {
  console.log('   Predicted Category:', categorization.predictedCategory);
  console.log('   Confidence:', Math.round(categorization.confidence * 100) + '%');
} else {
  console.log('   Categorization:', '❌ Failed -', categorization.message);
}
console.log('');

// Test 4: Schedule Prediction
console.log('4. Testing Schedule Prediction:');
const tomorrow = new Date();
tomorrow.setDate(tomorrow.getDate() + 1);
const dateStr = tomorrow.toISOString().split('T')[0];

// Get a service ID for testing
import Service from '../models/Service.js';
const services = await Service.find({ isActive: true }).limit(1);
if (services.length > 0) {
  const scheduleResult = await mlService.predictOptimalSchedule(services[0]._id, dateStr);
  if (scheduleResult.success) {
    console.log('   Service:', scheduleResult.service.name);
    console.log('   Best Time Slot:', scheduleResult.bestTimeSlot.hour + ':00');
    console.log('   Success Rate:', Math.round(scheduleResult.bestTimeSlot.successProbability * 100) + '%');
  } else {
    console.log('   Schedule Prediction:', '❌ Failed -', scheduleResult.message);
  }
} else {
  console.log('   Schedule Prediction:', '❌ No services available for testing');
}
console.log('');

// Test 5: Recommendations
console.log('5. Testing Service Recommendations:');
if (services.length > 0) {
  const recResult = await mlService.getServiceRecommendations(services[0]._id, 3);
  if (recResult.success) {
    console.log('   Recommendations Type:', recResult.type);
    console.log('   Number of Recommendations:', recResult.recommendations.length);
    if (recResult.recommendations.length > 0) {
      console.log('   Top Recommendation:', recResult.recommendations[0].name);
    }
  } else {
    console.log('   Recommendations:', '❌ Failed -', recResult.message);
  }
} else {
  console.log('   Recommendations:', '❌ No services available for testing');
}
console.log('');

console.log('🎉 ML Service Testing Complete!');
console.log('');
console.log('Available API Endpoints:');
console.log('  GET  /api/ml/status - Model status');
console.log('  GET  /api/ml/recommendations - Service recommendations');
console.log('  POST /api/ml/categorize - Service categorization');
console.log('  GET  /api/ml/schedule/optimal/:serviceId - Schedule prediction');
console.log('  POST /api/ml/retrain - Retrain all models');
console.log('');

process.exit(0);
