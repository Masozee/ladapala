'use client';

import { useState } from 'react';
import Link from 'next/link';
import OfficeLayout from '@/components/OfficeLayout';
import {
  UserMultipleIcon,
  Search02Icon,
  Add01Icon,
  Mail01Icon,
  Call02Icon,
  Calendar01Icon,
  Clock01Icon,
  UserCheckIcon,
  CancelCircleIcon,
  EyeIcon,
  PencilEdit02Icon,
  ChevronLeftIcon,
  ChevronRightIcon,
  FilterIcon,
  MoreHorizontalIcon
} from '@/lib/icons';

export default function EmployeesPage() {
  const [activeTab, setActiveTab] = useState<'employees' | 'schedules'>('employees');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [selectedShift, setSelectedShift] = useState('all');
  const [selectedWeek, setSelectedWeek] = useState(0);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);

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
      phone: '081234567890',
      email: 'siti.nurhaliza@hotel.com',
      joinDate: '2023-01-15',
      attendanceRate: 96,
      schedule: {
        monday: 'morning',
        tuesday: 'morning',
        wednesday: 'morning',
        thursday: 'morning',
        friday: 'morning',
        saturday: 'off',
        sunday: 'off'
      }
    },
    {
      id: 2,
      name: 'Ahmad Rizki',
      employeeId: 'EMP002',
      position: 'Security Officer',
      department: 'Security',
      shift: 'night',
      status: 'active',
      phone: '081234567891',
      email: 'ahmad.rizki@hotel.com',
      joinDate: '2022-08-20',
      attendanceRate: 94,
      schedule: {
        monday: 'night',
        tuesday: 'night',
        wednesday: 'off',
        thursday: 'night',
        friday: 'night',
        saturday: 'night',
        sunday: 'off'
      }
    },
    {
      id: 3,
      name: 'Maria Santos',
      employeeId: 'EMP003',
      position: 'Front Desk Agent',
      department: 'Front Office',
      shift: 'afternoon',
      status: 'active',
      phone: '081234567892',
      email: 'maria.santos@hotel.com',
      joinDate: '2023-03-10',
      attendanceRate: 98,
      schedule: {
        monday: 'afternoon',
        tuesday: 'afternoon',
        wednesday: 'afternoon',
        thursday: 'afternoon',
        friday: 'afternoon',
        saturday: 'morning',
        sunday: 'off'
      }
    },
    {
      id: 4,
      name: 'Budi Santoso',
      employeeId: 'EMP004',
      position: 'Maintenance Engineer',
      department: 'Engineering',
      shift: 'morning',
      status: 'active',
      phone: '081234567893',
      email: 'budi.santoso@hotel.com',
      joinDate: '2021-05-12',
      attendanceRate: 92,
      schedule: {
        monday: 'morning',
        tuesday: 'morning',
        wednesday: 'morning',
        thursday: 'morning',
        friday: 'morning',
        saturday: 'off',
        sunday: 'off'
      }
    },
    {
      id: 5,
      name: 'Dewi Lestari',
      employeeId: 'EMP005',
      position: 'Housekeeping Supervisor',
      department: 'Housekeeping',
      shift: 'morning',
      status: 'active',
      phone: '081234567894',
      email: 'dewi.lestari@hotel.com',
      joinDate: '2023-09-05',
      attendanceRate: 89,
      schedule: {
        monday: 'morning',
        tuesday: 'morning',
        wednesday: 'morning',
        thursday: 'morning',
        friday: 'morning',
        saturday: 'morning',
        sunday: 'off'
      }
    },
    {
      id: 6,
      name: 'Rahman Ali',
      employeeId: 'EMP006',
      position: 'Kitchen Staff',
      department: 'F&B',
      shift: 'morning',
      status: 'active',
      phone: '081234567895',
      email: 'rahman.ali@hotel.com',
      joinDate: '2022-11-18',
      attendanceRate: 95,
      schedule: {
        monday: 'morning',
        tuesday: 'morning',
        wednesday: 'morning',
        thursday: 'off',
        friday: 'morning',
        saturday: 'morning',
        sunday: 'afternoon'
      }
    }
  ];

  const departments = ['all', 'Housekeeping', 'Security', 'Front Office', 'Engineering', 'F&B'];
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

  const getShiftBadge = (shift: string) => {
    switch (shift) {
      case 'morning': return <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">Pagi</span>;
      case 'afternoon': return <span className="px-2 py-1 text-xs font-medium bg-orange-100 text-orange-800 rounded">Siang</span>;
      case 'night': return <span className="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded">Malam</span>;
      case 'off': return <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded">Libur</span>;
      default: return <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded">-</span>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded">Aktif</span>;
      case 'on_leave': return <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded">Cuti</span>;
      case 'inactive': return <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded">Non-aktif</span>;
      default: return <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded">{status}</span>;
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

  const activeEmployees = employees.filter(e => e.status === 'active').length;
  const avgAttendance = Math.round(employees.reduce((sum, e) => sum + e.attendanceRate, 0) / employees.length);
  const totalDepartments = new Set(employees.map(e => e.department)).size;

  const weekDates = getWeekDates(selectedWeek);

  return (
    <OfficeLayout>
      {/* Header with Tabs */}
      <div className="px-6 py-4 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Manajemen Karyawan</h1>
            <p className="text-sm text-gray-600 mt-1">Kelola data karyawan dan jadwal kerja</p>
          </div>
          <Link
            href="/office/employees/add"
            className="flex items-center space-x-2 px-4 py-2 bg-[#005357] text-white text-sm font-medium hover:bg-[#004147] transition-colors"
          >
            <Add01Icon className="h-4 w-4" />
            <span>Tambah Karyawan</span>
          </Link>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('employees')}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'employees'
                ? 'border-[#005357] text-[#005357] bg-gray-50'
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
                ? 'border-[#005357] text-[#005357] bg-gray-50'
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

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold text-gray-900">{employees.length}</div>
              <div className="text-sm text-gray-600 mt-1">Total Karyawan</div>
            </div>
            <div className="w-12 h-12 bg-[#005357] flex items-center justify-center">
              <UserMultipleIcon className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold text-gray-900">{activeEmployees}</div>
              <div className="text-sm text-gray-600 mt-1">Karyawan Aktif</div>
            </div>
            <div className="w-12 h-12 bg-green-600 flex items-center justify-center">
              <UserCheckIcon className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold text-gray-900">{avgAttendance}%</div>
              <div className="text-sm text-gray-600 mt-1">Tingkat Kehadiran</div>
            </div>
            <div className="w-12 h-12 bg-blue-600 flex items-center justify-center">
              <Clock01Icon className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold text-gray-900">{totalDepartments}</div>
              <div className="text-sm text-gray-600 mt-1">Departemen</div>
            </div>
            <div className="w-12 h-12 bg-purple-600 flex items-center justify-center">
              <UserMultipleIcon className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Employees Tab Content */}
      {activeTab === 'employees' && (
        <>
          {/* Filters - Right aligned, short */}
          <div className="flex items-center justify-end space-x-3 mb-6">
            <div className="relative w-64">
              <Search02Icon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Cari karyawan..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 focus:ring-[#005357] focus:border-[#005357] text-sm"
              />
            </div>

            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="px-3 py-2 border border-gray-300 focus:ring-[#005357] focus:border-[#005357] text-sm w-48"
            >
              <option value="all">Semua Departemen</option>
              {departments.filter(d => d !== 'all').map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>

            <select
              value={selectedShift}
              onChange={(e) => setSelectedShift(e.target.value)}
              className="px-3 py-2 border border-gray-300 focus:ring-[#005357] focus:border-[#005357] text-sm w-40"
            >
              <option value="all">Semua Shift</option>
              <option value="morning">Pagi</option>
              <option value="afternoon">Siang</option>
              <option value="night">Malam</option>
            </select>
          </div>

          {/* Table */}
          <div className="bg-white border border-gray-200">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-[#005357]">
                    <th className="px-6 py-4 text-left text-sm font-medium text-white border border-gray-300">ID Karyawan</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-white border border-gray-300">Nama</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-white border border-gray-300">Posisi</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-white border border-gray-300">Departemen</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-white border border-gray-300">Shift</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-white border border-gray-300">Kehadiran</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-white border border-gray-300">Status</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-white border border-gray-300">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEmployees.map((employee) => (
                    <tr key={employee.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 border border-gray-200">
                        <div className="text-sm font-medium text-gray-900">{employee.employeeId}</div>
                      </td>
                      <td className="px-6 py-4 border border-gray-200">
                        <div className="text-sm font-medium text-gray-900">{employee.name}</div>
                        <div className="text-xs text-gray-500 flex items-center space-x-2 mt-1">
                          <Mail01Icon className="h-3 w-3" />
                          <span>{employee.email}</span>
                        </div>
                        <div className="text-xs text-gray-500 flex items-center space-x-2">
                          <Call02Icon className="h-3 w-3" />
                          <span>{employee.phone}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 border border-gray-200">
                        <div className="text-sm text-gray-900">{employee.position}</div>
                      </td>
                      <td className="px-6 py-4 border border-gray-200">
                        <div className="text-sm text-gray-900">{employee.department}</div>
                      </td>
                      <td className="px-6 py-4 border border-gray-200">
                        {getShiftBadge(employee.shift)}
                      </td>
                      <td className="px-6 py-4 border border-gray-200">
                        <div className="text-sm font-medium text-gray-900">{employee.attendanceRate}%</div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                          <div
                            className="bg-green-600 h-1.5 rounded-full"
                            style={{ width: `${employee.attendanceRate}%` }}
                          ></div>
                        </div>
                      </td>
                      <td className="px-6 py-4 border border-gray-200">
                        {getStatusBadge(employee.status)}
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
                                href={`/office/employees/${employee.id}`}
                                className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                onClick={() => setOpenMenuId(null)}
                              >
                                <EyeIcon className="h-4 w-4" />
                                <span>Lihat Detail</span>
                              </Link>
                              <Link
                                href={`/office/employees/${employee.id}/edit`}
                                className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                onClick={() => setOpenMenuId(null)}
                              >
                                <PencilEdit02Icon className="h-4 w-4" />
                                <span>Edit Karyawan</span>
                              </Link>
                              <button
                                className="flex items-center space-x-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors w-full text-left"
                                onClick={() => {
                                  setOpenMenuId(null);
                                  // Handle delete action
                                }}
                              >
                                <CancelCircleIcon className="h-4 w-4" />
                                <span>Hapus Karyawan</span>
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
              <div className="text-center py-12">
                <UserMultipleIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Tidak ada karyawan yang sesuai dengan filter</p>
              </div>
            )}
          </div>
        </>
      )}

      {/* Schedules Tab Content */}
      {activeTab === 'schedules' && (
        <>
          {/* Week Navigation */}
          <div className="bg-white border border-gray-200 p-4 mb-6">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setSelectedWeek(selectedWeek - 1)}
                className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <ChevronLeftIcon className="h-4 w-4" />
                <span>Minggu Sebelumnya</span>
              </button>

              <div className="text-center">
                <div className="text-sm font-medium text-gray-900">
                  {weekDates[0].toLocaleDateString('id-ID', { day: 'numeric', month: 'long' })} - {weekDates[6].toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                </div>
                {selectedWeek === 0 && (
                  <div className="text-xs text-blue-600 mt-1">Minggu Ini</div>
                )}
              </div>

              <button
                onClick={() => setSelectedWeek(selectedWeek + 1)}
                className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <span>Minggu Berikutnya</span>
                <ChevronRightIcon className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Schedule Table */}
          <div className="bg-white border border-gray-200 overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[#005357]">
                  <th className="px-6 py-4 text-left text-sm font-medium text-white border border-gray-300 sticky left-0 bg-[#005357]">
                    Karyawan
                  </th>
                  {dayLabels.map((day, index) => (
                    <th key={day} className="px-6 py-4 text-center text-sm font-medium text-white border border-gray-300">
                      <div>{day}</div>
                      <div className="text-xs text-gray-200 mt-1">{weekDates[index].getDate()}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {employees.map((employee) => (
                  <tr key={employee.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 border border-gray-200 sticky left-0 bg-white">
                      <div className="text-sm font-medium text-gray-900">{employee.name}</div>
                      <div className="text-xs text-gray-500">{employee.employeeId}</div>
                      <div className="text-xs text-gray-500">{employee.department}</div>
                    </td>
                    {days.map((day) => (
                      <td key={day} className="px-6 py-4 border border-gray-200 text-center">
                        {getShiftBadge(employee.schedule[day as keyof typeof employee.schedule])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </OfficeLayout>
  );
}
