'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import AppLayout from '@/components/AppLayout';
import { 
  ArrowLeft,
  Package,
  Clock,
  User,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Edit,
  Plus,
  Bed,
  Bath,
  Coffee,
  Trash2,
  SprayCan,
  Building,
  UserCheck,
  Star,
  MapPin,
  Users,
  ClipboardCheck,
  Wrench,
  Phone,
  MessageSquare,
  Flag,
  Award,
  Play,
  Pause,
  RotateCcw,
  Save,
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
  Zap
} from 'lucide-react';

interface HousekeepingTask {
  id: number;
  task_name: string;
  description: string;
  estimated_time: number;
  actual_time?: number;
  priority: 'low' | 'medium' | 'high';
  category: 'cleaning' | 'maintenance' | 'inspection' | 'restocking';
  status: 'pending' | 'in_progress' | 'completed' | 'skipped';
  started_at?: string;
  completed_at?: string;
  notes?: string;
  assigned_staff?: string;
}

interface MaintenanceIssue {
  id: number;
  type: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'reported' | 'assigned' | 'in_progress' | 'resolved';
  reported_by: string;
  reported_at: string;
  assigned_to?: string;
  estimated_fix_time?: number;
  notes?: string;
}

interface LostFoundItem {
  id: number;
  item_name: string;
  description: string;
  location_found: string;
  condition: 'excellent' | 'good' | 'fair' | 'damaged';
  category: 'electronics' | 'clothing' | 'jewelry' | 'documents' | 'personal' | 'other';
  found_by: string;
  found_date: string;
  status: 'found' | 'claimed' | 'disposed' | 'donated';
  guest_contacted: boolean;
  contact_attempts: number;
  photos?: string[];
  notes?: string;
}

interface RoomInspection {
  id: number;
  inspector_name: string;
  inspection_date: string;
  overall_rating: number;
  passed: boolean;
  categories: {
    cleanliness: number;
    maintenance: number;
    amenities: number;
    presentation: number;
  };
  issues_found: string[];
  recommendations: string[];
  notes: string;
  photos: string[];
}

interface RoomTask {
  id: number;
  room_number: string;
  room_type: string;
  floor: number;
  status: 'dirty' | 'cleaning' | 'inspecting' | 'clean' | 'out_of_order' | 'maintenance';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assigned_staff: string;
  staff_id: number;
  staff_phone?: string;
  guest_checkout?: string;
  next_guest_checkin?: string;
  estimated_completion: string;
  actual_start_time?: string;
  completion_time?: string;
  tasks: HousekeepingTask[];
  notes: string;
  guest_requests?: string[];
  amenities_needed: string[];
  inspection?: RoomInspection;
  maintenance_issues: MaintenanceIssue[];
  duration_minutes: number;
  photos_before?: string[];
  photos_after?: string[];
  room_amenities: string[];
  special_instructions: string;
  cleaning_supplies_used: string[];
  lost_found_items: LostFoundItem[];
}

// Comprehensive Housekeeping Checklist
const HOUSEKEEPING_CHECKLIST = [
  {
    category: 'Bedroom Cleaning',
    icon: 'Bed',
    items: [
      'Strip and remove all bed linens',
      'Check mattress for stains or damage',
      'Make bed with fresh linens and pillows',
      'Dust all surfaces (nightstands, dresser, desk)',
      'Clean mirrors and glass surfaces',
      'Vacuum carpet or mop hard floors',
      'Empty trash and replace liner',
      'Check and clean light fixtures',
      'Arrange furniture properly',
      'Check closet and hangers'
    ]
  },
  {
    category: 'Bathroom Cleaning',
    icon: 'Bath',
    items: [
      'Clean and disinfect toilet (inside and outside)',
      'Clean shower/bathtub and remove soap scum',
      'Clean sink and faucet',
      'Clean and polish mirrors',
      'Mop bathroom floor',
      'Replace all towels',
      'Restock toilet paper',
      'Restock toiletries (shampoo, soap, etc.)',
      'Clean exhaust fan if needed',
      'Check and clean drain for hair/debris'
    ]
  },
  {
    category: 'Kitchen/Minibar',
    icon: 'Coffee',
    items: [
      'Clean microwave inside and outside',
      'Clean refrigerator/minibar',
      'Restock minibar items',
      'Clean coffee machine',
      'Restock coffee supplies',
      'Clean sink and countertops',
      'Check and restock glasses/cups',
      'Clean cabinet fronts',
      'Empty trash and replace liner',
      'Check appliance functionality'
    ]
  },
  {
    category: 'General Cleaning',
    icon: 'SprayCan',
    items: [
      'Dust all furniture and surfaces',
      'Clean windows and sills',
      'Vacuum all carpets thoroughly',
      'Mop all hard floor surfaces',
      'Clean baseboards',
      'Wipe down doors and door frames',
      'Clean TV screen and remote control',
      'Check and clean air vents',
      'Polish wood furniture if needed',
      'Check for any damages or wear'
    ]
  },
  {
    category: 'Final Inspection',
    icon: 'CheckCircle',
    items: [
      'Check all lights are working',
      'Test air conditioning/heating',
      'Verify all amenities are in place',
      'Check safe is working',
      'Ensure room temperature is comfortable',
      'Verify Wi-Fi connectivity',
      'Check TV channels and remote',
      'Inspect overall room presentation',
      'Take photos if required',
      'Complete final quality check'
    ]
  },
  {
    category: 'Maintenance Check',
    icon: 'Wrench',
    items: [
      'Check all electrical outlets',
      'Test all light switches',
      'Check faucets for leaks',
      'Test shower water pressure',
      'Check door locks and keys',
      'Inspect furniture for damage',
      'Check curtains and blinds',
      'Test telephone if available',
      'Check for any unusual odors',
      'Report any maintenance issues'
    ]
  }
];

