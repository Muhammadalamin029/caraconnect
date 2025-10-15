import { useState, useEffect, type FC } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTasks } from '../contexts/TaskContext';
import { 
  MapPinIcon, 
  ArrowLeftIcon
} from '@heroicons/react/24/outline';
import type { Task } from '../firebase/schema';

const TaskDetailsPage: FC = () => {
  const { id: taskId } = useParams<{ id: string }>();
  const { user, userProfile } = useAuth();
  const { getTaskById, acceptTask, startTask, completeTask, cancelTask } = useTasks();
  
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  useEffect(() => {
    if (taskId) {
      loadTask();
    }
  }, [taskId]);

  const loadTask = async () => {
    try {
      setLoading(true);
      console.log('=== TASK DETAILS DEBUG ===');
      console.log('Task ID:', taskId);
      console.log('Loading task...');
      
      const taskData = await getTaskById(taskId!);
      console.log('Task data received:', taskData);
      
      setTask(taskData);
    } catch (error) {
      console.error('Error loading task:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptTask = async () => {
    if (!user || !task) return;
    
    try {
      setActionLoading(true);
      await acceptTask(task.id, user.uid);
      await loadTask(); // Reload to get updated task data
    } catch (error) {
      console.error('Error accepting task:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleStartTask = async () => {
    if (!task) return;
    
    try {
      setActionLoading(true);
      await startTask(task.id);
      await loadTask();
    } catch (error) {
      console.error('Error starting task:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCompleteTask = async () => {
    if (!task) return;
    
    try {
      setActionLoading(true);
      await completeTask(task.id);
      await loadTask();
    } catch (error) {
      console.error('Error completing task:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelTask = async () => {
    if (!task) return;
    
    try {
      setActionLoading(true);
      await cancelTask(task.id, cancelReason);
      setShowCancelModal(false);
      setCancelReason('');
      await loadTask();
    } catch (error) {
      console.error('Error cancelling task:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-NG', {
      year: 'numeric',
      month: 'long',
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

  const canAcceptTask = () => {
    return userProfile?.is_runner && 
           task?.status === 'pending' && 
           task?.requester_id !== user?.uid;
  };

  const canStartTask = () => {
    return task?.runner_id === user?.uid && 
           task?.status === 'accepted';
  };

  const canCompleteTask = () => {
    return task?.requester_id === user?.uid && 
           task?.runner_id && 
           (task?.status === 'accepted' || task?.status === 'in_progress');
  };

  const canCancelTask = () => {
    return (task?.requester_id === user?.uid || task?.runner_id === user?.uid) && 
           task?.status !== 'completed' && 
           task?.status !== 'cancelled';
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

  if (!task) {
    return (
      <div className="min-h-screen bg-slate-900 p-8">
        <div className="text-center py-12">
          <div className="text-6xl mb-4">❌</div>
          <h3 className="text-xl font-semibold text-white mb-2">Task not found</h3>
          <p className="text-slate-400 mb-6">The task you're looking for doesn't exist or has been removed.</p>
          <Link
            to="/tasks"
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Back to Tasks
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            to="/tasks"
            className="inline-flex items-center text-slate-400 hover:text-white mb-4 transition-colors"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Back to Tasks
          </Link>
          
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-3xl">{getCategoryIcon(task.category)}</span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(task.status)}`}>
                  {task.status.replace('_', ' ').toUpperCase()}
                </span>
              </div>
              <h1 className="text-3xl font-bold text-white mb-2">{task.title}</h1>
              <p className="text-slate-400 text-lg">{task.description}</p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-green-400 mb-1">
                {formatCurrency(task.reward_amount)}
              </div>
              <div className="text-sm text-slate-400">
                Runner gets {formatCurrency(task.runner_amount)}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Locations */}
            <div className="bg-slate-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Locations</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center gap-2 text-sm text-slate-400 mb-1">
                    <MapPinIcon className="h-4 w-4" />
                    <span className="font-medium">Pickup Location</span>
                  </div>
                  <p className="text-white">{task.pickup_location.address}</p>
                  {task.pickup_location.instructions && (
                    <p className="text-slate-400 text-sm mt-1">
                      Note: {task.pickup_location.instructions}
                    </p>
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2 text-sm text-slate-400 mb-1">
                    <MapPinIcon className="h-4 w-4" />
                    <span className="font-medium">Delivery Location</span>
                  </div>
                  <p className="text-white">{task.delivery_location.address}</p>
                  {task.delivery_location.instructions && (
                    <p className="text-slate-400 text-sm mt-1">
                      Note: {task.delivery_location.instructions}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Task Details */}
            <div className="bg-slate-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Task Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-slate-400 mb-1">Category</div>
                  <div className="text-white capitalize">{task.category}</div>
                </div>
                <div>
                  <div className="text-sm text-slate-400 mb-1">Deadline</div>
                  <div className="text-white">{formatDate(task.deadline)}</div>
                </div>
                {task.expected_duration && (
                  <div>
                    <div className="text-sm text-slate-400 mb-1">Expected Duration</div>
                    <div className="text-white">{task.expected_duration} minutes</div>
                  </div>
                )}
                <div>
                  <div className="text-sm text-slate-400 mb-1">Commission</div>
                  <div className="text-white">{formatCurrency(task.commission_amount)}</div>
                </div>
              </div>
            </div>

            {/* Photos */}
            {task.photos && task.photos.length > 0 && (
              <div className="bg-slate-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Photos</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {task.photos.map((photo, index) => (
                    <img
                      key={index}
                      src={photo}
                      alt={`Task photo ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Actions */}
            <div className="bg-slate-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Actions</h3>
              <div className="space-y-3">
                {canAcceptTask() && (
                  <button
                    onClick={handleAcceptTask}
                    disabled={actionLoading}
                    className="w-full px-4 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {actionLoading ? 'Accepting...' : 'Accept Task'}
                  </button>
                )}

                {canStartTask() && (
                  <button
                    onClick={handleStartTask}
                    disabled={actionLoading}
                    className="w-full px-4 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {actionLoading ? 'Starting...' : 'Start Task'}
                  </button>
                )}

                {canCompleteTask() && (
                  <button
                    onClick={handleCompleteTask}
                    disabled={actionLoading}
                    className="w-full px-4 py-3 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {actionLoading ? 'Completing...' : 'Mark as Complete'}
                  </button>
                )}

                {canCancelTask() && (
                  <button
                    onClick={() => setShowCancelModal(true)}
                    className="w-full px-4 py-3 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Cancel Task
                  </button>
                )}
              </div>
            </div>

            {/* Task Info */}
            <div className="bg-slate-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Task Information</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-slate-400">Posted by</span>
                  <span className="text-white">{task.requester_id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Created</span>
                  <span className="text-white">{formatDate(task.created_at)}</span>
                </div>
                {task.runner_id && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Runner</span>
                    <span className="text-white">{task.runner_id}</span>
                  </div>
                )}
                {task.accepted_at && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Accepted</span>
                    <span className="text-white">{formatDate(task.accepted_at)}</span>
                  </div>
                )}
                {task.completed_at && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Completed</span>
                    <span className="text-white">{formatDate(task.completed_at)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Cancel Modal */}
        {showCancelModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-slate-800 rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold text-white mb-4">Cancel Task</h3>
              <p className="text-slate-400 mb-4">
                Are you sure you want to cancel this task? This action cannot be undone.
              </p>
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Reason for cancellation (optional)
                </label>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Enter reason for cancellation..."
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowCancelModal(false)}
                  className="flex-1 px-4 py-2 bg-slate-600 text-white font-medium rounded-lg hover:bg-slate-700 transition-colors"
                >
                  Keep Task
                </button>
                <button
                  onClick={handleCancelTask}
                  disabled={actionLoading}
                  className="flex-1 px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {actionLoading ? 'Cancelling...' : 'Cancel Task'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskDetailsPage;
