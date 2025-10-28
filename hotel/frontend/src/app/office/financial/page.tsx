'use client';

import { useState, useEffect } from 'react';
import OfficeLayout from '@/components/OfficeLayout';
import { buildApiUrl } from '@/lib/config';
import {
  CreditCardIcon,
  ArrowUp01Icon,
  File01Icon,
  Add01Icon,
  Search02Icon,
  FilterIcon,
  MoreHorizontalIcon,
  EyeIcon,
  PencilEdit02Icon,
  ChevronDownIcon,
  Calendar01Icon,
  ChevronUpIcon,
  AlertCircleIcon,
  UserCheckIcon,
  Clock01Icon,
  Building03Icon,
  PieChartIcon
} from '@/lib/icons';

// Type definitions
interface RevenueData {
  total: number;
  thisMonth: number;
  lastMonth: number;
  growth: number;
  dailyAverage: number;
}

interface ExpenseCategory {
  name: string;
  amount: number;
  percentage: number;
}

interface ExpenseData {
  total: number;
  categories: ExpenseCategory[];
}

interface ProfitData {
  total: number;
  margin: number;
}

interface Transaction {
  id: string;
  date: string;
  time: string;
  description: string;
  guest: string | null;
  type: 'revenue' | 'expense';
  category: string;
  amount: number;
  paymentMethod: string;
  status: string;
  reference: string;
}

interface FinancialOverview {
  revenue: RevenueData;
  expenses: ExpenseData;
  profit: ProfitData;
}

interface TransactionsResponse {
  transactions: Transaction[];
  count: number;
}

