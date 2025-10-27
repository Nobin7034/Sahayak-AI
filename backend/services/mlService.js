import KNN from 'ml-knn';
import { GaussianNB } from 'ml-naivebayes';
import { DecisionTreeClassifier } from 'ml-cart';
import Service from '../models/Service.js';
import Appointment from '../models/Appointment.js';
import User from '../models/User.js';

class MLService {
  constructor() {
    this.knnModel = null;
    this.bayesModel = null;
    this.decisionTreeModel = null;
    this.isTrained = {
      knn: false,
      bayes: false,
      decisionTree: false
    };
    this.serviceIndexMap = new Map(); // Maps service ObjectId to numeric index
    this.serviceReverseMap = new Map(); // Maps numeric index back to service ObjectId
    this.categoryIndexMap = new Map(); // Maps category name to numeric index
    this.categoryReverseMap = new Map(); // Maps numeric index back to category name
  }

  // ==================== K-Nearest Neighbors (KNN) ====================
  // Service Recommendation based on user behavior patterns
  
  async trainKNN() {
    try {
      console.log('🤖 Training KNN model for service recommendations...');
      console.log('📍 DEBUG: Starting KNN training function');
      
      // Get user appointment data for training
      const appointments = await Appointment.find({ status: 'completed' })
        .populate('user', 'name email')
        .populate('service', 'name category fee processingTime')
        .lean();

      console.log(`📍 DEBUG: Found ${appointments.length} completed appointments`);

      if (appointments.length < 10) {
        console.log('⚠️ Not enough data for KNN training. Need at least 10 completed appointments.');
        return false;
      }

      // Create user-service interaction matrix
      const userServiceMatrix = new Map();
      const serviceFeatures = new Map();
      
      // Build service feature vectors and create index mapping
      const services = await Service.find({ isActive: true }).lean();
      this.serviceIndexMap.clear();
      this.serviceReverseMap.clear();
      
      let serviceIndex = 0;
      services.forEach((service) => {
        const serviceIdStr = service._id.toString();
        this.serviceIndexMap.set(serviceIdStr, serviceIndex);
        this.serviceReverseMap.set(serviceIndex, serviceIdStr);
        
        serviceFeatures.set(serviceIdStr, [
          service.fee / 1000, // Normalized fee
          this.getCategoryEncoding(service.category), // Category encoding
          service.processingTime === 'Same Day' ? 1 : 
          service.processingTime === '1-3 Days' ? 2 : 
          service.processingTime === '1 Week' ? 3 : 4, // Processing time encoding
          service.visitCount / 100 // Normalized popularity
        ]);
        
        serviceIndex++;
      });

      // Build user-service interaction matrix
      appointments.forEach(appointment => {
        const userId = appointment.user._id.toString();
        const serviceId = appointment.service._id.toString();
        
        if (!userServiceMatrix.has(userId)) {
          userServiceMatrix.set(userId, new Map());
        }
        userServiceMatrix.get(userId).set(serviceId, 1);
      });

      // Prepare training data with NUMERIC labels
      const trainingData = [];
      const trainingLabels = [];
      
      for (const [userId, services] of userServiceMatrix) {
        for (const [serviceId, rating] of services) {
          if (serviceFeatures.has(serviceId)) {
            trainingData.push(serviceFeatures.get(serviceId));
            // Use numeric index instead of ObjectId string
            trainingLabels.push(this.serviceIndexMap.get(serviceId));
          }
        }
      }

      if (trainingData.length === 0) {
        console.log('⚠️ No valid training data for KNN');
        return false;
      }

      // Train KNN model with k=3 (use 3 nearest neighbors)
      this.knnModel = new KNN(trainingData, trainingLabels, { k: Math.min(3, trainingLabels.length) });
      this.isTrained.knn = true;
      
      console.log(`✅ KNN model trained successfully with ${trainingData.length} training samples`);
      return true;
    } catch (error) {
      console.error('❌ KNN training failed:', error.message);
      return false;
    }
  }

