'use client';

import { useState, useEffect } from 'react';
import OfficeLayout from '@/components/OfficeLayout';
import Link from 'next/link';
import { buildApiUrl } from '@/lib/config';
import {
  Search02Icon,
  UserMultipleIcon,
  SparklesIcon,
  ArrowUp01Icon,
  ArrowDown01Icon,
  EyeIcon,
} from '@/lib/icons';

interface LoyaltyProgram {
  id: number;
  name: string;
  description: string;
  points_per_amount: string;
  points_currency_value: string;
  min_points_redemption: number;
  points_expiry_days: number | null;
  is_active: boolean;
}

interface GuestLoyaltyPoints {
  id: number;
  guest: number;
  guest_name: string;
  guest_email: string;
  current_points: number;
  lifetime_points: number;
  lifetime_redeemed: number;
  tier: string;
  created_at: string;
  updated_at: string;
}

interface LoyaltyTransaction {
  id: number;
  guest: number;
  guest_name: string;
  transaction_type: string;
  points: number;
  description: string;
  created_at: string;
}

export default function LoyaltyProgramPage() {
  const [program, setProgram] = useState<LoyaltyProgram | null>(null);
  const [guestAccounts, setGuestAccounts] = useState<GuestLoyaltyPoints[]>([]);
  const [transactions, setTransactions] = useState<LoyaltyTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'accounts' | 'transactions'>('accounts');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch active program
      const programResponse = await fetch(buildApiUrl('hotel/loyalty-program/active/'), {
        credentials: 'include',
      });
      if (programResponse.ok) {
        const programData = await programResponse.json();
        setProgram(programData);
      }

      // Fetch guest accounts
      const accountsResponse = await fetch(buildApiUrl('hotel/loyalty-points/'), {
        credentials: 'include',
      });
      const accountsData = await accountsResponse.json();
      setGuestAccounts(accountsData.results || accountsData);

      // Fetch recent transactions
      const transactionsResponse = await fetch(buildApiUrl('hotel/loyalty-transactions/?limit=50'), {
        credentials: 'include',
      });
      const transactionsData = await transactionsResponse.json();
      setTransactions(transactionsData.results || transactionsData);
    } catch (error) {
      console.error('Error fetching loyalty data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredAccounts = guestAccounts.filter(account =>
    account.guest_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    account.guest_email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredTransactions = transactions.filter(transaction =>
    transaction.guest_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    transaction.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalAccounts = guestAccounts.length;
  const totalPoints = guestAccounts.reduce((sum, acc) => sum + acc.current_points, 0);
  const totalEarned = guestAccounts.reduce((sum, acc) => sum + acc.lifetime_points, 0);
  const totalRedeemed = guestAccounts.reduce((sum, acc) => sum + acc.lifetime_redeemed, 0);

  const formatCurrency = (amount: string) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(parseFloat(amount));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTransactionTypeLabel = (type: string): string => {
    const typeMap: Record<string, string> = {
      'EARN': 'Earned',
      'REDEEM': 'Redeemed',
      'EXPIRE': 'Expired',
      'ADJUST': 'Adjusted',
      'REFUND': 'Refunded',
    };
    return typeMap[type] || type;
  };

  const getTransactionTypeColor = (type: string): string => {
    switch (type) {
      case 'EARN':
      case 'REFUND':
        return 'bg-green-100 text-green-800';
      case 'REDEEM':
        return 'bg-blue-100 text-blue-800';
      case 'EXPIRE':
        return 'bg-red-100 text-red-800';
      case 'ADJUST':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTierColor = (tier: string): string => {
    switch (tier) {
      case 'BRONZE': return 'bg-orange-100 text-orange-800';
      case 'SILVER': return 'bg-gray-100 text-gray-800';
      case 'GOLD': return 'bg-yellow-100 text-yellow-800';
      case 'PLATINUM': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <OfficeLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Memuat data...</div>
        </div>
      </OfficeLayout>
    );
  }

  return (
    <OfficeLayout>
      <div className="p-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Loyalty Program</h1>
          <p className="text-gray-600 mt-1">Kelola program loyalitas dan poin tamu</p>
        </div>

        {/* Program Info */}
        {program && (
          <div className="bg-white border border-gray-200 p-6 mb-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h2 className="text-xl font-bold text-gray-900">{program.name}</h2>
                <p className="text-gray-600 mt-1">{program.description}</p>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
                  <div>
                    <div className="text-sm text-gray-600">Points per Rp</div>
                    <div className="text-lg font-bold text-gray-900">
                      {program.points_per_amount} poin / {formatCurrency('1000')}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Point Value</div>
                    <div className="text-lg font-bold text-gray-900">
                      {formatCurrency(program.points_currency_value)} / poin
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Min Redemption</div>
                    <div className="text-lg font-bold text-gray-900">
                      {program.min_points_redemption} poin
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Points Expiry</div>
                    <div className="text-lg font-bold text-gray-900">
                      {program.points_expiry_days || 'Never'} hari
                    </div>
                  </div>
                </div>
              </div>
              <span className={`px-3 py-1 text-sm font-medium ${
                program.is_active
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {program.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
        )}

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600">Member Accounts</div>
                <div className="text-3xl font-bold text-gray-900 mt-1">{totalAccounts}</div>
              </div>
              <div className="p-3 bg-blue-100">
                <UserMultipleIcon className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600">Active Points</div>
                <div className="text-3xl font-bold text-green-600 mt-1">
                  {totalPoints.toLocaleString()}
                </div>
              </div>
              <div className="p-3 bg-green-100">
                <SparklesIcon className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600">Total Earned</div>
                <div className="text-3xl font-bold text-blue-600 mt-1">
                  {totalEarned.toLocaleString()}
                </div>
              </div>
              <div className="p-3 bg-blue-100">
                <ArrowUp01Icon className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600">Total Redeemed</div>
                <div className="text-3xl font-bold text-orange-600 mt-1">
                  {totalRedeemed.toLocaleString()}
                </div>
              </div>
              <div className="p-3 bg-orange-100">
                <ArrowDown01Icon className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white border border-gray-200 mb-6">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('accounts')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'accounts'
                  ? 'border-[#4E61D3] text-[#4E61D3]'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Member Accounts ({totalAccounts})
            </button>
            <button
              onClick={() => setActiveTab('transactions')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'transactions'
                  ? 'border-[#4E61D3] text-[#4E61D3]'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Transactions ({transactions.length})
            </button>
          </div>

          {/* Search Bar */}
          <div className="p-4 border-b border-gray-200">
            <div className="relative">
              <Search02Icon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder={activeTab === 'accounts' ? 'Cari member...' : 'Cari transaksi...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 focus:ring-2 focus:ring-[#4E61D3] focus:border-transparent"
              />
            </div>
          </div>

          {/* Content */}
          <div className="overflow-x-auto">
            {activeTab === 'accounts' ? (
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Guest</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tier</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Current Points</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Lifetime Earned</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Lifetime Redeemed</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Member Since</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredAccounts.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                        Tidak ada member ditemukan
                      </td>
                    </tr>
                  ) : (
                    filteredAccounts.map((account) => (
                      <tr key={account.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="font-medium text-gray-900">{account.guest_name}</div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">{account.guest_email}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium ${getTierColor(account.tier)}`}>
                            {account.tier}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-lg font-bold text-green-600">
                            {account.current_points.toLocaleString()}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {account.lifetime_points.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {account.lifetime_redeemed.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {formatDate(account.created_at)}
                        </td>
                        <td className="px-6 py-4">
                          <button
                            className="p-1 hover:bg-gray-200 transition-colors"
                            title="View Details"
                          >
                            <EyeIcon className="h-4 w-4 text-gray-600" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Guest</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Points</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                        Tidak ada transaksi ditemukan
                      </td>
                    </tr>
                  ) : (
                    filteredTransactions.map((transaction) => (
                      <tr key={transaction.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {formatDate(transaction.created_at)}
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-medium text-gray-900">{transaction.guest_name}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium ${getTransactionTypeColor(transaction.transaction_type)}`}>
                            {getTransactionTypeLabel(transaction.transaction_type)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`text-lg font-bold ${
                            transaction.transaction_type === 'EARN' || transaction.transaction_type === 'REFUND'
                              ? 'text-green-600'
                              : 'text-red-600'
                          }`}>
                            {transaction.transaction_type === 'EARN' || transaction.transaction_type === 'REFUND' ? '+' : '-'}
                            {transaction.points.toLocaleString()}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {transaction.description}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </OfficeLayout>
  );
}
