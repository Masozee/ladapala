'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AppLayout from '@/components/AppLayout';
import { Archive03Icon, Add01Icon, Search02Icon } from '@/lib/icons';

interface LostFoundItem {
  id: number;
  item_number: string;
  report_type: string;
  item_name: string;
  category: string;
  status: string;
  location_type: string;
  room_number?: string;
  guest_name?: string;
  reported_date?: string;
  description?: string;
  is_valuable: boolean;
}

interface StatusCounts {
  pending: number;
  in_storage: number;
  claimed: number;
  returned_to_guest: number;
  disposed: number;
  total: number;
}

const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  IN_STORAGE: 'bg-blue-100 text-blue-800',
  CLAIMED: 'bg-green-100 text-green-800',
  RETURNED_TO_GUEST: 'bg-purple-100 text-purple-800',
  DISPOSED: 'bg-gray-100 text-gray-800',
};

const statusLabels: Record<string, string> = {
  PENDING: 'Pending',
  IN_STORAGE: 'In Storage',
  CLAIMED: 'Claimed',
  RETURNED_TO_GUEST: 'Returned to Guest',
  DISPOSED: 'Disposed',
};

export default function FrontlineLostAndFoundPage() {
  const router = useRouter();
  const [items, setItems] = useState<LostFoundItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<LostFoundItem[]>([]);
  const [counts, setCounts] = useState<StatusCounts>({
    pending: 0,
    in_storage: 0,
    claimed: 0,
    returned_to_guest: 0,
    disposed: 0,
    total: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [reportTypeFilter, setReportTypeFilter] = useState('');

  useEffect(() => {
    fetchItems();
  }, []);

  useEffect(() => {
    filterItems();
  }, [items, searchTerm, statusFilter, reportTypeFilter]);

  const fetchItems = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/hotel/lost-and-found/', {
        credentials: 'include',
      });
      const data = await response.json();
      setItems(data.results || []);
      if (data.counts) {
        setCounts(data.counts);
      }
    } catch (error) {
      console.error('Error fetching lost and found items:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterItems = () => {
    let filtered = [...items];

    if (searchTerm) {
      filtered = filtered.filter(
        (item) =>
          item.item_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.item_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter) {
      filtered = filtered.filter((item) => item.status === statusFilter);
    }

    if (reportTypeFilter) {
      filtered = filtered.filter((item) => item.report_type === reportTypeFilter);
    }

    setFilteredItems(filtered);
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Lost & Found</h1>
            <p className="text-sm text-gray-600 mt-1">Manage lost and found items reported by guests and staff</p>
          </div>
          <Link
            href="/frontline/lost-and-found/new"
            className="flex items-center space-x-2 px-4 py-2 bg-[#005357] text-white rounded hover:bg-[#004044] transition-colors"
          >
            <Add01Icon className="h-4 w-4" />
            <span>Report Lost Item</span>
          </Link>
        </div>

        {/* Status Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 border border-gray-200">
            <div className="text-2xl font-bold text-gray-900">{counts.total}</div>
            <div className="text-sm text-gray-600">Total Items</div>
          </div>
          <div className="bg-white p-4 border border-gray-200">
            <div className="text-2xl font-bold text-yellow-600">{counts.pending}</div>
            <div className="text-sm text-gray-600">Pending</div>
          </div>
          <div className="bg-white p-4 border border-gray-200">
            <div className="text-2xl font-bold text-blue-600">{counts.in_storage}</div>
            <div className="text-sm text-gray-600">In Storage</div>
          </div>
          <div className="bg-white p-4 border border-gray-200">
            <div className="text-2xl font-bold text-green-600">{counts.claimed}</div>
            <div className="text-sm text-gray-600">Claimed</div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#F87B1B]"
          >
            <option value="">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="IN_STORAGE">In Storage</option>
            <option value="CLAIMED">Claimed</option>
            <option value="RETURNED_TO_GUEST">Returned to Guest</option>
            <option value="DISPOSED">Disposed</option>
          </select>
          <select
            value={reportTypeFilter}
            onChange={(e) => setReportTypeFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#F87B1B]"
          >
            <option value="">All Types</option>
            <option value="FOUND">Found Items</option>
            <option value="LOST">Lost Reports</option>
          </select>
          <div className="ml-auto relative w-64">
            <Search02Icon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#F87B1B]"
            />
          </div>
        </div>

        {/* Table */}
        <div className="bg-white border border-gray-300">
          <table className="w-full border-collapse">
            <thead className="bg-[#005357]">
              <tr>
                <th className="border border-gray-300 px-6 py-3 text-left text-sm font-bold text-white">
                  Item
                </th>
                <th className="border border-gray-300 px-6 py-3 text-left text-sm font-bold text-white">
                  Type
                </th>
                <th className="border border-gray-300 px-6 py-3 text-left text-sm font-bold text-white">
                  Category
                </th>
                <th className="border border-gray-300 px-6 py-3 text-left text-sm font-bold text-white">
                  Location
                </th>
                <th className="border border-gray-300 px-6 py-3 text-left text-sm font-bold text-white">
                  Guest
                </th>
                <th className="border border-gray-300 px-6 py-3 text-left text-sm font-bold text-white">
                  Date
                </th>
                <th className="border border-gray-300 px-6 py-3 text-left text-sm font-bold text-white">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="border border-gray-300 px-6 py-8 text-center text-gray-500">
                    No items found
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="border border-gray-300 px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <div>
                          <div className="font-medium text-gray-900">{item.item_name}</div>
                          <div className="text-sm text-gray-500">{item.item_number}</div>
                          {item.is_valuable && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 mt-1">
                              Valuable
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="border border-gray-300 px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium ${
                        item.report_type === 'FOUND' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
                      }`}>
                        {item.report_type === 'FOUND' ? 'Found' : 'Lost'}
                      </span>
                    </td>
                    <td className="border border-gray-300 px-6 py-4 text-sm text-gray-900">
                      {item.category?.replace('_', ' ') || '-'}
                    </td>
                    <td className="border border-gray-300 px-6 py-4 text-sm text-gray-900">
                      {item.location_type?.replace('_', ' ') || '-'}
                      {item.room_number && ` - ${item.room_number}`}
                    </td>
                    <td className="border border-gray-300 px-6 py-4 text-sm text-gray-900">
                      {item.guest_name || '-'}
                    </td>
                    <td className="border border-gray-300 px-6 py-4 text-sm text-gray-900">
                      {item.reported_date || '-'}
                    </td>
                    <td className="border border-gray-300 px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium ${
                        statusColors[item.status]
                      }`}>
                        {statusLabels[item.status]}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Results count */}
        <div className="text-sm text-gray-600">
          Showing {filteredItems.length} of {items.length} items
        </div>
      </div>
    </AppLayout>
  );
}
