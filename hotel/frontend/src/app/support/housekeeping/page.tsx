'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import SupportLayout from '@/components/SupportLayout';
import { buildApiUrl, getCsrfToken } from '@/lib/config';
import {
  BedIcon,
  Clock01Icon,
  UserIcon,
  AlertCircleIcon,
  UserCheckIcon,
  Settings02Icon,
  FilterIcon,
  Cancel01Icon,
  EyeIcon,
  Search02Icon,
  Add01Icon
} from '@/lib/icons';

interface HousekeepingTask {
  id: number;
  task_number: string;
  room: number;
  room_number: string;
  room_type: string;
  floor: number;
  task_type: string;
  task_type_display: string;
  status: string;
  status_display: string;
  priority: string;
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
  notes: string | null;
  inspection_passed: boolean | null;
  inspection_notes: string | null;
  inspection_time: string | null;
  duration_minutes: number;
  is_overdue: boolean;
  time_until_deadline: number | null;
  complaint: number | null;
  complaint_number: string | null;
  complaint_title: string | null;
  created_at: string;
  updated_at: string;
}

interface Statistics {
  status_stats: { status: string; count: number }[];
  priority_stats: { priority: string; count: number }[];
  staff_stats: any[];
  overdue_count: number;
  date: string;
}

const HousekeepingPage = () => {
  const router = useRouter();
  const [tasks, setTasks] = useState<HousekeepingTask[]>([]);
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<HousekeepingTask | null>(null);
  const [filterStatus, setFilterStatus] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showNewTaskDialog, setShowNewTaskDialog] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [rooms, setRooms] = useState<any[]>([]);
  const [newTask, setNewTask] = useState({
    room: '',
    task_type: 'CHECKOUT_CLEANING',
    priority: 'MEDIUM',
    notes: ''
  });

  // Fetch tasks
  const fetchTasks = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterStatus) params.append('status', filterStatus);
      // Order by latest first (most recent created_at)
      params.append('ordering', '-created_at');

      const url = buildApiUrl(`hotel/housekeeping-tasks/?${params.toString()}`);
      const response = await fetch(url, { credentials: 'include' });

      if (response.ok) {
        const data = await response.json();
        setTasks(Array.isArray(data) ? data : (data.results || []));
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch statistics
  const fetchStatistics = async () => {
    try {
      const response = await fetch(buildApiUrl('hotel/housekeeping-tasks/statistics/'), {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setStatistics(data);
      }
    } catch (error) {
      console.error('Error fetching statistics:', error);
    }
  };

  // Fetch rooms
  const fetchRooms = async () => {
    try {
      const response = await fetch(buildApiUrl('hotel/rooms/'), { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        setRooms(Array.isArray(data) ? data : (data.results || []));
      }
    } catch (error) {
      console.error('Error fetching rooms:', error);
    }
  };

  // Handle create task
  const handleCreateTask = async () => {
    if (!newTask.room) {
      alert('Please select a room');
      return;
    }

    try {
      setFormLoading(true);
      const csrfToken = getCsrfToken();

      const response = await fetch(buildApiUrl('hotel/housekeeping-tasks/'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(csrfToken ? { 'X-CSRFToken': csrfToken } : {}),
        },
        credentials: 'include',
        body: JSON.stringify({
          room: parseInt(newTask.room),
          task_type: newTask.task_type,
          priority: newTask.priority,
          notes: newTask.notes || undefined
        }),
      });

      if (response.ok) {
        setShowNewTaskDialog(false);
        setNewTask({
          room: '',
          task_type: 'CHECKOUT_CLEANING',
          priority: 'MEDIUM',
          notes: ''
        });
        fetchTasks();
        fetchStatistics();
        alert('Task created successfully!');
      } else {
        const error = await response.json();
        alert(`Failed to create task: ${JSON.stringify(error)}`);
      }
    } catch (error) {
      console.error('Error creating task:', error);
      alert('An error occurred while creating the task');
    } finally {
      setFormLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
    fetchStatistics();
    fetchRooms();
  }, [filterStatus]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DIRTY': return 'bg-red-100 text-red-800';
      case 'CLEANING': return 'bg-yellow-100 text-yellow-800';
      case 'INSPECTING': return 'bg-blue-100 text-blue-800';
      case 'CLEAN': return 'bg-green-100 text-green-800';
      case 'MAINTENANCE': return 'bg-orange-100 text-orange-800';
      case 'OUT_OF_ORDER': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'bg-red-100 text-red-800';
      case 'HIGH': return 'bg-orange-100 text-orange-800';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800';
      case 'LOW': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Start task
  const handleStartTask = async (taskId: number) => {
    try {
      const csrfToken = getCsrfToken();
      const response = await fetch(buildApiUrl(`hotel/housekeeping-tasks/${taskId}/start_task/`), {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(csrfToken && { 'X-CSRFToken': csrfToken })
        }
      });

      if (response.ok) {
        alert('Task started successfully!');
        fetchTasks();
        fetchStatistics();
      } else {
        let errorMessage = 'Failed to start task';
        try {
          const error = await response.json();
          errorMessage = error.error || error.detail || errorMessage;
        } catch (parseError) {
          const errorText = await response.text();
          console.error('API Error Response:', errorText);
          errorMessage = `Server error (${response.status})`;
        }
        alert(`Error: ${errorMessage}`);
      }
    } catch (error) {
      console.error('Error starting task:', error);
      alert('Failed to start task. Check console for details.');
    }
  };

  // Complete task
  const handleCompleteTask = async (taskId: number) => {
    try {
      const csrfToken = getCsrfToken();
      const response = await fetch(buildApiUrl(`hotel/housekeeping-tasks/${taskId}/complete_task/`), {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(csrfToken && { 'X-CSRFToken': csrfToken })
        }
      });

      if (response.ok) {
        alert('Task completed! Ready for inspection.');
        fetchTasks();
        fetchStatistics();
      } else {
        let errorMessage = 'Failed to complete task';
        try {
          const error = await response.json();
          errorMessage = error.error || error.detail || errorMessage;
        } catch (parseError) {
          const errorText = await response.text();
          console.error('API Error Response:', errorText);
          errorMessage = `Server error (${response.status})`;
        }
        alert(`Error: ${errorMessage}`);
      }
    } catch (error) {
      console.error('Error completing task:', error);
      alert('Failed to complete task. Check console for details.');
    }
  };

  // Pass inspection
  const handlePassInspection = async (taskId: number) => {
    const notes = prompt('Inspection notes (optional):');

    try {
      const csrfToken = getCsrfToken();
      const response = await fetch(buildApiUrl(`hotel/housekeeping-tasks/${taskId}/pass_inspection/`), {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(csrfToken && { 'X-CSRFToken': csrfToken })
        },
        body: JSON.stringify({ notes })
      });

      if (response.ok) {
        alert('Inspection passed! Room is clean.');
        fetchTasks();
        fetchStatistics();
      } else {
        // Try to parse error as JSON, fallback to text
        let errorMessage = 'Failed to pass inspection';
        try {
          const error = await response.json();
          errorMessage = error.error || error.detail || errorMessage;
        } catch (parseError) {
          const errorText = await response.text();
          console.error('API Error Response:', errorText);
          errorMessage = `Server error (${response.status})`;
        }
        alert(`Error: ${errorMessage}`);
      }
    } catch (error) {
      console.error('Error passing inspection:', error);
      alert('Failed to pass inspection. Check console for details.');
    }
  };

  // Fail inspection
  const handleFailInspection = async (taskId: number) => {
    const notes = prompt('Please provide reason for failing inspection:');

    if (!notes) {
      alert('Notes are required when failing inspection');
      return;
    }

    try {
      const csrfToken = getCsrfToken();
      const response = await fetch(buildApiUrl(`hotel/housekeeping-tasks/${taskId}/fail_inspection/`), {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(csrfToken && { 'X-CSRFToken': csrfToken })
        },
        body: JSON.stringify({ notes })
      });

      if (response.ok) {
        alert('Inspection failed. Task sent back for cleaning.');
        fetchTasks();
        fetchStatistics();
      } else {
        let errorMessage = 'Failed to fail inspection';
        try {
          const error = await response.json();
          errorMessage = error.error || error.detail || errorMessage;
        } catch (parseError) {
          const errorText = await response.text();
          console.error('API Error Response:', errorText);
          errorMessage = `Server error (${response.status})`;
        }
        alert(`Error: ${errorMessage}`);
      }
    } catch (error) {
      console.error('Error failing inspection:', error);
      alert('Failed to record inspection failure. Check console for details.');
    }
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const formatTime = (dateString: string | null) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  };

  const filteredTasks = tasks.filter(task => {
    if (searchTerm && !task.room_number.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !task.task_number.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    return true;
  });

  return (
    <SupportLayout>
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Housekeeping Management</h1>
              <p className="text-gray-600 mt-2">Manage room cleaning tasks and track staff performance</p>
            </div>
            <button
              onClick={() => setShowNewTaskDialog(true)}
              className="flex items-center space-x-2 bg-[#F87B1B] text-white px-4 py-2 text-sm font-medium hover:bg-[#E66A0A] transition-colors"
            >
              <Add01Icon className="h-4 w-4" />
              <span>New Task</span>
            </button>
          </div>

          {/* Statistics Cards */}
          {statistics && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Total Tasks */}
              <div className="bg-white border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Tasks Today</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {statistics.status_stats.reduce((sum, s) => sum + s.count, 0)}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded flex items-center justify-center">
                    <BedIcon className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </div>

              {/* Dirty Rooms */}
              <div className="bg-white border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Needs Cleaning</p>
                    <p className="text-2xl font-bold text-red-600 mt-1">
                      {statistics.status_stats.find(s => s.status === 'DIRTY')?.count || 0}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-red-100 rounded flex items-center justify-center">
                    <AlertCircleIcon className="h-6 w-6 text-red-600" />
                  </div>
                </div>
              </div>

              {/* In Progress */}
              <div className="bg-white border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">In Progress</p>
                    <p className="text-2xl font-bold text-yellow-600 mt-1">
                      {statistics.status_stats.find(s => s.status === 'CLEANING')?.count || 0}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-yellow-100 rounded flex items-center justify-center">
                    <Clock01Icon className="h-6 w-6 text-yellow-600" />
                  </div>
                </div>
              </div>

              {/* Overdue */}
              <div className="bg-white border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Overdue Tasks</p>
                    <p className="text-2xl font-bold text-red-600 mt-1">
                      {statistics.overdue_count}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-red-100 rounded flex items-center justify-center">
                    <AlertCircleIcon className="h-6 w-6 text-red-600" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Filters - Compact and Right Aligned */}
          <div className="flex justify-end items-center gap-3">
            {/* Status Filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 focus:ring-[#F87B1B] focus:border-[#F87B1B] text-sm w-48"
            >
              <option value="">All Statuses</option>
              <option value="DIRTY">Needs Cleaning</option>
              <option value="CLEANING">In Progress</option>
              <option value="INSPECTING">Inspection</option>
              <option value="CLEAN">Clean</option>
              <option value="MAINTENANCE">Maintenance</option>
            </select>

            {/* Search */}
            <div className="relative w-64">
              <Search02Icon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search room or task..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 focus:ring-[#F87B1B] focus:border-[#F87B1B] text-sm"
              />
            </div>

            {/* Clear Filters */}
            {(searchTerm || filterStatus) && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setFilterStatus('');
                }}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 hover:bg-gray-50 transition-colors"
              >
                Clear
              </button>
            )}
          </div>

          {/* Tasks Table */}
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F87B1B] mx-auto mb-4"></div>
              <p className="text-gray-600">Loading tasks...</p>
            </div>
          ) : (
            <div className="bg-white border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-xl font-bold text-gray-900">Housekeeping Tasks ({filteredTasks.length})</h3>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead className="bg-[#F87B1B]">
                    <tr>
                      <th className="border border-gray-300 px-6 py-4 text-left text-sm font-medium text-white">
                        Task #
                      </th>
                      <th className="border border-gray-300 px-6 py-4 text-left text-sm font-medium text-white">
                        Room
                      </th>
                      <th className="border border-gray-300 px-6 py-4 text-left text-sm font-medium text-white">
                        Type
                      </th>
                      <th className="border border-gray-300 px-6 py-4 text-left text-sm font-medium text-white">
                        Status
                      </th>
                      <th className="border border-gray-300 px-6 py-4 text-left text-sm font-medium text-white">
                        Priority
                      </th>
                      <th className="border border-gray-300 px-6 py-4 text-left text-sm font-medium text-white">
                        Assigned To
                      </th>
                      <th className="border border-gray-300 px-6 py-4 text-left text-sm font-medium text-white">
                        Duration
                      </th>
                      <th className="border border-gray-300 px-6 py-4 text-left text-sm font-medium text-white">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y-2 divide-gray-200">
                    {filteredTasks.map((task) => (
                      <tr key={task.id} className={`hover:bg-gray-50 ${task.is_overdue ? 'bg-red-50' : ''}`}>
                        <td className="border border-gray-200 px-6 py-4">
                          <div className="font-mono text-sm">{task.task_number}</div>
                        </td>
                        <td className="border border-gray-200 px-6 py-4">
                          <div className="font-bold text-gray-900">Room {task.room_number}</div>
                          <div className="text-xs text-gray-600">Floor {task.floor} - {task.room_type}</div>
                        </td>
                        <td className="border border-gray-200 px-6 py-4">
                          <span className="text-sm">{task.task_type_display}</span>
                        </td>
                        <td className="border border-gray-200 px-6 py-4">
                          <span className={`inline-flex px-3 py-1 text-xs font-medium rounded ${getStatusColor(task.status)}`}>
                            {task.status_display}
                          </span>
                          {task.is_overdue && (
                            <div className="text-xs text-red-600 mt-1 font-bold">⚠ OVERDUE</div>
                          )}
                        </td>
                        <td className="border border-gray-200 px-6 py-4">
                          <span className={`inline-flex px-3 py-1 text-xs font-medium rounded ${getPriorityColor(task.priority)}`}>
                            {task.priority_display}
                          </span>
                        </td>
                        <td className="border border-gray-200 px-6 py-4">
                          <span className="text-sm">{task.assigned_to_name || '-'}</span>
                        </td>
                        <td className="border border-gray-200 px-6 py-4">
                          <div className="text-sm">
                            {task.actual_start_time ? (
                              <>
                                <div>{formatDuration(task.duration_minutes)}</div>
                                {task.completion_time && (
                                  <div className="text-xs text-gray-600">
                                    {formatTime(task.actual_start_time)} - {formatTime(task.completion_time)}
                                  </div>
                                )}
                              </>
                            ) : (
                              <span className="text-gray-500">Est. {formatDuration(task.estimated_duration_minutes)}</span>
                            )}
                          </div>
                        </td>
                        <td className="border border-gray-200 px-6 py-4">
                          <div className="flex flex-col space-y-2">
                            {task.status === 'DIRTY' && (
                              <button
                                onClick={() => handleStartTask(task.id)}
                                className="text-xs bg-yellow-500 text-white px-3 py-1 hover:bg-yellow-600 transition-colors"
                              >
                                Start Cleaning
                              </button>
                            )}
                            {task.status === 'CLEANING' && (
                              <button
                                onClick={() => handleCompleteTask(task.id)}
                                className="text-xs bg-blue-500 text-white px-3 py-1 hover:bg-blue-600 transition-colors"
                              >
                                Mark Complete
                              </button>
                            )}
                            {task.status === 'INSPECTING' && (
                              <>
                                <button
                                  onClick={() => handlePassInspection(task.id)}
                                  className="text-xs bg-green-500 text-white px-3 py-1 hover:bg-green-600 transition-colors"
                                >
                                  Pass Inspection
                                </button>
                                <button
                                  onClick={() => handleFailInspection(task.id)}
                                  className="text-xs bg-red-500 text-white px-3 py-1 hover:bg-red-600 transition-colors"
                                >
                                  Fail Inspection
                                </button>
                              </>
                            )}
                            <button
                              onClick={() => setSelectedTask(task)}
                              className="text-xs bg-gray-500 text-white px-3 py-1 hover:bg-gray-600 transition-colors"
                            >
                              <EyeIcon className="h-3 w-3 inline mr-1" />
                              Details
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {filteredTasks.length === 0 && (
                <div className="text-center py-12">
                  <BedIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks found</h3>
                  <p className="text-gray-600">No housekeeping tasks match your filters.</p>
                </div>
              )}
            </div>
          )}

          {/* Task Detail Modal */}
          {selectedTask && (
            <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
              <div className="bg-white max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Modal Header */}
                <div className="p-6 border-b border-gray-200 bg-[#F87B1B]">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-bold text-white">{selectedTask.task_number}</h2>
                      <p className="text-sm text-gray-200 mt-1">Room {selectedTask.room_number}</p>
                    </div>
                    <button
                      onClick={() => setSelectedTask(null)}
                      className="p-2 text-white hover:text-gray-200"
                    >
                      <Cancel01Icon className="h-6 w-6" />
                    </button>
                  </div>
                </div>

                {/* Modal Content */}
                <div className="p-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 mb-4">Task Details</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Room</span>
                          <span className="font-medium">{selectedTask.room_number}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Floor</span>
                          <span className="font-medium">Floor {selectedTask.floor}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Room Type</span>
                          <span className="font-medium">{selectedTask.room_type}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Task Type</span>
                          <span className="font-medium">{selectedTask.task_type_display}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Status</span>
                          <span className={`inline-flex px-3 py-1 text-xs font-medium rounded ${getStatusColor(selectedTask.status)}`}>
                            {selectedTask.status_display}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Priority</span>
                          <span className={`inline-flex px-3 py-1 text-xs font-medium rounded ${getPriorityColor(selectedTask.priority)}`}>
                            {selectedTask.priority_display}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-bold text-gray-900 mb-4">Staff & Timing</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Assigned To</span>
                          <span className="font-medium">{selectedTask.assigned_to_name || '-'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Scheduled Date</span>
                          <span className="font-medium">{new Date(selectedTask.scheduled_date).toLocaleDateString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Duration</span>
                          <span className="font-medium">{formatDuration(selectedTask.duration_minutes)}</span>
                        </div>
                        {selectedTask.actual_start_time && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Started At</span>
                            <span className="font-medium">{formatTime(selectedTask.actual_start_time)}</span>
                          </div>
                        )}
                        {selectedTask.completion_time && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Completed At</span>
                            <span className="font-medium">{formatTime(selectedTask.completion_time)}</span>
                          </div>
                        )}
                        {selectedTask.is_overdue && (
                          <div className="p-3 bg-red-50 border border-red-200 text-red-800 text-sm rounded">
                            <strong>⚠ OVERDUE</strong>
                            <p className="text-xs mt-1">This task is overdue and requires immediate attention</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {selectedTask.notes && (
                    <div className="mt-6">
                      <h3 className="text-lg font-bold text-gray-900 mb-2">Notes</h3>
                      <p className="text-sm text-gray-600 bg-gray-50 p-4 rounded">{selectedTask.notes}</p>
                    </div>
                  )}

                  {selectedTask.inspection_notes && (
                    <div className="mt-6">
                      <h3 className="text-lg font-bold text-gray-900 mb-2">Inspection Notes</h3>
                      <p className="text-sm text-gray-600 bg-gray-50 p-4 rounded">{selectedTask.inspection_notes}</p>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-4 p-6 border-t">
                  <button
                    onClick={() => setSelectedTask(null)}
                    className="px-6 py-3 bg-gray-100 text-gray-700 font-medium hover:bg-gray-200 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* New Task Dialog */}
          {showNewTaskDialog && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white max-w-lg w-full max-h-[90vh] overflow-y-auto">
                {/* Dialog Header */}
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold text-gray-900">New Housekeeping Task</h3>
                    <button
                      onClick={() => {
                        setShowNewTaskDialog(false);
                        setNewTask({
                          room: '',
                          task_type: 'CHECKOUT_CLEANING',
                          priority: 'MEDIUM',
                          notes: ''
                        });
                      }}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <Cancel01Icon className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                {/* Dialog Content */}
                <div className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Room <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={newTask.room}
                      onChange={(e) => setNewTask({ ...newTask, room: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 focus:ring-[#F87B1B] focus:border-[#F87B1B] text-sm"
                    >
                      <option value="">-- Select Room --</option>
                      {rooms.map((room) => (
                        <option key={room.id} value={room.id}>
                          Room {room.number} - {room.room_type_name} (Floor {room.floor})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Task Type</label>
                    <select
                      value={newTask.task_type}
                      onChange={(e) => setNewTask({ ...newTask, task_type: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 focus:ring-[#F87B1B] focus:border-[#F87B1B] text-sm"
                    >
                      <option value="CHECKOUT_CLEANING">Checkout Cleaning</option>
                      <option value="STAYOVER_CLEANING">Stayover Cleaning</option>
                      <option value="DEEP_CLEANING">Deep Cleaning</option>
                      <option value="TURNDOWN_SERVICE">Turndown Service</option>
                      <option value="MAINTENANCE">Maintenance</option>
                      <option value="COMPLAINT">Guest Complaint</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                    <select
                      value={newTask.priority}
                      onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 focus:ring-[#F87B1B] focus:border-[#F87B1B] text-sm"
                    >
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                      <option value="URGENT">Urgent</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Notes (Optional)
                    </label>
                    <textarea
                      value={newTask.notes}
                      onChange={(e) => setNewTask({ ...newTask, notes: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 focus:ring-[#F87B1B] focus:border-[#F87B1B] text-sm"
                      placeholder="Any special instructions or notes..."
                    />
                  </div>
                </div>

                {/* Dialog Footer */}
                <div className="p-6 border-t border-gray-200 flex items-center justify-end space-x-3">
                  <button
                    onClick={() => {
                      setShowNewTaskDialog(false);
                      setNewTask({
                        room: '',
                        task_type: 'CHECKOUT_CLEANING',
                        priority: 'MEDIUM',
                        notes: ''
                      });
                    }}
                    className="px-4 py-2 border border-gray-300 text-gray-700 text-sm hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateTask}
                    className="px-4 py-2 bg-[#F87B1B] text-white text-sm hover:bg-[#E06A0A] disabled:opacity-50"
                    disabled={formLoading || !newTask.room}
                  >
                    {formLoading ? 'Creating...' : 'Create Task'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </SupportLayout>
  );
};

export default HousekeepingPage;
