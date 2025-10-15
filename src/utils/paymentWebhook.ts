/**
 * Payment Webhook Handler
 * Handles IPG payment callbacks and updates transaction status
 */

import { updateTransaction, getWallet, updateWallet } from '../firebase/database';

export interface IPGWebhookData {
  transactionId: string;
  status: 'completed' | 'failed' | 'cancelled';
  amount: number;
  currency: string;
  orderId: string;
  timestamp: string;
  signature: string;
  message?: string;
}

/**
 * Process IPG webhook callback
 */
export const processIPGWebhook = async (webhookData: IPGWebhookData): Promise<boolean> => {
  try {
    // For web checkout, we rely on the redirect callback rather than webhook verification
    // The payment response is handled in PaymentCallbackPage
    console.log('Processing IPG webhook data:', webhookData);

    // Find the local transaction by orderId (which is our transaction ID)
    const { getTransactions } = await import('../firebase/database');
    const transactions = await getTransactions(webhookData.orderId);
    const localTransaction = transactions.find(t => t.payment_reference === webhookData.transactionId);

    if (!localTransaction) {
      console.error('Local transaction not found:', webhookData.orderId);
      return false;
    }

    // Update transaction status
    const newStatus = webhookData.status === 'completed' ? 'completed' : 
                     webhookData.status === 'failed' ? 'failed' : 'cancelled';

    await updateTransaction(localTransaction.id, {
      status: newStatus,
    });

    // If payment completed, update wallet balance
    if (webhookData.status === 'completed') {
      const wallet = await getWallet(localTransaction.user_id);
      
      if (wallet) {
        const newBalance = wallet.balance + webhookData.amount;
        await updateWallet(wallet.id, {
          balance: newBalance,
        }, localTransaction.user_id);

        // Dispatch wallet update event
        window.dispatchEvent(new CustomEvent('walletUpdated', { 
          detail: { 
            userId: localTransaction.user_id, 
            type: 'deposit',
            amount: webhookData.amount
          } 
        }));
      }
    }

    console.log('Webhook processed successfully:', {
      transactionId: webhookData.transactionId,
      status: webhookData.status,
      amount: webhookData.amount
    });

    return true;
  } catch (error) {
    console.error('Webhook processing error:', error);
    return false;
  }
};

/**
 * Handle payment success callback from IPG redirect
 */
export const handlePaymentSuccess = async (transactionId: string, amount: number, userId: string): Promise<boolean> => {
  try {
    // Find the transaction
    const { getTransactions } = await import('../firebase/database');
    const transactions = await getTransactions(userId);
    const localTransaction = transactions.find(t => t.payment_reference === transactionId);

    if (!localTransaction) {
      console.error('Local transaction not found for success callback');
      return false;
    }

    // Update transaction status
    await updateTransaction(localTransaction.id, {
      status: 'completed',
    });

    // Update wallet balance
    const wallet = await getWallet(userId);
    
    if (wallet) {
      const newBalance = wallet.balance + amount;
      await updateWallet(wallet.id, {
        balance: newBalance,
      }, userId);

      // Dispatch wallet update event
      window.dispatchEvent(new CustomEvent('walletUpdated', { 
        detail: { 
          userId, 
          type: 'deposit',
          amount
        } 
      }));
    }

    return true;
  } catch (error) {
    console.error('Payment success handling error:', error);
    return false;
  }
};

/**
 * Handle payment failure callback
 */
export const handlePaymentFailure = async (transactionId: string, userId: string): Promise<boolean> => {
  try {
    // Find the transaction
    const { getTransactions } = await import('../firebase/database');
    const transactions = await getTransactions(userId);
    const localTransaction = transactions.find(t => t.payment_reference === transactionId);

    if (!localTransaction) {
      console.error('Local transaction not found for failure callback');
      return false;
    }

    // Update transaction status
    await updateTransaction(localTransaction.id, {
      status: 'failed',
    });

    return true;
  } catch (error) {
    console.error('Payment failure handling error:', error);
    return false;
  }
};
