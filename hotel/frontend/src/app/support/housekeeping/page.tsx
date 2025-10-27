'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import SupportLayout from '@/components/SupportLayout';
import {
  PackageIcon,
  Search02Icon,
  FilterIcon,
  Delete02Icon,
  Alert01Icon,
  Clock01Icon,
  UserIcon,
  UserCheckIcon,
  CancelCircleIcon,
  AlertCircleIcon,
  EyeIcon,
  PencilEdit02Icon,
  Add01Icon,
  ViewIcon,
  ListViewIcon,
  BedIcon,
  Building03Icon,
  SparklesIcon,
  UserMultipleIcon,
  Wrench01Icon,
  Call02Icon,
  Settings02Icon
} from '@/lib/icons';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8001/api';

interface AmenityUsage {
  id: number;
  inventory_item: number;
  inventory_item_name: string;
  inventory_item_category: string;
  quantity_used: number;
  unit_price: string;
  total_cost: number;
  notes: string;
  recorded_by_name: string;
  recorded_at: string;
  stock_deducted: boolean;
}

interface HousekeepingTask {
  id: number;
  task_number: string;
  room: number;
  room_number: string;
  room_type: string;
  floor: number;
  task_type: string;
  task_type_display: string;
  status: 'DIRTY' | 'CLEANING' | 'INSPECTING' | 'CLEAN' | 'OUT_OF_ORDER' | 'MAINTENANCE';
  status_display: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  priority_display: string;
  assigned_to: number | null;
  assigned_to_name: string | null;
  inspector: number | null;
  inspector_name: string | null;
  scheduled_date: string;
  estimated_duration_minutes: number;
  actual_start_time: string | null;
  completion_time: string | null;
  estimated_completion: string | null;
  guest_checkout: string | null;
  next_guest_checkin: string | null;
  notes: string;
  guest_requests: string[];
  maintenance_issues: string[];
  inspection_passed: boolean | null;
  inspection_notes: string;
  inspection_time: string | null;
  duration_minutes: number;
  time_until_deadline: number | null;
  is_overdue: boolean;
  amenity_usages: AmenityUsage[];
  created_at: string;
  updated_at: string;
}

