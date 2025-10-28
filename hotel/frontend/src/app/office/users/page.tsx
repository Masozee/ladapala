'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import OfficeLayout from '@/components/OfficeLayout';
import { buildApiUrl } from '@/lib/config';
import {
  Add01Icon,
  UserMultipleIcon,
  PencilEdit02Icon,
  Cancel01Icon,
  UserCheckIcon,
  EyeIcon,
  Search02Icon,
  MoreHorizontalIcon,
} from '@/lib/icons';

interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  phone: string;
  is_active: boolean;
  date_joined: string;
  employee?: {
    department: string;
    position: string;
  };
}

interface Department {
  id: string;
  name: string;
}

interface Role {
  id: string;
  name: string;
}

export default function UsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    role: 'STAFF',
    department: '',
    position: '',
    phone: '',
    salary: '',
  });

  useEffect(() => {
    fetchUsers();
    fetchDepartments();
    fetchRoles();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch(buildApiUrl('user/users/'), {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await fetch(buildApiUrl('user/departments/'), {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setDepartments(data);
      }
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  const fetchRoles = async () => {
    try {
      const response = await fetch(buildApiUrl('user/roles/'), {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setRoles(data);
      }
    } catch (error) {
      console.error('Error fetching roles:', error);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch(buildApiUrl('user/users/'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        alert('User created successfully!');
        setShowCreateModal(false);
        setFormData({
          email: '',
          password: '',
          first_name: '',
          last_name: '',
          role: 'STAFF',
          department: '',
          position: '',
          phone: '',
          salary: '',
        });
        fetchUsers();
      } else {
        const error = await response.json();
        alert(`Error: ${error.error || 'Failed to create user'}`);
      }
    } catch (error) {
      console.error('Error creating user:', error);
      alert('Failed to create user');
    }
  };

  const handleDeactivateUser = async (userId: number) => {
    if (!confirm('Are you sure you want to deactivate this user?')) {
      return;
    }

    try {
      const response = await fetch(buildApiUrl(`user/users/${userId}/`), {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        alert('User deactivated successfully');
        fetchUsers();
      } else {
        alert('Failed to deactivate user');
      }
    } catch (error) {
      console.error('Error deactivating user:', error);
      alert('Failed to deactivate user');
    }
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.last_name.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && user.is_active) ||
      (statusFilter === 'inactive' && !user.is_active);

    const matchesRole =
      roleFilter === 'all' || user.role === roleFilter;

    return matchesSearch && matchesStatus && matchesRole;
  });

  return (
    <OfficeLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">User Management</h1>
            <p className="text-sm text-gray-600 mt-1">Kelola pengguna dan hak akses sistem</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-[#F87B1B] text-white px-4 py-2 text-sm font-medium hover:bg-[#E06A0A] transition-colors flex items-center space-x-2"
          >
            <Add01Icon className="h-4 w-4" />
            <span>Add New User</span>
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-blue-100 rounded">
                <UserMultipleIcon className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <div className="text-3xl font-semibold text-gray-900 mb-1">{users.length}</div>
            <div className="text-sm font-medium text-gray-900">Total Users</div>
            <div className="text-xs text-gray-600 mt-1">All system users</div>
          </div>

          <div className="bg-white border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-green-100 rounded">
                <UserCheckIcon className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <div className="text-3xl font-semibold text-gray-900 mb-1">
              {users.filter((u) => u.is_active).length}
            </div>
            <div className="text-sm font-medium text-gray-900">Active Users</div>
            <div className="text-xs text-gray-600 mt-1">Currently active</div>
          </div>

          <div className="bg-white border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-red-100 rounded">
                <Cancel01Icon className="h-6 w-6 text-red-600" />
              </div>
            </div>
            <div className="text-3xl font-semibold text-gray-900 mb-1">
              {users.filter((u) => !u.is_active).length}
            </div>
            <div className="text-sm font-medium text-gray-900">Inactive Users</div>
            <div className="text-xs text-gray-600 mt-1">Deactivated accounts</div>
          </div>

          <div className="bg-white border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-purple-100 rounded">
                <UserMultipleIcon className="h-6 w-6 text-purple-600" />
              </div>
            </div>
            <div className="text-3xl font-semibold text-gray-900 mb-1">{roles.length}</div>
            <div className="text-sm font-medium text-gray-900">Available Roles</div>
            <div className="text-xs text-gray-600 mt-1">System roles</div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex items-center justify-end gap-3">
          <div className="relative w-64">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search02Icon className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 text-sm border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#F87B1B] focus:border-[#F87B1B] w-full"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 text-sm border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#F87B1B] focus:border-[#F87B1B]"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-4 py-2 text-sm border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#F87B1B] focus:border-[#F87B1B]"
          >
            <option value="all">All Roles</option>
            {roles.map((role) => (
              <option key={role.id} value={role.id}>
                {role.name}
              </option>
            ))}
          </select>
        </div>

        {/* Users Table */}
        <div className="bg-white border border-gray-300 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gradient-to-r from-[#F87B1B] to-[#E06A0A] text-white">
                  <th className="border border-gray-300 px-6 py-4 text-left text-sm font-semibold tracking-wide">Email</th>
                  <th className="border border-gray-300 px-6 py-4 text-left text-sm font-semibold tracking-wide">Name</th>
                  <th className="border border-gray-300 px-6 py-4 text-left text-sm font-semibold tracking-wide">Role</th>
                  <th className="border border-gray-300 px-6 py-4 text-left text-sm font-semibold tracking-wide">Department</th>
                  <th className="border border-gray-300 px-6 py-4 text-left text-sm font-semibold tracking-wide">Position</th>
                  <th className="border border-gray-300 px-6 py-4 text-left text-sm font-semibold tracking-wide">Phone</th>
                  <th className="border border-gray-300 px-6 py-4 text-center text-sm font-semibold tracking-wide">Status</th>
                  <th className="border border-gray-300 px-6 py-4 text-center text-sm font-semibold tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} className="border border-gray-300 px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center space-y-3">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#F87B1B]"></div>
                        <p className="text-sm text-gray-600 font-medium">Loading users...</p>
                      </div>
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="border border-gray-300 px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <UserMultipleIcon className="h-12 w-12 text-gray-300" />
                        <p className="text-sm text-gray-600 font-medium">No users found</p>
                        <p className="text-xs text-gray-500">Try adjusting your search criteria</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                      <td className="border border-gray-300 px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{user.email}</div>
                        <div className="text-xs text-gray-500">ID: {user.id}</div>
                      </td>
                      <td className="border border-gray-300 px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          {user.first_name || user.last_name
                            ? `${user.first_name} ${user.last_name}`.trim()
                            : '-'}
                        </div>
                        <div className="text-xs text-gray-500">
                          Joined {new Date(user.date_joined).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </div>
                      </td>
                      <td className="border border-gray-300 px-6 py-4">
                        <span className="inline-flex items-center px-3 py-1 text-sm font-medium rounded-full bg-blue-100 text-blue-800">
                          {user.role || 'N/A'}
                        </span>
                      </td>
                      <td className="border border-gray-300 px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {user.employee?.department || '-'}
                        </div>
                      </td>
                      <td className="border border-gray-300 px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {user.employee?.position || '-'}
                        </div>
                      </td>
                      <td className="border border-gray-300 px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {user.phone || '-'}
                        </div>
                      </td>
                      <td className="border border-gray-300 px-6 py-4 text-center">
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
                      </td>
                      <td className="border border-gray-300 px-6 py-4">
                        <div className="flex items-center justify-center relative">
                          <button
                            onClick={() => setOpenMenuId(openMenuId === user.id ? null : user.id)}
                            className="p-2 border border-gray-300 hover:bg-gray-100 transition-colors"
                            title="More actions"
                          >
                            <MoreHorizontalIcon className="h-5 w-5 text-gray-600" />
                          </button>

                          {openMenuId === user.id && (
                            <>
                              <div
                                className="fixed inset-0 z-10"
                                onClick={() => setOpenMenuId(null)}
                              ></div>
                              <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-300 shadow-lg z-20">
                                <button
                                  onClick={() => {
                                    router.push(`/office/users/${user.id}`);
                                    setOpenMenuId(null);
                                  }}
                                  className="w-full px-4 py-2 text-sm text-left hover:bg-gray-50 flex items-center space-x-2"
                                >
                                  <EyeIcon className="h-4 w-4 text-gray-600" />
                                  <span>View Details</span>
                                </button>
                                <button
                                  onClick={() => {
                                    router.push(`/office/users/${user.id}/edit`);
                                    setOpenMenuId(null);
                                  }}
                                  className="w-full px-4 py-2 text-sm text-left hover:bg-gray-50 flex items-center space-x-2"
                                >
                                  <PencilEdit02Icon className="h-4 w-4 text-gray-600" />
                                  <span>Edit User</span>
                                </button>
                                <button
                                  onClick={() => {
                                    setOpenMenuId(null);
                                    handleDeactivateUser(user.id);
                                  }}
                                  className="w-full px-4 py-2 text-sm text-left hover:bg-gray-50 flex items-center space-x-2 text-red-600"
                                >
                                  <Cancel01Icon className="h-4 w-4" />
                                  <span>Deactivate</span>
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Create User Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Create New User</h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <Cancel01Icon className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={handleCreateUser} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#F87B1B]"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Password <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="password"
                      required
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#F87B1B]"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                    <input
                      type="text"
                      value={formData.first_name}
                      onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#F87B1B]"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                    <input
                      type="text"
                      value={formData.last_name}
                      onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#F87B1B]"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Role <span className="text-red-500">*</span>
                    </label>
                    <select
                      required
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#F87B1B]"
                    >
                      {roles.map((role) => (
                        <option key={role.id} value={role.id}>
                          {role.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                    <select
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#F87B1B]"
                    >
                      <option value="">Select Department</option>
                      {departments.map((dept) => (
                        <option key={dept.id} value={dept.id}>
                          {dept.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Position</label>
                    <input
                      type="text"
                      value={formData.position}
                      onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#F87B1B]"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <input
                      type="text"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#F87B1B]"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Salary (IDR)</label>
                    <input
                      type="number"
                      value={formData.salary}
                      onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#F87B1B]"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-[#F87B1B] hover:bg-[#E06A0A] transition-colors"
                  >
                    Create User
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </OfficeLayout>
  );
}
