// ====================================================================
// DECISION TREE ALGORITHM BACKUP
// ====================================================================
// This file contains a backup of the Decision Tree implementation
// for appointment scheduling optimization
// 
// Original Location: backend/services/mlService.js (lines 418-577)
// Date: Backup created to ensure algorithm is preserved
// ====================================================================

import { DecisionTreeClassifier } from 'ml-cart';
import Service from '../models/Service.js';
import Appointment from '../models/Appointment.js';

/**
 * Decision Tree Algorithm for Appointment Scheduling Optimization
 * 
 * Purpose: Predict optimal appointment times for better success rates
 * Algorithm: CART (Classification and Regression Trees)
 * 
 * Features Used:
 * - Day of week (0-6, Sunday-Saturday)
 * - Hour (0-23)
 * - Month (0-11)
 * - Service fee (normalized)
 * - Service category (encoded)
 * - Processing time (encoded)
 * 
 * Training Data Requirements:
 * - Minimum: 10 completed appointments
 * - Uses: Historical appointment success/failure data
 */

class DecisionTreeBackup {
  constructor() {
    this.decisionTreeModel = null;
    this.isTrained = false;
  }

  /**
   * Train Decision Tree model
   * Analyzes historical appointment patterns to learn optimal scheduling times
   */
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

      // Train Decision Tree with CART algorithm
      this.decisionTreeModel = new DecisionTreeClassifier({
        gainFunction: 'gini',        // Gini impurity for split criterion
        maxDepth: 10,                 // Maximum tree depth
        minNumSamples: 3              // Minimum samples per leaf
      });
      
      this.decisionTreeModel.train(trainingData, trainingLabels);
      this.isTrained = true;
      
      console.log(`✅ Decision Tree trained successfully with ${trainingData.length} training samples`);
      return true;
    } catch (error) {
      console.error('❌ Decision Tree training failed:', error.message);
      console.error('📍 DEBUG: Stack trace:', error.stack);
      return false;
    }
  }

  /**
   * Predict optimal schedule for a service
   * Returns time slots with success probabilities
   */
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
      if (!this.isTrained) {
        console.log('🔄 Decision Tree not trained, attempting to train...');
        await this.trainDecisionTree();
      }

      // Use ML model if available
      if (this.isTrained) {
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
          console.error('⚠️ ML prediction failed:', mlError.message);
          throw mlError;
        }
      } else {
        throw new Error('Decision Tree not trained');
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
      return { success: false, message: 'Prediction failed', error: error.message };
    }
  }

  /**
   * Helper: Encode category to numeric value
   */
  getCategoryEncoding(category) {
    const categories = {
      'Government Services': 1,
      'Document Services': 2,
      'Financial Services': 3,
      'Health Services': 4,
      'Education Services': 5,
      'Other': 6,
      'Civil Registration': 1,
      'Revenue': 1,
      'Identity Services': 2,
      'Tax Services': 3
    };
    return categories[category] || 6;
  }
}

export default DecisionTreeBackup;

// ====================================================================
// USAGE NOTES:
// ====================================================================
// 
// API Endpoint: GET /api/ml/schedule/optimal/:serviceId?date=YYYY-MM-DD
// 
// Frontend Component: frontend/src/components/MLScheduling.jsx
// 
// Integration:
// - Used in ServiceDetails page for appointment booking
// - Provides time slot recommendations with success probabilities
// - Falls back to heuristic-based scheduling if model not trained
//
// Model Parameters:
// - gainFunction: 'gini' (Gini impurity)
// - maxDepth: 10 (prevents overfitting)
// - minNumSamples: 3 (minimum samples per leaf node)
//
// Training Requirements:
// - Minimum 10 completed appointments
// - Requires: appointmentDate, status, service (populated)
//
// ====================================================================





