import { useState, useEffect, type FC } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  UserGroupIcon, 
  ClipboardDocumentListIcon, 
  CurrencyDollarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  ShieldCheckIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import { 
  getAllUsers, 
  getTasks, 
  getAllTransactions, 
  getAllWallets,
  updateUser,
  deleteUser,
  updateTask,
  deleteTask,
  updateTransaction,
  getAllReviews
} from '../firebase/database';
import type { User, Task, Transaction, Wallet, Review } from '../firebase/schema';
import toast from 'react-hot-toast';

const AdminDashboardPage: FC = () => {
  const { userProfile } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    users: [] as User[],
    tasks: [] as Task[],
    transactions: [] as Transaction[],
    wallets: [] as Wallet[],
    reviews: [] as Review[]
  });
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalTasks: 0,
    totalTransactions: 0,
    totalRevenue: 0,
    activeUsers: 0,
    completedTasks: 0,
    pendingTasks: 0,
    totalEarnings: 0
  });

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    try {
      setLoading(true);
      const [users, tasks, transactions, wallets, reviews] = await Promise.all([
        getAllUsers(),
        getTasks(),
        getAllTransactions(),
        getAllWallets(),
        getAllReviews()
      ]);

      setData({ users, tasks, transactions, wallets, reviews });

      // Calculate statistics
      const totalRevenue = transactions
        .filter(t => t.type === 'commission' && t.status === 'completed')
        .reduce((sum, t) => sum + t.amount, 0);

      const totalEarnings = transactions
        .filter(t => t.type === 'task_earning' && t.status === 'completed')
        .reduce((sum, t) => sum + t.amount, 0);

      const activeUsers = users.filter(u => u.is_runner || u.is_requester).length;
      const completedTasks = tasks.filter(t => t.status === 'completed').length;
      const pendingTasks = tasks.filter(t => t.status === 'pending').length;

      setStats({
        totalUsers: users.length,
        totalTasks: tasks.length,
        totalTransactions: transactions.length,
        totalRevenue,
        activeUsers,
        completedTasks,
        pendingTasks,
        totalEarnings
      });
    } catch (error) {
      console.error('Error loading admin data:', error);
      toast.error('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(amount);
  };

  const formatDate = (date: any) => {
    if (!date) return 'N/A';
    const dateObj = date.toDate ? date.toDate() : new Date(date);
    return dateObj.toLocaleDateString('en-NG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleUserAction = async (userId: string, action: 'activate' | 'deactivate' | 'delete') => {
    try {
      if (action === 'delete') {
        await deleteUser(userId);
        toast.success('User deleted successfully');
      } else {
        await updateUser(userId, { 
          is_active: action === 'activate' 
        });
        toast.success(`User ${action}d successfully`);
      }
      await loadAdminData();
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error('Failed to update user');
    }
  };

  const handleTaskAction = async (taskId: string, action: 'approve' | 'reject' | 'delete') => {
    try {
      if (action === 'delete') {
        await deleteTask(taskId);
        toast.success('Task deleted successfully');
      } else {
        await updateTask(taskId, { 
          status: action === 'approve' ? 'pending' : 'cancelled' 
        });
        toast.success(`Task ${action}d successfully`);
      }
      await loadAdminData();
    } catch (error) {
      console.error('Error updating task:', error);
      toast.error('Failed to update task');
    }
  };

  if (loading) {
    return (
      <div className="py-4 sm:py-6">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-4 sm:py-6">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Admin Dashboard</h1>
          <p className="text-sm sm:text-base text-slate-400">Manage platform users, tasks, and transactions</p>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-6">
          <nav className="flex space-x-1 bg-slate-800 p-1 rounded-lg">
            {[
              { id: 'overview', name: 'Overview', icon: ChartBarIcon },
              { id: 'users', name: 'Users', icon: UserGroupIcon },
              { id: 'tasks', name: 'Tasks', icon: ClipboardDocumentListIcon },
              { id: 'transactions', name: 'Transactions', icon: CurrencyDollarIcon },
              { id: 'reviews', name: 'Reviews', icon: ShieldCheckIcon },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    activeTab === tab.id
                      ? 'bg-cyan-500 text-white'
                      : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                  }`}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {tab.name}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              <div className="bg-slate-800 rounded-lg p-4 sm:p-6 border border-slate-700">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <UserGroupIcon className="h-6 w-6 sm:h-8 sm:w-8 text-cyan-500" />
                  </div>
                  <div className="ml-3 sm:ml-5">
                    <p className="text-xs sm:text-sm font-medium text-slate-400">Total Users</p>
                    <p className="text-lg sm:text-2xl font-bold text-white">{stats.totalUsers}</p>
                    <p className="text-xs text-slate-500">{stats.activeUsers} active</p>
                  </div>
                </div>
              </div>

              <div className="bg-slate-800 rounded-lg p-4 sm:p-6 border border-slate-700">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <ClipboardDocumentListIcon className="h-6 w-6 sm:h-8 sm:w-8 text-green-500" />
                  </div>
                  <div className="ml-3 sm:ml-5">
                    <p className="text-xs sm:text-sm font-medium text-slate-400">Total Tasks</p>
                    <p className="text-lg sm:text-2xl font-bold text-white">{stats.totalTasks}</p>
                    <p className="text-xs text-slate-500">{stats.completedTasks} completed</p>
                  </div>
                </div>
              </div>

              <div className="bg-slate-800 rounded-lg p-4 sm:p-6 border border-slate-700">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <CurrencyDollarIcon className="h-6 w-6 sm:h-8 sm:w-8 text-yellow-500" />
                  </div>
                  <div className="ml-3 sm:ml-5">
                    <p className="text-xs sm:text-sm font-medium text-slate-400">Platform Revenue</p>
                    <p className="text-lg sm:text-2xl font-bold text-white">{formatCurrency(stats.totalRevenue)}</p>
                    <p className="text-xs text-slate-500">From commissions</p>
                  </div>
                </div>
              </div>

              <div className="bg-slate-800 rounded-lg p-4 sm:p-6 border border-slate-700">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <ChartBarIcon className="h-6 w-6 sm:h-8 sm:w-8 text-purple-500" />
                  </div>
                  <div className="ml-3 sm:ml-5">
                    <p className="text-xs sm:text-sm font-medium text-slate-400">Total Earnings</p>
                    <p className="text-lg sm:text-2xl font-bold text-white">{formatCurrency(stats.totalEarnings)}</p>
                    <p className="text-xs text-slate-500">User earnings</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-slate-800 rounded-lg p-4 sm:p-6 border border-slate-700">
              <h3 className="text-lg font-semibold text-white mb-4">Recent Activity</h3>
              <div className="space-y-3">
                {data.tasks.slice(0, 5).map((task) => (
                  <div key={task.id} className="flex items-center justify-between py-2 border-b border-slate-700 last:border-b-0">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        {task.status === 'completed' ? (
                          <CheckCircleIcon className="h-5 w-5 text-green-500" />
                        ) : task.status === 'pending' ? (
                          <ClockIcon className="h-5 w-5 text-yellow-500" />
                        ) : (
                          <XCircleIcon className="h-5 w-5 text-red-500" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{task.title}</p>
                        <p className="text-xs text-slate-400">
                          {formatDate(task.created_at)} • {formatCurrency(task.reward_amount)}
                        </p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      task.status === 'completed' 
                        ? 'bg-green-100 text-green-800' 
                        : task.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {task.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="bg-slate-800 rounded-lg border border-slate-700">
            <div className="px-4 sm:px-6 py-4 border-b border-slate-700">
              <h3 className="text-lg font-semibold text-white">Users Management</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-700">
                <thead className="bg-slate-700">
                  <tr>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">User</th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Role</th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Joined</th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Status</th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-slate-800 divide-y divide-slate-700">
                  {data.users.map((user) => (
                    <tr key={user.id}>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-8 w-8 rounded-full bg-slate-600 flex items-center justify-center">
                            <span className="text-sm font-medium text-white">
                              {user.full_name?.charAt(0) || 'U'}
                            </span>
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-white">{user.full_name}</div>
                            <div className="text-sm text-slate-400">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        <div className="flex space-x-1">
                          {user.is_runner && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Runner
                            </span>
                          )}
                          {user.is_requester && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              Requester
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                        {formatDate(user.created_at)}
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          user.is_active !== false 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {user.is_active !== false ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleUserAction(user.id, user.is_active !== false ? 'deactivate' : 'activate')}
                            className="text-cyan-400 hover:text-cyan-300"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleUserAction(user.id, 'delete')}
                            className="text-red-400 hover:text-red-300"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tasks Tab */}
        {activeTab === 'tasks' && (
          <div className="bg-slate-800 rounded-lg border border-slate-700">
            <div className="px-4 sm:px-6 py-4 border-b border-slate-700">
              <h3 className="text-lg font-semibold text-white">Tasks Management</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-700">
                <thead className="bg-slate-700">
                  <tr>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Task</th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Reward</th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Status</th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Created</th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-slate-800 divide-y divide-slate-700">
                  {data.tasks.map((task) => (
                    <tr key={task.id}>
                      <td className="px-4 sm:px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-white">{task.title}</div>
                          <div className="text-sm text-slate-400 truncate max-w-xs">{task.description}</div>
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-white">
                        {formatCurrency(task.reward_amount)}
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          task.status === 'completed' 
                            ? 'bg-green-100 text-green-800' 
                            : task.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {task.status}
                        </span>
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                        {formatDate(task.created_at)}
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleTaskAction(task.id, 'approve')}
                            className="text-green-400 hover:text-green-300"
                            disabled={task.status !== 'pending'}
                          >
                            <CheckCircleIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleTaskAction(task.id, 'reject')}
                            className="text-red-400 hover:text-red-300"
                            disabled={task.status === 'completed'}
                          >
                            <XCircleIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleTaskAction(task.id, 'delete')}
                            className="text-red-400 hover:text-red-300"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Transactions Tab */}
        {activeTab === 'transactions' && (
          <div className="bg-slate-800 rounded-lg border border-slate-700">
            <div className="px-4 sm:px-6 py-4 border-b border-slate-700">
              <h3 className="text-lg font-semibold text-white">Transactions</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-700">
                <thead className="bg-slate-700">
                  <tr>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Type</th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Amount</th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Status</th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Date</th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Description</th>
                  </tr>
                </thead>
                <tbody className="bg-slate-800 divide-y divide-slate-700">
                  {data.transactions.slice(0, 20).map((transaction) => (
                    <tr key={transaction.id}>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                          {transaction.type.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-white">
                        {formatCurrency(transaction.amount)}
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          transaction.status === 'completed' 
                            ? 'bg-green-100 text-green-800' 
                            : transaction.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {transaction.status}
                        </span>
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                        {formatDate(transaction.created_at)}
                      </td>
                      <td className="px-4 sm:px-6 py-4 text-sm text-slate-400">
                        {transaction.description}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Reviews Tab */}
        {activeTab === 'reviews' && (
          <div className="bg-slate-800 rounded-lg border border-slate-700">
            <div className="px-4 sm:px-6 py-4 border-b border-slate-700">
              <h3 className="text-lg font-semibold text-white">Reviews & Ratings</h3>
            </div>
            <div className="p-4 sm:p-6">
              {data.reviews.length === 0 ? (
                <p className="text-slate-400 text-center py-8">No reviews yet</p>
              ) : (
                <div className="space-y-4">
                  {data.reviews.map((review) => (
                    <div key={review.id} className="border border-slate-700 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <div className="flex text-yellow-400">
                              {[...Array(5)].map((_, i) => (
                                <span key={i} className={i < review.rating ? 'text-yellow-400' : 'text-slate-600'}>
                                  ⭐
                                </span>
                              ))}
                            </div>
                            <span className="text-sm text-slate-400">
                              {formatDate(review.created_at)}
                            </span>
                          </div>
                          <p className="text-white mb-2">{review.comment}</p>
                          <div className="flex items-center space-x-4 text-sm text-slate-400">
                            <span>From: {review.reviewer_name}</span>
                            <span>To: {review.reviewee_name}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboardPage;