// Mock data for the room detail
const MOCK_ROOM_TASK: RoomTask = {
  id: 1,
  room_number: '1205',
  room_type: 'Deluxe King Suite',
  floor: 12,
  status: 'cleaning',
  priority: 'high',
  assigned_staff: 'Sari Wulandari',
  staff_id: 1,
  staff_phone: '+62-812-3456-1234',
  guest_checkout: '2024-08-25T11:00:00Z',
  next_guest_checkin: '2024-08-25T15:00:00Z',
  estimated_completion: '2024-08-25T14:00:00Z',
  actual_start_time: '2024-08-25T12:00:00Z',
  tasks: [
    {
      id: 1,
      task_name: 'Strip and Make Bed',
      description: 'Remove old linens, inspect mattress, make bed with fresh sheets and pillowcases',
      estimated_time: 15,
      actual_time: 12,
      priority: 'high',
      category: 'cleaning',
      status: 'completed',
      started_at: '2024-08-25T12:00:00Z',
      completed_at: '2024-08-25T12:12:00Z',
      notes: 'Mattress in good condition, used premium linens as requested',
      assigned_staff: 'Sari Wulandari'
    },
    {
      id: 2,
      task_name: 'Deep Bathroom Cleaning',
      description: 'Clean and sanitize all surfaces, replace towels, check amenities',
      estimated_time: 25,
      actual_time: 18,
      priority: 'high',
      category: 'cleaning',
      status: 'completed',
      started_at: '2024-08-25T12:12:00Z',
      completed_at: '2024-08-25T12:30:00Z',
      notes: 'Replaced all towels, restocked premium toiletries',
      assigned_staff: 'Sari Wulandari'
    },
    {
      id: 3,
      task_name: 'Vacuum and Mop',
      description: 'Vacuum all carpeted areas, mop hard floors, clean under furniture',
      estimated_time: 20,
      priority: 'medium',
      category: 'cleaning',
      status: 'in_progress',
      started_at: '2024-08-25T12:30:00Z',
      assigned_staff: 'Sari Wulandari'
    },
    {
      id: 4,
      task_name: 'Amenities Check & Restock',
      description: 'Check mini bar, coffee supplies, toiletries, and restock as needed',
      estimated_time: 10,
      priority: 'medium',
      category: 'restocking',
      status: 'pending',
      assigned_staff: 'Sari Wulandari'
    },
    {
      id: 5,
      task_name: 'Final Quality Inspection',
      description: 'Complete room inspection before marking as ready',
      estimated_time: 5,
      priority: 'high',
      category: 'inspection',
      status: 'pending',
      assigned_staff: 'Lisa Wong'
    }
  ],
  notes: 'VIP guest arriving. Ensure all premium amenities are stocked. Guest complained about AC noise in previous stay - check AC operation.',
  guest_requests: ['Extra pillows', 'Late checkout', 'Hypoallergenic bedding', 'Welcome fruit basket'],
  amenities_needed: ['Premium toiletries', 'Welcome amenities', 'Fresh flowers'],
  maintenance_issues: [
    {
      id: 1,
      type: 'HVAC',
      description: 'Air conditioning unit making unusual noise, guest complaint from previous stay',
      severity: 'medium',
      status: 'assigned',
      reported_by: 'Sari Wulandari',
      reported_at: '2024-08-25T12:45:00Z',
      assigned_to: 'Ahmad Technical',
      estimated_fix_time: 30,
      notes: 'Unit operational but noisy. Schedule maintenance after cleaning completion.'
    }
  ],
  duration_minutes: 90,
  photos_before: [
    '/housekeeping/room-1205/before-1.jpg',
    '/housekeeping/room-1205/before-2.jpg'
  ],
  room_amenities: ['King Bed', 'City View', 'Mini Bar', 'Coffee Machine', 'Balcony', 'Work Desk', 'Safe', 'Premium WiFi'],
  special_instructions: 'This is a VIP guest room. Ensure premium service standards. Guest has nut allergies - verify no nut products in welcome basket.',
  cleaning_supplies_used: ['All-purpose cleaner', 'Glass cleaner', 'Bathroom sanitizer', 'Premium linens', 'Luxury toiletries'],
  lost_found_items: [
    {
      id: 1,
      item_name: 'iPhone 14 Pro',
      description: 'Black iPhone 14 Pro with blue case, found under bed',
      location_found: 'Under bed (left side)',
      condition: 'excellent',
      category: 'electronics',
      found_by: 'Sari Wulandari',
      found_date: '2024-08-25T12:15:00Z',
      status: 'found',
      guest_contacted: false,
      contact_attempts: 0,
      notes: 'Phone is still charged. Found during bed stripping.'
    },
    {
      id: 2,
      item_name: 'Gold Watch',
      description: 'Gold-plated wrist watch with leather strap',
      location_found: 'Bathroom counter',
      condition: 'good',
      category: 'jewelry',
      found_by: 'Sari Wulandari',
      found_date: '2024-08-25T12:25:00Z',
      status: 'found',
      guest_contacted: true,
      contact_attempts: 1,
      notes: 'Guest contacted via phone. Will pick up at front desk.'
    }
  ]
};

