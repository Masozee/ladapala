'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import AppLayout, { HeaderActions } from '@/components/AppLayout';
import { 
  ArrowLeft,
  Wrench,
  Clock,
  User,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Plus,
  Building,
  Phone,
  MessageSquare,
  Flag,
  Calendar,
  Timer,
  Target,
  Eye,
  FileText,
  Camera,
  CheckSquare,
  Square,
  AlertCircle,
  Lightbulb,
  Zap,
  Thermometer,
  Wifi,
  Droplets,
  Shield,
  Settings,
  Gauge,
  HardHat,
  ClipboardCheck,
  Save,
  Play,
  Pause,
  RotateCcw,
  Users,
  DollarSign,
  Package,
  Star,
  MapPin,
  TrendingUp,
  BarChart3
} from 'lucide-react';

interface MaintenanceRequest {
  id: number;
  ticket_number: string;
  title: string;
  description: string;
  category: 'hvac' | 'plumbing' | 'electrical' | 'general' | 'elevator' | 'security' | 'it_network' | 'furniture' | 'appliances';
  priority: 'low' | 'medium' | 'high' | 'urgent' | 'emergency';
  status: 'open' | 'assigned' | 'in_progress' | 'on_hold' | 'completed' | 'cancelled';
  location: string;
  room_number?: string;
  floor?: number;
  building_section?: string;
  reported_by: string;
  reporter_role: string;
  reporter_contact: string;
  created_at: string;
  updated_at: string;
  assigned_to?: string;
  technician_id?: number;
  estimated_completion?: string;
  actual_completion?: string;
  estimated_cost?: number;
  actual_cost?: number;
  parts_needed: string[];
  parts_cost?: number;
  labor_hours?: number;
  labor_cost?: number;
  guest_impact: boolean;
  downtime_start?: string;
  downtime_end?: string;
  safety_issue: boolean;
  warranty_covered: boolean;
  vendor_required: boolean;
  vendor_name?: string;
  notes: string;
  photos: string[];
  completion_notes?: string;
  guest_satisfaction?: number;
  preventive_maintenance: boolean;
  next_service_date?: string;
  work_log: WorkLogEntry[];
  parts_used: PartUsage[];
  cost_breakdown: CostBreakdown;
}

interface WorkLogEntry {
  id: number;
  timestamp: string;
  technician: string;
  action: string;
  description: string;
  time_spent?: number;
  status_change?: string;
  photos?: string[];
}

interface PartUsage {
  id: number;
  part_name: string;
  quantity_used: number;
  unit_cost: number;
  supplier: string;
  installation_date: string;
  warranty_period?: string;
  notes?: string;
}

interface CostBreakdown {
  labor_cost: number;
  parts_cost: number;
  equipment_rental: number;
  vendor_fees: number;
  additional_charges: number;
  total_cost: number;
}

interface Technician {
  id: number;
  name: string;
  specialization: string[];
  skill_level: 'junior' | 'senior' | 'expert';
  phone: string;
  email: string;
  efficiency_rating: number;
}