export default function FinancialPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('thisMonth');
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState('all');

  // State for API data
  const [revenueData, setRevenueData] = useState<RevenueData | null>(null);
  const [expenseData, setExpenseData] = useState<ExpenseData | null>(null);
  const [profitData, setProfitData] = useState<ProfitData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  // Loading and error states
  const [loadingOverview, setLoadingOverview] = useState(true);
  const [loadingTransactions, setLoadingTransactions] = useState(true);
  const [errorOverview, setErrorOverview] = useState<string | null>(null);
  const [errorTransactions, setErrorTransactions] = useState<string | null>(null);

  // Fetch financial overview data
  useEffect(() => {
    const fetchOverview = async () => {
      setLoadingOverview(true);
      setErrorOverview(null);

      try {
        const url = buildApiUrl(`hotel/financial/overview/?period=${selectedPeriod}`);
        const response = await fetch(url);

        if (!response.ok) {
          throw new Error('Failed to fetch financial overview');
        }

        const data: FinancialOverview = await response.json();
        setRevenueData(data.revenue);
        setExpenseData(data.expenses);
        setProfitData(data.profit);
      } catch (error) {
        console.error('Error fetching overview:', error);
        setErrorOverview('Gagal memuat data ringkasan keuangan');
      } finally {
        setLoadingOverview(false);
      }
    };

    fetchOverview();
  }, [selectedPeriod]);

  // Fetch transactions data
  useEffect(() => {
    const fetchTransactions = async () => {
      setLoadingTransactions(true);
      setErrorTransactions(null);

      try {
        const params = new URLSearchParams({
          period: selectedPeriod,
          status: selectedPaymentStatus,
        });

        if (searchQuery) {
          params.append('search', searchQuery);
        }

        const url = buildApiUrl(`hotel/financial/transactions/?${params.toString()}`);
        const response = await fetch(url);

        if (!response.ok) {
          throw new Error('Failed to fetch transactions');
        }

        const data: TransactionsResponse = await response.json();
        setTransactions(data.transactions);
      } catch (error) {
        console.error('Error fetching transactions:', error);
        setErrorTransactions('Gagal memuat data transaksi');
      } finally {
        setLoadingTransactions(false);
      }
    };

    fetchTransactions();
  }, [selectedPeriod, selectedPaymentStatus, searchQuery]);

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
      <ArrowUp01Icon className="h-4 w-4 text-green-600" /> :
      <ArrowUp01Icon className="h-4 w-4 text-red-600" />;
  };

  const TabButton = ({ tabId, label, icon: Icon }: { tabId: string; label: string; icon: any }) => (
    <button
      onClick={() => setActiveTab(tabId)}
      className={`flex items-center space-x-2 px-6 py-3 text-sm font-medium transition-colors ${
        activeTab === tabId
          ? 'bg-[#4E61D3] text-white'
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
        <div className="flex space-x-1 bg-gray-50">
          <TabButton tabId="overview" label="Ringkasan" icon={PieChartIcon} />
          <TabButton tabId="transactions" label="Transaksi" icon={File01Icon} />
          <TabButton tabId="invoices" label="Faktur" icon={File01Icon} />
          <TabButton tabId="reports" label="Laporan" icon={ArrowUp01Icon} />
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div>
                {/* Loading State */}
                {loadingOverview && (
                  <div className="text-center py-12">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#4E61D3]"></div>
                    <p className="mt-4 text-gray-600">Memuat data keuangan...</p>
                  </div>
                )}

                {/* Error State */}
                {errorOverview && !loadingOverview && (
                  <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 mb-6">
                    <div className="flex items-center">
                      <AlertCircleIcon className="h-5 w-5 mr-2" />
                      <span>{errorOverview}</span>
                    </div>
                  </div>
                )}

                {/* Summary Cards */}
                {!loadingOverview && !errorOverview && revenueData && expenseData && profitData && (
                <div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  <div className="bg-white border border-gray-200">
                    <div className="p-6 bg-[#4E61D3] text-white">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-xl font-bold text-white">Total Pendapatan</h3>
                          <p className="text-sm text-gray-100 mt-1">Bulan ini</p>
                        </div>
                        <div className="w-8 h-8 bg-white flex items-center justify-center">
                          <CreditCardIcon className="h-4 w-4 text-[#4E61D3]" />
                        </div>
                      </div>
                    </div>
                    <div className="p-4 bg-gray-50">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-[#4E61D3] mb-2">
                          {formatCurrency(revenueData.total)}
                        </div>
                        <div className="text-sm text-gray-600">
                          <div className="flex items-center justify-center space-x-1">
                            <ArrowUp01Icon className="h-3 w-3 text-green-500" />
                            <span className="text-green-600">+{revenueData.growth}% dari bulan lalu</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white border border-gray-200">
                    <div className="p-6 bg-[#4E61D3] text-white">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-xl font-bold text-white">Total Pengeluaran</h3>
                          <p className="text-sm text-gray-100 mt-1">Bulan ini</p>
                        </div>
                        <div className="w-8 h-8 bg-white flex items-center justify-center">
                          <ArrowUp01Icon className="h-4 w-4 text-[#4E61D3]" />
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

                  <div className="bg-white border border-gray-200">
                    <div className="p-6 bg-[#4E61D3] text-white">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-xl font-bold text-white">Laba Bersih</h3>
                          <p className="text-sm text-gray-100 mt-1">Margin keuntungan</p>
                        </div>
                        <div className="w-8 h-8 bg-white flex items-center justify-center">
                          <ArrowUp01Icon className="h-4 w-4 text-[#4E61D3]" />
                        </div>
                      </div>
                    </div>
                    <div className="p-4 bg-gray-50">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-[#4E61D3] mb-2">
                          {formatCurrency(profitData.total)}
                        </div>
                        <div className="text-sm text-gray-600">
                          {profitData.margin.toFixed(1)}% margin
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white border border-gray-200">
                    <div className="p-6 bg-[#4E61D3] text-white">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-xl font-bold text-white">Rata-rata Harian</h3>
                          <p className="text-sm text-gray-100 mt-1">Pendapatan per hari</p>
                        </div>
                        <div className="w-8 h-8 bg-white flex items-center justify-center">
                          <Calendar01Icon className="h-4 w-4 text-[#4E61D3]" />
                        </div>
                      </div>
                    </div>
                    <div className="p-4 bg-gray-50">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-[#4E61D3] mb-2">
                          {formatCurrency(revenueData.dailyAverage)}
                        </div>
                        <div className="text-sm text-gray-600">per hari</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Expense Breakdown */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white border border-gray-200">
                    <div className="p-6 bg-[#4E61D3] text-white">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-xl font-bold text-white">Breakdown Pengeluaran</h3>
                          <p className="text-sm text-gray-100 mt-1">Kategori pengeluaran bulan ini</p>
                        </div>
                        <div className="w-8 h-8 bg-white flex items-center justify-center">
                          <PieChartIcon className="h-4 w-4 text-[#4E61D3]" />
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
                                  className="bg-[#4E61D3] h-2" 
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

                  <div className="bg-white border border-gray-200">
                    <div className="p-6 bg-[#4E61D3] text-white">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-xl font-bold text-white">Aksi Cepat</h3>
                          <p className="text-sm text-gray-100 mt-1">Fitur manajemen keuangan</p>
                        </div>
                        <div className="w-8 h-8 bg-white flex items-center justify-center">
                          <CreditCardIcon className="h-4 w-4 text-[#4E61D3]" />
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
                          <CreditCardIcon className="h-5 w-5 text-gray-400" />
                        </div>
                      </button>
                      <button className="w-full p-3 text-left bg-white hover:bg-gray-50 transition-colors border border-gray-100">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-medium text-gray-900">Buat Faktur</h3>
                            <p className="text-sm text-gray-600 mt-1">Generate faktur untuk reservasi</p>
                          </div>
                          <File01Icon className="h-5 w-5 text-gray-400" />
                        </div>
                      </button>
                      <button className="w-full p-3 text-left bg-white hover:bg-gray-50 transition-colors border border-gray-100">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-medium text-gray-900">Laporan Keuangan</h3>
                            <p className="text-sm text-gray-600 mt-1">Export laporan bulanan/tahunan</p>
                          </div>
                          <ChevronDownIcon className="h-5 w-5 text-gray-400" />
                        </div>
                      </button>
                    </div>
                  </div>
                </div>
                )}
            </div>
          )}

        {/* Transactions Tab */}
        {activeTab === 'transactions' && (
          <div>
            {/* Filters - Right aligned */}
            <div className="flex items-center justify-end mb-6 space-x-3">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search02Icon className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Cari..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#4E61D3] focus:border-[#4E61D3] w-48"
                />
              </div>
              <select
                value={selectedPaymentStatus}
                onChange={(e) => setSelectedPaymentStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#4E61D3]"
              >
                <option value="all">All Status</option>
                <option value="completed">Selesai</option>
                <option value="pending">Pending</option>
                <option value="failed">Gagal</option>
              </select>
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#4E61D3]"
                    >
                      <option value="thisMonth">Bulan Ini</option>
                      <option value="lastMonth">Bulan Lalu</option>
                      <option value="thisYear">Tahun Ini</option>
                      <option value="custom">Periode Kustom</option>
                    </select>
                  </div>
                  <button className="bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors border border-gray-300 flex items-center space-x-2">
                    <ChevronDownIcon className="h-4 w-4" />
                    <span>Export</span>
                  </button>
                </div>

                {/* Loading State */}
                {loadingTransactions && (
                  <div className="text-center py-12">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#4E61D3]"></div>
                    <p className="mt-4 text-gray-600">Memuat data transaksi...</p>
                  </div>
                )}

                {/* Error State */}
                {errorTransactions && !loadingTransactions && (
                  <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 mb-6">
                    <div className="flex items-center">
                      <AlertCircleIcon className="h-5 w-5 mr-2" />
                      <span>{errorTransactions}</span>
                    </div>
                  </div>
                )}

                {/* Transactions Table */}
                {!loadingTransactions && !errorTransactions && (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead className="bg-[#4E61D3]">
                      <tr>
                        <th className="border border-gray-300 text-left py-4 px-6 text-sm font-bold text-white uppercase tracking-wider">
                          Transaksi
                        </th>
                        <th className="border border-gray-300 text-left py-4 px-6 text-sm font-bold text-white uppercase tracking-wider">
                          Tipe & Kategori
                        </th>
                        <th className="border border-gray-300 text-left py-4 px-6 text-sm font-bold text-white uppercase tracking-wider">
                          Jumlah
                        </th>
                        <th className="border border-gray-300 text-left py-4 px-6 text-sm font-bold text-white uppercase tracking-wider">
                          Metode & Status
                        </th>
                        <th className="border border-gray-300 text-left py-4 px-6 text-sm font-bold text-white uppercase tracking-wider">
                          Referensi
                        </th>
                        <th className="border border-gray-300 text-right py-4 px-6 text-sm font-bold text-white uppercase tracking-wider">
                          Aksi
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white">
                      {transactions.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="border border-gray-200 px-6 py-12 text-center text-gray-500">
                            Tidak ada transaksi ditemukan
                          </td>
                        </tr>
                      ) : (
                      transactions.map((transaction) => (
                        <tr key={transaction.id} className="hover:bg-gray-50 transition-colors">
                          <td className="border border-gray-200 px-6 py-4">
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

                          <td className="border border-gray-200 px-6 py-4">
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

                          <td className="border border-gray-200 px-6 py-4">
                            <div className={`font-bold text-lg ${getTypeColor(transaction.type)}`}>
                              {transaction.type === 'revenue' ? '+' : '-'}{formatCurrency(transaction.amount)}
                            </div>
                          </td>

                          <td className="border border-gray-200 px-6 py-4">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{transaction.paymentMethod}</div>
                              <span className={`inline-flex px-2 py-1 text-xs font-medium ${getStatusColor(transaction.status)}`}>
                                {getStatusLabel(transaction.status)}
                              </span>
                            </div>
                          </td>

                          <td className="border border-gray-200 px-6 py-4">
                            <div className="text-sm">
                              <div className="font-mono text-gray-900">{transaction.id}</div>
                              {transaction.reference && (
                                <div className="text-gray-600">{transaction.reference}</div>
                              )}
                            </div>
                          </td>

                          <td className="border border-gray-200 px-6 py-4">
                            <div className="flex items-center justify-end space-x-2">
                              <button 
                                className="p-2 text-gray-400 hover:text-[#4E61D3] hover:bg-gray-100 transition-colors rounded"
                                title="Lihat Detail"
                              >
                                <EyeIcon className="h-4 w-4" />
                              </button>
                              <button
                                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors rounded"
                                title="Download Receipt"
                              >
                                <ChevronDownIcon className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                      )}
                    </tbody>
                  </table>
                </div>
                )}
              </div>
            </div>
          )}

          {/* Invoices Tab */}
          {activeTab === 'invoices' && (
            <div>
              <div className="p-6 bg-[#4E61D3] text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-white">Manajemen Faktur</h3>
                    <p className="text-sm text-gray-100 mt-1">Kelola faktur dan tagihan tamu</p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <button className="bg-white text-[#4E61D3] px-4 py-2 text-sm font-medium hover:bg-gray-100 transition-colors flex items-center space-x-2">
                      <Add01Icon className="h-4 w-4" />
                      <span>Buat Faktur</span>
                    </button>
                    <div className="w-8 h-8 bg-white flex items-center justify-center">
                      <File01Icon className="h-4 w-4 text-[#4E61D3]" />
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="p-6 bg-gray-50">
                {/* Invoice Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <div className="bg-white p-6 border border-gray-200">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-green-100 flex items-center justify-center">
                        <UserCheckIcon className="h-6 w-6 text-green-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Faktur Lunas</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {invoices.filter(inv => inv.status === 'paid').length}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-6 border border-gray-200">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-yellow-100 flex items-center justify-center">
                        <Clock01Icon className="h-6 w-6 text-yellow-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Menunggu Pembayaran</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {invoices.filter(inv => inv.status === 'pending').length}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-6 border border-gray-200">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-red-100 flex items-center justify-center">
                        <AlertCircleIcon className="h-6 w-6 text-red-600" />
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
                  <table className="w-full border-collapse">
                    <thead className="bg-[#4E61D3]">
                      <tr>
                        <th className="border border-gray-300 text-left py-4 px-6 text-sm font-bold text-white uppercase tracking-wider">
                          Faktur
                        </th>
                        <th className="border border-gray-300 text-left py-4 px-6 text-sm font-bold text-white uppercase tracking-wider">
                          Tamu & Reservasi
                        </th>
                        <th className="border border-gray-300 text-left py-4 px-6 text-sm font-bold text-white uppercase tracking-wider">
                          Jumlah
                        </th>
                        <th className="border border-gray-300 text-left py-4 px-6 text-sm font-bold text-white uppercase tracking-wider">
                          Status & Jatuh Tempo
                        </th>
                        <th className="border border-gray-300 text-right py-4 px-6 text-sm font-bold text-white uppercase tracking-wider">
                          Aksi
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white">
                      {invoices.map((invoice) => (
                        <tr key={invoice.id} className="hover:bg-gray-50 transition-colors">
                          <td className="border border-gray-200 px-6 py-4">
                            <div>
                              <div className="font-semibold text-gray-900">{invoice.id}</div>
                              <div className="text-sm text-gray-600">
                                {formatDate(invoice.date)}
                              </div>
                            </div>
                          </td>

                          <td className="border border-gray-200 px-6 py-4">
                            <div>
                              <div className="font-medium text-gray-900">{invoice.guest}</div>
                              <div className="text-sm text-gray-600">{invoice.reservation}</div>
                            </div>
                          </td>

                          <td className="border border-gray-200 px-6 py-4">
                            <div className="font-bold text-lg text-gray-900">
                              {formatCurrency(invoice.amount)}
                            </div>
                          </td>

                          <td className="border border-gray-200 px-6 py-4">
                            <div>
                              <span className={`inline-flex px-2 py-1 text-xs font-medium ${getStatusColor(invoice.status)}`}>
                                {getStatusLabel(invoice.status)}
                              </span>
                              <div className="text-sm text-gray-600 mt-1">
                                Jatuh tempo: {formatDate(invoice.dueDate)}
                              </div>
                            </div>
                          </td>

                          <td className="border border-gray-200 px-6 py-4">
                            <div className="flex items-center justify-end space-x-2">
                              <button 
                                className="p-2 text-gray-400 hover:text-[#4E61D3] hover:bg-gray-100 transition-colors rounded"
                                title="Lihat Faktur"
                              >
                                <EyeIcon className="h-4 w-4" />
                              </button>
                              <button 
                                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors rounded"
                                title="Edit Faktur"
                              >
                                <PencilEdit02Icon className="h-4 w-4" />
                              </button>
                              <button 
                                className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 transition-colors rounded"
                                title="Download PDF"
                              >
                                <ChevronDownIcon className="h-4 w-4" />
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
              <div className="p-6 bg-[#4E61D3] text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-white">Laporan Keuangan</h3>
                    <p className="text-sm text-gray-100 mt-1">Generate dan export laporan keuangan</p>
                  </div>
                  <div className="w-8 h-8 bg-white flex items-center justify-center">
                    <ArrowUp01Icon className="h-4 w-4 text-[#4E61D3]" />
                  </div>
                </div>
              </div>
              
              <div className="p-6 bg-gray-50">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Revenue Report */}
                  <div className="bg-white border border-gray-200">
                    <div className="p-6 ">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-bold text-gray-900">Laporan Pendapatan</h3>
                          <p className="text-sm text-gray-600 mt-1">Analisis pendapatan harian, bulanan, tahunan</p>
                        </div>
                        <div className="w-8 h-8 bg-[#4E61D3] flex items-center justify-center">
                          <ArrowUp01Icon className="h-4 w-4 text-white" />
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
                  <div className="bg-white border border-gray-200">
                    <div className="p-6 ">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-bold text-gray-900">Laporan Pengeluaran</h3>
                          <p className="text-sm text-gray-600 mt-1">Tracking dan analisis pengeluaran</p>
                        </div>
                        <div className="w-8 h-8 bg-[#4E61D3] flex items-center justify-center">
                          <ArrowUp01Icon className="h-4 w-4 text-white" />
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
                  <div className="bg-white border border-gray-200">
                    <div className="p-6 ">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-bold text-gray-900">Laporan Pajak</h3>
                          <p className="text-sm text-gray-600 mt-1">Laporan siap untuk perpajakan</p>
                        </div>
                        <div className="w-8 h-8 bg-[#4E61D3] flex items-center justify-center">
                          <File01Icon className="h-4 w-4 text-white" />
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