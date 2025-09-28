'use client';

import { useState } from 'react';
import Link from 'next/link';
import OfficeLayout from '@/components/OfficeLayout';
import { 
  Calendar,
  CalendarDays,
  Clock,
  Users,
  Search,
  Filter,
  Plus,
  Edit,
  Eye,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  User,
  Mail,
  Phone
} from 'lucide-react';

export default function SchedulesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [selectedShift, setSelectedShift] = useState('all');
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
      attendanceRate: 96,
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
      attendanceRate: 94,
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
      attendanceRate: 98,
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
      attendanceRate: 92,
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
      attendanceRate: 89,
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
      attendanceRate: 95,
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

  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const dayLabels = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];

  // Get current week or offset week
  const getCurrentWeekDates = () => {
    const today = new Date();
    const currentDayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const mondayOffset = currentDayOfWeek === 0 ? -6 : 1 - currentDayOfWeek;
    
    const monday = new Date(today);
    monday.setDate(today.getDate() + mondayOffset + (selectedWeek * 7));
    
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  const weekDates = getCurrentWeekDates();

  const formatWeekRange = (dates: Date[]) => {
    const startDate = dates[0];
    const endDate = dates[6];
    return `${startDate.getDate()}/${startDate.getMonth() + 1} - ${endDate.getDate()}/${endDate.getMonth() + 1}/${endDate.getFullYear()}`;
  };

  return (
    <OfficeLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white shadow">
          <div className="p-6 bg-[#005357] text-white">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-white">Jadwal Kerja Karyawan</h1>
                <p className="text-sm text-gray-100 mt-1">Kalender jadwal mingguan dengan sistem 3 shift</p>
              </div>
              <div className="flex items-center space-x-3">
                <button className="bg-white text-[#005357] px-4 py-2 text-sm font-medium hover:bg-gray-100 transition-colors flex items-center space-x-2">
                  <Plus className="h-4 w-4" />
                  <span>Buat Jadwal Baru</span>
                </button>
                <div className="w-8 h-8 bg-white flex items-center justify-center">
                  <CalendarDays className="h-4 w-4 text-[#005357]" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Week Navigation & Filters */}
        <div className="bg-white shadow">
          <div className="p-6">
            {/* Week Navigation */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <button 
                  onClick={() => setSelectedWeek(selectedWeek - 1)}
                  className="p-2 hover:bg-gray-100 transition-colors"
                >
                  <ChevronLeft className="h-5 w-5 text-gray-600" />
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
                  <ChevronRight className="h-5 w-5 text-gray-600" />
                </button>
              </div>
              
              {selectedWeek !== 0 && (
                <button 
                  onClick={() => setSelectedWeek(0)}
                  className="px-3 py-1 text-sm bg-[#005357] text-white hover:bg-[#004147] transition-colors"
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
        <div className="bg-white shadow">
          <div className="p-4 bg-gray-50">
            <div className="overflow-x-auto">
              <div style={{ minWidth: `${250 + (7 * 120)}px` }}>
                <table className="w-full">
                  <thead>
                    <tr className="bg-[#005357]">
                      <th className="text-left py-3 px-4 text-sm font-bold text-white uppercase tracking-wider w-[200px] sticky left-0 bg-[#005357] z-20">
                        Karyawan
                      </th>
                      <th className="text-center py-3 px-4 text-sm font-bold text-white uppercase tracking-wider w-[50px] sticky left-[200px] bg-[#005357] z-20 shadow-lg" style={{boxShadow: '4px 0 6px -1px rgba(0, 0, 0, 0.1)'}}>
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
                      <th className="text-center py-3 px-4 text-sm font-bold text-white uppercase tracking-wider w-[80px]">
                        Aksi
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {filteredEmployees.map((employee) => (
                      <tr key={employee.id} className="hover:bg-gray-50 transition-colors">
                        {/* Employee Info */}
                        <td className="py-4 px-4 font-medium text-gray-900 w-[200px] sticky left-0 bg-white border-r border-gray-200 z-10">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-[#005357] flex items-center justify-center text-white font-bold">
                              {employee.name.charAt(0)}
                            </div>
                            <div>
                              <div className="font-bold text-sm">{employee.name}</div>
                              <div className="text-xs text-gray-600">{employee.position}</div>
                              <div className="text-xs text-gray-500">{employee.department}</div>
                            </div>
                          </div>
                        </td>
                        
                        {/* Primary Shift */}
                        <td className="py-4 px-4 text-center w-[50px] sticky left-[200px] bg-white border-r border-gray-200 z-10" style={{boxShadow: '4px 0 6px -1px rgba(0, 0, 0, 0.1)'}}>
                          <span className={`inline-flex px-2 py-1 text-xs font-medium ${getShiftColor(employee.shift)}`}>
                            {employee.shift === 'morning' ? 'P' : employee.shift === 'afternoon' ? 'S' : 'M'}
                          </span>
                        </td>

                        {/* Daily Shifts */}
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
                                  <div className="text-xs mt-1 opacity-75 truncate">
                                    {employee.name.split(' ')[0]}
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

                        {/* Actions */}
                        <td className="px-4 py-4 text-center">
                          <div className="flex items-center justify-center space-x-1">
                            <Link 
                              href={`/office/employees/${employee.id}`}
                              className="p-1 text-gray-400 hover:text-[#005357] hover:bg-gray-100 transition-colors rounded"
                              title="Lihat Karyawan"
                            >
                              <Eye className="h-4 w-4" />
                            </Link>
                            <button 
                              className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors rounded"
                              title="Edit Jadwal"
                            >
                              <Edit className="h-4 w-4" />
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
                <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Tidak ada karyawan yang sesuai dengan filter.</p>
              </div>
            )}
          </div>
        </div>

        {/* Shift Summary */}
        <div className="bg-white shadow">
          <div className="p-6 bg-[#005357] text-white">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-white">Ringkasan Shift Mingguan</h3>
                <p className="text-sm text-gray-100 mt-1">Coverage per shift untuk minggu ini</p>
              </div>
              <div className="w-8 h-8 bg-white flex items-center justify-center">
                <Clock className="h-4 w-4 text-[#005357]" />
              </div>
            </div>
          </div>
          <div className="p-6 bg-gray-50">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-yellow-50 p-4 border-l-4 border-yellow-400">
                <div className="flex items-center space-x-3 mb-2">
                  <div className="w-8 h-8 bg-yellow-400 flex items-center justify-center">
                    <Clock className="h-4 w-4 text-white" />
                  </div>
                  <h4 className="font-bold text-yellow-800">Shift Pagi</h4>
                </div>
                <div className="text-sm text-yellow-700 space-y-1">
                  <div><strong>Waktu:</strong> 07:00 - 15:00</div>
                  <div><strong>Departemen:</strong> Housekeeping, Engineering, F&B</div>
                  <div><strong>Jumlah:</strong> {employees.filter(emp => emp.shift === 'morning').length} karyawan</div>
                </div>
              </div>

              <div className="bg-blue-50 p-4 border-l-4 border-blue-400">
                <div className="flex items-center space-x-3 mb-2">
                  <div className="w-8 h-8 bg-blue-400 flex items-center justify-center">
                    <Clock className="h-4 w-4 text-white" />
                  </div>
                  <h4 className="font-bold text-blue-800">Shift Siang</h4>
                </div>
                <div className="text-sm text-blue-700 space-y-1">
                  <div><strong>Waktu:</strong> 15:00 - 23:00</div>
                  <div><strong>Departemen:</strong> Front Office, F&B</div>
                  <div><strong>Jumlah:</strong> {employees.filter(emp => emp.shift === 'afternoon').length} karyawan</div>
                </div>
              </div>

              <div className="bg-purple-50 p-4 border-l-4 border-purple-400">
                <div className="flex items-center space-x-3 mb-2">
                  <div className="w-8 h-8 bg-purple-400 flex items-center justify-center">
                    <Clock className="h-4 w-4 text-white" />
                  </div>
                  <h4 className="font-bold text-purple-800">Shift Malam</h4>
                </div>
                <div className="text-sm text-purple-700 space-y-1">
                  <div><strong>Waktu:</strong> 23:00 - 07:00</div>
                  <div><strong>Departemen:</strong> Security, Front Office</div>
                  <div><strong>Jumlah:</strong> {employees.filter(emp => emp.shift === 'night').length} karyawan</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </OfficeLayout>
  );
}