import mlService from '../services/mlService.js';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function testBayesian() {
  try {
    console.log('🧪 Testing Bayesian Classifier Training...\n');
    
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');
    
    console.log('📍 Calling trainBayesianClassifier()...\n');
    const result = await mlService.trainBayesianClassifier();
    
    console.log('\n✅ Training completed');
    console.log(`Result: ${result}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ FATAL ERROR:', error);
    console.error('Message:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

testBayesian();