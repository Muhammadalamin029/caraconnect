import { useState, useEffect, type FC } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useWallet } from '../contexts/WalletContext';
import { usePayment } from '../contexts/PaymentContext';
import { 
  PlusIcon, 
  ArrowDownTrayIcon, 
  CurrencyDollarIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  WalletIcon,
  ArrowPathIcon,
  MapPinIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const WalletPage: FC = () => {
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const { wallet, transactions, loading, needsWalletSetup, deposit, withdraw, refreshWallet } = useWallet();
  const { isProcessing, initiatePayment } = usePayment();
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [depositMethod, setDepositMethod] = useState<'card' | 'bank_transfer' | 'wallet'>('card');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [bankDetails, setBankDetails] = useState({
    accountNumber: '',
    bankName: '',
    accountName: ''
  });

  // Always refresh wallet data when page loads
  useEffect(() => {
    console.log('=== WALLET PAGE DEBUG ===');
    console.log('Page loaded, refreshing wallet data...');
    refreshWallet();
  }, []); // Empty dependency array - only run once when component mounts

  // Refresh wallet data when page becomes visible (user returns to tab)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('Page became visible, refreshing wallet data...');
        refreshWallet();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [refreshWallet]);

  // Redirect to wallet setup if needed
  useEffect(() => {
    console.log('=== WALLET PAGE STATE DEBUG ===');
    console.log('needsWalletSetup:', needsWalletSetup);
    console.log('wallet:', wallet);
    console.log('loading:', loading);
    
    // Only redirect if we're not loading and we definitely need wallet setup
    // Also check that we don't have a valid wallet
    if (!loading && needsWalletSetup && !wallet) {
      console.log('Redirecting to wallet setup - no wallet found');
      // Add a small delay to ensure we don't redirect too quickly
      const timeoutId = setTimeout(() => {
        navigate('/wallet-setup');
      }, 1000);
      
      return () => clearTimeout(timeoutId);
    } else if (wallet && wallet.user_id) {
      console.log('Wallet found and valid, not redirecting');
    }
  }, [needsWalletSetup, navigate, wallet, loading]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-NG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'pending':
        return <ClockIcon className="h-5 w-5 text-yellow-500" />;
      case 'failed':
      case 'cancelled':
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      default:
        return <ClockIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-400';
      case 'pending':
        return 'text-yellow-400';
      case 'failed':
      case 'cancelled':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(depositAmount);
    
    if (amount <= 0) {
      toast.error('Amount must be greater than 0');
      return;
    }

    try {
      if (depositMethod === 'wallet') {
        // Handle wallet-to-wallet transfer
        await deposit(amount, 'wallet');
        toast.success('Deposit completed successfully!');
      setShowDepositModal(false);
      setDepositAmount('');
      await refreshWallet();
      } else {
        // Handle external payment (card/bank transfer) via IPG
        console.log('Initiating IPG payment...', { amount, depositMethod });
        
        try {
          const paymentResponse = await initiatePayment(amount, depositMethod, 'Wallet deposit');
          console.log('Payment response:', paymentResponse);
          
          if (paymentResponse.success) {
            console.log('Payment initiated successfully, redirecting to IPG...');
            // The redirect happens automatically in the PaymentContext
          } else {
            throw new Error(paymentResponse.error || 'Payment initiation failed');
          }
        } catch (error) {
          console.error('Payment initiation error:', error);
          throw error;
        }
      }
    } catch (error: any) {
      toast.error(error.message || 'Deposit failed');
    }
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(withdrawAmount);
    
    if (amount <= 0) {
      toast.error('Amount must be greater than 0');
      return;
    }

    if (wallet && amount > wallet.balance) {
      toast.error('Insufficient balance');
      return;
    }

    if (!bankDetails.accountNumber || !bankDetails.bankName || !bankDetails.accountName) {
      toast.error('Please fill in all bank details');
      return;
    }

    try {
      await withdraw(amount, bankDetails);
      toast.success('Withdrawal initiated successfully!');
      setShowWithdrawModal(false);
      setWithdrawAmount('');
      setBankDetails({ accountNumber: '', bankName: '', accountName: '' });
      await refreshWallet();
    } catch (error: any) {
      toast.error(error.message || 'Withdrawal failed');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 p-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }


  if (!wallet) {
    return (
      <div className="min-h-screen bg-slate-900 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <WalletIcon className="mx-auto h-16 w-16 text-slate-400 mb-4" />
            <h2 className="text-2xl font-bold text-white mb-4">No Wallet Found</h2>
            <p className="text-slate-400 mb-8">
              You need to set up your wallet before you can manage funds and create tasks.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => window.location.href = '/wallet-setup'}
                className="inline-flex items-center px-6 py-3 bg-cyan-600 text-white font-medium rounded-lg hover:bg-cyan-700 transition-colors"
              >
                <WalletIcon className="h-5 w-5 mr-2" />
                Set Up Wallet
              </button>
              <button
                onClick={() => refreshWallet()}
                className="inline-flex items-center px-6 py-3 bg-slate-600 text-white font-medium rounded-lg hover:bg-slate-700 transition-colors"
              >
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                {userProfile?.is_runner ? 'Earnings Wallet' : 'Task Wallet'}
              </h1>
              <p className="text-sm sm:text-base text-slate-400">
                {userProfile?.is_runner 
                  ? 'Track your earnings and manage withdrawals' 
                  : 'Manage funds for posting tasks and view spending history'
                }
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => refreshWallet()}
                className="inline-flex items-center px-3 sm:px-4 py-2 border border-slate-600 text-slate-300 rounded-lg hover:bg-slate-700 hover:text-white transition-colors text-sm"
              >
                <ArrowPathIcon className="h-4 w-4 mr-2" />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Wallet Balance Cards - Different for Runners vs Requesters */}
        {userProfile?.is_runner ? (
          // Runner Wallet View
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
            <div className="bg-slate-800 rounded-lg p-4 sm:p-6 border border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                  <p className="text-slate-400 text-xs sm:text-sm">Available Balance</p>
                  <p className="text-xl sm:text-2xl font-bold text-white">
                  {wallet ? formatCurrency(wallet.balance) : '₦0.00'}
                </p>
                </div>
                <CurrencyDollarIcon className="h-6 w-6 sm:h-8 sm:w-8 text-green-500" />
              </div>
            </div>

            <div className="bg-slate-800 rounded-lg p-4 sm:p-6 border border-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-xs sm:text-sm">Escrow Balance</p>
                  <p className="text-xl sm:text-2xl font-bold text-white">
                    {wallet ? formatCurrency(wallet.escrow_balance) : '₦0.00'}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">Money from accepted tasks</p>
                </div>
                <ClockIcon className="h-6 w-6 sm:h-8 sm:w-8 text-yellow-500" />
              </div>
            </div>

            <div className="bg-slate-800 rounded-lg p-4 sm:p-6 border border-slate-700 sm:col-span-2 lg:col-span-1">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-xs sm:text-sm">Total Earned</p>
                  <p className="text-xl sm:text-2xl font-bold text-white">
                    {wallet ? formatCurrency(wallet.total_earned) : '₦0.00'}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">Lifetime earnings</p>
                </div>
                <CheckCircleIcon className="h-6 w-6 sm:h-8 sm:w-8 text-blue-500" />
              </div>
            </div>
          </div>
        ) : (
          // Requester Wallet View
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
            <div className="bg-slate-800 rounded-lg p-4 sm:p-6 border border-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-xs sm:text-sm">Available Balance</p>
                  <p className="text-xl sm:text-2xl font-bold text-white">
                    {wallet ? formatCurrency(wallet.balance) : '₦0.00'}
                  </p>
                </div>
                <CurrencyDollarIcon className="h-6 w-6 sm:h-8 sm:w-8 text-green-500" />
            </div>
          </div>

            <div className="bg-slate-800 rounded-lg p-4 sm:p-6 border border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                  <p className="text-slate-400 text-xs sm:text-sm">Escrow Balance</p>
                  <p className="text-xl sm:text-2xl font-bold text-white">
                  {wallet ? formatCurrency(wallet.escrow_balance) : '₦0.00'}
                </p>
                  <p className="text-xs text-slate-500 mt-1">Money held for active tasks</p>
                </div>
                <ClockIcon className="h-6 w-6 sm:h-8 sm:w-8 text-yellow-500" />
            </div>
          </div>

            <div className="bg-slate-800 rounded-lg p-4 sm:p-6 border border-slate-700 sm:col-span-2 lg:col-span-1">
            <div className="flex items-center justify-between">
              <div>
                  <p className="text-slate-400 text-xs sm:text-sm">Total Spent</p>
                  <p className="text-xl sm:text-2xl font-bold text-white">
                    {wallet ? formatCurrency(wallet.total_spent) : '₦0.00'}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">Total on tasks</p>
                </div>
                <ArrowDownTrayIcon className="h-6 w-6 sm:h-8 sm:w-8 text-red-500" />
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons - Different for Runners vs Requesters */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-6 sm:mb-8">
          {userProfile?.is_runner ? (
            // Runner Actions
            <>
              <button
                onClick={() => setShowWithdrawModal(true)}
                className="btn-primary flex items-center gap-2"
              >
                <ArrowDownTrayIcon className="h-5 w-5" />
                Withdraw Earnings
              </button>
              <button
                onClick={() => navigate('/tasks')}
                className="btn-secondary flex items-center gap-2"
              >
                <MapPinIcon className="h-5 w-5" />
                Browse Tasks
              </button>
            </>
          ) : (
            // Requester Actions
            <>
          <button
            onClick={() => setShowDepositModal(true)}
            className="btn-primary flex items-center gap-2"
          >
            <PlusIcon className="h-5 w-5" />
            Add Funds
          </button>
          <button
                onClick={() => navigate('/tasks/create')}
            className="btn-secondary flex items-center gap-2"
          >
                <PlusIcon className="h-5 w-5" />
                Post New Task
          </button>
            </>
          )}
        </div>

        {/* Transaction History */}
        <div className="bg-slate-800 rounded-lg border border-slate-700">
          <div className="px-6 py-4 border-b border-slate-700">
            <h2 className="text-lg font-semibold text-white">Transaction History</h2>
          </div>
          <div className="divide-y divide-slate-700">
            {transactions.length === 0 ? (
              <div className="px-6 py-8 text-center">
                <p className="text-slate-400">No transactions yet</p>
              </div>
            ) : (
              transactions.map((transaction) => (
                <div key={transaction.id} className="px-6 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(transaction.status)}
                    <div>
                      <p className="text-white font-medium">{transaction.description}</p>
                      <p className="text-sm text-slate-400">
                        {formatDate(transaction.created_at)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-medium ${transaction.type.includes('earning') || transaction.type === 'deposit' ? 'text-green-400' : 'text-red-400'}`}>
                      {transaction.type.includes('earning') || transaction.type === 'deposit' ? '+' : '-'}
                      {formatCurrency(transaction.amount)}
                    </p>
                    <p className={`text-sm ${getStatusColor(transaction.status)}`}>
                      {transaction.status}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Deposit Modal */}
        {showDepositModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-3 sm:p-4 z-50">
            <div className="bg-slate-800 rounded-lg p-4 sm:p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
              <h3 className="text-lg font-semibold text-white mb-4">Add Funds</h3>
              <form onSubmit={handleDeposit}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Amount (₦)
                  </label>
                  <input
                    type="number"
                    min="100"
                    step="100"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    className="input-field"
                    placeholder="1000"
                    required
                  />
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Payment Method
                  </label>
                  <select
                    value={depositMethod}
                    onChange={(e) => setDepositMethod(e.target.value as 'card' | 'bank_transfer' | 'wallet')}
                    className="input-field"
                    required
                  >
                    <option value="card">💳 Credit/Debit Card</option>
                    <option value="bank_transfer">🏦 Bank Transfer</option>
                    <option value="wallet">💰 Wallet Transfer</option>
                  </select>
                </div>

                {depositMethod !== 'wallet' && (
                  <div className="mb-4 p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg">
                    <p className="text-sm text-blue-300">
                      You will be redirected to a secure payment page to complete your transaction.
                    </p>
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowDepositModal(false)}
                    className="btn-secondary flex-1"
                    disabled={isProcessing}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary flex-1"
                    disabled={isProcessing}
                  >
                    {isProcessing ? 'Processing...' : 'Add Funds'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Withdraw Modal */}
        {showWithdrawModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-3 sm:p-4 z-50">
            <div className="bg-slate-800 rounded-lg p-4 sm:p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
              <h3 className="text-lg font-semibold text-white mb-4">Withdraw Funds</h3>
              <form onSubmit={handleWithdraw}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Amount (₦)
                    </label>
                    <input
                      type="number"
                      min="100"
                      step="100"
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      className="input-field"
                      placeholder="1000"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Account Number
                    </label>
                    <input
                      type="text"
                      value={bankDetails.accountNumber}
                      onChange={(e) => setBankDetails({...bankDetails, accountNumber: e.target.value})}
                      className="input-field"
                      placeholder="1234567890"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Bank Name
                    </label>
                    <input
                      type="text"
                      value={bankDetails.bankName}
                      onChange={(e) => setBankDetails({...bankDetails, bankName: e.target.value})}
                      className="input-field"
                      placeholder="Access Bank"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Account Name
                    </label>
                    <input
                      type="text"
                      value={bankDetails.accountName}
                      onChange={(e) => setBankDetails({...bankDetails, accountName: e.target.value})}
                      className="input-field"
                      placeholder="John Doe"
                      required
                    />
                  </div>
                </div>
                <div className="flex gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowWithdrawModal(false)}
                    className="btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary flex-1"
                  >
                    Withdraw
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WalletPage;
