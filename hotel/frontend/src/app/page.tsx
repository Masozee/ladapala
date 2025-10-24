'use client';

import AppLayout from '@/components/AppLayout';
import {
  HotelIcon,
  ArrowUp01Icon,
  UserMultipleIcon,
  Calendar01Icon,
  Call02Icon,
  AlertCircleIcon,
  News01Icon,
  ChevronRightIcon,
  PieChartIcon,
  Loading03Icon
} from '@/lib/icons';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from 'date-fns';
import { useDashboardData } from '@/hooks/useDashboardData';

export default function Home() {
  // Fetch real dashboard data from API
  const { data, loading, error, refetch } = useDashboardData();

  // Fallback emergency contacts (static data)
  const emergencyContacts = [
    { label: 'Security', number: '+62 812-3456-7890' },
    { label: 'Maintenance', number: '+62 812-3456-7891' },
    { label: 'Management', number: '+62 812-3456-7892' },
    { label: 'Medical', number: '+62 812-3456-7893' }
  ];

  // Transform demographic data for pie chart
  const demographicData = data?.visitor_demographics.data.map((item, index) => ({
    name: item.nationality,
    value: item.percentage,
    color: ['#005357', '#2baf6a', '#60a5fa', '#a1a1aa', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'][index % 8]
  })) || [];

  // Transform weekly comparison data for bar chart
  const occupationData = data?.weekly_comparison.current_week.data.map((current, index) => {
    const previous = data?.weekly_comparison.previous_month_week.data[index];
    return {
      day: current.day.substring(0, 3), // Mon, Tue, etc.
      currentMonth: current.occupied_rooms,
      previousMonth: previous?.occupied_rooms || 0,
      difference: current.occupied_rooms - (previous?.occupied_rooms || 0)
    };
  }) || [];

  // Calendar helper functions
  const currentDate = new Date();
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const today = new Date();

  return (
    <AppLayout>
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Kapulaga Hotel Management</h1>
              <p className="text-gray-600 mt-2">Welcome to your hotel management dashboard</p>
              {data?.last_updated && (
                <p className="text-sm text-gray-500 mt-1">
                  Last updated: {new Date(data.last_updated).toLocaleString('id-ID')}
                </p>
              )}
            </div>
            <div className="flex items-center space-x-4">
              {error && (
                <div className="text-red-600 text-sm">
                  Error loading data
                </div>
              )}
              <button
                onClick={refetch}
                disabled={loading}
                className="flex items-center space-x-2 px-4 py-2 text-[#005357] hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
              >
                <Loading03Icon className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>
          </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white border border-gray-200">
            <div className="p-6 bg-[#005357] text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-white">Total Rooms</h3>
                  <p className="text-sm text-gray-100 mt-1">Available hotel capacity</p>
                </div>
                <div className="w-8 h-8 bg-white flex items-center justify-center">
                  <HotelIcon className="h-4 w-4 text-[#005357]" />
                </div>
              </div>
            </div>
            <div className="p-4 bg-gray-50">
              <div className="text-center">
                <div className="text-3xl font-bold text-[#005357] mb-2">
                  {loading ? '...' : data?.basic_metrics.total_rooms || 0}
                </div>
                <div className="text-sm text-gray-600">total rooms</div>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200">
            <div className="p-6 bg-[#005357] text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-white">Occupancy Rate</h3>
                  <p className="text-sm text-gray-100 mt-1">Current room utilization</p>
                </div>
                <div className="w-8 h-8 bg-white flex items-center justify-center">
                  <ArrowUp01Icon className="h-4 w-4 text-[#005357]" />
                </div>
              </div>
            </div>
            <div className="p-4 bg-gray-50">
              <div className="text-center">
                <div className="text-3xl font-bold text-[#005357] mb-2">
                  {loading ? '...' : `${data?.basic_metrics.occupancy_rate || 0}%`}
                </div>
                <div className="text-sm text-gray-600">occupancy rate</div>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200">
            <div className="p-6 bg-[#005357] text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-white">Active Guests</h3>
                  <p className="text-sm text-gray-100 mt-1">Currently checked in</p>
                </div>
                <div className="w-8 h-8 bg-white flex items-center justify-center">
                  <UserMultipleIcon className="h-4 w-4 text-[#005357]" />
                </div>
              </div>
            </div>
            <div className="p-4 bg-gray-50">
              <div className="text-center">
                <div className="text-3xl font-bold text-[#005357] mb-2">
                  {loading ? '...' : data?.basic_metrics.active_guests || 0}
                </div>
                <div className="text-sm text-gray-600">active guests</div>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200">
            <div className="p-6 bg-[#005357] text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-white">Today's Check-ins</h3>
                  <p className="text-sm text-gray-100 mt-1">Scheduled arrivals</p>
                </div>
                <div className="w-8 h-8 bg-white flex items-center justify-center">
                  <Calendar01Icon className="h-4 w-4 text-[#005357]" />
                </div>
              </div>
            </div>
            <div className="p-4 bg-gray-50">
              <div className="text-center">
                <div className="text-3xl font-bold text-[#005357] mb-2">
                  {loading ? '...' : data?.basic_metrics.todays_checkins || 0}
                </div>
                <div className="text-sm text-gray-600">check-ins today</div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200">
          <div className="p-6 bg-[#005357] text-white">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-white">Quick Actions</h3>
                <p className="text-sm text-gray-100 mt-1">Common hotel management tasks</p>
              </div>
            </div>
          </div>
          <div className="p-4 bg-gray-50">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button className="p-4 text-left bg-white hover:bg-gray-50 transition-colors rounded">
                <h3 className="font-medium text-gray-900">New Reservation</h3>
                <p className="text-sm text-gray-600 mt-1">Create a new booking for a guest</p>
              </button>
              <button className="p-4 text-left bg-white hover:bg-gray-50 transition-colors rounded">
                <h3 className="font-medium text-gray-900">Check-in Guest</h3>
                <p className="text-sm text-gray-600 mt-1">Process guest check-in</p>
              </button>
              <button className="p-4 text-left bg-white hover:bg-gray-50 transition-colors rounded">
                <h3 className="font-medium text-gray-900">Room Status</h3>
                <p className="text-sm text-gray-600 mt-1">Update room availability</p>
              </button>
            </div>
          </div>
        </div>


        {/* Bento Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6">
          {/* Demographic Visitor Chart - 1/3 width */}
          <div className="bg-white border border-gray-200 md:col-span-1 lg:col-span-2">
            <div className="p-6 bg-[#005357] text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-white">Visitor Demographics</h3>
                  <p className="text-sm text-gray-100 mt-1">Guest type distribution</p>
                </div>
                <div className="w-8 h-8 bg-white flex items-center justify-center">
                  <PieChartIcon className="h-4 w-4 text-[#005357]" />
                </div>
              </div>
            </div>
            <div className="p-4 bg-gray-50">
              <div className="h-48 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={demographicData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {demographicData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 space-y-2">
                {demographicData.map((item, index) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3" style={{ backgroundColor: item.color }}></div>
                      <span className="text-gray-700">{item.name}</span>
                    </div>
                    <span className="text-gray-900 font-medium">{item.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Daily Occupation Chart - 2/3 width */}
          <div className="bg-white border border-gray-200 md:col-span-2 lg:col-span-4">
            <div className="p-6 bg-[#005357] text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-white">Daily Occupation Comparison</h3>
                  <p className="text-sm text-gray-100 mt-1">Current vs Previous Month Performance</p>
                </div>
                <div className="w-8 h-8 bg-white flex items-center justify-center">
                  <ArrowUp01Icon className="h-4 w-4 text-[#005357]" />
                </div>
              </div>
            </div>
            <div className="bg-gray-50">
              <div className="p-4">
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={occupationData} barCategoryGap="20%">
                      <XAxis 
                        dataKey="day" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fontSize: 10, fill: '#6B7280' }}
                        interval={2}
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fontSize: 10, fill: '#6B7280' }}
                        domain={[130, 165]}
                      />
                      <Bar 
                        dataKey="previousMonth" 
                        fill="#2baf6a" 
                        radius={[2, 2, 0, 0]}
                        name="Previous Month"
                      />
                      <Bar 
                        dataKey="currentMonth" 
                        fill="#005357" 
                        radius={[2, 2, 0, 0]}
                        name="Current Month"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex items-center justify-center mt-2">
                  <div className="flex items-center space-x-6 text-xs">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-[#005357]"></div>
                      <span className="text-gray-600">Current Month</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-[#2baf6a]"></div>
                      <span className="text-gray-600">Previous Month</span>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      <span className="text-red-600 text-xs font-medium">
                        Avg: -7.8 rooms/day
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* News Card - 1/3 width */}
          <div className="bg-white border border-gray-200 md:col-span-1 lg:col-span-2">
            <div className="p-6 bg-[#005357] text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-white">Latest News</h3>
                  <p className="text-sm text-gray-100 mt-1">Hotel updates and announcements</p>
                </div>
                <div className="w-8 h-8 bg-white flex items-center justify-center">
                  <News01Icon className="h-4 w-4 text-[#005357]" />
                </div>
              </div>
            </div>
            <div className="p-4 bg-gray-50 space-y-3">
              {loading ? (
                <div className="text-center text-gray-500 py-4">Loading news...</div>
              ) : data?.latest_news.length ? (
                data.latest_news.map((news) => (
                  <div key={news.id} className="bg-white p-3 mb-2 last:mb-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 text-sm">{news.title}</h4>
                        <p className="text-xs text-gray-600 mt-1">{news.description}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {news.date} - {news.time} ({news.location})
                        </p>
                      </div>
                      <ChevronRightIcon className="h-4 w-4 text-gray-400" />
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-gray-500 py-4">No recent news</div>
              )}
            </div>
          </div>

          {/* Calendar Card - 1/3 width */}
          <div className="bg-white border border-gray-200 md:col-span-1 lg:col-span-2">
            <div className="p-6 bg-[#005357] text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-white">Calendar</h3>
                  <p className="text-sm text-gray-100 mt-1">{format(currentDate, 'MMMM yyyy')}</p>
                </div>
                <div className="w-8 h-8 bg-white flex items-center justify-center">
                  <Calendar01Icon className="h-4 w-4 text-[#005357]" />
                </div>
              </div>
            </div>
            <div className="p-4 bg-gray-50">
              <div className="space-y-3">
                <div className="grid grid-cols-7 gap-1 text-xs text-gray-500">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="text-center py-1 font-medium">{day}</div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {Array.from({ length: monthStart.getDay() }).map((_, index) => (
                    <div key={index} className="h-7"></div>
                  ))}
                  {daysInMonth.map(day => (
                    <div
                      key={day.toISOString()}
                      className={`h-7 flex items-center justify-center text-xs cursor-pointer hover:bg-white ${
                        isSameDay(day, today)
                          ? 'bg-[#005357] text-white font-medium'
                          : 'text-gray-700 hover:bg-white'
                      }`}
                    >
                      {format(day, 'd')}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Emergency Contact Card - 1/3 width */}
          <div className="bg-white border border-gray-200 md:col-span-1 lg:col-span-2">
            <div className="p-6 bg-[#005357] text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-white">Emergency Contacts</h3>
                  <p className="text-sm text-gray-100 mt-1">Quick access to essential services</p>
                </div>
                <div className="w-8 h-8 bg-white flex items-center justify-center">
                  <Call02Icon className="h-4 w-4 text-[#005357]" />
                </div>
              </div>
            </div>
            <div className="p-4 bg-gray-50 space-y-2">
              {emergencyContacts.map((contact, index) => (
                <div key={index} className="bg-white p-3 flex items-center justify-between hover:bg-gray-50 transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 bg-red-100 flex items-center justify-center">
                      <AlertCircleIcon className="h-3 w-3 text-red-600" />
                    </div>
                    <span className="font-medium text-gray-900 text-sm">{contact.label}</span>
                  </div>
                  <a href={`tel:${contact.number}`} className="text-sm text-[#005357] hover:underline">
                    {contact.number}
                  </a>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
    </AppLayout>
  );
}
