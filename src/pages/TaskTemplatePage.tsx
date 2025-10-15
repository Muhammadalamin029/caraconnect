import { useState, useEffect, type FC } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTasks } from '../contexts/TaskContext';
import { 
  PlusIcon,
  PencilIcon,
  TrashIcon,
  DocumentDuplicateIcon,
  ClockIcon,
  CurrencyDollarIcon,
  MapPinIcon
} from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

interface TaskTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  default_reward_amount: number;
  pickup_location: {
    address: string;
    coordinates: { lat: number; lng: number };
  };
  delivery_location: {
    address: string;
    coordinates: { lat: number; lng: number };
  };
  estimated_duration: number; // in hours
  instructions?: string;
  created_at: any;
  updated_at: any;
}

const TaskTemplatePage: FC = () => {
  const { user, userProfile } = useAuth();
  const { createNewTask } = useTasks();
  const [templates, setTemplates] = useState<TaskTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<TaskTemplate | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'delivery',
    default_reward_amount: 1000,
    pickup_address: '',
    delivery_address: '',
    estimated_duration: 1,
    instructions: ''
  });

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      // For now, we'll use mock data. In a real app, this would fetch from Firebase
      const mockTemplates: TaskTemplate[] = [
        {
          id: '1',
          name: 'Grocery Pickup',
          description: 'Pick up groceries from supermarket',
          category: 'pickup',
          default_reward_amount: 1500,
          pickup_location: {
            address: 'Shoprite, Victoria Island, Lagos',
            coordinates: { lat: 6.4281, lng: 3.4219 }
          },
          delivery_location: {
            address: 'Your delivery address',
            coordinates: { lat: 6.4281, lng: 3.4219 }
          },
          estimated_duration: 2,
          instructions: 'Please check expiry dates and get fresh produce',
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          id: '2',
          name: 'Document Delivery',
          description: 'Deliver important documents',
          category: 'delivery',
          default_reward_amount: 2000,
          pickup_location: {
            address: 'Your pickup address',
            coordinates: { lat: 6.4281, lng: 3.4219 }
          },
          delivery_location: {
            address: 'Recipient address',
            coordinates: { lat: 6.4281, lng: 3.4219 }
          },
          estimated_duration: 1,
          instructions: 'Handle with care, get signature confirmation',
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          id: '3',
          name: 'Bank Errand',
          description: 'Visit bank for transactions',
          category: 'errand',
          default_reward_amount: 3000,
          pickup_location: {
            address: 'Your location',
            coordinates: { lat: 6.4281, lng: 3.4219 }
          },
          delivery_location: {
            address: 'Bank location',
            coordinates: { lat: 6.4281, lng: 3.4219 }
          },
          estimated_duration: 3,
          instructions: 'Bring valid ID and account details',
          created_at: new Date(),
          updated_at: new Date()
        }
      ];
      
      setTemplates(mockTemplates);
    } catch (error) {
      console.error('Error loading templates:', error);
      toast.error('Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // In a real app, this would save to Firebase
      const newTemplate: TaskTemplate = {
        id: Date.now().toString(),
        name: formData.name,
        description: formData.description,
        category: formData.category,
        default_reward_amount: formData.default_reward_amount,
        pickup_location: {
          address: formData.pickup_address,
          coordinates: { lat: 6.4281, lng: 3.4219 } // Mock coordinates
        },
        delivery_location: {
          address: formData.delivery_address,
          coordinates: { lat: 6.4281, lng: 3.4219 } // Mock coordinates
        },
        estimated_duration: formData.estimated_duration,
        instructions: formData.instructions,
        created_at: new Date(),
        updated_at: new Date()
      };
      
      setTemplates(prev => [...prev, newTemplate]);
      setShowCreateModal(false);
      setFormData({
        name: '',
        description: '',
        category: 'delivery',
        default_reward_amount: 1000,
        pickup_address: '',
        delivery_address: '',
        estimated_duration: 1,
        instructions: ''
      });
      toast.success('Template created successfully!');
    } catch (error) {
      console.error('Error creating template:', error);
      toast.error('Failed to create template');
    }
  };

  const handleUseTemplate = async (template: TaskTemplate) => {
    try {
      if (!user || !userProfile?.is_requester) {
        toast.error('You must be a requester to create tasks');
        return;
      }

      // Create task from template
      const taskData = {
        title: template.name,
        description: template.description,
        category: template.category as 'delivery' | 'pickup' | 'errand' | 'other',
        reward_amount: template.default_reward_amount,
        pickup_location: template.pickup_location,
        delivery_location: template.delivery_location,
        deadline: new Date(Date.now() + template.estimated_duration * 60 * 60 * 1000), // Add estimated duration
        instructions: template.instructions || '',
        status: 'pending' as const,
      };

      const newTask = await createNewTask(taskData);
      toast.success('Task created from template successfully!');
      // Navigate to task details or task list
    } catch (error: any) {
      console.error('Error creating task from template:', error);
      toast.error(error.message || 'Failed to create task from template');
    }
  };

  const handleEditTemplate = (template: TaskTemplate) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      description: template.description,
      category: template.category,
      default_reward_amount: template.default_reward_amount,
      pickup_address: template.pickup_location.address,
      delivery_address: template.delivery_location.address,
      estimated_duration: template.estimated_duration,
      instructions: template.instructions || ''
    });
    setShowCreateModal(true);
  };

  const handleDeleteTemplate = (templateId: string) => {
    setTemplates(prev => prev.filter(t => t.id !== templateId));
    toast.success('Template deleted successfully!');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(amount);
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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Task Templates</h1>
              <p className="text-slate-400">Create and manage reusable task templates</p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-cyan-600 hover:bg-cyan-700"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Create Template
            </button>
          </div>
        </div>

        {/* Templates Grid */}
        {templates.length === 0 ? (
          <div className="text-center py-12">
            <DocumentDuplicateIcon className="mx-auto h-12 w-12 text-slate-400" />
            <h3 className="mt-2 text-sm font-medium text-white">No templates found</h3>
            <p className="mt-1 text-sm text-slate-400">
              Get started by creating your first task template.
            </p>
            <div className="mt-6">
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-cyan-600 hover:bg-cyan-700"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Create First Template
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map((template) => (
              <div key={template.id} className="bg-slate-800 rounded-lg border border-slate-700 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white mb-2">{template.name}</h3>
                    <p className="text-slate-400 text-sm mb-4">{template.description}</p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEditTemplate(template)}
                      className="text-slate-400 hover:text-white"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteTemplate(template.id)}
                      className="text-slate-400 hover:text-red-400"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-slate-400">
                    <CurrencyDollarIcon className="h-4 w-4 mr-2" />
                    {formatCurrency(template.default_reward_amount)}
                  </div>
                  <div className="flex items-center text-sm text-slate-400">
                    <ClockIcon className="h-4 w-4 mr-2" />
                    {template.estimated_duration} hour{template.estimated_duration !== 1 ? 's' : ''}
                  </div>
                  <div className="flex items-center text-sm text-slate-400">
                    <MapPinIcon className="h-4 w-4 mr-2" />
                    {template.category}
                  </div>
                </div>

                <div className="flex space-x-2">
                  <button
                    onClick={() => handleUseTemplate(template)}
                    className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-cyan-600 bg-cyan-100 hover:bg-cyan-200"
                  >
                    <DocumentDuplicateIcon className="h-4 w-4 mr-2" />
                    Use Template
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create/Edit Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 bg-slate-900 bg-opacity-75 transition-opacity" onClick={() => setShowCreateModal(false)}></div>
              
              <div className="inline-block align-bottom bg-slate-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                <form onSubmit={handleSubmit}>
                  <div className="bg-slate-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                    <h3 className="text-lg font-medium text-white mb-4">
                      {editingTemplate ? 'Edit Template' : 'Create New Template'}
                    </h3>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                          Template Name
                        </label>
                        <input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          className="input-field"
                          placeholder="e.g., Grocery Pickup"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                          Description
                        </label>
                        <textarea
                          name="description"
                          value={formData.description}
                          onChange={handleInputChange}
                          rows={3}
                          className="input-field"
                          placeholder="Describe what this template is for"
                          required
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-300 mb-2">
                            Category
                          </label>
                          <select
                            name="category"
                            value={formData.category}
                            onChange={handleInputChange}
                            className="input-field"
                          >
                            <option value="delivery">Delivery</option>
                            <option value="pickup">Pickup</option>
                            <option value="errand">Errand</option>
                            <option value="other">Other</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-slate-300 mb-2">
                            Default Reward (₦)
                          </label>
                          <input
                            type="number"
                            name="default_reward_amount"
                            value={formData.default_reward_amount}
                            onChange={handleInputChange}
                            className="input-field"
                            min="100"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                          Pickup Address
                        </label>
                        <input
                          type="text"
                          name="pickup_address"
                          value={formData.pickup_address}
                          onChange={handleInputChange}
                          className="input-field"
                          placeholder="Default pickup location"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                          Delivery Address
                        </label>
                        <input
                          type="text"
                          name="delivery_address"
                          value={formData.delivery_address}
                          onChange={handleInputChange}
                          className="input-field"
                          placeholder="Default delivery location"
                          required
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-300 mb-2">
                            Estimated Duration (hours)
                          </label>
                          <input
                            type="number"
                            name="estimated_duration"
                            value={formData.estimated_duration}
                            onChange={handleInputChange}
                            className="input-field"
                            min="0.5"
                            step="0.5"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                          Instructions (Optional)
                        </label>
                        <textarea
                          name="instructions"
                          value={formData.instructions}
                          onChange={handleInputChange}
                          rows={2}
                          className="input-field"
                          placeholder="Special instructions for this template"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                    <button
                      type="submit"
                      className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-cyan-600 text-base font-medium text-white hover:bg-cyan-700 sm:ml-3 sm:w-auto sm:text-sm"
                    >
                      {editingTemplate ? 'Update Template' : 'Create Template'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowCreateModal(false);
                        setEditingTemplate(null);
                        setFormData({
                          name: '',
                          description: '',
                          category: 'delivery',
                          default_reward_amount: 1000,
                          pickup_address: '',
                          delivery_address: '',
                          estimated_duration: 1,
                          instructions: ''
                        });
                      }}
                      className="mt-3 w-full inline-flex justify-center rounded-md border border-slate-300 shadow-sm px-4 py-2 bg-slate-800 text-base font-medium text-slate-300 hover:bg-slate-700 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskTemplatePage;
