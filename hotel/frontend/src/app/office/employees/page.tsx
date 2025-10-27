'use client';

import { useState } from 'react';
import Link from 'next/link';
import OfficeLayout from '@/components/OfficeLayout';
import {
  UserMultipleIcon,
  SparklesIcon,
  Search02Icon,
  EyeIcon,
  PencilEdit02Icon,
  CancelCircleIcon,
  UserCheckIcon,
  Cancel01Icon,
  AlertCircleIcon,
  Add01Icon,
  Mail01Icon,
  Call02Icon,
  Calendar01Icon,
  Clock01Icon,
  ChevronLeftIcon,
  ChevronRightIcon,
  MoreHorizontalIcon
} from '@/lib/icons';

export default function EmployeesPage() {
  const [activeTab, setActiveTab] = useState<'employees' | 'schedules'>('employees');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [selectedShift, setSelectedShift] = useState('all');
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [selectedWeek, setSelectedWeek] = useState(0); // 0 = current week

  // Sample employee data
  const employees = [
    {
      id: 1,
      name: 'Siti Nurhaliza',
      employeeId: 'EMP001',
      position: 'Housekeeping Staff',
      department: 'Housekeeping',
      shift: 'morning',
      status: 'active',
      schedule: {
        monday: 'morning',
        tuesday: 'morning',
        wednesday: 'morning',
        thursday: 'morning',
        friday: 'morning',
        saturday: 'off',
        sunday: 'off'
      },
      phone: '081234567890',
      email: 'siti.nurhaliza@kapulaga.com',
      joinDate: '2023-01-15',
      lastAttendance: '2024-01-28 07:00',
      attendanceRate: 96,
      salary: 4500000
    },
    {
      id: 2,
      name: 'Ahmad Rizki',
      employeeId: 'EMP002',
      position: 'Security Officer',
      department: 'Security',
      shift: 'night',
      status: 'active',
      schedule: {
        monday: 'night',
        tuesday: 'night',
        wednesday: 'off',
        thursday: 'night',
        friday: 'night',
        saturday: 'night',
        sunday: 'off'
      },
      phone: '081234567891',
      email: 'ahmad.rizki@kapulaga.com',
      joinDate: '2022-08-20',
      lastAttendance: '2024-01-28 22:00',
      attendanceRate: 94,
      salary: 5000000
    },
    {
      id: 3,
      name: 'Maria Santos',
      employeeId: 'EMP003',
      position: 'Front Desk Agent',
      department: 'Front Office',
      shift: 'afternoon',
      status: 'active',
      schedule: {
        monday: 'afternoon',
        tuesday: 'afternoon',
        wednesday: 'afternoon',
        thursday: 'afternoon',
        friday: 'afternoon',
        saturday: 'morning',
        sunday: 'off'
      },
      phone: '081234567892',
      email: 'maria.santos@kapulaga.com',
      joinDate: '2023-05-10',
      lastAttendance: '2024-01-28 14:00',
      attendanceRate: 98,
      salary: 5500000
    },
    {
      id: 4,
      name: 'Budi Santoso',
      employeeId: 'EMP004',
      position: 'Maintenance Technician',
      department: 'Engineering',
      shift: 'morning',
      status: 'active',
      schedule: {
        monday: 'morning',
        tuesday: 'morning',
        wednesday: 'morning',
        thursday: 'morning',
        friday: 'morning',
        saturday: 'off',
        sunday: 'off'
      },
      phone: '081234567893',
      email: 'budi.santoso@kapulaga.com',
      joinDate: '2021-03-12',
      lastAttendance: '2024-01-28 07:30',
      attendanceRate: 92,
      salary: 4800000
    },
    {
      id: 5,
      name: 'Dewi Lestari',
      employeeId: 'EMP005',
      position: 'F&B Service Staff',
      department: 'F&B',
      shift: 'afternoon',
      status: 'on_leave',
      schedule: {
        monday: 'afternoon',
        tuesday: 'afternoon',
        wednesday: 'off',
        thursday: 'afternoon',
        friday: 'afternoon',
        saturday: 'afternoon',
        sunday: 'morning'
      },
      phone: '081234567894',
      email: 'dewi.lestari@kapulaga.com',
      joinDate: '2023-09-05',
      lastAttendance: '2024-01-25 14:00',
      attendanceRate: 89,
      salary: 4200000
    },
    {
      id: 6,
      name: 'Rahman Ali',
      employeeId: 'EMP006',
      position: 'Kitchen Staff',
      department: 'F&B',
      shift: 'morning',
      status: 'active',
      schedule: {
        monday: 'morning',
        tuesday: 'morning',
        wednesday: 'morning',
        thursday: 'off',
        friday: 'morning',
        saturday: 'morning',
        sunday: 'afternoon'
      },
      phone: '081234567895',
      email: 'rahman.ali@kapulaga.com',
      joinDate: '2022-11-18',
      lastAttendance: '2024-01-28 06:00',
      attendanceRate: 95,
      salary: 4300000
    }
  ];

  const departments = ['all', 'Housekeeping', 'Security', 'Front Office', 'Engineering', 'F&B'];
  const shifts = ['all', 'morning', 'afternoon', 'night'];

  // Schedule helpers
  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const dayLabels = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];

  const getWeekDates = (weekOffset: number) => {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay() + 1 + (weekOffset * 7));

    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      return date;
    });
  };

  const weekDates = getWeekDates(selectedWeek);

  const formatWeekRange = (dates: Date[]) => {
    const start = dates[0];
    const end = dates[6];
    return `${start.getDate()}/${start.getMonth() + 1} - ${end.getDate()}/${end.getMonth() + 1}/${end.getFullYear()}`;
  };

  const getShiftLabel = (shift: string) => {
    switch (shift) {
      case 'morning': return 'Pagi (07:00-15:00)';
      case 'afternoon': return 'Siang (15:00-23:00)';
      case 'night': return 'Malam (23:00-07:00)';
      case 'off': return 'Libur';
      default: return shift;
    }
  };

  const getShiftColor = (shift: string) => {
    switch (shift) {
      case 'morning': return 'bg-yellow-100 text-yellow-800';
      case 'afternoon': return 'bg-blue-100 text-blue-800';
      case 'night': return 'bg-purple-100 text-purple-800';
      case 'off': return 'bg-gray-100 text-gray-500';
      default: return 'bg-gray-100 text-gray-500';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'on_leave': return 'bg-yellow-100 text-yellow-800';
      case 'inactive': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-500';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'Aktif';
      case 'on_leave': return 'Cuti';
      case 'inactive': return 'Non-aktif';
      default: return status;
    }
  };

  const getDepartmentLabel = (dept: string) => {
    switch (dept) {
      case 'all': return 'Semua Departemen';
      case 'Housekeeping': return 'Housekeeping';
      case 'Security': return 'Keamanan';
      case 'Front Office': return 'Front Office';
      case 'Engineering': return 'Teknik';
      case 'F&B': return 'F&B';
      default: return dept;
    }
  };

  const getShiftFilterLabel = (shift: string) => {
    switch (shift) {
      case 'all': return 'Semua Shift';
      case 'morning': return 'Shift Pagi';
      case 'afternoon': return 'Shift Siang';
      case 'night': return 'Shift Malam';
      default: return shift;
    }
  };

  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         emp.employeeId.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         emp.position.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDepartment = selectedDepartment === 'all' || emp.department === selectedDepartment;
    const matchesShift = selectedShift === 'all' || emp.shift === selectedShift;
    return matchesSearch && matchesDepartment && matchesShift;
  });

  return (
    <OfficeLayout>
      <div className="space-y-6">
        {/* Header with Tabs */}
        <div className="bg-white border border-gray-200">
          <div className="p-6 bg-[#4E61D3] text-white">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-white">Manajemen Karyawan & Jadwal</h1>
                <p className="text-sm text-gray-100 mt-1">Data karyawan dan jadwal kerja</p>
              </div>
              <div className="w-8 h-8 bg-white flex items-center justify-center">
                <UserMultipleIcon className="h-4 w-4 text-[#4E61D3]" />
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200">
            <div className="flex">
              <button
                onClick={() => setActiveTab('employees')}
                className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'employees'
                    ? 'border-[#4E61D3] text-[#4E61D3] bg-gray-50'
                    : 'border-transparent text-gray-600 hover:text-gray-800 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <UserMultipleIcon className="h-4 w-4" />
                  <span>Daftar Karyawan</span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab('schedules')}
                className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'schedules'
                    ? 'border-[#4E61D3] text-[#4E61D3] bg-gray-50'
                    : 'border-transparent text-gray-600 hover:text-gray-800 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Calendar01Icon className="h-4 w-4" />
                  <span>Jadwal Kerja</span>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Employees Tab Content */}
        {activeTab === 'employees' && (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white border border-gray-200">
                <div className="p-6 bg-[#4E61D3] text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-white">Total Karyawan</h3>
                      <p className="text-sm text-gray-100 mt-1">Staf operasional</p>
                    </div>
                    <div className="w-8 h-8 bg-white flex items-center justify-center">
                      <UserMultipleIcon className="h-4 w-4 text-[#4E61D3]" />
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-gray-50">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-[#4E61D3] mb-2">{employees.length}</div>
                    <div className="text-sm text-gray-600">karyawan</div>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-gray-200">
                <div className="p-6 bg-[#4E61D3] text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-white">Sedang Bertugas</h3>
                      <p className="text-sm text-gray-100 mt-1">Hari ini</p>
                    </div>
                    <div className="w-8 h-8 bg-white flex items-center justify-center">
                      <UserCheckIcon className="h-4 w-4 text-[#4E61D3]" />
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-gray-50">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-[#4E61D3] mb-2">
                      {employees.filter(emp => emp.status === 'active').length}
                    </div>
                    <div className="text-sm text-gray-600">sedang bekerja</div>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-gray-200">
                <div className="p-6 bg-[#4E61D3] text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-white">Sedang Cuti</h3>
                      <p className="text-sm text-gray-100 mt-1">Tidak hadir</p>
                    </div>
                    <div className="w-8 h-8 bg-white flex items-center justify-center">
                      <Cancel01Icon className="h-4 w-4 text-[#4E61D3]" />
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-gray-50">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-yellow-600 mb-2">
                      {employees.filter(emp => emp.status === 'on_leave').length}
                    </div>
                    <div className="text-sm text-gray-600">cuti hari ini</div>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-gray-200">
                <div className="p-6 bg-[#4E61D3] text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-white">Kehadiran Rata-rata</h3>
                      <p className="text-sm text-gray-100 mt-1">Bulan ini</p>
                    </div>
                    <div className="w-8 h-8 bg-white flex items-center justify-center">
                      <SparklesIcon className="h-4 w-4 text-[#4E61D3]" />
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-gray-50">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-[#4E61D3] mb-2">
                      {Math.round(employees.reduce((acc, emp) => acc + emp.attendanceRate, 0) / employees.length)}%
                    </div>
                    <div className="text-sm text-gray-600">kehadiran</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Employees List */}
            <div className="bg-white border border-gray-200">
              <div className="p-6 bg-[#4E61D3] text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-white">Daftar Karyawan</h3>
                    <p className="text-sm text-gray-100 mt-1">Manajemen data karyawan</p>
                  </div>
                  <button className="bg-white text-[#4E61D3] px-4 py-2 text-sm font-medium hover:bg-gray-100 transition-colors flex items-center space-x-2">
                    <Add01Icon className="h-4 w-4" />
                    <span>Tambah Karyawan</span>
                  </button>
                </div>
              </div>

              <div className="p-6 bg-gray-50">
                {/* Filters and Search */}
                <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search02Icon className="h-4 w-4 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        placeholder="Cari karyawan..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 pr-4 py-2 border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#4E61D3] focus:border-[#4E61D3] w-64"
                      />
                    </div>
                    <select
                      value={selectedDepartment}
                      onChange={(e) => setSelectedDepartment(e.target.value)}
                      className="px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#4E61D3]"
                    >
                      {departments.map(dept => (
                        <option key={dept} value={dept}>{getDepartmentLabel(dept)}</option>
                      ))}
                    </select>
                    <select
                      value={selectedShift}
                      onChange={(e) => setSelectedShift(e.target.value)}
                      className="px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#4E61D3]"
                    >
                      {shifts.map(shift => (
                        <option key={shift} value={shift}>{getShiftFilterLabel(shift)}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Employee Table */}
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead className="bg-[#4E61D3]">
                      <tr>
                        <th className="border border-gray-300 text-left py-4 px-6 text-sm font-bold text-white uppercase tracking-wider">
                          Karyawan
                        </th>
                        <th className="border border-gray-300 text-left py-4 px-6 text-sm font-bold text-white uppercase tracking-wider">
                          Posisi & Departemen
                        </th>
                        <th className="border border-gray-300 text-left py-4 px-6 text-sm font-bold text-white uppercase tracking-wider">
                          Email
                        </th>
                        <th className="border border-gray-300 text-left py-4 px-6 text-sm font-bold text-white uppercase tracking-wider">
                          Phone
                        </th>
                        <th className="border border-gray-300 text-left py-4 px-6 text-sm font-bold text-white uppercase tracking-wider">
                          Shift & Status
                        </th>
                        <th className="border border-gray-300 text-left py-4 px-6 text-sm font-bold text-white uppercase tracking-wider">
                          Kehadiran
                        </th>
                        <th className="border border-gray-300 text-center py-4 px-6 text-sm font-bold text-white uppercase tracking-wider w-[80px]">
                          Aksi
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white">
                      {filteredEmployees.map((employee) => (
                        <tr key={employee.id} className="hover:bg-gray-50 transition-colors">
                          <td className="border border-gray-200 px-6 py-4">
                            <div>
                              <div className="font-semibold text-gray-900">{employee.name}</div>
                              <div className="text-sm text-gray-600">{employee.employeeId}</div>
                            </div>
                          </td>
                          <td className="border border-gray-200 px-6 py-4">
                            <div>
                              <div className="font-medium text-gray-900">{employee.position}</div>
                              <div className="text-sm text-gray-600">{employee.department}</div>
                            </div>
                          </td>
                          <td className="border border-gray-200 px-6 py-4">
                            <span className="text-sm text-gray-600">{employee.email}</span>
                          </td>
                          <td className="border border-gray-200 px-6 py-4">
                            <span className="text-sm text-gray-600">{employee.phone}</span>
                          </td>
                          <td className="border border-gray-200 px-6 py-4">
                            <div className="space-y-2">
                              <span className={`inline-flex px-2 py-1 text-xs font-medium ${getShiftColor(employee.shift)}`}>
                                {getShiftLabel(employee.shift)}
                              </span>
                              <br />
                              <span className={`inline-flex px-2 py-1 text-xs font-medium ${getStatusColor(employee.status)}`}>
                                {getStatusLabel(employee.status)}
                              </span>
                            </div>
                          </td>
                          <td className="border border-gray-200 px-6 py-4">
                            <span className={`text-sm font-bold ${
                              employee.attendanceRate >= 95 ? 'text-green-600' :
                              employee.attendanceRate >= 90 ? 'text-yellow-600' :
                              'text-red-600'
                            }`}>
                              {employee.attendanceRate}%
                            </span>
                          </td>
                          <td className="border border-gray-200 px-6 py-4">
                            <div className="flex items-center justify-center relative">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOpenMenuId(openMenuId === employee.id ? null : employee.id);
                                }}
                                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors rounded"
                                title="Actions"
                              >
                                <MoreHorizontalIcon className="h-5 w-5" />
                              </button>

                              {openMenuId === employee.id && (
                                <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 shadow-lg z-10">
                                  <Link
                                    href={`/office/employees/${employee.id}`}
                                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                  >
                                    <EyeIcon className="h-4 w-4 mr-3 text-gray-400" />
                                    Lihat Detail
                                  </Link>
                                  <button
                                    className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                  >
                                    <PencilEdit02Icon className="h-4 w-4 mr-3 text-gray-400" />
                                    Edit Karyawan
                                  </button>
                                  <button
                                    className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                                  >
                                    <Cancel01Icon className="h-4 w-4 mr-3" />
                                    Hapus
                                  </button>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {filteredEmployees.length === 0 && (
                  <div className="text-center py-8">
                    <AlertCircleIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Tidak ada karyawan yang sesuai dengan filter.</p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* Schedules Tab Content */}
        {activeTab === 'schedules' && (
          <>
            {/* Week Navigation & Filters */}
            <div className="bg-white border border-gray-200">
              <div className="p-6">
                {/* Week Navigation */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={() => setSelectedWeek(selectedWeek - 1)}
                      className="p-2 hover:bg-gray-100 transition-colors"
                    >
                      <ChevronLeftIcon className="h-5 w-5 text-gray-600" />
                    </button>
                    <div className="text-center">
                      <h2 className="text-lg font-semibold text-gray-900">
                        Minggu {formatWeekRange(weekDates)}
                      </h2>
                      <p className="text-sm text-gray-600">
                        {selectedWeek === 0 ? 'Minggu ini' :
                         selectedWeek > 0 ? `${selectedWeek} minggu ke depan` :
                         `${Math.abs(selectedWeek)} minggu lalu`}
                      </p>
                    </div>
                    <button
                      onClick={() => setSelectedWeek(selectedWeek + 1)}
                      className="p-2 hover:bg-gray-100 transition-colors"
                    >
                      <ChevronRightIcon className="h-5 w-5 text-gray-600" />
                    </button>
                  </div>

                  {selectedWeek !== 0 && (
                    <button
                      onClick={() => setSelectedWeek(0)}
                      className="px-3 py-1 text-sm bg-[#4E61D3] text-white hover:bg-[#3D4EA8] transition-colors"
                    >
                      Kembali ke Minggu Ini
                    </button>
                  )}
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
                        placeholder="Cari karyawan..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 pr-4 py-2 border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#4E61D3] focus:border-[#4E61D3] w-64"
                      />
                    </div>
                    <select
                      value={selectedDepartment}
                      onChange={(e) => setSelectedDepartment(e.target.value)}
                      className="px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#4E61D3]"
                    >
                      {departments.map(dept => (
                        <option key={dept} value={dept}>{getDepartmentLabel(dept)}</option>
                      ))}
                    </select>
                    <select
                      value={selectedShift}
                      onChange={(e) => setSelectedShift(e.target.value)}
                      className="px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#4E61D3]"
                    >
                      {shifts.map(shift => (
                        <option key={shift} value={shift}>{getShiftFilterLabel(shift)}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center space-x-2 text-xs">
                    <div className="flex items-center space-x-1">
                      <div className="w-3 h-3 bg-yellow-500"></div>
                      <span>Pagi (07:00-15:00)</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <div className="w-3 h-3 bg-blue-500"></div>
                      <span>Siang (15:00-23:00)</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <div className="w-3 h-3 bg-purple-500"></div>
                      <span>Malam (23:00-07:00)</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <div className="w-3 h-3 bg-gray-300"></div>
                      <span>Libur</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Calendar Schedule Table */}
            <div className="bg-white border border-gray-200">
              <div className="p-4 bg-gray-50">
                <div className="overflow-x-auto">
                  <div style={{ minWidth: `${250 + (7 * 120)}px` }}>
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-[#4E61D3]">
                          <th className="border border-gray-300 text-left py-3 px-4 text-sm font-bold text-white uppercase tracking-wider w-[200px]">
                            Karyawan
                          </th>
                          <th className="border border-gray-300 text-center py-3 px-4 text-sm font-bold text-white uppercase tracking-wider w-[50px]">
                            Shift
                          </th>
                          {dayLabels.map((day, index) => (
                            <th key={index} className="text-center py-3 px-2 text-xs font-bold text-white uppercase tracking-wider min-w-[120px]">
                              <div>
                                <div className="text-sm font-bold">{day}</div>
                                <div className="text-xs opacity-90">
                                  {weekDates[index].getDate()}/{weekDates[index].getMonth() + 1}
                                </div>
                              </div>
                            </th>
                          ))}
                          <th className="border border-gray-300 text-center py-3 px-4 text-sm font-bold text-white uppercase tracking-wider w-[80px]">
                            Aksi
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white">
                        {filteredEmployees.map((employee) => (
                          <tr key={employee.id} className="hover:bg-gray-50 transition-colors">
                            <td className="py-4 px-4 font-medium text-gray-900 w-[200px] border-r border-gray-200">
                              <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-[#4E61D3] flex items-center justify-center text-white font-bold">
                                  {employee.name.charAt(0)}
                                </div>
                                <div>
                                  <div className="font-bold text-sm">{employee.name}</div>
                                  <div className="text-xs text-gray-600">{employee.position}</div>
                                  <div className="text-xs text-gray-500">{employee.department}</div>
                                </div>
                              </div>
                            </td>

                            <td className="py-4 px-4 text-center w-[50px] border-r border-gray-200">
                              <span className={`inline-flex px-2 py-1 text-xs font-medium ${getShiftColor(employee.shift)}`}>
                                {employee.shift === 'morning' ? 'P' : employee.shift === 'afternoon' ? 'S' : 'M'}
                              </span>
                            </td>

                            {days.map((day, dayIndex) => {
                              const shift = employee.schedule[day as keyof typeof employee.schedule];
                              const isToday = weekDates[dayIndex].toDateString() === new Date().toDateString();

                              return (
                                <td key={dayIndex} className={`py-2 px-1 text-center text-xs border-l border-gray-100 ${isToday ? 'bg-blue-50' : ''}`}>
                                  {shift !== 'off' ? (
                                    <div
                                      className={`mx-1 px-3 py-4 text-xs font-medium text-white cursor-pointer hover:opacity-90 transition-opacity ${
                                        shift === 'morning' ? 'bg-yellow-500' :
                                        shift === 'afternoon' ? 'bg-blue-500' :
                                        shift === 'night' ? 'bg-purple-500' :
                                        'bg-gray-300'
                                      }`}
                                      title={`${employee.name}\n${getShiftLabel(shift)}\n${employee.position}`}
                                    >
                                      <div className="font-semibold">
                                        {shift === 'morning' ? 'PAGI' : shift === 'afternoon' ? 'SIANG' : shift === 'night' ? 'MALAM' : 'OFF'}
                                      </div>
                                      <div className="text-xs mt-1 opacity-90">
                                        {shift === 'morning' ? '07-15' : shift === 'afternoon' ? '15-23' : shift === 'night' ? '23-07' : ''}
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="text-gray-300 text-xs py-4">
                                      Libur
                                    </div>
                                  )}
                                </td>
                              );
                            })}

                            <td className="border border-gray-200 px-4 py-4 text-center">
                              <div className="flex items-center justify-center space-x-1">
                                <Link
                                  href={`/office/employees/${employee.id}`}
                                  className="p-1 text-gray-400 hover:text-[#4E61D3] hover:bg-gray-100 transition-colors rounded"
                                  title="Lihat Karyawan"
                                >
                                  <EyeIcon className="h-4 w-4" />
                                </Link>
                                <button
                                  className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors rounded"
                                  title="Edit Jadwal"
                                >
                                  <PencilEdit02Icon className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {filteredEmployees.length === 0 && (
                  <div className="text-center py-8">
                    <AlertCircleIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Tidak ada karyawan yang sesuai dengan filter.</p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </OfficeLayout>
  );
}
