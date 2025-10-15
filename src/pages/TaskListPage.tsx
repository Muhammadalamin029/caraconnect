import { useState, useEffect, type FC } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTasks } from '../contexts/TaskContext';
import { Link } from 'react-router-dom';
import { MapPinIcon, ClockIcon, UserIcon } from '@heroicons/react/24/outline';

const TaskListPage: FC = () => {
  const { userProfile } = useAuth();
  const { tasks, loading, refreshTasks } = useTasks();
  const [filter, setFilter] = useState<'all' | 'pending' | 'nearby'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    console.log('=== TASK LIST PAGE DEBUG ===');
    console.log('User Profile:', userProfile);
    console.log('Loading:', loading);
    console.log('Tasks:', tasks);
    refreshTasks();
  }, []); // Only run once on mount

  const filteredTasks = tasks.filter(task => {
    if (filter === 'pending' && task.status !== 'pending') return false;
    if (searchTerm && !task.title.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !task.description.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(amount);
  };

  const formatDate = (date: any) => {
    let dateObj;
    if (date && typeof date.toDate === 'function') {
      // Firestore Timestamp
      dateObj = date.toDate();
    } else if (date instanceof Date) {
      dateObj = date;
    } else if (typeof date === 'string') {
      dateObj = new Date(date);
    } else {
      return 'No date';
    }
    
    return dateObj.toLocaleDateString('en-NG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'accepted': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-purple-100 text-purple-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'delivery': return '📦';
      case 'pickup': return '🚗';
      case 'errand': return '🏃';
      default: return '📋';
    }
  };

  if (loading) {
    return (
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Browse Tasks</h1>
          <p className="text-slate-400">Find tasks that match your skills and location</p>
        </div>

        {/* Filters and Search */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              All Tasks
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'pending'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Available
            </button>
          </div>
        </div>

        {/* Task Grid */}
        {filteredTasks.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📋</div>
            <h3 className="text-xl font-semibold text-white mb-2">No tasks found</h3>
            <p className="text-slate-400 mb-6">
              {searchTerm ? 'Try adjusting your search terms' : 'No tasks available at the moment'}
            </p>
            {userProfile?.is_requester && (
              <Link
                to="/tasks/create"
                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                Post First Task
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTasks.map((task) => (
              <div
                key={task.id}
                className="bg-slate-800 rounded-lg p-6 hover:bg-slate-750 transition-colors border border-slate-700"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{getCategoryIcon(task.category)}</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                      {task.status.replace('_', ' ')}
                    </span>
                  </div>
                  <span className="text-2xl font-bold text-green-400">
                    {formatCurrency(task.reward_amount)}
                  </span>
                </div>

                <h3 className="text-lg font-semibold text-white mb-2 line-clamp-2">
                  {task.title}
                </h3>
                
                <p className="text-slate-400 text-sm mb-4 line-clamp-3">
                  {task.description}
                </p>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-slate-400">
                    <MapPinIcon className="h-4 w-4" />
                    <span className="truncate">{task.pickup_location.address}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-400">
                    <MapPinIcon className="h-4 w-4" />
                    <span className="truncate">{task.delivery_location.address}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-400">
                    <ClockIcon className="h-4 w-4" />
                    <span>Due: {formatDate(task.deadline)}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-slate-400">
                    <UserIcon className="h-4 w-4" />
                    <span>Posted by {task.requester_id?.substring(0, 8)}...</span>
                  </div>
                  <Link
                    to={`/tasks/${task.id}`}
                    className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create Task Button for Requesters */}
        {userProfile?.is_requester && (
          <div className="fixed bottom-6 right-6">
            <Link
              to="/tasks/create"
              className="inline-flex items-center justify-center w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-colors"
            >
              <span className="text-2xl">+</span>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskListPage;
