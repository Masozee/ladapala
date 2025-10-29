'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import OfficeLayout from '@/components/OfficeLayout';
import { buildApiUrl } from '@/lib/config';
import {
  UserMultipleIcon,
  Search02Icon,
  Add01Icon,
  Mail01Icon,
  Call02Icon,
  MoreHorizontalIcon,
  EyeIcon,
  PencilEdit02Icon,
  Delete02Icon
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
      const employeesData = await employeesRes.json();
      const employees = employeesData.results || [];

      // Get shifts for the week
      const startDate = weekDates[0].toISOString().split('T')[0];
      const endDate = weekDates[6].toISOString().split('T')[0];

      const shiftsRes = await fetch(
        buildApiUrl(`user/shifts-manage/?from_date=${startDate}&to_date=${endDate}`),
        { credentials: 'include' }
      );
      const shiftsData = await shiftsRes.json();
      const shifts = shiftsData.results || shiftsData || [];

      // Organize shifts by employee and date
      const scheduleMap: { [empId: string]: EmployeeSchedule } = {};

      employees.forEach((emp: Employee) => {
        scheduleMap[emp.employee_id] = {
          employee_id: emp.employee_id,
          employee_name: emp.full_name,
          department: emp.department_name,
          shifts: {}
        };
      });

      shifts.forEach((shift: Shift) => {
        const employee = employees.find((e: Employee) => e.id === shift.employee);
        if (employee && scheduleMap[employee.employee_id]) {
          const dateKey = shift.shift_date;
          if (!scheduleMap[employee.employee_id].shifts[dateKey]) {
            scheduleMap[employee.employee_id].shifts[dateKey] = [];
          }
          scheduleMap[employee.employee_id].shifts[dateKey].push(shift);
        }
      });

      setSchedules(Object.values(scheduleMap));
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
      <span className={`inline-block px-2 py-1 text-xs font-medium ${badge.bg} ${badge.text} rounded mb-1`}>
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
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="flex">
          {/* Left Side: Frozen Employee Column */}
          <div className="flex-shrink-0 w-72 border-r-2 border-gray-300">
            {/* Employee Header */}
            <div className="bg-[#4E61D3] text-white px-6 py-4 border-b-2 border-gray-300" style={{ height: '72px' }}>
              <div className="font-semibold text-sm uppercase tracking-wide">Karyawan</div>
            </div>

            {/* Employee Rows */}
            <div className="overflow-y-auto" style={{ maxHeight: '600px' }}>
              {schedules.map((schedule, idx) => {
                const isEven = idx % 2 === 0;
                return (
                  <div
                    key={schedule.employee_id}
                    className={`px-6 py-5 border-b border-gray-200 ${
                      isEven ? 'bg-gray-50' : 'bg-white'
                    }`}
                    style={{ height: '88px' }}
                  >
                    <div className="font-semibold text-sm text-gray-900 mb-1">
                      {schedule.employee_name}
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-gray-600 font-medium">
                        {schedule.employee_id}
                      </div>
                      <div className="text-xs text-gray-500 bg-white px-2 py-1 rounded border border-gray-200">
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
          <div className="flex-1 overflow-x-auto overflow-y-auto" style={{ maxHeight: '672px' }}>
            {/* Date Headers - Fixed at top */}
            <div className="flex border-b-2 border-gray-300 sticky top-0 z-10">
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
                        ? 'bg-gray-200 text-gray-800'
                        : 'bg-[#4E61D3] text-white'
                    }`}
                    style={{ height: '72px' }}
                  >
                    <div className="text-xs font-semibold uppercase tracking-wide mb-0.5">
                      {formatDayName(date)}
                    </div>
                    <div className="text-sm font-bold">
                      {formatDate(date)}
                    </div>
                    {isToday && (
                      <div className="text-xs mt-1 opacity-90">Hari Ini</div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Schedule Grid - All rows scroll together */}
            <div>
              {schedules.map((schedule, idx) => {
                const isEven = idx % 2 === 0;

                return (
                  <div key={schedule.employee_id} className="flex border-b border-gray-200">
                    {weekDates.map((date, dateIndex) => {
                      const dateKey = date.toISOString().split('T')[0];
                      const shifts = schedule.shifts[dateKey] || [];
                      const isWeekend = date.getDay() === 0 || date.getDay() === 6;

                      return (
                        <div
                          key={dateIndex}
                          className={`flex-shrink-0 w-[180px] px-3 py-5 border-r border-gray-200 last:border-r-0 ${
                            isEven ? 'bg-white' : 'bg-gray-50'
                          } ${isWeekend ? 'bg-gray-100/30' : ''} hover:bg-blue-50 transition-colors`}
                          style={{ height: '88px' }}
                        >
                          {shifts.length > 0 ? (
                            <div className="space-y-2 overflow-y-auto h-full">
                              {shifts.map((shift) => (
                                <div key={shift.id} className="bg-white p-2 rounded border border-gray-200 shadow-sm">
                                  {getShiftBadge(shift.shift_type)}
                                  <div className="text-xs font-semibold text-gray-800 mt-1">
                                    {shift.start_time.substring(0, 5)} - {shift.end_time.substring(0, 5)}
                                  </div>
                                  {shift.notes && (
                                    <div className="text-xs text-gray-600 mt-1 truncate" title={shift.notes}>
                                      📝 {shift.notes}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="flex items-center justify-center h-full">
                              <div className="text-xs text-gray-400">—</div>
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
            <div className="overflow-x-auto">
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
