'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import OfficeLayout from '@/components/OfficeLayout';
import { buildApiUrl, getCsrfToken } from '@/lib/config';
import {
  Archive03Icon,
  Search02Icon,
  Add01Icon,
  FilterIcon,
  EyeIcon,
  PencilEdit02Icon,
  CheckmarkCircle02Icon,
  Cancel01Icon,
  PackageIcon,
  Location01Icon,
  UserIcon,
  Calendar01Icon,
  ChevronLeftIcon,
  ChevronRightIcon,
  AlertCircleIcon,
  SparklesIcon
} from '@/lib/icons';

// API interfaces
interface ApiLostFoundItem {
  id: number;
  item_number: string;
  report_type: string;
  item_name: string;
  category: string;
  category_display: string;
  status: string;
  status_display: string;
  location_type: string;
  room_number: string | null;
  guest_name: string | null;
  reported_by_name: string | null;
  reported_date: string;
  is_valuable: boolean;
  days_in_storage: number;
  is_unclaimed_long: boolean;
  created_at: string;
}

interface ApiResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: ApiLostFoundItem[];
  status_counters?: {
    pending: number;
    in_storage: number;
    claimed: number;
    returned_to_guest: number;
    disposed: number;
    found_items: number;
    lost_items: number;
    valuable_items: number;
    unclaimed_long: number;
  };
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  IN_STORAGE: 'bg-blue-100 text-blue-800',
  CLAIMED: 'bg-green-100 text-green-800',
  RETURNED_TO_GUEST: 'bg-purple-100 text-purple-800',
  DISPOSED: 'bg-gray-100 text-gray-800',
};

const CATEGORY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  ELECTRONICS: SparklesIcon,
  JEWELRY: SparklesIcon,
  DOCUMENTS: FilterIcon,
  MONEY: FilterIcon,
  KEYS: FilterIcon,
  default: PackageIcon,
};