// Mock data for demonstration
const MOCK_MAINTENANCE_REQUEST: MaintenanceRequest = {
  id: 1,
  ticket_number: 'MNT-2024-001',
  title: 'Air conditioning unit making loud noise',
  description: 'AC unit in room 1205 making unusual grinding noise and not cooling effectively. Guest complaints received. Unit appears to be operational but inefficient. The noise is particularly loud during night hours affecting guest comfort.',
  category: 'hvac',
  priority: 'high',
  status: 'in_progress',
  location: 'Room 1205',
  room_number: '1205',
  floor: 12,
  building_section: 'Main Tower',
  reported_by: 'Sari Wulandari',
  reporter_role: 'Housekeeper',
  reporter_contact: '+62-812-3456-1234',
  created_at: '2024-08-25T08:30:00Z',
  updated_at: '2024-08-25T09:15:00Z',
  assigned_to: 'Ahmad Technical',
  technician_id: 1,
  estimated_completion: '2024-08-25T14:00:00Z',
  estimated_cost: 750000,
  actual_cost: 650000,
  parts_needed: ['AC Filter', 'Lubricant', 'Belt replacement', 'Refrigerant'],
  parts_cost: 350000,
  labor_hours: 4,
  labor_cost: 300000,
  guest_impact: true,
  safety_issue: false,
  warranty_covered: true,
  vendor_required: false,
  notes: 'Guest has been relocated temporarily. Priority due to VIP guest arrival tonight. Room must be ready by 6 PM.',
  photos: ['/maintenance/ac-unit-1205-1.jpg', '/maintenance/ac-unit-1205-2.jpg', '/maintenance/ac-unit-1205-3.jpg'],
  completion_notes: '',
  preventive_maintenance: false,
  work_log: [
    {
      id: 1,
      timestamp: '2024-08-25T08:30:00Z',
      technician: 'System',
      action: 'Created',
      description: 'Maintenance request created by housekeeper',
      status_change: 'open'
    },
    {
      id: 2,
      timestamp: '2024-08-25T09:15:00Z',
      technician: 'Maintenance Supervisor',
      action: 'Assigned',
      description: 'Assigned to Ahmad Technical - HVAC specialist',
      status_change: 'assigned'
    },
    {
      id: 3,
      timestamp: '2024-08-25T10:30:00Z',
      technician: 'Ahmad Technical',
      action: 'Started Work',
      description: 'Arrived on site, initial inspection completed. Identified worn belt and clogged filter.',
      time_spent: 30,
      status_change: 'in_progress',
      photos: ['/maintenance/inspection-1205-1.jpg']
    },
    {
      id: 4,
      timestamp: '2024-08-25T11:45:00Z',
      technician: 'Ahmad Technical',
      action: 'Progress Update',
      description: 'Replaced AC filter and cleaned evaporator coils. Ordering new belt.',
      time_spent: 75
    }
  ],
  parts_used: [
    {
      id: 1,
      part_name: 'HVAC Air Filter (24x24x1)',
      quantity_used: 1,
      unit_cost: 85000,
      supplier: 'Jakarta HVAC Supply',
      installation_date: '2024-08-25T11:00:00Z',
      warranty_period: '3 months',
      notes: 'Heavy dust accumulation, recommend monthly replacement'
    },
    {
      id: 2,
      part_name: 'Evaporator Coil Cleaner',
      quantity_used: 2,
      unit_cost: 45000,
      supplier: 'Jakarta HVAC Supply',
      installation_date: '2024-08-25T11:30:00Z',
      notes: 'Used for deep cleaning'
    }
  ],
  cost_breakdown: {
    labor_cost: 300000,
    parts_cost: 175000,
    equipment_rental: 0,
    vendor_fees: 0,
    additional_charges: 0,
    total_cost: 475000
  }
};

const MOCK_TECHNICIAN: Technician = {
  id: 1,
  name: 'Ahmad Technical',
  specialization: ['HVAC', 'General Maintenance'],
  skill_level: 'senior',
  phone: '+62-812-1111-2222',
  email: 'ahmad.tech@hotel.com',
  efficiency_rating: 4.7
};

