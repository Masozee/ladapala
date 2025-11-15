'use client';

import { useState } from 'react';
import SupportLayout from '@/components/SupportLayout';
import {
  UserCheckIcon,
  Add01Icon,
  Search02Icon,
  Clock01Icon,
  UserIcon,
  Calendar01Icon,
  EyeIcon,
  PencilEdit02Icon,
  MoreHorizontalIcon,
  AlertCircleIcon,
  File01Icon,
  Location01Icon,
  Wrench01Icon,
  BedIcon,
  PackageIcon,
  UserMultipleIcon,
  SparklesIcon,
  ArrowUp01Icon,
  ChevronDownIcon,
  FilterIcon,
  Alert01Icon
} from '@/lib/icons';

export default function WorkOrdersPage() {
  const [activeTab, setActiveTab] = useState('open');
  const [selectedPriority, setSelectedPriority] = useState('all');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Sample work orders data
  const workOrderStats = {
    openOrders: 15,
    inProgress: 8,
    completedToday: 12,
    overdueOrders: 3,
    totalOrders: 156,
    averageCompletion: 2.5 // hours
  };

  const workOrders = [
    {
      id: 'WO-2024-001',
      title: 'Complete Room 205 Renovation',
      description: 'Full room renovation including painting, flooring, and fixture replacement',
      department: 'maintenance',
      category: 'renovation',
      priority: 'high',
      status: 'in_progress',
      assignedTo: 'Ahmad Rahman',
      supervisedBy: 'Maria Santos',
      location: 'Room 205',
      createdAt: '2024-08-26 08:00',
      dueDate: '2024-08-30 17:00',
      estimatedHours: 32,
      actualHours: 24,
      completedAt: null,
      tasks: [
        { id: 1, task: 'Remove old flooring', status: 'completed', assignedTo: 'David Chen' },
        { id: 2, task: 'Paint walls and ceiling', status: 'in_progress', assignedTo: 'Ahmad Rahman' },
        { id: 3, task: 'Install new flooring', status: 'pending', assignedTo: 'Ahmad Rahman' },
        { id: 4, task: 'Replace light fixtures', status: 'pending', assignedTo: 'Sarah Johnson' }
      ],
      materials: ['Paint', 'Flooring tiles', 'Light fixtures', 'Primer'],
      cost: 5500000,
      notes: 'VIP room - high quality finish required',
      photos: 8
    },
    {
      id: 'WO-2024-002',
      title: 'Deep Clean Suite 501',
      description: 'Post-maintenance deep cleaning and inspection',
      department: 'housekeeping',
      category: 'cleaning',
      priority: 'medium',
      status: 'pending',
      assignedTo: 'Lisa Chen',
      supervisedBy: 'Emma Wilson',
      location: 'Suite 501',
      createdAt: '2024-08-28 10:30',
      dueDate: '2024-08-28 16:00',
      estimatedHours: 4,
      actualHours: 0,
      completedAt: null,
      tasks: [
        { id: 1, task: 'Vacuum and mop all areas', status: 'pending', assignedTo: 'Lisa Chen' },
        { id: 2, task: 'Clean bathroom thoroughly', status: 'pending', assignedTo: 'Lisa Chen' },
        { id: 3, task: 'Restock amenities', status: 'pending', assignedTo: 'Room Service' },
        { id: 4, task: 'Quality inspection', status: 'pending', assignedTo: 'Emma Wilson' }
      ],
      materials: ['Cleaning supplies', 'Fresh linens', 'Amenities'],
      cost: 200000,
      notes: 'Guest checking in at 15:00 - priority completion',
      photos: 0
    },
    {
      id: 'WO-2024-003',
      title: 'Install New WiFi Equipment Floor 3',
      description: 'Network upgrade and WiFi router installation',
      department: 'it',
      category: 'technology',
      priority: 'urgent',
      status: 'in_progress',
      assignedTo: 'Tech Support Team',
      supervisedBy: 'IT Manager',
      location: 'Floor 3 - IT Closet',
      createdAt: '2024-08-28 09:00',
      dueDate: '2024-08-28 14:00',
      estimatedHours: 6,
      actualHours: 4,
      completedAt: null,
      tasks: [
        { id: 1, task: 'Remove old equipment', status: 'completed', assignedTo: 'Tech Support' },
        { id: 2, task: 'Install new routers', status: 'in_progress', assignedTo: 'Tech Support' },
        { id: 3, task: 'Configure network settings', status: 'pending', assignedTo: 'Network Admin' },
        { id: 4, task: 'Test all connections', status: 'pending', assignedTo: 'Tech Support' }
      ],
      materials: ['WiFi routers', 'Network cables', 'Mounting hardware'],
      cost: 3200000,
      notes: 'Guest complaints about slow internet - urgent priority',
      photos: 3
    },
    {
      id: 'WO-2024-004',
      title: 'Lobby Flower Arrangement Setup',
      description: 'Weekly fresh flower arrangement for main lobby',
      department: 'concierge',
      category: 'decoration',
      priority: 'low',
      status: 'completed',
      assignedTo: 'Anna Kim',
      supervisedBy: 'Concierge Manager',
      location: 'Main Lobby',
      createdAt: '2024-08-28 07:00',
      dueDate: '2024-08-28 11:00',
      estimatedHours: 2,
      actualHours: 1.5,
      completedAt: '2024-08-28 09:30',
      tasks: [
        { id: 1, task: 'Remove old arrangements', status: 'completed', assignedTo: 'Anna Kim' },
        { id: 2, task: 'Prepare new flower arrangements', status: 'completed', assignedTo: 'Anna Kim' },
        { id: 3, task: 'Install and position displays', status: 'completed', assignedTo: 'Anna Kim' },
        { id: 4, task: 'Clean and maintain vases', status: 'completed', assignedTo: 'Anna Kim' }
      ],
      materials: ['Fresh flowers', 'Vases', 'Floral foam', 'Cleaning supplies'],
      cost: 450000,
      notes: 'Seasonal arrangement - autumn theme requested',
      photos: 5
    },
    {
      id: 'WO-2024-005',
      title: 'Kitchen Equipment Maintenance',
      description: 'Quarterly maintenance of kitchen equipment and appliances',
      department: 'maintenance',
      category: 'preventive',
      priority: 'medium',
      status: 'overdue',
      assignedTo: 'Maintenance Team',
      supervisedBy: 'Ahmad Rahman',
      location: 'Main Kitchen',
      createdAt: '2024-08-25 08:00',
      dueDate: '2024-08-27 17:00',
      estimatedHours: 8,
      actualHours: 6,
      completedAt: null,
      tasks: [
        { id: 1, task: 'Clean and service ovens', status: 'completed', assignedTo: 'David Chen' },
        { id: 2, task: 'Check refrigeration units', status: 'completed', assignedTo: 'David Chen' },
        { id: 3, task: 'Service dishwashers', status: 'in_progress', assignedTo: 'Ahmad Rahman' },
        { id: 4, task: 'Test safety systems', status: 'pending', assignedTo: 'Safety Inspector' }
      ],
      materials: ['Cleaning supplies', 'Replacement filters', 'Lubricants'],
      cost: 750000,
      notes: 'Health inspection next week - must complete on time',
      photos: 4
    }
  ];

  const departments = [
    { id: 'maintenance', name: 'Maintenance', color: 'bg-blue-100 text-blue-800', icon: Wrench01Icon },
    { id: 'housekeeping', name: 'Housekeeping', color: 'bg-purple-100 text-purple-800', icon: BedIcon },
    { id: 'it', name: 'IT Support', color: 'bg-green-100 text-green-800', icon: File01Icon },
    { id: 'concierge', name: 'Concierge', color: 'bg-pink-100 text-pink-800', icon: PackageIcon },
    { id: 'security', name: 'Security', color: 'bg-red-100 text-red-800', icon: AlertCircleIcon }
  ];

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'Darurat';
      case 'high': return 'Tinggi';
      case 'medium': return 'Sedang';
      case 'low': return 'Rendah';
      default: return priority;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed': return 'Selesai';
      case 'in_progress': return 'Dalam Proses';
      case 'pending': return 'Menunggu';
      case 'overdue': return 'Terlambat';
      default: return status;
    }
  };

  const getDepartmentInfo = (dept: string) => {
    return departments.find(d => d.id === dept) || departments[0];
  };

  const getTaskStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600';
      case 'in_progress': return 'text-blue-600';
      case 'pending': return 'text-gray-600';
      default: return 'text-gray-600';
    }
  };

  const calculateProgress = (tasks: any[]) => {
    const completedTasks = tasks.filter(task => task.status === 'completed').length;
    return Math.round((completedTasks / tasks.length) * 100);
  };

  const filteredOrders = workOrders.filter(order => {
    const matchesTab = activeTab === 'all' || 
                      (activeTab === 'open' && (order.status === 'pending' || order.status === 'in_progress')) ||
                      (activeTab === 'completed' && order.status === 'completed') ||
                      (activeTab === 'overdue' && order.status === 'overdue');
    
    const matchesSearch = order.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         order.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         order.assignedTo.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesPriority = selectedPriority === 'all' || order.priority === selectedPriority;
    const matchesDepartment = selectedDepartment === 'all' || order.department === selectedDepartment;
    
    return matchesTab && matchesSearch && matchesPriority && matchesDepartment;
  });

  const TabButton = ({ tabId, label, count }: { tabId: string; label: string; count?: number }) => (
    <button
      onClick={() => setActiveTab(tabId)}
      className={`flex items-center space-x-2 px-4 py-2 text-sm font-medium transition-colors ${
        activeTab === tabId
          ? 'bg-[#F87B1B] text-white'
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
      }`}
    >
      <span>{label}</span>
      {count !== undefined && (
        <span className={`px-2 py-0.5 text-xs rounded-full ${
          activeTab === tabId ? 'bg-white text-[#F87B1B]' : 'bg-gray-200 text-gray-600'
        }`}>
          {count}
        </span>
      )}
    </button>
  );

  return (
    <SupportLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Work Orders Management</h1>
          <p className="text-gray-600 mt-2">Kelola work order, project, dan tugas multi-departemen</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white border border-gray-200">
            <div className="p-6 border-b border-gray-200 bg-[#F87B1B] text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-white">Open Orders</h3>
                  <p className="text-sm text-gray-100 mt-1">Aktif & pending</p>
                </div>
                <div className="w-8 h-8 bg-white flex items-center justify-center">
                  <Clock01Icon className="h-4 w-4 text-[#F87B1B]" />
                </div>
              </div>
            </div>
            <div className="p-4 bg-gray-50">
              <div className="text-center">
                <div className="text-3xl font-bold text-[#F87B1B]">{workOrderStats.openOrders}</div>
                <div className="text-sm text-gray-600">work orders</div>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200">
            <div className="p-6 border-b border-gray-200 bg-[#F87B1B] text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-white">In Progress</h3>
                  <p className="text-sm text-gray-100 mt-1">Sedang dikerjakan</p>
                </div>
                <div className="w-8 h-8 bg-white flex items-center justify-center">
                  <Clock01Icon className="h-4 w-4 text-[#F87B1B]" />
                </div>
              </div>
            </div>
            <div className="p-4 bg-gray-50">
              <div className="text-center">
                <div className="text-3xl font-bold text-[#F87B1B]">{workOrderStats.inProgress}</div>
                <div className="text-sm text-gray-600">dalam proses</div>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200">
            <div className="p-6 border-b border-gray-200 bg-[#F87B1B] text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-white">Completed Today</h3>
                  <p className="text-sm text-gray-100 mt-1">Selesai hari ini</p>
                </div>
                <div className="w-8 h-8 bg-white flex items-center justify-center">
                  <UserCheckIcon className="h-4 w-4 text-[#F87B1B]" />
                </div>
              </div>
            </div>
            <div className="p-4 bg-gray-50">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">{workOrderStats.completedToday}</div>
                <div className="text-sm text-gray-600">selesai</div>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200">
            <div className="p-6 border-b border-gray-200 bg-[#F87B1B] text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-white">Overdue</h3>
                  <p className="text-sm text-gray-100 mt-1">Terlambat</p>
                </div>
                <div className="w-8 h-8 bg-white flex items-center justify-center">
                  <Alert01Icon className="h-4 w-4 text-[#F87B1B]" />
                </div>
              </div>
            </div>
            <div className="p-4 bg-gray-50">
              <div className="text-center">
                <div className="text-3xl font-bold text-red-600">{workOrderStats.overdueOrders}</div>
                <div className="text-sm text-gray-600">terlambat</div>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 mb-6 bg-gray-100 p-1">
          <TabButton tabId="open" label="Open" count={workOrderStats.openOrders} />
          <TabButton tabId="completed" label="Completed" count={workOrderStats.completedToday} />
          <TabButton tabId="overdue" label="Overdue" count={workOrderStats.overdueOrders} />
          <TabButton tabId="all" label="All" count={workOrderStats.totalOrders} />
        </div>

        {/* Filters */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search02Icon className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Cari work order..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#F87B1B] focus:border-[#F87B1B] w-64 border border-gray-300"
              />
            </div>
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#F87B1B] border border-gray-300"
            >
              <option value="all">Semua Prioritas</option>
              <option value="urgent">Darurat</option>
              <option value="high">Tinggi</option>
              <option value="medium">Sedang</option>
              <option value="low">Rendah</option>
            </select>
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#F87B1B] border border-gray-300"
            >
              <option value="all">Semua Departemen</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>{dept.name}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center space-x-3">
            <button className="bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors flex items-center space-x-2 border border-gray-300">
              <ChevronDownIcon className="h-4 w-4" />
              <span>Export</span>
            </button>
            <button className="bg-[#F87B1B] text-white px-4 py-2 text-sm font-medium hover:bg-[#E06A0A] transition-colors flex items-center space-x-2">
              <Add01Icon className="h-4 w-4" />
              <span>New Work Order</span>
            </button>
          </div>
        </div>

        {/* Work Orders Table */}
        <div className="bg-white border border-gray-200">
          <div className="overflow-visible">
            <table className="w-full">
              <thead>
                <tr className="bg-[#F87B1B]">
                  <th className="px-6 py-4 text-left text-sm font-medium text-white border border-gray-300">ID</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-white border border-gray-300">Title & Description</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-white border border-gray-300">Department</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-white border border-gray-300">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-white border border-gray-300">Assigned To</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-white border border-gray-300">Location</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-white border border-gray-300">Due Date</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-white border border-gray-300">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => {
                  const deptInfo = getDepartmentInfo(order.department);
                  const isOverdue = new Date(order.dueDate) < new Date() && order.status !== 'completed';

                  return (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 border border-gray-200">
                        <div className="font-mono text-sm font-medium text-gray-900">{order.id}</div>
                      </td>
                      <td className="px-6 py-4 border border-gray-200">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium ${getPriorityColor(order.priority)}`}>
                            {getPriorityLabel(order.priority)}
                          </span>
                        </div>
                        <div className="font-semibold text-sm text-gray-900 mb-1">{order.title}</div>
                        <div className="text-xs text-gray-600 line-clamp-2">{order.description}</div>
                      </td>
                      <td className="px-6 py-4 border border-gray-200">
                        <span className={`inline-flex items-center px-2 py-1 text-xs font-medium ${deptInfo.color}`}>
                          <deptInfo.icon className="h-3 w-3 mr-1" />
                          {deptInfo.name}
                        </span>
                      </td>
                      <td className="px-6 py-4 border border-gray-200">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium ${getStatusColor(order.status)}`}>
                          {getStatusLabel(order.status)}
                        </span>
                        {isOverdue && (
                          <div className="mt-1">
                            <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-red-100 text-red-800">
                              <Alert01Icon className="h-3 w-3 mr-1" />
                              Overdue
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 border border-gray-200">
                        <div className="text-sm text-gray-900">{order.assignedTo}</div>
                        <div className="text-xs text-gray-500">Supervisor: {order.supervisedBy}</div>
                      </td>
                      <td className="px-6 py-4 border border-gray-200">
                        <div className="flex items-center space-x-1 text-sm text-gray-900">
                          <Location01Icon className="h-3 w-3 text-gray-400" />
                          <span>{order.location}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 border border-gray-200">
                        <div className={`text-sm ${isOverdue ? 'text-red-600 font-medium' : 'text-gray-900'}`}>
                          {formatDate(order.dueDate)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {order.estimatedHours}h est / {order.actualHours}h actual
                        </div>
                      </td>
                      <td className="px-6 py-4 border border-gray-200">
                        <button className="p-2 text-gray-600 hover:bg-gray-100 transition-colors border border-gray-300 rounded">
                          <MoreHorizontalIcon className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </SupportLayout>
  );
}