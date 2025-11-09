'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import OfficeLayout from '@/components/OfficeLayout';
import { buildApiUrl, getCsrfToken } from '@/lib/config';
import {
  Shield01Icon,
  UserMultipleIcon,
  Settings02Icon,
  PackageIcon,
  ViewIcon,
  PieChartIcon,
  AlertCircleIcon,
  UserCheckIcon,
  Clock01Icon,
  Mail01Icon,
  Notification02Icon,
  UserIcon,
  Add01Icon,
  CancelCircleIcon,
  EyeIcon,
  PencilEdit02Icon,
  MoreHorizontalIcon,
  ChevronDownIcon,
  ArrowUp01Icon,
  Loading03Icon,
  Search02Icon,
  FilterIcon,
  Monitor,
  Activity,
  Cpu,
  Alert01Icon,
  Server,
  HardDrive,
  Delete02Icon,
  Location01Icon,
  DatabaseIcon,
  Building03Icon,
  Call02Icon
} from '@/lib/icons';

interface ApiUser {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  phone: string;
  is_active: boolean;
  date_joined: string;
  last_login: string | null;
  employee?: {
    department: string;
    position: string;
  };
}

export default function AdminPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('info');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUserRole, setSelectedUserRole] = useState('all');
  const [apiUsers, setApiUsers] = useState<ApiUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingSettings, setLoadingSettings] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [hotelInfo, setHotelInfo] = useState({
    hotelName: '',
    hotelDescription: '',
    address: '',
    phone: '',
    email: '',
    website: '',
    timezone: 'Asia/Jakarta',
    currency: 'IDR',
    language: 'id',
  });

  // System stats state
  const [systemStats, setSystemStats] = useState({
    totalUsers: 24,
    activeUsers: 18,
    systemUptime: '99.9%',
    serverLoad: 0,
    diskUsage: 0,
    memoryUsage: 0,
    lastBackup: '2024-08-28',
    securityAlerts: 2,
    processCount: 0,
    uptimeDays: 0
  });

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

  // Fetch system stats from API
  useEffect(() => {
    const fetchSystemStats = async () => {
      try {
        const response = await fetch(buildApiUrl('hotel/system/stats/'));
        if (response.ok) {
          const data = await response.json();
          setSystemStats(prevStats => ({
            ...prevStats,
            serverLoad: data.serverLoad || 0,
            diskUsage: data.diskUsage || 0,
            memoryUsage: data.memoryUsage || 0,
            systemUptime: data.systemUptime || '99.9%',
            processCount: data.processCount || 0,
            uptimeDays: data.uptimeDays || 0
          }));
        }
      } catch (error) {
        console.error('Error fetching system stats:', error);
      }
    };

    // Fetch immediately
    fetchSystemStats();

    // Refresh every 10 seconds
    const interval = setInterval(fetchSystemStats, 10000);

    return () => clearInterval(interval);
  }, []);

  // Fetch users from API
  useEffect(() => {
    const fetchUsers = async () => {
      if (activeTab !== 'users') return;

      try {
        setLoadingUsers(true);
        const response = await fetch(buildApiUrl('user/users/'), {
          credentials: 'include',
        });
        if (response.ok) {
          const data = await response.json();
          setApiUsers(data);
        }
      } catch (error) {
        console.error('Error fetching users:', error);
      } finally {
        setLoadingUsers(false);
      }
    };

    fetchUsers();
  }, [activeTab]);

  // Fetch hotel information settings
  useEffect(() => {
    const fetchHotelInfo = async () => {
      if (activeTab !== 'info') return;

      try {
        setLoadingSettings(true);
        const response = await fetch(buildApiUrl('hotel/settings/'), {
          credentials: 'include',
        });
        if (response.ok) {
          const data = await response.json();
          setHotelInfo({
            hotelName: data.hotel_name || '',
            hotelDescription: data.hotel_description || '',
            address: data.address || '',
            phone: data.phone || '',
            email: data.email || '',
            website: data.website || '',
            timezone: data.timezone || 'Asia/Jakarta',
            currency: data.currency || 'IDR',
            language: data.language || 'id',
          });
        }
      } catch (error) {
        console.error('Error fetching hotel info:', error);
      } finally {
        setLoadingSettings(false);
      }
    };

    fetchHotelInfo();
  }, [activeTab]);

  // Save hotel information
  const handleSaveHotelInfo = async () => {
    try {
      setSavingSettings(true);
      const csrfToken = getCsrfToken();

      const response = await fetch(buildApiUrl('hotel/settings/1/'), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(csrfToken && { 'X-CSRFToken': csrfToken }),
        },
        credentials: 'include',
        body: JSON.stringify({
          hotel_name: hotelInfo.hotelName,
          hotel_description: hotelInfo.hotelDescription,
          address: hotelInfo.address,
          phone: hotelInfo.phone,
          email: hotelInfo.email,
          website: hotelInfo.website,
          timezone: hotelInfo.timezone,
          currency: hotelInfo.currency,
          language: hotelInfo.language,
        }),
      });

      if (response.ok) {
        alert('Hotel information saved successfully!');
      } else {
        alert('Failed to save hotel information');
      }
    } catch (error) {
      console.error('Error saving hotel info:', error);
      alert('Error saving hotel information');
    } finally {
      setSavingSettings(false);
    }
  };

  // Transform API users to match the UI format
  const transformedUsers = apiUsers.map(user => ({
    id: user.id,
    name: `${user.first_name} ${user.last_name}`,
    email: user.email,
    role: user.role.toLowerCase(),
    department: user.employee?.department || 'N/A',
    status: user.is_active ? 'active' : 'inactive',
    lastLogin: user.last_login || user.date_joined,
    permissions: user.role === 'ADMIN' ? ['all'] : ['basic']
  }));

  const filteredUsers = transformedUsers.filter(user => {
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
          ? 'bg-[#4E61D3] text-white'
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
        <div className="flex space-x-1 bg-gray-50">
          <TabButton tabId="info" label="Info Hotel" icon={Building03Icon} />
          <TabButton tabId="dashboard" label="Dashboard" icon={ViewIcon} />
          <TabButton tabId="users" label="Pengguna" icon={UserMultipleIcon} />
          <TabButton tabId="system" label="Sistem" icon={PackageIcon} />
          <TabButton tabId="security" label="Keamanan" icon={Shield01Icon} />
          <TabButton tabId="logs" label="Log Aktivitas" icon={PieChartIcon} />
        </div>

        {/* Info Hotel Tab */}
        {activeTab === 'info' && (
          <div>
            {loadingSettings ? (
              <div className="flex items-center justify-center py-12 bg-white">
                <div className="text-center">
                  <Loading03Icon className="h-12 w-12 text-[#4E61D3] mx-auto animate-spin mb-4" />
                  <p className="text-gray-600">Loading hotel information...</p>
                </div>
              </div>
            ) : (
              <div className="bg-white border border-gray-200">
                <div className="p-6 bg-[#4E61D3] text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-bold">Informasi Hotel</h3>
                      <p className="text-sm mt-1 text-white/90">Konfigurasi informasi dasar hotel</p>
                    </div>
                    <div className="w-10 h-10 bg-white/10 flex items-center justify-center">
                      <Building03Icon className="h-5 w-5 text-white" />
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Nama Hotel</label>
                      <input
                        type="text"
                        value={hotelInfo.hotelName}
                        onChange={(e) => setHotelInfo({...hotelInfo, hotelName: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-[#4E61D3] focus:border-[#4E61D3]"
                        placeholder="Kapulaga Hotel"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                      <input
                        type="email"
                        value={hotelInfo.email}
                        onChange={(e) => setHotelInfo({...hotelInfo, email: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-[#4E61D3] focus:border-[#4E61D3]"
                        placeholder="info@kapulaga.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Telepon</label>
                      <input
                        type="tel"
                        value={hotelInfo.phone}
                        onChange={(e) => setHotelInfo({...hotelInfo, phone: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-[#4E61D3] focus:border-[#4E61D3]"
                        placeholder="+62-21-5555-0123"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Website</label>
                      <input
                        type="url"
                        value={hotelInfo.website}
                        onChange={(e) => setHotelInfo({...hotelInfo, website: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-[#4E61D3] focus:border-[#4E61D3]"
                        placeholder="https://kapulaga.com"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Alamat</label>
                      <textarea
                        value={hotelInfo.address}
                        onChange={(e) => setHotelInfo({...hotelInfo, address: e.target.value})}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-[#4E61D3] focus:border-[#4E61D3]"
                        placeholder="Jl. Sudirman No. 123, Jakarta 10220"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Deskripsi Hotel</label>
                      <textarea
                        value={hotelInfo.hotelDescription}
                        onChange={(e) => setHotelInfo({...hotelInfo, hotelDescription: e.target.value})}
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-[#4E61D3] focus:border-[#4E61D3]"
                        placeholder="Premium hospitality experience in the heart of the city"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Timezone</label>
                      <select
                        value={hotelInfo.timezone}
                        onChange={(e) => setHotelInfo({...hotelInfo, timezone: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-[#4E61D3] focus:border-[#4E61D3]"
                      >
                        <option value="Asia/Jakarta">Asia/Jakarta (WIB)</option>
                        <option value="Asia/Makassar">Asia/Makassar (WITA)</option>
                        <option value="Asia/Jayapura">Asia/Jayapura (WIT)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Mata Uang</label>
                      <select
                        value={hotelInfo.currency}
                        onChange={(e) => setHotelInfo({...hotelInfo, currency: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-[#4E61D3] focus:border-[#4E61D3]"
                      >
                        <option value="IDR">IDR (Rupiah)</option>
                        <option value="USD">USD (Dollar)</option>
                      </select>
                    </div>
                  </div>
                  <div className="mt-6 flex justify-end">
                    <button
                      onClick={handleSaveHotelInfo}
                      disabled={savingSettings}
                      className="flex items-center space-x-2 px-6 py-3 bg-[#4E61D3] text-white hover:bg-[#3d4da8] transition-colors disabled:opacity-50 disabled:cursor-not-allowed rounded"
                    >
                      {savingSettings ? (
                        <>
                          <Loading03Icon className="h-4 w-4 animate-spin" />
                          <span>Menyimpan...</span>
                        </>
                      ) : (
                        <>
                          <Settings02Icon className="h-4 w-4" />
                          <span>Simpan Perubahan</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div>
            {/* System Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                  <div className="bg-white border border-gray-200">
                    <div className="p-6 ">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-xl font-bold text-gray-900">Total Pengguna</h3>
                          <p className="text-sm text-gray-600 mt-1">Terdaftar aktif</p>
                        </div>
                        <div className="w-8 h-8 bg-[#4E61D3] flex items-center justify-center">
                          <UserMultipleIcon className="h-4 w-4 text-white" />
                        </div>
                      </div>
                    </div>
                    <div className="p-4 bg-gray-50">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-[#4E61D3]">{systemStats.totalUsers}</div>
                        <div className="text-sm text-gray-600">{systemStats.activeUsers} aktif</div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white border border-gray-200">
                    <div className="p-6 ">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-xl font-bold text-gray-900">System Uptime</h3>
                          <p className="text-sm text-gray-600 mt-1">Ketersediaan sistem</p>
                        </div>
                        <div className="w-8 h-8 bg-[#4E61D3] flex items-center justify-center">
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

                  <div className="bg-white border border-gray-200">
                    <div className="p-6 ">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-xl font-bold text-gray-900">Server Load</h3>
                          <p className="text-sm text-gray-600 mt-1">Beban CPU rata-rata</p>
                        </div>
                        <div className="w-8 h-8 bg-[#4E61D3] flex items-center justify-center">
                          <Cpu className="h-4 w-4 text-white" />
                        </div>
                      </div>
                    </div>
                    <div className="p-4 bg-gray-50">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-[#4E61D3]">{systemStats.serverLoad}%</div>
                        <div className="text-sm text-gray-600">CPU usage</div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white border border-gray-200">
                    <div className="p-6 ">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-xl font-bold text-gray-900">Security Alerts</h3>
                          <p className="text-sm text-gray-600 mt-1">Peringatan keamanan</p>
                        </div>
                        <div className="w-8 h-8 bg-[#4E61D3] flex items-center justify-center">
                          <Alert01Icon className="h-4 w-4 text-white" />
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
                  <div className="bg-white border border-gray-200">
                    <div className="p-6 ">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-xl font-bold text-gray-900">Status Sistem</h3>
                          <p className="text-sm text-gray-600 mt-1">Monitoring komponen utama</p>
                        </div>
                        <div className="w-8 h-8 bg-[#4E61D3] flex items-center justify-center">
                          <Server className="h-4 w-4 text-white" />
                        </div>
                      </div>
                    </div>
                    <div className="p-4 bg-gray-50">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <UserCheckIcon className="h-5 w-5 text-green-500" />
                            <span className="text-sm font-medium">Database Server</span>
                          </div>
                          <span className="text-xs bg-green-100 text-green-800 px-2 py-1">Online</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <UserCheckIcon className="h-5 w-5 text-green-500" />
                            <span className="text-sm font-medium">Web Server</span>
                          </div>
                          <span className="text-xs bg-green-100 text-green-800 px-2 py-1">Online</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <Alert01Icon className="h-5 w-5 text-yellow-500" />
                            <span className="text-sm font-medium">Backup Server</span>
                          </div>
                          <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1">Warning</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <UserCheckIcon className="h-5 w-5 text-green-500" />
                            <span className="text-sm font-medium">Email Service</span>
                          </div>
                          <span className="text-xs bg-green-100 text-green-800 px-2 py-1">Online</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white border border-gray-200">
                    <div className="p-6 ">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-xl font-bold text-gray-900">Resource Usage</h3>
                          <p className="text-sm text-gray-600 mt-1">Penggunaan sistem real-time</p>
                        </div>
                        <div className="w-8 h-8 bg-[#4E61D3] flex items-center justify-center">
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
                              className="bg-[#4E61D3] h-2" 
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
          )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div>
            {/* Filters - Right aligned */}
            <div className="flex items-center justify-end mb-6 space-x-3">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search02Icon className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Cari..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#4E61D3] focus:border-[#4E61D3] w-48"
                  />
                </div>
                <select
                  value={selectedUserRole}
                  onChange={(e) => setSelectedUserRole(e.target.value)}
                  className="px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#4E61D3]"
                >
                  <option value="all">All Roles</option>
                  <option value="admin">Admin</option>
                  <option value="manager">Manager</option>
                  <option value="staff">Staff</option>
                </select>
              </div>

                {/* Users Table */}
                <div className="overflow-visible">
                  {loadingUsers ? (
                    <div className="flex items-center justify-center py-12 bg-white">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4E61D3] mx-auto mb-4"></div>
                        <p className="text-gray-600">Loading users...</p>
                      </div>
                    </div>
                  ) : filteredUsers.length === 0 ? (
                    <div className="flex items-center justify-center py-12 bg-white">
                      <div className="text-center">
                        <UserMultipleIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-600">No users found</p>
                      </div>
                    </div>
                  ) : (
                    <table className="w-full border-collapse">
                      <thead className="bg-[#4E61D3]">
                        <tr>
                          <th className="border border-gray-300 text-left py-4 px-6 text-sm font-bold text-white uppercase tracking-wider">
                            Pengguna
                          </th>
                          <th className="border border-gray-300 text-left py-4 px-6 text-sm font-bold text-white uppercase tracking-wider">
                            Role & Departemen
                          </th>
                          <th className="border border-gray-300 text-left py-4 px-6 text-sm font-bold text-white uppercase tracking-wider">
                            Status & Login Terakhir
                          </th>
                          <th className="border border-gray-300 text-left py-4 px-6 text-sm font-bold text-white uppercase tracking-wider">
                            Permissions
                          </th>
                          <th className="border border-gray-300 text-right py-4 px-6 text-sm font-bold text-white uppercase tracking-wider">
                            Aksi
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white">
                        {filteredUsers.map((user) => (
                        <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                          <td className="border border-gray-200 px-6 py-4">
                            <div className="flex items-center">
                              <div className="w-10 h-10 bg-[#4E61D3] flex items-center justify-center text-white font-bold">
                                {user.name.split(' ').map(n => n[0]).join('')}
                              </div>
                              <div className="ml-4">
                                <div className="font-semibold text-gray-900">{user.name}</div>
                                <div className="text-sm text-gray-600">{user.email}</div>
                              </div>
                            </div>
                          </td>

                          <td className="border border-gray-200 px-6 py-4">
                            <div>
                              <span className={`inline-flex px-2 py-1 text-xs font-medium ${getRoleColor(user.role)}`}>
                                {getRoleLabel(user.role)}
                              </span>
                              <div className="text-sm text-gray-600 mt-1">{user.department}</div>
                            </div>
                          </td>

                          <td className="border border-gray-200 px-6 py-4">
                            <div>
                              <span className={`inline-flex px-2 py-1 text-xs font-medium ${getStatusColor(user.status)}`}>
                                {getStatusLabel(user.status)}
                              </span>
                              <div className="text-sm text-gray-600 mt-1">{formatDate(user.lastLogin)}</div>
                            </div>
                          </td>

                          <td className="border border-gray-200 px-6 py-4">
                            <div className="text-sm text-gray-600">
                              {user.permissions.join(', ')}
                            </div>
                          </td>

                          <td className="border border-gray-200 px-6 py-4">
                            <div className="flex items-center justify-end space-x-2">
                              <button 
                                className="p-2 text-gray-400 hover:text-[#4E61D3] hover:bg-gray-100 transition-colors rounded"
                                title="Lihat Detail"
                              >
                                <EyeIcon className="h-4 w-4" />
                              </button>
                              <button 
                                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors rounded"
                                title="Edit Pengguna"
                              >
                                <PencilEdit02Icon className="h-4 w-4" />
                              </button>
                              <button 
                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors rounded"
                                title="Hapus Pengguna"
                              >
                                <Delete02Icon className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
            </div>
          )}

        {/* System Tab */}
        {activeTab === 'system' && (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* System Maintenance */}
                  <div className="bg-white border border-gray-200">
                    <div className="p-6 ">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-xl font-bold text-gray-900">System Maintenance</h3>
                          <p className="text-sm text-gray-600 mt-1">Tools pemeliharaan sistem</p>
                        </div>
                        <div className="w-8 h-8 bg-[#4E61D3] flex items-center justify-center">
                          <Settings02Icon className="h-4 w-4 text-white" />
                        </div>
                      </div>
                    </div>
                    <div className="p-4 bg-gray-50 space-y-3">
                      <button className="w-full p-3 text-left bg-white hover:bg-gray-50 transition-colors">
                        <div className="flex items-center space-x-3">
                          <Loading03Icon className="h-5 w-5 text-blue-600" />
                          <div>
                            <h3 className="font-medium text-gray-900">Restart Services</h3>
                            <p className="text-sm text-gray-600">Restart layanan sistem</p>
                          </div>
                        </div>
                      </button>
                      <button className="w-full p-3 text-left bg-white hover:bg-gray-50 transition-colors">
                        <div className="flex items-center space-x-3">
                          <DatabaseIcon className="h-5 w-5 text-green-600" />
                          <div>
                            <h3 className="font-medium text-gray-900">Database Optimization</h3>
                            <p className="text-sm text-gray-600">Optimasi performa database</p>
                          </div>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Backup & Recovery */}
                  <div className="bg-white border border-gray-200">
                    <div className="p-6 ">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-xl font-bold text-gray-900">Backup & Recovery</h3>
                          <p className="text-sm text-gray-600 mt-1">Manajemen data backup</p>
                        </div>
                        <div className="w-8 h-8 bg-[#4E61D3] flex items-center justify-center">
                          <HardDrive className="h-4 w-4 text-white" />
                        </div>
                      </div>
                    </div>
                    <div className="p-4 bg-gray-50 space-y-3">
                      <button className="w-full p-3 text-left bg-white hover:bg-gray-50 transition-colors">
                        <div className="flex items-center space-x-3">
                          <ArrowUp01Icon className="h-5 w-5 text-blue-600" />
                          <div>
                            <h3 className="font-medium text-gray-900">Create Backup</h3>
                            <p className="text-sm text-gray-600">Buat backup manual</p>
                          </div>
                        </div>
                      </button>
                      <button className="w-full p-3 text-left bg-white hover:bg-gray-50 transition-colors">
                        <div className="flex items-center space-x-3">
                          <ChevronDownIcon className="h-5 w-5 text-green-600" />
                          <div>
                            <h3 className="font-medium text-gray-900">Restore Data</h3>
                            <p className="text-sm text-gray-600">Pulihkan dari backup</p>
                          </div>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* System Configuration */}
                  <div className="bg-white border border-gray-200">
                    <div className="p-6 ">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-xl font-bold text-gray-900">System Config</h3>
                          <p className="text-sm text-gray-600 mt-1">Konfigurasi sistem global</p>
                        </div>
                        <div className="w-8 h-8 bg-[#4E61D3] flex items-center justify-center">
                          <Location01Icon className="h-4 w-4 text-white" />
                        </div>
                      </div>
                    </div>
                    <div className="p-4 bg-gray-50 space-y-3">
                      <button className="w-full p-3 text-left bg-white hover:bg-gray-50 transition-colors">
                        <div className="flex items-center space-x-3">
                          <Settings02Icon className="h-5 w-5 text-purple-600" />
                          <div>
                            <h3 className="font-medium text-gray-900">General Settings</h3>
                            <p className="text-sm text-gray-600">Pengaturan umum sistem</p>
                          </div>
                        </div>
                      </button>
                      <button className="w-full p-3 text-left bg-white hover:bg-gray-50 transition-colors">
                        <div className="flex items-center space-x-3">
                          <Mail01Icon className="h-5 w-5 text-orange-600" />
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
          )}

        {/* Security Tab */}
        {activeTab === 'security' && (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Security Alerts */}
                  <div className="bg-white border border-gray-200">
                    <div className="p-6 ">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-xl font-bold text-gray-900">Security Alerts</h3>
                          <p className="text-sm text-gray-600 mt-1">Peringatan keamanan terkini</p>
                        </div>
                        <div className="w-8 h-8 bg-[#4E61D3] flex items-center justify-center">
                          <Alert01Icon className="h-4 w-4 text-white" />
                        </div>
                      </div>
                    </div>
                    <div className="p-4 bg-gray-50">
                      <div className="space-y-3">
                        <div className="p-3 bg-yellow-50 text-yellow-800">
                          <div className="flex items-center space-x-2">
                            <Alert01Icon className="h-4 w-4" />
                            <span className="text-sm font-medium">Multiple failed login attempts detected</span>
                          </div>
                          <div className="text-xs text-yellow-600 mt-1">IP: 192.168.1.100 - 5 attempts</div>
                        </div>
                        <div className="p-3 bg-red-50 text-red-800">
                          <div className="flex items-center space-x-2">
                            <Alert01Icon className="h-4 w-4" />
                            <span className="text-sm font-medium">Unauthorized access attempt</span>
                          </div>
                          <div className="text-xs text-red-600 mt-1">Admin panel access from unknown IP</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Security Settings */}
                  <div className="bg-white border border-gray-200">
                    <div className="p-6 ">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-xl font-bold text-gray-900">Security Settings</h3>
                          <p className="text-sm text-gray-600 mt-1">Konfigurasi keamanan sistem</p>
                        </div>
                        <div className="w-8 h-8 bg-[#4E61D3] flex items-center justify-center">
                          <Shield01Icon className="h-4 w-4 text-white" />
                        </div>
                      </div>
                    </div>
                    <div className="p-4 bg-gray-50 space-y-3">
                      <button className="w-full p-3 text-left bg-white hover:bg-gray-50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <Shield01Icon className="h-5 w-5 text-blue-600" />
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
                            <Shield01Icon className="h-5 w-5 text-green-600" />
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
          )}

        {/* Logs Tab */}
        {activeTab === 'logs' && (
          <div>
            {/* Logs Table */}
            <div className="overflow-visible">
                  <table className="w-full border-collapse">
                    <thead className="bg-[#4E61D3]">
                      <tr>
                        <th className="border border-gray-300 text-left py-4 px-6 text-sm font-bold text-white uppercase tracking-wider">
                          Timestamp
                        </th>
                        <th className="border border-gray-300 text-left py-4 px-6 text-sm font-bold text-white uppercase tracking-wider">
                          Level
                        </th>
                        <th className="border border-gray-300 text-left py-4 px-6 text-sm font-bold text-white uppercase tracking-wider">
                          Category
                        </th>
                        <th className="border border-gray-300 text-left py-4 px-6 text-sm font-bold text-white uppercase tracking-wider">
                          Message
                        </th>
                        <th className="border border-gray-300 text-left py-4 px-6 text-sm font-bold text-white uppercase tracking-wider">
                          UserIcon
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white">
                      {systemLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                          <td className="border border-gray-200 px-6 py-4">
                            <div className="text-sm text-gray-900 font-mono">{log.timestamp}</div>
                          </td>
                          <td className="border border-gray-200 px-6 py-4">
                            <span className={`inline-flex px-2 py-1 text-xs font-medium ${getLogLevelColor(log.level)}`}>
                              {log.level.toUpperCase()}
                            </span>
                          </td>
                          <td className="border border-gray-200 px-6 py-4">
                            <div className="text-sm text-gray-900">{log.category}</div>
                          </td>
                          <td className="border border-gray-200 px-6 py-4">
                            <div className="text-sm text-gray-900">{log.message}</div>
                          </td>
                          <td className="border border-gray-200 px-6 py-4">
                            <div className="text-sm text-gray-900">{log.user}</div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
            </div>
          )}
      </div>
    </OfficeLayout>
  );
}