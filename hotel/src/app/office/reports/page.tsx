'use client';

import { useState } from 'react';
import OfficeLayout from '@/components/OfficeLayout';
import { 
  BarChart3, 
  TrendingUp, 
  FileText, 
  Calendar,
  Users,
  BedDouble,
  DollarSign,
  PieChart,
  Download,
  Filter,
  ChevronDown,
  Building2,
  Clock,
  Target,
  Activity,
  Percent,
  Star,
  MapPin,
  Phone,
  Mail
} from 'lucide-react';

export default function ReportsPage() {
  const [selectedPeriod, setSelectedPeriod] = useState('thisMonth');
  const [selectedReportType, setSelectedReportType] = useState('all');

  // Sample reports data
  const reportSummary = {
    totalBookings: 156,
    occupancyRate: 78.5,
    averageRevenue: 85600000,
    guestSatisfaction: 4.7,
    checkIns: 42,
    checkOuts: 38,
    pendingReservations: 23
  };

  const availableReports = [
    {
      id: 'occupancy',
      title: 'Laporan Okupansi',
      description: 'Tingkat okupansi kamar harian, bulanan dan tahunan',
      icon: BedDouble,
      category: 'operations',
      lastGenerated: '2024-08-28',
      status: 'ready'
    },
    {
      id: 'revenue',
      title: 'Laporan Pendapatan',
      description: 'Analisis pendapatan dari kamar, F&B, dan layanan tambahan',
      icon: DollarSign,
      category: 'financial',
      lastGenerated: '2024-08-28',
      status: 'ready'
    },
    {
      id: 'guest-analytics',
      title: 'Analisis Tamu',
      description: 'Demografi tamu, preferensi, dan pola booking',
      icon: Users,
      category: 'guest',
      lastGenerated: '2024-08-27',
      status: 'ready'
    },
    {
      id: 'staff-performance',
      title: 'Performa Karyawan',
      description: 'Evaluasi kinerja dan produktivitas karyawan',
      icon: Target,
      category: 'hr',
      lastGenerated: '2024-08-26',
      status: 'generating'
    },
    {
      id: 'satisfaction',
      title: 'Survei Kepuasan',
      description: 'Rating dan review tamu, analisis feedback',
      icon: Star,
      category: 'guest',
      lastGenerated: '2024-08-25',
      status: 'ready'
    },
    {
      id: 'maintenance',
      title: 'Laporan Maintenance',
      description: 'Status pemeliharaan fasilitas dan equipment',
      icon: Activity,
      category: 'operations',
      lastGenerated: '2024-08-28',
      status: 'ready'
    },
    {
      id: 'inventory',
      title: 'Laporan Inventaris',
      description: 'Stock amenities, supplies, dan kebutuhan operasional',
      icon: Building2,
      category: 'operations',
      lastGenerated: '2024-08-27',
      status: 'ready'
    },
    {
      id: 'tax',
      title: 'Laporan Pajak',
      description: 'Pajak hotel, PPN, dan kewajiban perpajakan',
      icon: FileText,
      category: 'financial',
      lastGenerated: '2024-08-20',
      status: 'outdated'
    }
  ];

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
      month: 'short',
      year: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ready': return 'bg-green-100 text-green-800';
      case 'generating': return 'bg-yellow-100 text-yellow-800';
      case 'outdated': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'ready': return 'Siap';
      case 'generating': return 'Memproses';
      case 'outdated': return 'Perlu Update';
      default: return status;
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'financial': return 'Keuangan';
      case 'operations': return 'Operasional';
      case 'guest': return 'Tamu';
      case 'hr': return 'SDM';
      default: return category;
    }
  };

  const filteredReports = availableReports.filter(report => {
    if (selectedReportType === 'all') return true;
    return report.category === selectedReportType;
  });

  return (
    <OfficeLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Laporan & Analitik</h1>
          <p className="text-gray-600 mt-2">Dashboard laporan komprehensif untuk analisis performa hotel</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white shadow">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Total Booking</h3>
                  <p className="text-sm text-gray-600 mt-1">Bulan ini</p>
                </div>
                <div className="w-8 h-8 bg-[#005357] flex items-center justify-center">
                  <Calendar className="h-4 w-4 text-white" />
                </div>
              </div>
            </div>
            <div className="p-4 bg-gray-50">
              <div className="text-center">
                <div className="text-3xl font-bold text-[#005357]">{reportSummary.totalBookings}</div>
                <div className="text-sm text-gray-600">reservasi</div>
              </div>
            </div>
          </div>

          <div className="bg-white shadow">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Tingkat Okupansi</h3>
                  <p className="text-sm text-gray-600 mt-1">Rata-rata bulan ini</p>
                </div>
                <div className="w-8 h-8 bg-[#005357] flex items-center justify-center">
                  <Percent className="h-4 w-4 text-white" />
                </div>
              </div>
            </div>
            <div className="p-4 bg-gray-50">
              <div className="text-center">
                <div className="text-3xl font-bold text-[#005357]">{reportSummary.occupancyRate}%</div>
                <div className="text-sm text-gray-600">okupansi</div>
              </div>
            </div>
          </div>

          <div className="bg-white shadow">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Rata-rata Pendapatan</h3>
                  <p className="text-sm text-gray-600 mt-1">Per hari</p>
                </div>
                <div className="w-8 h-8 bg-[#005357] flex items-center justify-center">
                  <DollarSign className="h-4 w-4 text-white" />
                </div>
              </div>
            </div>
            <div className="p-4 bg-gray-50">
              <div className="text-center">
                <div className="text-2xl font-bold text-[#005357]">
                  {formatCurrency(reportSummary.averageRevenue)}
                </div>
                <div className="text-sm text-gray-600">per hari</div>
              </div>
            </div>
          </div>

          <div className="bg-white shadow">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Kepuasan Tamu</h3>
                  <p className="text-sm text-gray-600 mt-1">Rating rata-rata</p>
                </div>
                <div className="w-8 h-8 bg-[#005357] flex items-center justify-center">
                  <Star className="h-4 w-4 text-white" />
                </div>
              </div>
            </div>
            <div className="p-4 bg-gray-50">
              <div className="text-center">
                <div className="text-3xl font-bold text-[#005357]">{reportSummary.guestSatisfaction}/5</div>
                <div className="text-sm text-gray-600">bintang</div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Report Section */}
        <div className="bg-white shadow">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Laporan Tersedia</h3>
                <p className="text-sm text-gray-600 mt-1">Generate dan download berbagai jenis laporan analitik</p>
              </div>
              <div className="w-8 h-8 bg-[#005357] flex items-center justify-center">
                <BarChart3 className="h-4 w-4 text-white" />
              </div>
            </div>
          </div>
          
          <div className="p-4 bg-gray-50">
            {/* Filters */}
            <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
              <div className="flex items-center space-x-4">
                <select 
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value)}
                  className="px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#005357]"
                >
                  <option value="thisMonth">Bulan Ini</option>
                  <option value="lastMonth">Bulan Lalu</option>
                  <option value="thisQuarter">Kuartal Ini</option>
                  <option value="thisYear">Tahun Ini</option>
                  <option value="custom">Periode Kustom</option>
                </select>
                <select 
                  value={selectedReportType}
                  onChange={(e) => setSelectedReportType(e.target.value)}
                  className="px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#005357]"
                >
                  <option value="all">Semua Kategori</option>
                  <option value="financial">Keuangan</option>
                  <option value="operations">Operasional</option>
                  <option value="guest">Tamu</option>
                  <option value="hr">SDM</option>
                </select>
              </div>
              <button className="bg-[#005357] text-white px-4 py-2 text-sm font-medium hover:bg-[#004347] transition-colors flex items-center space-x-2">
                <Download className="h-4 w-4" />
                <span>Bulk Export</span>
              </button>
            </div>

            {/* Reports Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredReports.map((report) => (
                <div key={report.id} className="bg-white shadow">
                  <div className="p-6 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">{report.title}</h3>
                        <p className="text-sm text-gray-600 mt-1">{report.description}</p>
                      </div>
                      <div className="w-8 h-8 bg-[#005357] flex items-center justify-center">
                        <report.icon className="h-4 w-4 text-white" />
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-gray-50">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Kategori:</span>
                        <span className="text-sm font-medium bg-gray-100 px-2 py-1 text-gray-800">
                          {getCategoryLabel(report.category)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Update Terakhir:</span>
                        <span className="text-sm text-gray-800">{formatDate(report.lastGenerated)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Status:</span>
                        <span className={`text-xs px-2 py-1 font-medium ${getStatusColor(report.status)}`}>
                          {getStatusLabel(report.status)}
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 flex space-x-2">
                      <button 
                        className="flex-1 bg-[#005357] text-white px-3 py-2 text-sm font-medium hover:bg-[#004347] transition-colors disabled:opacity-50"
                        disabled={report.status === 'generating'}
                      >
                        Generate
                      </button>
                      <button 
                        className="px-3 py-2 text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                        disabled={report.status !== 'ready'}
                      >
                        <Download className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white shadow">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Aksi Cepat</h3>
                <p className="text-sm text-gray-600 mt-1">Shortcut untuk tugas reporting yang sering dilakukan</p>
              </div>
              <div className="w-8 h-8 bg-[#005357] flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-white" />
              </div>
            </div>
          </div>
          
          <div className="p-4 bg-gray-50">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button className="p-4 bg-white hover:bg-gray-50 transition-colors text-left">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 flex items-center justify-center">
                    <Calendar className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">Laporan Harian</h3>
                    <p className="text-sm text-gray-600">Generate laporan operasional hari ini</p>
                  </div>
                </div>
              </button>

              <button className="p-4 bg-white hover:bg-gray-50 transition-colors text-left">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-100 flex items-center justify-center">
                    <PieChart className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">Dashboard Executive</h3>
                    <p className="text-sm text-gray-600">Ringkasan untuk manajemen</p>
                  </div>
                </div>
              </button>

              <button className="p-4 bg-white hover:bg-gray-50 transition-colors text-left">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-purple-100 flex items-center justify-center">
                    <FileText className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">Laporan Custom</h3>
                    <p className="text-sm text-gray-600">Buat laporan dengan parameter khusus</p>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </OfficeLayout>
  );
}