import React from 'react';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle, 
  CreditCard,
  RefreshCw
} from 'lucide-react';

const PaymentStatus = ({ payment, service, showDetails = false }) => {
  if (!payment || !service || service.fee <= 0) {
    return null;
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'refunded':
        return <RefreshCw className="w-4 h-4 text-blue-500" />;
      case 'unpaid':
      default:
        return <Clock className="w-4 h-4 text-yellow-500" />;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'paid':
        return 'Paid';
      case 'failed':
        return 'Failed';
      case 'refunded':
        return 'Refunded';
      case 'unpaid':
      default:
        return 'Pending';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid':
        return 'text-green-700 bg-green-50 border-green-200';
      case 'failed':
        return 'text-red-700 bg-red-50 border-red-200';
      case 'refunded':
        return 'text-blue-700 bg-blue-50 border-blue-200';
      case 'unpaid':
      default:
        return 'text-yellow-700 bg-yellow-50 border-yellow-200';
    }
  };

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(amount);
  };

  return (
    <div className={`border rounded-lg p-3 ${getStatusColor(payment.status)}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <CreditCard className="w-4 h-4" />
          <span className="font-medium text-sm">Payment Status</span>
        </div>
        <div className="flex items-center space-x-2">
          {getStatusIcon(payment.status)}
          <span className="font-medium text-sm">{getStatusText(payment.status)}</span>
        </div>
      </div>
      
      <div className="mt-2 flex items-center justify-between text-sm">
        <span>Amount:</span>
        <span className="font-medium">{formatAmount(payment.amount || service.fee)}</span>
      </div>

      {showDetails && payment.paymentId && (
        <div className="mt-2 pt-2 border-t border-current border-opacity-20">
          <div className="text-xs space-y-1">
            <div className="flex justify-between">
              <span>Payment ID:</span>
              <span className="font-mono">{payment.paymentId.slice(-8)}</span>
            </div>
            {payment.orderId && (
              <div className="flex justify-between">
                <span>Order ID:</span>
                <span className="font-mono">{payment.orderId.slice(-8)}</span>
              </div>
            )}
            {payment.refundId && (
              <div className="flex justify-between">
                <span>Refund ID:</span>
                <span className="font-mono">{payment.refundId.slice(-8)}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {payment.status === 'failed' && (
        <div className="mt-2 pt-2 border-t border-current border-opacity-20">
          <div className="flex items-center space-x-1 text-xs">
            <AlertTriangle className="w-3 h-3" />
            <span>Payment failed. Please try booking again.</span>
          </div>
        </div>
      )}

      {payment.refundStatus === 'requested' && (
        <div className="mt-2 pt-2 border-t border-current border-opacity-20">
          <div className="flex items-center space-x-1 text-xs">
            <Clock className="w-3 h-3" />
            <span>Refund requested. Processing may take 3-5 business days.</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentStatus;