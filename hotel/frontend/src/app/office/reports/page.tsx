'use client';

import { useState, useEffect } from 'react';
import OfficeLayout from '@/components/OfficeLayout';
import {
  PieChartIcon,
  ArrowUp01Icon,
  File01Icon,
  Calendar01Icon,
  UserMultipleIcon,
  BedIcon,
  CreditCardIcon,
  ChevronDownIcon,
  FilterIcon,
  Building03Icon,
  Clock01Icon,
  Location01Icon,
  PackageIcon,
  SparklesIcon,
  Call02Icon,
  Mail01Icon
} from '@/lib/icons';

// TypeScript interfaces for API responses
interface ReportSummary {
  totalBookings: number;
  occupancyRate: number;
  averageRevenue: number;
  guestSatisfaction: number;
  checkIns: number;
  checkOuts: number;
  pendingReservations: number;
}

interface AvailableReport {
  id: string;
  title: string;
  description: string;
  category: string;
  lastGenerated: string | null;
  status: string;
}

export default function ReportsPage() {
  const [selectedPeriod, setSelectedPeriod] = useState('thisMonth');
  const [selectedReportType, setSelectedReportType] = useState('all');
  const [reportSummary, setReportSummary] = useState<ReportSummary | null>(null);
  const [availableReports, setAvailableReports] = useState<AvailableReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generatingReports, setGeneratingReports] = useState<Set<string>>(new Set());

  const API_BASE_URL = process.env.NEXT_PUBLIC_HOTEL_API_URL || 'http://localhost:8000/api/hotel';

  // Fetch report summary and available reports
  useEffect(() => {
    const fetchReportsData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Fetch summary
        const summaryResponse = await fetch(
          `${API_BASE_URL}/reports/summary/?period=${selectedPeriod}`,
          {
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );

        if (!summaryResponse.ok) {
          throw new Error('Gagal memuat ringkasan laporan');
        }

        const summaryData = await summaryResponse.json();
        // Map snake_case to camelCase
        setReportSummary({
          totalBookings: summaryData.total_bookings,
          occupancyRate: summaryData.occupancy_rate,
          averageRevenue: summaryData.average_revenue,
          guestSatisfaction: summaryData.guest_satisfaction,
          checkIns: summaryData.check_ins,
          checkOuts: summaryData.check_outs,
          pendingReservations: summaryData.pending_reservations
        });

        // Fetch available reports
        const reportsResponse = await fetch(
          `${API_BASE_URL}/reports/available/`,
          {
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );

        if (!reportsResponse.ok) {
          throw new Error('Gagal memuat daftar laporan');
        }

        const reportsData = await reportsResponse.json();
        setAvailableReports(reportsData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
        console.error('Error fetching reports data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchReportsData();
  }, [selectedPeriod, API_BASE_URL]);

  // Icon mapping for report types
  const getReportIcon = (reportId: string) => {
    switch (reportId) {
      case 'occupancy': return BedIcon;
      case 'revenue': return CreditCardIcon;
      case 'guest-analytics': return UserMultipleIcon;
      case 'staff-performance': return Location01Icon;
      case 'satisfaction': return SparklesIcon;
      case 'maintenance': return PieChartIcon;
      case 'inventory': return Building03Icon;
      case 'tax': return File01Icon;
      default: return File01Icon;
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

  // Handle report generation with format
  const handleGenerateReport = async (reportId: string, format: 'json' | 'pdf' | 'xlsx' = 'pdf') => {
    setGeneratingReports(prev => new Set(prev).add(`${reportId}-${format}`));

    try:
      const response = await fetch(
        `${API_BASE_URL}/reports/${reportId}/?period=${selectedPeriod}&download_format=${format}`,
        {
          credentials: 'include',
        }
      );

      if (!response.ok) {
        throw new Error(`Gagal generate laporan ${reportId}`);
      }

      if (format === 'json') {
        const data = await response.json();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${reportId}-${selectedPeriod}-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        // For PDF and Excel, response is already a blob
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const extension = format === 'pdf' ? 'pdf' : 'xlsx';
        a.download = `${reportId}-${selectedPeriod}-${new Date().toISOString().split('T')[0]}.${extension}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }

      // Update report status
      setAvailableReports(prev =>
        prev.map(report =>
          report.id === reportId
            ? { ...report, lastGenerated: new Date().toISOString().split('T')[0], status: 'ready' }
            : report
        )
      );
    } catch (err) {
      console.error('Error generating report:', err);
      alert(err instanceof Error ? err.message : 'Terjadi kesalahan saat generate laporan');
    } finally {
      setGeneratingReports(prev => {
        const newSet = new Set(prev);
        newSet.delete(`${reportId}-${format}`);
        return newSet;
      });
    }
  };


  // Quick action: Generate daily report
  const handleDailyReport = async () => {
    setGeneratingReports(prev => new Set(prev).add('daily'));
    try {
      const response = await fetch(
        `${API_BASE_URL}/reports/daily/`,
        {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) throw new Error('Gagal generate laporan harian');

      const data = await response.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `daily-report-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Error:', err);
      alert(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally {
      setGeneratingReports(prev => {
        const newSet = new Set(prev);
        newSet.delete('daily');
        return newSet;
      });
    }
  };

  // Quick action: Generate executive dashboard (comprehensive summary)
  const handleExecutiveDashboard = async () => {
    setGeneratingReports(prev => new Set(prev).add('executive'));
    try {
      // Fetch multiple reports in parallel
      const [occupancy, revenue, guestAnalytics, satisfaction] = await Promise.all([
        fetch(`${API_BASE_URL}/reports/occupancy/?period=${selectedPeriod}`, { credentials: 'include' }),
        fetch(`${API_BASE_URL}/reports/revenue/?period=${selectedPeriod}`, { credentials: 'include' }),
        fetch(`${API_BASE_URL}/reports/guest-analytics/?period=${selectedPeriod}`, { credentials: 'include' }),
        fetch(`${API_BASE_URL}/reports/satisfaction/?period=${selectedPeriod}`, { credentials: 'include' })
      ]);

      const executiveData = {
        occupancy: await occupancy.json(),
        revenue: await revenue.json(),
        guestAnalytics: await guestAnalytics.json(),
        satisfaction: await satisfaction.json(),
        generatedAt: new Date().toISOString()
      };

      const blob = new Blob([JSON.stringify(executiveData, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `executive-dashboard-${selectedPeriod}-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Error:', err);
      alert(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally {
      setGeneratingReports(prev => {
        const newSet = new Set(prev);
        newSet.delete('executive');
        return newSet;
      });
    }
  };

  // Loading state
  if (loading) {
    return (
      <OfficeLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Laporan & Analitik</h1>
            <p className="text-gray-600 mt-2">Dashboard laporan komprehensif untuk analisis performa hotel</p>
          </div>
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-[#4E61D3] border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-gray-600 mt-4">Memuat data laporan...</p>
            </div>
          </div>
        </div>
      </OfficeLayout>
    );
  }

  // Error state
  if (error) {
    return (
      <OfficeLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Laporan & Analitik</h1>
            <p className="text-gray-600 mt-2">Dashboard laporan komprehensif untuk analisis performa hotel</p>
          </div>
          <div className="bg-red-50 border border-red-200 p-6 text-center">
            <p className="text-red-800 font-medium">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 bg-red-600 text-white px-4 py-2 text-sm font-medium hover:bg-red-700 transition-colors"
            >
              Muat Ulang
            </button>
          </div>
        </div>
      </OfficeLayout>
    );
  }

  return (
    <OfficeLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Laporan & Analitik</h1>
          <p className="text-gray-600 mt-2">Dashboard laporan komprehensif untuk analisis performa hotel</p>
        </div>

        {/* Summary Cards */}
        {reportSummary && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Total Booking</h3>
                    <p className="text-sm text-gray-600 mt-1">Bulan ini</p>
                  </div>
                  <div className="w-8 h-8 bg-[#4E61D3] flex items-center justify-center">
                    <Calendar01Icon className="h-4 w-4 text-white" />
                  </div>
                </div>
              </div>
              <div className="p-4 bg-gray-50">
                <div className="text-center">
                  <div className="text-3xl font-bold text-[#4E61D3]">{reportSummary.totalBookings}</div>
                  <div className="text-sm text-gray-600">reservasi</div>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Tingkat Okupansi</h3>
                    <p className="text-sm text-gray-600 mt-1">Rata-rata bulan ini</p>
                  </div>
                  <div className="w-8 h-8 bg-[#4E61D3] flex items-center justify-center">
                    <PackageIcon className="h-4 w-4 text-white" />
                  </div>
                </div>
              </div>
              <div className="p-4 bg-gray-50">
                <div className="text-center">
                  <div className="text-3xl font-bold text-[#4E61D3]">{reportSummary.occupancyRate}%</div>
                  <div className="text-sm text-gray-600">okupansi</div>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Rata-rata Pendapatan</h3>
                    <p className="text-sm text-gray-600 mt-1">Per hari</p>
                  </div>
                  <div className="w-8 h-8 bg-[#4E61D3] flex items-center justify-center">
                    <CreditCardIcon className="h-4 w-4 text-white" />
                  </div>
                </div>
              </div>
              <div className="p-4 bg-gray-50">
                <div className="text-center">
                  <div className="text-2xl font-bold text-[#4E61D3]">
                    {formatCurrency(reportSummary.averageRevenue)}
                  </div>
                  <div className="text-sm text-gray-600">per hari</div>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Kepuasan Tamu</h3>
                    <p className="text-sm text-gray-600 mt-1">Rating rata-rata</p>
                  </div>
                  <div className="w-8 h-8 bg-[#4E61D3] flex items-center justify-center">
                    <SparklesIcon className="h-4 w-4 text-white" />
                  </div>
                </div>
              </div>
              <div className="p-4 bg-gray-50">
                <div className="text-center">
                  <div className="text-3xl font-bold text-[#4E61D3]">{reportSummary.guestSatisfaction}/5</div>
                  <div className="text-sm text-gray-600">bintang</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Report Section */}
        <div className="bg-white border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Laporan Tersedia</h3>
                <p className="text-sm text-gray-600 mt-1">Generate dan download berbagai jenis laporan analitik</p>
              </div>
              <div className="w-8 h-8 bg-[#4E61D3] flex items-center justify-center">
                <PieChartIcon className="h-4 w-4 text-white" />
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
                  className="px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#4E61D3]"
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
                  className="px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#4E61D3]"
                >
                  <option value="all">Semua Kategori</option>
                  <option value="financial">Keuangan</option>
                  <option value="operations">Operasional</option>
                  <option value="guest">Tamu</option>
                  <option value="hr">SDM</option>
                </select>
              </div>
              <button className="bg-[#4E61D3] text-white px-4 py-2 text-sm font-medium hover:bg-[#3D4EA8] transition-colors flex items-center space-x-2">
                <ChevronDownIcon className="h-4 w-4" />
                <span>Bulk Export</span>
              </button>
            </div>

            {/* Reports Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredReports.length > 0 ? (
                filteredReports.map((report) => {
                  const ReportIcon = getReportIcon(report.id);
                  return (
                    <div key={report.id} className="bg-white border border-gray-200">
                      <div className="p-6 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-xl font-bold text-gray-900">{report.title}</h3>
                            <p className="text-sm text-gray-600 mt-1">{report.description}</p>
                          </div>
                          <div className="w-8 h-8 bg-[#4E61D3] flex items-center justify-center">
                            <ReportIcon className="h-4 w-4 text-white" />
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
                            <span className="text-sm text-gray-800">
                              {report.lastGenerated ? formatDate(report.lastGenerated) : 'Belum pernah'}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Status:</span>
                            <span className={`text-xs px-2 py-1 font-medium ${getStatusColor(report.status)}`}>
                              {getStatusLabel(report.status)}
                            </span>
                          </div>
                        </div>

                        <div className="mt-4 space-y-2">
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              className="bg-red-600 text-white px-3 py-2 text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-1"
                              disabled={generatingReports.has(`${report.id}-pdf`)}
                              onClick={() => handleGenerateReport(report.id, 'pdf')}
                              title="Download as PDF"
                            >
                              <File01Icon className="h-4 w-4" />
                              <span>{generatingReports.has(`${report.id}-pdf`) ? 'PDF...' : 'PDF'}</span>
                            </button>
                            <button
                              className="bg-green-600 text-white px-3 py-2 text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-1"
                              disabled={generatingReports.has(`${report.id}-xlsx`)}
                              onClick={() => handleGenerateReport(report.id, 'xlsx')}
                              title="Download as Excel"
                            >
                              <File01Icon className="h-4 w-4" />
                              <span>{generatingReports.has(`${report.id}-xlsx`) ? 'Excel...' : 'Excel'}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="col-span-full text-center py-12 text-gray-600">
                  Tidak ada laporan tersedia untuk kategori ini
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Aksi Cepat</h3>
                <p className="text-sm text-gray-600 mt-1">Shortcut untuk tugas reporting yang sering dilakukan</p>
              </div>
              <div className="w-8 h-8 bg-[#4E61D3] flex items-center justify-center">
                <ArrowUp01Icon className="h-4 w-4 text-white" />
              </div>
            </div>
          </div>
          
          <div className="p-4 bg-gray-50">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={handleDailyReport}
                disabled={generatingReports.has('daily')}
                className="p-4 bg-white hover:bg-gray-50 transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 flex items-center justify-center">
                    <Calendar01Icon className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">
                      {generatingReports.has('daily') ? 'Generating...' : 'Laporan Harian'}
                    </h3>
                    <p className="text-sm text-gray-600">Generate laporan operasional hari ini</p>
                  </div>
                </div>
              </button>

              <button
                onClick={handleExecutiveDashboard}
                disabled={generatingReports.has('executive')}
                className="p-4 bg-white hover:bg-gray-50 transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-100 flex items-center justify-center">
                    <PieChartIcon className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">
                      {generatingReports.has('executive') ? 'Generating...' : 'Dashboard Executive'}
                    </h3>
                    <p className="text-sm text-gray-600">Ringkasan untuk manajemen</p>
                  </div>
                </div>
              </button>

              <button className="p-4 bg-white hover:bg-gray-50 transition-colors text-left">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-purple-100 flex items-center justify-center">
                    <File01Icon className="h-5 w-5 text-purple-600" />
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