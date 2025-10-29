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
      const response = await fetch(buildApiUrl('user/employees/'), {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        // Ensure data is an array
        const employeesArray = Array.isArray(data) ? data : [];
        setEmployees(employeesArray);
        setFilteredEmployees(employeesArray);
      } else {
        console.error('Failed to fetch employees:', response.status);
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
        <div className="px-6 py-6">
          <div className="bg-white border border-gray-200 p-8 text-center">
            <p className="text-gray-500">Jadwal kerja akan segera tersedia</p>
          </div>
        </div>
      )}
    </OfficeLayout>
  );
}
