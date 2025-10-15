import { createContext, useContext, useState, useEffect, type FC, type ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { 
  getWallet, 
  updateWallet, 
  getTransactions, 
  createTransaction
} from '../firebase/database';
import type { Wallet, Transaction } from '../firebase/schema';

interface WalletContextType {
  wallet: Wallet | null;
  transactions: Transaction[];
  loading: boolean;
  needsWalletSetup: boolean;
  deposit: (amount: number, paymentMethod: 'card' | 'bank_transfer') => Promise<void>;
  withdraw: (amount: number, bankDetails: any) => Promise<void>;
  payForTask: (taskId: string, amount: number) => Promise<void>;
  receivePayment: (taskId: string, amount: number) => Promise<void>;
  refreshWallet: () => Promise<void>;
  refreshTransactions: () => Promise<void>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};

export const WalletProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [needsWalletSetup, setNeedsWalletSetup] = useState(false);

  useEffect(() => {
    if (user) {
      // Reset needsWalletSetup when user changes
      setNeedsWalletSetup(false);
      loadWalletData();
    } else {
      setWallet(null);
      setTransactions([]);
      setLoading(false);
      setNeedsWalletSetup(false);
    }
  }, [user]);

  // Listen for wallet update events
  useEffect(() => {
    const handleWalletUpdate = (event: CustomEvent) => {
      const { userId, type } = event.detail;
      console.log('=== WALLET UPDATE EVENT RECEIVED ===');
      console.log('Event details:', { userId, type, currentUser: user?.uid });
      console.log('Current wallet state before refresh:', { wallet: wallet?.balance, loading });
      
      // Only refresh if the update is for the current user
      if (user && userId === user.uid) {
        console.log('User matches, refreshing wallet data due to update event');
        loadWalletData();
      } else {
        console.log('User does not match or no user, skipping wallet refresh');
      }
    };

    console.log('Setting up wallet update event listener');
    window.addEventListener('walletUpdated', handleWalletUpdate as EventListener);
    return () => {
      console.log('Cleaning up wallet update event listener');
      window.removeEventListener('walletUpdated', handleWalletUpdate as EventListener);
    };
  }, [user, wallet, loading]);

  // Monitor wallet state changes
  useEffect(() => {
    console.log('=== WALLET STATE CHANGED ===');
    console.log('New wallet state:', { 
      balance: wallet?.balance, 
      user_id: wallet?.user_id, 
      loading,
      needsWalletSetup 
    });
  }, [wallet, loading, needsWalletSetup]);

  const loadWalletData = async () => {
    if (!user) return;

    let walletData = null;
    
    try {
      setLoading(true);
      console.log('=== WALLET CONTEXT DEBUG ===');
      console.log('Loading wallet for user:', user.uid);
      console.log('Current wallet state before load:', { wallet: wallet?.balance, loading });
      
      const [walletResult, transactionsData] = await Promise.all([
        getWallet(user.uid),
        getTransactions(user.uid, 50)
      ]);
      
      walletData = walletResult;
      console.log('Wallet data received from database:', walletData);
      console.log('Wallet balance from database:', walletData?.balance);
      console.log('Transactions data received:', transactionsData);
      
      if (!walletData) {
        console.log('No wallet found for user, setting needsWalletSetup to true');
        setNeedsWalletSetup(true);
        setWallet(null);
        setTransactions([]);
        return;
      }
      
      console.log('Wallet found, setting wallet and clearing needsWalletSetup');
      console.log('Setting wallet state to:', walletData);
      setWallet(walletData);
      setTransactions(transactionsData || []);
      setNeedsWalletSetup(false);
      
      // Double-check that we have a valid wallet
      if (walletData && walletData.user_id) {
        console.log('Wallet validation passed, wallet is valid');
        console.log('Final wallet state set:', { balance: walletData.balance, user_id: walletData.user_id });
      } else {
        console.log('Wallet validation failed, wallet data is invalid');
        setNeedsWalletSetup(true);
      }
    } catch (error) {
      console.error('Error loading wallet data:', error);
      // Only set needsWalletSetup to true if we don't have a wallet
      // If we have a wallet but transactions failed to load, we still have a valid wallet
      if (!walletData) {
        setNeedsWalletSetup(true);
      }
    } finally {
      setLoading(false);
      console.log('Wallet loading completed, loading set to false');
    }
  };

  const deposit = async (amount: number, paymentMethod: 'card' | 'bank_transfer') => {
    if (!user || !wallet) {
      throw new Error('User must be authenticated and have a wallet');
    }

    if (amount <= 0) {
      throw new Error('Amount must be greater than 0');
    }

    try {
      // Create pending transaction
      const transaction = await createTransaction({
        user_id: user.uid,
        type: 'deposit',
        amount,
        status: 'pending',
        description: `Deposit via ${paymentMethod}`,
        payment_method: paymentMethod,
        payment_reference: `DEP_${Date.now()}`,
      });

      // TODO: Integrate with payment gateway (Interswitch)
      // For now, we'll simulate a successful payment
      setTimeout(async () => {
        try {
          // Update transaction status
          const { updateTransaction } = await import('../firebase/database');
          
          await updateTransaction(transaction.id, {
            status: 'completed',
          });

          // Update wallet balance
          const newBalance = wallet.balance + amount;
          await updateWallet(wallet.id, {
            balance: newBalance,
          }, user.uid);

          // Refresh wallet data
          await refreshWallet();
        } catch (error) {
          console.error('Error processing deposit:', error);
        }
      }, 2000); // Simulate 2-second processing time

    } catch (error) {
      console.error('Error creating deposit:', error);
      throw error;
    }
  };

  const withdraw = async (amount: number, bankDetails: any) => {
    if (!user || !wallet) {
      throw new Error('User must be authenticated and have a wallet');
    }

    if (amount <= 0) {
      throw new Error('Amount must be greater than 0');
    }

    if (amount > wallet.balance) {
      throw new Error('Insufficient balance');
    }

    try {
      // Create withdrawal transaction
      const transaction = await createTransaction({
        user_id: user.uid,
        type: 'withdrawal',
        amount,
        status: 'pending',
        description: `Withdrawal to ${bankDetails.accountNumber}`,
        payment_method: 'bank_transfer',
        payment_reference: `WTH_${Date.now()}`,
      });

      // TODO: Integrate with payment gateway for bank transfer
      // For now, we'll simulate processing
      setTimeout(async () => {
        try {
          // Update transaction status
          const { updateTransaction } = await import('../firebase/database');
          
          await updateTransaction(transaction.id, {
            status: 'completed',
          });

          // Update wallet balance
          const newBalance = wallet.balance - amount;
          await updateWallet(wallet.id, {
            balance: newBalance,
          }, user.uid);

          // Refresh wallet data
          await refreshWallet();
        } catch (error) {
          console.error('Error processing withdrawal:', error);
        }
      }, 5000); // Simulate 5-second processing time

    } catch (error) {
      console.error('Error creating withdrawal:', error);
      throw error;
    }
  };

  const payForTask = async (taskId: string, amount: number) => {
    if (!user || !wallet) {
      throw new Error('User must be authenticated and have a wallet');
    }

    if (amount > wallet.balance) {
      throw new Error('Insufficient balance');
    }

    try {
      // Create task payment transaction
      await createTransaction({
        user_id: user.uid,
        type: 'task_payment',
        amount,
        status: 'completed',
        description: `Payment for task ${taskId}`,
        task_id: taskId,
        payment_method: 'wallet',
      });

      // Update wallet balance (move to escrow)
      const newBalance = wallet.balance - amount;
      const newEscrowBalance = wallet.escrow_balance + amount;
      
      await updateWallet(wallet.id, {
        balance: newBalance,
        escrow_balance: newEscrowBalance,
        total_spent: wallet.total_spent + amount,
      }, user.uid);

      // Refresh wallet data
      await refreshWallet();

    } catch (error) {
      console.error('Error processing task payment:', error);
      throw error;
    }
  };

  const receivePayment = async (taskId: string, amount: number) => {
    if (!user || !wallet) {
      throw new Error('User must be authenticated and have a wallet');
    }

    try {
      // Create task earning transaction
      await createTransaction({
        user_id: user.uid,
        type: 'task_earning',
        amount,
        status: 'completed',
        description: `Earning from task ${taskId}`,
        task_id: taskId,
        payment_method: 'wallet',
      });

      // Update wallet balance
      const newBalance = wallet.balance + amount;
      
      await updateWallet(wallet.id, {
        balance: newBalance,
        total_earned: wallet.total_earned + amount,
      }, user.uid);

      // Refresh wallet data
      await refreshWallet();

    } catch (error) {
      console.error('Error processing task earning:', error);
      throw error;
    }
  };

  const refreshWallet = async () => {
    if (user) {
      const walletData = await getWallet(user.uid);
      setWallet(walletData);
    }
  };

  const refreshTransactions = async () => {
    if (user) {
      const transactionsData = await getTransactions(user.uid, 50);
      setTransactions(transactionsData);
    }
  };

  const value: WalletContextType = {
    wallet,
    transactions,
    loading,
    needsWalletSetup,
    deposit,
    withdraw,
    payForTask,
    receivePayment,
    refreshWallet,
    refreshTransactions,
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
};