  async getServiceRecommendations(userId, limit = 5) {
    try {
      // Try to train if not already trained
      if (!this.isTrained.knn) {
        console.log('🔄 KNN not trained, attempting to train...');
        await this.trainKNN();
      }

      // Get user's appointment history
      const userAppointments = await Appointment.find({ 
        user: userId, 
        status: 'completed' 
      }).populate('service', 'name category fee processingTime').lean();

      if (userAppointments.length === 0) {
        // If no history, return popular services (works without ML)
        console.log('📊 New user detected, showing popular services');
        const popularServices = await Service.find({ isActive: true })
          .sort({ visitCount: -1 })
          .limit(limit)
          .select('name description category fee processingTime visitCount');
        
        return { 
          success: true, 
          recommendations: popularServices,
          type: 'popular',
          mlEnabled: false
        };
      }

      // If KNN not trained, fall back to popular services
      if (!this.isTrained.knn) {
        console.log('📊 KNN training pending, using popular services');
        const popularServices = await Service.find({ isActive: true })
          .sort({ visitCount: -1 })
          .limit(limit)
          .select('name description category fee processingTime visitCount');
        
        return { 
          success: true, 
          recommendations: popularServices,
          type: 'popular',
          mlEnabled: false,
          message: 'Showing popular services (personalized recommendations need more data)'
        };
      }

      // Get user's preferred service features
      const userPreferences = this.calculateUserPreferences(userAppointments);
      
      // Find similar services using KNN
      const allServices = await Service.find({ isActive: true }).lean();
      const recommendations = [];
      
      for (const service of allServices) {
        const serviceFeatures = [
          service.fee / 1000,
          this.getCategoryEncoding(service.category),
          service.processingTime === 'Same Day' ? 1 : 
          service.processingTime === '1-3 Days' ? 2 : 
          service.processingTime === '1 Week' ? 3 : 4,
          service.visitCount / 100
        ];
        
        // Get KNN prediction (returns numeric index)
        const prediction = this.knnModel.predict([serviceFeatures]);
        const predictedServiceIndex = prediction[0];
        const predictedServiceId = this.serviceReverseMap.get(predictedServiceIndex);
        
        const similarity = this.calculateSimilarity(userPreferences, serviceFeatures);
        
        recommendations.push({
          ...service,
          similarity: similarity,
          predictedServiceId: predictedServiceId
        });
      }

      // Sort by similarity and return top recommendations
      const sortedRecommendations = recommendations
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, limit);

      return { 
        success: true, 
        recommendations: sortedRecommendations,
        type: 'personalized'
      };
    } catch (error) {
      console.error('❌ Service recommendation failed:', error);
      return { success: false, message: 'Recommendation failed', error: error.message };
    }
  }

  // ==================== Bayesian Classifier ====================
  // Service Categorization based on service features
  
  async trainBayesianClassifier() {
    try {
      console.log('🤖 Training Bayesian classifier for service categorization...');
      console.log('📍 DEBUG: Starting Bayesian training function');
      
      const services = await Service.find({ isActive: true }).lean();
      console.log(`📍 DEBUG: Found ${services.length} services`);
      
      if (services.length < 5) {
        console.log('⚠️ Not enough services for Bayesian training');
        return false;
      }

      // Build category index mapping (convert categories to numeric indices)
      this.categoryIndexMap.clear();
      this.categoryReverseMap.clear();
      let categoryIndex = 0;
      
      services.forEach(service => {
        if (!this.categoryIndexMap.has(service.category)) {
          this.categoryIndexMap.set(service.category, categoryIndex);
          this.categoryReverseMap.set(categoryIndex, service.category);
          categoryIndex++;
        }
      });
      
      console.log(`📍 DEBUG: Built category index map with ${this.categoryIndexMap.size} categories`);
      console.log(`📍 DEBUG: Category mapping: ${JSON.stringify(Array.from(this.categoryIndexMap.entries()))}`);

      const trainingData = [];
      const trainingLabels = [];
      
      services.forEach((service, index) => {
        const features = [
          service.fee / 1000, // Normalized fee
          service.processingTime === 'Same Day' ? 1 : 
          service.processingTime === '1-3 Days' ? 2 : 
          service.processingTime === '1 Week' ? 3 : 4, // Processing time
          service.visitCount / 100, // Normalized popularity
          service.serviceCharge / 1000 // Normalized service charge
        ];
        
        console.log(`📍 DEBUG: Service ${index + 1}: ${service.name}`);
        console.log(`   - Features: [${features.join(', ')}]`);
        console.log(`   - Category: ${service.category} (index: ${this.categoryIndexMap.get(service.category)})`);
        
        trainingData.push(features);
        // Use numeric index instead of string category
        trainingLabels.push(this.categoryIndexMap.get(service.category));
      });

      console.log(`📍 DEBUG: Training data length: ${trainingData.length}`);
      console.log(`📍 DEBUG: Training labels (numeric): [${trainingLabels.join(', ')}]`);
      console.log(`📍 DEBUG: Creating GaussianNB instance...`);

      // Train Bayesian classifier
      this.bayesModel = new GaussianNB();
      console.log('📍 DEBUG: GaussianNB instance created');
      console.log('📍 DEBUG: Calling train method...');
      
      this.bayesModel.train(trainingData, trainingLabels);
      
      console.log('📍 DEBUG: Train method completed');
      this.isTrained.bayes = true;
      
      console.log('✅ Bayesian classifier trained successfully');
      return true;
    } catch (error) {
      console.error('❌ Bayesian training failed:', error.message);
      console.error('📍 DEBUG: Full error:', error);
      console.error('📍 DEBUG: Stack trace:', error.stack);
      return false;
    }
  }

  async categorizeService(serviceData) {
    try {
      // Try to train if not already trained
      if (!this.isTrained.bayes) {
        console.log('🔄 Bayesian not trained, attempting to train...');
        await this.trainBayesianClassifier();
      }

      // If still not trained, use rule-based fallback
      if (!this.isTrained.bayes) {
        console.log('📊 Using rule-based categorization (Bayesian training pending)');
        return this.getFallbackCategory(serviceData);
      }

      const features = [
        serviceData.fee / 1000,
        serviceData.processingTime === 'Same Day' ? 1 : 
        serviceData.processingTime === '1-3 Days' ? 2 : 
        serviceData.processingTime === '1 Week' ? 3 : 4,
        (serviceData.visitCount || 0) / 100,
        (serviceData.serviceCharge || 0) / 1000
      ];

      const prediction = this.bayesModel.predict([features]);
      const probabilities = this.bayesModel.predictProbabilities([features]);
      
      // Convert numeric prediction back to category name
      const predictedCategoryIndex = prediction[0];
      const predictedCategoryName = this.categoryReverseMap.get(predictedCategoryIndex);
      
      return {
        success: true,
        predictedCategory: predictedCategoryName,
        confidence: Math.max(...probabilities[0]),
        probabilities: probabilities[0]
      };
    } catch (error) {
      console.error('❌ Service categorization failed:', error);
      return { success: false, message: 'Categorization failed', error: error.message };
    }
  }

  // ==================== Decision Tree ====================
  // Appointment Scheduling Optimization
  
  async trainDecisionTree() {
    try {
      console.log('🤖 Training Decision Tree for appointment scheduling...');
      
      const appointments = await Appointment.find({ status: 'completed' })
        .populate('service', 'category fee processingTime')
        .lean();

      console.log(`📍 DEBUG: Found ${appointments.length} completed appointments`);

      if (appointments.length < 10) {
        console.log(`⚠️ Not enough appointment data for Decision Tree training (need 10, have ${appointments.length})`);
        return false;
      }

      const trainingData = [];
      const trainingLabels = [];
      
      let validCount = 0;
      let invalidCount = 0;
      
      appointments.forEach(appointment => {
        // Validate appointment has required data
        if (!appointment.service || !appointment.appointmentDate) {
          invalidCount++;
          return;
        }
        
        const appointmentDate = new Date(appointment.appointmentDate);
        const dayOfWeek = appointmentDate.getDay();
        const hour = appointmentDate.getHours();
        const month = appointmentDate.getMonth();
        
        const features = [
          dayOfWeek, // 0-6 (Sunday-Saturday)
          hour, // 0-23
          month, // 0-11
          appointment.service.fee / 1000, // Normalized fee
          this.getCategoryEncoding(appointment.service.category),
          appointment.service.processingTime === 'Same Day' ? 1 : 
          appointment.service.processingTime === '1-3 Days' ? 2 : 
          appointment.service.processingTime === '1 Week' ? 3 : 4
        ];
        
        // Label: 1 for successful (completed), 0 for unsuccessful (cancelled)
        const label = appointment.status === 'completed' ? 1 : 0;
        
        trainingData.push(features);
        trainingLabels.push(label);
        validCount++;
      });

      console.log(`📍 DEBUG: Valid training samples: ${validCount}, Invalid: ${invalidCount}`);

      if (trainingData.length === 0) {
        console.log('⚠️ No valid training data for Decision Tree');
        return false;
      }

      // Train Decision Tree
      this.decisionTreeModel = new DecisionTreeClassifier({
        gainFunction: 'gini',
        maxDepth: 10,
        minNumSamples: 3
      });
      
      this.decisionTreeModel.train(trainingData, trainingLabels);
      this.isTrained.decisionTree = true;
      
      console.log(`✅ Decision Tree trained successfully with ${trainingData.length} training samples`);
      return true;
    } catch (error) {
      console.error('❌ Decision Tree training failed:', error.message);
      console.error('📍 DEBUG: Stack trace:', error.stack);
      return false;
    }
  }

  async predictOptimalSchedule(serviceId, preferredDate) {
    try {
      // Get service first
      const service = await Service.findById(serviceId).lean();
      if (!service) {
        return { success: false, message: 'Service not found' };
      }

      const date = new Date(preferredDate);
      const dayOfWeek = date.getDay();
      const month = date.getMonth();
      
      // Test different time slots
      const timeSlots = [9, 10, 11, 14, 15, 16]; // Common appointment hours
      const predictions = [];
      
      // Try to train if not already trained
      if (!this.isTrained.decisionTree) {
        console.log('🔄 Decision Tree not trained, attempting to train...');
        await this.trainDecisionTree();
      }

      // Use ML model if available, otherwise use smart fallback
      if (this.isTrained.decisionTree) {
        console.log('✅ Using ML-based scheduling predictions');
        try {
          // ML-based predictions
          for (const hour of timeSlots) {
            const features = [
              dayOfWeek,
              hour,
              month,
              service.fee / 1000,
              this.getCategoryEncoding(service.category),
              service.processingTime === 'Same Day' ? 1 : 
              service.processingTime === '1-3 Days' ? 2 : 
              service.processingTime === '1 Week' ? 3 : 4
            ];
            
            const prediction = this.decisionTreeModel.predict([features]);
            const probabilities = this.decisionTreeModel.predictProbabilities([features]);
            
            predictions.push({
              hour: hour,
              successProbability: probabilities[0][1] || 0.75, // Probability of success
              recommended: prediction[0] === 1,
              source: 'ml'
            });
          }
        } catch (mlError) {
          console.error('⚠️ ML prediction failed, using fallback:', mlError.message);
          // Fall through to fallback logic
          return this.getFallbackSchedule(service, timeSlots, dayOfWeek);
        }
      } else {
        // Fallback: Smart heuristic-based predictions
        console.log('📊 Using heuristic-based scheduling (ML training pending)');
        return this.getFallbackSchedule(service, timeSlots, dayOfWeek);
      }

      // Sort by success probability
      predictions.sort((a, b) => b.successProbability - a.successProbability);
      
      return {
        success: true,
        predictions: predictions,
        bestTimeSlot: predictions[0],
        service: service,
        mlEnabled: true
      };
    } catch (error) {
      console.error('❌ Schedule prediction failed:', error);
      // Last resort fallback
      const service = await Service.findById(serviceId).lean();
      if (service) {
        return this.getFallbackSchedule(service, [9, 10, 11, 14, 15, 16], new Date(preferredDate).getDay());
      }
      return { success: false, message: 'Prediction failed', error: error.message };
    }
  }

  // Fallback categorization logic when Bayesian model is not available
  getFallbackCategory(serviceData) {
    console.log('🎯 Using rule-based categorization');
    
    const fee = serviceData.fee || 0;
    const serviceName = (serviceData.name || '').toLowerCase();
    const processingTime = serviceData.processingTime || '';
    
    // Rule-based category detection
    let category = 'Other';
    let confidence = 0.70;
    
    // Check for keywords in service name
    if (serviceName.includes('passport') || serviceName.includes('visa') || 
        serviceName.includes('license') || serviceName.includes('certificate') ||
        serviceName.includes('government') || serviceName.includes('registration')) {
      category = 'Government Services';
      confidence = 0.85;
    } else if (serviceName.includes('document') || serviceName.includes('notary') ||
               serviceName.includes('attestation') || serviceName.includes('verification')) {
      category = 'Document Services';
      confidence = 0.85;
    } else if (serviceName.includes('bank') || serviceName.includes('loan') ||
               serviceName.includes('insurance') || serviceName.includes('tax') ||
               serviceName.includes('financial')) {
      category = 'Financial Services';
      confidence = 0.85;
    } else if (serviceName.includes('health') || serviceName.includes('medical') ||
               serviceName.includes('hospital') || serviceName.includes('doctor')) {
      category = 'Health Services';
      confidence = 0.85;
    } else if (serviceName.includes('education') || serviceName.includes('school') ||
               serviceName.includes('admission') || serviceName.includes('exam')) {
      category = 'Education Services';
      confidence = 0.85;
    }
    
    // Adjust based on fee (government services typically higher fees)
    if (fee > 500 && category === 'Other') {
      category = 'Government Services';
      confidence = 0.75;
    } else if (fee < 100 && category === 'Other') {
      category = 'Document Services';
      confidence = 0.70;
    }
    
    return {
      success: true,
      predictedCategory: category,
      confidence: confidence,
      probabilities: [confidence],
      mlEnabled: false,
      fallbackUsed: true,
      message: 'Using rule-based categorization (AI will improve with more services)'
    };
  }

  // Fallback scheduling logic when ML model is not available
  getFallbackSchedule(service, timeSlots, dayOfWeek) {
    console.log('🎯 Generating smart heuristic schedule');
    
    const predictions = timeSlots.map(hour => {
      // Smart heuristic based on typical patterns
      let baseScore = 0.75; // Base success rate
      
      // Morning slots (9-11) are generally more reliable
      if (hour >= 9 && hour <= 11) {
        baseScore += 0.15;
      }
      
      // Early afternoon (14) is good
      if (hour === 14) {
        baseScore += 0.10;
      }
      
      // Late afternoon slots slightly less preferred
      if (hour >= 15) {
        baseScore -= 0.05;
      }
      
      // Weekdays are generally better than weekends
      if (dayOfWeek >= 1 && dayOfWeek <= 5) {
        baseScore += 0.05;
      }
      
      // Government services work better in morning
      if (service.category === 'Government Services' && hour >= 9 && hour <= 11) {
        baseScore += 0.10;
      }
      
      // Fast processing services can be anytime
      if (service.processingTime === 'Same Day') {
        baseScore += 0.05;
      }
      
      // Cap at 0.95
      const successProbability = Math.min(baseScore, 0.95);
      
      return {
        hour: hour,
        successProbability: successProbability,
        recommended: successProbability >= 0.80,
        source: 'heuristic'
      };
    });
    
    // Sort by success probability
    predictions.sort((a, b) => b.successProbability - a.successProbability);
    
    return {
      success: true,
      predictions: predictions,
      bestTimeSlot: predictions[0],
      service: service,
      mlEnabled: false,
      fallbackUsed: true,
      message: 'Using smart scheduling (AI will improve with more appointment data)'
    };
  }

  // ==================== Helper Methods ====================
  
  getCategoryEncoding(category) {
    const categories = {
      'Government Services': 1,
      'Document Services': 2,
      'Financial Services': 3,
      'Health Services': 4,
      'Education Services': 5,
      'Other': 6
    };
    return categories[category] || 6;
  }

  calculateUserPreferences(appointments) {
    if (appointments.length === 0) return [0, 0, 0, 0];
    
    let totalFee = 0;
    let totalCategory = 0;
    let totalProcessingTime = 0;
    let totalPopularity = 0;
    
    appointments.forEach(appointment => {
      totalFee += appointment.service.fee / 1000;
      totalCategory += this.getCategoryEncoding(appointment.service.category);
      totalProcessingTime += appointment.service.processingTime === 'Same Day' ? 1 : 
        appointment.service.processingTime === '1-3 Days' ? 2 : 
        appointment.service.processingTime === '1 Week' ? 3 : 4;
      totalPopularity += (appointment.service.visitCount || 0) / 100;
    });
    
    return [
      totalFee / appointments.length,
      totalCategory / appointments.length,
      totalProcessingTime / appointments.length,
      totalPopularity / appointments.length
    ];
  }

  calculateSimilarity(userPrefs, serviceFeatures) {
    if (userPrefs.length !== serviceFeatures.length) return 0;
    
    let similarity = 0;
    for (let i = 0; i < userPrefs.length; i++) {
      similarity += Math.abs(userPrefs[i] - serviceFeatures[i]);
    }
    
    // Convert distance to similarity (lower distance = higher similarity)
    return 1 / (1 + similarity);
  }

  // ==================== Model Management ====================
  
  async retrainAllModels() {
    console.log('🔄 Retraining all ML models...');
    
    const results = {
      knn: await this.trainKNN(),
      bayes: await this.trainBayesianClassifier(),
      decisionTree: await this.trainDecisionTree()
    };
    
    console.log('📊 Model training results:', results);
    return results;
  }

  getModelStatus() {
    return {
      knn: this.isTrained.knn,
      bayes: this.isTrained.bayes,
      decisionTree: this.isTrained.decisionTree
    };
  }
}

export default new MLService();

