import { useEffect, useState, type FC } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { usePayment } from '../contexts/PaymentContext';
import { updateTransaction } from '../firebase/database';
import { CheckCircleIcon, XCircleIcon, ClockIcon } from '@heroicons/react/24/outline';
import LoadingSpinner from '../components/LoadingSpinner';

const PaymentCallbackPage: FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { processPaymentResponse } = usePayment();
  
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'pending'>('loading');
  const [message, setMessage] = useState('');
  const [transactionId, setTransactionId] = useState<string | null>(null);

  useEffect(() => {
    const processPaymentCallback = async () => {
      try {
        // Get parameters from URL
        const paymentStatus = searchParams.get('status');
        const transactionIdParam = searchParams.get('transaction');
        const errorMessage = searchParams.get('error');
        const amount = searchParams.get('amount');

        setTransactionId(transactionIdParam);

        if (errorMessage) {
          setStatus('error');
          setMessage(errorMessage);
          return;
        }

        if (paymentStatus === 'success' && transactionIdParam) {
          // Process payment response
          const success = await processPaymentResponse(searchParams);
          
          if (success) {
            setStatus('success');
            setMessage(`Payment of ₦${amount || '0'} completed successfully!`);
            
            // Redirect to wallet page after 3 seconds
            setTimeout(() => {
              navigate('/wallet');
            }, 3000);
          } else {
            setStatus('error');
            setMessage('Payment failed. Please try again.');
          }
        } else if (paymentStatus === 'cancelled') {
          setStatus('error');
          setMessage('Payment was cancelled.');
        } else {
          setStatus('error');
          setMessage('Invalid payment response.');
        }
      } catch (error) {
        console.error('Payment callback error:', error);
        setStatus('error');
        setMessage('An error occurred while processing your payment.');
      }
    };

    if (user) {
      processPaymentCallback();
    } else {
      navigate('/login');
    }
  }, [searchParams, user, processPaymentResponse, navigate]);

  const getStatusIcon = () => {
    switch (status) {
      case 'success':
        return <CheckCircleIcon className="h-16 w-16 text-green-500" />;
      case 'error':
        return <XCircleIcon className="h-16 w-16 text-red-500" />;
      case 'pending':
        return <ClockIcon className="h-16 w-16 text-yellow-500" />;
      default:
        return <LoadingSpinner />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'success':
        return 'text-green-400';
      case 'error':
        return 'text-red-400';
      case 'pending':
        return 'text-yellow-400';
      default:
        return 'text-slate-400';
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner />
          <p className="text-slate-400 mt-4">Processing your payment...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-slate-800 rounded-lg p-8 max-w-md w-full text-center">
        <div className="flex justify-center mb-6">
          {getStatusIcon()}
        </div>
        
        <h1 className={`text-2xl font-bold mb-4 ${getStatusColor()}`}>
          {status === 'success' && 'Payment Successful!'}
          {status === 'error' && 'Payment Failed'}
          {status === 'pending' && 'Payment Pending'}
        </h1>
        
        <p className="text-slate-300 mb-6">
          {message}
        </p>

        {transactionId && (
          <div className="bg-slate-700 rounded-lg p-4 mb-6">
            <p className="text-sm text-slate-400">Transaction ID</p>
            <p className="text-slate-300 font-mono text-sm">{transactionId}</p>
          </div>
        )}

        <div className="space-y-3">
          <button
            onClick={() => navigate('/wallet')}
            className="w-full px-4 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Wallet
          </button>
          
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full px-4 py-3 bg-slate-600 text-white font-medium rounded-lg hover:bg-slate-700 transition-colors"
          >
            Go to Dashboard
          </button>
        </div>

        {status === 'success' && (
          <p className="text-xs text-slate-500 mt-4">
            You will be redirected to your wallet in a few seconds...
          </p>
        )}
      </div>
    </div>
  );
};

export default PaymentCallbackPage;
