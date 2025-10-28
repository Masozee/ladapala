'use client';

import { useState, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import { buildApiUrl } from '@/lib/config';
import {
  UserIcon,
  Mail01Icon,
  Call02Icon,
  Location01Icon,
  Calendar01Icon,
  Shield01Icon,
  Notification02Icon,
  Clock01Icon,
  PackageIcon,
  ViewIcon,
  PencilEdit02Icon,
  Cancel01Icon,
  UserCheckIcon,
  EyeIcon,
  ArrowUp01Icon,
  ChevronDownIcon,
  Settings02Icon,
  SparklesIcon,
  UserMultipleIcon,
  Building03Icon,
  AlertCircleIcon,
  Alert01Icon,
  Add01Icon,
  CancelCircleIcon,
  PieChartIcon,
  File01Icon
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
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [activeSession, setActiveSession] = useState<ActiveSession | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);

  const [profile, setProfile] = useState({
    // Personal Information
    personal: {
      firstName: 'Ahmad',
      lastName: 'Rahman',
      displayName: 'Ahmad R.',
      email: 'ahmad.rahman@kapulaga.com',
      phone: '+62-812-3456-7890',
      alternatePhone: '+62-21-5555-0123',
      dateOfBirth: '1985-03-15',
      gender: 'Male',
      nationality: 'Indonesian',
      maritalStatus: 'Married',
      profilePicture: '/avatars/ahmad-rahman.jpg',
      bio: 'Experienced hotel manager with over 10 years in hospitality industry. Passionate about delivering exceptional guest experiences and leading high-performing teams.',
      languages: ['Indonesian', 'English', 'Mandarin', 'Japanese'],
      timezone: 'Asia/Jakarta'
    },
    
    // Professional Information
    professional: {
      employeeId: 'KPL-2019-001',
      jobTitle: 'General Manager',
      department: 'Management',
      directManager: 'Sarah Williams',
      team: 'Executive Team',
      workLocation: 'Kapulaga Hotel Jakarta',
      hireDate: '2019-01-15',
      workType: 'Full-time',
      workSchedule: 'Monday - Saturday, 08:00 - 17:00',
      salary: 25000000,
      employmentStatus: 'Active',
      performanceRating: 4.8,
      yearsOfExperience: 12,
      certifications: [
        'Certified Hotel Administrator (CHA)',
        'Hospitality Management Certificate',
        'Food Safety Manager Certification',
        'Customer Service Excellence'
      ],
      skills: ['Leadership', 'Operations Management', 'Guest Relations', 'Team Building', 'Budget Management', 'Strategic Planning'],
      achievements: [
        'Employee of the Year 2023',
        'Best Customer Satisfaction Score 2022',
        'Operational Excellence Award 2021'
      ]
    },
    
    // Contact Information
    contact: {
      primaryEmail: 'ahmad.rahman@kapulaga.com',
      personalEmail: 'ahmad.rahman.personal@gmail.com',
      workPhone: '+62-21-5555-0123',
      mobilePhone: '+62-812-3456-7890',
      emergencyContact: {
        name: 'Siti Rahman',
        relationship: 'Spouse',
        phone: '+62-813-9876-5432',
        email: 'siti.rahman@gmail.com'
      },
      addresses: {
        home: {
          street: 'Jl. Kemang Raya No. 45',
          city: 'Jakarta Selatan',
          state: 'DKI Jakarta',
          postalCode: '12560',
          country: 'Indonesia'
        },
        work: {
          street: 'Jl. Sudirman No. 123',
          city: 'Jakarta Pusat',
          state: 'DKI Jakarta',
          postalCode: '10220',
          country: 'Indonesia'
        }
      }
    },
    
    // System Preferences
    preferences: {
      theme: 'light',
      language: 'en',
      dateFormat: 'DD/MM/YYYY',
      timeFormat: '24',
      currency: 'IDR',
      notifications: {
        email: true,
        sms: false,
        push: true,
        desktop: true,
        marketing: false
      },
      privacy: {
        showProfile: true,
        showEmail: false,
        showPhone: false,
        showBirthday: true
      },
      dashboard: {
        defaultView: 'overview',
        refreshInterval: 30,
        compactMode: false,
        showWeather: true,
        showCalendar: true
      }
    },
    
    // Security Settings02Icon
    security: {
      twoFactorEnabled: true,
      lastPasswordChange: '2024-06-15',
      passwordExpiry: '2024-12-15',
      loginAttempts: 0,
      lastLogin: '2024-08-26T08:30:00Z',
      activeSessions: 3,
      trustedDevices: [
        { id: 1, name: 'MacBook Pro', lastUsed: '2024-08-26T08:30:00Z', location: 'Jakarta, ID' },
        { id: 2, name: 'iPhone 14', lastUsed: '2024-08-25T22:15:00Z', location: 'Jakarta, ID' },
        { id: 3, name: 'iPad Air', lastUsed: '2024-08-24T19:45:00Z', location: 'Jakarta, ID' }
      ],
      recentActivity: [
        { action: 'Login', timestamp: '2024-08-26T08:30:00Z', device: 'MacBook Pro', location: 'Jakarta, ID' },
        { action: 'Profile Updated', timestamp: '2024-08-25T16:20:00Z', device: 'iPhone 14', location: 'Jakarta, ID' },
        { action: 'Password Changed', timestamp: '2024-06-15T14:10:00Z', device: 'MacBook Pro', location: 'Jakarta, ID' }
      ]
    },
    
    // Personal Interests
    interests: {
      hobbies: ['Photography', 'Travel', 'Reading', 'Golf', 'Cooking'],
      sports: ['Tennis', 'Swimming', 'Hiking'],
      music: ['Jazz', 'Classical', 'Indonesian Pop'],
      books: ['Business Strategy', 'Leadership', 'Travel Guides'],
      movies: ['Drama', 'Documentary', 'Action'],
      food: ['Indonesian', 'Japanese', 'Italian'],
      travel: {
        countriesVisited: 15,
        favoriteDestinations: ['Bali', 'Singapore', 'Tokyo', 'Paris'],
        travelStyle: 'Luxury',
        bucketList: ['New Zealand', 'Iceland', 'Morocco']
      }
    },
    
    // Work Statistics
    statistics: {
      totalWorkDays: 1456,
      completedProjects: 45,
      customerRating: 4.9,
      teamSize: 25,
      budgetManaged: 2500000000,
      trainingHours: 120,
      performanceMetrics: {
        guestSatisfaction: 95,
        operationalEfficiency: 92,
        teamProductivity: 88,
        costManagement: 90
      },
      monthlyStats: [
        { month: 'Jan', satisfaction: 94, efficiency: 90 },
        { month: 'Feb', satisfaction: 96, efficiency: 92 },
        { month: 'Mar', satisfaction: 95, efficiency: 89 },
        { month: 'Apr', satisfaction: 97, efficiency: 94 },
        { month: 'May', satisfaction: 93, efficiency: 88 },
        { month: 'Jun', satisfaction: 98, efficiency: 95 }
      ]
    }
  });

  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: ''
  });

  const handleProfileChange = (section: string, field: string, value: any) => {
    setProfile(prev => ({
      ...prev,
      [section]: {
        ...prev[section as keyof typeof prev],
        [field]: value
      }
    }));
  };

  const handleNestedChange = (section: string, subsection: string, field: string, value: any) => {
    setProfile(prev => {
      const sectionData = prev[section as keyof typeof prev] as any;
      const subsectionData = sectionData[subsection] as any;
      return {
        ...prev,
        [section]: {
          ...sectionData,
          [subsection]: {
            ...subsectionData,
            [field]: value
          }
        }
      };
    });
  };

  const togglePassword = (field: string) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field as keyof typeof prev]
    }));
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR'
    }).format(amount);
  };

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

  const sections = [
    { id: 'personal', name: 'Personal', icon: UserIcon },
    { id: 'professional', name: 'Work', icon: PackageIcon },
    { id: 'contact', name: 'Contact', icon: Mail01Icon },
    { id: 'preferences', name: 'Settings', icon: Settings02Icon },
    { id: 'security', name: 'Security', icon: Shield01Icon },
    { id: 'interests', name: 'Interests', icon: SparklesIcon },
    { id: 'statistics', name: 'Stats', icon: PieChartIcon }
  ];

  const renderPersonalInfo = () => {
    if (!user || !employee) return <div className="text-gray-500">Loading...</div>;

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
                      value={user.first_name || ''}
                      disabled={!isEditing}
                      className="w-full px-3 py-2 border border-gray-300 focus:ring-[#005357] focus:border-[#005357] disabled:bg-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                    <input
                      type="text"
                      value={user.last_name || ''}
                      disabled={!isEditing}
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
                      value={user.profile?.date_of_birth || ''}
                      disabled={!isEditing}
                      className="w-full px-3 py-2 border border-gray-300 focus:ring-[#005357] focus:border-[#005357] disabled:bg-gray-100"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
                    <textarea
                      value={user.profile?.bio || ''}
                      disabled={!isEditing}
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
                  value={employee.phone || user.profile?.phone || ''}
                  disabled={!isEditing}
                  className="w-full px-3 py-2 border border-gray-300 focus:ring-[#005357] focus:border-[#005357] disabled:bg-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Personal Email</label>
                <input
                  type="email"
                  value={employee.email || ''}
                  disabled={!isEditing}
                  className="w-full px-3 py-2 border border-gray-300 focus:ring-[#005357] focus:border-[#005357] disabled:bg-gray-100"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                <textarea
                  value={employee.address || user.profile?.address || ''}
                  disabled={!isEditing}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 focus:ring-[#005357] focus:border-[#005357] disabled:bg-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Emergency Contact</label>
                <input
                  type="text"
                  value={employee.emergency_contact || ''}
                  disabled={!isEditing}
                  className="w-full px-3 py-2 border border-gray-300 focus:ring-[#005357] focus:border-[#005357] disabled:bg-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Emergency Phone</label>
                <input
                  type="tel"
                  value={employee.emergency_phone || ''}
                  disabled={!isEditing}
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
    if (!user || !employee) return <div className="text-gray-500">Loading...</div>;

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

  const renderSecurityInfo = () => (
    <div className="space-y-6">
      <div className="bg-white border border-gray-200">
        <div className="p-6 bg-[#005357] text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-white">Security Settings</h3>
              <p className="text-sm text-gray-100 mt-1">Manage your account security and privacy</p>
            </div>
            <div className="w-8 h-8 bg-white flex items-center justify-center">
              <Shield01Icon className="h-4 w-4 text-[#005357]" />
            </div>
          </div>
        </div>
        <div className="p-6 bg-gray-50">
          <div className="space-y-6">
            {/* Password Section */}
            <div className="bg-white p-4 border">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="font-medium text-gray-900">Password</h4>
                  <p className="text-sm text-gray-600">Last changed: {formatDate(profile.security.lastPasswordChange)}</p>
                </div>
                <button
                  onClick={() => setShowChangePassword(!showChangePassword)}
                  className="px-4 py-2 bg-[#005357] text-white hover:bg-[#004147] transition-colors text-sm"
                >
                  Change Password
                </button>
              </div>
              
              {showChangePassword && (
                <div className="space-y-4 pt-4 border-t">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
                    <div className="relative">
                      <input
                        type={showPasswords.current ? 'text' : 'password'}
                        value={passwords.current}
                        onChange={(e) => setPasswords(prev => ({...prev, current: e.target.value}))}
                        className="w-full px-3 py-2 border border-gray-300 pr-10 focus:ring-[#005357] focus:border-[#005357]"
                      />
                      <button
                        type="button"
                        onClick={() => togglePassword('current')}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      >
                        {showPasswords.current ? <EyeIcon className="h-4 w-4 text-gray-400" /> : <EyeIcon className="h-4 w-4 text-gray-400" />}
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                      <div className="relative">
                        <input
                          type={showPasswords.new ? 'text' : 'password'}
                          value={passwords.new}
                          onChange={(e) => setPasswords(prev => ({...prev, new: e.target.value}))}
                          className="w-full px-3 py-2 border border-gray-300 pr-10 focus:ring-[#005357] focus:border-[#005357]"
                        />
                        <button
                          type="button"
                          onClick={() => togglePassword('new')}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        >
                          {showPasswords.new ? <EyeIcon className="h-4 w-4 text-gray-400" /> : <EyeIcon className="h-4 w-4 text-gray-400" />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
                      <div className="relative">
                        <input
                          type={showPasswords.confirm ? 'text' : 'password'}
                          value={passwords.confirm}
                          onChange={(e) => setPasswords(prev => ({...prev, confirm: e.target.value}))}
                          className="w-full px-3 py-2 border border-gray-300 pr-10 focus:ring-[#005357] focus:border-[#005357]"
                        />
                        <button
                          type="button"
                          onClick={() => togglePassword('confirm')}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        >
                          {showPasswords.confirm ? <EyeIcon className="h-4 w-4 text-gray-400" /> : <EyeIcon className="h-4 w-4 text-gray-400" />}
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={() => setShowChangePassword(false)}
                      className="px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors text-sm"
                    >
                      Cancel
                    </button>
                    <button className="px-4 py-2 bg-[#005357] text-white hover:bg-[#004147] transition-colors text-sm">
                      Update Password
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Two Factor Authentication */}
            <div className="bg-white p-4 border">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900">Two-Factor Authentication</h4>
                  <p className="text-sm text-gray-600">Add an extra layer of security to your account</p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`text-sm ${profile.security.twoFactorEnabled ? 'text-green-600' : 'text-gray-600'}`}>
                    {profile.security.twoFactorEnabled ? 'Enabled' : 'Disabled'}
                  </span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={profile.security.twoFactorEnabled}
                      onChange={(e) => handleProfileChange('security', 'twoFactorEnabled', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#005357]/25 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:h-5 after:w-5 after:transition-all peer-checked:bg-[#005357]"></div>
                  </label>
                </div>
              </div>
            </div>

            {/* Trusted Devices */}
            <div className="bg-white border">
              <div className="p-4 border-b">
                <h4 className="font-medium text-gray-900">Trusted Devices</h4>
                <p className="text-sm text-gray-600">Devices you've logged in from recently</p>
              </div>
              <div className="p-4">
                <div className="space-y-3">
                  {profile.security.trustedDevices.map((device) => (
                    <div key={device.id} className="flex items-center justify-between p-3 bg-gray-50 border">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-[#005357] flex items-center justify-center">
                          {device.name.includes('MacBook') ? <PackageIcon className="h-4 w-4 text-white" /> : 
                           device.name.includes('iPhone') ? <Call02Icon className="h-4 w-4 text-white" /> :
                           <PackageIcon className="h-4 w-4 text-white" />}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{device.name}</div>
                          <div className="text-sm text-gray-600">{device.location} • Last used: {formatDate(device.lastUsed)}</div>
                        </div>
                      </div>
                      <button className="text-red-600 hover:text-red-800 text-sm">Remove</button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderStatistics = () => (
    <div className="space-y-6">
      <div className="bg-white border border-gray-200">
        <div className="p-6 bg-[#005357] text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-white">Performance Statistics</h3>
              <p className="text-sm text-gray-100 mt-1">Your work performance and achievements</p>
            </div>
            <div className="w-8 h-8 bg-white flex items-center justify-center">
              <PieChartIcon className="h-4 w-4 text-[#005357]" />
            </div>
          </div>
        </div>
        <div className="p-6 bg-gray-50">
          {/* Key Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white p-4 border text-center">
              <div className="text-2xl font-bold text-[#005357]">{profile.statistics.totalWorkDays}</div>
              <div className="text-sm text-gray-600">Work Days</div>
            </div>
            <div className="bg-white p-4 border text-center">
              <div className="text-2xl font-bold text-green-600">{profile.statistics.completedProjects}</div>
              <div className="text-sm text-gray-600">Projects</div>
            </div>
            <div className="bg-white p-4 border text-center">
              <div className="text-2xl font-bold text-blue-600">{profile.statistics.customerRating}</div>
              <div className="text-sm text-gray-600">Rating</div>
            </div>
            <div className="bg-white p-4 border text-center">
              <div className="text-2xl font-bold text-purple-600">{profile.statistics.teamSize}</div>
              <div className="text-sm text-gray-600">Team Members</div>
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="bg-white border">
            <div className="p-4 border-b">
              <h4 className="font-medium text-gray-900">Performance Metrics</h4>
            </div>
            <div className="p-4">
              <div className="space-y-4">
                {Object.entries(profile.statistics.performanceMetrics).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700 capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-32 bg-gray-200 h-2">
                        <div
                          className="h-2 bg-[#005357]"
                          style={{ width: `${value}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium text-gray-900">{value}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeSection) {
      case 'personal':
        return renderPersonalInfo();
      case 'professional':
        return renderProfessionalInfo();
      case 'security':
        return renderSecurityInfo();
      case 'statistics':
        return renderStatistics();
      default:
        return (
          <div className="bg-white border border-gray-200">
            <div className="p-6 bg-[#005357] text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-white">Coming Soon</h3>
                  <p className="text-sm text-gray-100 mt-1">This section is under development</p>
                </div>
                <div className="w-8 h-8 bg-white flex items-center justify-center">
                  <Alert01Icon className="h-4 w-4 text-[#005357]" />
                </div>
              </div>
            </div>
            <div className="p-6 bg-gray-50">
              <div className="text-center py-12">
                <Alert01Icon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Section Coming Soon</h3>
                <p className="text-gray-600">This profile section is currently being developed.</p>
              </div>
            </div>
          </div>
        );
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
              <button className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white hover:bg-green-700 transition-colors text-sm font-medium">
                <PackageIcon className="h-4 w-4" />
                <span>Save Changes</span>
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
        ) : user && employee ? (
          <div className="bg-white border border-gray-200">
            <div className="p-6 bg-[#005357] text-white">
              <div className="flex items-center space-x-4">
                {user.profile?.avatar_url ? (
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
                  <p className="text-gray-100">{employee.position || 'Staff'}</p>
                  <div className="flex items-center space-x-4 mt-2 text-sm text-gray-200">
                    {employee.department && (
                      <>
                        <span>{employee.department}</span>
                        <span>•</span>
                      </>
                    )}
                    <span>Employee ID: {employee.employee_id}</span>
                    {employee.hire_date && (
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