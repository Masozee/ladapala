'use client';

import { useState } from 'react';
import Link from 'next/link';
import OfficeLayout from '@/components/OfficeLayout';
import {
  ChevronLeftIcon,
  UserIcon,
  Mail01Icon,
  Call02Icon,
  Calendar01Icon,
  Clock01Icon,
  SparklesIcon,
  ArrowUp01Icon,
  AlertCircleIcon,
  UserCheckIcon,
  PencilEdit02Icon,
  PackageIcon,
  Cancel01Icon,
  PieChartIcon
} from '@/lib/icons';

interface EmployeeDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function EmployeeDetailPage({ params }: EmployeeDetailPageProps) {
  const { id } = await params;
  const [isEditing, setIsEditing] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState('2024-01');

  // Sample employee data (in real app, this would come from API based on params.id)
  const employee = {
    id: parseInt(id),
    name: 'Siti Nurhaliza',
    employeeId: 'EMP001',
    position: 'Housekeeping',
    department: 'Operations',
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
    salary: 4500000,
    emergencyContact: {
      name: 'Budi Nurhaliza',
      relationship: 'Suami',
      phone: '081234567899'
    },
    address: 'Jl. Merdeka No. 123, Jakarta Pusat',
    birthDate: '1995-08-15',
    hireDate: '2023-01-15',
    performanceScore: 4.2
  };

