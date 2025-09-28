'use client';

import { useState } from 'react';
import OfficeLayout from '@/components/OfficeLayout';
import { 
  DollarSign, 
  CreditCard, 
  TrendingUp, 
  FileText, 
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  Edit,
  Download,
  Calendar,
  ChevronDown,
  ChevronUp,
  ArrowUpRight,
  ArrowDownRight,
  AlertCircle,
  CheckCircle,
  Clock,
  Building2,
  Receipt,
  Wallet,
  PieChart
} from 'lucide-react';

export default function FinancialPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('thisMonth');
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState('all');

  // Sample financial data
  const revenueData = {
    total: 2450680000, // IDR
    thisMonth: 2450680000,
    lastMonth: 2180500000,
    growth: 12.4,
    dailyAverage: 81689333
  };

  const expenseData = {
    total: 1654320000, // IDR
    categories: [
      { name: 'Gaji Karyawan', amount: 750000000, percentage: 45.3 },
      { name: 'Utilitas', amount: 320000000, percentage: 19.3 },
      { name: 'Maintenance', amount: 184320000, percentage: 11.1 },
      { name: 'Marketing', amount: 165000000, percentage: 10.0 },
      { name: 'Supplies', amount: 135000000, percentage: 8.2 },
      { name: 'Lainnya', amount: 100000000, percentage: 6.1 }
    ]
  };

  const transactions = [
    {
      id: 'TRX001',
      date: '2024-08-28',
      time: '14:30',
      description: 'Room Payment - Suite 501',
      guest: 'Liu Wei',
      type: 'revenue',
      category: 'Kamar',
      amount: 4500000,
      paymentMethod: 'Credit Card',
      status: 'completed',
      reference: 'RSV005'
    },
    {
      id: 'TRX002',
      date: '2024-08-28',
      time: '13:15',
      description: 'F&B Service - Restaurant',
      guest: 'Maria Santos',
      type: 'revenue',
      category: 'F&B',
      amount: 850000,
      paymentMethod: 'Cash',
      status: 'completed',
      reference: 'FB-2024-0828-001'
    },
    {
      id: 'TRX003',
      date: '2024-08-28',
      time: '10:00',
      description: 'Electricity Bill - August',
      guest: null,
      type: 'expense',
      category: 'Utilitas',
      amount: 15500000,
      paymentMethod: 'Bank Transfer',
      status: 'completed',
      reference: 'UTIL-2024-08'
    },
    {
      id: 'TRX004',
      date: '2024-08-28',
      time: '09:45',
      description: 'Room Payment - Deluxe 201',
      guest: 'Ahmed Hassan',
      type: 'revenue',
      category: 'Kamar',
      amount: 2400000,
      paymentMethod: 'Bank Transfer',
      status: 'pending',
      reference: 'RSV003'
    },
    {
      id: 'TRX005',
      date: '2024-08-27',
      time: '16:20',
      description: 'Staff Salary - July',
      guest: null,
      type: 'expense',
      category: 'Gaji',
      amount: 125000000,
      paymentMethod: 'Bank Transfer',
      status: 'completed',
      reference: 'PAYROLL-2024-07'
    },
    {
      id: 'TRX006',
      date: '2024-08-27',
      time: '14:10',
      description: 'Laundry Service',
      guest: 'Emma Wilson',
      type: 'revenue',
      category: 'Layanan',
      amount: 150000,
      paymentMethod: 'Credit Card',
      status: 'completed',
      reference: 'SRV-2024-0827-003'
    }
  ];

  const invoices = [
    {
      id: 'INV-2024-001',
      date: '2024-08-28',
      guest: 'Liu Wei',
      reservation: 'RSV005',
      amount: 13500000,
      status: 'paid',
      dueDate: '2024-08-30',
      items: [
        { description: 'Presidential Suite - 3 nights', quantity: 3, rate: 4500000, total: 13500000 }
      ]
    },
    {
      id: 'INV-2024-002',
      date: '2024-08-27',
      guest: 'Ahmed Hassan',
      reservation: 'RSV003',
      amount: 12000000,
      status: 'pending',
      dueDate: '2024-08-31',
      items: [
        { description: 'Junior Suite - 4 nights', quantity: 4, rate: 3000000, total: 12000000 }
      ]
    },
    {
      id: 'INV-2024-003',
      date: '2024-08-26',
      guest: 'Emma Wilson',
      reservation: 'RSV006',
      amount: 9600000,
      status: 'overdue',
      dueDate: '2024-08-28',
      items: [
        { description: 'Standard Room - 4 nights', quantity: 4, rate: 2400000, total: 9600000 }
      ]
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
      case 'completed':
      case 'paid': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'overdue':
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed': return 'Selesai';
      case 'pending': return 'Pending';
      case 'failed': return 'Gagal';
      case 'paid': return 'Lunas';
      case 'overdue': return 'Terlambat';
      default: return status;
    }
  };

  const getTypeColor = (type: string) => {
    return type === 'revenue' ? 'text-green-600' : 'text-red-600';
  };

  const getTypeIcon = (type: string) => {
    return type === 'revenue' ? 
      <ArrowUpRight className="h-4 w-4 text-green-600" /> : 
      <ArrowDownRight className="h-4 w-4 text-red-600" />;
  };

  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = transaction.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (transaction.guest && transaction.guest.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = selectedPaymentStatus === 'all' || transaction.status === selectedPaymentStatus;
    return matchesSearch && matchesStatus;
  });

  const TabButton = ({ tabId, label, icon: Icon }: { tabId: string; label: string; icon: any }) => (
    <button
      onClick={() => setActiveTab(tabId)}
      className={`flex items-center space-x-2 px-6 py-3 text-sm font-medium transition-colors ${
        activeTab === tabId
          ? 'bg-[#005357] text-white'
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
      }`}
    >
      <Icon className="h-4 w-4" />
      <span>{label}</span>
    </button>
  );

  return (
    <OfficeLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Manajemen Keuangan</h1>
          <p className="text-gray-600 mt-2">Pengelolaan pendapatan, pengeluaran, dan pelaporan keuangan hotel</p>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white shadow">
          <div className="flex space-x-1 p-1 bg-gray-50">
            <TabButton tabId="overview" label="Ringkasan" icon={PieChart} />
            <TabButton tabId="transactions" label="Transaksi" icon={Receipt} />
            <TabButton tabId="invoices" label="Faktur" icon={FileText} />
            <TabButton tabId="reports" label="Laporan" icon={TrendingUp} />
          </div>

          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div>
              <div className="p-6 bg-[#005357] text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-white">Ringkasan Keuangan</h3>
                    <p className="text-sm text-gray-100 mt-1">Gambaran umum performa keuangan bulan ini</p>
                  </div>
                  <div className="w-8 h-8 bg-white flex items-center justify-center">
                    <PieChart className="h-4 w-4 text-[#005357]" />
                  </div>
                </div>
              </div>
              
              <div className="p-6 bg-gray-50">
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  <div className="bg-white shadow">
                    <div className="p-6 bg-[#005357] text-white">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-xl font-bold text-white">Total Pendapatan</h3>
                          <p className="text-sm text-gray-100 mt-1">Bulan ini</p>
                        </div>
                        <div className="w-8 h-8 bg-white flex items-center justify-center">
                          <DollarSign className="h-4 w-4 text-[#005357]" />
                        </div>
                      </div>
                    </div>
                    <div className="p-4 bg-gray-50">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-[#005357] mb-2">
                          {formatCurrency(revenueData.total)}
                        </div>
                        <div className="text-sm text-gray-600">
                          <div className="flex items-center justify-center space-x-1">
                            <ArrowUpRight className="h-3 w-3 text-green-500" />
                            <span className="text-green-600">+{revenueData.growth}% dari bulan lalu</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white shadow">
                    <div className="p-6 bg-[#005357] text-white">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-xl font-bold text-white">Total Pengeluaran</h3>
                          <p className="text-sm text-gray-100 mt-1">Bulan ini</p>
                        </div>
                        <div className="w-8 h-8 bg-white flex items-center justify-center">
                          <ArrowDownRight className="h-4 w-4 text-[#005357]" />
                        </div>
                      </div>
                    </div>
                    <div className="p-4 bg-gray-50">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-red-600 mb-2">
                          {formatCurrency(expenseData.total)}
                        </div>
                        <div className="text-sm text-gray-600">pengeluaran operasional</div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white shadow">
                    <div className="p-6 bg-[#005357] text-white">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-xl font-bold text-white">Laba Bersih</h3>
                          <p className="text-sm text-gray-100 mt-1">Margin keuntungan</p>
                        </div>
                        <div className="w-8 h-8 bg-white flex items-center justify-center">
                          <TrendingUp className="h-4 w-4 text-[#005357]" />
                        </div>
                      </div>
                    </div>
                    <div className="p-4 bg-gray-50">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-[#005357] mb-2">
                          {formatCurrency(revenueData.total - expenseData.total)}
                        </div>
                        <div className="text-sm text-gray-600">
                          {((revenueData.total - expenseData.total) / revenueData.total * 100).toFixed(1)}% margin
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white shadow">
                    <div className="p-6 bg-[#005357] text-white">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-xl font-bold text-white">Rata-rata Harian</h3>
                          <p className="text-sm text-gray-100 mt-1">Pendapatan per hari</p>
                        </div>
                        <div className="w-8 h-8 bg-white flex items-center justify-center">
                          <Calendar className="h-4 w-4 text-[#005357]" />
                        </div>
                      </div>
                    </div>
                    <div className="p-4 bg-gray-50">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-[#005357] mb-2">
                          {formatCurrency(revenueData.dailyAverage)}
                        </div>
                        <div className="text-sm text-gray-600">per hari</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Expense Breakdown */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white shadow">
                    <div className="p-6 bg-[#005357] text-white">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-xl font-bold text-white">Breakdown Pengeluaran</h3>
                          <p className="text-sm text-gray-100 mt-1">Kategori pengeluaran bulan ini</p>
                        </div>
                        <div className="w-8 h-8 bg-white flex items-center justify-center">
                          <PieChart className="h-4 w-4 text-[#005357]" />
                        </div>
                      </div>
                    </div>
                    <div className="p-4 bg-gray-50">
                      <div className="space-y-4">
                        {expenseData.categories.map((category, index) => (
                          <div key={index} className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-sm font-medium text-gray-900">{category.name}</span>
                                <span className="text-sm text-gray-600">{category.percentage}%</span>
                              </div>
                              <div className="w-full bg-gray-200 h-2">
                                <div 
                                  className="bg-[#005357] h-2" 
                                  style={{ width: `${category.percentage}%` }}
                                ></div>
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                {formatCurrency(category.amount)}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="bg-white shadow">
                    <div className="p-6 bg-[#005357] text-white">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-xl font-bold text-white">Aksi Cepat</h3>
                          <p className="text-sm text-gray-100 mt-1">Fitur manajemen keuangan</p>
                        </div>
                        <div className="w-8 h-8 bg-white flex items-center justify-center">
                          <Wallet className="h-4 w-4 text-[#005357]" />
                        </div>
                      </div>
                    </div>
                    <div className="p-4 bg-gray-50 space-y-3">
                      <button className="w-full p-3 text-left bg-white hover:bg-gray-50 transition-colors border border-gray-100">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-medium text-gray-900">Proses Pembayaran</h3>
                            <p className="text-sm text-gray-600 mt-1">Kelola pembayaran tamu dan tagihan</p>
                          </div>
                          <CreditCard className="h-5 w-5 text-gray-400" />
                        </div>
                      </button>
                      <button className="w-full p-3 text-left bg-white hover:bg-gray-50 transition-colors border border-gray-100">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-medium text-gray-900">Buat Faktur</h3>
                            <p className="text-sm text-gray-600 mt-1">Generate faktur untuk reservasi</p>
                          </div>
                          <FileText className="h-5 w-5 text-gray-400" />
                        </div>
                      </button>
                      <button className="w-full p-3 text-left bg-white hover:bg-gray-50 transition-colors border border-gray-100">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-medium text-gray-900">Laporan Keuangan</h3>
                            <p className="text-sm text-gray-600 mt-1">Export laporan bulanan/tahunan</p>
                          </div>
                          <Download className="h-5 w-5 text-gray-400" />
                        </div>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Transactions Tab */}
          {activeTab === 'transactions' && (
            <div>
              <div className="p-6 bg-[#005357] text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-white">Riwayat Transaksi</h3>
                    <p className="text-sm text-gray-100 mt-1">Semua transaksi pendapatan dan pengeluaran</p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <button className="bg-white text-[#005357] px-4 py-2 text-sm font-medium hover:bg-gray-100 transition-colors flex items-center space-x-2">
                      <Plus className="h-4 w-4" />
                      <span>Tambah Transaksi</span>
                    </button>
                    <div className="w-8 h-8 bg-white flex items-center justify-center">
                      <Receipt className="h-4 w-4 text-[#005357]" />
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="p-6 bg-gray-50">
                {/* Filters */}
                <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-4 w-4 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        placeholder="Cari transaksi..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 pr-4 py-2 border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#005357] focus:border-[#005357] w-64"
                      />
                    </div>
                    <select 
                      value={selectedPaymentStatus}
                      onChange={(e) => setSelectedPaymentStatus(e.target.value)}
                      className="px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#005357]"
                    >
                      <option value="all">Semua Status</option>
                      <option value="completed">Selesai</option>
                      <option value="pending">Pending</option>
                      <option value="failed">Gagal</option>
                    </select>
                    <select 
                      value={selectedPeriod}
                      onChange={(e) => setSelectedPeriod(e.target.value)}
                      className="px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#005357]"
                    >
                      <option value="thisMonth">Bulan Ini</option>
                      <option value="lastMonth">Bulan Lalu</option>
                      <option value="thisYear">Tahun Ini</option>
                      <option value="custom">Periode Kustom</option>
                    </select>
                  </div>
                  <button className="bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors border border-gray-300 flex items-center space-x-2">
                    <Download className="h-4 w-4" />
                    <span>Export</span>
                  </button>
                </div>

                {/* Transactions Table */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-[#005357]">
                      <tr>
                        <th className="text-left py-4 px-6 text-sm font-bold text-white uppercase tracking-wider">
                          Transaksi
                        </th>
                        <th className="text-left py-4 px-6 text-sm font-bold text-white uppercase tracking-wider">
                          Tipe & Kategori
                        </th>
                        <th className="text-left py-4 px-6 text-sm font-bold text-white uppercase tracking-wider">
                          Jumlah
                        </th>
                        <th className="text-left py-4 px-6 text-sm font-bold text-white uppercase tracking-wider">
                          Metode & Status
                        </th>
                        <th className="text-left py-4 px-6 text-sm font-bold text-white uppercase tracking-wider">
                          Referensi
                        </th>
                        <th className="text-right py-4 px-6 text-sm font-bold text-white uppercase tracking-wider">
                          Aksi
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                      {filteredTransactions.map((transaction) => (
                        <tr key={transaction.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4">
                            <div>
                              <div className="font-semibold text-gray-900">{transaction.description}</div>
                              <div className="text-sm text-gray-600">
                                {formatDate(transaction.date)} • {transaction.time}
                              </div>
                              {transaction.guest && (
                                <div className="text-sm text-gray-500">Tamu: {transaction.guest}</div>
                              )}
                            </div>
                          </td>

                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-2">
                              {getTypeIcon(transaction.type)}
                              <div>
                                <div className={`font-medium ${getTypeColor(transaction.type)}`}>
                                  {transaction.type === 'revenue' ? 'Pendapatan' : 'Pengeluaran'}
                                </div>
                                <div className="text-sm text-gray-600">{transaction.category}</div>
                              </div>
                            </div>
                          </td>

                          <td className="px-6 py-4">
                            <div className={`font-bold text-lg ${getTypeColor(transaction.type)}`}>
                              {transaction.type === 'revenue' ? '+' : '-'}{formatCurrency(transaction.amount)}
                            </div>
                          </td>

                          <td className="px-6 py-4">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{transaction.paymentMethod}</div>
                              <span className={`inline-flex px-2 py-1 text-xs font-medium ${getStatusColor(transaction.status)}`}>
                                {getStatusLabel(transaction.status)}
                              </span>
                            </div>
                          </td>

                          <td className="px-6 py-4">
                            <div className="text-sm">
                              <div className="font-mono text-gray-900">{transaction.id}</div>
                              {transaction.reference && (
                                <div className="text-gray-600">{transaction.reference}</div>
                              )}
                            </div>
                          </td>

                          <td className="px-6 py-4">
                            <div className="flex items-center justify-end space-x-2">
                              <button 
                                className="p-2 text-gray-400 hover:text-[#005357] hover:bg-gray-100 transition-colors rounded"
                                title="Lihat Detail"
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                              <button 
                                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors rounded"
                                title="Download Receipt"
                              >
                                <Download className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Invoices Tab */}
          {activeTab === 'invoices' && (
            <div>
              <div className="p-6 bg-[#005357] text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-white">Manajemen Faktur</h3>
                    <p className="text-sm text-gray-100 mt-1">Kelola faktur dan tagihan tamu</p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <button className="bg-white text-[#005357] px-4 py-2 text-sm font-medium hover:bg-gray-100 transition-colors flex items-center space-x-2">
                      <Plus className="h-4 w-4" />
                      <span>Buat Faktur</span>
                    </button>
                    <div className="w-8 h-8 bg-white flex items-center justify-center">
                      <FileText className="h-4 w-4 text-[#005357]" />
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="p-6 bg-gray-50">
                {/* Invoice Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <div className="bg-white p-6 shadow">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-green-100 flex items-center justify-center">
                        <CheckCircle className="h-6 w-6 text-green-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Faktur Lunas</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {invoices.filter(inv => inv.status === 'paid').length}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-6 shadow">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-yellow-100 flex items-center justify-center">
                        <Clock className="h-6 w-6 text-yellow-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Menunggu Pembayaran</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {invoices.filter(inv => inv.status === 'pending').length}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-6 shadow">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-red-100 flex items-center justify-center">
                        <AlertCircle className="h-6 w-6 text-red-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Terlambat</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {invoices.filter(inv => inv.status === 'overdue').length}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Invoices Table */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-[#005357]">
                      <tr>
                        <th className="text-left py-4 px-6 text-sm font-bold text-white uppercase tracking-wider">
                          Faktur
                        </th>
                        <th className="text-left py-4 px-6 text-sm font-bold text-white uppercase tracking-wider">
                          Tamu & Reservasi
                        </th>
                        <th className="text-left py-4 px-6 text-sm font-bold text-white uppercase tracking-wider">
                          Jumlah
                        </th>
                        <th className="text-left py-4 px-6 text-sm font-bold text-white uppercase tracking-wider">
                          Status & Jatuh Tempo
                        </th>
                        <th className="text-right py-4 px-6 text-sm font-bold text-white uppercase tracking-wider">
                          Aksi
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                      {invoices.map((invoice) => (
                        <tr key={invoice.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4">
                            <div>
                              <div className="font-semibold text-gray-900">{invoice.id}</div>
                              <div className="text-sm text-gray-600">
                                {formatDate(invoice.date)}
                              </div>
                            </div>
                          </td>

                          <td className="px-6 py-4">
                            <div>
                              <div className="font-medium text-gray-900">{invoice.guest}</div>
                              <div className="text-sm text-gray-600">{invoice.reservation}</div>
                            </div>
                          </td>

                          <td className="px-6 py-4">
                            <div className="font-bold text-lg text-gray-900">
                              {formatCurrency(invoice.amount)}
                            </div>
                          </td>

                          <td className="px-6 py-4">
                            <div>
                              <span className={`inline-flex px-2 py-1 text-xs font-medium ${getStatusColor(invoice.status)}`}>
                                {getStatusLabel(invoice.status)}
                              </span>
                              <div className="text-sm text-gray-600 mt-1">
                                Jatuh tempo: {formatDate(invoice.dueDate)}
                              </div>
                            </div>
                          </td>

                          <td className="px-6 py-4">
                            <div className="flex items-center justify-end space-x-2">
                              <button 
                                className="p-2 text-gray-400 hover:text-[#005357] hover:bg-gray-100 transition-colors rounded"
                                title="Lihat Faktur"
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                              <button 
                                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors rounded"
                                title="Edit Faktur"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button 
                                className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 transition-colors rounded"
                                title="Download PDF"
                              >
                                <Download className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Reports Tab */}
          {activeTab === 'reports' && (
            <div>
              <div className="p-6 bg-[#005357] text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-white">Laporan Keuangan</h3>
                    <p className="text-sm text-gray-100 mt-1">Generate dan export laporan keuangan</p>
                  </div>
                  <div className="w-8 h-8 bg-white flex items-center justify-center">
                    <TrendingUp className="h-4 w-4 text-[#005357]" />
                  </div>
                </div>
              </div>
              
              <div className="p-6 bg-gray-50">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Revenue Report */}
                  <div className="bg-white shadow">
                    <div className="p-6 border-b border-gray-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-bold text-gray-900">Laporan Pendapatan</h3>
                          <p className="text-sm text-gray-600 mt-1">Analisis pendapatan harian, bulanan, tahunan</p>
                        </div>
                        <div className="w-8 h-8 bg-[#005357] flex items-center justify-center">
                          <TrendingUp className="h-4 w-4 text-white" />
                        </div>
                      </div>
                    </div>
                    <div className="p-4 bg-gray-50">
                      <div className="space-y-3">
                        <button className="w-full p-3 text-left bg-white hover:bg-gray-100 transition-colors border">
                          <div className="font-medium text-gray-900">Pendapatan Harian</div>
                          <div className="text-sm text-gray-600 mt-1">Laporan pendapatan per hari</div>
                        </button>
                        <button className="w-full p-3 text-left bg-white hover:bg-gray-100 transition-colors border">
                          <div className="font-medium text-gray-900">Pendapatan Bulanan</div>
                          <div className="text-sm text-gray-600 mt-1">Ringkasan pendapatan bulanan</div>
                        </button>
                        <button className="w-full p-3 text-left bg-white hover:bg-gray-100 transition-colors border">
                          <div className="font-medium text-gray-900">Pendapatan Tahunan</div>
                          <div className="text-sm text-gray-600 mt-1">Analisis tren tahunan</div>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Expense Report */}
                  <div className="bg-white shadow">
                    <div className="p-6 border-b border-gray-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-bold text-gray-900">Laporan Pengeluaran</h3>
                          <p className="text-sm text-gray-600 mt-1">Tracking dan analisis pengeluaran</p>
                        </div>
                        <div className="w-8 h-8 bg-[#005357] flex items-center justify-center">
                          <ArrowDownRight className="h-4 w-4 text-white" />
                        </div>
                      </div>
                    </div>
                    <div className="p-4 bg-gray-50">
                      <div className="space-y-3">
                        <button className="w-full p-3 text-left bg-white hover:bg-gray-100 transition-colors border">
                          <div className="font-medium text-gray-900">Pengeluaran per Kategori</div>
                          <div className="text-sm text-gray-600 mt-1">Breakdown pengeluaran operasional</div>
                        </button>
                        <button className="w-full p-3 text-left bg-white hover:bg-gray-100 transition-colors border">
                          <div className="font-medium text-gray-900">Tren Pengeluaran</div>
                          <div className="text-sm text-gray-600 mt-1">Analisis tren pengeluaran</div>
                        </button>
                        <button className="w-full p-3 text-left bg-white hover:bg-gray-100 transition-colors border">
                          <div className="font-medium text-gray-900">Budget vs Aktual</div>
                          <div className="text-sm text-gray-600 mt-1">Perbandingan budget dengan realisasi</div>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Tax Report */}
                  <div className="bg-white shadow">
                    <div className="p-6 border-b border-gray-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-bold text-gray-900">Laporan Pajak</h3>
                          <p className="text-sm text-gray-600 mt-1">Laporan siap untuk perpajakan</p>
                        </div>
                        <div className="w-8 h-8 bg-[#005357] flex items-center justify-center">
                          <FileText className="h-4 w-4 text-white" />
                        </div>
                      </div>
                    </div>
                    <div className="p-4 bg-gray-50">
                      <div className="space-y-3">
                        <button className="w-full p-3 text-left bg-white hover:bg-gray-100 transition-colors border">
                          <div className="font-medium text-gray-900">PPh 21</div>
                          <div className="text-sm text-gray-600 mt-1">Laporan pajak penghasilan karyawan</div>
                        </button>
                        <button className="w-full p-3 text-left bg-white hover:bg-gray-100 transition-colors border">
                          <div className="font-medium text-gray-900">PPN</div>
                          <div className="text-sm text-gray-600 mt-1">Laporan pajak pertambahan nilai</div>
                        </button>
                        <button className="w-full p-3 text-left bg-white hover:bg-gray-100 transition-colors border">
                          <div className="font-medium text-gray-900">Laporan SPT</div>
                          <div className="text-sm text-gray-600 mt-1">Surat pemberitahuan tahunan</div>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </OfficeLayout>
  );
}