const HousekeepingPage = () => {
  const [tasks, setTasks] = useState<HousekeepingTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'card' | 'table'>('table');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterFloor, setFilterFloor] = useState<string>('all');

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/hotel/housekeeping-tasks/today_tasks/`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setTasks(data);
      }
    } catch (error) {
      console.error('Error fetching housekeeping tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DIRTY': return 'bg-red-100 text-red-800';
      case 'CLEANING': return 'bg-yellow-100 text-yellow-800';
      case 'INSPECTING': return 'bg-blue-100 text-blue-800';
      case 'CLEAN': return 'bg-green-100 text-green-800';
      case 'OUT_OF_ORDER': return 'bg-gray-100 text-gray-800';
      case 'MAINTENANCE': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'LOW': return 'bg-green-100 text-green-800';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800';
      case 'HIGH': return 'bg-orange-100 text-orange-800';
      case 'URGENT': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'DIRTY': return <Delete02Icon className="h-4 w-4" />;
      case 'CLEANING': return <PackageIcon className="h-4 w-4" />;
      case 'INSPECTING': return <EyeIcon className="h-4 w-4" />;
      case 'CLEAN': return <UserCheckIcon className="h-4 w-4" />;
      case 'OUT_OF_ORDER': return <CancelCircleIcon className="h-4 w-4" />;
      case 'MAINTENANCE': return <Wrench01Icon className="h-4 w-4" />;
      default: return <Alert01Icon className="h-4 w-4" />;
    }
  };

  const filteredTasks = tasks.filter(task => {
    if (searchTerm && !task.room_number.includes(searchTerm) &&
        !(task.assigned_to_name?.toLowerCase().includes(searchTerm.toLowerCase())) &&
        !task.room_type.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    if (filterStatus !== 'all' && task.status !== filterStatus) {
      return false;
    }
    if (filterPriority !== 'all' && task.priority !== filterPriority) {
      return false;
    }
    if (filterFloor !== 'all' && task.floor?.toString() !== filterFloor) {
      return false;
    }
    return true;
  });

  const getStatusStats = () => {
    return {
      dirty: tasks.filter(r => r.status === 'DIRTY').length,
      cleaning: tasks.filter(r => r.status === 'CLEANING').length,
      inspecting: tasks.filter(r => r.status === 'INSPECTING').length,
      clean: tasks.filter(r => r.status === 'CLEAN').length,
      out_of_order: tasks.filter(r => r.status === 'OUT_OF_ORDER').length,
      total: tasks.length
    };
  };

  const stats = getStatusStats();

  const getTimeUntilDeadline = (estimatedCompletion: string | null) => {
    if (!estimatedCompletion) {
      return { text: 'No deadline', color: 'text-gray-600' };
    }

    const now = new Date();
    const deadline = new Date(estimatedCompletion);
    const diffMs = deadline.getTime() - now.getTime();
    const diffHours = Math.round(diffMs / (1000 * 60 * 60));

    if (diffHours < 0) return { text: `${Math.abs(diffHours)}h overdue`, color: 'text-red-600' };
    if (diffHours <= 1) return { text: `${diffHours}h remaining`, color: 'text-orange-600' };
    if (diffHours <= 4) return { text: `${diffHours}h remaining`, color: 'text-yellow-600' };
    return { text: `${diffHours}h remaining`, color: 'text-green-600' };
  };

  if (loading) {
    return (
      <SupportLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-600">Loading housekeeping tasks...</div>
        </div>
      </SupportLayout>
    );
  }

  return (
    <SupportLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Housekeeping Dashboard</h1>
            <p className="text-gray-600 mt-2">Manage room cleaning, maintenance, and staff assignments</p>
          </div>
          <div className="flex items-center space-x-2">
            <button className="flex items-center space-x-2 bg-[#F87B1B] text-white px-4 py-2 text-sm font-medium hover:bg-[#E66A0A] transition-colors">
              <UserCheckIcon className="h-4 w-4" />
              <span>Daily Report</span>
            </button>
            <button className="flex items-center space-x-2 bg-[#F87B1B] text-white px-4 py-2 text-sm font-medium hover:bg-[#E66A0A] transition-colors">
              <Add01Icon className="h-4 w-4" />
              <span>New Task</span>
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          <div className="bg-white border border-gray-200">
            <div className="p-6 ">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{stats.dirty}</h3>
                  <p className="text-sm text-gray-600 mt-1">Needs Cleaning</p>
                </div>
                <div className="w-8 h-8 bg-red-500 flex items-center justify-center">
                  <Delete02Icon className="h-4 w-4 text-white" />
                </div>
              </div>
            </div>
            <div className="p-4 bg-gray-50"></div>
          </div>
          <div className="bg-white border border-gray-200">
            <div className="p-6 ">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{stats.cleaning}</h3>
                  <p className="text-sm text-gray-600 mt-1">In Progress</p>
                </div>
                <div className="w-8 h-8 bg-yellow-500 flex items-center justify-center">
                  <PackageIcon className="h-4 w-4 text-white" />
                </div>
              </div>
            </div>
            <div className="p-4 bg-gray-50"></div>
          </div>
          <div className="bg-white border border-gray-200">
            <div className="p-6 ">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{stats.inspecting}</h3>
                  <p className="text-sm text-gray-600 mt-1">Inspection</p>
                </div>
                <div className="w-8 h-8 bg-blue-500 flex items-center justify-center">
                  <EyeIcon className="h-4 w-4 text-white" />
                </div>
              </div>
            </div>
            <div className="p-4 bg-gray-50"></div>
          </div>
          <div className="bg-white border border-gray-200">
            <div className="p-6 ">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{stats.clean}</h3>
                  <p className="text-sm text-gray-600 mt-1">Ready</p>
                </div>
                <div className="w-8 h-8 bg-green-500 flex items-center justify-center">
                  <UserCheckIcon className="h-4 w-4 text-white" />
                </div>
              </div>
            </div>
            <div className="p-4 bg-gray-50"></div>
          </div>
          <div className="bg-white border border-gray-200">
            <div className="p-6 ">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{stats.out_of_order}</h3>
                  <p className="text-sm text-gray-600 mt-1">Out of Order</p>
                </div>
                <div className="w-8 h-8 bg-gray-500 flex items-center justify-center">
                  <CancelCircleIcon className="h-4 w-4 text-white" />
                </div>
              </div>
            </div>
            <div className="p-4 bg-gray-50"></div>
          </div>
          <div className="bg-white border border-gray-200">
            <div className="p-6 ">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{stats.total}</h3>
                  <p className="text-sm text-gray-600 mt-1">Total Rooms</p>
                </div>
                <div className="w-8 h-8 bg-[#F87B1B] flex items-center justify-center">
                  <Building03Icon className="h-4 w-4 text-white" />
                </div>
              </div>
            </div>
            <div className="p-4 bg-gray-50"></div>
          </div>
        </div>

        {/* Search & View Control */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              className="flex items-center space-x-2 px-4 py-2 bg-[#F87B1B] text-white text-sm font-medium hover:bg-[#E66A0A] transition-colors"
            >
              <Settings02Icon className="h-4 w-4" />
              <span>Advanced Filter</span>
            </button>

            {/* Search Form */}
            <div className="relative">
              <Search02Icon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search rooms, staff, or room type..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64 pl-10 pr-3 py-2 border border-gray-300 focus:ring-[#F87B1B] focus:border-[#F87B1B] text-sm"
              />
            </div>
          </div>

          {/* View Mode Switcher */}
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">View:</span>
            <div className="flex border border-gray-300 overflow-hidden">
              <button
                onClick={() => setViewMode('card')}
                className={`flex items-center space-x-2 px-4 py-2 text-sm transition-colors ${
                  viewMode === 'card'
                    ? 'bg-[#F87B1B] text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                <ViewIcon className="h-4 w-4" />
                <span>Cards</span>
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`flex items-center space-x-2 px-4 py-2 text-sm transition-colors ${
                  viewMode === 'table'
                    ? 'bg-[#F87B1B] text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                <ListViewIcon className="h-4 w-4" />
                <span>Table</span>
              </button>
            </div>
          </div>
        </div>

        {/* Results Summary */}
        <div className="text-sm text-gray-600">
          {filteredTasks.length} room{filteredTasks.length !== 1 ? 's' : ''} found
        </div>

        {/* Table View */}
        {viewMode === 'table' && (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse bg-white border border-gray-200">
              <thead className="bg-[#F87B1B]">
              <tr>
                <th className="border border-gray-300 px-6 py-4 text-left text-sm font-medium text-white">
                  Room
                </th>
                <th className="border border-gray-300 px-6 py-4 text-left text-sm font-medium text-white">
                  Status
                </th>
                <th className="border border-gray-300 px-6 py-4 text-left text-sm font-medium text-white">
                  Assigned Staff
                </th>
                <th className="border border-gray-300 px-6 py-4 text-left text-sm font-medium text-white">
                  Progress
                </th>
                <th className="border border-gray-300 px-6 py-4 text-left text-sm font-medium text-white">
                  Timeline
                </th>
                <th className="border border-gray-300 px-6 py-4 text-left text-sm font-medium text-white">
                  Amenities
                </th>
                <th className="border border-gray-300 px-6 py-4 text-left text-sm font-medium text-white">
                  Actions
                </th>
              </tr>
              </thead>
              <tbody className="bg-white divide-y-2 divide-gray-200">
                {filteredTasks.map((task) => {
                  const timeDeadline = getTimeUntilDeadline(task.estimated_completion);
                  const progressPercent = task.completion_time ? 100 : task.actual_start_time ? 60 : 0;

                  return (
                    <tr key={task.id} className="hover:bg-gray-50">
                      {/* Room Info */}
                      <td className="border border-gray-200 px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center">
                            <BedIcon className="h-5 w-5 text-gray-600" />
                          </div>
                          <div>
                            <div className="font-bold text-gray-900">Room {task.room_number}</div>
                            <div className="text-sm text-gray-600">{task.room_type}</div>
                            <div className="text-xs text-gray-500">Floor {task.floor}</div>
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="border border-gray-200 px-6 py-4">
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            {getStatusIcon(task.status)}
                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded ${getStatusColor(task.status)}`}>
                              {task.status_display}
                            </span>
                          </div>
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded ${getPriorityColor(task.priority)}`}>
                            {task.priority_display}
                          </span>
                        </div>
                      </td>

                      {/* Staff */}
                      <td className="border border-gray-200 px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <UserCheckIcon className="h-4 w-4 text-gray-500" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {task.assigned_to_name || 'Unassigned'}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Progress */}
                      <td className="border border-gray-200 px-6 py-4">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-600">Progress</span>
                            <span className="font-medium">{progressPercent}%</span>
                          </div>
                          <div className="w-24 bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${task.completion_time ? 'bg-green-500' : task.actual_start_time ? 'bg-yellow-500' : 'bg-gray-300'}`}
                              style={{width: `${progressPercent}%`}}
                            ></div>
                          </div>
                          <div className="text-xs text-gray-500">
                            {task.amenity_usages.length} amenities • {task.duration_minutes}min
                          </div>
                        </div>
                      </td>

                      {/* Timeline */}
                      <td className="border border-gray-200 px-6 py-4">
                        <div className="space-y-1 text-xs">
                          <div className={`font-medium ${timeDeadline.color}`}>
                            {timeDeadline.text}
                          </div>
                          {task.actual_start_time && (
                            <div className="text-gray-600">
                              Started: {formatDateTime(task.actual_start_time)}
                            </div>
                          )}
                          {task.next_guest_checkin && (
                            <div className="text-blue-600">
                              Next: {formatDateTime(task.next_guest_checkin)}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Amenities */}
                      <td className="border border-gray-200 px-6 py-4">
                        <div className="space-y-1">
                          {task.amenity_usages.length > 0 ? (
                            <div className="text-xs text-gray-600">
                              {task.amenity_usages.length} items restocked
                            </div>
                          ) : (
                            <span className="text-xs text-gray-500">No amenities yet</span>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="border border-gray-200 px-6 py-4">
                        <div className="flex space-x-2">
                          <Link
                            href={`/support/housekeeping/${task.id}`}
                            className="text-xs bg-gray-100 text-gray-700 px-3 py-2 hover:bg-gray-200 transition-colors rounded"
                          >
                            <EyeIcon className="h-3 w-3 inline mr-1" />
                            View
                          </Link>
                          <button className="text-xs bg-[#F87B1B] text-white px-3 py-2 hover:bg-[#E66A0A] transition-colors rounded">
                            <PencilEdit02Icon className="h-3 w-3 inline mr-1" />
                            Update
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* No Results */}
        {filteredTasks.length === 0 && (
          <div className="text-center py-12">
            <PackageIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks found</h3>
            <p className="text-gray-600">Try adjusting your search criteria or filters.</p>
          </div>
        )}
      </div>
    </SupportLayout>
  );
};

export default HousekeepingPage;
