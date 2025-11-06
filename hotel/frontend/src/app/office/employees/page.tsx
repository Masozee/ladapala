'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import OfficeLayout from '@/components/OfficeLayout';
import { buildApiUrl, getCsrfToken } from '@/lib/config';
import {
  UserMultipleIcon,
  Search02Icon,
  Add01Icon,
  Mail01Icon,
  Call02Icon,
  MoreHorizontalIcon,
  EyeIcon,
  PencilEdit02Icon,
  Delete02Icon,
  Cancel01Icon
} from '@/lib/icons';

interface Employee {
  id: number;
  employee_id: string;
  full_name: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  role: string;
  role_display: string;
  department: number;
  department_name: string;
  position: string;
  hire_date: string;
  employment_status: string;
  employment_status_display: string;
  is_active: boolean;
}

interface Statistics {
  total_employees: number;
  active_employees: number;
  on_leave: number;
  new_this_month: number;
}

interface Shift {
  id: number;
  employee: number;
  shift_date: string;
  start_time: string;
  end_time: string;
  shift_type: string;
  notes?: string;
}

interface EmployeeSchedule {
  employee_id: string;
  employee_db_id: number; // The actual Employee model ID for API calls
  employee_name: string;
  department: string;
  shifts: { [date: string]: Shift[] };
}

