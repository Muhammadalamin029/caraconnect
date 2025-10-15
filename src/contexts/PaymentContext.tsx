import { createContext, useContext, useState, useEffect, type FC, type ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { useWallet } from './WalletContext';
import { ipgWebCheckoutService, type IPGWebCheckoutRequest, type IPGWebCheckoutResponse } from '../services/ipgPaymentService';
import { createTransaction, updateTransaction } from '../firebase/database';
import type { Transaction } from '../firebase/schema';

interface PaymentContextType {
  // Payment state
  isProcessing: boolean;
  paymentMethods: string[];
  currentPayment: IPGWebCheckoutResponse | null;
  
  // Payment methods
  initiatePayment: (amount: number, paymentMethod: 'card' | 'bank_transfer', description?: string) => Promise<IPGWebCheckoutResponse>;
  processPaymentResponse: (urlParams: URLSearchParams) => Promise<boolean>;
  cancelPayment: (transactionId: string) => Promise<boolean>;
  
  // Payment history
  paymentHistory: Transaction[];
  refreshPaymentHistory: () => Promise<void>;
  
  // Test utilities
  getTestBankAccounts: () => Array<{bankName: string, accountNumber: string, accountName: string}>;
  getTestCards: () => Array<{type: string, number: string, expiry: string, cvv: string}>;
}

const PaymentContext = createContext<PaymentContextType | undefined>(undefined);

export const usePayment = () => {
  const context = useContext(PaymentContext);
  if (context === undefined) {
    throw new Error('usePayment must be used within a PaymentProvider');
  }
  return context;
};

export const PaymentProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { refreshWallet } = useWallet();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState<string[]>(['card', 'bank_transfer']);
  const [currentPayment, setCurrentPayment] = useState<IPGWebCheckoutResponse | null>(null);
  const [paymentHistory, setPaymentHistory] = useState<Transaction[]>([]);

  // Load payment methods on mount
  useEffect(() => {
    const methods = ipgWebCheckoutService.getSupportedPaymentMethods();
    setPaymentMethods(methods);
  }, []);

  // Load payment history
  const refreshPaymentHistory = async () => {
    if (!user) return;

    try {
      const { getTransactions } = await import('../firebase/database');
      const transactions = await getTransactions(user.uid);
      const paymentTransactions = transactions.filter(t => 
        t.type === 'deposit' && t.payment_method && t.payment_method !== 'wallet'
      );
      setPaymentHistory(paymentTransactions);
    } catch (error) {
      console.error('Failed to load payment history:', error);
    }
  };

  // Load payment history on mount
  useEffect(() => {
    refreshPaymentHistory();
  }, [user]);

  /**
   * Initiate a payment through IPG Web Checkout
   */
  const initiatePayment = async (
    amount: number, 
    paymentMethod: 'card' | 'bank_transfer', 
    description: string = 'Wallet deposit'
  ): Promise<IPGWebCheckoutResponse> => {
    if (!user) {
      throw new Error('User must be authenticated to make payments');
    }

    if (amount <= 0) {
      throw new Error('Amount must be greater than 0');
    }

    setIsProcessing(true);
    setCurrentPayment(null);

    try {
      // Create pending transaction record
      const transaction = await createTransaction({
        user_id: user.uid,
        type: 'deposit',
        amount,
        status: 'pending',
        description: `${description} via ${paymentMethod}`,
        payment_method: paymentMethod,
        payment_reference: `DEP_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      });

      // Prepare checkout request
      const checkoutRequest: IPGWebCheckoutRequest = {
        amount,
        currency: 'NGN',
        orderId: transaction.id,
        customerEmail: user.email || '',
        customerName: user.displayName || 'User',
        description,
        returnUrl: `${window.location.origin}/payment/callback?transaction=${transaction.id}`,
        paymentMethod,
      };

      // Create web checkout
      const checkoutResponse = await ipgWebCheckoutService.createWebCheckout(checkoutRequest);

      if (checkoutResponse.success && checkoutResponse.formData) {
        setCurrentPayment(checkoutResponse);
        
        // Redirect to IPG checkout page
        await ipgWebCheckoutService.createCheckoutForm(checkoutRequest);
        
        return checkoutResponse;
      } else {
        // Mark transaction as failed
        await updateTransaction(transaction.id, {
          status: 'failed',
        });
        
        throw new Error(checkoutResponse.error || 'Payment initiation failed');
      }
    } catch (error) {
      console.error('Payment initiation error:', error);
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Process payment response from IPG redirect
   */
  const processPaymentResponse = async (urlParams: URLSearchParams): Promise<boolean> => {
    try {
      const response = ipgWebCheckoutService.parsePaymentResponse(urlParams);
      
      if (response.success && response.transactionId) {
        // Find the local transaction
        const { getTransactions } = await import('../firebase/database');
        const transactions = await getTransactions(user?.uid || '');
        const localTransaction = transactions.find(t => t.id === response.transactionId);
        
        if (localTransaction) {
          // Update transaction status
          await updateTransaction(localTransaction.id, {
            status: 'completed',
            payment_reference: response.transactionId,
          });

          // Update wallet balance
          if (response.amount) {
            const { getWallet, updateWallet } = await import('../firebase/database');
            const wallet = await getWallet(user?.uid || '');
            
            if (wallet) {
              const newBalance = wallet.balance + response.amount;
              await updateWallet(wallet.id, {
                balance: newBalance,
              }, user?.uid || '');
            }
          }

          // Refresh wallet and payment history
          await refreshWallet();
          await refreshPaymentHistory();
          
          return true;
        }
      } else {
        // Handle failed payment
        const transactionId = urlParams.get('transaction');
        if (transactionId) {
          await updateTransaction(transactionId, {
            status: 'failed',
          });
        }
      }
      
      return response.success;
    } catch (error) {
      console.error('Payment response processing error:', error);
      return false;
    }
  };

  /**
   * Cancel a payment
   */
  const cancelPayment = async (transactionId: string): Promise<boolean> => {
    try {
      // Mark local transaction as cancelled
      const { getTransactions } = await import('../firebase/database');
      const transactions = await getTransactions(user?.uid || '');
      const localTransaction = transactions.find(t => t.payment_reference === transactionId);
      
      if (localTransaction) {
        await updateTransaction(localTransaction.id, {
          status: 'cancelled',
        });
        await refreshPaymentHistory();
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Payment cancellation error:', error);
      return false;
    }
  };

  const value: PaymentContextType = {
    isProcessing,
    paymentMethods,
    currentPayment,
    initiatePayment,
    processPaymentResponse,
    cancelPayment,
    paymentHistory,
    refreshPaymentHistory,
    getTestBankAccounts: () => ipgWebCheckoutService.getTestBankAccounts(),
    getTestCards: () => ipgWebCheckoutService.getTestCards(),
  };

  return (
    <PaymentContext.Provider value={value}>
      {children}
    </PaymentContext.Provider>
  );
};
