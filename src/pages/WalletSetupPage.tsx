import { useState, type FC } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useWallet } from '../contexts/WalletContext';
import { 
  WalletIcon,
  CheckCircleIcon,
  ArrowRightIcon,
  ShieldCheckIcon,
  CurrencyDollarIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const WalletSetupPage: FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { refreshWallet } = useWallet();
  const [loading, setLoading] = useState(false);

  const handleCreateWallet = async () => {
    if (!user) {
      toast.error('You must be logged in to create a wallet');
      return;
    }

    try {
      setLoading(true);
      
      // Import wallet creation function
      const { createWallet } = await import('../firebase/database');
      
      // Create wallet for the user
      const newWallet = await createWallet({
        user_id: user.uid,
        balance: 0,
        escrow_balance: 0,
        total_earned: 0,
        total_spent: 0,
      });
      
      console.log('Wallet created successfully:', newWallet);
      toast.success('Wallet created successfully!');
      
      // Refresh wallet context and then navigate
      await refreshWallet();
      navigate('/wallet');
    } catch (error: any) {
      console.error('Error creating wallet:', error);
      toast.error(error.message || 'Failed to create wallet');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Please log in</h2>
          <p className="text-slate-400 mb-6">You need to be logged in to set up your wallet.</p>
          <button
            onClick={() => navigate('/login')}
            className="px-6 py-3 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="mx-auto w-24 h-24 bg-cyan-100 rounded-full flex items-center justify-center mb-6">
            <WalletIcon className="h-12 w-12 text-cyan-600" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">Set Up Your Wallet</h1>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto">
            Create your digital wallet to start earning and spending on CaraConnect
          </p>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <ShieldCheckIcon className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Secure & Safe</h3>
            <p className="text-slate-400">
              Your funds are protected with bank-level security and escrow protection
            </p>
          </div>

          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <CurrencyDollarIcon className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Easy Payments</h3>
            <p className="text-slate-400">
              Add funds via card or bank transfer, withdraw to your bank account
            </p>
          </div>

          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
              <ClockIcon className="h-8 w-8 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Instant Transfers</h3>
            <p className="text-slate-400">
              Send and receive payments instantly between users
            </p>
          </div>
        </div>

        {/* Wallet Benefits */}
        <div className="bg-slate-800 rounded-lg p-8 mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">What you can do with your wallet:</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-start">
                <CheckCircleIcon className="h-6 w-6 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-white">Post Tasks</h3>
                  <p className="text-slate-400 text-sm">Create tasks and pay runners securely</p>
                </div>
              </div>
              <div className="flex items-start">
                <CheckCircleIcon className="h-6 w-6 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-white">Earn Money</h3>
                  <p className="text-slate-400 text-sm">Complete tasks and get paid instantly</p>
                </div>
              </div>
              <div className="flex items-start">
                <CheckCircleIcon className="h-6 w-6 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-white">Track Transactions</h3>
                  <p className="text-slate-400 text-sm">View all your payment history</p>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-start">
                <CheckCircleIcon className="h-6 w-6 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-white">Escrow Protection</h3>
                  <p className="text-slate-400 text-sm">Your money is safe until tasks are completed</p>
                </div>
              </div>
              <div className="flex items-start">
                <CheckCircleIcon className="h-6 w-6 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-white">Easy Withdrawals</h3>
                  <p className="text-slate-400 text-sm">Withdraw earnings to your bank account</p>
                </div>
              </div>
              <div className="flex items-start">
                <CheckCircleIcon className="h-6 w-6 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-white">No Hidden Fees</h3>
                  <p className="text-slate-400 text-sm">Transparent pricing with no surprise charges</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Setup Button */}
        <div className="text-center">
          <button
            onClick={handleCreateWallet}
            disabled={loading}
            className="inline-flex items-center px-8 py-4 bg-cyan-600 text-white text-lg font-semibold rounded-lg hover:bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                Creating Wallet...
              </>
            ) : (
              <>
                Create My Wallet
                <ArrowRightIcon className="h-5 w-5 ml-3" />
              </>
            )}
          </button>
          <p className="text-slate-400 text-sm mt-4">
            It only takes a few seconds to set up your wallet
          </p>
        </div>

        {/* Back Button */}
        <div className="text-center mt-8">
          <button
            onClick={() => navigate(-1)}
            className="text-slate-400 hover:text-white transition-colors"
          >
            ← Go Back
          </button>
        </div>
      </div>
    </div>
  );
};

export default WalletSetupPage;