export default function LostAndFoundPage() {
  const router = useRouter();
  const [items, setItems] = useState<ApiLostFoundItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [reportTypeFilter, setReportTypeFilter] = useState<string>('all');
  const [showValuableOnly, setShowValuableOnly] = useState(false);
  const [showUnclaimedLongOnly, setShowUnclaimedLongOnly] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [statusCounters, setStatusCounters] = useState<any>(null);

  // Fetch items
  const fetchItems = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', currentPage.toString());

      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (categoryFilter !== 'all') params.append('category', categoryFilter);
      if (reportTypeFilter !== 'all') params.append('report_type', reportTypeFilter);
      if (showValuableOnly) params.append('is_valuable', 'true');

      const response = await fetch(
        buildApiUrl(`hotel/lost-and-found/?${params.toString()}`),
        { credentials: 'include' }
      );

      if (!response.ok) throw new Error('Failed to fetch items');

      const data: ApiResponse = await response.json();

      let results = data.results;

      // Client-side filter for unclaimed long items
      if (showUnclaimedLongOnly) {
        results = results.filter(item => item.is_unclaimed_long);
      }

      setItems(results);
      setTotalCount(data.count);
      setTotalPages(Math.ceil(data.count / 20));
      setStatusCounters(data.status_counters);
    } catch (error) {
      console.error('Error fetching lost and found items:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [currentPage, statusFilter, categoryFilter, reportTypeFilter, showValuableOnly, showUnclaimedLongOnly]);

  // Handle search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (currentPage === 1) {
        fetchItems();
      } else {
        setCurrentPage(1);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getCategoryIcon = (category: string) => {
    const IconComponent = CATEGORY_ICONS[category] || CATEGORY_ICONS.default;
    return IconComponent;
  };

  return (
    <OfficeLayout>
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Archive03Icon className="h-8 w-8 text-blue-600" />
                Lost & Found
              </h1>
              <p className="text-gray-600 mt-1">
                Manage lost and found items reported by housekeeping and guests
              </p>
            </div>
            <button
              onClick={() => router.push('/office/lost-and-found/new')}
              className="flex items-center gap-2 px-4 py-3 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              <Add01Icon className="h-5 w-5" />
              Report Item
            </button>
          </div>

          {/* Status Counters */}
          {statusCounters && (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-6">
              <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
                <div className="text-yellow-600 text-sm font-medium">Pending</div>
                <div className="text-2xl font-bold text-yellow-900">{statusCounters.pending}</div>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded p-4">
                <div className="text-blue-600 text-sm font-medium">In Storage</div>
                <div className="text-2xl font-bold text-blue-900">{statusCounters.in_storage}</div>
              </div>
              <div className="bg-purple-50 border border-purple-200 rounded p-4">
                <div className="text-purple-600 text-sm font-medium">Valuable Items</div>
                <div className="text-2xl font-bold text-purple-900">{statusCounters.valuable_items}</div>
              </div>
              <div className="bg-red-50 border border-red-200 rounded p-4">
                <div className="text-red-600 text-sm font-medium">Unclaimed 30+ days</div>
                <div className="text-2xl font-bold text-red-900">{statusCounters.unclaimed_long}</div>
              </div>
              <div className="bg-green-50 border border-green-200 rounded p-4">
                <div className="text-green-600 text-sm font-medium">Claimed/Returned</div>
                <div className="text-2xl font-bold text-green-900">
                  {statusCounters.claimed + statusCounters.returned_to_guest}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Search and Filters - Outside wrapper */}
        <div className="mb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          {/* Search */}
          <div className="lg:col-span-2">
            <div className="relative">
              <Search02Icon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by item name, number, or room..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-3 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="IN_STORAGE">In Storage</option>
              <option value="CLAIMED">Claimed</option>
              <option value="RETURNED_TO_GUEST">Returned to Guest</option>
              <option value="DISPOSED">Disposed</option>
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-3 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Categories</option>
              <option value="ELECTRONICS">Electronics</option>
              <option value="JEWELRY">Jewelry</option>
              <option value="CLOTHING">Clothing</option>
              <option value="DOCUMENTS">Documents</option>
              <option value="MONEY">Money</option>
              <option value="KEYS">Keys</option>
              <option value="ACCESSORIES">Accessories</option>
              <option value="OTHER">Other</option>
            </select>
          </div>

          {/* Report Type Filter */}
          <div>
            <select
              value={reportTypeFilter}
              onChange={(e) => setReportTypeFilter(e.target.value)}
              className="w-full px-3 py-3 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Types</option>
              <option value="FOUND">Found Items</option>
              <option value="LOST">Lost Reports</option>
            </select>
          </div>

          {/* Toggle Filters */}
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={showValuableOnly}
                onChange={(e) => setShowValuableOnly(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              Valuable Only
            </label>
          </div>
        </div>

        {/* Items List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
            <p className="mt-4 text-gray-600">Loading items...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-12 bg-white rounded border border-gray-200">
            <Archive03Icon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No lost and found items found</p>
          </div>
        ) : (
          <>
            <div className="bg-white border border-gray-300">
              <table className="w-full border-collapse">
                <thead className="bg-[#4E61D3]">
                  <tr>
                    <th className="border border-gray-300 px-6 py-3 text-left text-sm font-bold text-white">
                      Item
                    </th>
                    <th className="border border-gray-300 px-6 py-3 text-left text-sm font-bold text-white">
                      Type/Category
                    </th>
                    <th className="border border-gray-300 px-6 py-3 text-left text-sm font-bold text-white">
                      Location
                    </th>
                    <th className="border border-gray-300 px-6 py-3 text-left text-sm font-bold text-white">
                      Status
                    </th>
                    <th className="border border-gray-300 px-6 py-3 text-left text-sm font-bold text-white">
                      Reported
                    </th>
                    <th className="border border-gray-300 px-6 py-3 text-left text-sm font-bold text-white">
                      Days
                    </th>
                    <th className="border border-gray-300 px-6 py-3 text-right text-sm font-bold text-white">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white">
                  {items.map((item) => {
                    const CategoryIcon = getCategoryIcon(item.category);
                    return (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="border border-gray-300 px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded ${item.is_valuable ? 'bg-purple-100' : 'bg-gray-100'}`}>
                              <CategoryIcon className={`h-5 w-5 ${item.is_valuable ? 'text-purple-600' : 'text-gray-600'}`} />
                            </div>
                            <div>
                              <div className="font-medium text-gray-900 flex items-center gap-2">
                                {item.item_name}
                                {item.is_valuable && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                                    Valuable
                                  </span>
                                )}
                                {item.is_unclaimed_long && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                                    30+ days
                                  </span>
                                )}
                              </div>
                              <div className="text-sm text-gray-500">{item.item_number}</div>
                            </div>
                          </div>
                        </td>
                        <td className="border border-gray-300 px-6 py-4">
                          <div>
                            <div className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                              item.report_type === 'FOUND' ? 'bg-blue-100 text-blue-800' : 'bg-orange-100 text-orange-800'
                            }`}>
                              {item.report_type === 'FOUND' ? 'Found' : 'Lost'}
                            </div>
                            <div className="text-sm text-gray-600 mt-1">{item.category_display}</div>
                          </div>
                        </td>
                        <td className="border border-gray-300 px-6 py-4">
                          <div className="flex items-center gap-2 text-sm">
                            <Location01Icon className="h-4 w-4 text-gray-400" />
                            <span className="text-gray-900">
                              {item.room_number ? `Room ${item.room_number}` : item.location_type}
                            </span>
                          </div>
                          {item.guest_name && (
                            <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                              <UserIcon className="h-4 w-4 text-gray-400" />
                              {item.guest_name}
                            </div>
                          )}
                        </td>
                        <td className="border border-gray-300 px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            STATUS_COLORS[item.status] || 'bg-gray-100 text-gray-800'
                          }`}>
                            {item.status_display}
                          </span>
                        </td>
                        <td className="border border-gray-300 px-6 py-4">
                          <div className="text-sm text-gray-900">{formatDate(item.reported_date)}</div>
                          {item.reported_by_name && (
                            <div className="text-xs text-gray-500">by {item.reported_by_name}</div>
                          )}
                        </td>
                        <td className="border border-gray-300 px-6 py-4">
                          <div className={`text-sm font-medium ${
                            item.days_in_storage > 30 ? 'text-red-600' :
                            item.days_in_storage > 14 ? 'text-orange-600' :
                            'text-gray-900'
                          }`}>
                            {item.days_in_storage} days
                          </div>
                        </td>
                        <td className="border border-gray-300 px-6 py-4 text-right">
                          <button
                            onClick={() => router.push(`/office/lost-and-found/${item.id}`)}
                            className="inline-flex items-center gap-2 px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          >
                            <EyeIcon className="h-4 w-4" />
                            View
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6">
                <div className="text-sm text-gray-600">
                  Showing page {currentPage} of {totalPages} ({totalCount} total items)
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-2 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeftIcon className="h-5 w-5" />
                  </button>
                  <span className="px-4 py-2 text-sm font-medium text-gray-700">
                    {currentPage}
                  </span>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-2 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRightIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </OfficeLayout>
  );
}
