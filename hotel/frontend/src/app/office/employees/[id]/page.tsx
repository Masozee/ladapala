'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import OfficeLayout from '@/components/OfficeLayout';
import { buildApiUrl } from '@/lib/config';
import {
  ChevronLeftIcon,
  UserIcon,
  Mail01Icon,
  Call02Icon,
  Calendar01Icon,
  Clock01Icon,
  UserCheckIcon,
  PencilEdit02Icon,
  Building03Icon,
  Location01Icon,
  Shield01Icon,
  ArrowUp01Icon,
  CancelCircleIcon
} from '@/lib/icons';

interface EmployeeDetailPageProps {
  params: Promise<{ id: string }>;
}

interface Employee {
  id: number;
  employee_id: string;
  full_name: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  address: string;
  date_of_birth: string | null;
  position: string;
  department: number;
  department_name: string;
  hire_date: string;
  salary: string;
  employment_status: string;
  employment_status_display: string;
  emergency_contact: string;
  emergency_phone: string;
  emergency_relationship: string;
  role: string;
  role_display: string;
  is_active: boolean;
  attendanceRate?: number;
}

export default function EmployeeDetailPage({ params }: EmployeeDetailPageProps) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'info' | 'attendance' | 'performance'>('info');
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEmployee();
  }, [resolvedParams.id]);

  const fetchEmployee = async () => {
    try {
      setLoading(true);
      const response = await fetch(buildApiUrl(`user/employees/?employee_id=${resolvedParams.id}`), {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        const employees = data.results || data || [];
        const foundEmployee = employees.find((emp: Employee) => emp.employee_id === resolvedParams.id);
        if (foundEmployee) {
          setEmployee(foundEmployee);
        } else {
          alert('Employee not found');
          router.push('/office/employees');
        }
      } else {
        alert('Failed to fetch employee data');
      }
    } catch (error) {
      console.error('Error fetching employee:', error);
      alert('Error loading employee data');
    } finally {
      setLoading(false);
    }
  };

  // Sample data for tabs that don't have API yet
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
      birthDate: '1995-08-15',
      address: 'Jl. Merdeka No. 123, Jakarta Pusat',
      emergencyContact: {
        name: 'Budi Nurhaliza',
        relationship: 'Suami',
        phone: '081234567899'
      },
      salary: 4500000,
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
      birthDate: '1990-03-22',
      address: 'Jl. Sudirman No. 45, Jakarta Selatan',
      emergencyContact: {
        name: 'Siti Rizki',
        relationship: 'Istri',
        phone: '081234567888'
      },
      salary: 5000000,
      schedule: {
        monday: 'night',
        tuesday: 'night',
        wednesday: 'off',
        thursday: 'night',
        friday: 'night',
        saturday: 'night',
        sunday: 'off'
      }
    }
  ];

  const attendanceData = [
    { date: '2024-10-01', status: 'present', checkIn: '07:00', checkOut: '15:00' },
    { date: '2024-10-02', status: 'present', checkIn: '07:05', checkOut: '15:10' },
    { date: '2024-10-03', status: 'present', checkIn: '06:55', checkOut: '15:00' },
    { date: '2024-10-04', status: 'late', checkIn: '07:30', checkOut: '15:30' },
    { date: '2024-10-05', status: 'present', checkIn: '07:00', checkOut: '15:05' },
    { date: '2024-10-06', status: 'off', checkIn: null, checkOut: null },
    { date: '2024-10-07', status: 'off', checkIn: null, checkOut: null }
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return <span className="px-3 py-1 text-sm font-medium bg-green-100 text-green-800 rounded">Aktif</span>;
      case 'on_leave': return <span className="px-3 py-1 text-sm font-medium bg-yellow-100 text-yellow-800 rounded">Cuti</span>;
      case 'inactive': return <span className="px-3 py-1 text-sm font-medium bg-red-100 text-red-800 rounded">Non-aktif</span>;
      default: return <span className="px-3 py-1 text-sm font-medium bg-gray-100 text-gray-600 rounded">{status}</span>;
    }
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

  const getAttendanceStatusBadge = (status: string) => {
    switch (status) {
      case 'present': return <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded">Hadir</span>;
      case 'late': return <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded">Terlambat</span>;
      case 'absent': return <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded">Tidak Hadir</span>;
      case 'off': return <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded">Libur</span>;
      default: return <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded">{status}</span>;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const dayLabels = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

  if (loading) {
    return (
      <OfficeLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading employee data...</div>
        </div>
      </OfficeLayout>
    );
  }

  if (!employee) {
    return (
      <OfficeLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Employee not found</div>
        </div>
      </OfficeLayout>
    );
  }

  return (
    <OfficeLayout>
      {/* Header */}
      <div className="px-6 py-4 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 transition-colors"
            >
              <ChevronLeftIcon className="h-5 w-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Detail Karyawan</h1>
              <p className="text-sm text-gray-600 mt-1">{employee.employee_id} - {employee.full_name}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Link
              href={`/office/employees/${employee.employee_id}/edit`}
              className="flex items-center space-x-2 px-4 py-2 bg-[#4E61D3] text-white text-sm font-medium hover:bg-[#3d4fb5] transition-colors"
            >
              <PencilEdit02Icon className="h-4 w-4" />
              <span>Edit</span>
            </Link>
            <button
              className="flex items-center space-x-2 px-4 py-2 border border-red-600 text-red-600 text-sm font-medium hover:bg-red-50 transition-colors"
            >
              <CancelCircleIcon className="h-4 w-4" />
              <span>Nonaktifkan</span>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('info')}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'info'
                ? 'border-[#4E61D3] text-[#4E61D3] bg-gray-50'
                : 'border-transparent text-gray-600 hover:text-gray-800 hover:border-gray-300'
            }`}
          >
            Informasi
          </button>
          <button
            onClick={() => setActiveTab('attendance')}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'attendance'
                ? 'border-[#4E61D3] text-[#4E61D3] bg-gray-50'
                : 'border-transparent text-gray-600 hover:text-gray-800 hover:border-gray-300'
            }`}
          >
            Kehadiran
          </button>
          <button
            onClick={() => setActiveTab('performance')}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'performance'
                ? 'border-[#4E61D3] text-[#4E61D3] bg-gray-50'
                : 'border-transparent text-gray-600 hover:text-gray-800 hover:border-gray-300'
            }`}
          >
            Performa
          </button>
        </div>
      </div>

      {/* Information Tab */}
      {activeTab === 'info' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Card */}
          <div className="lg:col-span-1">
            <div className="bg-white border border-gray-200 p-6">
              <div className="text-center mb-6">
                <div className="w-24 h-24 bg-[#4E61D3] rounded-full flex items-center justify-center mx-auto mb-4">
                  <UserIcon className="h-12 w-12 text-white" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">{employee.full_name}</h2>
                <p className="text-sm text-gray-600 mt-1">{employee.position || '-'}</p>
                <div className="mt-3">{getStatusBadge(employee.employment_status.toLowerCase())}</div>
              </div>

              <div className="space-y-4 border-t border-gray-200 pt-4">
                <div className="flex items-start space-x-3">
                  <UserCheckIcon className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <div className="text-xs text-gray-500">ID Karyawan</div>
                    <div className="text-sm font-medium text-gray-900">{employee.employee_id}</div>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Building03Icon className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <div className="text-xs text-gray-500">Departemen</div>
                    <div className="text-sm font-medium text-gray-900">{employee.department_name || '-'}</div>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Shield01Icon className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <div className="text-xs text-gray-500">Role</div>
                    <div className="text-sm font-medium text-gray-900">{employee.role_display}</div>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Calendar01Icon className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <div className="text-xs text-gray-500">Tanggal Bergabung</div>
                    <div className="text-sm font-medium text-gray-900">{employee.hire_date ? formatDate(employee.hire_date) : '-'}</div>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <ArrowUp01Icon className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <div className="text-xs text-gray-500">Gaji</div>
                    <div className="text-sm font-medium text-gray-900">{formatCurrency(parseFloat(employee.salary))}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Contact Information */}
            <div className="bg-white border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Informasi Kontak</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-start space-x-3">
                  <Mail01Icon className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <div className="text-xs text-gray-500">Email</div>
                    <div className="text-sm font-medium text-gray-900">{employee.email || '-'}</div>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Call02Icon className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <div className="text-xs text-gray-500">Telepon</div>
                    <div className="text-sm font-medium text-gray-900">{employee.phone || '-'}</div>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Calendar01Icon className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <div className="text-xs text-gray-500">Tanggal Lahir</div>
                    <div className="text-sm font-medium text-gray-900">{employee.date_of_birth ? formatDate(employee.date_of_birth) : '-'}</div>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Location01Icon className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <div className="text-xs text-gray-500">Alamat</div>
                    <div className="text-sm font-medium text-gray-900">{employee.address || '-'}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Emergency Contact */}
            <div className="bg-white border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center space-x-2">
                <Shield01Icon className="h-5 w-5" />
                <span>Kontak Darurat</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <div className="text-xs text-gray-500">Nama</div>
                  <div className="text-sm font-medium text-gray-900">{employee.emergency_contact || '-'}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Hubungan</div>
                  <div className="text-sm font-medium text-gray-900">{employee.emergency_relationship || '-'}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Telepon</div>
                  <div className="text-sm font-medium text-gray-900">{employee.emergency_phone || '-'}</div>
                </div>
              </div>
            </div>

            {/* Work Schedule - Show shifts from API */}
            <div className="bg-white border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Jadwal Kerja</h3>
              <p className="text-sm text-gray-600">Lihat jadwal kerja di tab "Jadwal" pada halaman utama karyawan.</p>
            </div>
          </div>
        </div>
      )}

      {/* Attendance Tab */}
      {activeTab === 'attendance' && (
        <div className="bg-white border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">Riwayat Kehadiran</h3>
              <div className="text-sm text-gray-600">Oktober 2024</div>
            </div>
          </div>
          <div className="overflow-visible">
            <table className="w-full">
              <thead>
                <tr className="bg-[#4E61D3]">
                  <th className="px-6 py-4 text-left text-sm font-medium text-white border border-gray-300">Tanggal</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-white border border-gray-300">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-white border border-gray-300">Jam Masuk</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-white border border-gray-300">Jam Keluar</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-white border border-gray-300">Total Jam</th>
                </tr>
              </thead>
              <tbody>
                {attendanceData.map((record) => {
                  const hours = record.checkIn && record.checkOut ? 8 : 0;
                  return (
                    <tr key={record.date} className="hover:bg-gray-50">
                      <td className="px-6 py-4 border border-gray-200">
                        <div className="text-sm text-gray-900">{formatDate(record.date)}</div>
                      </td>
                      <td className="px-6 py-4 border border-gray-200">
                        {getAttendanceStatusBadge(record.status)}
                      </td>
                      <td className="px-6 py-4 border border-gray-200">
                        <div className="text-sm text-gray-900">{record.checkIn || '-'}</div>
                      </td>
                      <td className="px-6 py-4 border border-gray-200">
                        <div className="text-sm text-gray-900">{record.checkOut || '-'}</div>
                      </td>
                      <td className="px-6 py-4 border border-gray-200">
                        <div className="text-sm text-gray-900">{hours > 0 ? `${hours} jam` : '-'}</div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Performance Tab */}
      {activeTab === 'performance' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white border border-gray-200 p-6">
              <div className="text-center">
                <div className="text-4xl font-bold text-gray-900 mb-2">{employee.attendanceRate}%</div>
                <div className="text-sm text-gray-600">Tingkat Kehadiran</div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 p-6">
              <div className="text-center">
                <div className="text-4xl font-bold text-gray-900 mb-2">23</div>
                <div className="text-sm text-gray-600">Hari Hadir Bulan Ini</div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 p-6">
              <div className="text-center">
                <div className="text-4xl font-bold text-gray-900 mb-2">2</div>
                <div className="text-sm text-gray-600">Keterlambatan Bulan Ini</div>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Catatan Performa</h3>
            <p className="text-sm text-gray-600">Data performa belum tersedia.</p>
          </div>
        </div>
      )}
    </OfficeLayout>
  );
}
