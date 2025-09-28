'use client';

import OfficeLayout from '@/components/OfficeLayout';
import { BarChart3, TrendingUp, DollarSign, Users, PieChart, Calendar, Star, Target, ArrowUpRight, ArrowDownRight, UserCheck, ClipboardList, Building, Briefcase, FileText, Clock, AlertTriangle, CheckCircle, UserX, Zap } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell, LineChart, Line, AreaChart, Area, ComposedChart } from 'recharts';

export default function AnalyticsPage() {
  // Revenue and business data
  const revenueData = [
    { month: 'Jan', revenue: 45000, target: 50000, expenses: 32000 },
    { month: 'Feb', revenue: 52000, target: 50000, expenses: 35000 },
    { month: 'Mar', revenue: 48000, target: 50000, expenses: 34000 },
    { month: 'Apr', revenue: 61000, target: 55000, expenses: 38000 },
    { month: 'May', revenue: 58000, target: 55000, expenses: 36000 },
    { month: 'Jun', revenue: 67000, target: 60000, expenses: 41000 },
    { month: 'Jul', revenue: 72000, target: 65000, expenses: 43000 },
    { month: 'Agu', revenue: 69000, target: 65000, expenses: 42000 },
    { month: 'Sep', revenue: 74000, target: 70000, expenses: 45000 },
    { month: 'Okt', revenue: 71000, target: 70000, expenses: 44000 },
    { month: 'Nov', revenue: 78000, target: 75000, expenses: 47000 },
    { month: 'Des', revenue: 82000, target: 80000, expenses: 49000 }
  ];

  // HR Analytics Data
  const employeeData = [
    { department: 'Housekeeping', employees: 18, satisfaction: 4.2, turnover: 12 },
    { department: 'Front Office', employees: 12, satisfaction: 4.5, turnover: 8 },
    { department: 'F&B', employees: 15, satisfaction: 4.1, turnover: 15 },
    { department: 'Maintenance', employees: 8, satisfaction: 4.3, turnover: 5 },
    { department: 'Security', employees: 6, satisfaction: 4.4, turnover: 3 },
    { department: 'Admin', employees: 5, satisfaction: 4.6, turnover: 2 }
  ];

  const attendanceData = [
    { day: 'Sen', present: 58, absent: 6, late: 3 },
    { day: 'Sel', present: 59, absent: 5, late: 2 },
    { day: 'Rab', present: 57, absent: 7, late: 4 },
    { day: 'Kam', present: 60, absent: 4, late: 2 },
    { day: 'Jum', present: 56, absent: 8, late: 5 },
    { day: 'Sab', present: 61, absent: 3, late: 1 },
    { day: 'Min', present: 59, absent: 5, late: 2 }
  ];

  // General Affairs Data
  const facilitiesData = [
    { name: 'AC/HVAC', status: 'Baik', maintenance: 2, cost: 15000 },
    { name: 'Lift', status: 'Baik', maintenance: 1, cost: 8000 },
    { name: 'Generator', status: 'Perlu Perhatian', maintenance: 3, cost: 22000 },
    { name: 'Fire Safety', status: 'Baik', maintenance: 1, cost: 5000 },
    { name: 'WiFi/IT', status: 'Excellent', maintenance: 0, cost: 12000 },
    { name: 'Water System', status: 'Baik', maintenance: 1, cost: 7000 }
  ];

  const expenseCategories = [
    { name: 'Gaji & Tunjangan', value: 45, color: '#005357' },
    { name: 'Operasional Hotel', value: 25, color: '#2baf6a' },
    { name: 'Maintenance', value: 15, color: '#60a5fa' },
    { name: 'Marketing', value: 8, color: '#f59e0b' },
    { name: 'General Affairs', value: 7, color: '#ef4444' }
  ];

  // Business operations data
  const departmentPerformance = [
    { department: 'Hotel Operations', efficiency: 89, revenue: 680000, cost: 420000 },
    { department: 'HR & Admin', efficiency: 92, revenue: 0, cost: 85000 },
    { department: 'General Affairs', efficiency: 78, revenue: 0, cost: 65000 },
    { department: 'Finance', efficiency: 95, revenue: 0, cost: 45000 },
    { department: 'Marketing', efficiency: 85, revenue: 120000, cost: 75000 }
  ];

  return (
    <OfficeLayout>
      <div className="space-y-6">
        {/* Bento Grid Layout */}
        <div className="grid grid-cols-12 gap-6 h-auto">
          {/* Total Karyawan - Large Square */}
          <div className="col-span-12 md:col-span-6 lg:col-span-3 bg-white shadow">
            <div className="p-6 bg-[#005357] text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-white">Total Karyawan</h3>
                  <p className="text-sm text-gray-100 mt-1">Staf aktif saat ini</p>
                </div>
                <div className="w-8 h-8 bg-white flex items-center justify-center">
                  <Users className="h-4 w-4 text-[#005357]" />
                </div>
              </div>
            </div>
            <div className="p-4 bg-gray-50">
              <div className="text-center">
                <div className="text-3xl font-bold text-[#005357] mb-2">64</div>
                <div className="text-sm text-gray-600">karyawan aktif</div>
              </div>
            </div>
          </div>

          {/* Revenue vs Expenses Chart - Large Rectangle */}
          <div className="col-span-12 md:col-span-6 lg:col-span-6 bg-white shadow">
            <div className="p-6 bg-[#005357] text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-white">Pendapatan vs Biaya</h3>
                  <p className="text-sm text-gray-100 mt-1">Analisis keuangan bulanan</p>
                </div>
                <div className="w-8 h-8 bg-white flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 text-[#005357]" />
                </div>
              </div>
            </div>
            <div className="p-4 bg-gray-50">
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={revenueData}>
                    <XAxis 
                      dataKey="month" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 10, fill: '#6B7280' }}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 10, fill: '#6B7280' }}
                      tickFormatter={(value) => `${value/1000}k`}
                    />
                    <Bar 
                      dataKey="expenses" 
                      fill="#ef4444" 
                      radius={[1, 1, 0, 0]}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="#005357" 
                      strokeWidth={2}
                      dot={{ fill: '#005357', strokeWidth: 1, r: 2 }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Efficiency - Medium Square */}
          <div className="col-span-12 md:col-span-6 lg:col-span-3 bg-white shadow">
            <div className="p-6 bg-[#005357] text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-white">Efisiensi</h3>
                  <p className="text-sm text-gray-100 mt-1">Operasional</p>
                </div>
                <div className="w-8 h-8 bg-white flex items-center justify-center">
                  <Zap className="h-4 w-4 text-[#005357]" />
                </div>
              </div>
            </div>
            <div className="p-4 bg-gray-50">
              <div className="text-center">
                <div className="flex items-center justify-center space-x-2">
                  <div className="text-3xl font-bold text-green-600 mb-2">88%</div>
                  <ArrowUpRight className="h-5 w-5 text-green-600" />
                </div>
                <div className="text-sm text-gray-600">rata-rata</div>
              </div>
            </div>
          </div>

          {/* Attendance - Small Rectangle */}
          <div className="col-span-12 md:col-span-6 lg:col-span-4 bg-white shadow">
            <div className="p-6 bg-[#005357] text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-white">Kehadiran</h3>
                  <p className="text-xs text-gray-100 mt-1">Mingguan</p>
                </div>
                <div className="w-8 h-8 bg-white flex items-center justify-center">
                  <UserCheck className="h-4 w-4 text-[#005357]" />
                </div>
              </div>
            </div>
            <div className="p-3 bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-500">91%</div>
                  <div className="text-xs text-gray-600">Hadir</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-yellow-500">5%</div>
                  <div className="text-xs text-gray-600">Terlambat</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-red-500">4%</div>
                  <div className="text-xs text-gray-600">Absen</div>
                </div>
              </div>
            </div>
          </div>

          {/* Expense Categories - Medium Rectangle */}
          <div className="col-span-12 md:col-span-6 lg:col-span-5 bg-white shadow">
            <div className="p-6 bg-[#005357] text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-white">Kategori Pengeluaran</h3>
                  <p className="text-sm text-gray-100 mt-1">Distribusi biaya</p>
                </div>
                <div className="w-8 h-8 bg-white flex items-center justify-center">
                  <PieChart className="h-4 w-4 text-[#005357]" />
                </div>
              </div>
            </div>
            <div className="p-4 bg-gray-50">
              <div className="flex items-center space-x-4">
                <div className="w-24 h-24">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={expenseCategories}
                        cx="50%"
                        cy="50%"
                        innerRadius={20}
                        outerRadius={40}
                        paddingAngle={1}
                        dataKey="value"
                      >
                        {expenseCategories.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex-1 space-y-1">
                  {expenseCategories.slice(0, 3).map((item, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2" style={{ backgroundColor: item.color }}></div>
                        <span className="text-gray-700 text-xs">{item.name}</span>
                      </div>
                      <span className="text-gray-900 font-medium text-xs">{item.value}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Cost - Small Square */}
          <div className="col-span-12 md:col-span-6 lg:col-span-3 bg-white shadow">
            <div className="p-6 bg-[#005357] text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-white">Biaya</h3>
                  <p className="text-sm text-gray-100 mt-1">Bulanan</p>
                </div>
                <div className="w-8 h-8 bg-white flex items-center justify-center">
                  <DollarSign className="h-4 w-4 text-[#005357]" />
                </div>
              </div>
            </div>
            <div className="p-4 bg-gray-50">
              <div className="text-center">
                <div className="text-3xl font-bold text-[#005357] mb-2">Rp 49jt</div>
                <div className="text-sm text-gray-600">operasional</div>
              </div>
            </div>
          </div>

          {/* Department Performance - Wide Rectangle */}
          <div className="col-span-12 lg:col-span-8 bg-white shadow">
            <div className="p-6 bg-[#005357] text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-white">Performa Departemen</h3>
                  <p className="text-sm text-gray-100 mt-1">Efisiensi dan kontribusi</p>
                </div>
                <div className="w-8 h-8 bg-white flex items-center justify-center">
                  <Target className="h-4 w-4 text-[#005357]" />
                </div>
              </div>
            </div>
            <div className="p-4 bg-gray-50">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {departmentPerformance.map((dept, index) => (
                  <div key={index} className="bg-white p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-900 text-sm">{dept.department}</span>
                      <span className={`px-2 py-1 text-xs font-medium ${
                        dept.efficiency >= 90 ? 'bg-green-100 text-green-800' :
                        dept.efficiency >= 80 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {dept.efficiency}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 h-1.5 mb-2">
                      <div 
                        className="bg-[#005357] h-1.5" 
                        style={{ width: `${dept.efficiency}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-600">
                      {dept.revenue > 0 && (
                        <span>Revenue: Rp {(dept.revenue/1000).toFixed(0)}k</span>
                      )}
                      <span>Cost: Rp {(dept.cost/1000).toFixed(0)}k</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Stats - Tall Rectangle */}
          <div className="col-span-12 lg:col-span-4 bg-white shadow">
            <div className="p-6 bg-[#005357] text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-white">Statistik Cepat</h3>
                  <p className="text-sm text-gray-100 mt-1">Ringkasan hari ini</p>
                </div>
                <div className="w-8 h-8 bg-white flex items-center justify-center">
                  <BarChart3 className="h-4 w-4 text-[#005357]" />
                </div>
              </div>
            </div>
            <div className="p-4 bg-gray-50">
              <div className="space-y-4">
                <div className="flex items-center justify-between bg-white p-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-green-100 flex items-center justify-center">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    </div>
                    <span className="text-sm text-gray-900">Fasilitas Normal</span>
                  </div>
                  <span className="text-sm font-bold text-green-600">5/6</span>
                </div>
                <div className="flex items-center justify-between bg-white p-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-yellow-100 flex items-center justify-center">
                      <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    </div>
                    <span className="text-sm text-gray-900">Perlu Perhatian</span>
                  </div>
                  <span className="text-sm font-bold text-yellow-600">1/6</span>
                </div>
                <div className="flex items-center justify-between bg-white p-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 flex items-center justify-center">
                      <Star className="h-4 w-4 text-blue-600" />
                    </div>
                    <span className="text-sm text-gray-900">Rating Kepuasan</span>
                  </div>
                  <span className="text-sm font-bold text-blue-600">4.3/5</span>
                </div>
                <div className="flex items-center justify-between bg-white p-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-purple-100 flex items-center justify-center">
                      <Users className="h-4 w-4 text-purple-600" />
                    </div>
                    <span className="text-sm text-gray-900">Turnover Rate</span>
                  </div>
                  <span className="text-sm font-bold text-purple-600">8.2%</span>
                </div>
              </div>
            </div>
          </div>

          {/* General Affairs Facilities - Full Width */}
          <div className="col-span-12 bg-white shadow">
            <div className="p-6 bg-[#005357] text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-white">Status Fasilitas & General Affairs</h3>
                  <p className="text-sm text-gray-100 mt-1">Kondisi dan biaya maintenance fasilitas</p>
                </div>
                <div className="w-8 h-8 bg-white flex items-center justify-center">
                  <Building className="h-4 w-4 text-[#005357]" />
                </div>
              </div>
            </div>
            <div className="p-4 bg-gray-50">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                {facilitiesData.map((facility, index) => (
                  <div key={index} className="bg-white p-4 border-l-4 border-[#005357]">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900 text-sm">{facility.name}</h4>
                      <span className={`px-2 py-1 text-xs font-medium ${
                        facility.status === 'Excellent' || facility.status === 'Baik' ? 'bg-green-100 text-green-800' :
                        facility.status === 'Perlu Perhatian' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {facility.status}
                      </span>
                    </div>
                    <div className="text-xs text-gray-600 space-y-1">
                      <div>Maintenance: {facility.maintenance}x/bulan</div>
                      <div>Biaya: Rp {(facility.cost/1000).toFixed(0)}k</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Management Tools - Full Width */}
          <div className="col-span-12 bg-white shadow">
            <div className="p-6 bg-[#005357] text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-white">Alat Manajemen</h3>
                  <p className="text-sm text-gray-100 mt-1">Tools untuk HR, GA, dan operasional</p>
                </div>
                <div className="w-8 h-8 bg-white flex items-center justify-center">
                  <BarChart3 className="h-4 w-4 text-[#005357]" />
                </div>
              </div>
            </div>
            <div className="p-4 bg-gray-50">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button className="p-4 text-left bg-white hover:bg-gray-50 transition-colors">
                  <div className="flex items-center space-x-3 mb-2">
                    <Users className="h-5 w-5 text-[#005357]" />
                    <h3 className="font-medium text-gray-900">Manajemen HR</h3>
                  </div>
                  <p className="text-sm text-gray-600">Karyawan, kehadiran, dan performa</p>
                </button>
                <button className="p-4 text-left bg-white hover:bg-gray-50 transition-colors">
                  <div className="flex items-center space-x-3 mb-2">
                    <Building className="h-5 w-5 text-[#005357]" />
                    <h3 className="font-medium text-gray-900">General Affairs</h3>
                  </div>
                  <p className="text-sm text-gray-600">Fasilitas, maintenance, dan operasional</p>
                </button>
                <button className="p-4 text-left bg-white hover:bg-gray-50 transition-colors">
                  <div className="flex items-center space-x-3 mb-2">
                    <BarChart3 className="h-5 w-5 text-[#005357]" />
                    <h3 className="font-medium text-gray-900">Business Intelligence</h3>
                  </div>
                  <p className="text-sm text-gray-600">Analytics menyeluruh dan pelaporan</p>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </OfficeLayout>
  );
}