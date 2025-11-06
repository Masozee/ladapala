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

interface InvoicesResponse {
  invoices: Transaction[];
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
  const [invoices, setInvoices] = useState<Transaction[]>([]);

  // Loading and error states
  const [loadingOverview, setLoadingOverview] = useState(true);
  const [loadingTransactions, setLoadingTransactions] = useState(true);
  const [loadingInvoices, setLoadingInvoices] = useState(true);
  const [errorOverview, setErrorOverview] = useState<string | null>(null);
  const [errorTransactions, setErrorTransactions] = useState<string | null>(null);
  const [errorInvoices, setErrorInvoices] = useState<string | null>(null);

  // Fetch financial overview data
  useEffect(() => {
    const fetchOverview = async () => {
      setLoadingOverview(true);
      setErrorOverview(null);

      try {
        const url = buildApiUrl(`hotel/financial/overview/?period=${selectedPeriod}`);
        const response = await fetch(url, {
          credentials: 'include',
        });

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
        const response = await fetch(url, {
          credentials: 'include',
        });

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



  // Fetch invoices data
  useEffect(() => {
    const fetchInvoices = async () => {
      setLoadingInvoices(true);
      setErrorInvoices(null);

      try {
        const params = new URLSearchParams({
          period: selectedPeriod,
          status: selectedPaymentStatus,
        });

        if (searchQuery) {
          params.append('search', searchQuery);
        }

        const url = buildApiUrl(`hotel/financial/invoices/?${params.toString()}`);
        const response = await fetch(url, {
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error('Failed to fetch invoices');
        }

        const data: InvoicesResponse = await response.json();
        setInvoices(data.invoices);
      } catch (error) {
        console.error('Error fetching invoices:', error);
        setErrorInvoices('Gagal memuat data faktur');
      } finally {
        setLoadingInvoices(false);
      }
    };

    fetchInvoices();
  }, [selectedPeriod, selectedPaymentStatus, searchQuery]);

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
                <>
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
                    <div className="p-6 bg-gray-50">
                      <div className="flex flex-col items-center">
                        {/* Pie Chart */}
                        <div className="relative" style={{ width: '240px', height: '240px' }}>
                          <svg viewBox="0 0 100 100" className="transform -rotate-90">
                            {(() => {
                              const colors = ['#4E61D3', '#F87B1B', '#2baf6a', '#e74c3c', '#f39c12', '#9b59b6'];
                              let currentAngle = 0;

                              return expenseData.categories.map((category, index) => {
                                const percentage = category.percentage;
                                const angle = (percentage / 100) * 360;
                                const radius = 40;
                                const centerX = 50;
                                const centerY = 50;

                                // Calculate path for pie slice
                                const startAngle = currentAngle;
                                const endAngle = currentAngle + angle;

                                const startX = centerX + radius * Math.cos((startAngle * Math.PI) / 180);
                                const startY = centerY + radius * Math.sin((startAngle * Math.PI) / 180);
                                const endX = centerX + radius * Math.cos((endAngle * Math.PI) / 180);
                                const endY = centerY + radius * Math.sin((endAngle * Math.PI) / 180);

                                const largeArc = angle > 180 ? 1 : 0;

                                const pathData = [
                                  `M ${centerX} ${centerY}`,
                                  `L ${startX} ${startY}`,
                                  `A ${radius} ${radius} 0 ${largeArc} 1 ${endX} ${endY}`,
                                  'Z'
                                ].join(' ');

                                currentAngle += angle;

                                return (
                                  <path
                                    key={index}
                                    d={pathData}
                                    fill={colors[index % colors.length]}
                                    stroke="white"
                                    strokeWidth="0.5"
                                  />
                                );
                              });
                            })()}
                          </svg>
                        </div>

                        {/* Legend */}
                        <div className="mt-6 w-full space-y-2">
                          {expenseData.categories.map((category, index) => {
                            const colors = ['#4E61D3', '#F87B1B', '#2baf6a', '#e74c3c', '#f39c12', '#9b59b6'];
                            return (
                              <div key={index} className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-2">
                                  <div
                                    className="w-3 h-3 rounded-sm"
                                    style={{ backgroundColor: colors[index % colors.length] }}
                                  ></div>
                                  <span className="text-gray-700">{category.name}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                  <span className="text-gray-600">{category.percentage}%</span>
                                  <span className="font-medium text-gray-900">{formatCurrency(category.amount)}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
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
                </>
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
            <div className="overflow-visible">
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
                {/* Loading State */}
                {loadingInvoices && (
                  <div className="text-center py-12">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#4E61D3]"></div>
                    <p className="mt-4 text-gray-600">Memuat data faktur...</p>
                  </div>
                )}

                {/* Error State */}
                {errorInvoices && !loadingInvoices && (
                  <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 mb-6">
                    <div className="flex items-center">
                      <AlertCircleIcon className="h-5 w-5 mr-2" />
                      <span>{errorInvoices}</span>
                    </div>
                  </div>
                )}

                {!loadingInvoices && !errorInvoices && (
                <>
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
                          {invoices.filter(inv => inv.status === 'issued').length}
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
                <div className="overflow-visible">
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
                      {invoices.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="border border-gray-200 px-6 py-12 text-center text-gray-500">
                            Tidak ada faktur ditemukan
                          </td>
                        </tr>
                      ) : (
                      invoices.map((invoice) => (
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
                      ))
                      )}
                    </tbody>
                  </table>
                </div>
                </>
                )}
              </div>
            </div>
          )}
      </div>
    </OfficeLayout>
  );
}