const HousekeepingDetailPage = () => {
  const params = useParams();
  const [roomTask, setRoomTask] = useState<RoomTask | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTimer, setActiveTimer] = useState<number | null>(null);
  const [timeElapsed, setTimeElapsed] = useState<{ [key: number]: number }>({});
  const [newNote, setNewNote] = useState('');
  const [newIssue, setNewIssue] = useState('');
  const [checkedItems, setCheckedItems] = useState<{ [key: string]: boolean }>({});
  const [newLostItem, setNewLostItem] = useState({
    item_name: '',
    description: '',
    location_found: '',
    condition: 'good' as const,
    category: 'personal' as const
  });

  useEffect(() => {
    // Simulate API call
    const loadRoomTask = async () => {
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 1000));
      setRoomTask(MOCK_ROOM_TASK);
      setLoading(false);
    };

    loadRoomTask();
  }, [params.id]);

  // Timer functionality
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (activeTimer) {
      interval = setInterval(() => {
        setTimeElapsed(prev => ({
          ...prev,
          [activeTimer]: (prev[activeTimer] || 0) + 1
        }));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [activeTimer]);

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'dirty': return 'bg-red-100 text-red-800';
      case 'cleaning': return 'bg-yellow-100 text-yellow-800';
      case 'inspecting': return 'bg-blue-100 text-blue-800';
      case 'clean': return 'bg-green-100 text-green-800';
      case 'out_of_order': return 'bg-gray-100 text-gray-800';
      case 'maintenance': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'urgent': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTaskStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-gray-100 text-gray-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'skipped': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTaskIcon = (category: string) => {
    switch (category) {
      case 'cleaning': return <SprayCan className="h-4 w-4" />;
      case 'maintenance': return <Wrench className="h-4 w-4" />;
      case 'inspection': return <Eye className="h-4 w-4" />;
      case 'restocking': return <Package className="h-4 w-4" />;
      default: return <ClipboardCheck className="h-4 w-4" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const startTask = (taskId: number) => {
    if (!roomTask) return;
    
    setActiveTimer(taskId);
    setRoomTask({
      ...roomTask,
      tasks: roomTask.tasks.map(task =>
        task.id === taskId
          ? { ...task, status: 'in_progress', started_at: new Date().toISOString() }
          : task
      )
    });
  };

  const completeTask = (taskId: number) => {
    if (!roomTask) return;
    
    const actualTime = Math.floor((timeElapsed[taskId] || 0) / 60) || 1;
    
    setActiveTimer(null);
    setRoomTask({
      ...roomTask,
      tasks: roomTask.tasks.map(task =>
        task.id === taskId
          ? { 
              ...task, 
              status: 'completed', 
              completed_at: new Date().toISOString(),
              actual_time: actualTime
            }
          : task
      )
    });
  };

  const pauseTask = (taskId: number) => {
    setActiveTimer(null);
  };

  const updateRoomStatus = (newStatus: string) => {
    if (!roomTask) return;
    
    setRoomTask({
      ...roomTask,
      status: newStatus as any,
      completion_time: newStatus === 'clean' ? new Date().toISOString() : undefined
    });
  };

  const addNote = () => {
    if (!newNote.trim() || !roomTask) return;
    
    setRoomTask({
      ...roomTask,
      notes: roomTask.notes + '\n\n' + `[${new Date().toLocaleString()}] ${newNote}`
    });
    setNewNote('');
  };

  const reportIssue = () => {
    if (!newIssue.trim() || !roomTask) return;
    
    const issue: MaintenanceIssue = {
      id: Date.now(),
      type: 'General',
      description: newIssue,
      severity: 'medium',
      status: 'reported',
      reported_by: roomTask.assigned_staff,
      reported_at: new Date().toISOString(),
      notes: `Reported during room cleaning`
    };
    
    setRoomTask({
      ...roomTask,
      maintenance_issues: [...roomTask.maintenance_issues, issue]
    });
    setNewIssue('');
  };

  const toggleChecklistItem = (categoryIndex: number, itemIndex: number) => {
    const key = `${categoryIndex}-${itemIndex}`;
    setCheckedItems(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const getChecklistProgress = () => {
    const totalItems = HOUSEKEEPING_CHECKLIST.reduce((total, category) => total + category.items.length, 0);
    const checkedItemsCount = Object.values(checkedItems).filter(Boolean).length;
    return {
      completed: checkedItemsCount,
      total: totalItems,
      percentage: Math.round((checkedItemsCount / totalItems) * 100)
    };
  };

  const getIconComponent = (iconName: string) => {
    switch (iconName) {
      case 'Bed': return <Bed className="h-4 w-4 text-white" />;
      case 'Bath': return <Bath className="h-4 w-4 text-white" />;
      case 'Coffee': return <Coffee className="h-4 w-4 text-white" />;
      case 'SprayCan': return <SprayCan className="h-4 w-4 text-white" />;
      case 'CheckCircle': return <CheckCircle className="h-4 w-4 text-white" />;
      case 'Wrench': return <Wrench className="h-4 w-4 text-white" />;
      default: return <ClipboardCheck className="h-4 w-4 text-white" />;
    }
  };

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case 'excellent': return 'bg-green-100 text-green-800';
      case 'good': return 'bg-blue-100 text-blue-800';
      case 'fair': return 'bg-yellow-100 text-yellow-800';
      case 'damaged': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getLostItemStatusColor = (status: string) => {
    switch (status) {
      case 'found': return 'bg-orange-100 text-orange-800';
      case 'claimed': return 'bg-green-100 text-green-800';
      case 'disposed': return 'bg-gray-100 text-gray-800';
      case 'donated': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'electronics': return <Zap className="h-4 w-4" />;
      case 'clothing': return <Package className="h-4 w-4" />;
      case 'jewelry': return <Star className="h-4 w-4" />;
      case 'documents': return <FileText className="h-4 w-4" />;
      case 'personal': return <User className="h-4 w-4" />;
      default: return <Package className="h-4 w-4" />;
    }
  };

  const addLostFoundItem = () => {
    if (!newLostItem.item_name.trim() || !roomTask) return;
    
    const item: LostFoundItem = {
      id: Date.now(),
      ...newLostItem,
      found_by: roomTask.assigned_staff,
      found_date: new Date().toISOString(),
      status: 'found',
      guest_contacted: false,
      contact_attempts: 0,
      notes: `Found during room cleaning`
    };
    
    setRoomTask({
      ...roomTask,
      lost_found_items: [...roomTask.lost_found_items, item]
    });
    
    setNewLostItem({
      item_name: '',
      description: '',
      location_found: '',
      condition: 'good',
      category: 'personal'
    });
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="p-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="space-y-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-32 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!roomTask) {
    return (
      <AppLayout>
        <div className="p-6">
          <div className="text-center">
            <AlertTriangle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Room Not Found</h2>
            <p className="text-gray-600 mb-6">The room task you're looking for doesn't exist.</p>
            <Link 
              href="/housekeeping"
              className="inline-flex items-center space-x-2 bg-[#005357] text-white px-4 py-2 hover:bg-[#004147] transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Housekeeping</span>
            </Link>
          </div>
        </div>
      </AppLayout>
    );
  }

  const progress = getChecklistProgress();
  const { completed: completedTasks, total: totalTasks, percentage: progressPercentage } = progress;

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="space-y-4">
          <Link 
            href="/housekeeping"
            className="inline-flex items-center space-x-2 text-gray-600 hover:text-[#005357] transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm font-medium">Back to Housekeeping</span>
          </Link>
          
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-3">
                <h1 className="text-3xl font-bold text-gray-900">Room {roomTask.room_number}</h1>
                <span className={`inline-flex px-3 py-1 text-sm font-medium rounded ${getStatusColor(roomTask.status)}`}>
                  {roomTask.status.replace('_', ' ')}
                </span>
                <span className={`inline-flex px-3 py-1 text-sm font-medium rounded ${getPriorityColor(roomTask.priority)}`}>
                  {roomTask.priority}
                </span>
              </div>
              <div className="flex items-center space-x-6 mt-2 text-gray-600">
                <span>{roomTask.room_type} • Floor {roomTask.floor}</span>
                <span>Progress: {progressPercentage}% ({completedTasks}/{totalTasks})</span>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button 
                onClick={() => updateRoomStatus('clean')}
                disabled={progressPercentage < 100}
                className="flex items-center space-x-2 bg-[#005357] text-white px-4 py-2 text-sm font-medium hover:bg-[#004147] transition-colors disabled:opacity-50"
              >
                <CheckCircle className="h-4 w-4" />
                <span>Mark Complete</span>
              </button>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="bg-white shadow">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Overall Progress</h3>
                <p className="text-sm text-gray-600 mt-1">{completedTasks} of {totalTasks} items completed</p>
              </div>
              <div className="w-8 h-8 bg-[#005357] flex items-center justify-center">
                <Target className="h-4 w-4 text-white" />
              </div>
            </div>
          </div>
          <div className="p-4 bg-gray-50">
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-[#005357] h-3 rounded-full transition-all duration-300"
                style={{width: `${progressPercentage}%`}}
              ></div>
            </div>
          </div>
        </div>

        {/* Category Headers */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="text-center">
            <h2 className="text-lg font-bold text-gray-800 bg-gray-100 py-2 px-4">Room Info</h2>
          </div>
          <div className="lg:col-span-2 text-center">
            <h2 className="text-lg font-bold text-gray-800 bg-gray-100 py-2 px-4">Room Task</h2>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Room & Guest Info */}
          <div className="space-y-6 sticky top-6 self-start">
            {/* Room Information */}
            <div className="bg-white shadow">
              <div className="p-6 bg-[#005357]">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-white">Room Details</h3>
                    <p className="text-sm text-green-100 mt-1">Location and specifications</p>
                  </div>
                  <div className="w-8 h-8 bg-[#2baf6a] flex items-center justify-center">
                    <Building className="h-4 w-4 text-white" />
                  </div>
                </div>
              </div>
              <div className="p-4 bg-gray-50">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Room Type</label>
                    <p className="text-gray-900 font-medium">{roomTask.room_type}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Floor</label>
                      <p className="text-gray-900 font-medium">Floor {roomTask.floor}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Est. Duration</label>
                      <p className="text-gray-900 font-medium">{roomTask.duration_minutes} min</p>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-600 mb-2 block">Room Amenities</label>
                    <div className="flex flex-wrap gap-2">
                      {roomTask.room_amenities.map((amenity, index) => (
                        <span key={index} className="inline-block bg-blue-100 text-blue-800 px-2 py-1 text-xs rounded">
                          {amenity}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Guest Schedule */}
            <div className="bg-white shadow">
              <div className="p-6 bg-[#005357]">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-white">Guest Schedule</h3>
                    <p className="text-sm text-green-100 mt-1">Checkout and checkin times</p>
                  </div>
                  <div className="w-8 h-8 bg-[#2baf6a] flex items-center justify-center">
                    <Calendar className="h-4 w-4 text-white" />
                  </div>
                </div>
              </div>
              <div className="p-4 bg-gray-50">
                <div className="space-y-4">
                  {roomTask.guest_checkout && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Last Checkout</label>
                      <p className="text-gray-900 font-medium">{formatDateTime(roomTask.guest_checkout)}</p>
                    </div>
                  )}
                  {roomTask.next_guest_checkin && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Next Checkin</label>
                      <p className="text-gray-900 font-medium">{formatDateTime(roomTask.next_guest_checkin)}</p>
                    </div>
                  )}
                  <div>
                    <label className="text-sm font-medium text-gray-600">Target Completion</label>
                    <p className="text-gray-900 font-medium">{formatDateTime(roomTask.estimated_completion)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Staff Assignment */}
            <div className="bg-white shadow">
              <div className="p-6 bg-[#005357]">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-white">Assigned Staff</h3>
                    <p className="text-sm text-green-100 mt-1">Room responsibility</p>
                  </div>
                  <div className="w-8 h-8 bg-[#2baf6a] flex items-center justify-center">
                    <UserCheck className="h-4 w-4 text-white" />
                  </div>
                </div>
              </div>
              <div className="p-4 bg-gray-50">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                    <User className="h-6 w-6 text-gray-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">{roomTask.assigned_staff}</h4>
                    <p className="text-sm text-gray-600">Housekeeper</p>
                  </div>
                </div>
                
                {roomTask.staff_phone && (
                  <button className="w-full flex items-center justify-center space-x-2 bg-blue-600 text-white px-4 py-2 text-sm font-medium hover:bg-blue-700 transition-colors">
                    <Phone className="h-4 w-4" />
                    <span>Contact Staff</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Middle Column - Tasks & Progress */}
          <div className="space-y-6">
            {/* Housekeeping Checklist */}
            <div className="bg-white shadow">
              <div className="p-6 bg-[#005357]">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-white">Housekeeping Checklist</h3>
                    <p className="text-sm text-green-100 mt-1">{totalTasks} items • {completedTasks} completed ({progressPercentage}%)</p>
                  </div>
                  <div className="w-8 h-8 bg-[#2baf6a] flex items-center justify-center">
                    <ClipboardCheck className="h-4 w-4 text-white" />
                  </div>
                </div>
              </div>
              <div className="p-4 bg-gray-50">
                <div className="space-y-6">
                  {HOUSEKEEPING_CHECKLIST.map((category, categoryIndex) => (
                    <div key={categoryIndex} className="bg-white shadow">
                      <div className="p-4">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h4 className="text-lg font-bold text-gray-900">{category.category}</h4>
                            <p className="text-sm text-gray-600">
                              {category.items.filter((_, itemIndex) => checkedItems[`${categoryIndex}-${itemIndex}`]).length} of {category.items.length} completed
                            </p>
                          </div>
                          <div className="w-8 h-8 bg-[#005357] flex items-center justify-center">
                            {getIconComponent(category.icon)}
                          </div>
                        </div>
                        
                        <div className="space-y-3">
                          {category.items.map((item, itemIndex) => {
                            const key = `${categoryIndex}-${itemIndex}`;
                            const isChecked = checkedItems[key] || false;
                            
                            return (
                              <label key={itemIndex} className="flex items-center space-x-3 cursor-pointer group">
                                <div className="flex-shrink-0">
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => toggleChecklistItem(categoryIndex, itemIndex)}
                                    className="w-4 h-4 text-[#005357] border-gray-300 rounded focus:ring-[#005357] focus:ring-2"
                                  />
                                </div>
                                <span className={`text-sm transition-colors ${
                                  isChecked 
                                    ? 'text-gray-500 line-through' 
                                    : 'text-gray-900 group-hover:text-[#005357]'
                                }`}>
                                  {item}
                                </span>
                                {isChecked && (
                                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                                )}
                              </label>
                            );
                          })}
                        </div>

                        {/* Category Progress Bar */}
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs text-gray-600">Category Progress</span>
                            <span className="text-xs text-gray-600">
                              {Math.round((category.items.filter((_, itemIndex) => checkedItems[`${categoryIndex}-${itemIndex}`]).length / category.items.length) * 100)}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-[#005357] h-2 rounded-full transition-all duration-300"
                              style={{
                                width: `${(category.items.filter((_, itemIndex) => checkedItems[`${categoryIndex}-${itemIndex}`]).length / category.items.length) * 100}%`
                              }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Special Instructions */}
            {roomTask.special_instructions && (
              <div className="bg-white shadow">
                <div className="p-6 bg-[#005357]">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-white">Special Instructions</h3>
                      <p className="text-sm text-green-100 mt-1">Important room-specific requirements</p>
                    </div>
                    <div className="w-8 h-8 bg-[#2baf6a] flex items-center justify-center">
                      <Lightbulb className="h-4 w-4 text-white" />
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-yellow-50 border-l-4 border-yellow-400">
                  <p className="text-gray-800">{roomTask.special_instructions}</p>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Issues & Notes */}
          <div className="space-y-6">
            {/* Guest Requests */}
            {roomTask.guest_requests && roomTask.guest_requests.length > 0 && (
              <div className="bg-white shadow">
                <div className="p-6 bg-[#005357]">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-white">Guest Requests</h3>
                      <p className="text-sm text-green-100 mt-1">{roomTask.guest_requests.length} special requests</p>
                    </div>
                    <div className="w-8 h-8 bg-[#2baf6a] flex items-center justify-center">
                      <Star className="h-4 w-4 text-white" />
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-gray-50">
                  <div className="space-y-2">
                    {roomTask.guest_requests.map((request, index) => (
                      <div key={index} className="flex items-center space-x-2 p-2 bg-blue-50 border border-blue-200 rounded">
                        <Star className="h-4 w-4 text-blue-600" />
                        <span className="text-blue-800 text-sm font-medium">{request}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Maintenance Issues */}
            <div className="bg-white shadow">
              <div className="p-6 bg-[#005357]">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-white">Maintenance Issues</h3>
                    <p className="text-sm text-green-100 mt-1">{roomTask.maintenance_issues.length} reported issues</p>
                  </div>
                  <div className="w-8 h-8 bg-[#2baf6a] flex items-center justify-center">
                    <Wrench className="h-4 w-4 text-white" />
                  </div>
                </div>
              </div>
              <div className="p-4 bg-gray-50">
                {roomTask.maintenance_issues.length > 0 ? (
                  <div className="space-y-3">
                    {roomTask.maintenance_issues.map((issue) => (
                      <div key={issue.id} className="bg-white p-3 bg-gray-100 rounded">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-bold text-gray-900 text-sm">{issue.type}</h4>
                          <div className="flex items-center space-x-2">
                            <span className={`px-2 py-1 text-xs font-medium rounded ${getSeverityColor(issue.severity)}`}>
                              {issue.severity}
                            </span>
                          </div>
                        </div>
                        <p className="text-gray-700 text-sm mb-2">{issue.description}</p>
                        <div className="text-xs text-gray-600">
                          <p>Reported by: {issue.reported_by}</p>
                          <p>Date: {formatDateTime(issue.reported_at)}</p>
                          {issue.assigned_to && <p>Assigned to: {issue.assigned_to}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">No maintenance issues reported</p>
                )}

                {/* Report New Issue */}
                <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded">
                  <h4 className="font-medium text-orange-900 mb-2">Report Issue</h4>
                  <textarea
                    value={newIssue}
                    onChange={(e) => setNewIssue(e.target.value)}
                    placeholder="Describe any maintenance issues found..."
                    className="w-full px-3 py-2 border border-gray-300 focus:ring-[#005357] focus:border-[#005357] text-sm"
                    rows={3}
                  />
                  <button
                    onClick={reportIssue}
                    disabled={!newIssue.trim()}
                    className="mt-2 w-full bg-orange-600 text-white px-3 py-2 text-sm font-medium hover:bg-orange-700 transition-colors disabled:opacity-50"
                  >
                    Report Issue
                  </button>
                </div>
              </div>
            </div>

            {/* Room Notes */}
            <div className="bg-white shadow">
              <div className="p-6 bg-[#005357]">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-white">Room Notes</h3>
                    <p className="text-sm text-green-100 mt-1">Staff observations and updates</p>
                  </div>
                  <div className="w-8 h-8 bg-[#2baf6a] flex items-center justify-center">
                    <FileText className="h-4 w-4 text-white" />
                  </div>
                </div>
              </div>
              <div className="p-4 bg-gray-50">
                <div className="space-y-4">
                  <div className="bg-white p-3 bg-gray-100 rounded">
                    <p className="text-gray-800 text-sm whitespace-pre-wrap">{roomTask.notes}</p>
                  </div>

                  {/* Add New Note */}
                  <div>
                    <textarea
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      placeholder="Add notes about room condition, special observations, etc..."
                      className="w-full px-3 py-2 border border-gray-300 focus:ring-[#005357] focus:border-[#005357] text-sm"
                      rows={3}
                    />
                    <button
                      onClick={addNote}
                      disabled={!newNote.trim()}
                      className="mt-2 w-full bg-[#005357] text-white px-3 py-2 text-sm font-medium hover:bg-[#004147] transition-colors disabled:opacity-50"
                    >
                      Add Note
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Guest Lost & Found */}
            <div className="bg-white shadow">
              <div className="p-6 bg-[#005357]">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-white">Guest Lost & Found</h3>
                    <p className="text-sm text-green-100 mt-1">{roomTask.lost_found_items.length} items found</p>
                  </div>
                  <div className="w-8 h-8 bg-[#2baf6a] flex items-center justify-center">
                    <Package className="h-4 w-4 text-white" />
                  </div>
                </div>
              </div>
              <div className="p-4 bg-gray-50">
                {roomTask.lost_found_items.length > 0 ? (
                  <div className="space-y-3">
                    {roomTask.lost_found_items.map((item) => (
                      <div key={item.id} className="bg-white p-3 shadow">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <div className="w-6 h-6 bg-gray-100 flex items-center justify-center">
                              {getCategoryIcon(item.category)}
                            </div>
                            <h4 className="font-bold text-gray-900 text-sm">{item.item_name}</h4>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className={`px-2 py-1 text-xs font-medium ${getConditionColor(item.condition)}`}>
                              {item.condition}
                            </span>
                            <span className={`px-2 py-1 text-xs font-medium ${getLostItemStatusColor(item.status)}`}>
                              {item.status}
                            </span>
                          </div>
                        </div>
                        
                        <p className="text-gray-700 text-sm mb-2">{item.description}</p>
                        
                        <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 mb-2">
                          <div>
                            <span className="font-medium">Location:</span> {item.location_found}
                          </div>
                          <div>
                            <span className="font-medium">Found by:</span> {item.found_by}
                          </div>
                          <div>
                            <span className="font-medium">Date:</span> {formatDateTime(item.found_date)}
                          </div>
                          <div>
                            <span className="font-medium">Contact attempts:</span> {item.contact_attempts}
                          </div>
                        </div>

                        {item.guest_contacted && (
                          <div className="flex items-center space-x-1 text-green-600 text-xs">
                            <CheckCircle className="h-3 w-3" />
                            <span>Guest contacted</span>
                          </div>
                        )}

                        {item.notes && (
                          <div className="mt-2 p-2 bg-gray-50 text-xs text-gray-700">
                            <strong>Notes:</strong> {item.notes}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">No lost or found items</p>
                )}

                {/* Add New Lost Item */}
                <div className="mt-4 p-3 bg-blue-50 shadow">
                  <h4 className="font-medium text-blue-900 mb-3">Report Found Item</h4>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Item name"
                        value={newLostItem.item_name}
                        onChange={(e) => setNewLostItem({...newLostItem, item_name: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 focus:ring-[#005357] focus:border-[#005357] text-sm"
                      />
                      <select
                        value={newLostItem.category}
                        onChange={(e) => setNewLostItem({...newLostItem, category: e.target.value as any})}
                        className="w-full px-3 py-2 border border-gray-300 focus:ring-[#005357] focus:border-[#005357] text-sm"
                      >
                        <option value="personal">Personal</option>
                        <option value="electronics">Electronics</option>
                        <option value="clothing">Clothing</option>
                        <option value="jewelry">Jewelry</option>
                        <option value="documents">Documents</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    
                    <textarea
                      placeholder="Description of the item..."
                      value={newLostItem.description}
                      onChange={(e) => setNewLostItem({...newLostItem, description: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 focus:ring-[#005357] focus:border-[#005357] text-sm"
                      rows={2}
                    />
                    
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Where found"
                        value={newLostItem.location_found}
                        onChange={(e) => setNewLostItem({...newLostItem, location_found: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 focus:ring-[#005357] focus:border-[#005357] text-sm"
                      />
                      <select
                        value={newLostItem.condition}
                        onChange={(e) => setNewLostItem({...newLostItem, condition: e.target.value as any})}
                        className="w-full px-3 py-2 border border-gray-300 focus:ring-[#005357] focus:border-[#005357] text-sm"
                      >
                        <option value="excellent">Excellent</option>
                        <option value="good">Good</option>
                        <option value="fair">Fair</option>
                        <option value="damaged">Damaged</option>
                      </select>
                    </div>
                    
                    <button
                      onClick={addLostFoundItem}
                      disabled={!newLostItem.item_name.trim() || !newLostItem.description.trim()}
                      className="w-full bg-blue-600 text-white px-3 py-2 text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                      Add Found Item
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Photos */}
            {(roomTask.photos_before && roomTask.photos_before.length > 0) && (
              <div className="bg-white shadow">
                <div className="p-6 bg-[#005357]">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-white">Room Photos</h3>
                      <p className="text-sm text-green-100 mt-1">Before and after documentation</p>
                    </div>
                    <div className="w-8 h-8 bg-[#2baf6a] flex items-center justify-center">
                      <Camera className="h-4 w-4 text-white" />
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-gray-50">
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Before Photos</h4>
                      <div className="grid grid-cols-2 gap-2">
                        {roomTask.photos_before.map((photo, index) => (
                          <div key={index} className="aspect-video bg-gray-200 rounded overflow-hidden">
                            <img
                              src={photo}
                              alt={`Before ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <button className="w-full bg-blue-600 text-white px-3 py-2 text-sm font-medium hover:bg-blue-700 transition-colors">
                      <Camera className="h-4 w-4 inline mr-2" />
                      Take After Photos
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default HousekeepingDetailPage;