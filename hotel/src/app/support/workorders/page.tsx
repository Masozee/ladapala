'use client';

import { useState } from 'react';
import SupportLayout from '@/components/SupportLayout';
import { 
  ClipboardCheck, 
  Plus,
  Search,
  Clock,
  CheckCircle,
  User,
  Calendar,
  Eye,
  Edit,
  MoreHorizontal,
  AlertTriangle,
  Timer,
  FileText,
  MapPin,
  Wrench,
  Bed,
  Package,
  Users,
  Star,
  TrendingUp,
  Download,
  Filter
} from 'lucide-react';

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
    { id: 'maintenance', name: 'Maintenance', color: 'bg-blue-100 text-blue-800', icon: Wrench },
    { id: 'housekeeping', name: 'Housekeeping', color: 'bg-purple-100 text-purple-800', icon: Bed },
    { id: 'it', name: 'IT Support', color: 'bg-green-100 text-green-800', icon: FileText },
    { id: 'concierge', name: 'Concierge', color: 'bg-pink-100 text-pink-800', icon: Package },
    { id: 'security', name: 'Security', color: 'bg-red-100 text-red-800', icon: AlertTriangle }
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
          ? 'bg-[#005357] text-white'
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
      }`}
    >
      <span>{label}</span>
      {count !== undefined && (
        <span className={`px-2 py-0.5 text-xs rounded-full ${
          activeTab === tabId ? 'bg-white text-[#005357]' : 'bg-gray-200 text-gray-600'
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
          <div className="bg-white shadow">
            <div className="p-6 border-b border-gray-200 bg-[#005357] text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-white">Open Orders</h3>
                  <p className="text-sm text-gray-100 mt-1">Aktif & pending</p>
                </div>
                <div className="w-8 h-8 bg-white flex items-center justify-center">
                  <Clock className="h-4 w-4 text-[#005357]" />
                </div>
              </div>
            </div>
            <div className="p-4 bg-gray-50">
              <div className="text-center">
                <div className="text-3xl font-bold text-[#005357]">{workOrderStats.openOrders}</div>
                <div className="text-sm text-gray-600">work orders</div>
              </div>
            </div>
          </div>

          <div className="bg-white shadow">
            <div className="p-6 border-b border-gray-200 bg-[#005357] text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-white">In Progress</h3>
                  <p className="text-sm text-gray-100 mt-1">Sedang dikerjakan</p>
                </div>
                <div className="w-8 h-8 bg-white flex items-center justify-center">
                  <Timer className="h-4 w-4 text-[#005357]" />
                </div>
              </div>
            </div>
            <div className="p-4 bg-gray-50">
              <div className="text-center">
                <div className="text-3xl font-bold text-[#005357]">{workOrderStats.inProgress}</div>
                <div className="text-sm text-gray-600">dalam proses</div>
              </div>
            </div>
          </div>

          <div className="bg-white shadow">
            <div className="p-6 border-b border-gray-200 bg-[#005357] text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-white">Completed Today</h3>
                  <p className="text-sm text-gray-100 mt-1">Selesai hari ini</p>
                </div>
                <div className="w-8 h-8 bg-white flex items-center justify-center">
                  <CheckCircle className="h-4 w-4 text-[#005357]" />
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

          <div className="bg-white shadow">
            <div className="p-6 border-b border-gray-200 bg-[#005357] text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-white">Overdue</h3>
                  <p className="text-sm text-gray-100 mt-1">Terlambat</p>
                </div>
                <div className="w-8 h-8 bg-white flex items-center justify-center">
                  <AlertTriangle className="h-4 w-4 text-[#005357]" />
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

        {/* Main Content */}
        <div className="bg-white shadow">
          <div className="p-6 border-b border-gray-200 bg-[#005357] text-white">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-white">Work Orders</h3>
                <p className="text-sm text-gray-100 mt-1">Kelola semua work order dan project</p>
              </div>
              <div className="flex items-center space-x-3">
                <button className="bg-white text-[#005357] px-4 py-2 text-sm font-medium hover:bg-gray-100 transition-colors flex items-center space-x-2">
                  <Plus className="h-4 w-4" />
                  <span>New Work Order</span>
                </button>
                <div className="w-8 h-8 bg-white flex items-center justify-center">
                  <ClipboardCheck className="h-4 w-4 text-[#005357]" />
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 bg-gray-50">
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
                    <Search className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Cari work order..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#005357] focus:border-[#005357] w-64"
                  />
                </div>
                <select 
                  value={selectedPriority}
                  onChange={(e) => setSelectedPriority(e.target.value)}
                  className="px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#005357]"
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
                  className="px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#005357]"
                >
                  <option value="all">Semua Departemen</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>{dept.name}</option>
                  ))}
                </select>
              </div>
              <button className="bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors flex items-center space-x-2">
                <Download className="h-4 w-4" />
                <span>Export</span>
              </button>
            </div>

            {/* Work Orders List */}
            <div className="space-y-6">
              {filteredOrders.map((order) => {
                const progress = calculateProgress(order.tasks);
                const deptInfo = getDepartmentInfo(order.department);
                const isOverdue = new Date(order.dueDate) < new Date() && order.status !== 'completed';

                return (
                  <div key={order.id} className="bg-white p-6 shadow-sm">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <span className="font-mono text-sm bg-gray-100 px-2 py-1 text-gray-800">
                            {order.id}
                          </span>
                          <span className={`inline-flex items-center px-2 py-1 text-xs font-medium ${deptInfo.color}`}>
                            <deptInfo.icon className="h-3 w-3 mr-1" />
                            {deptInfo.name}
                          </span>
                          <span className={`inline-flex px-2 py-1 text-xs font-medium ${getPriorityColor(order.priority)}`}>
                            {getPriorityLabel(order.priority)}
                          </span>
                          <span className={`inline-flex px-2 py-1 text-xs font-medium ${getStatusColor(order.status)}`}>
                            {getStatusLabel(order.status)}
                          </span>
                          {isOverdue && (
                            <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-red-100 text-red-800">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              Overdue
                            </span>
                          )}
                        </div>
                        
                        <h4 className="font-bold text-lg text-gray-900 mb-2">{order.title}</h4>
                        <p className="text-sm text-gray-600 mb-4">{order.description}</p>
                        
                        {/* Progress Bar */}
                        <div className="mb-4">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-sm text-gray-600">Progress</span>
                            <span className="text-sm font-medium text-gray-900">{progress}%</span>
                          </div>
                          <div className="w-full bg-gray-200 h-2">
                            <div 
                              className="bg-[#005357] h-2 transition-all duration-300" 
                              style={{ width: `${progress}%` }}
                            ></div>
                          </div>
                        </div>

                        {/* Key Info */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                          <div>
                            <span className="text-gray-600">Assigned to:</span>
                            <div className="font-medium text-gray-900">{order.assignedTo}</div>
                          </div>
                          <div>
                            <span className="text-gray-600">Supervisor:</span>
                            <div className="font-medium text-gray-900">{order.supervisedBy}</div>
                          </div>
                          <div>
                            <span className="text-gray-600">Location:</span>
                            <div className="font-medium text-gray-900">{order.location}</div>
                          </div>
                          <div>
                            <span className="text-gray-600">Due date:</span>
                            <div className={`font-medium ${isOverdue ? 'text-red-600' : 'text-gray-900'}`}>
                              {formatDate(order.dueDate)}
                            </div>
                          </div>
                        </div>

                        {/* Time & Cost */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                          <div>
                            <span className="text-gray-600">Estimated hours:</span>
                            <div className="font-medium text-gray-900">{order.estimatedHours}h</div>
                          </div>
                          <div>
                            <span className="text-gray-600">Actual hours:</span>
                            <div className="font-medium text-gray-900">{order.actualHours}h</div>
                          </div>
                          <div>
                            <span className="text-gray-600">Cost:</span>
                            <div className="font-medium text-gray-900">{formatCurrency(order.cost)}</div>
                          </div>
                          <div>
                            <span className="text-gray-600">Photos:</span>
                            <div className="font-medium text-gray-900">{order.photos} attached</div>
                          </div>
                        </div>

                        {/* Tasks */}
                        <div className="mb-4">
                          <h5 className="font-medium text-gray-900 mb-2">Tasks ({order.tasks.filter(t => t.status === 'completed').length}/{order.tasks.length} completed)</h5>
                          <div className="space-y-2">
                            {order.tasks.map((task) => (
                              <div key={task.id} className="flex items-center space-x-3 text-sm">
                                <CheckCircle className={`h-4 w-4 ${getTaskStatusColor(task.status)}`} />
                                <span className={`flex-1 ${task.status === 'completed' ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                                  {task.task}
                                </span>
                                <span className="text-gray-500 text-xs">{task.assignedTo}</span>
                                <span className={`px-2 py-1 text-xs ${getTaskStatusColor(task.status)} bg-gray-100`}>
                                  {task.status}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Materials */}
                        <div className="mb-4">
                          <h5 className="font-medium text-gray-900 mb-2">Materials Required</h5>
                          <div className="flex flex-wrap gap-2">
                            {order.materials.map((material, index) => (
                              <span key={index} className="bg-gray-100 text-gray-700 px-2 py-1 text-xs">
                                {material}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Notes */}
                        {order.notes && (
                          <div className="bg-gray-50 p-3 mb-4">
                            <p className="text-sm text-gray-600">
                              <span className="font-medium">Notes:</span> {order.notes}
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center space-x-2 ml-4">
                        <button className="p-2 text-gray-400 hover:text-[#005357] hover:bg-gray-100 transition-colors rounded">
                          <Eye className="h-4 w-4" />
                        </button>
                        <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors rounded">
                          <Edit className="h-4 w-4" />
                        </button>
                        <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors rounded">
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Department Performance */}
        <div className="bg-white shadow">
          <div className="p-6 border-b border-gray-200 bg-[#005357] text-white">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-white">Department Performance</h3>
                <p className="text-sm text-gray-100 mt-1">Performa work order per departemen</p>
              </div>
              <div className="w-8 h-8 bg-white flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-[#005357]" />
              </div>
            </div>
          </div>
          
          <div className="p-6 bg-gray-50">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {departments.map((dept) => {
                const deptOrders = workOrders.filter(order => order.department === dept.id);
                const completedOrders = deptOrders.filter(order => order.status === 'completed');
                const avgCompletion = deptOrders.length > 0 ? 
                  (completedOrders.reduce((sum, order) => sum + order.actualHours, 0) / completedOrders.length).toFixed(1) : '0';

                return (
                  <div key={dept.id} className="bg-white p-4 shadow-sm">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="w-12 h-12 bg-[#005357] flex items-center justify-center">
                        <dept.icon className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">{dept.name}</h4>
                        <p className="text-sm text-gray-600">{deptOrders.length} total orders</p>
                      </div>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Completed:</span>
                        <span className="text-gray-900 font-medium">{completedOrders.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">In Progress:</span>
                        <span className="text-gray-900 font-medium">
                          {deptOrders.filter(order => order.status === 'in_progress').length}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Avg. Completion:</span>
                        <span className="text-gray-900 font-medium">{avgCompletion}h</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Success Rate:</span>
                        <span className="text-green-600 font-medium">
                          {deptOrders.length > 0 ? Math.round((completedOrders.length / deptOrders.length) * 100) : 0}%
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </SupportLayout>
  );
}