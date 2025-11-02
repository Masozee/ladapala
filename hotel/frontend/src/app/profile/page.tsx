'use client';

import { useState, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import { buildApiUrl, getCsrfToken } from '@/lib/config';
import {
  UserIcon,
  Mail01Icon,
  Clock01Icon,
  PackageIcon,
  ViewIcon,
  PencilEdit02Icon,
  Cancel01Icon,
  Shield01Icon,
  AlertCircleIcon
} from '@/lib/icons';

interface ActiveSession {
  id: number;
  clock_in: string;
  clock_out: string | null;
  status: string;
  status_display: string;
  late_minutes: number;
  overtime_minutes: number;
  duration_hours: number;
  shift: {
    id: number;
    shift_date: string;
    start_time: string;
    end_time: string;
    shift_type: string;
    shift_type_display: string;
  };
}

interface UserProfile {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  is_staff: boolean;
  is_superuser: boolean;
  is_active: boolean;
  date_joined: string;
  last_login: string | null;
  profile: {
    id: number;
    role: string;
    avatar: string | null;
    avatar_url: string | null;
    bio: string;
    phone: string;
    address: string;
    date_of_birth: string | null;
    created_at: string;
    updated_at: string;
  };
}

interface Employee {
  id: number;
  employee_id: string;
  full_name: string;
  first_name: string;
  last_name: string;
  position: string;
  department: string | null;
  department_id: number | null;
  employment_status: string;
  employment_status_display: string;
  hire_date: string | null;
  termination_date: string | null;
  salary: string | null;
  phone: string;
  email: string;
  address: string;
  emergency_contact: string;
  emergency_phone: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const ProfilePage = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [activeSection, setActiveSection] = useState('personal');
  const [activeSession, setActiveSession] = useState<ActiveSession | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Editable form data
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    address: '',
    date_of_birth: '',
    bio: '',
    emergency_contact: '',
    emergency_phone: '',
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Fetch profile and active session
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch(buildApiUrl('user/active-session/'), {
          credentials: 'include',
        });

        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
          setEmployee(data.employee);
          setActiveSession(data.active_session);

          // Populate form data
          setFormData({
            first_name: data.user?.first_name || '',
            last_name: data.user?.last_name || '',
            phone: data.employee?.phone || data.user?.profile?.phone || '',
            address: data.employee?.address || data.user?.profile?.address || '',
            date_of_birth: data.user?.profile?.date_of_birth || '',
            bio: data.user?.profile?.bio || '',
            emergency_contact: data.employee?.emergency_contact || '',
            emergency_phone: data.employee?.emergency_phone || '',
          });
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setLoading(false);
        setSessionLoading(false);
      }
    };

    fetchProfile();
  }, []);

  // Save profile changes
  const handleSaveProfile = async () => {
    try {
      setSaving(true);

      const csrfToken = getCsrfToken();
      const response = await fetch(buildApiUrl('user/profile/'), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(csrfToken ? { 'X-CSRFToken': csrfToken } : {}),
        },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const data = await response.json();
        alert('Profile updated successfully!');
        setIsEditing(false);
        // Refresh the data
        window.location.reload();
      } else {
        const error = await response.json();
        console.error('Error response:', error);
        alert(`Failed to update profile: ${JSON.stringify(error)}`);
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('An error occurred while saving your profile');
    } finally {
      setSaving(false);
    }
  };

  const handleFormChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const sections = [
    { id: 'personal', name: 'Personal', icon: UserIcon },
    { id: 'professional', name: 'Work', icon: PackageIcon }
  ];

  const renderPersonalInfo = () => {
    if (!user) return <div className="text-gray-500">Loading...</div>;

    return (
      <div className="space-y-6">
        {/* Profile Picture & Basic Info */}
        <div className="bg-white border border-gray-200">
          <div className="p-6 bg-[#005357] text-white">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-white">Personal Information</h3>
                <p className="text-sm text-gray-100 mt-1">Your basic profile details</p>
              </div>
              <div className="w-8 h-8 bg-white flex items-center justify-center">
                <UserIcon className="h-4 w-4 text-[#005357]" />
              </div>
            </div>
          </div>
          <div className="p-6 bg-gray-50">
            <div className="flex flex-col lg:flex-row lg:items-start lg:space-x-8">
              {/* Profile Picture */}
              <div className="flex-shrink-0 mb-6 lg:mb-0">
                <div className="relative">
                  {user.profile?.avatar_url ? (
                    <img
                      src={user.profile.avatar_url}
                      alt={user.full_name}
                      className="w-32 h-32 object-cover rounded"
                    />
                  ) : (
                    <div className="w-32 h-32 bg-gray-200 flex items-center justify-center">
                      <UserIcon className="h-16 w-16 text-gray-400" />
                    </div>
                  )}
                  {isEditing && (
                    <button className="absolute bottom-0 right-0 w-8 h-8 bg-[#005357] text-white flex items-center justify-center hover:bg-[#004147] transition-colors">
                      <ViewIcon className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Basic Info */}
              <div className="flex-1">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                    <input
                      type="text"
                      value={formData.first_name}
                      onChange={(e) => handleFormChange('first_name', e.target.value)}
                      disabled={!isEditing}
                      placeholder={isEditing ? "Enter your first name" : ""}
                      className="w-full px-3 py-2 border border-gray-300 focus:ring-[#005357] focus:border-[#005357] disabled:bg-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                    <input
                      type="text"
                      value={formData.last_name}
                      onChange={(e) => handleFormChange('last_name', e.target.value)}
                      disabled={!isEditing}
                      placeholder={isEditing ? "Enter your last name" : ""}
                      className="w-full px-3 py-2 border border-gray-300 focus:ring-[#005357] focus:border-[#005357] disabled:bg-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <input
                      type="email"
                      value={user.email}
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 bg-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Date of Birth</label>
                    <input
                      type="date"
                      value={formData.date_of_birth}
                      onChange={(e) => handleFormChange('date_of_birth', e.target.value)}
                      disabled={!isEditing}
                      className="w-full px-3 py-2 border border-gray-300 focus:ring-[#005357] focus:border-[#005357] disabled:bg-gray-100"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
                    <textarea
                      value={formData.bio}
                      onChange={(e) => handleFormChange('bio', e.target.value)}
                      disabled={!isEditing}
                      placeholder={isEditing ? "Tell us about yourself..." : ""}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 focus:ring-[#005357] focus:border-[#005357] disabled:bg-gray-100"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Information from Employee */}
        <div className="bg-white border border-gray-200">
          <div className="p-6 bg-[#005357] text-white">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-white">Contact Information</h3>
                <p className="text-sm text-gray-100 mt-1">Your contact details</p>
              </div>
              <div className="w-8 h-8 bg-white flex items-center justify-center">
                <Mail01Icon className="h-4 w-4 text-[#005357]" />
              </div>
            </div>
          </div>
          <div className="p-6 bg-gray-50">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleFormChange('phone', e.target.value)}
                  disabled={!isEditing}
                  placeholder={isEditing ? "+62" : ""}
                  className="w-full px-3 py-2 border border-gray-300 focus:ring-[#005357] focus:border-[#005357] disabled:bg-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Work Email</label>
                <input
                  type="email"
                  value={user.email}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 bg-gray-100"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                <textarea
                  value={formData.address}
                  onChange={(e) => handleFormChange('address', e.target.value)}
                  disabled={!isEditing}
                  placeholder={isEditing ? "Enter your address" : ""}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 focus:ring-[#005357] focus:border-[#005357] disabled:bg-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Emergency Contact Name</label>
                <input
                  type="text"
                  value={formData.emergency_contact}
                  onChange={(e) => handleFormChange('emergency_contact', e.target.value)}
                  disabled={!isEditing}
                  placeholder={isEditing ? "Contact person name" : ""}
                  className="w-full px-3 py-2 border border-gray-300 focus:ring-[#005357] focus:border-[#005357] disabled:bg-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Emergency Phone</label>
                <input
                  type="tel"
                  value={formData.emergency_phone}
                  onChange={(e) => handleFormChange('emergency_phone', e.target.value)}
                  disabled={!isEditing}
                  placeholder={isEditing ? "+62" : ""}
                  className="w-full px-3 py-2 border border-gray-300 focus:ring-[#005357] focus:border-[#005357] disabled:bg-gray-100"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderProfessionalInfo = () => {
    if (!user) return <div className="text-gray-500">Loading...</div>;

    // Show message if no employee record
    if (!employee) {
      return (
        <div className="bg-white border border-gray-200">
          <div className="p-6 bg-[#005357] text-white">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-white">Professional Information</h3>
                <p className="text-sm text-gray-100 mt-1">Your work details and career information</p>
              </div>
              <div className="w-8 h-8 bg-white flex items-center justify-center">
                <PackageIcon className="h-4 w-4 text-[#005357]" />
              </div>
            </div>
          </div>
          <div className="p-6 bg-gray-50 text-center py-12">
            <AlertCircleIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Employee Record</h3>
            <p className="text-gray-600">You don't have an employee record yet. Contact HR to set up your employee profile.</p>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="bg-white border border-gray-200">
          <div className="p-6 bg-[#005357] text-white">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-white">Professional Information</h3>
                <p className="text-sm text-gray-100 mt-1">Your work details and career information</p>
              </div>
              <div className="w-8 h-8 bg-white flex items-center justify-center">
                <PackageIcon className="h-4 w-4 text-[#005357]" />
              </div>
            </div>
          </div>
          <div className="p-6 bg-gray-50">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Employee ID</label>
                <div className="px-3 py-2 bg-gray-100 border border-gray-300 text-gray-600">
                  {employee.employee_id}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Position</label>
                <div className="px-3 py-2 bg-gray-100 border border-gray-300 text-gray-600">
                  {employee.position || '-'}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
                <div className="px-3 py-2 bg-gray-100 border border-gray-300 text-gray-600">
                  {employee.department || '-'}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Employment Status</label>
                <div className="px-3 py-2 bg-gray-100 border border-gray-300">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    employee.employment_status === 'ACTIVE' ? 'bg-green-100 text-green-700' :
                    employee.employment_status === 'INACTIVE' ? 'bg-gray-100 text-gray-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {employee.employment_status_display}
                  </span>
                </div>
              </div>
              {employee.hire_date && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Hire Date</label>
                  <div className="px-3 py-2 bg-gray-100 border border-gray-300 text-gray-600">
                    {formatDate(employee.hire_date)}
                  </div>
                </div>
              )}
              {employee.salary && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Salary</label>
                  <div className="px-3 py-2 bg-gray-100 border border-gray-300 text-gray-600">
                    Rp {parseFloat(employee.salary).toLocaleString('id-ID')}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Account Information */}
        <div className="bg-white border border-gray-200">
          <div className="p-6 bg-[#005357] text-white">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-white">Account Information</h3>
                <p className="text-sm text-gray-100 mt-1">System access and account details</p>
              </div>
              <div className="w-8 h-8 bg-white flex items-center justify-center">
                <Shield01Icon className="h-4 w-4 text-[#005357]" />
              </div>
            </div>
          </div>
          <div className="p-6 bg-gray-50">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                <div className="px-3 py-2 bg-gray-100 border border-gray-300 text-gray-600">
                  {user.profile?.role || '-'}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Account Status</label>
                <div className="px-3 py-2 bg-gray-100 border border-gray-300">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    user.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {user.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date Joined</label>
                <div className="px-3 py-2 bg-gray-100 border border-gray-300 text-gray-600">
                  {formatDate(user.date_joined)}
                </div>
              </div>
              {user.last_login && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Last Login</label>
                  <div className="px-3 py-2 bg-gray-100 border border-gray-300 text-gray-600">
                    {new Date(user.last_login).toLocaleString('id-ID')}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };


  const renderContent = () => {
    switch (activeSection) {
      case 'personal':
        return renderPersonalInfo();
      case 'professional':
        return renderProfessionalInfo();
      default:
        return renderPersonalInfo();
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
            <p className="text-gray-600 mt-2">Manage your personal information and account settings</p>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setIsEditing(!isEditing)}
              className={`flex items-center space-x-2 px-4 py-2 text-sm font-medium transition-colors ${
                isEditing 
                  ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' 
                  : 'bg-[#005357] text-white hover:bg-[#004147]'
              }`}
            >
              {isEditing ? <Cancel01Icon className="h-4 w-4" /> : <PencilEdit02Icon className="h-4 w-4" />}
              <span>{isEditing ? 'Cancel' : 'Edit Profile'}</span>
            </button>
            {isEditing && (
              <button
                onClick={handleSaveProfile}
                disabled={saving}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white hover:bg-green-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <PackageIcon className="h-4 w-4" />
                <span>{saving ? 'Saving...' : 'Save Changes'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Active Session Card */}
        {activeSession && (
          <div className="bg-white border border-gray-200 mb-6">
            <div className="p-6 bg-green-600 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-white/20 flex items-center justify-center">
                    <Clock01Icon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold">Active Session</h3>
                    <p className="text-sm text-green-100">You're currently clocked in</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold">{activeSession.duration_hours}h</div>
                  <div className="text-sm text-green-100">Working time</div>
                </div>
              </div>
            </div>
            <div className="p-6 bg-gray-50 grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <div className="text-xs text-gray-500 mb-1">Clock In</div>
                <div className="font-medium text-gray-900">
                  {new Date(activeSession.clock_in).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">Shift Type</div>
                <div className="font-medium text-gray-900">{activeSession.shift.shift_type_display}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">Status</div>
                <div className="font-medium text-gray-900">
                  <span className={`px-2 py-1 text-xs rounded ${
                    activeSession.late_minutes > 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'
                  }`}>
                    {activeSession.status_display}
                  </span>
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">Schedule</div>
                <div className="font-medium text-gray-900">
                  {activeSession.shift.start_time} - {activeSession.shift.end_time}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Profile Summary Card */}
        {loading ? (
          <div className="bg-white border border-gray-200 p-6">
            <div className="animate-pulse flex items-center space-x-4">
              <div className="w-16 h-16 bg-gray-300 rounded"></div>
              <div className="flex-1">
                <div className="h-6 bg-gray-300 rounded w-1/3 mb-2"></div>
                <div className="h-4 bg-gray-300 rounded w-1/4"></div>
              </div>
            </div>
          </div>
        ) : user ? (
          <div className="bg-white border border-gray-200">
            <div className="p-6 bg-[#005357] text-white">
              <div className="flex items-center space-x-4">
                {user.profile.avatar_url ? (
                  <img
                    src={user.profile.avatar_url}
                    alt={user.full_name}
                    className="w-16 h-16 rounded-full object-cover border-2 border-white/20"
                  />
                ) : (
                  <div className="w-16 h-16 bg-white/20 flex items-center justify-center rounded-full">
                    <UserIcon className="h-8 w-8 text-white" />
                  </div>
                )}
                <div>
                  <h2 className="text-2xl font-bold text-white">{user.full_name}</h2>
                  <p className="text-gray-100">{employee?.position || user.profile.role || 'Staff'}</p>
                  <div className="flex items-center space-x-4 mt-2 text-sm text-gray-200">
                    {employee?.department && (
                      <>
                        <span>{employee.department}</span>
                        <span>•</span>
                      </>
                    )}
                    {employee?.employee_id && (
                      <span>Employee ID: {employee.employee_id}</span>
                    )}
                    {!employee && user.is_superuser && (
                      <span className="bg-yellow-500/20 px-2 py-1 rounded text-xs">Superuser</span>
                    )}
                    {employee?.hire_date && (
                      <>
                        <span>•</span>
                        <span>Joined {formatDate(employee.hire_date)}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 p-6">
            <p className="text-gray-500">Unable to load profile data</p>
          </div>
        )}

        {/* Section Navigation */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-2 overflow-x-auto">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`flex items-center space-x-2 py-3 px-4 font-bold text-sm transition-colors whitespace-nowrap ${
                  activeSection === section.id
                    ? 'bg-[#005357] text-white'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
              >
                <section.icon className="h-4 w-4" />
                <span>{section.name}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        {renderContent()}
      </div>
    </AppLayout>
  );
};

export default ProfilePage;