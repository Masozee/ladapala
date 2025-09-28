'use client';

import { useState } from 'react';
import Link from 'next/link';
import OfficeLayout from '@/components/OfficeLayout';
import { 
  Users, 
  Award, 
  Search, 
  Eye, 
  Edit, 
  Trash2, 
  UserCheck, 
  UserX, 
  AlertCircle, 
  Plus,
  Mail,
  Phone
} from 'lucide-react';

export default function EmployeesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [selectedShift, setSelectedShift] = useState('all');
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
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white shadow">
            <div className="p-6 bg-[#005357] text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-white">Total Karyawan</h3>
                  <p className="text-sm text-gray-100 mt-1">Staf operasional</p>
                </div>
                <div className="w-8 h-8 bg-white flex items-center justify-center">
                  <Users className="h-4 w-4 text-[#005357]" />
                </div>
              </div>
            </div>
            <div className="p-4 bg-gray-50">
              <div className="text-center">
                <div className="text-3xl font-bold text-[#005357] mb-2">{employees.length}</div>
                <div className="text-sm text-gray-600">karyawan</div>
              </div>
            </div>
          </div>

          <div className="bg-white shadow">
            <div className="p-6 bg-[#005357] text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-white">Sedang Bertugas</h3>
                  <p className="text-sm text-gray-100 mt-1">Hari ini</p>
                </div>
                <div className="w-8 h-8 bg-white flex items-center justify-center">
                  <UserCheck className="h-4 w-4 text-[#005357]" />
                </div>
              </div>
            </div>
            <div className="p-4 bg-gray-50">
              <div className="text-center">
                <div className="text-3xl font-bold text-[#005357] mb-2">
                  {employees.filter(emp => emp.status === 'active').length}
                </div>
                <div className="text-sm text-gray-600">sedang bekerja</div>
              </div>
            </div>
          </div>

          <div className="bg-white shadow">
            <div className="p-6 bg-[#005357] text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-white">Sedang Cuti</h3>
                  <p className="text-sm text-gray-100 mt-1">Tidak hadir</p>
                </div>
                <div className="w-8 h-8 bg-white flex items-center justify-center">
                  <UserX className="h-4 w-4 text-[#005357]" />
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

          <div className="bg-white shadow">
            <div className="p-6 bg-[#005357] text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-white">Kehadiran Rata-rata</h3>
                  <p className="text-sm text-gray-100 mt-1">Bulan ini</p>
                </div>
                <div className="w-8 h-8 bg-white flex items-center justify-center">
                  <Award className="h-4 w-4 text-[#005357]" />
                </div>
              </div>
            </div>
            <div className="p-4 bg-gray-50">
              <div className="text-center">
                <div className="text-3xl font-bold text-[#005357] mb-2">
                  {Math.round(employees.reduce((acc, emp) => acc + emp.attendanceRate, 0) / employees.length)}%
                </div>
                <div className="text-sm text-gray-600">kehadiran</div>
              </div>
            </div>
          </div>
        </div>

        {/* Employees Section */}
        <div className="bg-white shadow">
          <div className="p-6 bg-[#005357] text-white">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-white">Daftar Karyawan</h3>
                <p className="text-sm text-gray-100 mt-1">Manajemen data karyawan</p>
              </div>
              <div className="flex items-center space-x-3">
                <button className="bg-white text-[#005357] px-4 py-2 text-sm font-medium hover:bg-gray-100 transition-colors flex items-center space-x-2">
                  <Plus className="h-4 w-4" />
                  <span>Tambah Karyawan</span>
                </button>
                <div className="w-8 h-8 bg-white flex items-center justify-center">
                  <Users className="h-4 w-4 text-[#005357]" />
                </div>
              </div>
            </div>
          </div>
          
          <div className="p-6 bg-gray-50">
            {/* Filters and Search */}
            <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Cari karyawan..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#005357] focus:border-[#005357] w-64"
                  />
                </div>
                <select 
                  value={selectedDepartment}
                  onChange={(e) => setSelectedDepartment(e.target.value)}
                  className="px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#005357]"
                >
                  {departments.map(dept => (
                    <option key={dept} value={dept}>{getDepartmentLabel(dept)}</option>
                  ))}
                </select>
                <select 
                  value={selectedShift}
                  onChange={(e) => setSelectedShift(e.target.value)}
                  className="px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#005357]"
                >
                  {shifts.map(shift => (
                    <option key={shift} value={shift}>{getShiftFilterLabel(shift)}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Employee Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#005357]">
                  <tr>
                    <th className="text-left py-4 px-6 text-sm font-bold text-white uppercase tracking-wider">
                      Karyawan
                    </th>
                    <th className="text-left py-4 px-6 text-sm font-bold text-white uppercase tracking-wider">
                      Posisi & Departemen
                    </th>
                    <th className="text-left py-4 px-6 text-sm font-bold text-white uppercase tracking-wider">
                      Kontak
                    </th>
                    <th className="text-left py-4 px-6 text-sm font-bold text-white uppercase tracking-wider">
                      Shift & Status
                    </th>
                    <th className="text-left py-4 px-6 text-sm font-bold text-white uppercase tracking-wider">
                      Kehadiran
                    </th>
                    <th className="text-right py-4 px-6 text-sm font-bold text-white uppercase tracking-wider">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {filteredEmployees.map((employee) => (
                    <tr key={employee.id} className="hover:bg-gray-50 transition-colors">
                      {/* Employee Info */}
                      <td className="px-6 py-4">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-[#005357] flex items-center justify-center text-white font-bold">
                                {employee.name.charAt(0)}
                              </div>
                              <div>
                                <div className="font-semibold text-gray-900">{employee.name}</div>
                                <div className="text-sm text-gray-600">{employee.employeeId}</div>
                              </div>
                            </div>
                          </td>

                      {/* Position & Department */}
                      <td className="px-6 py-4">
                            <div>
                              <div className="font-medium text-gray-900">{employee.position}</div>
                              <div className="text-sm text-gray-600">{employee.department}</div>
                            </div>
                          </td>

                      {/* Contact */}
                      <td className="px-6 py-4">
                            <div className="space-y-1">
                              <div className="flex items-center space-x-2 text-sm">
                                <Mail className="h-3 w-3 text-gray-400" />
                                <span className="text-gray-600">{employee.email}</span>
                              </div>
                              <div className="flex items-center space-x-2 text-sm">
                                <Phone className="h-3 w-3 text-gray-400" />
                                <span className="text-gray-600">{employee.phone}</span>
                              </div>
                            </div>
                          </td>

                      {/* Shift & Status */}
                      <td className="px-6 py-4">
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

                      {/* Attendance */}
                      <td className="px-6 py-4">
                            <div className="flex flex-col items-start space-y-2">
                              <div className="flex items-center space-x-2">
                                <span className={`text-sm font-bold ${
                                  employee.attendanceRate >= 95 ? 'text-green-600' :
                                  employee.attendanceRate >= 90 ? 'text-yellow-600' :
                                  'text-red-600'
                                }`}>
                                  {employee.attendanceRate}%
                                </span>
                              </div>
                              <div className="w-16 bg-gray-200 h-1.5">
                                <div 
                                  className={`h-1.5 ${
                                    employee.attendanceRate >= 95 ? 'bg-green-500' :
                                    employee.attendanceRate >= 90 ? 'bg-yellow-500' :
                                    'bg-red-500'
                                  }`}
                                  style={{ width: `${employee.attendanceRate}%` }}
                                ></div>
                              </div>
                              <div className="text-xs text-gray-500">
                                Terakhir: {employee.lastAttendance}
                              </div>
                            </div>
                          </td>

                      {/* Actions */}
                      <td className="px-6 py-4">
                            <div className="flex items-center justify-end space-x-2">
                              <Link 
                                href={`/office/employees/${employee.id}`}
                                className="p-2 text-gray-400 hover:text-[#005357] hover:bg-gray-100 transition-colors rounded"
                                title="Lihat Detail"
                              >
                                <Eye className="h-4 w-4" />
                              </Link>
                              <button 
                                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors rounded"
                                title="Edit Karyawan"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button 
                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors rounded"
                                title="Hapus"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredEmployees.length === 0 && (
              <div className="text-center py-8">
                <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Tidak ada karyawan yang sesuai dengan filter.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </OfficeLayout>
  );
}