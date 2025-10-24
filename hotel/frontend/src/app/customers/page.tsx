'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AppLayout from '@/components/AppLayout';
import { buildApiUrl } from '@/lib/config';
import {
  Search02Icon,
  Add01Icon,
  UserIcon,
  Mail01Icon,
  Call02Icon,
  Location01Icon,
  Calendar01Icon,
  SparklesIcon,
  PencilEdit02Icon,
  MoreHorizontalIcon
} from '@/lib/icons';

interface Guest {
  id: number;
  first_name: string;
  last_name: string;
  full_name: string;
  email: string;
  phone: string;
  nationality?: string;
  date_of_birth?: string;
  gender?: string;
  address?: string;
  is_vip?: boolean;
  loyalty_points?: number;
  created_at: string;
  preferences?: any;
}

export default function CustomersPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const loadCustomers = async (page = 1, search = '') => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        ...(search && { search: search })
      });

      const response = await fetch(buildApiUrl(`guests/?${params}`));
      if (response.ok) {
        const data = await response.json();
        
        if (data.results) {
          setCustomers(data.results);
          setTotalPages(Math.ceil(data.count / 20));
          setTotalCount(data.count);
        } else {
          setCustomers(data);
          setTotalCount(data.length);
        }
        setCurrentPage(page);
      }
    } catch (error) {
      console.error('Error loading customers:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers(1);
  }, []);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      loadCustomers(1, searchQuery);
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
            <p className="text-gray-600">Manage your hotel guests and customer database</p>
          </div>
          <button
            onClick={() => router.push('/reservations/new')}
            className="flex items-center space-x-2 bg-[#005357] text-white px-4 py-2 rounded-lg hover:bg-[#004147] transition-colors"
          >
            <Add01Icon className="h-4 w-4" />
            <span>New Reservation</span>
          </button>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center space-x-4">
            <div className="flex-1 relative">
              <Search02Icon className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search customers by name, email, phone, or nationality..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#005357] focus:border-transparent"
              />
            </div>
            <div className="text-sm text-gray-500">
              {totalCount} customer{totalCount !== 1 ? 's' : ''}
            </div>
          </div>
        </div>

        {/* Customer List */}
        <div className="bg-white rounded-lg border border-gray-200">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#005357] mx-auto"></div>
              <p className="mt-2 text-gray-500">Loading customers...</p>
            </div>
          ) : customers.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <UserIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No customers found</p>
              {searchQuery && <p className="text-sm">Try adjusting your search criteria</p>}
            </div>
          ) : (
            <div className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Customer
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Contact
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Location
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Member Since
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {customers.map((customer) => (
                      <tr
                        key={customer.id}
                        className="hover:bg-gray-50 cursor-pointer"
                        onClick={() => router.push(`/customers/${customer.id}`)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center ${
                              customer.is_vip ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'
                            }`}>
                              {customer.is_vip ? (
                                <SparklesIcon className="h-5 w-5" />
                              ) : (
                                <UserIcon className="h-5 w-5" />
                              )}
                            </div>
                            <div className="ml-4">
                              <div className="flex items-center">
                                <div className="text-sm font-medium text-gray-900">
                                  {customer.full_name}
                                </div>
                                {customer.is_vip && (
                                  <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                    VIP
                                  </span>
                                )}
                              </div>
                              <div className="text-sm text-gray-500">
                                ID: {customer.id}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="space-y-1">
                            <div className="flex items-center text-sm text-gray-900">
                              <Mail01Icon className="h-3 w-3 mr-2 text-gray-400" />
                              {customer.email}
                            </div>
                            <div className="flex items-center text-sm text-gray-500">
                              <Call02Icon className="h-3 w-3 mr-2 text-gray-400" />
                              {customer.phone}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {customer.nationality || 'Not specified'}
                          </div>
                          {customer.address && (
                            <div className="text-sm text-gray-500 flex items-start">
                              <Location01Icon className="h-3 w-3 mr-1 text-gray-400 mt-0.5 flex-shrink-0" />
                              <span className="truncate max-w-xs">{customer.address}</span>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center text-sm text-gray-500">
                            <Calendar01Icon className="h-3 w-3 mr-2 text-gray-400" />
                            {formatDate(customer.created_at)}
                          </div>
                          {customer.date_of_birth && (
                            <div className="text-xs text-gray-400">
                              Born: {formatDate(customer.date_of_birth)}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Active
                          </span>
                          {customer.loyalty_points && customer.loyalty_points > 0 && (
                            <div className="text-xs text-gray-500 mt-1">
                              {customer.loyalty_points} points
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/reservations/new?customer=${customer.id}`);
                              }}
                              className="text-[#005357] hover:text-[#004147] flex items-center"
                            >
                              <Add01Icon className="h-4 w-4 mr-1" />
                              Book
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                // Handle edit customer
                              }}
                              className="text-gray-400 hover:text-gray-500"
                            >
                              <PencilEdit02Icon className="h-4 w-4" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                // Handle more actions
                              }}
                              className="text-gray-400 hover:text-gray-500"
                            >
                              <MoreHorizontalIcon className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                  <div className="flex-1 flex justify-between sm:hidden">
                    <button
                      onClick={() => loadCustomers(Math.max(1, currentPage - 1), searchQuery)}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => loadCustomers(Math.min(totalPages, currentPage + 1), searchQuery)}
                      disabled={currentPage === totalPages}
                      className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                  <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-gray-700">
                        Showing <span className="font-medium">{((currentPage - 1) * 20) + 1}</span> to{' '}
                        <span className="font-medium">
                          {Math.min(currentPage * 20, totalCount)}
                        </span> of{' '}
                        <span className="font-medium">{totalCount}</span> results
                      </p>
                    </div>
                    <div>
                      <nav className="relative z-0 inline-flex rounded-md border border-gray-200 -space-x-px" aria-label="Pagination">
                        <button
                          onClick={() => loadCustomers(Math.max(1, currentPage - 1), searchQuery)}
                          disabled={currentPage === 1}
                          className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Previous
                        </button>
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          const page = i + 1;
                          return (
                            <button
                              key={page}
                              onClick={() => loadCustomers(page, searchQuery)}
                              className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                page === currentPage
                                  ? 'z-10 bg-[#005357] border-[#005357] text-white'
                                  : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                              }`}
                            >
                              {page}
                            </button>
                          );
                        })}
                        <button
                          onClick={() => loadCustomers(Math.min(totalPages, currentPage + 1), searchQuery)}
                          disabled={currentPage === totalPages}
                          className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Next
                        </button>
                      </nav>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}