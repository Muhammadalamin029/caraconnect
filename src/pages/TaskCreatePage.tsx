import { useState, type FC } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTasks } from '../contexts/TaskContext';
import { ArrowLeftIcon, DocumentDuplicateIcon } from '@heroicons/react/24/outline';
import type { Task } from '../firebase/schema';
import toast from 'react-hot-toast';

const TaskCreatePage: FC = () => {
  const navigate = useNavigate();
  const { user, userProfile } = useAuth();
  const { createNewTask } = useTasks();
  
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'delivery' as Task['category'],
    reward_amount: 0,
    pickup_location: {
      address: '',
      coordinates: { lat: 0, lng: 0 },
      instructions: ''
    },
    delivery_location: {
      address: '',
      coordinates: { lat: 0, lng: 0 },
      instructions: ''
    },
    deadline: '',
    expected_duration: 0,
    photos: [] as string[]
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const categories = [
    { value: 'delivery', label: 'Delivery', icon: '📦' },
    { value: 'pickup', label: 'Pickup', icon: '🚗' },
    { value: 'errand', label: 'Errand', icon: '🏃' },
    { value: 'other', label: 'Other', icon: '📋' }
  ];

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }
    if (formData.reward_amount <= 0) {
      newErrors.reward_amount = 'Reward amount must be greater than 0';
    }
    if (!formData.pickup_location.address.trim()) {
      newErrors.pickup_address = 'Pickup location is required';
    }
    if (!formData.delivery_location.address.trim()) {
      newErrors.delivery_address = 'Delivery location is required';
    }
    if (!formData.deadline) {
      newErrors.deadline = 'Deadline is required';
    } else if (new Date(formData.deadline) <= new Date()) {
      newErrors.deadline = 'Deadline must be in the future';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('=== TASK CREATION DEBUG ===');
    console.log('User:', user);
    console.log('UserProfile:', userProfile);
    console.log('Is Requester:', userProfile?.is_requester);
    
    if (!user || !userProfile?.is_requester) {
      alert('You must be a requester to create tasks');
      return;
    }

    if (!validateForm()) {
      console.log('Form validation failed:', errors);
      return;
    }

    try {
      setLoading(true);
      console.log('Form data:', formData);
      
      const taskData = {
        ...formData,
        deadline: new Date(formData.deadline), // Pass as Date object, Firebase will convert to Timestamp
        status: 'pending' as const,
        reward_amount: formData.reward_amount,
        commission_amount: 0, // Will be calculated by createNewTask
        runner_amount: 0, // Will be calculated by createNewTask
        requester_id: user.uid, // Add requester_id
      };

      console.log('Task data to create:', taskData);
      const newTask = await createNewTask(taskData);
      console.log('Task created successfully:', newTask);
      navigate(`/tasks/${newTask.id}`);
    } catch (error: any) {
      console.error('Error creating task:', error);
      if (error.message === 'WALLET_SETUP_REQUIRED') {
        toast.error('Please set up your wallet first');
        navigate('/wallet-setup');
      } else {
        toast.error(error.message || 'Failed to create task');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const handleLocationChange = (type: 'pickup' | 'delivery', field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [`${type}_location`]: {
        ...prev[`${type}_location`],
        [field]: value
      }
    }));
  };

  if (!userProfile?.is_requester) {
    return (
      <div className="min-h-screen bg-slate-900 p-8">
        <div className="max-w-2xl mx-auto text-center">
          <div className="text-6xl mb-4">🚫</div>
          <h1 className="text-2xl font-bold text-white mb-4">Access Denied</h1>
          <p className="text-slate-400 mb-6">
            You need to be a requester to create tasks. Please update your profile to include the requester role.
          </p>
          <button
            onClick={() => navigate('/profile')}
            className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Update Profile
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <button
              onClick={() => navigate('/tasks')}
              className="inline-flex items-center text-slate-400 hover:text-white transition-colors text-sm sm:text-base"
            >
              <ArrowLeftIcon className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
              Back to Tasks
            </button>
            
            <Link
              to="/task-templates"
              className="inline-flex items-center px-3 sm:px-4 py-2 border border-cyan-600 text-cyan-400 rounded-lg hover:bg-cyan-600 hover:text-white transition-colors text-sm"
            >
              <DocumentDuplicateIcon className="h-4 w-4 mr-2" />
              Use Template
            </Link>
          </div>
          
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Create New Task</h1>
          <p className="text-sm sm:text-base text-slate-400">Post a task and find someone to help you out</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
          {/* Basic Information */}
          <div className="bg-slate-800 rounded-lg p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-semibold text-white mb-4 sm:mb-6">Basic Information</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Task Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="e.g., Pick up groceries from Shoprite"
                  className={`w-full px-4 py-3 bg-slate-700 border rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.title ? 'border-red-500' : 'border-slate-600'
                  }`}
                />
                {errors.title && <p className="text-red-400 text-sm mt-1">{errors.title}</p>}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Description *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Describe what needs to be done in detail..."
                  rows={4}
                  className={`w-full px-4 py-3 bg-slate-700 border rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.description ? 'border-red-500' : 'border-slate-600'
                  }`}
                />
                {errors.description && <p className="text-red-400 text-sm mt-1">{errors.description}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Category *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {categories.map(cat => (
                    <option key={cat.value} value={cat.value}>
                      {cat.icon} {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Reward Amount (₦) *
                </label>
                <input
                  type="number"
                  min="100"
                  step="100"
                  value={formData.reward_amount}
                  onChange={(e) => handleInputChange('reward_amount', parseInt(e.target.value) || 0)}
                  placeholder="1000"
                  className={`w-full px-4 py-3 bg-slate-700 border rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.reward_amount ? 'border-red-500' : 'border-slate-600'
                  }`}
                />
                {errors.reward_amount && <p className="text-red-400 text-sm mt-1">{errors.reward_amount}</p>}
              </div>
            </div>
          </div>

          {/* Locations */}
          <div className="bg-slate-800 rounded-lg p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-semibold text-white mb-4 sm:mb-6">Locations</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Pickup Location *
                </label>
                <input
                  type="text"
                  value={formData.pickup_location.address}
                  onChange={(e) => handleLocationChange('pickup', 'address', e.target.value)}
                  placeholder="e.g., Shoprite, Victoria Island"
                  className={`w-full px-4 py-3 bg-slate-700 border rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.pickup_address ? 'border-red-500' : 'border-slate-600'
                  }`}
                />
                {errors.pickup_address && <p className="text-red-400 text-sm mt-1">{errors.pickup_address}</p>}
                
                <input
                  type="text"
                  value={formData.pickup_location.instructions}
                  onChange={(e) => handleLocationChange('pickup', 'instructions', e.target.value)}
                  placeholder="Special instructions (optional)"
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 mt-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Delivery Location *
                </label>
                <input
                  type="text"
                  value={formData.delivery_location.address}
                  onChange={(e) => handleLocationChange('delivery', 'address', e.target.value)}
                  placeholder="e.g., 123 Main Street, Lagos"
                  className={`w-full px-4 py-3 bg-slate-700 border rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.delivery_address ? 'border-red-500' : 'border-slate-600'
                  }`}
                />
                {errors.delivery_address && <p className="text-red-400 text-sm mt-1">{errors.delivery_address}</p>}
                
                <input
                  type="text"
                  value={formData.delivery_location.instructions}
                  onChange={(e) => handleLocationChange('delivery', 'instructions', e.target.value)}
                  placeholder="Special instructions (optional)"
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 mt-2"
                />
              </div>
            </div>
          </div>

          {/* Timing */}
          <div className="bg-slate-800 rounded-lg p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-semibold text-white mb-4 sm:mb-6">Timing</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Deadline *
                </label>
                <input
                  type="datetime-local"
                  value={formData.deadline}
                  onChange={(e) => handleInputChange('deadline', e.target.value)}
                  className={`w-full px-4 py-3 bg-slate-700 border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.deadline ? 'border-red-500' : 'border-slate-600'
                  }`}
                />
                {errors.deadline && <p className="text-red-400 text-sm mt-1">{errors.deadline}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Expected Duration (minutes)
                </label>
                <input
                  type="number"
                  min="15"
                  step="15"
                  value={formData.expected_duration}
                  onChange={(e) => handleInputChange('expected_duration', parseInt(e.target.value) || 0)}
                  placeholder="60"
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={() => navigate('/tasks')}
              className="px-6 py-3 bg-slate-600 text-white font-medium rounded-lg hover:bg-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Creating Task...' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskCreatePage;