const MaintenanceDetailPage = () => {
  const params = useParams();
  const requestId = params.id as string;
  const [request, setRequest] = useState<MaintenanceRequest | null>(null);
  const [technician, setTechnician] = useState<Technician | null>(null);
  const [activeTab, setActiveTab] = useState<'details' | 'work-log' | 'parts' | 'costs'>('details');
  const [newLogEntry, setNewLogEntry] = useState('');
  const [workTimer, setWorkTimer] = useState<{ started: boolean; elapsed: number }>({ started: false, elapsed: 0 });

  useEffect(() => {
    // In real application, fetch data based on requestId
    setRequest(MOCK_MAINTENANCE_REQUEST);
    setTechnician(MOCK_TECHNICIAN);
  }, [requestId]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (workTimer.started) {
      interval = setInterval(() => {
        setWorkTimer(prev => ({ ...prev, elapsed: prev.elapsed + 1 }));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [workTimer.started]);

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR'
    }).format(amount);
  };

  const formatTimer = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-blue-100 text-blue-800';
      case 'assigned': return 'bg-yellow-100 text-yellow-800';
      case 'in_progress': return 'bg-orange-100 text-orange-800';
      case 'on_hold': return 'bg-purple-100 text-purple-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'emergency': return 'bg-red-200 text-red-900';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'hvac': return <Thermometer className="h-4 w-4" />;
      case 'plumbing': return <Droplets className="h-4 w-4" />;
      case 'electrical': return <Zap className="h-4 w-4" />;
      case 'elevator': return <Building className="h-4 w-4" />;
      case 'security': return <Shield className="h-4 w-4" />;
      case 'it_network': return <Wifi className="h-4 w-4" />;
      case 'general': return <Wrench className="h-4 w-4" />;
      case 'furniture': return <Settings className="h-4 w-4" />;
      case 'appliances': return <Gauge className="h-4 w-4" />;
      default: return <Wrench className="h-4 w-4" />;
    }
  };

  const getCategoryName = (category: string) => {
    switch (category) {
      case 'hvac': return 'HVAC';
      case 'plumbing': return 'Plumbing';
      case 'electrical': return 'Electrical';
      case 'elevator': return 'Elevator';
      case 'security': return 'Security';
      case 'it_network': return 'IT/Network';
      case 'general': return 'General';
      case 'furniture': return 'Furniture';
      case 'appliances': return 'Appliances';
      default: return 'Other';
    }
  };


  const handleAddLogEntry = () => {
    if (newLogEntry.trim() && request && technician) {
      const newEntry: WorkLogEntry = {
        id: request.work_log.length + 1,
        timestamp: new Date().toISOString(),
        technician: technician.name,
        action: 'Progress Update',
        description: newLogEntry,
        time_spent: workTimer.elapsed / 60
      };
      
      setRequest({
        ...request,
        work_log: [...request.work_log, newEntry]
      });
      setNewLogEntry('');
      setWorkTimer({ started: false, elapsed: 0 });
    }
  };

  const toggleWorkTimer = () => {
    setWorkTimer(prev => ({ ...prev, started: !prev.started }));
  };

  const resetWorkTimer = () => {
    setWorkTimer({ started: false, elapsed: 0 });
  };

  if (!request) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Wrench className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900">Loading request details...</h3>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link 
              href="/maintenance"
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="text-sm font-medium">Back to Maintenance</span>
            </Link>
          </div>
          <HeaderActions />
        </div>

        {/* Request Overview */}
        <div className="bg-white shadow">
          <div className="p-6 bg-[#005357] text-white">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-white">MNT-2024-001</h3>
                <div className="text-sm text-gray-100 mt-1">
                  assigned • high • Air conditioning unit making loud noise • HVAC • Room 1205 • Sari Wulandari • 8772h overdue
                </div>
              </div>
            </div>
          </div>
          
          <div className="p-4 bg-gray-50">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {/* Status & Priority */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Status & Priority</h3>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">Status:</span>
                    <span className={`px-2 py-1 text-xs font-medium rounded ${getStatusColor(request.status)}`}>
                      {request.status.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">Priority:</span>
                    <span className={`px-2 py-1 text-xs font-medium rounded ${getPriorityColor(request.priority)}`}>
                      {request.priority}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">Category:</span>
                    <div className="flex items-center space-x-1">
                      <div className="text-[#005357]">{getCategoryIcon(request.category)}</div>
                      <span className="text-sm text-gray-900">{getCategoryName(request.category)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Location & Impact */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Location & Impact</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-3 w-3 text-gray-400" />
                    <span className="text-gray-600">Location:</span>
                    <span className="text-gray-900">{request.location}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Building className="h-3 w-3 text-gray-400" />
                    <span className="text-gray-600">Section:</span>
                    <span className="text-gray-900">{request.building_section}</span>
                  </div>
                  {request.guest_impact && (
                    <div className="flex items-center space-x-2 p-2 bg-orange-50 border border-orange-200 rounded">
                      <AlertTriangle className="h-3 w-3 text-orange-600" />
                      <span className="text-orange-800 text-xs font-medium">Guest Impact</span>
                    </div>
                  )}
                  {request.safety_issue && (
                    <div className="flex items-center space-x-2 p-2 bg-red-50 border border-red-200 rounded">
                      <Shield className="h-3 w-3 text-red-600" />
                      <span className="text-red-800 text-xs font-medium">Safety Issue</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Timeline */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Timeline</h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-gray-600">Created:</span>
                    <div className="text-gray-900">{formatDateTime(request.created_at)}</div>
                  </div>
                  {request.estimated_completion && (
                    <div>
                      <span className="text-gray-600">Est. Completion:</span>
                      <div className="text-gray-900">{formatDateTime(request.estimated_completion)}</div>
                    </div>
                  )}
                  {request.actual_completion && (
                    <div>
                      <span className="text-gray-600">Completed:</span>
                      <div className="text-green-600">{formatDateTime(request.actual_completion)}</div>
                    </div>
                  )}
                  <div className="flex items-center space-x-2">
                    <Clock className="h-3 w-3 text-gray-400" />
                    <span className="text-gray-600">Est. Time:</span>
                    <span className="text-gray-900">{request.labor_hours || 'TBD'}h</span>
                  </div>
                </div>
              </div>

              {/* Cost Summary */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Cost Summary</h3>
                <div className="space-y-2">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-[#005357]">
                      {request.cost_breakdown ? formatCurrency(request.cost_breakdown.total_cost) : formatCurrency(request.estimated_cost || 0)}
                    </div>
                    <div className="text-xs text-gray-600">{request.actual_cost ? 'Actual Cost' : 'Estimated Cost'}</div>
                  </div>
                  {request.warranty_covered && (
                    <div className="text-center p-2 bg-green-50 border border-green-200 rounded">
                      <CheckCircle className="h-4 w-4 text-green-600 mx-auto mb-1" />
                      <span className="text-green-800 text-xs font-medium">Warranty Covered</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex items-center justify-end space-x-2 mt-4 pt-4 border-t border-white/20">
              <button className="bg-white/10 text-white px-4 py-2 text-sm font-medium rounded hover:bg-white/20 transition-colors">
                View Details
              </button>
              <button className="bg-white text-[#005357] px-4 py-2 text-sm font-medium rounded hover:bg-gray-100 transition-colors">
                Update
              </button>
            </div>
          </div>
        </div>

        {/* Assigned Technician & Work Timer */}
        {technician && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Technician Info */}
            <div className="bg-white shadow">
              <div className="p-6 bg-[#005357] text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-white">Assigned Technician</h3>
                    <p className="text-sm text-gray-100 mt-1">Current technician working on this request</p>
                  </div>
                  <div className="w-8 h-8 bg-white flex items-center justify-center">
                    <HardHat className="h-4 w-4 text-[#005357]" />
                  </div>
                </div>
              </div>
              <div className="p-4 bg-gray-50">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">{technician.name}</h4>
                    <p className="text-sm text-gray-600">{technician.skill_level} level</p>
                    <div className="flex items-center space-x-1 mt-1">
                      <Star className="h-3 w-3 text-yellow-400" />
                      <span className="text-xs text-gray-600">{technician.efficiency_rating} rating</span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2 mb-4">
                  <div className="flex items-center space-x-2">
                    <Phone className="h-3 w-3 text-gray-400" />
                    <span className="text-sm text-gray-900">{technician.phone}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <MessageSquare className="h-3 w-3 text-gray-400" />
                    <span className="text-sm text-gray-900">{technician.email}</span>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-1">
                  {technician.specialization.map((spec, index) => (
                    <span key={index} className="inline-block bg-blue-100 text-blue-800 px-2 py-1 text-xs rounded">
                      {spec}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Work Timer */}
            <div className="bg-white shadow">
              <div className="p-6 bg-[#005357] text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-white">Work Timer</h3>
                    <p className="text-sm text-gray-100 mt-1">Track active work time on this request</p>
                  </div>
                  <div className="w-8 h-8 bg-white flex items-center justify-center">
                    <Timer className="h-4 w-4 text-[#005357]" />
                  </div>
                </div>
              </div>
              <div className="p-4 bg-gray-50">
                <div className="text-center mb-4">
                  <div className="text-3xl font-mono font-bold text-[#005357] mb-2">
                    {formatTimer(workTimer.elapsed)}
                  </div>
                  <p className="text-sm text-gray-600">Active work time</p>
                </div>
                
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={toggleWorkTimer}
                    className={`flex items-center justify-center space-x-1 px-3 py-2 text-sm font-medium rounded transition-colors ${
                      workTimer.started 
                        ? 'bg-red-600 text-white hover:bg-red-700' 
                        : 'bg-green-600 text-white hover:bg-green-700'
                    }`}
                  >
                    {workTimer.started ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                    <span>{workTimer.started ? 'Pause' : 'Start'}</span>
                  </button>
                  <button
                    onClick={resetWorkTimer}
                    className="flex items-center justify-center space-x-1 bg-gray-600 text-white px-3 py-2 text-sm font-medium rounded hover:bg-gray-700 transition-colors"
                  >
                    <RotateCcw className="h-3 w-3" />
                    <span>Reset</span>
                  </button>
                  <button
                    className="flex items-center justify-center space-x-1 bg-blue-600 text-white px-3 py-2 text-sm font-medium rounded hover:bg-blue-700 transition-colors"
                  >
                    <Save className="h-3 w-3" />
                    <span>Log</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'details', name: 'Details', icon: FileText },
              { id: 'work-log', name: 'Work Log', icon: ClipboardCheck },
              { id: 'parts', name: 'Parts & Materials', icon: Package },
              { id: 'costs', name: 'Cost Breakdown', icon: BarChart3 }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as 'details' | 'work-log' | 'parts' | 'costs')}
                className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-[#005357] text-[#005357]'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                <span>{tab.name}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {activeTab === 'details' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Problem Description */}
              <div className="bg-white shadow">
                <div className="p-6 bg-[#005357] text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-white">Problem Description</h3>
                      <p className="text-sm text-gray-100 mt-1">Detailed description of the reported issue</p>
                    </div>
                    <div className="w-8 h-8 bg-white flex items-center justify-center">
                      <FileText className="h-4 w-4 text-[#005357]" />
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-gray-50">
                  <p className="text-gray-700 mb-4">{request.description}</p>
                  
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm font-medium text-gray-900">Reported by:</span>
                      <div className="text-sm text-gray-700">{request.reported_by} ({request.reporter_role})</div>
                      <div className="text-sm text-gray-600">{request.reporter_contact}</div>
                    </div>
                    
                    <div>
                      <span className="text-sm font-medium text-gray-900">Additional Notes:</span>
                      <p className="text-sm text-gray-700">{request.notes}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Parts Needed */}
              <div className="bg-white shadow">
                <div className="p-6 bg-[#005357] text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-white">Required Parts</h3>
                      <p className="text-sm text-gray-100 mt-1">Materials needed for repair</p>
                    </div>
                    <div className="w-8 h-8 bg-white flex items-center justify-center">
                      <Package className="h-4 w-4 text-[#005357]" />
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-gray-50">
                  <div className="space-y-2">
                    {request.parts_needed.map((part, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded">
                        <div className="flex items-center space-x-2">
                          <Package className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-900">{part}</span>
                        </div>
                        <span className="text-xs text-gray-600">Required</span>
                      </div>
                    ))}
                  </div>
                  
                  {request.parts_cost && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-gray-900">Estimated Parts Cost:</span>
                        <span className="font-bold text-[#005357]">{formatCurrency(request.parts_cost)}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Request Photos */}
              {request.photos.length > 0 && (
                <div className="lg:col-span-2 bg-white shadow">
                  <div className="p-6 bg-[#005357] text-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-xl font-bold text-white">Photos</h3>
                        <p className="text-sm text-gray-100 mt-1">Documentation of the issue</p>
                      </div>
                      <div className="w-8 h-8 bg-white flex items-center justify-center">
                        <Camera className="h-4 w-4 text-[#005357]" />
                      </div>
                    </div>
                  </div>
                  <div className="p-4 bg-gray-50">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {request.photos.map((photo, index) => (
                        <div key={index} className="bg-gray-100 aspect-video rounded border-2 border-dashed border-gray-300 flex items-center justify-center">
                          <div className="text-center">
                            <Camera className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                            <p className="text-sm text-gray-600">Photo {index + 1}</p>
                            <p className="text-xs text-gray-500">{photo}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'work-log' && (
            <div className="space-y-6">
              {/* Add New Log Entry */}
              <div className="bg-white shadow">
                <div className="p-6 bg-[#005357] text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-white">Add Work Log Entry</h3>
                      <p className="text-sm text-gray-100 mt-1">Record progress and updates</p>
                    </div>
                    <div className="w-8 h-8 bg-white flex items-center justify-center">
                      <Plus className="h-4 w-4 text-[#005357]" />
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-gray-50">
                  <div className="space-y-4">
                    <textarea
                      value={newLogEntry}
                      onChange={(e) => setNewLogEntry(e.target.value)}
                      placeholder="Describe the work performed, progress made, or issues encountered..."
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-[#005357] focus:border-[#005357] text-sm"
                    />
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-600">
                        Timer: {formatTimer(workTimer.elapsed)}
                      </div>
                      <button
                        onClick={handleAddLogEntry}
                        disabled={!newLogEntry.trim()}
                        className="bg-[#005357] text-white px-4 py-2 text-sm font-medium rounded hover:bg-[#004147] transition-colors disabled:bg-gray-300"
                      >
                        Add Entry
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Work Log Timeline */}
              <div className="bg-white shadow">
                <div className="p-6 bg-[#005357] text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-white">Work Log Timeline</h3>
                      <p className="text-sm text-gray-100 mt-1">Complete history of work performed</p>
                    </div>
                    <div className="w-8 h-8 bg-white flex items-center justify-center">
                      <ClipboardCheck className="h-4 w-4 text-[#005357]" />
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-gray-50">
                  <div className="space-y-4">
                    {request.work_log.map((entry) => (
                      <div key={entry.id} className="flex space-x-4">
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <ClipboardCheck className="h-4 w-4 text-blue-600" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="bg-white p-4 border border-gray-200 rounded">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <h4 className="font-medium text-gray-900">{entry.action}</h4>
                                <p className="text-sm text-gray-600">by {entry.technician}</p>
                              </div>
                              <div className="text-right">
                                <div className="text-sm text-gray-600">{formatDateTime(entry.timestamp)}</div>
                                {entry.time_spent && (
                                  <div className="text-xs text-gray-500">{Math.round(entry.time_spent)} min</div>
                                )}
                                {entry.status_change && (
                                  <span className={`inline-block px-2 py-1 text-xs font-medium rounded mt-1 ${getStatusColor(entry.status_change)}`}>
                                    {entry.status_change.replace('_', ' ')}
                                  </span>
                                )}
                              </div>
                            </div>
                            <p className="text-sm text-gray-700">{entry.description}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'parts' && (
            <div className="space-y-6">
              {/* Parts Used */}
              <div className="bg-white shadow">
                <div className="p-6 bg-[#005357] text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-white">Parts Used</h3>
                      <p className="text-sm text-gray-100 mt-1">Materials consumed during repair</p>
                    </div>
                    <div className="w-8 h-8 bg-white flex items-center justify-center">
                      <Package className="h-4 w-4 text-[#005357]" />
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-gray-50">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Part</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Qty</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Cost</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Supplier</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Installed</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {request.parts_used.map((part) => (
                          <tr key={part.id} className="bg-white">
                            <td className="px-4 py-4">
                              <div>
                                <div className="font-medium text-gray-900">{part.part_name}</div>
                                {part.warranty_period && (
                                  <div className="text-xs text-gray-600">Warranty: {part.warranty_period}</div>
                                )}
                                {part.notes && (
                                  <div className="text-xs text-gray-500 mt-1">{part.notes}</div>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-4 text-sm text-gray-900">{part.quantity_used}</td>
                            <td className="px-4 py-4 text-sm text-gray-900">{formatCurrency(part.unit_cost)}</td>
                            <td className="px-4 py-4 text-sm text-gray-900">{part.supplier}</td>
                            <td className="px-4 py-4 text-sm text-gray-900">{formatDateTime(part.installation_date)}</td>
                            <td className="px-4 py-4 text-sm font-medium text-gray-900">
                              {formatCurrency(part.unit_cost * part.quantity_used)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Parts Inventory Check */}
              <div className="bg-white shadow">
                <div className="p-6 bg-[#005357] text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-white">Inventory Status</h3>
                      <p className="text-sm text-gray-100 mt-1">Current stock levels for required parts</p>
                    </div>
                    <div className="w-8 h-8 bg-white flex items-center justify-center">
                      <Target className="h-4 w-4 text-[#005357]" />
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-gray-50">
                  <div className="space-y-3">
                    {request.parts_needed.map((part, index) => {
                      const isUsed = request.parts_used.find(used => used.part_name.includes(part.split(' ')[0]));
                      return (
                        <div key={index} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded">
                          <div className="flex items-center space-x-3">
                            <div className={`w-3 h-3 rounded-full ${isUsed ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                            <span className="text-sm text-gray-900">{part}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className={`text-xs px-2 py-1 rounded ${isUsed ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                              {isUsed ? 'Used' : 'Pending'}
                            </span>
                            <span className="text-xs text-gray-600">Stock: 15</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'costs' && request.cost_breakdown && (
            <div className="space-y-6">
              {/* Cost Breakdown */}
              <div className="bg-white shadow">
                <div className="p-6 bg-[#005357] text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-white">Cost Breakdown</h3>
                      <p className="text-sm text-gray-100 mt-1">Detailed cost analysis for this repair</p>
                    </div>
                    <div className="w-8 h-8 bg-white flex items-center justify-center">
                      <BarChart3 className="h-4 w-4 text-[#005357]" />
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-gray-50">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded">
                        <div className="flex items-center space-x-2">
                          <HardHat className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-900">Labor Cost</span>
                        </div>
                        <span className="font-medium text-gray-900">{formatCurrency(request.cost_breakdown.labor_cost)}</span>
                      </div>
                      
                      <div className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded">
                        <div className="flex items-center space-x-2">
                          <Package className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-900">Parts Cost</span>
                        </div>
                        <span className="font-medium text-gray-900">{formatCurrency(request.cost_breakdown.parts_cost)}</span>
                      </div>
                      
                      <div className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded">
                        <div className="flex items-center space-x-2">
                          <Wrench className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-900">Equipment Rental</span>
                        </div>
                        <span className="font-medium text-gray-900">{formatCurrency(request.cost_breakdown.equipment_rental)}</span>
                      </div>
                      
                      <div className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded">
                        <div className="flex items-center space-x-2">
                          <Users className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-900">Vendor Fees</span>
                        </div>
                        <span className="font-medium text-gray-900">{formatCurrency(request.cost_breakdown.vendor_fees)}</span>
                      </div>
                      
                      <div className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded">
                        <div className="flex items-center space-x-2">
                          <DollarSign className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-900">Additional Charges</span>
                        </div>
                        <span className="font-medium text-gray-900">{formatCurrency(request.cost_breakdown.additional_charges)}</span>
                      </div>
                    </div>
                    
                    <div className="bg-white border border-gray-200 rounded p-6">
                      <h4 className="font-bold text-gray-900 mb-4">Cost Summary</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Subtotal:</span>
                          <span className="text-gray-900">{formatCurrency(request.cost_breakdown.total_cost - (request.cost_breakdown.total_cost * 0.1))}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Tax (10%):</span>
                          <span className="text-gray-900">{formatCurrency(request.cost_breakdown.total_cost * 0.1)}</span>
                        </div>
                        <div className="border-t pt-3">
                          <div className="flex justify-between">
                            <span className="font-bold text-lg text-gray-900">Total:</span>
                            <span className="font-bold text-lg text-[#005357]">{formatCurrency(request.cost_breakdown.total_cost)}</span>
                          </div>
                        </div>
                        
                        {request.warranty_covered && (
                          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded">
                            <div className="flex items-center space-x-2">
                              <CheckCircle className="h-4 w-4 text-green-600" />
                              <span className="text-green-800 text-sm font-medium">Covered under warranty</span>
                            </div>
                            <p className="text-green-700 text-xs mt-1">Customer charge: {formatCurrency(0)}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Cost Comparison */}
              <div className="bg-white shadow">
                <div className="p-6 bg-[#005357] text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-white">Budget vs Actual</h3>
                      <p className="text-sm text-gray-100 mt-1">Comparison of estimated and actual costs</p>
                    </div>
                    <div className="w-8 h-8 bg-white flex items-center justify-center">
                      <TrendingUp className="h-4 w-4 text-[#005357]" />
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-gray-50">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {formatCurrency(request.estimated_cost || 0)}
                      </div>
                      <div className="text-sm text-gray-600">Original Estimate</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-[#005357]">
                        {formatCurrency(request.cost_breakdown.total_cost)}
                      </div>
                      <div className="text-sm text-gray-600">Actual Cost</div>
                    </div>
                    <div className="text-center">
                      <div className={`text-2xl font-bold ${(request.cost_breakdown.total_cost - (request.estimated_cost || 0)) < 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(request.cost_breakdown.total_cost - (request.estimated_cost || 0))}
                      </div>
                      <div className="text-sm text-gray-600">Variance</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

      </div>
    </AppLayout>
  );
};

export default MaintenanceDetailPage;