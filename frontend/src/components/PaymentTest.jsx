import React, { useState, useEffect } from 'react';
import { CreditCard, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';
import paymentService from '../services/paymentService';

const PaymentTest = () => {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    testPaymentService();
  }, []);

  const testPaymentService = async () => {
    try {
      setLoading(true);
      setError('');

      // Test configuration loading
      const keyId = await paymentService.loadConfig();
      setConfig({ keyId });

      console.log('✅ Payment service configuration loaded:', keyId);
    } catch (err) {
      setError(err.message);
      console.error('❌ Payment service test failed:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 border rounded-lg bg-blue-50 border-blue-200">
        <div className="flex items-center space-x-2">
          <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
          <span className="text-blue-800">Testing payment integration...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 border rounded-lg bg-red-50 border-red-200">
        <div className="flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 text-red-600" />
          <span className="text-red-800">Payment integration error: {error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 border rounded-lg bg-green-50 border-green-200">
      <div className="flex items-center space-x-2 mb-2">
        <CheckCircle className="w-4 h-4 text-green-600" />
        <span className="text-green-800 font-medium">Payment Integration Ready</span>
      </div>
      <div className="text-sm text-green-700">
        <div className="flex items-center space-x-2">
          <CreditCard className="w-4 h-4" />
          <span>Razorpay Key: {config?.keyId?.substring(0, 15)}...</span>
        </div>
        <div className="mt-1 text-xs">
          ✅ Payment service configured and ready for transactions
        </div>
      </div>
    </div>
  );
};

export default PaymentTest;