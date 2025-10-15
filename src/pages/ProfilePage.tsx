import { useState, useEffect, type FC } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  UserIcon,
  PencilIcon,
  CameraIcon,
  CheckBadgeIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

const ProfilePage: FC = () => {
  const { user, userProfile, updateProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    full_name: userProfile?.full_name || '',
    phone: userProfile?.phone || '',
    gender: userProfile?.gender || 'male' as 'male' | 'female' | 'other' | 'prefer_not_to_say',
    bio: userProfile?.bio || '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (userProfile) {
      setFormData({
        full_name: userProfile.full_name || '',
        phone: userProfile.phone || '',
        gender: (userProfile.gender || 'male') as 'male' | 'female' | 'other' | 'prefer_not_to_say',
        bio: userProfile.bio || '',
      });
    }
  }, [userProfile]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      await updateProfile(formData);
      toast.success('Profile updated successfully!');
      setIsEditing(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      full_name: userProfile?.full_name || '',
      phone: userProfile?.phone || '',
      gender: (userProfile?.gender || 'male') as 'male' | 'female' | 'other' | 'prefer_not_to_say',
      bio: userProfile?.bio || '',
    });
    setIsEditing(false);
  };

  if (!user || !userProfile) {
    return (
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white mb-4">Profile not found</h2>
            <p className="text-slate-400">Please complete your profile setup first.</p>
            <Link
              to="/profile-setup"
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-cyan-600 hover:bg-cyan-700"
            >
              Complete Profile Setup
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-6">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 md:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">My Profile</h1>
          <p className="text-slate-400">Manage your profile information and preferences</p>
        </div>

        <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
          {/* Profile Photo Section */}
          <div className="flex items-center space-x-6 mb-8">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-slate-700 flex items-center justify-center">
                <UserIcon className="h-12 w-12 text-slate-400" />
              </div>
              <button
                type="button"
                className="absolute bottom-0 right-0 bg-cyan-500 text-white p-2 rounded-full hover:bg-cyan-600 transition-colors"
                disabled={!isEditing}
              >
                <CameraIcon className="h-4 w-4" />
              </button>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">{userProfile.full_name}</h2>
              <p className="text-slate-400">{user.email}</p>
              <div className="flex items-center space-x-4 mt-2">
                {userProfile.is_runner && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    <CheckBadgeIcon className="h-3 w-3 mr-1" />
                    Runner
                  </span>
                )}
                {userProfile.is_requester && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    <CheckBadgeIcon className="h-3 w-3 mr-1" />
                    Requester
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Profile Information */}
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Full Name
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleInputChange}
                    className="input-field"
                  />
                ) : (
                  <p className="text-white">{userProfile.full_name || 'Not provided'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Email
                </label>
                <p className="text-white">{user.email}</p>
                <p className="text-xs text-slate-400">Email cannot be changed</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Phone Number
                </label>
                {isEditing ? (
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="input-field"
                    placeholder="+234 800 000 0000"
                  />
                ) : (
                  <p className="text-white">{userProfile.phone || 'Not provided'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Gender
                </label>
                {isEditing ? (
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleInputChange}
                    className="input-field"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                    <option value="prefer_not_to_say">Prefer not to say</option>
                  </select>
                ) : (
                  <p className="text-white capitalize">{userProfile.gender || 'Not specified'}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Bio
              </label>
              {isEditing ? (
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleInputChange}
                  rows={3}
                  className="input-field"
                  placeholder="Tell us about yourself..."
                />
              ) : (
                <p className="text-white">{userProfile.bio || 'No bio provided'}</p>
              )}
            </div>

            {/* Account Roles */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Account Roles
              </label>
              <div className="flex space-x-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={userProfile.is_runner}
                    disabled
                    className="h-4 w-4 text-cyan-500 focus:ring-cyan-500 border-slate-600 rounded bg-slate-700"
                  />
                  <label className="ml-2 text-sm text-slate-300">
                    Runner - Complete tasks for others
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={userProfile.is_requester}
                    disabled
                    className="h-4 w-4 text-cyan-500 focus:ring-cyan-500 border-slate-600 rounded bg-slate-700"
                  />
                  <label className="ml-2 text-sm text-slate-300">
                    Requester - Post tasks for others
                  </label>
                </div>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                To change your roles, please contact support or update in Settings.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4 mt-8 pt-6 border-t border-slate-700">
            {isEditing ? (
              <>
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 border border-slate-600 text-slate-300 rounded-lg hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 disabled:opacity-50 transition-colors flex items-center"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <PencilIcon className="h-4 w-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors flex items-center"
              >
                <PencilIcon className="h-4 w-4 mr-2" />
                Edit Profile
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