// Schedule Table Component with frozen employee column
function ScheduleTable() {
  const [schedules, setSchedules] = useState<EmployeeSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentWeekStart, setCurrentWeekStart] = useState(new Date());
  const [scrollLeft, setScrollLeft] = useState(0);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);
  const [openShiftMenuId, setOpenShiftMenuId] = useState<number | null>(null);
  const [newShift, setNewShift] = useState({
    shift_type: 'MORNING',
    start_time: '07:00',
    end_time: '15:00',
    notes: ''
  });

  // Generate array of dates for the week
  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(currentWeekStart);
    date.setDate(date.getDate() + i);
    return date;
  });

  useEffect(() => {
    fetchSchedules();
  }, [currentWeekStart]);

  const fetchSchedules = async () => {
    try {
      setLoading(true);
      // Get employees first
      const employeesRes = await fetch(buildApiUrl('user/employees/'), {
        credentials: 'include',
      });

      if (!employeesRes.ok) {
        console.error('Failed to fetch employees:', employeesRes.status);
        return;
      }

      const employeesData = await employeesRes.json();
      const employees = employeesData.results || employeesData || [];
      console.log(`[Schedule] Fetched ${employees.length} employees`);

      // Get shifts for the week
      const startDate = weekDates[0].toISOString().split('T')[0];
      const endDate = weekDates[6].toISOString().split('T')[0];

      // Fetch ALL shifts by following pagination
      let allShifts: Shift[] = [];
      let nextUrl: string | null = buildApiUrl(`user/shifts-manage/?from_date=${startDate}&to_date=${endDate}`);

      while (nextUrl) {
        const shiftsRes = await fetch(nextUrl, { credentials: 'include' });

        if (!shiftsRes.ok) {
          console.error('Failed to fetch shifts:', shiftsRes.status);
          return;
        }

        const shiftsData = await shiftsRes.json();
        const pageShifts = shiftsData.results || shiftsData || [];
        allShifts = allShifts.concat(pageShifts);

        // Check if there's a next page
        nextUrl = shiftsData.next || null;
        console.log(`[Schedule] Fetched ${pageShifts.length} shifts, total so far: ${allShifts.length}, next: ${nextUrl ? 'yes' : 'no'}`);
      }

      const shifts = allShifts;
      console.log(`[Schedule] Fetched ${shifts.length} total shifts for ${startDate} to ${endDate}`);

      // Organize shifts by employee and date
      const scheduleMap: { [empId: string]: EmployeeSchedule } = {};

      employees.forEach((emp: Employee) => {
        scheduleMap[emp.employee_id] = {
          employee_id: emp.employee_id,
          employee_db_id: emp.id, // Store the actual Employee model ID
          employee_name: emp.full_name,
          department: emp.department_name,
          shifts: {}
        };
      });

      let assignedShifts = 0;
      shifts.forEach((shift: Shift) => {
        const employee = employees.find((e: Employee) => e.id === shift.employee);
        if (employee && scheduleMap[employee.employee_id]) {
          const dateKey = shift.shift_date;
          if (!scheduleMap[employee.employee_id].shifts[dateKey]) {
            scheduleMap[employee.employee_id].shifts[dateKey] = [];
          }
          scheduleMap[employee.employee_id].shifts[dateKey].push(shift);
          assignedShifts++;
        } else if (!employee) {
          console.warn(`[Schedule] Shift ${shift.id} references non-existent employee ${shift.employee}`);
        }
      });

      console.log(`[Schedule] Assigned ${assignedShifts} shifts to employees`);
      console.log(`[Schedule] Schedule map has ${Object.keys(scheduleMap).length} employees`);

      // Debug: Log first few schedules with their employee_db_id
      const schedulesArray = Object.values(scheduleMap);
      console.log('[Schedule] First 3 schedules with employee_db_id:');
      schedulesArray.slice(0, 3).forEach(sched => {
        console.log(`  - ${sched.employee_name} (employee_id: ${sched.employee_id}, db_id: ${sched.employee_db_id})`);
      });

      setSchedules(schedulesArray);
    } catch (error) {
      console.error('Error fetching schedules:', error);
    } finally {
      setLoading(false);
    }
  };

  const goToPreviousWeek = () => {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(newDate.getDate() - 7);
    setCurrentWeekStart(newDate);
  };

  const goToNextWeek = () => {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(newDate.getDate() + 7);
    setCurrentWeekStart(newDate);
  };

  const goToToday = () => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const monday = new Date(today);
    monday.setDate(today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1));
    setCurrentWeekStart(monday);
  };

  const openAddShiftModal = (employeeId: number, date: string) => {
    console.log('[OpenModal] Opening add shift modal for employee ID:', employeeId, 'date:', date);
    setSelectedEmployee(employeeId);
    setSelectedDate(date);
    setShowAddModal(true);
  };

  const handleAddShift = async () => {
    if (!selectedEmployee || !selectedDate) return;

    console.log('[AddShift] Adding shift for employee ID:', selectedEmployee, 'date:', selectedDate);

    try {
      const csrfToken = getCsrfToken();
      const payload = {
        employee: selectedEmployee,
        shift_date: selectedDate,
        shift_type: newShift.shift_type,
        start_time: newShift.start_time,
        end_time: newShift.end_time,
        notes: newShift.notes
      };
      console.log('[AddShift] Payload:', payload);

      const response = await fetch(buildApiUrl('user/shifts-manage/'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(csrfToken && { 'X-CSRFToken': csrfToken }),
        },
        credentials: 'include',
        body: JSON.stringify(payload)
      });

      console.log('[AddShift] Response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('[AddShift] Success! Created shift:', data);
        setShowAddModal(false);
        setNewShift({
          shift_type: 'MORNING',
          start_time: '07:00',
          end_time: '15:00',
          notes: ''
        });
        fetchSchedules(); // Refresh schedules
      } else {
        const error = await response.json();
        console.error('[AddShift] Error response:', error);
        alert('Gagal menambahkan shift: ' + (error.detail || JSON.stringify(error) || 'Terjadi kesalahan'));
      }
    } catch (error) {
      console.error('[AddShift] Exception:', error);
      alert('Gagal menambahkan shift');
    }
  };

  const handleShiftTypeChange = (type: string) => {
    const shiftTimes: { [key: string]: { start: string; end: string } } = {
      MORNING: { start: '07:00', end: '15:00' },
      AFTERNOON: { start: '15:00', end: '23:00' },
      EVENING: { start: '14:00', end: '22:00' },
      NIGHT: { start: '23:00', end: '07:00' },
      OVERTIME: { start: '17:00', end: '20:00' }
    };

    const times = shiftTimes[type] || { start: '08:00', end: '16:00' };
    setNewShift(prev => ({
      ...prev,
      shift_type: type,
      start_time: times.start,
      end_time: times.end
    }));
  };

  const openEditShiftModal = (shift: Shift) => {
    setSelectedShift(shift);
    setNewShift({
      shift_type: shift.shift_type,
      start_time: shift.start_time.substring(0, 5),
      end_time: shift.end_time.substring(0, 5),
      notes: shift.notes || ''
    });
    setShowEditModal(true);
    setOpenShiftMenuId(null);
  };

  const handleEditShift = async () => {
    if (!selectedShift) return;

    console.log('[EditShift] Editing shift ID:', selectedShift.id);

    try {
      const csrfToken = getCsrfToken();
      const payload = {
        shift_type: newShift.shift_type,
        start_time: newShift.start_time,
        end_time: newShift.end_time,
        notes: newShift.notes
      };
      console.log('[EditShift] Payload:', payload);

      const response = await fetch(buildApiUrl(`user/shifts-manage/${selectedShift.id}/`), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(csrfToken && { 'X-CSRFToken': csrfToken }),
        },
        credentials: 'include',
        body: JSON.stringify(payload)
      });

      console.log('[EditShift] Response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('[EditShift] Success! Updated shift:', data);
        setShowEditModal(false);
        setSelectedShift(null);
        setNewShift({
          shift_type: 'MORNING',
          start_time: '07:00',
          end_time: '15:00',
          notes: ''
        });
        fetchSchedules(); // Refresh schedules
      } else {
        const error = await response.json();
        console.error('[EditShift] Error response:', error);
        alert('Gagal mengubah shift: ' + (error.detail || JSON.stringify(error) || 'Terjadi kesalahan'));
      }
    } catch (error) {
      console.error('[EditShift] Exception:', error);
      alert('Gagal mengubah shift');
    }
  };

  const handleDeleteShift = async (shiftId: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus shift ini?')) return;

    console.log('[DeleteShift] Deleting shift ID:', shiftId);

    try {
      const csrfToken = getCsrfToken();
      const response = await fetch(buildApiUrl(`user/shifts-manage/${shiftId}/`), {
        method: 'DELETE',
        headers: {
          ...(csrfToken && { 'X-CSRFToken': csrfToken }),
        },
        credentials: 'include',
      });

      console.log('[DeleteShift] Response status:', response.status);

      if (response.ok) {
        console.log('[DeleteShift] Success! Deleted shift:', shiftId);
        setOpenShiftMenuId(null);
        fetchSchedules(); // Refresh schedules
      } else {
        const error = await response.json();
        console.error('[DeleteShift] Error response:', error);
        alert('Gagal menghapus shift: ' + (error.detail || 'Terjadi kesalahan'));
      }
    } catch (error) {
      console.error('[DeleteShift] Exception:', error);
      alert('Gagal menghapus shift');
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
  };

  const formatDayName = (date: Date) => {
    return date.toLocaleDateString('id-ID', { weekday: 'short' });
  };

  const getShiftBadge = (shiftType: string) => {
    const badges: { [key: string]: { bg: string; text: string; label: string } } = {
      MORNING: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Pagi' },
      AFTERNOON: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Siang' },
      EVENING: { bg: 'bg-orange-100', text: 'text-orange-800', label: 'Sore' },
      NIGHT: { bg: 'bg-purple-100', text: 'text-purple-800', label: 'Malam' },
      OVERTIME: { bg: 'bg-red-100', text: 'text-red-800', label: 'Lembur' },
    };
    const badge = badges[shiftType] || { bg: 'bg-gray-100', text: 'text-gray-800', label: shiftType };
    return (
      <span className={`inline-flex items-center px-2 py-0.5 text-xs font-semibold ${badge.bg} ${badge.text} rounded border border-${badge.text.replace('text-', '')}/20`}>
        {badge.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="px-6 py-6">
        <div className="bg-white border border-gray-200 p-8 text-center">
          <p className="text-gray-500">Memuat jadwal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-6 py-6">
      {/* Week Navigation */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <button
            onClick={goToPreviousWeek}
            className="px-4 py-2.5 border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors text-sm font-medium rounded"
          >
            ← Minggu Sebelumnya
          </button>
          <button
            onClick={goToToday}
            className="px-4 py-2.5 bg-[#4E61D3] text-white hover:bg-[#3d4fb5] transition-colors text-sm font-medium rounded shadow-sm"
          >
            Minggu Ini
          </button>
          <button
            onClick={goToNextWeek}
            className="px-4 py-2.5 border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors text-sm font-medium rounded"
          >
            Minggu Berikutnya →
          </button>
        </div>
        <div className="flex flex-col items-end">
          <div className="text-sm font-semibold text-gray-900">
            {weekDates[0].toLocaleDateString('id-ID', { day: 'numeric', month: 'long' })} - {weekDates[6].toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
          <div className="text-xs text-gray-500 mt-0.5">
            {schedules.length} karyawan terdaftar
          </div>
        </div>
      </div>

      {/* Schedule Table with Frozen First Column */}
      <div className="bg-white border border-gray-200 shadow-sm overflow-hidden">
        <div className="flex">
          {/* Left Side: Frozen Employee Column */}
          <div className="flex-shrink-0 w-72 border-r border-gray-200">
            {/* Employee Header */}
            <div className="bg-[#4E61D3] text-white px-6 py-4 border-b border-gray-200" style={{ height: '60px' }}>
              <div className="font-semibold text-sm uppercase tracking-wide">Karyawan</div>
            </div>

            {/* Employee Rows */}
            <div className="overflow-y-auto" style={{ maxHeight: '600px' }}>
              {schedules.map((schedule, idx) => {
                return (
                  <div
                    key={schedule.employee_id}
                    className="px-6 py-4 border-b border-gray-200 bg-white hover:bg-gray-50"
                    style={{ height: '80px' }}
                  >
                    <div className="font-semibold text-sm text-gray-900 mb-1.5">
                      {schedule.employee_name}
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-gray-600 font-medium">
                        {schedule.employee_id}
                      </div>
                      <div className="text-xs text-gray-500 bg-gray-50 px-2 py-0.5 rounded border border-gray-200">
                        {schedule.department}
                      </div>
                    </div>
                  </div>
                );
              })}
              {schedules.length === 0 && (
                <div className="px-6 py-12 text-center text-gray-500 text-sm">
                  Tidak ada karyawan
                </div>
              )}
            </div>
          </div>

          {/* Right Side: Single Scrollable Container for Dates and Attendance */}
          <div className="flex-1 overflow-x-auto overflow-y-auto" style={{ maxHeight: '660px' }}>
            {/* Date Headers - Fixed at top */}
            <div className="flex border-b border-gray-200 sticky top-0 z-10">
              {weekDates.map((date, index) => {
                const isToday = date.toDateString() === new Date().toDateString();
                const isWeekend = date.getDay() === 0 || date.getDay() === 6;

                return (
                  <div
                    key={index}
                    className={`flex-shrink-0 w-[180px] px-4 py-4 border-r border-gray-200 last:border-r-0 ${
                      isToday
                        ? 'bg-[#3d4fb5] text-white'
                        : isWeekend
                        ? 'bg-gray-100 text-gray-800'
                        : 'bg-[#4E61D3] text-white'
                    }`}
                    style={{ height: '60px' }}
                  >
                    <div className="text-xs font-semibold uppercase tracking-wide mb-0.5">
                      {formatDayName(date)}
                    </div>
                    <div className="text-sm font-bold">
                      {formatDate(date)}
                    </div>
                    {isToday && (
                      <div className="text-xs mt-0.5 opacity-90">Hari Ini</div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Schedule Grid - All rows scroll together */}
            <div>
              {schedules.map((schedule, idx) => {
                return (
                  <div key={schedule.employee_id} className="flex border-b border-gray-200">
                    {weekDates.map((date, dateIndex) => {
                      const dateKey = date.toISOString().split('T')[0];
                      const shifts = schedule.shifts[dateKey] || [];
                      const isWeekend = date.getDay() === 0 || date.getDay() === 6;

                      return (
                        <div
                          key={dateIndex}
                          onClick={() => {
                            // Use the actual Employee model ID (employee_db_id) instead of parsing employee_id string
                            openAddShiftModal(schedule.employee_db_id, dateKey);
                          }}
                          className={`flex-shrink-0 w-[180px] px-3 py-3 border-r border-gray-200 last:border-r-0 cursor-pointer bg-white ${
                            isWeekend ? 'bg-gray-50' : ''
                          } hover:bg-blue-50 transition-colors`}
                          style={{ height: '80px' }}
                        >
                          {shifts.length > 0 ? (
                            <div className="space-y-1.5 h-full flex flex-col">
                              {shifts.map((shift, shiftIdx) => (
                                <div key={shift.id} className={`flex items-center justify-between gap-1 relative ${shiftIdx > 0 ? 'pt-1.5 border-t border-gray-200' : ''}`}>
                                  <div className="flex-shrink-0">
                                    {getShiftBadge(shift.shift_type)}
                                  </div>
                                  <div className="text-xs font-semibold text-gray-900 whitespace-nowrap">
                                    {shift.start_time.substring(0, 5)}-{shift.end_time.substring(0, 5)}
                                  </div>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setOpenShiftMenuId(openShiftMenuId === shift.id ? null : shift.id);
                                    }}
                                    className="flex-shrink-0 p-0.5 hover:bg-gray-200 rounded transition-colors"
                                  >
                                    <MoreHorizontalIcon className="h-3 w-3 text-gray-500" />
                                  </button>
                                  {openShiftMenuId === shift.id && (
                                    <div className="absolute right-0 top-6 w-32 bg-white border border-gray-200 shadow-lg rounded z-50">
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          openEditShiftModal(shift);
                                        }}
                                        className="w-full px-3 py-1.5 text-xs text-left text-gray-700 hover:bg-gray-50 flex items-center space-x-1.5"
                                      >
                                        <PencilEdit02Icon className="h-3 w-3" />
                                        <span>Edit</span>
                                      </button>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleDeleteShift(shift.id);
                                        }}
                                        className="w-full px-3 py-1.5 text-xs text-left text-red-600 hover:bg-red-50 flex items-center space-x-1.5"
                                      >
                                        <Delete02Icon className="h-3 w-3" />
                                        <span>Hapus</span>
                                      </button>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="flex items-center justify-center h-full">
                              <div className="text-sm font-medium text-gray-400 hover:text-gray-600 transition-colors">+ Tambah</div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-6 bg-white border border-gray-200 rounded-lg p-4">
        <div className="text-xs font-semibold text-gray-700 mb-3 uppercase tracking-wide">Keterangan Shift:</div>
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center space-x-2">
            <span className="inline-block px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">Pagi</span>
            <span className="text-xs text-gray-600">Morning Shift</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="inline-block px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded">Siang</span>
            <span className="text-xs text-gray-600">Afternoon Shift</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="inline-block px-2 py-1 text-xs font-medium bg-orange-100 text-orange-800 rounded">Sore</span>
            <span className="text-xs text-gray-600">Evening Shift</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="inline-block px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded">Malam</span>
            <span className="text-xs text-gray-600">Night Shift</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="inline-block px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded">Lembur</span>
            <span className="text-xs text-gray-600">Overtime</span>
          </div>
        </div>
      </div>

      {/* Add Shift Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Tambah Shift</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal</label>
                <input
                  type="text"
                  value={selectedDate || ''}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded bg-gray-50 text-gray-600"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipe Shift</label>
                <select
                  value={newShift.shift_type}
                  onChange={(e) => handleShiftTypeChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#4E61D3] focus:border-[#4E61D3]"
                >
                  <option value="MORNING">Pagi (07:00 - 15:00)</option>
                  <option value="AFTERNOON">Siang (15:00 - 23:00)</option>
                  <option value="EVENING">Sore (14:00 - 22:00)</option>
                  <option value="NIGHT">Malam (23:00 - 07:00)</option>
                  <option value="OVERTIME">Lembur (17:00 - 20:00)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Jam Mulai</label>
                  <input
                    type="time"
                    value={newShift.start_time}
                    onChange={(e) => setNewShift(prev => ({ ...prev, start_time: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#4E61D3] focus:border-[#4E61D3]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Jam Selesai</label>
                  <input
                    type="time"
                    value={newShift.end_time}
                    onChange={(e) => setNewShift(prev => ({ ...prev, end_time: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#4E61D3] focus:border-[#4E61D3]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Catatan (Opsional)</label>
                <textarea
                  value={newShift.notes}
                  onChange={(e) => setNewShift(prev => ({ ...prev, notes: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#4E61D3] focus:border-[#4E61D3]"
                  placeholder="Catatan tambahan..."
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
              >
                Batal
              </button>
              <button
                onClick={handleAddShift}
                className="px-4 py-2 text-sm font-medium text-white bg-[#4E61D3] rounded hover:bg-[#3d4fb5]"
              >
                Tambah Shift
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Shift Modal */}
      {showEditModal && selectedShift && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Edit Shift</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal</label>
                <input
                  type="text"
                  value={selectedShift.shift_date}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded bg-gray-50 text-gray-600"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipe Shift</label>
                <select
                  value={newShift.shift_type}
                  onChange={(e) => handleShiftTypeChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#4E61D3] focus:border-[#4E61D3]"
                >
                  <option value="MORNING">Pagi (07:00 - 15:00)</option>
                  <option value="AFTERNOON">Siang (15:00 - 23:00)</option>
                  <option value="EVENING">Sore (14:00 - 22:00)</option>
                  <option value="NIGHT">Malam (23:00 - 07:00)</option>
                  <option value="OVERTIME">Lembur (17:00 - 20:00)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Jam Mulai</label>
                  <input
                    type="time"
                    value={newShift.start_time}
                    onChange={(e) => setNewShift(prev => ({ ...prev, start_time: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#4E61D3] focus:border-[#4E61D3]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Jam Selesai</label>
                  <input
                    type="time"
                    value={newShift.end_time}
                    onChange={(e) => setNewShift(prev => ({ ...prev, end_time: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#4E61D3] focus:border-[#4E61D3]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Catatan (Opsional)</label>
                <textarea
                  value={newShift.notes}
                  onChange={(e) => setNewShift(prev => ({ ...prev, notes: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#4E61D3] focus:border-[#4E61D3]"
                  placeholder="Catatan tambahan..."
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedShift(null);
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
              >
                Batal
              </button>
              <button
                onClick={handleEditShift}
                className="px-4 py-2 text-sm font-medium text-white bg-[#4E61D3] rounded hover:bg-[#3d4fb5]"
              >
                Simpan Perubahan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function EmployeesPage() {
  const [activeTab, setActiveTab] = useState<'employees' | 'schedules'>('employees');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [selectedShift, setSelectedShift] = useState('all');
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);
  const [statistics, setStatistics] = useState<Statistics>({
    total_employees: 0,
    active_employees: 0,
    on_leave: 0,
    new_this_month: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEmployees();
    fetchStatistics();
  }, []);

  useEffect(() => {
    filterEmployees();
  }, [searchQuery, selectedDepartment, employees]);

  const fetchEmployees = async () => {
    try {
      const url = buildApiUrl('user/employees/');
      console.log('Fetching employees from:', url);

      const response = await fetch(url, {
        credentials: 'include',
      });

      console.log('Response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('Employees data received:', data);
        // Handle paginated response from DRF ViewSet
        const employeesArray = data.results ? data.results : (Array.isArray(data) ? data : []);
        console.log('Setting employees:', employeesArray.length, 'items');
        setEmployees(employeesArray);
        setFilteredEmployees(employeesArray);
      } else {
        const errorText = await response.text();
        console.error('Failed to fetch employees:', response.status, errorText);
        setEmployees([]);
        setFilteredEmployees([]);
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
      setEmployees([]);
      setFilteredEmployees([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const response = await fetch(buildApiUrl('user/employees/statistics/'), {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setStatistics(data);
      }
    } catch (error) {
      console.error('Error fetching statistics:', error);
    }
  };

  const filterEmployees = () => {
    // Ensure employees is an array before filtering
    if (!Array.isArray(employees)) {
      setFilteredEmployees([]);
      return;
    }

    let filtered = [...employees];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(emp =>
        emp.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.employee_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.email.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Department filter
    if (selectedDepartment !== 'all') {
      filtered = filtered.filter(emp => emp.department_name === selectedDepartment);
    }

    setFilteredEmployees(filtered);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <span className="px-3 py-1 text-sm font-medium bg-green-100 text-green-800 rounded">Aktif</span>;
      case 'INACTIVE':
        return <span className="px-3 py-1 text-sm font-medium bg-red-100 text-red-800 rounded">Non-aktif</span>;
      case 'TERMINATED':
        return <span className="px-3 py-1 text-sm font-medium bg-gray-100 text-gray-800 rounded">Berhenti</span>;
      case 'RESIGNED':
        return <span className="px-3 py-1 text-sm font-medium bg-yellow-100 text-yellow-800 rounded">Mengundurkan Diri</span>;
      default:
        return <span className="px-3 py-1 text-sm font-medium bg-gray-100 text-gray-600 rounded">{status}</span>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const departments = Array.isArray(employees)
    ? Array.from(new Set(employees.map(emp => emp.department_name)))
    : [];

  return (
    <OfficeLayout>
      {/* Header */}
      <h1 className="text-2xl font-bold text-gray-900 px-6 py-4">Manajemen Karyawan</h1>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 px-6">
        <button
          onClick={() => setActiveTab('employees')}
          className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'employees'
              ? 'border-[#4E61D3] text-[#4E61D3] bg-gray-50'
              : 'border-transparent text-gray-600 hover:text-gray-800 hover:border-gray-300'
          }`}
        >
          Daftar Karyawan
        </button>
        <button
          onClick={() => setActiveTab('schedules')}
          className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'schedules'
              ? 'border-[#4E61D3] text-[#4E61D3] bg-gray-50'
              : 'border-transparent text-gray-600 hover:text-gray-800 hover:border-gray-300'
          }`}
        >
          Jadwal Kerja
        </button>
      </div>

      {activeTab === 'employees' && (
        <>
          {/* Statistics Cards */}
          <div className="grid grid-cols-4 gap-6 px-6 py-6">
            <div className="bg-white border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Total Karyawan</span>
                <UserMultipleIcon className="h-5 w-5 text-[#4E61D3]" />
              </div>
              <div className="text-3xl font-bold text-gray-900">{statistics.total_employees}</div>
            </div>

            <div className="bg-white border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Karyawan Aktif</span>
                <UserMultipleIcon className="h-5 w-5 text-green-600" />
              </div>
              <div className="text-3xl font-bold text-gray-900">{statistics.active_employees}</div>
            </div>

            <div className="bg-white border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Sedang Cuti</span>
                <UserMultipleIcon className="h-5 w-5 text-yellow-600" />
              </div>
              <div className="text-3xl font-bold text-gray-900">{statistics.on_leave}</div>
            </div>

            <div className="bg-white border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Karyawan Baru</span>
                <UserMultipleIcon className="h-5 w-5 text-blue-600" />
              </div>
              <div className="text-3xl font-bold text-gray-900">{statistics.new_this_month}</div>
              <p className="text-xs text-gray-500 mt-1">Bulan ini</p>
            </div>
          </div>

          {/* Filters */}
          <div className="flex items-center justify-end space-x-3 mb-6 px-6">
            <div className="relative w-64">
              <Search02Icon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Cari karyawan..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 focus:ring-[#4E61D3] focus:border-[#4E61D3] text-sm"
              />
            </div>
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="px-3 py-2 border border-gray-300 focus:ring-[#4E61D3] focus:border-[#4E61D3] text-sm w-48"
            >
              <option value="all">Semua Dept</option>
              {departments.map((dept) => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
            <Link
              href="/office/employees/new"
              className="flex items-center space-x-2 px-4 py-2 bg-[#4E61D3] text-white text-sm font-medium hover:bg-[#3d4fb5] transition-colors"
            >
              <Add01Icon className="h-4 w-4" />
              <span>Tambah Karyawan</span>
            </Link>
          </div>

          {/* Employees Table */}
          <div className="bg-white border border-gray-200 mx-6 mb-6">
            <div className="overflow-visible">
              {loading ? (
                <div className="p-8 text-center text-gray-500">Memuat data...</div>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="bg-[#4E61D3]">
                      <th className="px-6 py-4 text-left text-sm font-medium text-white border border-gray-300">ID</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-white border border-gray-300">Nama</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-white border border-gray-300">Posisi</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-white border border-gray-300">Departemen</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-white border border-gray-300">Kontak</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-white border border-gray-300">Tanggal Bergabung</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-white border border-gray-300">Status</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-white border border-gray-300">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEmployees.map((employee) => (
                      <tr key={employee.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 border border-gray-200">
                          <div className="text-sm font-medium text-gray-900">{employee.employee_id}</div>
                        </td>
                        <td className="px-6 py-4 border border-gray-200">
                          <div className="text-sm font-medium text-gray-900">{employee.full_name}</div>
                          <div className="text-xs text-gray-500">{employee.role_display}</div>
                        </td>
                        <td className="px-6 py-4 border border-gray-200">
                          <div className="text-sm text-gray-900">{employee.position}</div>
                        </td>
                        <td className="px-6 py-4 border border-gray-200">
                          <div className="text-sm text-gray-900">{employee.department_name}</div>
                        </td>
                        <td className="px-6 py-4 border border-gray-200">
                          <div className="flex items-center space-x-2 text-sm text-gray-900 mb-1">
                            <Mail01Icon className="h-3 w-3 text-gray-400" />
                            <span>{employee.email}</span>
                          </div>
                          {employee.phone && (
                            <div className="flex items-center space-x-2 text-sm text-gray-900">
                              <Call02Icon className="h-3 w-3 text-gray-400" />
                              <span>{employee.phone}</span>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 border border-gray-200">
                          <div className="text-sm text-gray-900">{formatDate(employee.hire_date)}</div>
                        </td>
                        <td className="px-6 py-4 border border-gray-200">
                          {getStatusBadge(employee.employment_status)}
                        </td>
                        <td className="px-6 py-4 border border-gray-200">
                          <div className="relative">
                            <button
                              onClick={() => setOpenMenuId(openMenuId === employee.id ? null : employee.id)}
                              className="p-2 border border-gray-300 hover:bg-gray-50 transition-colors"
                            >
                              <MoreHorizontalIcon className="h-4 w-4 text-gray-600" />
                            </button>
                            {openMenuId === employee.id && (
                              <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 shadow-lg z-10">
                                <Link
                                  href={`/office/employees/${employee.employee_id}`}
                                  className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                >
                                  <EyeIcon className="h-4 w-4" />
                                  <span>Lihat Detail</span>
                                </Link>
                                <Link
                                  href={`/office/employees/${employee.employee_id}/edit`}
                                  className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                >
                                  <PencilEdit02Icon className="h-4 w-4" />
                                  <span>Edit</span>
                                </Link>
                                <button
                                  className="flex items-center space-x-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors w-full text-left"
                                >
                                  <Delete02Icon className="h-4 w-4" />
                                  <span>Nonaktifkan</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredEmployees.length === 0 && !loading && (
                      <tr>
                        <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                          Tidak ada karyawan ditemukan
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </>
      )}

      {activeTab === 'schedules' && (
        <ScheduleTable />
      )}
    </OfficeLayout>
  );
}
