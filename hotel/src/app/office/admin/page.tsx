'use client';

import { useState } from 'react';
import OfficeLayout from '@/components/OfficeLayout';
import { 
  Shield, 
  Users, 
  Settings, 
  Database,
  Server,
  Lock,
  Key,
  Monitor,
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  HardDrive,
  Cpu,
  Wifi,
  Globe,
  Mail,
  Bell,
  User,
  UserPlus,
  UserMinus,
  Eye,
  Edit,
  Trash2,
  MoreHorizontal,
  Download,
  Upload,
  RefreshCw,
  Search,
  Filter
} from 'lucide-react';

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUserRole, setSelectedUserRole] = useState('all');

  // Sample system data
  const systemStats = {
    totalUsers: 24,
    activeUsers: 18,
    systemUptime: '99.9%',
    serverLoad: 32,
    diskUsage: 68,
    memoryUsage: 45,
    lastBackup: '2024-08-28',
    securityAlerts: 2
  };

  const users = [
    {
      id: 1,
      name: 'Ahmad Susanto',
      email: 'ahmad.susanto@kapulaga.com',
      role: 'admin',
      department: 'IT',
      status: 'active',
      lastLogin: '2024-08-28 09:30',
      permissions: ['all']
    },
    {
      id: 2,
      name: 'Maria Santos',
      email: 'maria.santos@kapulaga.com',
      role: 'manager',
      department: 'Front Office',
      status: 'active',
      lastLogin: '2024-08-28 08:15',
      permissions: ['reservations', 'guests', 'reports']
    },
    {
      id: 3,
      name: 'David Chen',
      email: 'david.chen@kapulaga.com',
      role: 'staff',
      department: 'Housekeeping',
      status: 'active',
      lastLogin: '2024-08-27 16:45',
      permissions: ['inventory', 'maintenance']
    },
    {
      id: 4,
      name: 'Sarah Johnson',
      email: 'sarah.johnson@kapulaga.com',
      role: 'manager',
      department: 'Finance',
      status: 'inactive',
      lastLogin: '2024-08-25 14:20',
      permissions: ['financial', 'reports']
    },
    {
      id: 5,
      name: 'Rahul Patel',
      email: 'rahul.patel@kapulaga.com',
      role: 'staff',
      department: 'F&B',
      status: 'active',
      lastLogin: '2024-08-28 07:30',
      permissions: ['pos', 'inventory']
    }
  ];

  const systemLogs = [
    {
      id: 1,
      timestamp: '2024-08-28 10:15:23',
      level: 'info',
      category: 'Auth',
      message: 'User login successful: maria.santos@kapulaga.com',
      user: 'Maria Santos'
    },
    {
      id: 2,
      timestamp: '2024-08-28 10:10:45',
      level: 'warning',
      category: 'System',
      message: 'High memory usage detected: 78%',
      user: 'System'
    },
    {
      id: 3,
      timestamp: '2024-08-28 09:55:12',
      level: 'error',
      category: 'Database',
      message: 'Connection timeout to backup server',
      user: 'System'
    },
    {
      id: 4,
      timestamp: '2024-08-28 09:30:05',
      level: 'info',
      category: 'Backup',
      message: 'Daily backup completed successfully',
      user: 'System'
    },
    {
      id: 5,
      timestamp: '2024-08-28 08:15:33',
      level: 'info',
      category: 'Auth',
      message: 'Password changed for user: ahmad.susanto@kapulaga.com',
      user: 'Ahmad Susanto'
    }
  ];

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'Aktif';
      case 'inactive': return 'Nonaktif';
      case 'pending': return 'Pending';
      default: return status;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-purple-100 text-purple-800';
      case 'manager': return 'bg-blue-100 text-blue-800';
      case 'staff': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin': return 'Admin';
      case 'manager': return 'Manager';
      case 'staff': return 'Staff';
      default: return role;
    }
  };

  const getLogLevelColor = (level: string) => {
    switch (level) {
      case 'error': return 'bg-red-100 text-red-800';
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      case 'info': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = selectedUserRole === 'all' || user.role === selectedUserRole;
    return matchesSearch && matchesRole;
  });

  const TabButton = ({ tabId, label, icon: Icon }: { tabId: string; label: string; icon: any }) => (
    <button
      onClick={() => setActiveTab(tabId)}
      className={`flex items-center space-x-2 px-6 py-3 text-sm font-medium transition-colors ${
        activeTab === tabId
          ? 'bg-[#005357] text-white'
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
      }`}
    >
      <Icon className="h-4 w-4" />
      <span>{label}</span>
    </button>
  );

  return (
    <OfficeLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Administrasi Sistem</h1>
          <p className="text-gray-600 mt-2">Pengelolaan pengguna, sistem, dan keamanan hotel</p>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white shadow">
          <div className="flex space-x-1 p-1 bg-gray-50">
            <TabButton tabId="dashboard" label="Dashboard" icon={Monitor} />
            <TabButton tabId="users" label="Pengguna" icon={Users} />
            <TabButton tabId="system" label="Sistem" icon={Server} />
            <TabButton tabId="security" label="Keamanan" icon={Shield} />
            <TabButton tabId="logs" label="Log Aktivitas" icon={Activity} />
          </div>

          {/* Dashboard Tab */}
          {activeTab === 'dashboard' && (
            <div>
              <div className="p-6 bg-[#005357] text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-white">Dashboard Admin</h3>
                    <p className="text-sm text-gray-100 mt-1">Monitoring sistem dan statistik pengguna</p>
                  </div>
                  <div className="w-8 h-8 bg-white flex items-center justify-center">
                    <Monitor className="h-4 w-4 text-[#005357]" />
                  </div>
                </div>
              </div>
              
              <div className="p-6 bg-gray-50">
                {/* System Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  <div className="bg-white shadow">
                    <div className="p-6 border-b border-gray-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-xl font-bold text-gray-900">Total Pengguna</h3>
                          <p className="text-sm text-gray-600 mt-1">Terdaftar aktif</p>
                        </div>
                        <div className="w-8 h-8 bg-[#005357] flex items-center justify-center">
                          <Users className="h-4 w-4 text-white" />
                        </div>
                      </div>
                    </div>
                    <div className="p-4 bg-gray-50">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-[#005357]">{systemStats.totalUsers}</div>
                        <div className="text-sm text-gray-600">{systemStats.activeUsers} aktif</div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white shadow">
                    <div className="p-6 border-b border-gray-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-xl font-bold text-gray-900">System Uptime</h3>
                          <p className="text-sm text-gray-600 mt-1">Ketersediaan sistem</p>
                        </div>
                        <div className="w-8 h-8 bg-[#005357] flex items-center justify-center">
                          <Activity className="h-4 w-4 text-white" />
                        </div>
                      </div>
                    </div>
                    <div className="p-4 bg-gray-50">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-green-600">{systemStats.systemUptime}</div>
                        <div className="text-sm text-gray-600">30 hari terakhir</div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white shadow">
                    <div className="p-6 border-b border-gray-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-xl font-bold text-gray-900">Server Load</h3>
                          <p className="text-sm text-gray-600 mt-1">Beban CPU rata-rata</p>
                        </div>
                        <div className="w-8 h-8 bg-[#005357] flex items-center justify-center">
                          <Cpu className="h-4 w-4 text-white" />
                        </div>
                      </div>
                    </div>
                    <div className="p-4 bg-gray-50">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-[#005357]">{systemStats.serverLoad}%</div>
                        <div className="text-sm text-gray-600">CPU usage</div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white shadow">
                    <div className="p-6 border-b border-gray-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-xl font-bold text-gray-900">Security Alerts</h3>
                          <p className="text-sm text-gray-600 mt-1">Peringatan keamanan</p>
                        </div>
                        <div className="w-8 h-8 bg-[#005357] flex items-center justify-center">
                          <AlertTriangle className="h-4 w-4 text-white" />
                        </div>
                      </div>
                    </div>
                    <div className="p-4 bg-gray-50">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-red-600">{systemStats.securityAlerts}</div>
                        <div className="text-sm text-gray-600">memerlukan tindakan</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* System Health */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white shadow">
                    <div className="p-6 border-b border-gray-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-xl font-bold text-gray-900">Status Sistem</h3>
                          <p className="text-sm text-gray-600 mt-1">Monitoring komponen utama</p>
                        </div>
                        <div className="w-8 h-8 bg-[#005357] flex items-center justify-center">
                          <Server className="h-4 w-4 text-white" />
                        </div>
                      </div>
                    </div>
                    <div className="p-4 bg-gray-50">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <CheckCircle className="h-5 w-5 text-green-500" />
                            <span className="text-sm font-medium">Database Server</span>
                          </div>
                          <span className="text-xs bg-green-100 text-green-800 px-2 py-1">Online</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <CheckCircle className="h-5 w-5 text-green-500" />
                            <span className="text-sm font-medium">Web Server</span>
                          </div>
                          <span className="text-xs bg-green-100 text-green-800 px-2 py-1">Online</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <AlertTriangle className="h-5 w-5 text-yellow-500" />
                            <span className="text-sm font-medium">Backup Server</span>
                          </div>
                          <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1">Warning</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <CheckCircle className="h-5 w-5 text-green-500" />
                            <span className="text-sm font-medium">Email Service</span>
                          </div>
                          <span className="text-xs bg-green-100 text-green-800 px-2 py-1">Online</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white shadow">
                    <div className="p-6 border-b border-gray-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-xl font-bold text-gray-900">Resource Usage</h3>
                          <p className="text-sm text-gray-600 mt-1">Penggunaan sistem real-time</p>
                        </div>
                        <div className="w-8 h-8 bg-[#005357] flex items-center justify-center">
                          <HardDrive className="h-4 w-4 text-white" />
                        </div>
                      </div>
                    </div>
                    <div className="p-4 bg-gray-50">
                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="text-sm font-medium text-gray-700">Disk Usage</span>
                            <span className="text-sm text-gray-600">{systemStats.diskUsage}%</span>
                          </div>
                          <div className="w-full bg-gray-200 h-2">
                            <div 
                              className="bg-[#005357] h-2" 
                              style={{ width: `${systemStats.diskUsage}%` }}
                            ></div>
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="text-sm font-medium text-gray-700">Memory Usage</span>
                            <span className="text-sm text-gray-600">{systemStats.memoryUsage}%</span>
                          </div>
                          <div className="w-full bg-gray-200 h-2">
                            <div 
                              className="bg-blue-600 h-2" 
                              style={{ width: `${systemStats.memoryUsage}%` }}
                            ></div>
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="text-sm font-medium text-gray-700">CPU Load</span>
                            <span className="text-sm text-gray-600">{systemStats.serverLoad}%</span>
                          </div>
                          <div className="w-full bg-gray-200 h-2">
                            <div 
                              className="bg-green-600 h-2" 
                              style={{ width: `${systemStats.serverLoad}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Users Tab */}
          {activeTab === 'users' && (
            <div>
              <div className="p-6 bg-[#005357] text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-white">Manajemen Pengguna</h3>
                    <p className="text-sm text-gray-100 mt-1">Kelola akses dan permissions pengguna sistem</p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <button className="bg-white text-[#005357] px-4 py-2 text-sm font-medium hover:bg-gray-100 transition-colors flex items-center space-x-2">
                      <UserPlus className="h-4 w-4" />
                      <span>Tambah Pengguna</span>
                    </button>
                    <div className="w-8 h-8 bg-white flex items-center justify-center">
                      <Users className="h-4 w-4 text-[#005357]" />
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="p-6 bg-gray-50">
                {/* Filters */}
                <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-4 w-4 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        placeholder="Cari pengguna..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#005357] focus:border-[#005357] w-64"
                      />
                    </div>
                    <select 
                      value={selectedUserRole}
                      onChange={(e) => setSelectedUserRole(e.target.value)}
                      className="px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#005357]"
                    >
                      <option value="all">Semua Role</option>
                      <option value="admin">Admin</option>
                      <option value="manager">Manager</option>
                      <option value="staff">Staff</option>
                    </select>
                  </div>
                  <button className="bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors flex items-center space-x-2">
                    <Download className="h-4 w-4" />
                    <span>Export</span>
                  </button>
                </div>

                {/* Users Table */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-[#005357]">
                      <tr>
                        <th className="text-left py-4 px-6 text-sm font-bold text-white uppercase tracking-wider">
                          Pengguna
                        </th>
                        <th className="text-left py-4 px-6 text-sm font-bold text-white uppercase tracking-wider">
                          Role & Departemen
                        </th>
                        <th className="text-left py-4 px-6 text-sm font-bold text-white uppercase tracking-wider">
                          Status & Login Terakhir
                        </th>
                        <th className="text-left py-4 px-6 text-sm font-bold text-white uppercase tracking-wider">
                          Permissions
                        </th>
                        <th className="text-right py-4 px-6 text-sm font-bold text-white uppercase tracking-wider">
                          Aksi
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                      {filteredUsers.map((user) => (
                        <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center">
                              <div className="w-10 h-10 bg-[#005357] flex items-center justify-center text-white font-bold">
                                {user.name.split(' ').map(n => n[0]).join('')}
                              </div>
                              <div className="ml-4">
                                <div className="font-semibold text-gray-900">{user.name}</div>
                                <div className="text-sm text-gray-600">{user.email}</div>
                              </div>
                            </div>
                          </td>

                          <td className="px-6 py-4">
                            <div>
                              <span className={`inline-flex px-2 py-1 text-xs font-medium ${getRoleColor(user.role)}`}>
                                {getRoleLabel(user.role)}
                              </span>
                              <div className="text-sm text-gray-600 mt-1">{user.department}</div>
                            </div>
                          </td>

                          <td className="px-6 py-4">
                            <div>
                              <span className={`inline-flex px-2 py-1 text-xs font-medium ${getStatusColor(user.status)}`}>
                                {getStatusLabel(user.status)}
                              </span>
                              <div className="text-sm text-gray-600 mt-1">{formatDate(user.lastLogin)}</div>
                            </div>
                          </td>

                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-600">
                              {user.permissions.join(', ')}
                            </div>
                          </td>

                          <td className="px-6 py-4">
                            <div className="flex items-center justify-end space-x-2">
                              <button 
                                className="p-2 text-gray-400 hover:text-[#005357] hover:bg-gray-100 transition-colors rounded"
                                title="Lihat Detail"
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                              <button 
                                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors rounded"
                                title="Edit Pengguna"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button 
                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors rounded"
                                title="Hapus Pengguna"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* System Tab */}
          {activeTab === 'system' && (
            <div>
              <div className="p-6 bg-[#005357] text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-white">Pengaturan Sistem</h3>
                    <p className="text-sm text-gray-100 mt-1">Konfigurasi dan maintenance sistem</p>
                  </div>
                  <div className="w-8 h-8 bg-white flex items-center justify-center">
                    <Server className="h-4 w-4 text-[#005357]" />
                  </div>
                </div>
              </div>
              
              <div className="p-6 bg-gray-50">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* System Maintenance */}
                  <div className="bg-white shadow">
                    <div className="p-6 border-b border-gray-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-xl font-bold text-gray-900">System Maintenance</h3>
                          <p className="text-sm text-gray-600 mt-1">Tools pemeliharaan sistem</p>
                        </div>
                        <div className="w-8 h-8 bg-[#005357] flex items-center justify-center">
                          <Settings className="h-4 w-4 text-white" />
                        </div>
                      </div>
                    </div>
                    <div className="p-4 bg-gray-50 space-y-3">
                      <button className="w-full p-3 text-left bg-white hover:bg-gray-50 transition-colors">
                        <div className="flex items-center space-x-3">
                          <RefreshCw className="h-5 w-5 text-blue-600" />
                          <div>
                            <h3 className="font-medium text-gray-900">Restart Services</h3>
                            <p className="text-sm text-gray-600">Restart layanan sistem</p>
                          </div>
                        </div>
                      </button>
                      <button className="w-full p-3 text-left bg-white hover:bg-gray-50 transition-colors">
                        <div className="flex items-center space-x-3">
                          <Database className="h-5 w-5 text-green-600" />
                          <div>
                            <h3 className="font-medium text-gray-900">Database Optimization</h3>
                            <p className="text-sm text-gray-600">Optimasi performa database</p>
                          </div>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Backup & Recovery */}
                  <div className="bg-white shadow">
                    <div className="p-6 border-b border-gray-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-xl font-bold text-gray-900">Backup & Recovery</h3>
                          <p className="text-sm text-gray-600 mt-1">Manajemen data backup</p>
                        </div>
                        <div className="w-8 h-8 bg-[#005357] flex items-center justify-center">
                          <HardDrive className="h-4 w-4 text-white" />
                        </div>
                      </div>
                    </div>
                    <div className="p-4 bg-gray-50 space-y-3">
                      <button className="w-full p-3 text-left bg-white hover:bg-gray-50 transition-colors">
                        <div className="flex items-center space-x-3">
                          <Upload className="h-5 w-5 text-blue-600" />
                          <div>
                            <h3 className="font-medium text-gray-900">Create Backup</h3>
                            <p className="text-sm text-gray-600">Buat backup manual</p>
                          </div>
                        </div>
                      </button>
                      <button className="w-full p-3 text-left bg-white hover:bg-gray-50 transition-colors">
                        <div className="flex items-center space-x-3">
                          <Download className="h-5 w-5 text-green-600" />
                          <div>
                            <h3 className="font-medium text-gray-900">Restore Data</h3>
                            <p className="text-sm text-gray-600">Pulihkan dari backup</p>
                          </div>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* System Configuration */}
                  <div className="bg-white shadow">
                    <div className="p-6 border-b border-gray-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-xl font-bold text-gray-900">System Config</h3>
                          <p className="text-sm text-gray-600 mt-1">Konfigurasi sistem global</p>
                        </div>
                        <div className="w-8 h-8 bg-[#005357] flex items-center justify-center">
                          <Globe className="h-4 w-4 text-white" />
                        </div>
                      </div>
                    </div>
                    <div className="p-4 bg-gray-50 space-y-3">
                      <button className="w-full p-3 text-left bg-white hover:bg-gray-50 transition-colors">
                        <div className="flex items-center space-x-3">
                          <Settings className="h-5 w-5 text-purple-600" />
                          <div>
                            <h3 className="font-medium text-gray-900">General Settings</h3>
                            <p className="text-sm text-gray-600">Pengaturan umum sistem</p>
                          </div>
                        </div>
                      </button>
                      <button className="w-full p-3 text-left bg-white hover:bg-gray-50 transition-colors">
                        <div className="flex items-center space-x-3">
                          <Mail className="h-5 w-5 text-orange-600" />
                          <div>
                            <h3 className="font-medium text-gray-900">Email Configuration</h3>
                            <p className="text-sm text-gray-600">Setup SMTP dan notifikasi</p>
                          </div>
                        </div>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div>
              <div className="p-6 bg-[#005357] text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-white">Keamanan Sistem</h3>
                    <p className="text-sm text-gray-100 mt-1">Monitoring dan pengaturan keamanan</p>
                  </div>
                  <div className="w-8 h-8 bg-white flex items-center justify-center">
                    <Shield className="h-4 w-4 text-[#005357]" />
                  </div>
                </div>
              </div>
              
              <div className="p-6 bg-gray-50">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Security Alerts */}
                  <div className="bg-white shadow">
                    <div className="p-6 border-b border-gray-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-xl font-bold text-gray-900">Security Alerts</h3>
                          <p className="text-sm text-gray-600 mt-1">Peringatan keamanan terkini</p>
                        </div>
                        <div className="w-8 h-8 bg-[#005357] flex items-center justify-center">
                          <AlertTriangle className="h-4 w-4 text-white" />
                        </div>
                      </div>
                    </div>
                    <div className="p-4 bg-gray-50">
                      <div className="space-y-3">
                        <div className="p-3 bg-yellow-50 text-yellow-800">
                          <div className="flex items-center space-x-2">
                            <AlertTriangle className="h-4 w-4" />
                            <span className="text-sm font-medium">Multiple failed login attempts detected</span>
                          </div>
                          <div className="text-xs text-yellow-600 mt-1">IP: 192.168.1.100 - 5 attempts</div>
                        </div>
                        <div className="p-3 bg-red-50 text-red-800">
                          <div className="flex items-center space-x-2">
                            <AlertTriangle className="h-4 w-4" />
                            <span className="text-sm font-medium">Unauthorized access attempt</span>
                          </div>
                          <div className="text-xs text-red-600 mt-1">Admin panel access from unknown IP</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Security Settings */}
                  <div className="bg-white shadow">
                    <div className="p-6 border-b border-gray-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-xl font-bold text-gray-900">Security Settings</h3>
                          <p className="text-sm text-gray-600 mt-1">Konfigurasi keamanan sistem</p>
                        </div>
                        <div className="w-8 h-8 bg-[#005357] flex items-center justify-center">
                          <Lock className="h-4 w-4 text-white" />
                        </div>
                      </div>
                    </div>
                    <div className="p-4 bg-gray-50 space-y-3">
                      <button className="w-full p-3 text-left bg-white hover:bg-gray-50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <Key className="h-5 w-5 text-blue-600" />
                            <div>
                              <h3 className="font-medium text-gray-900">Password Policy</h3>
                              <p className="text-sm text-gray-600">Atur kebijakan password</p>
                            </div>
                          </div>
                          <span className="text-xs bg-green-100 text-green-800 px-2 py-1">Active</span>
                        </div>
                      </button>
                      <button className="w-full p-3 text-left bg-white hover:bg-gray-50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <Shield className="h-5 w-5 text-green-600" />
                            <div>
                              <h3 className="font-medium text-gray-900">Two-Factor Auth</h3>
                              <p className="text-sm text-gray-600">Aktifkan 2FA untuk admin</p>
                            </div>
                          </div>
                          <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1">Pending</span>
                        </div>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Logs Tab */}
          {activeTab === 'logs' && (
            <div>
              <div className="p-6 bg-[#005357] text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-white">Log Aktivitas</h3>
                    <p className="text-sm text-gray-100 mt-1">Riwayat aktivitas sistem dan pengguna</p>
                  </div>
                  <div className="w-8 h-8 bg-white flex items-center justify-center">
                    <Activity className="h-4 w-4 text-[#005357]" />
                  </div>
                </div>
              </div>
              
              <div className="p-6 bg-gray-50">
                {/* Logs Table */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-[#005357]">
                      <tr>
                        <th className="text-left py-4 px-6 text-sm font-bold text-white uppercase tracking-wider">
                          Timestamp
                        </th>
                        <th className="text-left py-4 px-6 text-sm font-bold text-white uppercase tracking-wider">
                          Level
                        </th>
                        <th className="text-left py-4 px-6 text-sm font-bold text-white uppercase tracking-wider">
                          Category
                        </th>
                        <th className="text-left py-4 px-6 text-sm font-bold text-white uppercase tracking-wider">
                          Message
                        </th>
                        <th className="text-left py-4 px-6 text-sm font-bold text-white uppercase tracking-wider">
                          User
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                      {systemLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900 font-mono">{log.timestamp}</div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex px-2 py-1 text-xs font-medium ${getLogLevelColor(log.level)}`}>
                              {log.level.toUpperCase()}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900">{log.category}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900">{log.message}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900">{log.user}</div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </OfficeLayout>
  );
}