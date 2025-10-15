import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProfileSetupPage: React.FC = () => {
  const [formData, setFormData] = useState({
    phone: '',
    gender: '',
    preferred_payment_method: 'card',
    is_runner: false,
    is_requester: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { user, userProfile, updateProfile } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    console.log('ProfileSetupPage mounted');
    console.log('User:', user);
    console.log('UserProfile:', userProfile);
  }, [user, userProfile]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (!formData.phone) {
      setError('Please enter your phone number');
      return;
    }

    if (!formData.is_runner && !formData.is_requester) {
      setError('Please select at least one role (Runner or Requester)');
      return;
    }

    setLoading(true);
    try {
      console.log('=== PROFILE UPDATE DEBUG ===');
      console.log('User ID:', user?.uid);
      console.log('Form data:', formData);
      console.log('updateProfile function:', typeof updateProfile);
      
      await updateProfile(formData);
      
      console.log('Profile update completed successfully');
      setSuccess('Profile updated successfully!');
      setTimeout(() => {
        navigate('/dashboard');
      }, 1000);
    } catch (error: any) {
      console.error('=== PROFILE UPDATE ERROR ===');
      console.error('Error object:', error);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      setError(error.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">No user found</h2>
          <button
            onClick={() => navigate('/login')}
            className="btn-primary"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
            Complete your profile
          </h2>
          <p className="mt-2 text-center text-sm text-slate-400">
            Help us personalize your CaraConnect experience
          </p>
        </div>
        
        {/* Error/Success Messages */}
        {error && (
          <div className="bg-red-900 border border-red-700 text-red-100 px-4 py-3 rounded">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-900 border border-green-700 text-green-100 px-4 py-3 rounded">
            {success}
          </div>
        )}
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            {/* Profile Photo */}
            <div className="flex flex-col items-center">
              <div className="w-24 h-24 rounded-full bg-slate-700 flex items-center justify-center">
                <div className="w-12 h-12 text-slate-400 text-4xl">👤</div>
              </div>
              <p className="mt-2 text-sm text-slate-400">Profile photo</p>
            </div>

            {/* Phone Number */}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-slate-300">
                Phone Number *
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                required
                value={formData.phone}
                onChange={handleChange}
                className="input-field mt-1"
                placeholder="+234 800 000 0000"
              />
            </div>

            {/* Gender */}
            <div>
              <label htmlFor="gender" className="block text-sm font-medium text-slate-300">
                Gender
              </label>
              <select
                id="gender"
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="input-field mt-1"
              >
                <option value="">Select gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
                <option value="prefer_not_to_say">Prefer not to say</option>
              </select>
            </div>

            {/* Preferred Payment Method */}
            <div>
              <label htmlFor="preferred_payment_method" className="block text-sm font-medium text-slate-300">
                Preferred Payment Method
              </label>
              <select
                id="preferred_payment_method"
                name="preferred_payment_method"
                value={formData.preferred_payment_method}
                onChange={handleChange}
                className="input-field mt-1"
              >
                <option value="card">Card</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="wallet">Wallet</option>
              </select>
            </div>

            {/* Role Selection */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-slate-300">
                What would you like to do on CaraConnect? *
              </label>
              
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="is_runner"
                    checked={formData.is_runner}
                    onChange={handleChange}
                    className="h-4 w-4 text-cyan-500 focus:ring-cyan-500 border-slate-600 rounded bg-slate-700"
                  />
                  <span className="ml-2 text-sm text-slate-300">
                    <strong>Run Tasks</strong> - Complete tasks for others and earn money
                  </span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="is_requester"
                    checked={formData.is_requester}
                    onChange={handleChange}
                    className="h-4 w-4 text-cyan-500 focus:ring-cyan-500 border-slate-600 rounded bg-slate-700"
                  />
                  <span className="ml-2 text-sm text-slate-300">
                    <strong>Post Tasks</strong> - Request help with your errands
                  </span>
                </label>
              </div>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full"
            >
              {loading ? 'Saving profile...' : 'Complete Setup'}
            </button>
          </div>

          <div className="text-center">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="text-sm text-slate-400 hover:text-white"
            >
              Skip for now
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfileSetupPage;