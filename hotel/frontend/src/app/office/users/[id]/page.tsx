'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import OfficeLayout from '@/components/OfficeLayout';
import { buildApiUrl } from '@/lib/config';
import {
  UserIcon,
  Mail01Icon,
  Call02Icon,
  Calendar01Icon,
  Building03Icon,
  PencilEdit02Icon,
  ChevronLeftIcon,
} from '@/lib/icons';

interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  phone: string;
  bio: string;
  address: string;
  date_of_birth: string;
  is_active: boolean;
  is_staff: boolean;
  is_superuser: boolean;
  date_joined: string;
  employee?: {
    id: number;
    employee_id: string;
    full_name: string;
    department: string;
    position: string;
    hire_date: string;
    termination_date: string | null;
    salary: string;
    phone: string;
    email: string;
    address: string;
    emergency_contact: string;
    emergency_phone: string;
    employment_status: string;
    is_active: boolean;
  };
}

export default function UserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUser();
  }, [userId]);

  const fetchUser = async () => {
    try {
      const response = await fetch(buildApiUrl(`user/users/${userId}/`), {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setUser(data);
      } else {
        alert('User not found');
        router.push('/office/users');
      }
    } catch (error) {
      console.error('Error fetching user:', error);
      alert('Failed to load user');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <OfficeLayout>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F87B1B]"></div>
        </div>
      </OfficeLayout>
    );
  }

  if (!user) {
    return (
      <OfficeLayout>
        <div className="text-center py-12">
          <p className="text-gray-600">User not found</p>
        </div>
      </OfficeLayout>
    );
  }

  return (
    <OfficeLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push('/office/users')}
              className="p-2 hover:bg-gray-100 transition-colors"
            >
              <ChevronLeftIcon className="h-5 w-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">User Details</h1>
              <p className="text-sm text-gray-600 mt-1">View detailed user information</p>
            </div>
          </div>
          <button
            onClick={() => router.push(`/office/users/${userId}/edit`)}
            className="bg-[#F87B1B] text-white px-4 py-2 text-sm font-medium hover:bg-[#E06A0A] transition-colors flex items-center space-x-2"
          >
            <PencilEdit02Icon className="h-4 w-4" />
            <span>Edit User</span>
          </button>
        </div>

        {/* User Information Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Basic Information */}
          <div className="bg-white border border-gray-300 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <UserIcon className="h-5 w-5 text-gray-400 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-500">Full Name</p>
                  <p className="text-sm text-gray-900 mt-1">
                    {user.first_name || user.last_name
                      ? `${user.first_name} ${user.last_name}`.trim()
                      : '-'}
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Mail01Icon className="h-5 w-5 text-gray-400 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-500">Email</p>
                  <p className="text-sm text-gray-900 mt-1">{user.email}</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Call02Icon className="h-5 w-5 text-gray-400 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-500">Phone</p>
                  <p className="text-sm text-gray-900 mt-1">{user.phone || '-'}</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Calendar01Icon className="h-5 w-5 text-gray-400 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-500">Date Joined</p>
                  <p className="text-sm text-gray-900 mt-1">
                    {new Date(user.date_joined).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <UserIcon className="h-5 w-5 text-gray-400 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-500">Role</p>
                  <p className="text-sm mt-1">
                    <span className="inline-flex items-center px-3 py-1 text-sm font-medium rounded-full bg-blue-100 text-blue-800">
                      {user.role || 'N/A'}
                    </span>
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <UserIcon className="h-5 w-5 text-gray-400 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-500">Status</p>
                  <p className="text-sm mt-1">
                    {user.is_active ? (
                      <span className="inline-flex items-center px-3 py-1 text-sm font-medium rounded-full bg-green-100 text-green-800">
                        <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-3 py-1 text-sm font-medium rounded-full bg-red-100 text-red-800">
                        <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                        Inactive
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Employee Information */}
          {user.employee && (
            <div className="bg-white border border-gray-300 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Employee Information</h2>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <Building03Icon className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-500">Employee ID</p>
                    <p className="text-sm text-gray-900 mt-1">{user.employee.employee_id || '-'}</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Building03Icon className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-500">Department</p>
                    <p className="text-sm text-gray-900 mt-1">{user.employee.department || '-'}</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <UserIcon className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-500">Position</p>
                    <p className="text-sm text-gray-900 mt-1">{user.employee.position || '-'}</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Calendar01Icon className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-500">Hire Date</p>
                    <p className="text-sm text-gray-900 mt-1">
                      {user.employee.hire_date
                        ? new Date(user.employee.hire_date).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })
                        : '-'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <UserIcon className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-500">Employment Status</p>
                    <p className="text-sm text-gray-900 mt-1">{user.employee.employment_status || '-'}</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Call02Icon className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-500">Emergency Contact</p>
                    <p className="text-sm text-gray-900 mt-1">
                      {user.employee.emergency_contact || '-'}
                    </p>
                    {user.employee.emergency_phone && (
                      <p className="text-xs text-gray-500 mt-1">{user.employee.emergency_phone}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Additional Information */}
        {user.address && (
          <div className="bg-white border border-gray-300 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Additional Information</h2>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Address</p>
                <p className="text-sm text-gray-900 mt-1">{user.address}</p>
              </div>
              {user.bio && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Bio</p>
                  <p className="text-sm text-gray-900 mt-1">{user.bio}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </OfficeLayout>
  );
}