  // Sample attendance data for the month
  const attendanceData = [
    { date: '2024-01-01', status: 'present', checkIn: '07:00', checkOut: '15:00', shift: 'morning' },
    { date: '2024-01-02', status: 'present', checkIn: '07:05', checkOut: '15:10', shift: 'morning' },
    { date: '2024-01-03', status: 'present', checkIn: '06:55', checkOut: '15:00', shift: 'morning' },
    { date: '2024-01-04', status: 'present', checkIn: '07:15', checkOut: '15:15', shift: 'morning' },
    { date: '2024-01-05', status: 'present', checkIn: '07:00', checkOut: '15:05', shift: 'morning' },
    { date: '2024-01-06', status: 'off', checkIn: null, checkOut: null, shift: 'off' },
    { date: '2024-01-07', status: 'off', checkIn: null, checkOut: null, shift: 'off' },
    { date: '2024-01-08', status: 'present', checkIn: '07:10', checkOut: '15:00', shift: 'morning' },
    { date: '2024-01-09', status: 'late', checkIn: '07:30', checkOut: '15:30', shift: 'morning' },
    { date: '2024-01-10', status: 'present', checkIn: '07:00', checkOut: '15:00', shift: 'morning' }
  ];

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
      case 'present': return 'text-green-600';
      case 'late': return 'text-yellow-600';
      case 'absent': return 'text-red-600';
      case 'off': return 'text-gray-500';
      default: return 'text-gray-500';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'present': return 'Hadir';
      case 'late': return 'Terlambat';
      case 'absent': return 'Absen';
      case 'off': return 'Libur';
      default: return status;
    }
  };

  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const dayLabels = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];

  return (
    <OfficeLayout breadcrumb={[
      { label: 'Karyawan', href: '/office/employees' },
      { label: employee.name }
    ]}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link 
              href="/office/employees"
              className="p-2 hover:bg-gray-100 transition-colors"
            >
              <ChevronLeftIcon className="h-5 w-5 text-gray-600" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{employee.name}</h1>
              <p className="text-gray-600">{employee.employeeId} • {employee.position}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => setIsEditing(!isEditing)}
              className="bg-[#005357] text-white px-4 py-2 text-sm font-medium hover:bg-[#004147] transition-colors flex items-center space-x-2"
            >
              <PencilEdit02Icon className="h-4 w-4" />
              <span>{isEditing ? 'Batal' : 'Edit'}</span>
            </button>
          </div>
        </div>

        {/* Employee Information Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Personal Information */}
          <div className="bg-white border border-gray-200">
            <div className="p-6 bg-[#005357] text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-white">Informasi Pribadi</h3>
                  <p className="text-sm text-gray-100 mt-1">Data personal karyawan</p>
                </div>
                <div className="w-8 h-8 bg-white flex items-center justify-center">
                  <UserIcon className="h-4 w-4 text-[#005357]" />
                </div>
              </div>
            </div>
            <div className="p-6 bg-gray-50">
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Mail01Icon className="h-4 w-4 text-gray-400" />
                  <div>
                    <div className="text-sm text-gray-600">Email</div>
                    <div className="font-medium text-gray-900">{employee.email}</div>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Call02Icon className="h-4 w-4 text-gray-400" />
                  <div>
                    <div className="text-sm text-gray-600">Telepon</div>
                    <div className="font-medium text-gray-900">{employee.phone}</div>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Calendar01Icon className="h-4 w-4 text-gray-400" />
                  <div>
                    <div className="text-sm text-gray-600">Tanggal Bergabung</div>
                    <div className="font-medium text-gray-900">{new Date(employee.joinDate).toLocaleDateString('id-ID')}</div>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <UserIcon className="h-4 w-4 text-gray-400" />
                  <div>
                    <div className="text-sm text-gray-600">Kontak Darurat</div>
                    <div className="font-medium text-gray-900">{employee.emergencyContact.name}</div>
                    <div className="text-sm text-gray-500">{employee.emergencyContact.relationship} • {employee.emergencyContact.phone}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Work Information */}
          <div className="bg-white border border-gray-200">
            <div className="p-6 bg-[#005357] text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-white">Informasi Kerja</h3>
                  <p className="text-sm text-gray-100 mt-1">Detail pekerjaan dan shift</p>
                </div>
                <div className="w-8 h-8 bg-white flex items-center justify-center">
                  <Clock01Icon className="h-4 w-4 text-[#005357]" />
                </div>
              </div>
            </div>
            <div className="p-6 bg-gray-50">
              <div className="space-y-4">
                <div>
                  <div className="text-sm text-gray-600">Departemen</div>
                  <div className="font-medium text-gray-900">{employee.department}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Posisi</div>
                  <div className="font-medium text-gray-900">{employee.position}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Shift Utama</div>
                  <span className={`inline-flex px-2 py-1 text-xs font-medium ${getShiftColor(employee.shift)}`}>
                    {getShiftLabel(employee.shift)}
                  </span>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Status</div>
                  <span className="inline-flex px-2 py-1 text-xs font-medium bg-green-100 text-green-800">
                    Aktif
                  </span>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Gaji Pokok</div>
                  <div className="font-medium text-gray-900">Rp {employee.salary.toLocaleString('id-ID')}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Performance Stats */}
          <div className="bg-white border border-gray-200">
            <div className="p-6 bg-[#005357] text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-white">Performa</h3>
                  <p className="text-sm text-gray-100 mt-1">Statistik kinerja</p>
                </div>
                <div className="w-8 h-8 bg-white flex items-center justify-center">
                  <SparklesIcon className="h-4 w-4 text-[#005357]" />
                </div>
              </div>
            </div>
            <div className="p-6 bg-gray-50">
              <div className="space-y-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-[#005357]">{employee.attendanceRate}%</div>
                  <div className="text-sm text-gray-600">Tingkat Kehadiran</div>
                  <div className="w-full bg-gray-200 h-2 mt-2">
                    <div 
                      className="bg-[#005357] h-2" 
                      style={{ width: `${employee.attendanceRate}%` }}
                    ></div>
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-[#005357]">{employee.performanceScore}/5</div>
                  <div className="text-sm text-gray-600">Skor Performa</div>
                  <div className="flex justify-center mt-2">
                    {[...Array(5)].map((_, i) => (
                      <SparklesIcon key={i} className={`h-4 w-4 ${
                        i < Math.floor(employee.performanceScore) ? 'text-yellow-400 fill-current' : 'text-gray-300'
                      }`} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Weekly Schedule */}
        <div className="bg-white border border-gray-200">
          <div className="p-6 bg-[#005357] text-white">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-white">Jadwal Kerja Mingguan</h3>
                <p className="text-sm text-gray-100 mt-1">Pengaturan shift kerja</p>
              </div>
              <div className="w-8 h-8 bg-white flex items-center justify-center">
                <Calendar01Icon className="h-4 w-4 text-[#005357]" />
              </div>
            </div>
          </div>
          <div className="p-6 bg-gray-50">
            <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
              {days.map((day, index) => {
                const shift = employee.schedule[day as keyof typeof employee.schedule];
                return (
                  <div key={index} className="bg-white p-4 text-center">
                    <div className="font-medium text-gray-900 mb-2">{dayLabels[index]}</div>
                    <div className={`px-3 py-2 text-sm font-medium ${getShiftColor(shift)}`}>
                      {shift === 'morning' ? 'Pagi' : shift === 'afternoon' ? 'Siang' : shift === 'night' ? 'Malam' : 'Libur'}
                    </div>
                    {shift !== 'off' && (
                      <div className="text-xs text-gray-500 mt-1">
                        {shift === 'morning' ? '07:00-15:00' : 
                         shift === 'afternoon' ? '15:00-23:00' : 
                         shift === 'night' ? '23:00-07:00' : ''}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Attendance History */}
        <div className="bg-white border border-gray-200">
          <div className="p-6 bg-[#005357] text-white">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-white">Riwayat Kehadiran</h3>
                <p className="text-sm text-gray-100 mt-1">Log kehadiran bulanan</p>
              </div>
              <div className="flex items-center space-x-3">
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="px-3 py-1 text-[#005357] text-sm border border-gray-300 focus:outline-none focus:ring-2 focus:ring-white"
                >
                  <option value="2024-01">Januari 2024</option>
                  <option value="2023-12">Desember 2023</option>
                  <option value="2023-11">November 2023</option>
                </select>
                <div className="w-8 h-8 bg-white flex items-center justify-center">
                  <PieChartIcon className="h-4 w-4 text-[#005357]" />
                </div>
              </div>
            </div>
          </div>
          <div className="p-6 bg-gray-50">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="border border-gray-300 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tanggal</th>
                    <th className="border border-gray-300 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="border border-gray-300 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Jam Masuk</th>
                    <th className="border border-gray-300 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Jam Keluar</th>
                    <th className="border border-gray-300 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Shift</th>
                  </tr>
                </thead>
                <tbody className="bg-white">
                  {attendanceData.map((record, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="border border-gray-200 px-4 py-4 text-sm text-gray-900">
                        {new Date(record.date).toLocaleDateString('id-ID', { 
                          weekday: 'long', 
                          day: 'numeric', 
                          month: 'long' 
                        })}
                      </td>
                      <td className="border border-gray-200 px-4 py-4">
                        <div className="flex items-center space-x-2">
                          {record.status === 'present' ? (
                            <UserCheckIcon className="h-4 w-4 text-green-600" />
                          ) : record.status === 'late' ? (
                            <AlertCircleIcon className="h-4 w-4 text-yellow-600" />
                          ) : record.status === 'off' ? (
                            <Cancel01Icon className="h-4 w-4 text-gray-400" />
                          ) : (
                            <Cancel01Icon className="h-4 w-4 text-red-600" />
                          )}
                          <span className={`text-sm font-medium ${getStatusColor(record.status)}`}>
                            {getStatusLabel(record.status)}
                          </span>
                        </div>
                      </td>
                      <td className="border border-gray-200 px-4 py-4 text-sm text-gray-900">
                        {record.checkIn || '-'}
                      </td>
                      <td className="border border-gray-200 px-4 py-4 text-sm text-gray-900">
                        {record.checkOut || '-'}
                      </td>
                      <td className="border border-gray-200 px-4 py-4">
                        <span className={`px-2 py-1 text-xs font-medium ${getShiftColor(record.shift)}`}>
                          {record.shift === 'morning' ? 'P' : 
                           record.shift === 'afternoon' ? 'S' : 
                           record.shift === 'night' ? 'M' : '-'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </OfficeLayout>
  );
}