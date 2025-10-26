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
  }

  // ==================== K-Nearest Neighbors (KNN) ====================
  // Service Recommendation based on user behavior patterns
  
  async trainKNN() {
    try {
      console.log('🤖 Training KNN model for service recommendations...');
      
      // Get user appointment data for training
      const appointments = await Appointment.find({ status: 'completed' })
        .populate('user', 'name email')
        .populate('service', 'name category fee processingTime')
        .lean();

      if (appointments.length < 10) {
        console.log('⚠️ Not enough data for KNN training. Need at least 10 completed appointments.');
        return false;
      }

      // Create user-service interaction matrix
      const userServiceMatrix = new Map();
      const serviceFeatures = new Map();
      
      // Build service feature vectors
      const services = await Service.find({ isActive: true }).lean();
      services.forEach((service, index) => {
        serviceFeatures.set(service._id.toString(), [
          service.fee / 1000, // Normalized fee
          this.getCategoryEncoding(service.category), // Category encoding
          service.processingTime === 'Same Day' ? 1 : 
          service.processingTime === '1-3 Days' ? 2 : 
          service.processingTime === '1 Week' ? 3 : 4, // Processing time encoding
          service.visitCount / 100 // Normalized popularity
        ]);
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

      // Prepare training data
      const trainingData = [];
      const trainingLabels = [];
      
      for (const [userId, services] of userServiceMatrix) {
        for (const [serviceId, rating] of services) {
          if (serviceFeatures.has(serviceId)) {
            trainingData.push(serviceFeatures.get(serviceId));
            trainingLabels.push(serviceId);
          }
        }
      }

      if (trainingData.length === 0) {
        console.log('⚠️ No valid training data for KNN');
        return false;
      }

      // Train KNN model
      this.knnModel = new KNN();
      this.knnModel.train(trainingData, trainingLabels, { k: 3 });
      this.isTrained.knn = true;
      
      console.log('✅ KNN model trained successfully');
      return true;
    } catch (error) {
      console.error('❌ KNN training failed:', error);
      return false;
    }
  }

  async getServiceRecommendations(userId, limit = 5) {
    try {
      if (!this.isTrained.knn) {
        await this.trainKNN();
      }

      if (!this.isTrained.knn) {
        return { success: false, message: 'KNN model not trained' };
      }

      // Get user's appointment history
      const userAppointments = await Appointment.find({ 
        user: userId, 
        status: 'completed' 
      }).populate('service', 'name category fee processingTime').lean();

      if (userAppointments.length === 0) {
        // If no history, return popular services
        const popularServices = await Service.find({ isActive: true })
          .sort({ visitCount: -1 })
          .limit(limit)
          .select('name description category fee processingTime visitCount');
        
        return { 
          success: true, 
          recommendations: popularServices,
          type: 'popular'
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
        
        const prediction = this.knnModel.predict([serviceFeatures]);
        const similarity = this.calculateSimilarity(userPreferences, serviceFeatures);
        
        recommendations.push({
          ...service,
          similarity: similarity,
          predictedCategory: prediction[0]
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
      
      const services = await Service.find({ isActive: true }).lean();
      
      if (services.length < 5) {
        console.log('⚠️ Not enough services for Bayesian training');
        return false;
      }

      const trainingData = [];
      const trainingLabels = [];
      
      services.forEach(service => {
        const features = [
          service.fee / 1000, // Normalized fee
          service.processingTime === 'Same Day' ? 1 : 
          service.processingTime === '1-3 Days' ? 2 : 
          service.processingTime === '1 Week' ? 3 : 4, // Processing time
          service.visitCount / 100, // Normalized popularity
          service.serviceCharge / 1000 // Normalized service charge
        ];
        
        trainingData.push(features);
        trainingLabels.push(service.category);
      });

      // Train Bayesian classifier
      this.bayesModel = new GaussianNB();
      this.bayesModel.train(trainingData, trainingLabels);
      this.isTrained.bayes = true;
      
      console.log('✅ Bayesian classifier trained successfully');
      return true;
    } catch (error) {
      console.error('❌ Bayesian training failed:', error);
      return false;
    }
  }

  async categorizeService(serviceData) {
    try {
      if (!this.isTrained.bayes) {
        await this.trainBayesianClassifier();
      }

      if (!this.isTrained.bayes) {
        return { success: false, message: 'Bayesian model not trained' };
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
      
      return {
        success: true,
        predictedCategory: prediction[0],
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

      if (appointments.length < 10) {
        console.log('⚠️ Not enough appointment data for Decision Tree training');
        return false;
      }

      const trainingData = [];
      const trainingLabels = [];
      
      appointments.forEach(appointment => {
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
      });

      // Train Decision Tree
      this.decisionTreeModel = new DecisionTreeClassifier({
        gainFunction: 'gini',
        maxDepth: 10,
        minNumSamples: 3
      });
      
      this.decisionTreeModel.train(trainingData, trainingLabels);
      this.isTrained.decisionTree = true;
      
      console.log('✅ Decision Tree trained successfully');
      return true;
    } catch (error) {
      console.error('❌ Decision Tree training failed:', error);
      return false;
    }
  }

  async predictOptimalSchedule(serviceId, preferredDate) {
    try {
      if (!this.isTrained.decisionTree) {
        await this.trainDecisionTree();
      }

      if (!this.isTrained.decisionTree) {
        return { success: false, message: 'Decision Tree model not trained' };
      }

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
          successProbability: probabilities[0][1], // Probability of success
          recommended: prediction[0] === 1
        });
      }

      // Sort by success probability
      predictions.sort((a, b) => b.successProbability - a.successProbability);
      
      return {
        success: true,
        predictions: predictions,
        bestTimeSlot: predictions[0],
        service: service
      };
    } catch (error) {
      console.error('❌ Schedule prediction failed:', error);
      return { success: false, message: 'Prediction failed', error: error.message };
    }
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
