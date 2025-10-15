import { type FC, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useWallet } from '../contexts/WalletContext';
import { useTasks } from '../contexts/TaskContext';
import { getReviews } from '../firebase/database';
import type { Review } from '../firebase/schema';
import { 
  PlusIcon, 
  MapPinIcon, 
  ClockIcon, 
  CurrencyDollarIcon,
  UserGroupIcon,
  ChatBubbleLeftRightIcon,
  WalletIcon
} from '@heroicons/react/24/outline';

const DashboardPage: FC = () => {
  const { userProfile, user } = useAuth();
  const { wallet, loading: walletLoading } = useWallet();
  const { userTasks, loading: tasksLoading } = useTasks();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);

  // Load reviews when user changes
  useEffect(() => {
    const loadReviews = async () => {
      if (!user) {
        setReviews([]);
        setReviewsLoading(false);
        return;
      }

      try {
        setReviewsLoading(true);
        const userReviews = await getReviews(user.uid);
        setReviews(userReviews);
      } catch (error) {
        console.error('Error loading reviews:', error);
        setReviews([]);
      } finally {
        setReviewsLoading(false);
      }
    };

    loadReviews();
  }, [user]);

  // Helper functions
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(amount);
  };

  // Calculate statistics
  const completedTasks = userTasks.filter(task => task.status === 'completed').length;
  const activeTasks = userTasks.filter(task => 
    task.status === 'pending' || task.status === 'accepted' || task.status === 'in_progress'
  ).length;
  
  // Calculate average rating from reviews or use profile rating
  const calculateAverageRating = () => {
    if (reviews.length === 0) {
      return userProfile?.rating || 5.0; // Use profile rating or default
    }
    
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = totalRating / reviews.length;
    return Math.round(averageRating * 10) / 10; // Round to 1 decimal place
  };

  const averageRating = calculateAverageRating();

  // Show loading state if data is still being fetched
  if (walletLoading || tasksLoading || reviewsLoading) {
    return (
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        {/* Welcome section */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">
            Welcome back, {userProfile?.full_name || 'User'}!
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Ready to {userProfile?.is_runner ? 'find tasks' : 'post a task'}?
          </p>
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 mb-8">
          {userProfile?.is_requester && (
            <Link
              to="/tasks/create"
              className="relative group bg-slate-800 p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-accent-500 rounded-lg border border-slate-700 hover:border-cyan-500"
            >
              <div>
                <span className="rounded-lg inline-flex p-3 bg-cyan-500 text-white">
                  <PlusIcon className="h-6 w-6" />
                </span>
              </div>
              <div className="mt-8">
                <h3 className="text-lg font-medium text-white">
                  Post a Task
                </h3>
                <p className="mt-2 text-sm text-slate-400">
                  Need help with something? Post a task and let the community help you.
                </p>
              </div>
            </Link>
          )}

          {userProfile?.is_runner && (
            <Link
              to="/tasks"
              className="relative group bg-slate-800 p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-accent-500 rounded-lg border border-slate-700 hover:border-cyan-500"
            >
              <div>
                <span className="rounded-lg inline-flex p-3 bg-cyan-500 text-white">
                  <MapPinIcon className="h-6 w-6" />
                </span>
              </div>
              <div className="mt-8">
                <h3 className="text-lg font-medium text-white">
                  Browse Tasks
                </h3>
                <p className="mt-2 text-sm text-slate-400">
                  Find tasks near you and start earning money.
                </p>
              </div>
            </Link>
          )}

          <Link
            to="/wallet"
            className="relative group bg-slate-800 p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-accent-500 rounded-lg border border-slate-700 hover:border-cyan-500"
          >
            <div>
              <span className="rounded-lg inline-flex p-3 bg-cyan-500 text-white">
                <WalletIcon className="h-6 w-6" />
              </span>
            </div>
            <div className="mt-8">
              <h3 className="text-lg font-medium text-white">
                My Wallet
              </h3>
              <p className="mt-2 text-sm text-slate-400">
                {walletLoading ? 'Loading...' : wallet ? formatCurrency(wallet.balance) : '₦0.00'}
              </p>
              {wallet && (
                <p className="mt-1 text-xs text-slate-500">
                  Escrow: {formatCurrency(wallet.escrow_balance)}
                </p>
              )}
            </div>
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5">
          {/* Wallet Balance Card */}
          <div className="bg-slate-800 overflow-hidden shadow rounded-lg border border-slate-700">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <WalletIcon className="h-6 w-6 text-cyan-500" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-slate-400 truncate">
                      Wallet Balance
                    </dt>
                    <dd className="text-lg font-medium text-white">
                      {wallet ? formatCurrency(wallet.balance) : '₦0.00'}
                    </dd>
                    {wallet && wallet.escrow_balance > 0 && (
                      <dd className="text-sm text-slate-500">
                        Escrow: {formatCurrency(wallet.escrow_balance)}
                      </dd>
                    )}
                  </dl>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-slate-800 overflow-hidden shadow rounded-lg border border-slate-700">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CurrencyDollarIcon className="h-6 w-6 text-cyan-500" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-slate-400 truncate">
                      Total Earnings
                    </dt>
                    <dd className="text-lg font-medium text-white">
                      {walletLoading ? 'Loading...' : wallet ? formatCurrency(wallet.total_earned) : '₦0.00'}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-800 overflow-hidden shadow rounded-lg border border-slate-700">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <UserGroupIcon className="h-6 w-6 text-cyan-500" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-slate-400 truncate">
                      Tasks Completed
                    </dt>
                    <dd className="text-lg font-medium text-white">
                      {tasksLoading ? 'Loading...' : completedTasks}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-800 overflow-hidden shadow rounded-lg border border-slate-700">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ClockIcon className="h-6 w-6 text-cyan-500" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-slate-400 truncate">
                      Active Tasks
                    </dt>
                    <dd className="text-lg font-medium text-white">
                      {tasksLoading ? 'Loading...' : activeTasks}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-800 overflow-hidden shadow rounded-lg border border-slate-700">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ChatBubbleLeftRightIcon className="h-6 w-6 text-cyan-500" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-slate-400 truncate">
                      Rating
                    </dt>
                    <dd className="text-lg font-medium text-white">
                      {averageRating.toFixed(1)} ⭐
                      {reviews.length > 0 && (
                        <span className="text-sm text-slate-400 ml-1">
                          ({reviews.length} review{reviews.length !== 1 ? 's' : ''})
                        </span>
                      )}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;